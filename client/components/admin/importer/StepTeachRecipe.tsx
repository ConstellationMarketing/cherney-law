import { useState, useMemo } from 'react';
import type { WizardState } from '@site/lib/importer/recipeTypes';
import { createDefaultRecipe } from '@site/lib/importer/recipeEngine';
import { applyFieldMappingSingle } from '@site/lib/importer/fieldMapping';
import { computeFieldDiffs, inferRulesFromDiff } from '@site/lib/importer/recipeInference';
import { getTemplateFields } from '@site/lib/importer/templateFields';

interface Props {
  state: WizardState;
  updateState: (u: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepTeachRecipe({ state, updateState, onNext, onBack }: Props) {
  const templateFields = getTemplateFields(state.templateType!);
  const recipe = state.recipe ?? createDefaultRecipe(state.templateType!);

  // Get first record as sample
  const sampleRecord = state.sourceRecords[0];
  const mappedSample = useMemo(() => {
    if (!sampleRecord || !state.mappingConfig) return null;
    return applyFieldMappingSingle(sampleRecord, state.mappingConfig);
  }, [sampleRecord, state.mappingConfig]);

  const [corrections, setCorrections] = useState<Record<string, string>>(
    () => mappedSample?.mappedData ? { ...mappedSample.mappedData } : {}
  );

  const handleFieldChange = (key: string, value: string) => {
    setCorrections((prev) => ({ ...prev, [key]: value }));
  };

  const handleInferRules = () => {
    if (!mappedSample) return;

    const diffs = computeFieldDiffs(mappedSample.mappedData, corrections);
    const newRules = inferRulesFromDiff(diffs);

    const updatedRecipe = {
      ...recipe,
      rules: [...recipe.rules, ...newRules],
    };

    updateState({ recipe: updatedRecipe });
  };

  const handleContinue = () => {
    // Save recipe if not already set
    if (!state.recipe) {
      updateState({ recipe });
    }
    onNext();
  };

  const hasChanges = useMemo(() => {
    if (!mappedSample) return false;
    return Object.keys(corrections).some(
      (k) => corrections[k] !== (mappedSample.mappedData[k] ?? '')
    );
  }, [corrections, mappedSample]);

  if (!mappedSample) {
    return (
      <div className="text-center py-8 text-gray-500">
        No sample record available. Go back and load source data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Build Recipe</h2>
        <p className="text-sm text-gray-500 mt-1">
          Review the first record's auto-mapped output. Correct any fields to teach the importer reusable transformation rules.
        </p>
      </div>

      <div className="space-y-4">
        {templateFields.map((field) => {
          const autoValue = mappedSample.mappedData[field.key] ?? '';
          const correctedValue = corrections[field.key] ?? '';
          const isChanged = autoValue !== correctedValue;

          return (
            <div key={field.key} className="grid grid-cols-[180px_1fr] gap-3 items-start">
              <label className="text-sm font-medium text-gray-700 pt-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <div className="space-y-1">
                {field.type === 'html' || (autoValue.length > 200) ? (
                  <textarea
                    value={correctedValue}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    rows={4}
                    className={`w-full rounded border px-3 py-2 text-sm font-mono ${
                      isChanged ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
                    } focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
                  />
                ) : (
                  <input
                    type="text"
                    value={correctedValue}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className={`w-full rounded border px-3 py-2 text-sm ${
                      isChanged ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
                    } focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
                  />
                )}
                {isChanged && (
                  <p className="text-xs text-yellow-600">
                    Changed from: {autoValue.substring(0, 80)}{autoValue.length > 80 ? '...' : ''}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recipe rules */}
      {recipe.rules.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Active Recipe Rules ({recipe.rules.length})</h3>
          <div className="space-y-1">
            {recipe.rules.map((rule) => (
              <div key={rule.id} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="font-medium">{rule.targetField}</span>
                <span className="text-gray-400">→</span>
                <span>{rule.description || rule.type}</span>
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
          {hasChanges && (
            <button
              onClick={handleInferRules}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium text-sm hover:bg-yellow-600"
            >
              Learn from Corrections
            </button>
          )}
          <button
            onClick={handleContinue}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
