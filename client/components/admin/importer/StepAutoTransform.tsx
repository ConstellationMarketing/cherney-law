import { useState, useCallback, useEffect } from 'react';
import type { WizardState } from '@site/lib/importer/recipeTypes';
import { createDefaultRecipe } from '@site/lib/importer/recipeEngine';
import { transformRecords } from '@site/lib/importer/transformer';

interface Props {
  state: WizardState;
  updateState: (u: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepAutoTransform({ state, updateState, onNext, onBack }: Props) {
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(state.sourceRecords.length);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(state.transformedRecords.length > 0);

  const runTransform = useCallback(() => {
    setIsRunning(true);
    setProgress(0);
    setTotal(state.sourceRecords.length);

    // Run in a setTimeout to allow UI to update
    setTimeout(() => {
      const recipe = state.recipe ?? createDefaultRecipe(state.templateType!);
      const threshold = recipe.confidenceThreshold;

      const results = transformRecords(state.sourceRecords, {
        templateType: state.templateType!,
        mappingConfig: state.mappingConfig!,
        recipe,
        filterOptions: state.filterOptions,
        confidenceThreshold: threshold,
        onProgress: (current, total) => {
          setProgress(current);
          setTotal(total);
        },
      });

      const exceptionIndices = results
        .filter((r) => r.status === 'flagged')
        .map((r) => r.rowIndex);

      updateState({
        transformedRecords: results,
        exceptionIndices,
        recipe,
      });

      setIsDone(true);
      setIsRunning(false);
    }, 50);
  }, [state, updateState]);

  // Auto-run on mount if not already done
  useEffect(() => {
    if (!isDone && !isRunning) {
      runTransform();
    }
  }, []);

  const approved = state.transformedRecords.filter((r) => r.status === 'approved').length;
  const flagged = state.transformedRecords.filter((r) => r.status === 'flagged').length;

  // Confidence distribution
  const distribution = isDone ? getConfidenceDistribution(state.transformedRecords) : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Auto-Transform</h2>
        <p className="text-sm text-gray-500 mt-1">
          Processing all records through the transformation pipeline.
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{isRunning ? 'Processing...' : isDone ? 'Complete' : 'Ready'}</span>
          <span className="text-gray-500">{progress} / {total}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Results summary */}
      {isDone && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{approved}</div>
            <div className="text-sm text-green-600">Auto-Approved</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-700">{flagged}</div>
            <div className="text-sm text-yellow-600">Needs Review</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{state.transformedRecords.length}</div>
            <div className="text-sm text-blue-600">Total Records</div>
          </div>
        </div>
      )}

      {/* Confidence distribution */}
      {isDone && distribution.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Confidence Distribution</h3>
          <div className="flex items-end gap-1 h-20">
            {distribution.map((bucket) => (
              <div
                key={bucket.label}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div
                  className={`w-full rounded-t ${bucket.color}`}
                  style={{ height: `${Math.max(4, (bucket.count / state.transformedRecords.length) * 80)}px` }}
                />
                <span className="text-[10px] text-gray-500">{bucket.label}</span>
                <span className="text-[10px] font-medium text-gray-700">{bucket.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
          Back
        </button>
        <div className="flex gap-2">
          {isDone && (
            <button
              onClick={runTransform}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Re-run
            </button>
          )}
          <button
            onClick={onNext}
            disabled={!isDone}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {flagged > 0 ? 'Review Exceptions' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

function getConfidenceDistribution(records: WizardState['transformedRecords']) {
  const buckets = [
    { label: '0-20%', min: 0, max: 0.2, count: 0, color: 'bg-red-400' },
    { label: '20-40%', min: 0.2, max: 0.4, count: 0, color: 'bg-orange-400' },
    { label: '40-60%', min: 0.4, max: 0.6, count: 0, color: 'bg-yellow-400' },
    { label: '60-80%', min: 0.6, max: 0.8, count: 0, color: 'bg-blue-400' },
    { label: '80-100%', min: 0.8, max: 1.01, count: 0, color: 'bg-green-400' },
  ];

  for (const record of records) {
    const score = record.confidence.overall;
    const bucket = buckets.find((b) => score >= b.min && score < b.max);
    if (bucket) bucket.count++;
  }

  return buckets;
}
