import { useState } from 'react';
import type { WizardState, ReviewDecision } from '@site/lib/importer/recipeTypes';
import type { TransformedRecord } from '@site/lib/importer/types';
import { getTemplateFields } from '@site/lib/importer/templateFields';

interface Props {
  state: WizardState;
  updateState: (u: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepExceptionReview({ state, updateState, onNext, onBack }: Props) {
  const flaggedRecords = state.transformedRecords.filter((r) => r.status === 'flagged');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [decisions, setDecisions] = useState<Record<number, ReviewDecision>>(
    state.reviewState.decisions
  );

  const templateFields = getTemplateFields(state.templateType!);

  if (flaggedRecords.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-2">&#10003;</div>
          <h3 className="text-lg font-semibold text-gray-900">No Exceptions</h3>
          <p className="text-sm text-gray-500 mt-1">All records passed the confidence threshold.</p>
        </div>
        <div className="flex justify-between">
          <button onClick={onBack} className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium">Back</button>
          <button onClick={onNext} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700">Continue</button>
        </div>
      </div>
    );
  }

  const currentRecord = flaggedRecords[currentIdx];
  const decision = decisions[currentRecord.rowIndex];

  const handleDecision = (action: 'approve' | 'skip') => {
    const updated = { ...decisions, [currentRecord.rowIndex]: { action } };
    setDecisions(updated);
    updateState({ reviewState: { decisions: updated } });

    // Auto-advance
    if (currentIdx < flaggedRecords.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handleSaveAll = () => {
    // Apply decisions to transformed records
    const updatedRecords = state.transformedRecords.map((r) => {
      const dec = decisions[r.rowIndex];
      if (!dec) return r;
      return { ...r, status: dec.action === 'skip' ? 'skipped' as const : 'approved' as const };
    });

    updateState({
      transformedRecords: updatedRecords,
      reviewState: { decisions },
    });
    onNext();
  };

  const reviewedCount = Object.keys(decisions).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Exception Review</h2>
          <p className="text-sm text-gray-500 mt-1">
            {flaggedRecords.length} record(s) need review. {reviewedCount} reviewed.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button
            onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
            disabled={currentIdx === 0}
            className="px-2 py-1 border rounded disabled:opacity-30"
          >
            Prev
          </button>
          <span>{currentIdx + 1} / {flaggedRecords.length}</span>
          <button
            onClick={() => setCurrentIdx(Math.min(flaggedRecords.length - 1, currentIdx + 1))}
            disabled={currentIdx === flaggedRecords.length - 1}
            className="px-2 py-1 border rounded disabled:opacity-30"
          >
            Next
          </button>
        </div>
      </div>

      {/* Confidence breakdown */}
      <ConfidenceBreakdown record={currentRecord} />

      {/* Record fields */}
      <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
        {templateFields.map((field) => {
          const value = currentRecord.mappedData[field.key] ?? currentRecord.preparedData[field.key as keyof typeof currentRecord.preparedData];
          const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');

          return (
            <div key={field.key} className="grid grid-cols-[160px_1fr] gap-3 p-3">
              <span className="text-sm font-medium text-gray-600">{field.label}</span>
              <span className="text-sm text-gray-900 break-words max-h-20 overflow-auto">
                {displayValue.substring(0, 300)}
                {displayValue.length > 300 && '...'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Validation issues */}
      {currentRecord.validation.issues.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-1">
          <h4 className="text-sm font-medium text-yellow-800">Validation Issues</h4>
          {currentRecord.validation.issues.map((issue, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className={issue.severity === 'error' ? 'text-red-600' : 'text-yellow-600'}>
                {issue.severity === 'error' ? '!!' : '!'}
              </span>
              <span className="font-medium">{issue.field}:</span>
              <span>{issue.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Decision buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleDecision('approve')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            decision?.action === 'approve'
              ? 'bg-green-600 text-white'
              : 'border border-green-300 text-green-700 hover:bg-green-50'
          }`}
        >
          Approve
        </button>
        <button
          onClick={() => handleDecision('skip')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            decision?.action === 'skip'
              ? 'bg-gray-600 text-white'
              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Skip
        </button>
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium">Back</button>
        <button
          onClick={handleSaveAll}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function ConfidenceBreakdown({ record }: { record: TransformedRecord }) {
  const dims = [
    { key: 'structural', label: 'Structural', value: record.confidence.structural },
    { key: 'extraction', label: 'Extraction', value: record.confidence.extraction },
    { key: 'contentQuality', label: 'Content', value: record.confidence.contentQuality },
    { key: 'validation', label: 'Validation', value: record.confidence.validation },
    { key: 'aiAmbiguity', label: 'AI', value: record.confidence.aiAmbiguity },
  ];

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700">Confidence: {Math.round(record.confidence.overall * 100)}%</h4>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {dims.map((d) => (
          <div key={d.key} className="text-center">
            <div className="h-12 bg-gray-200 rounded relative overflow-hidden">
              <div
                className={`absolute bottom-0 w-full rounded ${
                  d.value >= 0.7 ? 'bg-green-400' : d.value >= 0.4 ? 'bg-yellow-400' : 'bg-red-400'
                }`}
                style={{ height: `${d.value * 100}%` }}
              />
            </div>
            <div className="text-[10px] text-gray-500 mt-1">{d.label}</div>
            <div className="text-xs font-medium">{Math.round(d.value * 100)}%</div>
          </div>
        ))}
      </div>
      {Object.entries(record.confidence.notes).length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          {Object.entries(record.confidence.notes).map(([, note]) => (
            <div key={note}>{note}</div>
          ))}
        </div>
      )}
    </div>
  );
}
