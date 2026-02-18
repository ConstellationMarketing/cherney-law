-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Pages table
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  url_path TEXT UNIQUE NOT NULL,
  page_type TEXT NOT NULL DEFAULT 'standard' CHECK (page_type IN ('standard', 'practice', 'landing')),
  content JSONB DEFAULT '[]'::jsonb,
  meta_title TEXT,
  meta_description TEXT,
  canonical_url TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  noindex BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates table
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  page_type TEXT NOT NULL CHECK (page_type IN ('standard', 'practice', 'landing')),
  default_content JSONB DEFAULT '[]'::jsonb,
  default_meta_title TEXT,
  default_meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Redirects table
CREATE TABLE redirects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_path TEXT UNIQUE NOT NULL,
  to_path TEXT NOT NULL,
  status_code INTEGER NOT NULL DEFAULT 301 CHECK (status_code IN (301, 302)),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE redirects ENABLE ROW LEVEL SECURITY;

-- Public can only read published pages
CREATE POLICY "Public read published pages" ON pages
  FOR SELECT USING (status = 'published');

-- Authenticated users can do everything on pages
CREATE POLICY "Auth full access to pages" ON pages
  FOR ALL USING (auth.role() = 'authenticated');

-- Public can read templates
CREATE POLICY "Public read templates" ON templates
  FOR SELECT USING (true);

-- Auth users can manage templates
CREATE POLICY "Auth manage templates" ON templates
  FOR ALL USING (auth.role() = 'authenticated');

-- Public can read enabled redirects
CREATE POLICY "Public read enabled redirects" ON redirects
  FOR SELECT USING (enabled = true);

-- Auth users can manage redirects
CREATE POLICY "Auth manage redirects" ON redirects
  FOR ALL USING (auth.role() = 'authenticated');

