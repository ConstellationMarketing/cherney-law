import {
  defaultAiSettings,
  defaultImportPipelineContext,
  type MigrationSession,
  type WizardState,
} from './recipeTypes'
import type { WizardStep } from './types'

const loggedSessionWarnings = new Set<string>()

class SessionRequestError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'SessionRequestError'
    this.status = status
  }
}

export interface SaveSessionOptions {
  includeSourceSnapshot?: boolean
  includeTransformedRecords?: boolean
  includeValidationResult?: boolean
}

export interface SaveSessionResult {
  id: string | null
  error: string | null
  payloadTooLarge: boolean
}

function logSessionWarning(message: string, error?: unknown) {
  if (loggedSessionWarnings.has(message)) return
  loggedSessionWarnings.add(message)
  console.warn(message, error)
}

function isPayloadTooLargeError(error: unknown) {
  return (
    (error instanceof SessionRequestError && error.status === 413)
    || (error instanceof Error && /request entity too large|payload exceeded/i.test(error.message))
  )
}

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
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

    throw new SessionRequestError(errorMessage, response.status)
  }

  return response.json() as Promise<T>
}

/**
 * Save the current wizard state as a migration session.
 */
export async function saveSession(
  state: WizardState,
  options: SaveSessionOptions = {},
  name?: string
): Promise<SaveSessionResult> {
  const sessionData: Partial<MigrationSession> = {
    name: name ?? `Import ${state.templateType} - ${new Date().toLocaleDateString()}`,
    template_type: state.templateType!,
    source_type: state.sourceType!,
    recipe_id: null,
    current_step: state.currentStep,
    records_count: state.sourceRecords.length,
    approved_count: state.transformedRecords.filter((r) => r.status === 'approved').length,
    exception_count: state.exceptionIndices.length,
    skipped_count: state.transformedRecords.filter((r) => r.status === 'skipped').length,
    error_count: state.validationResult?.totalErrors ?? 0,
    source_summary_json: {
      sourceType: state.sourceType!,
      totalRows: state.sourceRecords.length,
      columnNames: state.sourceColumns.map((c) => c.name),
      sampleData: state.sourceRecords.slice(0, 3).map((r) => r.data),
      columns: state.sourceColumns,
      importMode: state.importMode,
      filterOptions: state.filterOptions,
      aiSettings: state.aiSettings,
      sampleRowIndex: state.sampleRowIndex,
      pipelineContext: state.pipelineContext,
    },
    mapping_json: state.mappingConfig,
    recipe_json: state.recipe,
    exception_indices: state.exceptionIndices,
    review_state_json: state.reviewState,
    status: 'in_progress',
  }

  if (options.includeSourceSnapshot) {
    sessionData.source_snapshot_json = state.sourceRecords.map((r) => r.data)
  }

  if (options.includeTransformedRecords) {
    sessionData.transformed_records_json = state.transformedRecords
  }

  if (options.includeValidationResult) {
    sessionData.validation_result_json = state.validationResult
  }

  try {
    const data = await requestJson<{ id: string }>('/api/import-sessions', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: state.sessionId,
        sessionData,
      }),
    })

    return {
      id: data.id ?? null,
      error: null,
      payloadTooLarge: false,
    }
  } catch (error) {
    logSessionWarning('Failed to save import session via same-origin API.', error)

    const payloadTooLarge = isPayloadTooLargeError(error)
    const fallbackMessage = payloadTooLarge
      ? 'Autosave payload is too large right now. Your current import stays open, and autosave will retry with a lighter payload.'
      : 'Autosave could not be saved right now. Your current import stays open, and autosave will retry automatically.'

    return {
      id: null,
      error: error instanceof Error && error.message ? fallbackMessage : fallbackMessage,
      payloadTooLarge,
    }
  }
}

/**
 * Load a saved migration session.
 */
export async function loadSession(sessionId: string): Promise<WizardState | null> {
  try {
    const session = await requestJson<MigrationSession>(`/api/import-sessions/${sessionId}`, {
      method: 'GET',
    })

    const sourceSnapshot = session.source_snapshot_json ?? session.source_data_json ?? []

    return {
      currentStep: session.current_step as WizardStep,
      templateType: session.template_type,
      sourceType: session.source_type,
      importMode: session.source_summary_json?.importMode ?? 'create',
      sourceRecords: sourceSnapshot.map((d, i) => ({
        rowIndex: i,
        data: d,
      })),
      sourceColumns: session.source_summary_json?.columns
        ?? (session.source_summary_json?.columnNames ?? []).map((name) => ({
          name,
          sampleValues: [],
          detectedType: 'text' as const,
        })),
      mappingConfig: session.mapping_json,
      recipe: session.recipe_json,
      transformedRecords: session.transformed_records_json ?? [],
      exceptionIndices: session.exception_indices ?? [],
      reviewState: session.review_state_json ?? { decisions: {} },
      validationResult: session.validation_result_json,
      importJobId: null,
      sessionId: session.id,
      filterOptions: session.source_summary_json?.filterOptions ?? {
        removeContactBlocks: true,
        removePostListings: true,
        removeSidebarWidgets: true,
        removeNewsletterBlocks: true,
        removeCommentSections: true,
        removeFormBlocks: true,
        linkDensityThreshold: 0.6,
      },
      aiSettings: session.source_summary_json?.aiSettings ?? defaultAiSettings,
      aiAvailable: false,
      sampleRowIndex: session.source_summary_json?.sampleRowIndex,
      pipelineContext: session.source_summary_json?.pipelineContext ?? defaultImportPipelineContext,
    }
  } catch (error) {
    logSessionWarning('Failed to load import session via same-origin API.', error)
    return null
  }
}

/**
 * List recent import sessions.
 */
export async function listSessions(
  limit = 10
): Promise<{ id: string; name: string; template_type: string; current_step: string; updated_at: string; status: string }[]> {
  try {
    return await requestJson<{ id: string; name: string; template_type: string; current_step: string; updated_at: string; status: string }[]>(
      `/api/import-sessions?limit=${encodeURIComponent(String(limit))}`,
      { method: 'GET' }
    )
  } catch (error) {
    logSessionWarning('Failed to list import sessions via same-origin API.', error)
    return []
  }
}

/**
 * Mark a session as completed or abandoned.
 */
export async function updateSessionStatus(
  sessionId: string,
  status: 'completed' | 'abandoned'
): Promise<void> {
  try {
    await requestJson<{ success: boolean }>(`/api/import-sessions/${sessionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  } catch (error) {
    logSessionWarning('Failed to update import session status via same-origin API.', error)
  }
}
