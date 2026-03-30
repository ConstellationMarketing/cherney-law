import { useMemo } from 'react';
import type { WizardState } from '@site/lib/importer/recipeTypes';

interface Props {
  state: WizardState;
  updateState: (u: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepPreview({ state, onNext, onBack }: Props) {
  const importReady = useMemo(
    () => state.transformedRecords.filter((r) => r.status === 'approved'),
    [state.transformedRecords]
  );

  const skipped = state.transformedRecords.filter((r) => r.status === 'skipped').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
        <p className="text-sm text-gray-500 mt-1">
          Final review before import. {importReady.length} record(s) will be imported.
          {skipped > 0 && ` ${skipped} skipped.`}
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {importReady.map((record) => {
              const title = String(record.preparedData.title ?? record.mappedData.title ?? '');
              return (
                <tr key={record.rowIndex} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-400">{record.rowIndex + 1}</td>
                  <td className="px-3 py-2 text-gray-900 font-medium max-w-[200px] truncate">{title}</td>
                  <td className="px-3 py-2 text-gray-600 font-mono max-w-[200px] truncate">{record.slug}</td>
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
        Clicking "Start Import" will create {importReady.length} {state.templateType === 'practice' ? 'practice area page(s)' : 'blog post(s)'} in draft status.
        Records will be sent to the server in batches of 15.
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium">Back</button>
        <button
          onClick={onNext}
          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700"
        >
          Start Import
        </button>
      </div>
    </div>
  );
}
