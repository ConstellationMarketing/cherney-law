import { useMemo } from 'react';
import type { WizardState } from '@site/lib/importer/recipeTypes';

interface Props {
  state: WizardState;
  updateState: (u: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepPreview({ state, updateState, onNext, onBack }: Props) {
  const importReady = useMemo(
    () => state.transformedRecords.filter((r) => r.status === 'approved'),
    [state.transformedRecords]
  );

  const skipped = state.transformedRecords.filter((r) => r.status === 'skipped').length;
  const excluded = state.transformedRecords.filter((r) => r.status === 'excluded' as string).length;

  function handleExclude(rowIndex: number) {
    const updated = state.transformedRecords.map((r) =>
      r.rowIndex === rowIndex ? { ...r, status: 'skipped' as const } : r
    );
    updateState({ transformedRecords: updated });
  }

  const templateLabel =
    state.templateType === 'practice'
      ? 'practice area page(s)'
      : state.templateType === 'area'
      ? 'area page(s)'
      : 'blog post(s)';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
        <p className="text-sm text-gray-500 mt-1">
          Final review before import.{' '}
          <span className="font-medium text-gray-700">{importReady.length}</span> record(s) will be imported.
          {skipped > 0 && (
            <span className="ml-1 text-gray-400">{skipped} skipped.</span>
          )}
          {excluded > 0 && (
            <span className="ml-1 text-orange-500">{excluded} excluded by you.</span>
          )}
        </p>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500">#</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Title</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Slug</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Status</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Confidence</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Issues</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Exclude</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {importReady.map((record) => {
              const title = String(record.preparedData.title ?? record.mappedData.title ?? '');
              return (
                <tr key={record.rowIndex} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-400">{record.rowIndex + 1}</td>
                  <td className="px-3 py-2 text-gray-900 font-medium max-w-[200px] truncate">{title}</td>
                  <td className="px-3 py-2 text-gray-600 font-mono max-w-[220px] truncate">{record.slug}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
                      Ready
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-xs font-medium ${
                      record.confidence.overall >= 0.8 ? 'text-green-600' :
                      record.confidence.overall >= 0.5 ? 'text-yellow-600' : 'text-red-500'
                    }`}>
                      {Math.round(record.confidence.overall * 100)}%
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-500">
                    {record.validation.warningCount > 0 && (
                      <span className="text-yellow-600">{record.validation.warningCount}w</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleExclude(record.rowIndex)}
                      title="Exclude from import"
                      className="text-gray-400 hover:text-red-500 transition-colors text-base leading-none font-bold"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
            {importReady.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-400">
                  All records have been excluded. Go back to adjust.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
        Clicking "Start Import" will create {importReady.length} {templateLabel} in draft status.
        Records will be sent to the server in batches of 15.
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium">Back</button>
        <button
          onClick={onNext}
          disabled={importReady.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Import
        </button>
      </div>
    </div>
  );
}
