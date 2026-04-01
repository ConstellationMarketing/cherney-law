// Core types for the bulk content importer pipeline

/** Template types that can be imported */
export type TemplateType = 'practice' | 'post' | 'area';

/** Source input types */
export type SourceType = 'csv' | 'json' | 'api';

/** Import mode */
export type ImportMode = 'create' | 'update' | 'upsert';

/** Import job status */
export type ImportJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

/** Per-record import status */
export type ImportItemStatus = 'pending' | 'importing' | 'success' | 'failed' | 'skipped';

/** Wizard step identifiers */
export type WizardStep =
  | 'template'
  | 'source'
  | 'field-detection'
  | 'teach-recipe'
  | 'auto-transform'
  | 'exception-review'
  | 'validation'
  | 'preview'
  | 'import';

/** A raw record parsed from the source (CSV, JSON, API) */
export interface SourceRecord {
  /** Original row index in the source data */
  rowIndex: number;
  /** Key-value pairs from the source columns */
  data: Record<string, string>;
}

/** Detected column from the source data */
export interface SourceColumn {
  /** Column name as found in the source */
  name: string;
  /** Sample values from first few rows */
  sampleValues: string[];
  /** Detected data type hint */
  detectedType: 'text' | 'html' | 'url' | 'date' | 'number' | 'unknown';
}

/** Source data parsing result */
export interface ParseResult {
  records: SourceRecord[];
  columns: SourceColumn[];
  totalRows: number;
  errors: string[];
}

/** A single field-to-field mapping */
export interface FieldMapping {
  /** Source column name */
  sourceColumn: string;
  /** Target template field key */
  targetField: string;
  /** Confidence of the auto-mapping (0-1) */
  confidence: number;
  /** Whether the user manually set this mapping */
  isManual: boolean;
}

/** Complete mapping configuration */
export interface MappingConfig {
  templateType: TemplateType;
  mappings: FieldMapping[];
  /** Source columns that were not mapped */
  unmappedColumns: string[];
  /** Target fields that have no source mapping */
  unmappedFields: string[];
}

/** A template field definition */
export interface TemplateField {
  /** Unique key for this field */
  key: string;
  /** Display label */
  label: string;
  /** Field type */
  type: 'text' | 'html' | 'url' | 'slug' | 'date' | 'boolean' | 'json' | 'select';
  /** Whether this field is required */
  required: boolean;
  /** Whether this is a content/body field that needs HTML normalization */
  isContentField: boolean;
  /** Common aliases/synonyms for fuzzy matching */
  aliases: string[];
  /** If true, this field is excluded from auto-mapping (user must map manually) */
  excludeFromAutoMap?: boolean;
  /** Default value if not mapped */
  defaultValue?: string;
  /** Select options if type is 'select' */
  options?: string[];
}

/** Mapped record after field mapping is applied */
export interface MappedRecord {
  rowIndex: number;
  /** Original source data */
  sourceData: Record<string, string>;
  /** Mapped data using template field keys */
  mappedData: Record<string, string>;
}

/** Content section after H2 splitting */
export interface ContentSection {
  /** Section heading (H2 text) */
  heading: string;
  /** Section body HTML */
  body: string;
  /** Original heading tag used */
  headingTag?: string;
}

/** FAQ item extracted from content */
export interface FaqItem {
  question: string;
  answer: string;
}

/** A fully prepared record ready for import */
export interface PreparedRecord {
  rowIndex: number;
  /** The slug for this record */
  slug: string;
  /** Record data shaped for the target table */
  data: Record<string, unknown>;
  /** Content sections if applicable (practice pages) */
  contentSections?: ContentSection[];
  /** Extracted FAQ items */
  faqItems?: FaqItem[];
  /** Source data for reference */
  sourceData: Record<string, string>;
}

/** Validation severity */
export type ValidationSeverity = 'error' | 'warning';

/** A single validation issue */
export interface ValidationIssue {
  field: string;
  message: string;
  severity: ValidationSeverity;
  value?: string;
}

/** Validation result for a single record */
export interface RecordValidation {
  rowIndex: number;
  isValid: boolean;
  issues: ValidationIssue[];
  errorCount: number;
  warningCount: number;
}

/** Full validation result for all records */
export interface ValidationResult {
  isValid: boolean;
  records: RecordValidation[];
  totalErrors: number;
  totalWarnings: number;
}

