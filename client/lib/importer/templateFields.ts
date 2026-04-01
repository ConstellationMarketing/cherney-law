// Template field definitions for each content type
// Defines what fields each template type expects, with aliases for fuzzy matching

import type { TemplateField, TemplateType } from './types';

/** Practice area detail page fields */
export const practiceFields: TemplateField[] = [
  {
    key: 'title',
    label: 'Page Title',
    type: 'text',
    required: true,
    isContentField: false,
    aliases: ['title', 'page_title', 'name', 'heading', 'post_title', 'practice_area', 'practice area', 'area_name'],
  },
  {
    key: 'slug',
    label: 'URL Slug',
    type: 'slug',
    required: true,
    isContentField: false,
    aliases: ['slug', 'url', 'url_path', 'permalink', 'path', 'page_url', 'post_name', 'url_slug'],
  },
  {
    key: 'hero_tagline',
    label: 'Hero Tagline',
    type: 'text',
    required: false,
    isContentField: false,
    aliases: ['tagline', 'hero_tagline', 'subtitle', 'subheading', 'hero_subtitle'],
  },
  {
    key: 'hero_description',
    label: 'Hero Description',
    type: 'html',
    required: false,
    isContentField: true,
    aliases: ['hero_description', 'hero_text', 'intro', 'introduction', 'excerpt', 'summary', 'description'],
  },
  {
    key: 'hero_image',
    label: 'Hero Background Image',
    type: 'url',
    required: false,
    isContentField: false,
    aliases: ['hero_image', 'featured_image', 'background_image', 'banner_image', 'header_image', 'image'],
  },
  {
    key: 'body',
    label: 'Main Body Content',
    type: 'html',
    required: true,
    isContentField: true,
    aliases: ['body', 'content', 'main_content', 'page_content', 'post_content', 'text', 'html', 'description', 'full_content'],
  },
  {
    key: 'faq',
    label: 'FAQ Section',
    type: 'json',
    required: false,
    isContentField: false,
    aliases: ['faq', 'faqs', 'frequently_asked_questions', 'questions', 'qa', 'q_and_a'],
  },
  {
    key: 'meta_title',
    label: 'Meta Title',
    type: 'text',
    required: false,
    isContentField: false,
    aliases: ['meta_title', 'seo_title', 'page_title_seo', 'title_tag', 'og_title'],
  },
  {
    key: 'meta_description',
    label: 'Meta Description',
    type: 'text',
    required: false,
    isContentField: false,
    aliases: ['meta_description', 'seo_description', 'page_description', 'description_tag', 'og_description', 'excerpt'],
  },
  {
    key: 'canonical_url',
    label: 'Canonical URL',
    type: 'url',
    required: false,
    isContentField: false,
    aliases: ['canonical_url', 'canonical', 'canonical_link'],
  },
  {
    key: 'og_image',
    label: 'OG Image',
    type: 'url',
    required: false,
    isContentField: false,
    aliases: ['og_image', 'social_image', 'share_image', 'twitter_image'],
  },
  {
    key: 'status',
    label: 'Page Status',
    type: 'select',
    required: false,
    isContentField: false,
    aliases: ['status', 'page_status', 'state', 'published'],
    defaultValue: 'draft',
    options: ['draft', 'published'],
  },
  {
    key: 'schema_type',
    label: 'Schema Type',
    type: 'text',
    required: false,
    isContentField: false,
    aliases: ['schema_type', 'structured_data_type'],
    defaultValue: 'LegalService',
  },
];

/** Blog post fields */
export const postFields: TemplateField[] = [
  {
    key: 'title',
    label: 'Post Title',
    type: 'text',
    required: true,
    isContentField: false,
    aliases: ['title', 'post_title', 'name', 'heading', 'article_title', 'blog_title'],
  },
  {
    key: 'slug',
    label: 'URL Slug',
    type: 'slug',
    required: true,
    isContentField: false,
    aliases: ['slug', 'url', 'permalink', 'path', 'post_name', 'url_slug', 'post_slug'],
  },
  {
    key: 'body',
    label: 'Post Body',
    type: 'html',
    required: true,
    isContentField: true,
    aliases: ['body', 'content', 'post_content', 'text', 'html', 'article_body', 'full_content', 'description'],
  },
  {
    key: 'excerpt',
    label: 'Excerpt',
    type: 'text',
    required: false,
    isContentField: false,
    aliases: ['excerpt', 'summary', 'post_excerpt', 'short_description', 'intro', 'teaser', 'preview'],
  },
  {
    key: 'featured_image',
    label: 'Featured Image',
    type: 'url',
    required: false,
    isContentField: false,
    aliases: ['featured_image', 'image', 'thumbnail', 'post_image', 'cover_image', 'hero_image', 'banner'],
  },
  {
    key: 'category',
    label: 'Category',
    type: 'text',
    required: false,
    isContentField: false,
    aliases: ['category', 'categories', 'post_category', 'cat', 'topic', 'section'],
  },
  {
    key: 'meta_title',
    label: 'Meta Title',
    type: 'text',
    required: false,
    isContentField: false,
    aliases: ['meta_title', 'seo_title', 'title_tag', 'og_title'],
  },
  {
    key: 'meta_description',
    label: 'Meta Description',
    type: 'text',
    required: false,
    isContentField: false,
    aliases: ['meta_description', 'seo_description', 'description_tag', 'og_description'],
  },
  {
    key: 'canonical_url',
    label: 'Canonical URL',
    type: 'url',
    required: false,
    isContentField: false,
    aliases: ['canonical_url', 'canonical', 'canonical_link'],
  },
  {
    key: 'og_image',
    label: 'OG Image',
    type: 'url',
    required: false,
    isContentField: false,
    aliases: ['og_image', 'social_image', 'share_image'],
  },
  {
    key: 'published_at',
    label: 'Publish Date',
    type: 'date',
    required: false,
    isContentField: false,
    aliases: ['published_at', 'publish_date', 'date', 'post_date', 'created_at', 'published', 'pub_date'],
  },
  {
    key: 'status',
    label: 'Post Status',
    type: 'select',
    required: false,
    isContentField: false,
    aliases: ['status', 'post_status', 'state', 'published'],
    defaultValue: 'draft',
    options: ['draft', 'published'],
  },
];

