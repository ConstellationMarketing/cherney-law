import { useState, useMemo } from 'react';
import type { WizardState } from '@site/lib/importer/recipeTypes';
import { createDefaultRecipe } from '@site/lib/importer/recipeEngine';
import { applyFieldMappingSingle } from '@site/lib/importer/fieldMapping';
import { computeFieldDiffs, inferRulesFromDiff } from '@site/lib/importer/recipeInference';
import { getTemplateFields, getContentFieldKeys } from '@site/lib/importer/templateFields';
import { cleanSourceRecords } from '@site/lib/importer/sourceCleaner';
import { normalizeHtml } from '@site/lib/importer/htmlNormalizer';

interface Props {
  state: WizardState;
  updateState: (u: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

/** Extract all img src URLs from an HTML string */
function extractImageUrls(html: string): string[] {
  const urls: string[] = [];
  const re = /<img[^>]+src=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const src = m[1];
    if (src && src.startsWith('http')) {
      urls.push(src);
    }
  }
  return [...new Set(urls)];
}

/** Replace image src URLs in HTML using the given mapping */
function replaceImageUrls(html: string, mapping: Record<string, string>): string {
  return html.replace(/<img([^>]+)src=["']([^"']+)["']/gi, (_match, attrs, src) => {
    const newSrc = mapping[src] ?? src;
    return `<img${attrs}src="${newSrc}"`;
  });
}

export default function StepTeachRecipe({ state, updateState, onNext, onBack }: Props) {
  const templateFields = getTemplateFields(state.templateType!);
  const recipe = state.recipe ?? createDefaultRecipe(state.templateType!);

  // Get first record as sample
  const sampleRecord = state.sourceRecords[0];

  // CRITICAL (Rule 3): Run the same pipeline stages 1-5 that auto-transform uses,
  // so the Build Recipe step always shows cleaned HTML — not raw source.
  const mappedSample = useMemo(() => {
    if (!sampleRecord || !state.mappingConfig) return null;

    const contentFieldKeys = getContentFieldKeys(state.templateType!);
    const filterOptions = state.filterOptions;

    // Stages 1-4: clean source record
    const [cleaned] = cleanSourceRecords([sampleRecord], contentFieldKeys, filterOptions);

    // Stage 6: field mapping first (so keys become template field keys)
    const mapped = applyFieldMappingSingle(cleaned, state.mappingConfig);

    // Stage 5: normalize HTML for content fields (now keys match contentFieldKeys)
    const normalizedMappedData: Record<string, string> = {};
    for (const [key, value] of Object.entries(mapped.mappedData)) {
      normalizedMappedData[key] =
        contentFieldKeys.includes(key) && value
          ? normalizeHtml(value, filterOptions)
          : value;
    }

    return { ...mapped, mappedData: normalizedMappedData };
  }, [sampleRecord, state.mappingConfig, state.filterOptions, state.templateType]);

  const [corrections, setCorrections] = useState<Record<string, string>>(() => {
    if (!mappedSample?.mappedData) return {};
    const initial = { ...mappedSample.mappedData };
    // Strip domain from slug but keep the full path (e.g. /areas-we-serve/atlanta/)
    if (initial.slug) {
      try {
        if (/^https?:\/\//i.test(initial.slug)) {
          const url = new URL(initial.slug);
          initial.slug = url.pathname;
        }
      } catch {
        // Not a valid URL, leave as-is
      }
    }
    return initial;
  });

  // AI split state (only relevant for 'area' template)
  const [aiSplitting, setAiSplitting] = useState(false);
  const [aiSplitError, setAiSplitError] = useState<string | null>(null);

  const handleFieldChange = (key: string, value: string) => {
    setCorrections((prev) => ({ ...prev, [key]: value }));
  };

  // Fields populated by the AI batch splitter — must never generate recipe rules
  // because they are computed fresh per-page during auto-transform.
  // Allowing them would bake the recipe-page's HTML as a default_value for every page.
  const AI_SPLIT_FIELDS = new Set([
    'why_body', 'closing_body', 'faq',
    'body_image', 'body_image_alt',
    'why_image', 'why_image_alt',
    'closing_image', 'closing_image_alt',
  ]);

  const handleInferRules = () => {
    if (!mappedSample) return;

    const diffs = computeFieldDiffs(mappedSample.mappedData, corrections);
    // Strip AI-split fields so their content never becomes a recipe rule
    const filteredDiffs = diffs.filter((d) => !AI_SPLIT_FIELDS.has(d.field));
    const newRules = inferRulesFromDiff(filteredDiffs);

    const updatedRecipe = {
      ...recipe,
      rules: [...recipe.rules, ...newRules],
    };

    updateState({ recipe: updatedRecipe });
  };

  /** Re-host images then call the AI content splitter */
  const handleAiSplit = async () => {
    const bodyHtml = corrections.body ?? '';
    if (!bodyHtml.trim()) return;

    setAiSplitting(true);
    setAiSplitError(null);

    try {
      // Step 1: extract + re-host any external images
      const imageUrls = extractImageUrls(bodyHtml);
      let processedHtml = bodyHtml;

      if (imageUrls.length > 0) {
        const imgRes = await fetch('/api/bulk-import-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrls }),
        });

        if (imgRes.ok) {
          const imgData = await imgRes.json() as { mappings: { originalUrl: string; newUrl: string }[] };
          const urlMap: Record<string, string> = {};
          for (const { originalUrl, newUrl } of imgData.mappings) {
            urlMap[originalUrl] = newUrl;
          }
          processedHtml = replaceImageUrls(processedHtml, urlMap);
        }
        // Non-fatal: if image re-hosting fails, continue with original URLs
      }

      // Step 2: AI content split
      const splitRes = await fetch('/api/ai-split-area-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: processedHtml }),
      });

      if (!splitRes.ok) {
        const err = await splitRes.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((err as { error?: string }).error ?? 'AI split failed');
      }

      const splitData = await splitRes.json() as {
        body: string;
        why_body: string;
        closing_body: string;
        faq?: string;
        body_image?: string;
        body_image_alt?: string;
        why_image?: string;
        why_image_alt?: string;
        closing_image?: string;
        closing_image_alt?: string;
      };

      setCorrections((prev) => ({
        ...prev,
        body: splitData.body,
        why_body: splitData.why_body,
        closing_body: splitData.closing_body,
        ...(splitData.faq !== undefined ? { faq: splitData.faq } : {}),
        ...(splitData.body_image    ? { body_image: splitData.body_image, body_image_alt: splitData.body_image_alt ?? '' } : {}),
        ...(splitData.why_image     ? { why_image:  splitData.why_image,  why_image_alt:  splitData.why_image_alt  ?? '' } : {}),
        ...(splitData.closing_image ? { closing_image: splitData.closing_image, closing_image_alt: splitData.closing_image_alt ?? '' } : {}),
      }));

      // Rehost OG image if it's an external URL
      const ogImage = corrections.og_image ?? '';
      if (ogImage.startsWith('http')) {
        try {
          const ogRes = await fetch('/api/bulk-import-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrls: [ogImage] }),
          });
          if (ogRes.ok) {
            const ogData = await ogRes.json() as { mappings: { originalUrl: string; newUrl: string }[] };
            const newOg = ogData.mappings.find((m) => m.originalUrl === ogImage)?.newUrl;
            if (newOg) {
              setCorrections((prev) => ({ ...prev, og_image: newOg }));
            }
          }
        } catch {
          // Non-fatal: OG image rehosting failed, keep original URL
        }
      }
    } catch (err) {
      console.error('AI split error:', err);
      setAiSplitError(err instanceof Error ? err.message : 'AI split failed');
    } finally {
      setAiSplitting(false);
    }
  };

  const handleContinue = () => {
    // Always flush any pending corrections as rules before moving on,
    // so edits the user made (e.g. stripping the firm name from the title)
    // are saved even if they didn't click "Learn from Corrections" first.
    if (hasChanges) {
      handleInferRules();
    }
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

  const isAreaTemplate = state.templateType === 'area';
  const aiAvailable = state.aiAvailable ?? false;

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
          Review the first record's auto-mapped output (HTML has been cleaned). Correct any fields to teach the importer reusable transformation rules.
        </p>
      </div>

      <div className="space-y-4">
        {templateFields.map((field) => {
          const autoValue = mappedSample.mappedData[field.key] ?? '';
          const correctedValue = corrections[field.key] ?? '';
          const isChanged = autoValue !== correctedValue;
          const isBodyField = field.key === 'body' && isAreaTemplate;

          return (
            <div key={field.key} className="grid grid-cols-[180px_1fr] gap-3 items-start">
              <label className="text-sm font-medium text-gray-700 pt-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <div className="space-y-1">
                {/* AI Split button for body field on area template */}
                {isBodyField && (
                  <div className="flex items-center gap-2 mb-1">
                    {aiAvailable ? (
                      <button
                        onClick={handleAiSplit}
                        disabled={aiSplitting || !correctedValue.trim()}
                        className="px-3 py-1 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        {aiSplitting ? (
                          <>
                            <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Splitting…
                          </>
                        ) : (
                          'AI Split Content'
                        )}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        AI unavailable — manually paste content into each section field below
                      </span>
                    )}
                    {aiSplitError && (
                      <span className="text-xs text-red-500">{aiSplitError}</span>
                    )}
                  </div>
                )}

                {field.type === 'html' || correctedValue.length > 200 ? (
                  <textarea
                    value={correctedValue}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    rows={field.type === 'html' ? 6 : 4}
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
