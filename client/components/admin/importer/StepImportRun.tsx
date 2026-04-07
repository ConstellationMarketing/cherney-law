import { useCallback, useEffect, useRef, useState } from 'react'
import type { WizardState } from '@site/lib/importer/recipeTypes'
import { supabase } from '@/lib/supabase'
import { updateSessionStatus } from '@site/lib/importer/sessionPersistence'

interface Props {
  state: WizardState
  updateState: (u: Partial<WizardState>) => void
  onBack: () => void
}

interface RecordStatus {
  rowIndex: number
  status: 'pending' | 'importing' | 'success' | 'failed'
  error?: string
  entityId?: string
}

interface ImportResult {
  rowIndex: number
  status: string
  error?: string
  entityId?: string
}

interface ApprovedRecord {
  rowIndex: number
  slug: string
  preparedData: Record<string, unknown>
  mappedData?: Record<string, unknown>
  sourceData: Record<string, string>
}

const BATCH_SIZE = 10
const REQUEST_TIMEOUT_MS = 120_000
const EMPTY_JOB_ID = '00000000-0000-0000-0000-000000000000'

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function getBatchLabel(batchIndex: number, totalBatches: number) {
  return `Batch ${batchIndex + 1} of ${totalBatches}`
}

function describeFailedBatch(batch: ApprovedRecord[], batchIndex: number, totalBatches: number, message: string) {
  const slugs = batch.map((record) => record.slug).filter(Boolean)
  const slugPreview = slugs.slice(0, 3).join(', ')
  const suffix = slugs.length > 3 ? ` +${slugs.length - 3} more` : ''
  const slugText = slugPreview ? ` (${slugPreview}${suffix})` : ''
  return `${getBatchLabel(batchIndex, totalBatches)} failed for ${batch.length} records${slugText}: ${message}`
}

async function parseErrorResponse(response: Response) {
  let errorMessage = `HTTP ${response.status}`

  try {
    const body = await response.json()
    if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
      errorMessage = body.error
    }
  } catch {
    const bodyText = await response.text().catch(() => '')
    if (bodyText.trim()) errorMessage = bodyText
  }

  return errorMessage
}