/** Areas We Serve page fields */
export const areaFields: TemplateField[] = [
  {
    key: 'title',
    label: 'Page Title',
    type: 'text',
    required: true,
    isContentField: false,
    aliases: ['title', 'page_title', 'name', 'heading', 'area_name', 'location', 'city'],
  },
  {
    key: 'slug',
    label: 'URL Slug',
    type: 'slug',
    required: true,
    isContentField: false,
    aliases: ['slug', 'url', 'url_path', 'permalink', 'path', 'page_url', 'post_name', 'url_slug'],
  },
  {
    key: 'hero_tagline',
    label: 'Hero Tagline',
    type: 'text',
    required: false,
    isContentField: false,
    aliases: ['tagline', 'hero_tagline', 'subtitle', 'subheading', 'hero_subtitle'],
  },
  {
    key: 'body',
    label: 'Introduction Content',
    type: 'html',
    required: false,
    isContentField: true,
    aliases: ['body', 'content', 'intro', 'introduction', 'main_content', 'page_content', 'post_content', 'text', 'html', 'description', 'full_content'],
  },
  {
    key: 'why_body',
    label: 'Why Choose Us Content',
    type: 'html',
    required: false,
    isContentField: true,
    aliases: ['why_body', 'why_content', 'why_us', 'why_choose', 'why_choose_us', 'reasons'],
  },
  {
    key: 'closing_body',
    label: 'Closing Section Content',
    type: 'html',
    required: false,
    isContentField: true,
    aliases: ['closing_body', 'closing_content', 'closing', 'contact_section', 'cta_body'],
  },
  {
    key: 'meta_title',
    label: 'Meta Title',
    type: 'text',
    required: false,
    isContentField: false,
    aliases: ['meta_title', 'seo_title', 'page_title_seo', 'title_tag', 'og_title'],
  },
  {
    key: 'meta_description',
    label: 'Meta Description',
    type: 'text',
    required: false,
    isContentField: false,
    aliases: ['meta_description', 'seo_description', 'page_description', 'description_tag', 'og_description', 'excerpt'],
  },
  {
    key: 'canonical_url',
    label: 'Canonical URL',
    type: 'url',
    required: false,
    isContentField: false,
    aliases: ['canonical_url', 'canonical', 'canonical_link'],
  },
  {
    key: 'og_image',
    label: 'OG Image',
    type: 'url',
    required: false,
    isContentField: false,
    aliases: ['og_image', 'social_image', 'share_image', 'twitter_image', 'featured_image', 'image'],
  },
  {
    key: 'status',
    label: 'Page Status',
    type: 'select',
    required: false,
    isContentField: false,
    aliases: ['status', 'page_status', 'state', 'published'],
    defaultValue: 'draft',
    options: ['draft', 'published'],
  },
];

/**
 * Get the template field definitions for a given template type.
 */
export function getTemplateFields(templateType: TemplateType): TemplateField[] {
  switch (templateType) {
    case 'practice':
      return practiceFields;
    case 'post':
      return postFields;
    case 'area':
      return areaFields;
    default:
      return [];
  }
}

/**
 * Get the content field keys for a template type.
 * These are the fields that need HTML normalization.
 */
export function getContentFieldKeys(templateType: TemplateType): string[] {
  return getTemplateFields(templateType)
    .filter((f) => f.isContentField)
    .map((f) => f.key);
}

/**
 * Get required field keys for a template type.
 */
export function getRequiredFieldKeys(templateType: TemplateType): string[] {
  return getTemplateFields(templateType)
    .filter((f) => f.required)
    .map((f) => f.key);
}
