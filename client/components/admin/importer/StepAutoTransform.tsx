import { useState, useCallback, useEffect } from 'react';
import type { WizardState } from '@site/lib/importer/recipeTypes';
import type { SourceRecord, MappingConfig } from '@site/lib/importer/types';
import { createDefaultRecipe } from '@site/lib/importer/recipeEngine';
import { transformRecords } from '@site/lib/importer/transformer';

interface Props {
  state: WizardState;
  updateState: (u: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

/**
 * Find the source column name mapped to a given template field key.
 */
function findSourceColumnForField(mappingConfig: MappingConfig, fieldKey: string): string | null {
  const mapping = mappingConfig.mappings.find((m) => m.targetField === fieldKey);
  return mapping?.sourceColumn ?? null;
}

/**
 * Call /api/ai-split-area-batch for all area records.
 * Returns enriched source records with AI-split fields injected as synthetic columns.
 */
async function runAiBatchSplit(
  records: SourceRecord[],
  mappingConfig: MappingConfig,
  onProgress: (current: number, total: number) => void
): Promise<{ enrichedRecords: SourceRecord[]; enrichedMapping: MappingConfig }> {
  const bodyColumn = findSourceColumnForField(mappingConfig, 'body');

  if (!bodyColumn) {
    return { enrichedRecords: records, enrichedMapping: mappingConfig };
  }

  // Build batch payload
  const batchPayload = records.map((r) => ({
    rowIndex: r.rowIndex,
    bodyHtml: r.data[bodyColumn] ?? '',
  }));

  onProgress(0, records.length);

  let results: Array<{
    rowIndex: number;
    body: string;
    why_body: string;
    closing_body: string;
    faq: string;
    body_image: string;
    body_image_alt: string;
    why_image: string;
    why_image_alt: string;
    closing_image: string;
    closing_image_alt: string;
  }>;

  try {
    const resp = await fetch('/api/ai-split-area-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: batchPayload }),
    });

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    results = json.results ?? [];
  } catch (err) {
    console.warn('ai-split-area-batch failed, skipping pre-split:', err);
    return { enrichedRecords: records, enrichedMapping: mappingConfig };
  }

  // Build lookup by rowIndex
  const resultMap = new Map(results.map((r) => [r.rowIndex, r]));

  // Inject synthetic columns into each source record
  const enrichedRecords: SourceRecord[] = records.map((r, i) => {
    const split = resultMap.get(r.rowIndex);
    onProgress(i + 1, records.length);
    if (!split) return r;

    return {
      ...r,
      data: {
        ...r.data,
        // Override body column with AI-cleaned body
        [bodyColumn]: split.body,
        // Inject split sections as synthetic columns
        __ai_why_body: split.why_body,
        __ai_closing_body: split.closing_body,
        __ai_faq: split.faq,
        __ai_body_image: split.body_image,
        __ai_body_image_alt: split.body_image_alt,
        __ai_why_image: split.why_image,
        __ai_why_image_alt: split.why_image_alt,
        __ai_closing_image: split.closing_image,
        __ai_closing_image_alt: split.closing_image_alt,
      },
    };
  });

  // Add mappings for the synthetic columns (only if not already mapped)
  const existingTargets = new Set(mappingConfig.mappings.map((m) => m.targetField));

  const syntheticMappings = [
    { sourceColumn: '__ai_why_body', targetField: 'why_body' },
    { sourceColumn: '__ai_closing_body', targetField: 'closing_body' },
    { sourceColumn: '__ai_faq', targetField: 'faq' },
    { sourceColumn: '__ai_body_image', targetField: 'body_image' },
    { sourceColumn: '__ai_body_image_alt', targetField: 'body_image_alt' },
    { sourceColumn: '__ai_why_image', targetField: 'why_image' },
    { sourceColumn: '__ai_why_image_alt', targetField: 'why_image_alt' },
    { sourceColumn: '__ai_closing_image', targetField: 'closing_image' },
    { sourceColumn: '__ai_closing_image_alt', targetField: 'closing_image_alt' },
  ].filter((m) => !existingTargets.has(m.targetField));

  const enrichedMapping: MappingConfig = {
    ...mappingConfig,
    mappings: [...mappingConfig.mappings, ...syntheticMappings],
  };

  return { enrichedRecords, enrichedMapping };
}

export default function StepAutoTransform({ state, updateState, onNext, onBack }: Props) {
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(state.sourceRecords.length);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(state.transformedRecords.length > 0);
  const [statusLabel, setStatusLabel] = useState('Ready');

  const runTransform = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    setTotal(state.sourceRecords.length);

    try {
      let sourceRecords = state.sourceRecords;
      let mappingConfig = state.mappingConfig!;

      // For area template: run AI batch split to enrich records with why/closing/faq/images
      if (state.templateType === 'area') {
        setStatusLabel('AI splitting content sections…');
        const { enrichedRecords, enrichedMapping } = await runAiBatchSplit(
          sourceRecords,
          mappingConfig,
          (current, total) => {
            setProgress(current);
            setTotal(total);
          }
        );
        sourceRecords = enrichedRecords;
        mappingConfig = enrichedMapping;
        setProgress(sourceRecords.length);
      }

      setStatusLabel('Transforming records…');
      setProgress(0);
      setTotal(sourceRecords.length);

      // Small delay to let UI update
      await new Promise((r) => setTimeout(r, 50));

      const recipe = state.recipe ?? createDefaultRecipe(state.templateType!);
      const threshold = recipe.confidenceThreshold;

      const results = transformRecords(sourceRecords, {
        templateType: state.templateType!,
        mappingConfig,
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

      setStatusLabel('Complete');
      setIsDone(true);
    } finally {
      setIsRunning(false);
    }
  }, [state, updateState]);

  // Auto-run on mount if not already done
  useEffect(() => {
    if (!isDone && !isRunning) {
      runTransform();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <span className="text-gray-600">{isRunning ? statusLabel : isDone ? 'Complete' : 'Ready'}</span>
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
              onClick={() => { setIsDone(false); runTransform(); }}
              disabled={isRunning}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
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
