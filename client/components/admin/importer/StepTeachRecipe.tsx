import { useState, useMemo, useEffect } from 'react';
import type { WizardState, RecipePreset } from '@site/lib/importer/recipeTypes';
import { createDefaultRecipe } from '@site/lib/importer/recipeEngine';
import { supabase } from '@/lib/supabase';
import { computeFieldDiffs, inferRulesFromDiff } from '@site/lib/importer/recipeInference';
import { getTemplateFields, getContentFieldKeys } from '@site/lib/importer/templateFields';
import { buildSamplePreviewSnapshot, getSamplePreviewRecord } from '@site/lib/importer/transformer';
import type { SamplePreviewRecord } from '@site/lib/importer/transformer';

interface Props {
  state: WizardState;
  updateState: (u: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

function buildEditableCorrections(preview: SamplePreviewRecord | null): Record<string, string> {
  return preview ? { ...preview.mappedData } : {};
}

function getPracticeSectionDiagnostics(contentSections: Record<string, unknown>[] = []) {
  return contentSections.map((section, index) => {
    const body = String(section.body ?? '');
    const headingMatch = body.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
    const derivedTitle = String(section.heading ?? '')
      || (headingMatch?.[1] ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      || `Section ${index + 1}`;

    return {
      index,
      title: derivedTitle,
      image: String(section.image ?? ''),
      imageAlt: String(section.imageAlt ?? ''),
      hasImgInBody: /<img\b/i.test(body),
      hasNoscriptInBody: /<noscript\b/i.test(body),
    };
  });
}

export default function StepTeachRecipe({ state, updateState, onNext, onBack }: Props) {
  const templateFields = getTemplateFields(state.templateType!);
  const recipe = state.recipe ?? createDefaultRecipe(state.templateType!);

  // Get chosen sample record (defaults to first record)
  const chosenSampleIndex = state.sampleRowIndex ?? 0;
  const sampleRecord =
    state.sourceRecords.find((r) => r.rowIndex === chosenSampleIndex) ??
    state.sourceRecords[0];
  const samplePreviewMap = useMemo(() => {
    if (!state.mappingConfig || !state.templateType) return new Map<number, SamplePreviewRecord>();

    return new Map(
      state.sourceRecords.map((record) => [
        record.rowIndex,
        getSamplePreviewRecord(
          record,
          state.mappingConfig,
          state.templateType,
          state.filterOptions,
          {}
        ),
      ])
    );
  }, [state.sourceRecords, state.mappingConfig, state.templateType, state.filterOptions]);

  const mappedSample = sampleRecord ? (samplePreviewMap.get(sampleRecord.rowIndex) ?? null) : null;

  // When the user picks a different sample record, reinitialize corrections from that record
  const handleSampleChange = (newRowIndex: number) => {
    updateState({ sampleRowIndex: newRowIndex });
  };

  const initialCorrections = useMemo(
    () => buildEditableCorrections(mappedSample),
    [mappedSample]
  );

  const [corrections, setCorrections] = useState<Record<string, string>>(initialCorrections);

  const correctedPreview = useMemo(() => {
    if (!sampleRecord || !state.mappingConfig || !state.templateType) return null;

    return getSamplePreviewRecord(
      sampleRecord,
      state.mappingConfig,
      state.templateType,
      state.filterOptions,
      corrections
    );
  }, [sampleRecord, state.mappingConfig, state.templateType, state.filterOptions, corrections]);

  // AI split state (only relevant for 'area' template)
  const [aiSplitting, setAiSplitting] = useState(false);
  const [aiSplitError, setAiSplitError] = useState<string | null>(null);

  // --- Load recipe state ---
  const [savedRecipes, setSavedRecipes] = useState<RecipePreset[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [recipeBannerDismissed, setRecipeBannerDismissed] = useState(false);

  // --- Save recipe state ---
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load available recipes for this template type
  useEffect(() => {
    if (!state.templateType) return;
    setLoadingRecipes(true);
    supabase
      .from('import_recipes')
      .select('*')
      .eq('template_type', state.templateType)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setSavedRecipes((data as RecipePreset[]) ?? []);
        if (data && data.length > 0) {
          setSelectedRecipeId(data[0].id);
        }
        setLoadingRecipes(false);
      });
  }, [state.templateType]);

  const handleLoadRecipe = () => {
    const preset = savedRecipes.find((r) => r.id === selectedRecipeId);
    if (!preset) return;
    updateState({ recipe: preset.recipe_json });
    setRecipeBannerDismissed(true);
  };

  const handleSaveRecipe = async () => {
    if (!recipe || recipe.rules.length === 0) return;
    setSaving(true);
    const name =
      saveName.trim() ||
      `${state.templateType} recipe — ${new Date().toLocaleDateString()}`;
    await supabase.from('import_recipes').insert({
      name,
      template_type: state.templateType,
      source_type: state.sourceType,
      recipe_json: recipe,
      ai_settings_json: state.aiSettings,
      confidence_threshold: recipe.confidenceThreshold,
      version: recipe.version,
      is_active: true,
    });
    setSaving(false);
    setSaveSuccess(true);
    setShowSaveForm(false);
    setSaveName('');
    // Refresh recipes list
    const { data } = await supabase
      .from('import_recipes')
      .select('*')
      .eq('template_type', state.templateType)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    setSavedRecipes((data as RecipePreset[]) ?? []);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Reinitialize corrections whenever the chosen sample preview changes
  useEffect(() => {
    setCorrections(initialCorrections);
    setAiSplitError(null);
  }, [initialCorrections]);

  const handleFieldChange = (key: string, value: string) => {
    setCorrections((prev) => ({ ...prev, [key]: value }));
  };

  // Fields populated by the AI batch splitter — must never generate recipe rules
  // because they are computed fresh per-page during auto-transform.
  // Allowing them would bake the recipe-page's HTML as a default_value for every page.
  const AI_SPLIT_FIELDS = new Set([
    // For area template, body is also an AI-split field — after AI Split Content,
    // the body field becomes intro-only. Without this, the diff would generate a
    // recipe rule that embeds the sample page's body as a default_value for all pages.
    ...(state.templateType === 'area' ? ['body', '__ai_split_mode'] : []),
    'why_body', 'closing_body', 'faq',
    'body_image', 'body_image_alt',
    'why_image', 'why_image_alt',
    'closing_image', 'closing_image_alt',
  ]);

  const buildUpdatedRecipe = () => {
    if (!mappedSample) return null;

    const diffs = computeFieldDiffs(initialCorrections, corrections);
    // Strip AI-split fields so their content never becomes a recipe rule
    const filteredDiffs = diffs.filter((d) => !AI_SPLIT_FIELDS.has(d.field));
    // Pass content field keys so inferRulesFromDiff guards against literal-content rules
    const contentFieldKeys = getContentFieldKeys(state.templateType!);
    const newRules = inferRulesFromDiff(filteredDiffs, contentFieldKeys);

    return {
      ...recipe,
      rules: [...recipe.rules, ...newRules],
    };
  };

  const handleInferRules = () => {
    const updatedRecipe = buildUpdatedRecipe();
    if (!updatedRecipe) return;
    updateState({ recipe: updatedRecipe });
  };

  /** Run the shared batch AI splitter with the exact same cleaned body input used by batch transform */
  const handleAiSplit = async () => {
    const bodyHtml = corrections.body ?? '';
    if (!bodyHtml.trim() || !sampleRecord) return;

    setAiSplitting(true);
    setAiSplitError(null);

    try {
      const splitRes = await fetch('/api/ai-split-area-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: [{ rowIndex: sampleRecord.rowIndex, bodyHtml }],
        }),
      });

      if (!splitRes.ok) {
        const err = await splitRes.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((err as { error?: string }).error ?? 'AI split failed');
      }

      const splitJson = await splitRes.json() as {
        results?: Array<{
          rowIndex: number;
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
        }>;
      };
      const splitData = splitJson.results?.find((result) => result.rowIndex === sampleRecord.rowIndex);

      if (!splitData) {
        throw new Error('AI split returned no result for the selected sample row');
      }

      setCorrections((prev) => ({
        ...prev,
        __ai_split_mode: 'true',
        body: splitData.body,
        why_body: splitData.why_body,
        closing_body: splitData.closing_body,
        ...(splitData.faq !== undefined ? { faq: splitData.faq } : {}),
        ...(splitData.body_image ? { body_image: splitData.body_image, body_image_alt: splitData.body_image_alt ?? '' } : {}),
        ...(splitData.why_image ? { why_image: splitData.why_image, why_image_alt: splitData.why_image_alt ?? '' } : {}),
        ...(splitData.closing_image ? { closing_image: splitData.closing_image, closing_image_alt: splitData.closing_image_alt ?? '' } : {}),
      }));

      updateState({
        pipelineContext: {
          ...state.pipelineContext,
          areaAiSplitEnabled: true,
        },
      });
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
    const nextRecipe = hasChanges ? (buildUpdatedRecipe() ?? (state.recipe ?? recipe)) : (state.recipe ?? recipe);

    updateState({
      recipe: nextRecipe,
      pipelineContext: {
        ...state.pipelineContext,
        areaAiSplitEnabled: state.pipelineContext.areaAiSplitEnabled || corrections.__ai_split_mode === 'true',
        samplePreviewSnapshot: correctedPreview ? buildSamplePreviewSnapshot(correctedPreview) : state.pipelineContext.samplePreviewSnapshot,
      },
    });
    onNext();
  };

  const hasChanges = useMemo(() => {
    if (!mappedSample) return false;

    const keys = new Set([...Object.keys(initialCorrections), ...Object.keys(corrections)]);
    for (const key of keys) {
      if ((corrections[key] ?? '') !== (initialCorrections[key] ?? '')) {
        return true;
      }
    }

    return false;
  }, [corrections, initialCorrections, mappedSample]);

  useEffect(() => {
    if (!correctedPreview) return;

    const nextSnapshot = buildSamplePreviewSnapshot(correctedPreview);
    const nextAiSplitEnabled = state.pipelineContext.areaAiSplitEnabled || corrections.__ai_split_mode === 'true';
    const currentSnapshot = state.pipelineContext.samplePreviewSnapshot;
    const snapshotChanged = !currentSnapshot
      || currentSnapshot.rowIndex !== nextSnapshot.rowIndex
      || currentSnapshot.chosenTitle !== nextSnapshot.chosenTitle
      || currentSnapshot.resolvedPath !== nextSnapshot.resolvedPath
      || currentSnapshot.aiSplitMode !== nextSnapshot.aiSplitMode
      || JSON.stringify(currentSnapshot.preparedData) !== JSON.stringify(nextSnapshot.preparedData);

    if (!snapshotChanged && nextAiSplitEnabled === state.pipelineContext.areaAiSplitEnabled) {
      return;
    }

    updateState({
      pipelineContext: {
        ...state.pipelineContext,
        areaAiSplitEnabled: nextAiSplitEnabled,
        samplePreviewSnapshot: nextSnapshot,
      },
    });
  }, [correctedPreview, corrections.__ai_split_mode, state.pipelineContext.areaAiSplitEnabled, state.pipelineContext.samplePreviewSnapshot, updateState]);

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
          Review a record's auto-mapped output (HTML has been cleaned). Correct any fields to teach the importer reusable transformation rules.
        </p>
      </div>

      {/* Load recipe banner */}
      {!loadingRecipes && savedRecipes.length > 0 && !recipeBannerDismissed && (
        <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3">
          <span className="text-sm font-medium text-indigo-800 whitespace-nowrap">
            Saved recipe available:
          </span>
          <select
            value={selectedRecipeId}
            onChange={(e) => setSelectedRecipeId(e.target.value)}
            className="flex-1 rounded border border-indigo-300 bg-white px-2 py-1 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            {savedRecipes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.recipe_json.rules?.length ?? 0} rules, v{r.version})
              </option>
            ))}
          </select>
          <button
            onClick={handleLoadRecipe}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700"
          >
            Load
          </button>
          <button
            onClick={() => setRecipeBannerDismissed(true)}
            className="text-indigo-400 hover:text-indigo-600 text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Sample record selector */}
      {state.sourceRecords.length > 1 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <label className="text-sm font-medium text-blue-800 whitespace-nowrap">
            Build Recipe Sample:
          </label>
          <select
            value={chosenSampleIndex}
            onChange={(e) => handleSampleChange(Number(e.target.value))}
            className="flex-1 rounded border border-blue-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {state.sourceRecords.map((r) => {
              const preview = samplePreviewMap.get(r.rowIndex);
              const label =
                preview?.chosenTitle ||
                String(preview?.allocatedData.title ?? '') ||
                preview?.slug ||
                `Row ${r.rowIndex + 1}`;
              return (
                <option key={r.rowIndex} value={r.rowIndex}>
                  Row {r.rowIndex + 1} — {String(label).substring(0, 60)}
                </option>
              );
            })}
          </select>
          <span className="text-xs text-blue-600 whitespace-nowrap">
            Pick a record with varied content (e.g. one that has FAQs)
          </span>
        </div>
      )}

      <div className="space-y-4">
        {templateFields.map((field) => {
          const autoValue = initialCorrections[field.key] ?? '';
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
                {isBodyField && (
                  <p className="text-xs text-gray-500">
                    This editable field is the mapped source body input. The final section assignment is shown below in Preview Allocated Output.
                  </p>
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

      {/* Preview Allocated Output */}
      <AllocatedPreviewPanel
        preview={correctedPreview}
        templateType={state.templateType!}
        corrections={corrections}
      />

      <div className="flex justify-between items-center">
        <button onClick={onBack} className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
          Back
        </button>
        <div className="flex items-center gap-2">
          {/* Save recipe */}
          {recipe.rules.length > 0 && (
            showSaveForm ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder={`${state.templateType} recipe — ${new Date().toLocaleDateString()}`}
                  className="rounded border border-gray-300 px-3 py-1.5 text-sm w-64 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRecipe();
                    if (e.key === 'Escape') { setShowSaveForm(false); setSaveName(''); }
                  }}
                />
                <button
                  onClick={handleSaveRecipe}
                  disabled={saving}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => { setShowSaveForm(false); setSaveName(''); }}
                  className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSaveForm(true)}
                className="px-3 py-1.5 border border-indigo-300 text-indigo-700 rounded text-sm font-medium hover:bg-indigo-50"
              >
                Save Recipe
              </button>
            )
          )}
          {saveSuccess && (
            <span className="text-sm text-green-600 font-medium">Recipe saved!</span>
          )}
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

