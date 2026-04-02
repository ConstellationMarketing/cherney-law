// Types for the recipe system, confidence scoring, and import sessions

import type { TemplateType, SourceType, MappingConfig, WizardStep, TransformedRecord } from './types';

/** Recipe rule types */
export type RecipeRuleType =
  | 'html_clean'
  | 'h2_split'
  | 'faq_extract'
  | 'slug_normalize'
  | 'text_replace'
  | 'regex_replace'
  | 'prefix'
  | 'suffix'
  | 'default_value'
  | 'uppercase'
  | 'lowercase'
  | 'titlecase'
  | 'trim'
  | 'strip_tags'
  | 'date_format'
  | 'boolean_parse'
  | 'concat_fields'
  | 'extract_first_image'
  | 'meta_from_content'
  | 'custom_function';

/** A single recipe rule */
export interface RecipeRule {
  /** Unique ID for this rule */
  id: string;
  /** Type of transformation */
  type: RecipeRuleType;
  /** Target field key this rule applies to */
  targetField: string;
  /** Rule-specific configuration */
  config: Record<string, unknown>;
  /** Execution order (lower = earlier) */
  order: number;
  /** Whether this rule is enabled */
  enabled: boolean;
  /** Human-readable description */
  description?: string;
}

/** A complete recipe (collection of rules) */
export interface Recipe {
  /** Recipe name */
  name: string;
  /** Template type this recipe is for */
  templateType: TemplateType;
  /** Source type hint */
  sourceType?: SourceType;
  /** Ordered list of transformation rules */
  rules: RecipeRule[];
  /** Confidence threshold for auto-approval */
  confidenceThreshold: number;
  /** Version number */
  version: number;
}

/** Recipe preset record (maps to import_recipes table) */
export interface RecipePreset {
  id: string;
  name: string;
  template_type: TemplateType;
  source_type: SourceType | null;
  mapping_preset_id: string | null;
  recipe_json: Recipe;
  ai_settings_json: AiSettings | null;
  confidence_threshold: number;
  version: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
}

/** AI feature settings */
export interface AiSettings {
  /** Whether to use AI for field mapping suggestions */
  useForMapping: boolean;
  /** Whether to use AI for meta generation */
  useForMeta: boolean;
  /** Whether to use AI for content quality scoring */
  useForScoring: boolean;
  /** Whether to use AI for content rewriting suggestions */
  useForRewriting: boolean;
  /** OpenAI model to use */
  model: string;
  /** Temperature for generation */
  temperature: number;
}

/** Default AI settings */
export const defaultAiSettings: AiSettings = {
  useForMapping: true,
  useForMeta: true,
  useForScoring: false,
  useForRewriting: false,
  model: 'gpt-4o-mini',
  temperature: 0.3,
};

/** Confidence score dimensions */
export interface ConfidenceScore {
  /** Overall confidence (weighted average of dimensions) */
  overall: number;
  /** Did the H2 split produce expected sections? */
  structural: number;
  /** Were FAQ, hero, meta fields extracted? */
  extraction: number;
  /** Word count, empty sections, shortcode remnants? */
  contentQuality: number;
  /** Do required fields pass validation? */
  validation: number;
  /** If AI was used, how uncertain was it? */
  aiAmbiguity: number;
  /** Per-dimension notes for UI display */
  notes: Record<string, string>;
}

/** Default confidence score (all perfect) */
export const defaultConfidenceScore: ConfidenceScore = {
  overall: 1,
  structural: 1,
  extraction: 1,
  contentQuality: 1,
  validation: 1,
  aiAmbiguity: 1,
  notes: {},
};

/** Confidence dimension weights */
export const confidenceWeights = {
  structural: 0.25,
  extraction: 0.2,
  contentQuality: 0.25,
  validation: 0.2,
  aiAmbiguity: 0.1,
} as const;

/** Diff between auto-output and corrected output for recipe inference */
export interface FieldDiff {
  field: string;
  autoValue: string;
  correctedValue: string;
  diffType: 'added' | 'removed' | 'modified' | 'unchanged';
}

/** Migration session record (maps to migration_sessions table) */
export interface MigrationSession {
  id: string;
  name: string | null;
  template_type: TemplateType;
  source_type: SourceType;
  recipe_id: string | null;
  current_step: WizardStep;
  records_count: number;
  approved_count: number;
  exception_count: number;
  skipped_count: number;
  error_count: number;
  source_summary_json: SourceSummary | null;
  source_data_json: Record<string, string>[] | null;
  source_snapshot_json: Record<string, string>[] | null;
  mapping_json: MappingConfig | null;
  recipe_json: Recipe | null;
  transformed_records_json: TransformedRecord[] | null;
  exception_indices: number[] | null;
  review_state_json: ReviewState | null;
  validation_result_json: import('./types').ValidationResult | null;
  status: 'in_progress' | 'completed' | 'abandoned';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Source data summary for session persistence */
export interface SourceSummary {
  sourceType: SourceType;
  totalRows: number;
  columnNames: string[];
  sampleData: Record<string, string>[];
}

/** Review state for exception review step */
export interface ReviewState {
  /** Map of rowIndex → review decision */
  decisions: Record<number, ReviewDecision>;
}

/** Review decision for a single record */
export interface ReviewDecision {
  action: 'approve' | 'edit' | 'skip';
  /** Edited data if action is 'edit' */
  editedData?: Record<string, unknown>;
}

/** Wizard state — the full state of the import wizard */
export interface WizardState {
  /** Current step */
  currentStep: WizardStep;
  /** Selected template type */
  templateType: TemplateType | null;
  /** Source type */
  sourceType: SourceType | null;
  /** Import mode */
  importMode: import('./types').ImportMode;
  /** Parsed source records */
  sourceRecords: import('./types').SourceRecord[];
  /** Detected columns */
  sourceColumns: import('./types').SourceColumn[];
  /** Field mapping configuration */
  mappingConfig: MappingConfig | null;
  /** Current recipe */
  recipe: Recipe | null;
  /** Transformed records after pipeline processing */
  transformedRecords: TransformedRecord[];
  /** Indices of records flagged for exception review */
  exceptionIndices: number[];
  /** Review state */
  reviewState: ReviewState;
  /** Validation result */
  validationResult: import('./types').ValidationResult | null;
  /** Import job ID (created when import starts) */
  importJobId: string | null;
  /** Session ID for save/resume */
  sessionId: string | null;
  /** Filter options */
  filterOptions: import('./types').FilterOptions;
  /** AI settings */
  aiSettings: AiSettings;
  /** Whether AI is available */
  aiAvailable: boolean;
  /** Row index of the record chosen as the Build Recipe sample (defaults to 0) */
  sampleRowIndex?: number;
}
