import { useState, useCallback, useEffect, useRef } from 'react';
import type { WizardState } from '@site/lib/importer/recipeTypes';
import { supabase } from '@/lib/supabase';

interface Props {
  state: WizardState;
  updateState: (u: Partial<WizardState>) => void;
  onBack: () => void;
}

interface RecordStatus {
  rowIndex: number;
  status: 'pending' | 'importing' | 'success' | 'failed';
  error?: string;
  entityId?: string;
}

const BATCH_SIZE = 15;

export default function StepImportRun({ state, updateState, onBack }: Props) {
  const [statuses, setStatuses] = useState<RecordStatus[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const runStarted = useRef(false);

  const approvedRecords = state.transformedRecords.filter((r) => r.status === 'approved');

  useEffect(() => {
    if (!runStarted.current) {
      runStarted.current = true;
      setStatuses(approvedRecords.map((r) => ({ rowIndex: r.rowIndex, status: 'pending' })));
      runImport();
    }
  }, []);

  const runImport = useCallback(async () => {
    setIsRunning(true);

    // Create import job
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
      .single();

    if (jobError || !job) {
      console.error('Failed to create import job:', jobError);
      setIsRunning(false);
      return;
    }

    const jobId = job.id;
    updateState({ importJobId: jobId });

    // Process in batches
    const batches: typeof approvedRecords[] = [];
    for (let i = 0; i < approvedRecords.length; i += BATCH_SIZE) {
      batches.push(approvedRecords.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
      // Mark batch as importing
      setStatuses((prev) =>
        prev.map((s) =>
          batch.find((r) => r.rowIndex === s.rowIndex)
            ? { ...s, status: 'importing' }
            : s
        )
      );

      try {
        const response = await fetch('/api/bulk-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            records: batch.map((r) => ({
              rowIndex: r.rowIndex,
              slug: r.slug,
              data: r.preparedData,
              sourceData: r.sourceData,
            })),
            templateType: state.templateType,
            jobId,
            mode: state.importMode,
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          // Mark all in batch as failed
          setStatuses((prev) =>
            prev.map((s) =>
              batch.find((r) => r.rowIndex === s.rowIndex)
                ? { ...s, status: 'failed', error: `HTTP ${response.status}: ${text}` }
                : s
            )
          );
          continue;
        }

        const data = await response.json();
        const results = data.results as { rowIndex: number; status: string; error?: string; entityId?: string }[];

        setStatuses((prev) =>
          prev.map((s) => {
            const result = results.find((r) => r.rowIndex === s.rowIndex);
            if (!result) return s;
            return {
              ...s,
              status: result.status === 'success' ? 'success' : 'failed',
              error: result.error,
              entityId: result.entityId,
            };
          })
        );
      } catch (err) {
        setStatuses((prev) =>
          prev.map((s) =>
            batch.find((r) => r.rowIndex === s.rowIndex)
              ? { ...s, status: 'failed', error: err instanceof Error ? err.message : 'Network error' }
              : s
          )
        );
      }
    }

    setIsRunning(false);
    setIsDone(true);
  }, [state, approvedRecords, updateState]);

  const successCount = statuses.filter((s) => s.status === 'success').length;
  const failedCount = statuses.filter((s) => s.status === 'failed').length;
  const pendingCount = statuses.filter((s) => s.status === 'pending' || s.status === 'importing').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Import</h2>
        <p className="text-sm text-gray-500 mt-1">
          {isRunning ? 'Importing records...' : isDone ? 'Import complete.' : 'Starting import...'}
        </p>
      </div>

      {/* Progress */}
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

      {/* Record statuses */}
      <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
        {statuses.map((s) => {
          const record = approvedRecords.find((r) => r.rowIndex === s.rowIndex);
          const title = String(record?.preparedData?.title ?? record?.mappedData?.title ?? `Row ${s.rowIndex + 1}`);

          return (
            <div key={s.rowIndex} className="flex items-center gap-3 px-3 py-2 text-sm">
              <StatusIcon status={s.status} />
              <span className="font-medium text-gray-900 flex-1 truncate">{title}</span>
              <span className="text-gray-400 text-xs font-mono">{record?.slug}</span>
              {s.error && (
                <span className="text-xs text-red-500 max-w-[200px] truncate" title={s.error}>
                  {s.error}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
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
            Records were imported as drafts. Visit the {state.templateType === 'post' ? 'Blog Posts' : 'Pages'} section to review and publish.
          </p>
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
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'success':
      return <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">&#10003;</span>;
    case 'failed':
      return <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">&#10007;</span>;
    case 'importing':
      return <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs animate-pulse">...</span>;
    default:
      return <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs">-</span>;
  }
}
