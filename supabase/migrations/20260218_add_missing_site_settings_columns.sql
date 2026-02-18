-- Migration: Add missing columns to site_settings table
-- This migration adds all columns required by the SiteSettingsRow TypeScript interface
-- Uses IF NOT EXISTS to make the migration idempotent (safe to run multiple times)

-- Add logo columns
ALTER TABLE site_settings 
  ADD COLUMN IF NOT EXISTS logo_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS logo_alt TEXT NULL;

-- Add phone columns
ALTER TABLE site_settings 
  ADD COLUMN IF NOT EXISTS phone_number TEXT NULL,
  ADD COLUMN IF NOT EXISTS phone_display TEXT NULL,
  ADD COLUMN IF NOT EXISTS phone_availability TEXT NULL,
  ADD COLUMN IF NOT EXISTS apply_phone_globally BOOLEAN DEFAULT TRUE;

-- Add header CTA columns
ALTER TABLE site_settings 
  ADD COLUMN IF NOT EXISTS header_cta_text TEXT NULL,
  ADD COLUMN IF NOT EXISTS header_cta_url TEXT NULL;

-- Add navigation column (JSONB for NavItem[] array)
ALTER TABLE site_settings 
  ADD COLUMN IF NOT EXISTS navigation_items JSONB DEFAULT '[]'::jsonb;

-- Add footer link columns (JSONB for FooterLink[] arrays)
ALTER TABLE site_settings 
  ADD COLUMN IF NOT EXISTS footer_about_links JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS footer_practice_links JSONB DEFAULT '[]'::jsonb;

-- Add footer content columns
ALTER TABLE site_settings 
  ADD COLUMN IF NOT EXISTS footer_tagline TEXT NULL,
  ADD COLUMN IF NOT EXISTS footer_tagline_html TEXT NULL,
  ADD COLUMN IF NOT EXISTS footer_locations JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS footer_bottom_links JSONB DEFAULT '[]'::jsonb;

-- Add address columns
ALTER TABLE site_settings 
  ADD COLUMN IF NOT EXISTS address_line1 TEXT NULL,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT NULL;

-- Add map column
ALTER TABLE site_settings 
  ADD COLUMN IF NOT EXISTS map_embed_url TEXT NULL;

-- Add social links column (JSONB for SocialLink[] array)
ALTER TABLE site_settings 
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '[]'::jsonb;

-- Add copyright column
ALTER TABLE site_settings 
  ADD COLUMN IF NOT EXISTS copyright_text TEXT NULL;

-- Add SEO column
ALTER TABLE site_settings 
  ADD COLUMN IF NOT EXISTS site_noindex BOOLEAN DEFAULT FALSE;

-- Add analytics & scripts columns
ALTER TABLE site_settings 
  ADD COLUMN IF NOT EXISTS ga4_measurement_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS google_ads_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS google_ads_conversion_label TEXT NULL,
  ADD COLUMN IF NOT EXISTS head_scripts TEXT NULL,
  ADD COLUMN IF NOT EXISTS footer_scripts TEXT NULL;

-- Add site name column
ALTER TABLE site_settings 
  ADD COLUMN IF NOT EXISTS site_name TEXT NULL;

-- Add updated_by column (updated_at should already exist)
ALTER TABLE site_settings 
  ADD COLUMN IF NOT EXISTS updated_by TEXT NULL;

-- Verify the migration succeeded by displaying the table structure
-- (This will show in the output when run)
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM 
  information_schema.columns 
WHERE 
  table_name = 'site_settings'
ORDER BY 
  ordinal_position;