// ─── Allocated Preview Panel ─────────────────────────────────────────────────

function AllocatedPreviewPanel({
  preview,
  templateType,
  corrections,
}: {
  preview: SamplePreviewRecord | null;
  templateType: import('@site/lib/importer/types').TemplateType;
  corrections: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);

  const strip = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const trunc = (text: string, max: number) => text.length > max ? text.substring(0, max).trimEnd() + '\u2026' : text;

  useEffect(() => {
    if (!open || !preview || templateType !== 'practice') return;

    const content = (preview.allocatedData.content as Record<string, unknown> | undefined) ?? {};
    const contentSections = (content.contentSections as Record<string, unknown>[] | undefined) ?? [];

    console.groupCollapsed('[practice-preview-diagnostic] build recipe preview payload');
    console.log({
      rowIndex: preview.rowIndex,
      resolvedPath: preview.resolvedPath,
      chosenTitle: preview.chosenTitle,
      hero: content.hero ?? null,
      sectionCount: contentSections.length,
      faq: content.faq ?? null,
    });
    console.log('[practice-preview-diagnostic] build recipe preview sections', getPracticeSectionDiagnostics(contentSections));
    console.groupEnd();
  }, [open, preview, templateType]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-left text-sm"
      >
        <span className="font-medium text-gray-700">Preview Allocated Output</span>
        <span className="text-gray-400 text-xs">{open ? '\u25B2 hide' : '\u25BC show'}</span>
      </button>

      {open && preview && (
        <div className="p-4 space-y-3 bg-white">
          <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
            <span className="font-medium">Resolved title:</span>{' '}
            <strong>{preview.chosenTitle || '—'}</strong>
            <span className="ml-2 text-blue-700">({preview.normalizedContent.titleSource})</span>
          </div>

          <div className="rounded border border-purple-200 bg-purple-50 px-3 py-2 text-xs text-purple-900">
            <span className="font-medium">Resolved hero tagline:</span>{' '}
            <strong>{preview.normalizedContent.heroTagline || '—'}</strong>
            <span className="ml-2 text-purple-700">({preview.normalizedContent.heroTaglineSource})</span>
          </div>

          {/* Stats bar */}
          <div className="flex gap-3 text-xs text-gray-500">
            <span>Method: <strong className="text-gray-700">{preview.normalizedContent.segmentation.method}</strong></span>
            <span>Blocks: <strong className="text-gray-700">{preview.normalizedContent.stats.sectionBlockCount}</strong></span>
            <span>FAQ: <strong className="text-gray-700">{preview.normalizedContent.stats.faqItemCount}</strong></span>
            <span>Images: <strong className="text-gray-700">{preview.normalizedContent.stats.imageCount}</strong></span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-600">
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="font-medium text-gray-700">titleSource:</span> {preview.normalizedContent.titleSource}
            </div>
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="font-medium text-gray-700">earlyPreservedH1:</span> {preview.normalizedContent.earlyPreservedH1 || '—'}
            </div>
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="font-medium text-gray-700">earlyPreservedH2:</span> {preview.normalizedContent.earlyPreservedH2 || '—'}
            </div>
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="font-medium text-gray-700">latePreservedH1:</span> {preview.normalizedContent.latePreservedH1 || '—'}
            </div>
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="font-medium text-gray-700">latePreservedH2:</span> {preview.normalizedContent.latePreservedH2 || '—'}
            </div>
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="font-medium text-gray-700">hadH1BeforeStrip:</span> {preview.normalizedContent.hadH1BeforeStrip ? 'true' : 'false'}
            </div>
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="font-medium text-gray-700">mainContentDroppedH1:</span> {preview.normalizedContent.mainContentDroppedEarlyH1 ? 'true' : 'false'}
            </div>
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="font-medium text-gray-700">earlyHeroTagline:</span> {preview.normalizedContent.earlyHeroTagline || '—'}
            </div>
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="font-medium text-gray-700">heroTaglineSource:</span> {preview.normalizedContent.heroTaglineSource}
            </div>
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="font-medium text-gray-700">rawMetaTitle:</span> {preview.normalizedContent.rawMetaTitle || '—'}
            </div>
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="font-medium text-gray-700">cleanedMetaTitle:</span> {preview.normalizedContent.cleanedMetaTitle || '—'}
            </div>
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="font-medium text-gray-700">leadHtmlLength:</span> {preview.normalizedContent.allocationDebug?.leadHtmlLength ?? '—'}
            </div>
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="font-medium text-gray-700">previewMode:</span>{' '}
              {preview.previewDebug.aiSplitMode ? 'AI split ON' : 'AI split OFF'}
            </div>
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="font-medium text-gray-700">splitSignals:</span>{' '}
              {preview.normalizedContent.segmentation.areaSplitSignals?.length
                ? preview.normalizedContent.segmentation.areaSplitSignals.join(', ')
                : '—'}
            </div>
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="font-medium text-gray-700">introSourceField:</span> {preview.previewDebug.introSourceField}
            </div>
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="font-medium text-gray-700">skipNormalizationKeys:</span>{' '}
              {preview.previewDebug.skipNormalizationKeys.length ? preview.previewDebug.skipNormalizationKeys.join(', ') : '—'}
            </div>
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="font-medium text-gray-700">rawSourceHtmlLength:</span> {preview.previewDebug.rawSourceHtmlLength}
            </div>
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="font-medium text-gray-700">cleanedBodyHtmlLength:</span> {preview.previewDebug.cleanedBodyHtmlLength}
            </div>
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="font-medium text-gray-700">correctionsBodyLength:</span> {preview.previewDebug.correctionsBodyLength}
            </div>
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="font-medium text-gray-700">originalSourceUrl:</span> {preview.previewDebug.originalSourceUrl || '—'}
            </div>
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="font-medium text-gray-700">resolvedUrlPath:</span> {preview.previewDebug.resolvedUrlPath || '—'}
            </div>
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 sm:col-span-3">
              <span className="font-medium text-gray-700">inputBodyPreview:</span> {preview.previewDebug.inputBodyPreview || '—'}
            </div>
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 sm:col-span-3">
              <span className="font-medium text-gray-700">allocatedIntroPath:</span> {preview.previewDebug.allocatedIntroPath}
            </div>
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 sm:col-span-3">
              <span className="font-medium text-gray-700">introPreview:</span> {preview.previewDebug.introPreview || '—'}
            </div>
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 sm:col-span-3">
              <span className="font-medium text-gray-700">correctedLengths:</span>{' '}
              body={(corrections.body ?? '').length}, why={(corrections.why_body ?? '').length}, closing={(corrections.closing_body ?? '').length}
            </div>
          </div>

          {preview.normalizedContent.allocationDebug && (
            <div className="space-y-2 text-xs text-gray-500">
              <div>
                <span className="font-medium text-gray-700">introSource:</span> {preview.normalizedContent.allocationDebug.introSource}
                {' · '}
                <span className="font-medium text-gray-700">introFallback:</span> {preview.normalizedContent.allocationDebug.fallbackRan ? 'ran' : 'skipped'} — {preview.normalizedContent.allocationDebug.fallbackReason}
              </div>
              <div>
                <span className="font-medium text-gray-700">rawOrderedNonFaqBlocks:</span> [{preview.normalizedContent.allocationDebug.rawOrderedNonFaqBlockIndexes.join(', ')}]
              </div>
              <div>
                <span className="font-medium text-gray-700">allocation:</span> intro=[{preview.normalizedContent.allocationDebug.allocationLog.intro.join(', ')}], why=[{preview.normalizedContent.allocationDebug.allocationLog.why.join(', ')}], closing=[{preview.normalizedContent.allocationDebug.allocationLog.closing.join(', ')}]
              </div>
              <div>
                <span className="font-medium text-gray-700">allocatedLengths:</span> intro={preview.normalizedContent.allocationDebug.introBodyLength}, why={preview.normalizedContent.allocationDebug.whyBodyLength}, closing={preview.normalizedContent.allocationDebug.closingBodyLength}
              </div>
              {preview.normalizedContent.allocationDebug.sectionBlocks.length > 0 && (
                <div className="space-y-1">
                  {preview.normalizedContent.allocationDebug.sectionBlocks.map((block) => (
                    <div key={block.index} className="rounded border border-gray-200 bg-gray-50 px-2 py-1">
                      <span className="font-medium text-gray-700">#{block.index}</span>
                      {' · '}
                      <span>{block.wordCount} words</span>
                      {' · '}
                      <span>class={block.classification}</span>
                      {block.heading ? ` · ${block.heading}` : ''}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Template-specific preview */}
          {templateType === 'area' && (() => {
            const content = preview.allocatedData.content as Record<string, unknown>;
            const intro = content.introSection as Record<string, unknown>;
            const why = content.whySection as Record<string, unknown>;
            const closing = content.closingSection as Record<string, unknown>;
            const faq = content.faq as { items?: { question: string }[] };
            const sections = [
              { label: 'Introduction Content', heading: String(intro?.heading ?? ''), body: String(intro?.body ?? ''), hasImg: !!intro?.image },
              { label: 'Why', heading: String(why?.heading ?? ''), body: String(why?.body ?? ''), hasImg: !!why?.image },
              { label: 'Closing', heading: String(closing?.heading ?? ''), body: String(closing?.body ?? ''), hasImg: !!closing?.image },
            ];
            return (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {sections.map((s) => {
                  const text = strip(s.body);
                  const words = text ? text.split(/\s+/).length : 0;
                  return (
                    <div key={s.label} className={`border rounded p-2 text-xs ${text ? 'border-green-300 bg-green-50' : 'border-dashed border-gray-300 bg-gray-50'}`}>
                      <p className="font-semibold text-gray-700">{s.label} {s.hasImg && <span className="text-blue-500">[img]</span>}</p>
                      {s.heading && <p className="text-gray-600 font-medium truncate">{s.heading}</p>}
                      <p className="text-gray-500">{words > 0 ? `${words} words` : 'Empty'}</p>
                      {text && <p className="text-gray-600 mt-1 leading-snug">{trunc(text, 120)}</p>}
                    </div>
                  );
                })}
                <div className={`border rounded p-2 text-xs ${(faq.items?.length ?? 0) > 0 ? 'border-green-300 bg-green-50' : 'border-dashed border-gray-300 bg-gray-50'}`}>
                  <p className="font-semibold text-gray-700">FAQ</p>
                  <p className="text-gray-500">{faq.items?.length ?? 0} items</p>
                  {faq.items?.[0] && <p className="text-gray-600 mt-1">{trunc(faq.items[0].question, 80)}</p>}
                </div>
              </div>
            );
          })()}

          {templateType === 'practice' && (() => {
            const content = preview.allocatedData.content as Record<string, unknown>;
            const cs = (content.contentSections as Record<string, unknown>[]) ?? [];
            const faq = content.faq as { items?: { question: string }[] };
            return (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">{cs.length} content section{cs.length !== 1 ? 's' : ''}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cs.slice(0, 4).map((s, i) => {
                    const text = strip(String(s.body ?? ''));
                    const words = text ? text.split(/\s+/).length : 0;
                    return (
                      <div key={i} className="border border-green-300 bg-green-50 rounded p-2 text-xs">
                        <p className="font-semibold text-gray-700">Section {i + 1} {s.image && <span className="text-blue-500">[img]</span>}</p>
                        <p className="text-gray-500">{words} words</p>
                        <p className="text-gray-600 mt-1 leading-snug">{trunc(text, 100)}</p>
                      </div>
                    );
                  })}
                  {cs.length > 4 && <div className="text-xs text-gray-500 p-2">+{cs.length - 4} more</div>}
                </div>
                <div className={`border rounded p-2 text-xs ${(faq.items?.length ?? 0) > 0 ? 'border-green-300 bg-green-50' : 'border-dashed border-gray-300 bg-gray-50'}`}>
                  <p className="font-semibold text-gray-700">FAQ: {faq.items?.length ?? 0} items</p>
                </div>
              </div>
            );
          })()}

          {templateType === 'post' && (() => {
            const body = String(preview.allocatedData.body ?? '');
            const text = strip(body);
            const words = text ? text.split(/\s+/).length : 0;
            const excerpt = String(preview.allocatedData.excerpt ?? '');
            return (
              <div className="space-y-2">
                {excerpt && (
                  <div className="border border-green-300 bg-green-50 rounded p-2 text-xs">
                    <p className="font-semibold text-gray-700">Excerpt</p>
                    <p className="text-gray-600">{trunc(excerpt, 160)}</p>
                  </div>
                )}
                <div className={`border rounded p-2 text-xs ${words > 0 ? 'border-green-300 bg-green-50' : 'border-dashed border-gray-300 bg-gray-50'}`}>
                  <p className="font-semibold text-gray-700">Body: {words} words</p>
                  {text && <p className="text-gray-600 mt-1 leading-snug">{trunc(text, 200)}</p>}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
