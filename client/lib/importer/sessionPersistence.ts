// Session persistence — Save/resume import sessions to Supabase

import { supabase } from '@/lib/supabase';
import { defaultImportPipelineContext, type MigrationSession, type WizardState } from './recipeTypes';
import type { WizardStep } from './types';

/**
 * Save the current wizard state as a migration session.
 */
export async function saveSession(
  state: WizardState,
  name?: string
): Promise<string | null> {
  const sessionData: Partial<MigrationSession> = {
    name: name ?? `Import ${state.templateType} - ${new Date().toLocaleDateString()}`,
    template_type: state.templateType!,
    source_type: state.sourceType!,
    recipe_id: null,
    current_step: state.currentStep,
    records_count: state.sourceRecords.length,
    approved_count: state.transformedRecords.filter((r) => r.status === 'approved').length,
    exception_count: state.exceptionIndices.length,
    skipped_count: state.transformedRecords.filter((r) => r.status === 'skipped').length,
    error_count: state.validationResult?.totalErrors ?? 0,
    source_summary_json: {
      sourceType: state.sourceType!,
      totalRows: state.sourceRecords.length,
      columnNames: state.sourceColumns.map((c) => c.name),
      sampleData: state.sourceRecords.slice(0, 3).map((r) => r.data),
    },
    source_data_json: state.sourceRecords.map((r) => r.data),
    mapping_json: state.mappingConfig,
    recipe_json: state.recipe,
    transformed_records_json: state.transformedRecords,
    exception_indices: state.exceptionIndices,
    review_state_json: state.reviewState,
    validation_result_json: state.validationResult,
    status: 'in_progress',
  };

  if (state.sessionId) {
    // Update existing session
    const { error } = await supabase
      .from('migration_sessions')
      .update({
        ...sessionData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', state.sessionId);

    if (error) {
      console.error('Failed to update session:', error);
      return null;
    }
    return state.sessionId;
  }

  // Create new session
  const { data, error } = await supabase
    .from('migration_sessions')
    .insert(sessionData)
    .select('id')
    .single();

  if (error) {
    console.error('Failed to save session:', error);
    return null;
  }

  return data.id;
}

/**
 * Load a saved migration session.
 */
export async function loadSession(sessionId: string): Promise<WizardState | null> {
  const { data, error } = await supabase
    .from('migration_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error || !data) {
    console.error('Failed to load session:', error);
    return null;
  }

  const session = data as MigrationSession;

  return {
    currentStep: session.current_step as WizardStep,
    templateType: session.template_type,
    sourceType: session.source_type,
    importMode: 'create',
    sourceRecords: (session.source_data_json ?? []).map((d, i) => ({
      rowIndex: i,
      data: d,
    })),
    sourceColumns: (session.source_summary_json?.columnNames ?? []).map((name) => ({
      name,
      sampleValues: [],
      detectedType: 'text' as const,
    })),
    mappingConfig: session.mapping_json,
    recipe: session.recipe_json,
    transformedRecords: session.transformed_records_json ?? [],
    exceptionIndices: session.exception_indices ?? [],
    reviewState: session.review_state_json ?? { decisions: {} },
    validationResult: session.validation_result_json,
    importJobId: null,
    sessionId: session.id,
    filterOptions: {
      removeContactBlocks: true,
      removePostListings: true,
      removeSidebarWidgets: true,
      removeNewsletterBlocks: true,
      removeCommentSections: true,
      removeFormBlocks: true,
      linkDensityThreshold: 0.6,
    },
    aiSettings: {
      useForMapping: true,
      useForMeta: true,
      useForScoring: false,
      useForRewriting: false,
      model: 'gpt-4o-mini',
      temperature: 0.3,
    },
    aiAvailable: false,
    pipelineContext: defaultImportPipelineContext,
  };
}

/**
 * List recent import sessions.
 */
export async function listSessions(
  limit = 10
): Promise<{ id: string; name: string; template_type: string; current_step: string; updated_at: string; status: string }[]> {
  const { data, error } = await supabase
    .from('migration_sessions')
    .select('id, name, template_type, current_step, updated_at, status')
    .eq('status', 'in_progress')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to list sessions:', error);
    return [];
  }

  return data ?? [];
}

/**
 * Mark a session as completed or abandoned.
 */
export async function updateSessionStatus(
  sessionId: string,
  status: 'completed' | 'abandoned'
): Promise<void> {
  await supabase
    .from('migration_sessions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', sessionId);
}