-- Update trigger for pages updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed existing pages with block content
INSERT INTO pages (title, url_path, page_type, status, published_at, meta_title, meta_description, content) VALUES
  (
    'Home',
    '/',
    'standard',
    'published',
    NOW(),
    'Atlanta Personal Injury Trial Lawyers | Silva Trial Lawyers',
    'Silva Trial Lawyers provides experienced personal injury representation in Atlanta. Call 404-905-7742 for a free consultation.',
    '[
      {"type": "hero", "title": "Fierce Advocacy When It Matters Most", "subtitle": "Atlanta Personal Injury Trial Lawyers Fighting for Maximum Compensation", "showCTA": true},
      {"type": "services-grid", "services": [
        {"icon": "Car", "title": "Car Accidents", "description": "Aggressive representation for victims of negligent drivers."},
        {"icon": "Truck", "title": "Truck Accidents", "description": "Fighting against trucking companies and their insurers."},
        {"icon": "Bike", "title": "Motorcycle Accidents", "description": "Protecting the rights of injured motorcyclists."},
        {"icon": "Footprints", "title": "Pedestrian Accidents", "description": "Advocating for pedestrians struck by vehicles."},
        {"icon": "AlertTriangle", "title": "Wrongful Death", "description": "Compassionate support for families who have lost loved ones."},
        {"icon": "Building", "title": "Premises Liability", "description": "Holding property owners accountable for unsafe conditions."}
      ]},
      {"type": "testimonials", "testimonials": [
        {"initials": "JM", "text": "Silva Trial Lawyers fought tirelessly for my case. They secured a settlement that covered all my medical bills and more.", "rating": 5},
        {"initials": "RK", "text": "Professional, compassionate, and extremely effective. I could not have asked for better representation.", "rating": 5},
        {"initials": "TP", "text": "After my truck accident, I was overwhelmed. Silva Trial Lawyers handled everything and got me the compensation I deserved.", "rating": 5}
      ]},
      {"type": "cta", "text": "Free Consultation", "phone": "404-905-7742", "variant": "primary"}
    ]'::jsonb
  ),
  (
    'About Us',
    '/about',
    'standard',
    'published',
    NOW(),
    'About Silva Trial Lawyers, LLC | Silva Trial Lawyers',
    'Learn about Silva Trial Lawyers and our commitment to personal injury clients in Atlanta.',
    '[
      {"type": "hero", "title": "About Silva Trial Lawyers", "subtitle": "Dedicated Personal Injury Advocates in Atlanta"},
      {"type": "attorney-bio", "name": "Jonathan Silva", "title": "Founding Partner", "image": "/placeholder.svg", "bio": "Jonathan Silva founded Silva Trial Lawyers with a singular mission: to provide aggressive, client-focused representation to injury victims throughout Georgia. With over 15 years of experience in personal injury law, Jonathan has successfully recovered millions of dollars for his clients.", "phone": "404-905-7742"},
      {"type": "heading", "level": 2, "text": "Our Mission"},
      {"type": "paragraph", "content": "At Silva Trial Lawyers, we believe that every injury victim deserves fierce advocacy and personalized attention. We are not a high-volume firm that treats clients like case numbers. Instead, we take the time to understand your unique situation and develop a tailored legal strategy to maximize your recovery."},
      {"type": "heading", "level": 2, "text": "Why Choose Us"},
      {"type": "bullets", "items": [
        "Proven track record of successful verdicts and settlements",
        "Direct access to your attorney throughout your case",
        "No fees unless we win your case",
        "Aggressive negotiation and litigation strategies",
        "Compassionate, client-first approach"
      ]},
      {"type": "cta", "text": "Schedule Your Free Consultation", "phone": "404-905-7742", "variant": "primary"}
    ]'::jsonb
  ),
  (
    'Practice Areas',
    '/practice-areas',
    'standard',
    'published',
    NOW(),
    'Personal Injury Practice Areas | Silva Trial Lawyers',
    'Explore our personal injury practice areas including car accidents, truck accidents, motorcycle accidents, and more.',
    '[
      {"type": "hero", "title": "Practice Areas", "subtitle": "Comprehensive Personal Injury Representation"},
      {"type": "practice-areas-grid", "areas": [
        {"icon": "Car", "title": "Car Accidents", "description": "Georgia sees thousands of car accidents each year. If you have been injured due to another driver''s negligence, our team will fight to secure compensation for your medical bills, lost wages, and pain and suffering."},
        {"icon": "Truck", "title": "Truck Accidents", "description": "Accidents involving commercial trucks often result in catastrophic injuries. We have experience taking on trucking companies and their insurers to hold them accountable for their negligence."},
        {"icon": "Bike", "title": "Motorcycle Accidents", "description": "Motorcyclists face unique dangers on the road. We understand the challenges riders face when seeking compensation and advocate fiercely for their rights."},
        {"icon": "Footprints", "title": "Pedestrian Accidents", "description": "Pedestrians have little protection when struck by vehicles. We help pedestrian accident victims recover compensation for their injuries and hold negligent drivers accountable."},
        {"icon": "AlertTriangle", "title": "Wrongful Death", "description": "Losing a loved one due to someone else''s negligence is devastating. Our compassionate team helps families seek justice and financial security through wrongful death claims."},
        {"icon": "Building", "title": "Premises Liability", "description": "Property owners have a duty to maintain safe conditions. If you were injured due to unsafe conditions on someone else''s property, we can help you pursue a premises liability claim."}
      ]},
      {"type": "cta", "text": "Discuss Your Case With Us", "phone": "404-905-7742", "variant": "primary"}
    ]'::jsonb
  ),
  (
    'Contact Us',
    '/contact',
    'standard',
    'published',
    NOW(),
    'Contact Silva Trial Lawyers, LLC | Silva Trial Lawyers',
    'Contact our Atlanta personal injury lawyers for a free consultation. Call 404-905-7742 or fill out our contact form.',
    '[
      {"type": "hero", "title": "Contact Us", "subtitle": "Get in Touch for a Free Consultation"},
      {"type": "two-column", "left": [
        {"type": "heading", "level": 2, "text": "Reach Out Today"},
        {"type": "paragraph", "content": "Ready to discuss your case? Contact Silva Trial Lawyers for a free, no-obligation consultation. We are here to answer your questions and help you understand your legal options."},
        {"type": "paragraph", "content": "<strong>Phone:</strong> 404-905-7742"},
        {"type": "paragraph", "content": "<strong>Address:</strong> 191 Peachtree St NE, Suite 3400, Atlanta, GA 30303"}
      ], "right": [
        {"type": "contact-form", "heading": "Send Us a Message"}
      ]},
      {"type": "map", "address": "191 Peachtree St NE, Suite 3400, Atlanta, GA 30303"}
    ]'::jsonb
  );

