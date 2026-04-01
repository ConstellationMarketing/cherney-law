-- ============================================================
-- Bulk Importer Tracking Tables
-- Run this in your Supabase dashboard → SQL Editor
-- ============================================================

-- Import job tracking
CREATE TABLE IF NOT EXISTS import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL,
  template_type text NOT NULL,
  mode text NOT NULL DEFAULT 'create',
  status text NOT NULL DEFAULT 'pending',
  total_records integer NOT NULL DEFAULT 0,
  created_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  config_json jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Per-record import results
CREATE TABLE IF NOT EXISTS import_job_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_job_id uuid REFERENCES import_jobs(id) ON DELETE CASCADE,
  row_index integer NOT NULL,
  source_data jsonb,
  target_slug text,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  created_entity_id uuid,
  transformation_log jsonb,
  created_at timestamptz DEFAULT now()
);

-- Saved field mapping presets
CREATE TABLE IF NOT EXISTS mapping_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template_type text NOT NULL,
  mapping_json jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Saved import recipes
CREATE TABLE IF NOT EXISTS import_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template_type text NOT NULL,
  source_type text,
  mapping_preset_id uuid REFERENCES mapping_presets(id),
  recipe_json jsonb NOT NULL,
  ai_settings_json jsonb,
  confidence_threshold numeric DEFAULT 0.7,
  version integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_used_at timestamptz
);

-- Save & resume import sessions
CREATE TABLE IF NOT EXISTS migration_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  template_type text NOT NULL,
  source_type text NOT NULL,
  recipe_id uuid REFERENCES import_recipes(id),
  current_step text NOT NULL,
  records_count integer DEFAULT 0,
  approved_count integer DEFAULT 0,
  exception_count integer DEFAULT 0,
  skipped_count integer DEFAULT 0,
  error_count integer DEFAULT 0,
  source_summary_json jsonb,
  source_data_json jsonb,
  source_snapshot_json jsonb,
  mapping_json jsonb,
  recipe_json jsonb,
  transformed_records_json jsonb,
  exception_indices integer[],
  review_state_json jsonb,
  validation_result_json jsonb,
  status text NOT NULL DEFAULT 'in_progress',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_job_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mapping_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_sessions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access to all import tables
CREATE POLICY "Authenticated users can manage import_jobs"
  ON import_jobs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage import_job_items"
  ON import_job_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage mapping_presets"
  ON mapping_presets FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage import_recipes"
  ON import_recipes FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage migration_sessions"
  ON migration_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- Indexes for common queries
-- ============================================================

CREATE INDEX IF NOT EXISTS import_jobs_status_idx ON import_jobs (status);
CREATE INDEX IF NOT EXISTS import_jobs_template_type_idx ON import_jobs (template_type);
CREATE INDEX IF NOT EXISTS import_job_items_job_id_idx ON import_job_items (import_job_id);
CREATE INDEX IF NOT EXISTS import_job_items_status_idx ON import_job_items (status);
CREATE INDEX IF NOT EXISTS migration_sessions_status_idx ON migration_sessions (status);