/** Filter options for secondary content detection */
export interface FilterOptions {
  /** Remove contact/CTA blocks */
  removeContactBlocks: boolean;
  /** Remove post listing widgets */
  removePostListings: boolean;
  /** Remove sidebar widgets */
  removeSidebarWidgets: boolean;
  /** Remove newsletter/subscription blocks */
  removeNewsletterBlocks: boolean;
  /** Remove comment sections */
  removeCommentSections: boolean;
  /** Remove form blocks */
  removeFormBlocks: boolean;
  /** Link density threshold for detecting nav/link blocks (0-1) */
  linkDensityThreshold: number;
  /** Base URL for resolving relative URLs */
  baseUrl?: string;
  /** If true, skip secondary content filtering (filterSecondaryContent).
   *  Use for law-firm templates where AI will split content intelligently. */
  skipSecondaryFilter?: boolean;
}

/** Default filter options by template type */
export const defaultFilterOptions: Record<TemplateType, FilterOptions> = {
  practice: {
    // Law firm pages: CTA/consultation language IS the main content, not sidebar junk.
    removeContactBlocks: false,
    removePostListings: true,
    removeSidebarWidgets: true,
    removeNewsletterBlocks: true,
    removeCommentSections: true,
    removeFormBlocks: true,
    // Law firm pages have inline links to related practice areas — raise threshold.
    linkDensityThreshold: 0.85,
    // Skip secondary content filter — extractMainContent already removes nav/sidebar/footer.
    // AI handles intelligent content splitting for these templates.
    skipSecondaryFilter: true,
  },
  post: {
    // Blog posts: sidebar CTAs are genuinely secondary content.
    removeContactBlocks: true,
    removePostListings: true,
    removeSidebarWidgets: true,
    removeNewsletterBlocks: true,
    removeCommentSections: true,
    removeFormBlocks: true,
    linkDensityThreshold: 0.75,
    skipSecondaryFilter: false,
  },
  area: {
    // Same as practice — law firm area pages are law firm content.
    removeContactBlocks: false,
    removePostListings: true,
    removeSidebarWidgets: true,
    removeNewsletterBlocks: true,
    removeCommentSections: true,
    removeFormBlocks: true,
    linkDensityThreshold: 0.85,
    // Skip secondary content filter — same reasoning as practice template.
    skipSecondaryFilter: true,
  },
};

/** Pipeline stage names for logging */
export type PipelineStage =
  | 'strip_shortcodes'
  | 'fix_encoding'
  | 'normalize_whitespace'
  | 'clean_empty_wrappers'
  | 'normalize_html'
  | 'field_mapping'
  | 'recipe_rules'
  | 'prepare_records'
  | 'confidence_scoring'
  | 'validation';

/** Transformation log entry */
export interface TransformationLogEntry {
  stage: PipelineStage;
  field?: string;
  action: string;
  before?: string;
  after?: string;
}

/** Import job record (maps to import_jobs table) */
export interface ImportJob {
  id: string;
  source_type: SourceType;
  template_type: TemplateType;
  mode: ImportMode;
  status: ImportJobStatus;
  total_records: number;
  created_count: number;
  updated_count: number;
  skipped_count: number;
  failed_count: number;
  config_json: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
}

/** Import job item record (maps to import_job_items table) */
export interface ImportJobItem {
  id: string;
  import_job_id: string;
  row_index: number;
  source_data: Record<string, string> | null;
  target_slug: string | null;
  status: ImportItemStatus;
  error_message: string | null;
  created_entity_id: string | null;
  transformation_log: TransformationLogEntry[] | null;
  created_at: string;
}

/** Mapping preset record (maps to mapping_presets table) */
export interface MappingPreset {
  id: string;
  name: string;
  template_type: TemplateType;
  mapping_json: MappingConfig;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Batch import request payload */
export interface BatchImportRequest {
  records: PreparedRecord[];
  templateType: TemplateType;
  jobId: string;
  mode: ImportMode;
}

/** Batch import response */
export interface BatchImportResponse {
  results: {
    rowIndex: number;
    status: 'success' | 'failed';
    error?: string;
    entityId?: string;
  }[];
}

/** API feed fetch request */
export interface ApiFetchRequest {
  url: string;
  headers?: Record<string, string>;
  jsonPath?: string;
}

/** Transformed record combining all pipeline outputs */
export interface TransformedRecord {
  rowIndex: number;
  slug: string;
  sourceData: Record<string, string>;
  mappedData: Record<string, string>;
  cleanedData: Record<string, string>;
  preparedData: Record<string, unknown>;
  contentSections?: ContentSection[];
  faqItems?: FaqItem[];
  confidence: import('./recipeTypes').ConfidenceScore;
  validation: RecordValidation;
  status: 'approved' | 'flagged' | 'skipped';
  transformationLog: TransformationLogEntry[];
}
