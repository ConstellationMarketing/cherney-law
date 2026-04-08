import { useState, useCallback, useEffect, useRef } from 'react';
import { defaultImportPipelineContext, type WizardState } from '@site/lib/importer/recipeTypes';
import type { WizardStep } from '@site/lib/importer/types';
import { defaultFilterOptions } from '@site/lib/importer/types';
import { defaultAiSettings } from '@site/lib/importer/recipeTypes';
import { checkAiAvailability } from '@site/lib/importer/aiAssist';
import {
  listSessions,
  loadSession,
  saveSession,
  updateSessionStatus,
} from '@site/lib/importer/sessionPersistence';
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

const SAVE_DEBOUNCE_MS = 800;
const AUTOSAVE_RETRY_MS = 15_000;
const AUTOSAVE_LARGE_PAYLOAD_RETRY_MS = 60_000;

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
  pipelineContext: defaultImportPipelineContext,
};

function getStepLabel(step: WizardStep): string {
  return STEPS.find((entry) => entry.key === step)?.label ?? step;
}

export default function ImportWizard() {
  const [state, setState] = useState<WizardState>(initialState);
  const [isHydratingSession, setIsHydratingSession] = useState(true);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [autosaveWarning, setAutosaveWarning] = useState<string | null>(null);
  const [autosavePausedUntil, setAutosavePausedUntil] = useState<number | null>(null);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const lastSavedSourceRecordsRef = useRef<WizardState['sourceRecords'] | null>(null);
  const lastSavedTransformedRecordsRef = useRef<WizardState['transformedRecords'] | null>(null);
  const lastSavedValidationResultRef = useRef<WizardState['validationResult'] | null>(null);

  const updateState = useCallback((updates: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const markHeavyStateSaved = useCallback((snapshot: WizardState) => {
    lastSavedSourceRecordsRef.current = snapshot.sourceRecords;
    lastSavedTransformedRecordsRef.current = snapshot.transformedRecords;
    lastSavedValidationResultRef.current = snapshot.validationResult;
  }, []);

  useEffect(() => {
    let cancelled = false;

    checkAiAvailability().then((available) => {
      if (!cancelled) {
        setState((prev) => ({ ...prev, aiAvailable: available }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const restoreLatestSession = async () => {
      try {
        const sessions = await listSessions(1);
        const latestSession = sessions[0];

        if (!latestSession) {
          if (!cancelled) setIsHydratingSession(false);
          return;
        }

        const restoredState = await loadSession(latestSession.id);
        if (!restoredState) {
          if (!cancelled) {
            setSessionError('A saved import session was found, but it could not be restored.');
            setIsHydratingSession(false);
          }
          return;
        }

        if (!cancelled) {
          markHeavyStateSaved(restoredState);
          setAutosaveWarning(null);
          setAutosavePausedUntil(null);
          setState((prev) => ({
            ...restoredState,
            aiAvailable: prev.aiAvailable,
          }));
          setSessionNotice(
            `Restored your latest ${latestSession.template_type} import at ${getStepLabel(restoredState.currentStep)}.`
          );
          setIsHydratingSession(false);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to restore import session:', error);
          setSessionError('Could not restore the latest import session.');
          setIsHydratingSession(false);
        }
      }
    };

    restoreLatestSession();

    return () => {
      cancelled = true;
    };
  }, [markHeavyStateSaved]);

  useEffect(() => {
    if (!autosavePausedUntil) return;

    const retryDelay = autosavePausedUntil - Date.now();
    if (retryDelay <= 0) {
      setAutosavePausedUntil(null);
      return;
    }

    const retryTimer = window.setTimeout(() => {
      setAutosavePausedUntil(null);
    }, retryDelay);

    return () => {
      window.clearTimeout(retryTimer);
    };
  }, [autosavePausedUntil]);

  useEffect(() => {
    if (isHydratingSession) return;
    if (!state.templateType || !state.sourceType) return;
    if (autosavePausedUntil && autosavePausedUntil > Date.now()) return;

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      const includeSourceSnapshot = !state.sessionId || lastSavedSourceRecordsRef.current !== state.sourceRecords;
      const includeTransformedRecords = !state.sessionId || lastSavedTransformedRecordsRef.current !== state.transformedRecords;
      const includeValidationResult = !state.sessionId || lastSavedValidationResultRef.current !== state.validationResult;

      setIsAutosaving(true);
      const result = await saveSession(state, {
        includeSourceSnapshot,
        includeTransformedRecords,
        includeValidationResult,
      });

      if (cancelled) return;

      setIsAutosaving(false);

      if (result.id) {
        markHeavyStateSaved(state);
        setAutosaveWarning(null);
        setAutosavePausedUntil(null);

        if (result.id !== state.sessionId) {
          setState((prev) => ({
            ...prev,
            sessionId: result.id,
          }));
        }

        return;
      }

      if (result.error) {
        const retryDelay = result.payloadTooLarge
          ? AUTOSAVE_LARGE_PAYLOAD_RETRY_MS
          : AUTOSAVE_RETRY_MS;
        setAutosaveWarning(result.error);
        setAutosavePausedUntil(Date.now() + retryDelay);
      }
    }, SAVE_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [autosavePausedUntil, isHydratingSession, markHeavyStateSaved, state]);

  const handleStartOver = useCallback(async () => {
    setIsResetting(true);
    setSessionError(null);

    try {
      if (state.sessionId) {
        await updateSessionStatus(state.sessionId, 'abandoned');
      }
      lastSavedSourceRecordsRef.current = null;
      lastSavedTransformedRecordsRef.current = null;
      lastSavedValidationResultRef.current = null;
      setAutosaveWarning(null);
      setAutosavePausedUntil(null);
      setIsAutosaving(false);
      setState(initialState);
      setSessionNotice(null);
    } catch (error) {
      console.error('Failed to reset import session:', error);
      setSessionError('Could not clear the saved import session.');
    } finally {
      setIsResetting(false);
    }
  }, [state.sessionId]);

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

  if (isHydratingSession) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Restoring import session</h2>
        <p className="mt-1 text-sm text-gray-500">
          Checking for a saved bulk import session so the wizard can resume where it left off.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          {autosaveWarning ? (
            <p className="text-xs font-medium uppercase tracking-wide text-amber-600">Autosave paused</p>
          ) : isAutosaving ? (
            <p className="text-xs font-medium uppercase tracking-wide text-blue-600">Saving import session</p>
          ) : state.sessionId ? (
            <p className="text-xs font-medium uppercase tracking-wide text-blue-600">Autosave enabled</p>
          ) : (
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">New import session</p>
          )}
        </div>
        {(state.sessionId || state.currentStep !== 'template') && (
          <button
            onClick={handleStartOver}
            disabled={isResetting}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isResetting ? 'Resetting…' : 'Start Over'}
          </button>
        )}
      </div>

      {(sessionNotice || sessionError) && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            sessionError
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-blue-200 bg-blue-50 text-blue-700'
          }`}
        >
          {sessionError || sessionNotice}
        </div>
      )}

      {autosaveWarning && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div>{autosaveWarning}</div>
          {autosavePausedUntil && autosavePausedUntil > Date.now() && (
            <div className="mt-1 text-xs text-amber-700">
              Retry scheduled in {Math.max(1, Math.ceil((autosavePausedUntil - Date.now()) / 1000))}s.
            </div>
          )}
        </div>
      )}

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
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive
                      ? 'bg-white text-blue-600'
                      : isPast
                      ? 'bg-blue-200 text-blue-700'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {isPast ? '✓' : i + 1}
                </span>
                {step.label}
              </button>
            </div>
          );
        })}
      </nav>

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
