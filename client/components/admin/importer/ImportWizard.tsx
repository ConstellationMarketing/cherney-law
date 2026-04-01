import { useState, useCallback, useEffect } from 'react';
import type { WizardState } from '@site/lib/importer/recipeTypes';
import type { WizardStep } from '@site/lib/importer/types';
import { defaultFilterOptions } from '@site/lib/importer/types';
import { defaultAiSettings } from '@site/lib/importer/recipeTypes';
import { checkAiAvailability } from '@site/lib/importer/aiAssist';
import StepSourceSelect from './StepSourceSelect';
import StepFieldDetection from './StepFieldDetection';
import StepTeachRecipe from './StepTeachRecipe';
import StepAutoTransform from './StepAutoTransform';
import StepExceptionReview from './StepExceptionReview';
import StepValidation from './StepValidation';
import StepPreview from './StepPreview';
import StepImportRun from './StepImportRun';

const STEPS: { key: WizardStep; label: string }[] = [
  { key: 'template', label: 'Template' },
  { key: 'source', label: 'Source Data' },
  { key: 'field-detection', label: 'Field Mapping' },
  { key: 'teach-recipe', label: 'Build Recipe' },
  { key: 'auto-transform', label: 'Transform' },
  { key: 'exception-review', label: 'Review' },
  { key: 'validation', label: 'Validation' },
  { key: 'preview', label: 'Preview' },
  { key: 'import', label: 'Import' },
];

const initialState: WizardState = {
  currentStep: 'template',
  templateType: null,
  sourceType: null,
  importMode: 'create',
  sourceRecords: [],
  sourceColumns: [],
  mappingConfig: null,
  recipe: null,
  transformedRecords: [],
  exceptionIndices: [],
  reviewState: { decisions: {} },
  validationResult: null,
  importJobId: null,
  sessionId: null,
  filterOptions: defaultFilterOptions.practice,
  aiSettings: defaultAiSettings,
  aiAvailable: false,
};

export default function ImportWizard() {
  const [state, setState] = useState<WizardState>(initialState);

  const updateState = useCallback((updates: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    checkAiAvailability().then((available) => {
      updateState({ aiAvailable: available });
    });
  }, [updateState]);

  const goToStep = useCallback((step: WizardStep) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  const currentStepIdx = STEPS.findIndex((s) => s.key === state.currentStep);

  const goNext = useCallback(() => {
    const idx = STEPS.findIndex((s) => s.key === state.currentStep);
    if (idx < STEPS.length - 1) {
      goToStep(STEPS[idx + 1].key);
    }
  }, [state.currentStep, goToStep]);

  const goBack = useCallback(() => {
    const idx = STEPS.findIndex((s) => s.key === state.currentStep);
    if (idx > 0) {
      goToStep(STEPS[idx - 1].key);
    }
  }, [state.currentStep, goToStep]);

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <nav className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((step, i) => {
          const isActive = step.key === state.currentStep;
          const isPast = i < currentStepIdx;
          const isFuture = i > currentStepIdx;

          return (
            <div key={step.key} className="flex items-center">
              {i > 0 && (
                <div className={`w-6 h-px mx-1 ${isPast ? 'bg-blue-400' : 'bg-gray-300'}`} />
              )}
              <button
                onClick={() => isPast && goToStep(step.key)}
                disabled={isFuture}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : isPast
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isActive ? 'bg-white text-blue-600' : isPast ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-400'
                }`}>
                  {isPast ? '✓' : i + 1}
                </span>
                {step.label}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Step content */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {state.currentStep === 'template' && (
          <StepTemplateSelect state={state} updateState={updateState} onNext={goNext} />
        )}
        {state.currentStep === 'source' && (
          <StepSourceSelect state={state} updateState={updateState} onNext={goNext} onBack={goBack} />
        )}
        {state.currentStep === 'field-detection' && (
          <StepFieldDetection state={state} updateState={updateState} onNext={goNext} onBack={goBack} />
        )}
        {state.currentStep === 'teach-recipe' && (
          <StepTeachRecipe state={state} updateState={updateState} onNext={goNext} onBack={goBack} />
        )}
        {state.currentStep === 'auto-transform' && (
          <StepAutoTransform state={state} updateState={updateState} onNext={goNext} onBack={goBack} />
        )}
        {state.currentStep === 'exception-review' && (
          <StepExceptionReview state={state} updateState={updateState} onNext={goNext} onBack={goBack} />
        )}
        {state.currentStep === 'validation' && (
          <StepValidation state={state} updateState={updateState} onNext={goNext} onBack={goBack} />
        )}
        {state.currentStep === 'preview' && (
          <StepPreview state={state} updateState={updateState} onNext={goNext} onBack={goBack} />
        )}
        {state.currentStep === 'import' && (
          <StepImportRun state={state} updateState={updateState} onBack={goBack} />
        )}
      </div>
    </div>
  );
}

/** Step 1: Template Selection */
function StepTemplateSelect({
  state,
  updateState,
  onNext,
}: {
  state: WizardState;
  updateState: (u: Partial<WizardState>) => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Select Content Type</h2>
        <p className="text-sm text-gray-500 mt-1">Choose what type of content you want to import.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-2xl">
        <button
          onClick={() => updateState({ templateType: 'practice', filterOptions: defaultFilterOptions.practice })}
          className={`p-4 border-2 rounded-lg text-left transition-colors ${
            state.templateType === 'practice'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="font-medium text-gray-900">Practice Areas</div>
          <div className="text-sm text-gray-500 mt-1">Import practice area detail pages</div>
        </button>

        <button
          onClick={() => updateState({ templateType: 'post', filterOptions: defaultFilterOptions.post })}
          className={`p-4 border-2 rounded-lg text-left transition-colors ${
            state.templateType === 'post'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="font-medium text-gray-900">Blog Posts</div>
          <div className="text-sm text-gray-500 mt-1">Import blog posts</div>
        </button>

        <button
          onClick={() => updateState({ templateType: 'area', filterOptions: defaultFilterOptions.area })}
          className={`p-4 border-2 rounded-lg text-left transition-colors ${
            state.templateType === 'area'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="font-medium text-gray-900">Areas We Serve</div>
          <div className="text-sm text-gray-500 mt-1">Import area/location pages</div>
        </button>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!state.templateType}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