-- Seed default templates
INSERT INTO templates (name, page_type, default_content, default_meta_title, default_meta_description) VALUES
  (
    'Practice Page Template',
    'practice',
    '[
      {"type": "hero", "title": "Practice Area Title", "subtitle": "We fight for your rights"},
      {"type": "paragraph", "content": "Description of this practice area..."},
      {"type": "bullets", "items": ["Key point 1", "Key point 2", "Key point 3"]},
      {"type": "cta", "text": "Free Consultation", "phone": "404-905-7742", "variant": "primary"}
    ]'::jsonb,
    '[Practice Area] | Silva Trial Lawyers',
    'Silva Trial Lawyers handles [practice area] cases in Atlanta.'
  ),
  (
    'Landing Page Template',
    'landing',
    '[
      {"type": "hero", "title": "Landing Page Title", "subtitle": "Take action today"},
      {"type": "paragraph", "content": "Compelling content here..."},
      {"type": "bullets", "items": ["Benefit 1", "Benefit 2", "Benefit 3"]},
      {"type": "cta", "text": "Get Help Now", "phone": "404-905-7742", "variant": "primary"}
    ]'::jsonb,
    '[Campaign] | Silva Trial Lawyers',
    'Take action today with Silva Trial Lawyers.'
  ),
  (
    'Standard Page Template',
    'standard',
    '[
      {"type": "hero", "title": "Page Title", "subtitle": "Page subtitle"},
      {"type": "paragraph", "content": "Page content goes here..."},
      {"type": "cta", "text": "Contact Us", "phone": "404-905-7742", "variant": "primary"}
    ]'::jsonb,
    '[Page Title] | Silva Trial Lawyers',
    'Silva Trial Lawyers - [Page description].'
  );
-- Storage: media bucket + policies (safe to re-run)

-- Create media storage bucket
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Ensure RLS is enabled for storage objects
alter table storage.objects enable row level security;

-- Recreate policies safely
drop policy if exists "Public read access" on storage.objects;
drop policy if exists "Authenticated users can upload" on storage.objects;
drop policy if exists "Authenticated users can update" on storage.objects;
drop policy if exists "Authenticated users can delete" on storage.objects;

-- Public read (anyone can view)
create policy "Public read access"
on storage.objects for select
using (bucket_id = 'media');

-- Authenticated users can upload
create policy "Authenticated users can upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'media');

-- Authenticated users can update their uploads (simple version: any authed user)
create policy "Authenticated users can update"
on storage.objects for update
to authenticated
using (bucket_id = 'media');

-- Authenticated users can delete (simple version: any authed user)
create policy "Authenticated users can delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'media');
-- Seed global site settings row (safe to rerun)
insert into public.site_settings (settings_key, settings)
select
  'global',
  jsonb_build_object(
    'siteName', 'New Site',
    'logoUrl', '',
    'logoAlt', '',
    'navigationItems', '[]'::jsonb,
    'footerAboutLinks', '[]'::jsonb,
    'footerPracticeLinks', '[]'::jsonb,
    'socialLinks', '[]'::jsonb,
    'headerCtaText', '',
    'headerCtaUrl', '/contact',
    'mapEmbedUrl', '',
    'copyrightText', '',
    'phoneNumber', '',
    'phoneDisplay', '',
    'phoneAvailability', '',
    'footerTaglineHtml', '',
    'applyPhoneGlobally', true
  )
where not exists (
  select 1 from public.site_settings where settings_key = 'global'
);

alter table public.site_settings
add column if not exists footer_tagline_html text;


