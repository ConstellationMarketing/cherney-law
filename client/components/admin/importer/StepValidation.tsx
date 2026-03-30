import { useEffect, useMemo } from 'react';
import type { WizardState } from '@site/lib/importer/recipeTypes';
import { validateRecords } from '@site/lib/importer/validator';

interface Props {
  state: WizardState;
  updateState: (u: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepValidation({ state, updateState, onNext, onBack }: Props) {
  // Only validate approved records
  const approvedRecords = useMemo(
    () => state.transformedRecords.filter((r) => r.status === 'approved'),
    [state.transformedRecords]
  );

  const preparedForValidation = useMemo(
    () =>
      approvedRecords.map((r) => ({
        rowIndex: r.rowIndex,
        slug: r.slug,
        data: r.preparedData,
        sourceData: r.sourceData,
      })),
    [approvedRecords]
  );

  const validationResult = useMemo(
    () => validateRecords(preparedForValidation, state.templateType!),
    [preparedForValidation, state.templateType]
  );

  useEffect(() => {
    updateState({ validationResult });
  }, [validationResult]);

  const errorRecords = validationResult.records.filter((r) => r.errorCount > 0);
  const warningRecords = validationResult.records.filter((r) => r.warningCount > 0 && r.errorCount === 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Validation</h2>
        <p className="text-sm text-gray-500 mt-1">
          Checking {approvedRecords.length} approved records for errors and warnings.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className={`border rounded-lg p-4 text-center ${
          validationResult.totalErrors === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className={`text-2xl font-bold ${validationResult.totalErrors === 0 ? 'text-green-700' : 'text-red-700'}`}>
            {validationResult.totalErrors}
          </div>
          <div className={`text-sm ${validationResult.totalErrors === 0 ? 'text-green-600' : 'text-red-600'}`}>Errors</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-700">{validationResult.totalWarnings}</div>
          <div className="text-sm text-yellow-600">Warnings</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">{approvedRecords.length}</div>
          <div className="text-sm text-blue-600">Records</div>
        </div>
      </div>

      {/* Error details */}
      {errorRecords.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-red-700">Errors (must fix before import)</h3>
          {errorRecords.map((rec) => {
            const record = approvedRecords.find((r) => r.rowIndex === rec.rowIndex);
            return (
              <div key={rec.rowIndex} className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-red-600">Row {rec.rowIndex + 1}</span>
                  <span className="text-xs text-red-500">{record?.slug}</span>
                </div>
                {rec.issues.filter((i) => i.severity === 'error').map((issue, i) => (
                  <div key={i} className="text-xs text-red-700 flex gap-1">
                    <span className="font-medium">{issue.field}:</span> {issue.message}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Warning details */}
      {warningRecords.length > 0 && (
        <details className="group">
          <summary className="text-sm font-semibold text-yellow-700 cursor-pointer">
            Warnings ({warningRecords.length} records)
          </summary>
          <div className="space-y-2 mt-2">
            {warningRecords.slice(0, 20).map((rec) => {
              const record = approvedRecords.find((r) => r.rowIndex === rec.rowIndex);
              return (
                <div key={rec.rowIndex} className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs">
                  <span className="font-bold text-yellow-600">Row {rec.rowIndex + 1}</span>
                  <span className="text-yellow-500 ml-2">{record?.slug}</span>
                  {rec.issues.filter((i) => i.severity === 'warning').map((issue, i) => (
                    <div key={i} className="text-yellow-700 mt-0.5">
                      <span className="font-medium">{issue.field}:</span> {issue.message}
                    </div>
                  ))}
                </div>
              );
            })}
            {warningRecords.length > 20 && (
              <p className="text-xs text-gray-400">+{warningRecords.length - 20} more</p>
            )}
          </div>
        </details>
      )}

      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium">Back</button>
        <button
          onClick={onNext}
          disabled={validationResult.totalErrors > 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {validationResult.totalErrors > 0 ? 'Fix Errors to Continue' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