export default function StepImportRun({ state, updateState, onBack }: Props) {
  const [statuses, setStatuses] = useState<RecordStatus[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [activeBatchLabel, setActiveBatchLabel] = useState<string | null>(null)
  const [batchFailures, setBatchFailures] = useState<string[]>([])
  const runStarted = useRef(false)

  const approvedRecords = state.transformedRecords.filter((record) => record.status === 'approved') as ApprovedRecord[]

  const updateBatchStatuses = useCallback(
    (batch: ApprovedRecord[], updater: (status: RecordStatus) => RecordStatus) => {
      setStatuses((prev) =>
        prev.map((status) =>
          batch.some((record) => record.rowIndex === status.rowIndex)
            ? updater(status)
            : status
        )
      )
    },
    []
  )

  const applyResults = useCallback((results: ImportResult[]) => {
    setStatuses((prev) =>
      prev.map((status) => {
        const result = results.find((entry) => entry.rowIndex === status.rowIndex)
        if (!result) return status
        return {
          ...status,
          status: result.status === 'success' ? 'success' : 'failed',
          error: result.error,
          entityId: result.entityId,
        }
      })
    )
  }, [])

  const ensureImportJobId = useCallback(async () => {
    if (state.importJobId) return state.importJobId

    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        source_type: state.sourceType!,
        template_type: state.templateType!,
        mode: state.importMode,
        status: 'processing',
        total_records: approvedRecords.length,
        config_json: {
          mapping: state.mappingConfig,
          recipeName: state.recipe?.name,
        },
      })
      .select('id')
      .single()

    if (jobError || !job) {
      const warningMessage = `Import tracking is unavailable: ${jobError?.message ?? 'could not create import job record'}`
      console.warn(warningMessage)
      setImportError(warningMessage)
      return EMPTY_JOB_ID
    }

    updateState({ importJobId: job.id })
    return job.id
  }, [approvedRecords.length, state.importJobId, state.importMode, state.mappingConfig, state.recipe?.name, state.sourceType, state.templateType, updateState])

  const runBatch = useCallback(async (
    batch: ApprovedRecord[],
    batchIndex: number,
    totalBatches: number,
    jobId: string
  ) => {
    const batchLabel = getBatchLabel(batchIndex, totalBatches)
    const payload = {
      records: batch.map((record) => ({
        rowIndex: record.rowIndex,
        slug: record.slug,
        data: record.preparedData,
        sourceData: record.sourceData,
      })),
      templateType: state.templateType,
      jobId,
      mode: state.importMode,
    }
    const maxAttempts = state.importMode === 'create' ? 1 : 2

    updateBatchStatuses(batch, (status) => ({ ...status, status: 'importing', error: undefined }))

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      setActiveBatchLabel(`${batchLabel} · ${batch.length} records${maxAttempts > 1 ? ` · attempt ${attempt}/${maxAttempts}` : ''}`)

      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

      try {
        const payloadBytes = new TextEncoder().encode(JSON.stringify(payload)).length
        console.info('[bulk-import] sending batch', {
          batch: batchIndex + 1,
          totalBatches,
          attempt,
          maxAttempts,
          recordCount: batch.length,
          payloadBytes,
          slugs: batch.map((record) => record.slug),
        })

        const response = await fetch('/api/bulk-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })

        if (!response.ok) {
          const errorMessage = await parseErrorResponse(response)
          const canRetry = attempt < maxAttempts && response.status >= 500

          if (canRetry) {
            console.warn('[bulk-import] retrying batch after server error', {
              batch: batchIndex + 1,
              totalBatches,
              attempt,
              status: response.status,
              errorMessage,
              slugs: batch.map((record) => record.slug),
            })
            await sleep(750)
            continue
          }

          const detailedMessage = describeFailedBatch(batch, batchIndex, totalBatches, errorMessage)
          console.error('[bulk-import] batch http failure', {
            batch: batchIndex + 1,
            totalBatches,
            attempt,
            recordCount: batch.length,
            errorMessage,
            slugs: batch.map((record) => record.slug),
          })
          setBatchFailures((prev) => [...prev, detailedMessage])
          updateBatchStatuses(batch, (status) => ({ ...status, status: 'failed', error: errorMessage }))
          return
        }

        const data = await response.json()
        const results = Array.isArray(data.results) ? (data.results as ImportResult[]) : []
        applyResults(results)
        return
      } catch (error) {
        const baseMessage = error instanceof Error ? error.message : 'Request failed before the server returned a response'
        const errorMessage = controller.signal.aborted
          ? `Request timed out after ${Math.round(REQUEST_TIMEOUT_MS / 1000)} seconds`
          : baseMessage

        if (attempt < maxAttempts) {
          console.warn('[bulk-import] retrying batch after request failure', {
            batch: batchIndex + 1,
            totalBatches,
            attempt,
            errorMessage,
            slugs: batch.map((record) => record.slug),
          })
          await sleep(750)
          continue
        }

        const detailedMessage = describeFailedBatch(batch, batchIndex, totalBatches, errorMessage)
        console.error('[bulk-import] batch network failure', {
          batch: batchIndex + 1,
          totalBatches,
          attempt,
          recordCount: batch.length,
          errorMessage,
          slugs: batch.map((record) => record.slug),
        })
        setBatchFailures((prev) => [...prev, detailedMessage])
        updateBatchStatuses(batch, (status) => ({ ...status, status: 'failed', error: errorMessage }))
        return
      } finally {
        window.clearTimeout(timeoutId)
      }
    }
  }, [applyResults, state.importMode, state.templateType, updateBatchStatuses])

  const runImport = useCallback(async () => {
    setIsRunning(true)
    setIsDone(false)
    setImportError(null)
    setBatchFailures([])

    const jobId = await ensureImportJobId()
    const batches: ApprovedRecord[][] = []

    for (let i = 0; i < approvedRecords.length; i += BATCH_SIZE) {
      batches.push(approvedRecords.slice(i, i + BATCH_SIZE))
    }

    for (const [batchIndex, batch] of batches.entries()) {
      await runBatch(batch, batchIndex, batches.length, jobId)
    }

    if (state.sessionId) {
      await updateSessionStatus(state.sessionId, 'completed')
    }

    setActiveBatchLabel(null)
    setIsRunning(false)
    setIsDone(true)
  }, [approvedRecords, ensureImportJobId, runBatch, state.sessionId])

  useEffect(() => {
    if (!runStarted.current) {
      runStarted.current = true
      if (approvedRecords.length === 0) {
        setIsDone(true)
        return
      }
      setStatuses(approvedRecords.map((record) => ({ rowIndex: record.rowIndex, status: 'pending' })))
      runImport().catch((error) => {
        console.error('Bulk import run failed:', error)
        setImportError(error instanceof Error ? error.message : 'Bulk import failed')
        setIsRunning(false)
        setIsDone(true)
      })
    }
  }, [approvedRecords, runImport])

  const successCount = statuses.filter((status) => status.status === 'success').length
  const failedCount = statuses.filter((status) => status.status === 'failed').length
  const pendingCount = statuses.filter((status) => status.status === 'pending' || status.status === 'importing').length

  if (isDone && approvedRecords.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Import</h2>
        </div>
        <div className="rounded-lg p-6 bg-yellow-50 border border-yellow-200 text-center space-y-2">
          <div className="text-lg font-semibold text-yellow-800">No records to import</div>
          <p className="text-sm text-yellow-700">
            No records were approved for import. Go back to the review or validation step and approve at least one record.
          </p>
        </div>
        <div className="flex justify-start">
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Import</h2>
        <p className="text-sm text-gray-500 mt-1">
          {isRunning ? 'Importing records...' : isDone ? 'Import complete.' : 'Starting import...'}
        </p>
      </div>

      {importError && (
        <div className="rounded-lg p-4 bg-red-50 border border-red-200 text-sm text-red-700">
          <strong>Warning:</strong> {importError}
          <br />
          <span className="text-xs text-red-500">
            Import tracking is unavailable. The records may still have been imported successfully.
          </span>
        </div>
      )}

      {(activeBatchLabel || batchFailures.length > 0) && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 space-y-2">
          {activeBatchLabel && <p><strong>Current batch:</strong> {activeBatchLabel}</p>}
          {batchFailures.length > 0 && (
            <div className="space-y-1">
              <p><strong>Batch diagnostics</strong></p>
              <ul className="list-disc pl-5 text-xs space-y-1">
                {batchFailures.map((failure) => (
                  <li key={failure}>{failure}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-300"
            style={{ width: `${statuses.length > 0 ? ((successCount + failedCount) / statuses.length) * 100 : 0}%` }}
          />
        </div>
        <div className="flex gap-4 text-sm">
          <span className="text-green-600 font-medium">{successCount} success</span>
          <span className="text-red-600 font-medium">{failedCount} failed</span>
          <span className="text-gray-400">{pendingCount} pending</span>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
        {statuses.map((status) => {
          const record = approvedRecords.find((approved) => approved.rowIndex === status.rowIndex)
          const title = String(record?.preparedData?.title ?? record?.mappedData?.title ?? `Row ${status.rowIndex + 1}`)

          return (
            <div key={status.rowIndex} className="flex items-center gap-3 px-3 py-2 text-sm">
              <StatusIcon status={status.status} />
              <span className="font-medium text-gray-900 flex-1 truncate">{title}</span>
              <span className="text-gray-400 text-xs font-mono">{record?.slug}</span>
              {status.error && (
                <span className="text-xs text-red-500 max-w-[260px] truncate" title={status.error}>
                  {status.error}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {isDone && (
        <div className={`rounded-lg p-4 text-center ${
          failedCount === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="text-lg font-semibold">
            {failedCount === 0
              ? `All ${successCount} records imported successfully!`
              : `${successCount} imported, ${failedCount} failed`}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Records were imported using their mapped CMS status and metadata. Visit the {state.templateType === 'post' ? 'Blog Posts' : 'Pages'} section to review the result.
          </p>
          {failedCount > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              The failed records were isolated by batch. In create mode the importer does not automatically resubmit failed network batches, to avoid accidental duplicate inserts.
            </p>
          )}
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          disabled={isRunning}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium disabled:opacity-50"
        >
          Back
        </button>
        {isDone && (
          <a
            href={state.templateType === 'post' ? '/admin/posts' : '/admin/pages'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 inline-block"
          >
            View {state.templateType === 'post' ? 'Posts' : 'Pages'}
          </a>
        )}
      </div>
    </div>
  )
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'success':
      return <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">&#10003;</span>
    case 'failed':
      return <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">&#10007;</span>
    case 'importing':
      return <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs animate-pulse">...</span>
    default:
      return <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs">-</span>
  }
}
