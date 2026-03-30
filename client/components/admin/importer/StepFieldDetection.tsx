import { useEffect, useState } from 'react';
import type { WizardState } from '@site/lib/importer/recipeTypes';
import type { FieldMapping } from '@site/lib/importer/types';
import { autoMapFields } from '@site/lib/importer/autoMapper';
import { getTemplateFields } from '@site/lib/importer/templateFields';

interface Props {
  state: WizardState;
  updateState: (u: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepFieldDetection({ state, updateState, onNext, onBack }: Props) {
  const [mappings, setMappings] = useState<FieldMapping[]>(state.mappingConfig?.mappings ?? []);

  const templateFields = getTemplateFields(state.templateType!);

  useEffect(() => {
    if (mappings.length === 0 && state.sourceColumns.length > 0) {
      const autoMapped = autoMapFields(state.sourceColumns, state.templateType!);
      setMappings(autoMapped.mappings);
      updateState({ mappingConfig: autoMapped });
    }
  }, []);

  const handleTargetChange = (sourceColumn: string, targetField: string) => {
    setMappings((prev) => {
      const updated = prev.map((m) =>
        m.sourceColumn === sourceColumn
          ? { ...m, targetField, isManual: true, confidence: 1 }
          : m
      );

      // If this target was already mapped to another source, remove it
      const dupeIdx = updated.findIndex(
        (m) => m.targetField === targetField && m.sourceColumn !== sourceColumn
      );
      if (dupeIdx >= 0 && targetField) {
        updated[dupeIdx] = { ...updated[dupeIdx], targetField: '', confidence: 0 };
      }

      // If the source column wasn't in mappings yet, add it
      if (!updated.find((m) => m.sourceColumn === sourceColumn)) {
        updated.push({ sourceColumn, targetField, confidence: 1, isManual: true });
      }

      return updated;
    });
  };

  const handleContinue = () => {
    const config = {
      templateType: state.templateType!,
      mappings: mappings.filter((m) => m.targetField),
      unmappedColumns: state.sourceColumns
        .map((c) => c.name)
        .filter((n) => !mappings.find((m) => m.sourceColumn === n && m.targetField)),
      unmappedFields: templateFields
        .map((f) => f.key)
        .filter((k) => !mappings.find((m) => m.targetField === k)),
    };
    updateState({ mappingConfig: config });
    onNext();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Field Mapping</h2>
        <p className="text-sm text-gray-500 mt-1">
          Map source columns to CMS fields. Auto-mapping has been applied — review and override as needed.
        </p>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Source Column</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Sample Value</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Maps To</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500 w-20">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {state.sourceColumns.map((col) => {
              const mapping = mappings.find((m) => m.sourceColumn === col.name);
              const usedTargets = mappings
                .filter((m) => m.sourceColumn !== col.name && m.targetField)
                .map((m) => m.targetField);

              return (
                <tr key={col.name} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{col.name}</td>
                  <td className="px-4 py-2.5 text-gray-500 max-w-[200px] truncate">
                    {col.sampleValues[0]?.substring(0, 60) || '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      value={mapping?.targetField ?? ''}
                      onChange={(e) => handleTargetChange(col.name, e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">— Skip —</option>
                      {templateFields.map((field) => (
                        <option
                          key={field.key}
                          value={field.key}
                          disabled={usedTargets.includes(field.key)}
                        >
                          {field.label} ({field.key}){field.required ? ' *' : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    {mapping?.targetField && (
                      <span className={`text-xs font-medium ${getConfidenceColor(mapping.confidence)}`}>
                        {mapping.isManual ? 'Manual' : `${Math.round(mapping.confidence * 100)}%`}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Required fields check */}
      {(() => {
        const requiredFields = templateFields.filter((f) => f.required);
        const unmappedRequired = requiredFields.filter(
          (f) => !mappings.find((m) => m.targetField === f.key)
        );
        if (unmappedRequired.length > 0) {
          return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
              <strong>Required fields not mapped:</strong>{' '}
              {unmappedRequired.map((f) => f.label).join(', ')}
            </div>
          );
        }
        return null;
      })()}

      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
          Back
        </button>
        <button
          onClick={handleContinue}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
