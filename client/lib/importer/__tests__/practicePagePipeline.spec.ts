import { describe, it, expect } from 'vitest';
import { parseCsv } from '../csvParser';
import { parseJson } from '../apiParser';
import { cleanSourceRecords } from '../sourceCleaner';
import { extractMainContent, filterSecondaryContent } from '../contentFilter';
import { normalizeHtml } from '../htmlNormalizer';
import { autoMapFields } from '../autoMapper';
import { applyFieldMapping } from '../fieldMapping';
import { prepareRecord, normalizeUrlSlug, resolveImportPath } from '../preparer';
import { splitBodyOnH2 } from '../splitBodyOnH2';
import { validateRecord } from '../validator';
import type { FilterOptions, SourceRecord } from '../types';

const defaultFilterOptions: FilterOptions = {
  removeContactBlocks: true,
  removePostListings: true,
  removeSidebarWidgets: true,
  removeNewsletterBlocks: true,
  removeCommentSections: true,
  removeFormBlocks: true,
  linkDensityThreshold: 0.6,
};

// ─── 1. Auto-mapping ────────────────────────────────────────────────────────

describe('Auto-mapping', () => {
  it('maps common column names to practice template fields', () => {
    const columns = [
      { name: 'title', sampleValues: ['Car Accident'], detectedType: 'text' as const },
      { name: 'content', sampleValues: ['<p>Lorem...</p>'], detectedType: 'html' as const },
      { name: 'permalink', sampleValues: ['/practice-areas/car-accident/'], detectedType: 'url' as const },
      { name: 'seo_title', sampleValues: ['Car Accident Lawyer'], detectedType: 'text' as const },
    ];

    const result = autoMapFields(columns, 'practice');

    expect(result.mappings.find((m) => m.sourceColumn === 'title')?.targetField).toBe('title');
    expect(result.mappings.find((m) => m.sourceColumn === 'content')?.targetField).toBe('body');
    expect(result.mappings.find((m) => m.sourceColumn === 'permalink')?.targetField).toBe('slug');
    expect(result.mappings.find((m) => m.sourceColumn === 'seo_title')?.targetField).toBe('meta_title');
  });

  it('maps OG and Twitter metadata images to the intended practice fields', () => {
    const columns = [
      { name: 'metadata.og:image', sampleValues: ['https://example.com/hero.jpg'], detectedType: 'url' as const },
      { name: 'metadata.twitter:image', sampleValues: ['https://example.com/og.jpg'], detectedType: 'url' as const },
    ];

    const result = autoMapFields(columns, 'practice');

    expect(result.mappings.find((m) => m.sourceColumn === 'metadata.og:image')?.targetField).toBe('hero_image');
    expect(result.mappings.find((m) => m.sourceColumn === 'metadata.twitter:image')?.targetField).toBe('og_image');
  });

  it('maps blog post column names correctly', () => {
    const columns = [
      { name: 'post_title', sampleValues: ['My Post'], detectedType: 'text' as const },
      { name: 'post_content', sampleValues: ['<p>Body</p>'], detectedType: 'html' as const },
      { name: 'post_excerpt', sampleValues: ['Summary'], detectedType: 'text' as const },
      { name: 'featured_image', sampleValues: ['https://img.com/photo.jpg'], detectedType: 'url' as const },
    ];

    const result = autoMapFields(columns, 'post');

    expect(result.mappings.find((m) => m.sourceColumn === 'post_title')?.targetField).toBe('title');
    expect(result.mappings.find((m) => m.sourceColumn === 'post_content')?.targetField).toBe('body');
    expect(result.mappings.find((m) => m.sourceColumn === 'post_excerpt')?.targetField).toBe('excerpt');
  });
});

// ─── 2. Field mapping ───────────────────────────────────────────────────────

describe('Field mapping', () => {
  it('maps source data to target fields correctly', () => {
    const records: SourceRecord[] = [
      { rowIndex: 0, data: { title: 'Test Page', body: '<p>Content</p>', url: '/test/' } },
    ];
    const config = autoMapFields(
      [
        { name: 'title', sampleValues: ['Test'], detectedType: 'text' as const },
        { name: 'body', sampleValues: ['<p>'], detectedType: 'html' as const },
        { name: 'url', sampleValues: ['/test/'], detectedType: 'url' as const },
      ],
      'practice'
    );

    const mapped = applyFieldMapping(records, config);

    expect(mapped[0].mappedData.title).toBe('Test Page');
    expect(mapped[0].mappedData.body).toBe('<p>Content</p>');
    expect(mapped[0].mappedData.slug).toBe('/test/');
  });
});

// ─── 3. Source cleaning ─────────────────────────────────────────────────────

describe('Source cleaning', () => {
  it('strips shortcode tags but preserves content between them', () => {
    const records: SourceRecord[] = [{
      rowIndex: 0,
      data: {
        body: '[et_pb_section][et_pb_row][et_pb_column]<p>Real content</p>[/et_pb_column][/et_pb_row][/et_pb_section]',
      },
    }];

    const cleaned = cleanSourceRecords(records, ['body']);
    expect(cleaned[0].data.body).toContain('Real content');
    expect(cleaned[0].data.body).not.toContain('[et_pb_');
    expect(cleaned[0].data.body).not.toContain('[/et_pb_');
  });

  it('fixes mojibake encoding', () => {
    const records: SourceRecord[] = [{
      rowIndex: 0,
      data: { title: 'Itâ€™s a testâ€"really' },
    }];

    const cleaned = cleanSourceRecords(records, []);
    expect(cleaned[0].data.title).toBe("It's a test—really");
  });

  it('normalizes whitespace in HTML content', () => {
    const records: SourceRecord[] = [{
      rowIndex: 0,
      data: { body: '<p>  Multiple   spaces  </p>   <p>  here  </p>' },
    }];

    const cleaned = cleanSourceRecords(records, ['body']);
    expect(cleaned[0].data.body).not.toMatch(/  /); // No double spaces
  });
});

// ─── 4. Content extraction ──────────────────────────────────────────────────

describe('Content extraction', () => {
  it('strips page shell (DOCTYPE, html, head, body, script, style)', () => {
    const html = `<!DOCTYPE html><html><head><title>Test</title><style>.x{}</style></head><body><p>Content</p><script>alert(1)</script></body></html>`;
    const result = extractMainContent(html);

    expect(result).toContain('Content');
    expect(result).not.toContain('DOCTYPE');
    expect(result).not.toContain('<head');
    expect(result).not.toContain('<script');
    expect(result).not.toContain('<style');
  });

  it('unwraps builder layout divs', () => {
    const html = `<div class="et_pb_section"><div class="et_pb_row"><div class="et_pb_column"><p>Content here</p></div></div></div>`;
    const result = extractMainContent(html);

    expect(result).toContain('Content here');
    // After unwrapping + attribute stripping, no builder classes should remain
    expect(result).not.toContain('et_pb_');
  });
});

// ─── 5. Bare div handling ───────────────────────────────────────────────────

describe('Bare div handling', () => {
  it('unwraps deeply nested bare divs', () => {
    const html = `<div><div><div><p>Deep content</p></div></div></div>`;
    const result = extractMainContent(html);

    expect(result).toContain('Deep content');
    // Bare divs should be unwrapped
    expect(result).not.toMatch(/<div>\s*<div>/);
  });

  it('removes bare divs that become empty after unwrapping', () => {
    const html = `<div><div></div></div><p>Keep this</p>`;
    const result = extractMainContent(html);

    expect(result).toContain('Keep this');
  });
});

// ─── 6. Builder class preservation ──────────────────────────────────────────

describe('Builder class preservation', () => {
  it('preserves builder classes through source cleaning (stages 1-4)', () => {
    const records: SourceRecord[] = [{
      rowIndex: 0,
      data: {
        body: '<div class="et_pb_section"><div class="et_pb_row"><p>Content</p></div></div>',
      },
    }];

    // Stages 1-4 should NOT strip CSS classes
    const cleaned = cleanSourceRecords(records, ['body']);
    expect(cleaned[0].data.body).toContain('et_pb_section');
    expect(cleaned[0].data.body).toContain('et_pb_row');
  });
});

// ─── 7. Secondary content filtering ─────────────────────────────────────────

describe('Secondary content filtering', () => {
  it('removes sidebar widgets', () => {
    const html = `<h2>Main Content</h2><p>Good content here with enough text to pass while also clearly representing a substantive editorial paragraph that should remain after secondary filtering runs.</p><h2>Sidebar</h2><div class="widget sidebar"><ul><li>Link 1</li></ul></div>`;
    const result = filterSecondaryContent(html, defaultFilterOptions);

    expect(result).toContain('Main Content');
    expect(result).not.toContain('widget sidebar');
  });

  it('removes CTA / contact blocks', () => {
    const html = `<h2>Content Section</h2><p>Real content about practice area laws and regulations.</p><h2>Free Consultation</h2><p>Call us now for a free case review! <a href="tel:555-1234">555-1234</a></p>`;
    const result = filterSecondaryContent(html, defaultFilterOptions);

    expect(result).toContain('Content Section');
    expect(result).not.toContain('Free Consultation');
  });
});

// ─── 8. Sub-section stripping ───────────────────────────────────────────────

describe('Sub-section stripping', () => {
  it('strips h3-h6 secondary headings inside H2 blocks', () => {
    const html = `<h2>Main Topic</h2><p>Content about the main topic with enough detail to remain a meaningful editorial section after the secondary widget subsection is stripped away.</p><h3>Recent Posts</h3><ul><li><a href="/post1">Post 1</a></li><li><a href="/post2">Post 2</a></li></ul><p>More real content.</p>`;
    const result = filterSecondaryContent(html, defaultFilterOptions);

    expect(result).toContain('Main Topic');
    expect(result).toContain('Content about the main topic');
    expect(result).not.toContain('Recent Posts');
  });
});

// ─── 9. Link-list detection ─────────────────────────────────────────────────

describe('Link-list detection', () => {
  it('catches <ul> blog-roll patterns as post listings', () => {
    const html = `<h2>Blog Posts</h2><ul><li><a href="/post1">Post 1</a></li><li><a href="/post2">Post 2</a></li><li><a href="/post3">Post 3</a></li><li><a href="/post4">Post 4</a></li></ul>`;
    const result = filterSecondaryContent(html, defaultFilterOptions);

    // Should be removed as a post listing
    expect(result).not.toContain('Blog Posts');
  });
});

// ─── 10. Empty element cleanup ──────────────────────────────────────────────

describe('Empty element cleanup', () => {
  it('removes cascading empty elements', () => {
    const html = `<div><div><span></span></div></div><p>This is a paragraph with enough text to pass the content quality threshold for filtering.</p>`;
    const result = normalizeHtml(html, defaultFilterOptions);

    expect(result).toContain('enough text to pass');
    expect(result).not.toMatch(/<div>\s*<\/div>/);
    expect(result).not.toMatch(/<span>\s*<\/span>/);
  });
});

// ─── 11. H2 splitting ──────────────────────────────────────────────────────

describe('H2 splitting', () => {
  it('splits body into named content sections', () => {
    const html = `<p>Intro text</p><h2>Section One</h2><p>First section content.</p><h2>Section Two</h2><p>Second section content.</p>`;
    const sections = splitBodyOnH2(html);

    expect(sections.length).toBe(3); // Intro + 2 sections
    expect(sections[0].heading).toBe(''); // Intro has no heading
    expect(sections[1].heading).toBe('Section One');
    expect(sections[2].heading).toBe('Section Two');
    expect(sections[1].body).toContain('First section content');
    expect(sections[2].body).toContain('Second section content');
  });
});

// ─── 12. FAQ extraction ─────────────────────────────────────────────────────

describe('FAQ extraction', () => {
  it('extracts Q&A patterns from content', () => {
    const mappedRecord = {
      rowIndex: 0,
      sourceData: {},
      mappedData: {
        title: 'Test',
        slug: 'test',
        body: `<h2>FAQ</h2><h3>What is personal injury?</h3><p>Personal injury is...</p><h3>How long do I have to file?</h3><p>The statute of limitations...</p>`,
      },
    };

    const prepared = prepareRecord(mappedRecord, 'practice');

    expect(prepared.faqItems).toBeDefined();
    expect(prepared.faqItems!.length).toBe(2);
    expect(prepared.faqItems![0].question).toContain('personal injury');
    expect(prepared.faqItems![1].question).toContain('file');
  });
});

describe('Area heading normalization', () => {
  it('keeps promoted section headings out of intro, why, and closing bodies', () => {
    const prepared = prepareRecord({
      rowIndex: 0,
      sourceData: {},
      mappedData: {
        title: 'Cobb County Personal Injury Lawyer',
        slug: '/areas-we-serve/cobb-county/',
        body: '<p>Lead intro.</p><h2>Introduction Title</h2><p>Intro body with enough words to stay in its own section and avoid the short block merge heuristic during allocation for this regression test, while also proving the promoted heading is removed from the body without affecting the remaining introduction copy that follows it.</p><h2>Why Title</h2><p>Why body with enough words to remain separated from the introduction and prove that duplicate section headings are stripped only from the promoted section start.</p><h2>Closing Title</h2><p>Closing body with enough words to stay independent and verify the allocator keeps the structured heading while removing the duplicate opening body heading.</p>',
      },
    }, 'area');

    const content = (prepared.data as { content: any }).content;

    expect(content.introSection.heading).toBe('Introduction Title');
    expect(content.introSection.body).toContain('<p>Lead intro.</p>');
    expect(content.introSection.body).toContain('Intro body with enough words');
    expect(content.introSection.body).not.toContain('<h2>Introduction Title</h2>');

    expect(content.whySection.heading).toBe('Why Title');
    expect(content.whySection.body).toContain('Why body with enough words');
    expect(content.whySection.body).not.toContain('<h2>Why Title</h2>');

    expect(content.closingSection.heading).toBe('Closing Title');
    expect(content.closingSection.body).toContain('Closing body with enough words');
    expect(content.closingSection.body).not.toContain('<h2>Closing Title</h2>');
  });

  it('promotes opening H4 headings while preserving later body headings', () => {
    const prepared = prepareRecord({
      rowIndex: 0,
      sourceData: {},
      mappedData: {
        title: 'Roswell DUI Lawyer',
        slug: '/areas-we-serve/roswell/',
        __ai_split_mode: 'true',
        body: '<h4>Introduction Title</h4><p>Intro copy with enough words to avoid the allocator folding the next section into intro while still preserving the later nested heading inside the body content for this regression case.</p><h4>Nested body heading</h4><p>Nested body copy.</p>',
        why_body: '<h3>Why Title</h3><p>Why copy with enough words to remain its own section and verify opening headings are promoted without being duplicated in the body content during import.</p>',
        closing_body: '<h4>Closing Title</h4><p>Closing copy with enough words to remain independent and verify the promoted H4 is not duplicated inside the closing body.</p>',
      },
    }, 'area');

    const content = (prepared.data as { content: any }).content;
    const contentSections = prepared.contentSections ?? [];

    expect(content.introSection.heading).toBe('Introduction Title');
    expect(content.introSection.headingLevel).toBe(4);
    expect(content.introSection.body).not.toContain('<h4>Introduction Title</h4>');
    expect(content.introSection.body).toContain('<h4>Nested body heading</h4>');

    expect(content.whySection.heading).toBe('Why Title');
    expect(content.whySection.headingLevel).toBe(3);
    expect(content.whySection.body).not.toContain('<h3>Why Title</h3>');

    expect(content.closingSection.heading).toBe('Closing Title');
    expect(content.closingSection.headingLevel).toBe(4);
    expect(content.closingSection.body).not.toContain('<h4>Closing Title</h4>');

    expect(contentSections[0].headingLevel).toBe(4);
    expect(contentSections[0].headingTag).toBe('<h4>Introduction Title</h4>');
  });

  it('rebuilds practice content with the original promoted heading level', () => {
    const prepared = prepareRecord({
      rowIndex: 0,
      sourceData: {},
      mappedData: {
        title: 'DUI Defense',
        slug: '/practice-areas/dui-defense/',
        body: '<h4>Case Strategy</h4><p>Detailed defense content.</p>',
      },
    }, 'practice');

    const content = (prepared.data as { content: { contentSections: Array<{ body: string }> } }).content;

    expect(prepared.contentSections?.[0].heading).toBe('Case Strategy');
    expect(prepared.contentSections?.[0].headingLevel).toBe(4);
    expect(prepared.contentSections?.[0].headingTag).toBe('<h4>Case Strategy</h4>');
    expect(content.contentSections[0].body).toContain('<h4>Case Strategy</h4>');
    expect(content.contentSections[0].body).toContain('<p>Detailed defense content.</p>');
  });
});

describe('Practice deterministic section parsing', () => {
  it('merges pre-H2 intro into the first real practice section without creating a standalone intro section', () => {
    const prepared = prepareRecord({
      rowIndex: 0,
      sourceData: {},
      mappedData: {
        title: 'Truck Accidents',
        slug: '/practice-areas/truck-accidents/',
        body: '<p>Lead intro copy that should stay with the first section.</p><h2>Liability Issues</h2><p>First section body copy with enough detail to remain meaningful.</p><h2>Damages</h2><p>Second section body copy.</p>',
      },
    }, 'practice');

    const content = (prepared.data as { content: { contentSections: Array<{ body: string }> } }).content;

    expect(content.contentSections).toHaveLength(2);
    expect(content.contentSections[0].body).toContain('<p>Lead intro copy that should stay with the first section.</p>');
    expect(content.contentSections[0].body).toContain('<h2>Liability Issues</h2>');
    expect(content.contentSections[0].body).toContain('First section body copy');
    expect(content.contentSections[1].body).toContain('<h2>Damages</h2>');
  });

  it('extracts FAQ sections before practice section allocation', () => {
    const prepared = prepareRecord({
      rowIndex: 0,
      sourceData: {},
      mappedData: {
        title: 'Slip and Fall',
        slug: '/practice-areas/slip-and-fall/',
        body: '<h2>Overview</h2><p>Premises liability overview content.</p><h2>FAQ</h2><h3>What damages can I recover?</h3><p>Medical bills and lost wages may be available.</p><h3>How long do I have to sue?</h3><p>The filing deadline depends on the claim.</p>',
      },
    }, 'practice');

    const content = (prepared.data as { content: { contentSections: Array<{ body: string }> } }).content;

    expect(prepared.faqItems).toHaveLength(2);
    expect(content.contentSections).toHaveLength(1);
    expect(content.contentSections[0].body).toContain('<h2>Overview</h2>');
    expect(content.contentSections[0].body).not.toContain('<h2>FAQ</h2>');
    expect(content.contentSections[0].body).not.toContain('What damages can I recover?');
  });

  it('uses paragraph fallback chunks, preserves H4 headings, and extracts only the first image per practice section', () => {
    const prepared = prepareRecord({
      rowIndex: 0,
      sourceData: {},
      mappedData: {
        title: 'Wrongful Death',
        slug: '/practice-areas/wrongful-death/',
        body: '<h4>Case Strategy</h4><p>Our attorneys investigate liability, preserve evidence, and prepare a case strategy that explains what happened, who is responsible, and how the family can pursue financial recovery after a fatal accident.</p><img src="https://example.com/strategy.jpg" alt="Case strategy" /><p>We also coordinate experts, gather medical records, and document the full losses affecting surviving family members.</p><img src="https://example.com/secondary.jpg" alt="Secondary" /><h4>Damages Analysis</h4><p>Damages may include income loss, funeral expenses, companionship losses, and other measurable harm recognized by state law.</p><p>Each category is evaluated carefully so the claim reflects the real impact on the family.</p>',
      },
    }, 'practice');

    const content = (prepared.data as { content: { contentSections: Array<{ body: string; image?: string }> } }).content;

    expect(content.contentSections.length).toBeGreaterThanOrEqual(2);
    expect(content.contentSections[0].body).toContain('<h4>Case Strategy</h4>');
    expect(content.contentSections[0].body).not.toContain('<img');
    expect(content.contentSections[0].image).toBe('https://example.com/strategy.jpg');
    expect(content.contentSections[1].body).toContain('<h4>Damages Analysis</h4>');
    expect(content.contentSections[1].body).not.toContain('<img');
  });

  it('removes recent-posts style sub-sections from practice body content', () => {
    const prepared = prepareRecord({
      rowIndex: 0,
      sourceData: {},
      mappedData: {
        title: 'Motorcycle Accidents',
        slug: '/practice-areas/motorcycle-accidents/',
        body: '<h2>What Causes Motorcycle Crashes</h2><p>Driver inattention, unsafe lane changes, and speeding are common causes of severe motorcycle wrecks.</p><h3>Recent Posts</h3><ul><li><a href="/blog/post-1/">Post 1</a></li><li><a href="/blog/post-2/">Post 2</a></li><li><a href="/blog/post-3/">Post 3</a></li></ul><p>Evidence from the scene can help establish fault.</p>',
      },
    }, 'practice');

    const content = (prepared.data as { content: { contentSections: Array<{ body: string }> } }).content;

    expect(content.contentSections[0].body).toContain('What Causes Motorcycle Crashes');
    expect(content.contentSections[0].body).toContain('Evidence from the scene can help establish fault.');
    expect(content.contentSections[0].body).not.toContain('Recent Posts');
    expect(content.contentSections[0].body).not.toContain('/blog/post-1/');
  });
});

// ─── 13. URL slug normalization ─────────────────────────────────────────────

describe('URL slug normalization', () => {
  it('extracts slug from full URL', () => {
    const slug = normalizeUrlSlug('https://example.com/practice-areas/car-accident/', 'Car Accident', 'practice');
    expect(slug).toBe('car-accident');
  });

  it('extracts slug from multi-segment path', () => {
    const slug = normalizeUrlSlug('/services/legal/personal-injury/', 'Personal Injury', 'practice');
    expect(slug).toBe('personal-injury');
  });

  it('handles bare slug', () => {
    const slug = normalizeUrlSlug('car-accident-lawyer', 'Car Accident Lawyer', 'practice');
    expect(slug).toBe('car-accident-lawyer');
  });

  it('falls back to title when slug is empty', () => {
    const slug = normalizeUrlSlug('', 'Car Accident Lawyer', 'practice');
    expect(slug).toBe('car-accident-lawyer');
  });

  it('adds trailing slash for post slugs', () => {
    const slug = normalizeUrlSlug('my-post', 'My Post', 'post');
    expect(slug).toBe('my-post/');
  });

  it('preserves trailing slash in resolved practice paths', () => {
    const resolved = resolveImportPath('https://example.com/practice-areas/car-accident/', 'Car Accident', 'practice');
    expect(resolved.path).toBe('/practice-areas/car-accident/');
  });

  it('adds trailing slash to generated practice paths', () => {
    const resolved = resolveImportPath('car-accident', 'Car Accident', 'practice');
    expect(resolved.path).toBe('/practice-areas/car-accident/');
  });
});

// ─── 14. Validation ─────────────────────────────────────────────────────────

describe('Validation', () => {
  it('validates required fields', () => {
    const record = {
      rowIndex: 0,
      slug: '',
      data: { title: '', url_path: '' },
      sourceData: {},
    };

    const result = validateRecord(record, 'practice');

    expect(result.isValid).toBe(false);
    expect(result.errorCount).toBeGreaterThan(0);
    expect(result.issues.some((i) => i.field === 'slug')).toBe(true);
  });

  it('validates slug format', () => {
    const record = {
      rowIndex: 0,
      slug: 'valid-slug',
      data: { title: 'Test', url_path: '/practice-areas/valid-slug', content: { contentSections: [{ body: '<p>Content</p>' }] } },
      sourceData: {},
    };

    const result = validateRecord(record, 'practice');
    const slugIssues = result.issues.filter((i) => i.field === 'slug' && i.severity === 'error');
    expect(slugIssues.length).toBe(0);
  });

  it('warns about missing meta description', () => {
    const record = {
      rowIndex: 0,
      slug: 'test-page',
      data: {
        title: 'Test',
        url_path: '/practice-areas/test-page',
        meta_title: 'Test Page',
        meta_description: '',
        content: { contentSections: [{ body: '<p>Some content here for the page</p>' }] },
      },
      sourceData: {},
    };

    const result = validateRecord(record, 'practice');
    expect(result.issues.some((i) => i.field === 'meta_description' && i.severity === 'warning')).toBe(true);
  });
});

// ─── 15. Full pipeline integration ──────────────────────────────────────────

describe('Practice image allocation', () => {
  it('keeps hero background and OG image targets distinct in the prepared record', () => {
    const prepared = prepareRecord({
      rowIndex: 0,
      sourceData: {},
      mappedData: {
        title: 'Car Accident Lawyer',
        slug: '/practice-areas/car-accident/',
        body: '<p>Body content</p>',
        hero_image: 'https://example.com/hero.jpg',
        og_image: 'https://example.com/og.jpg',
      },
    }, 'practice');

    const data = prepared.data as {
      content: { hero: { backgroundImage: string } };
      og_image: string;
      url_path: string;
    };

    expect(data.content.hero.backgroundImage).toBe('https://example.com/hero.jpg');
    expect(data.og_image).toBe('https://example.com/og.jpg');
    expect(data.url_path).toBe('/practice-areas/car-accident/');
  });
});

describe('Full pipeline integration', () => {
  it('transforms raw Divi HTML into a clean CMS record', () => {
    const rawHtml = `
      <!DOCTYPE html>
      <html>
      <head><title>Test</title><style>.x{color:red}</style></head>
      <body>
      <nav><a href="/">Home</a></nav>
      [et_pb_section][et_pb_row][et_pb_column type="4_4"]
      <div class="et_pb_section">
        <div class="et_pb_row">
          <div class="et_pb_column">
            <h1>Car Accident Lawyer</h1>
            <p>If youâ€™ve been injured in a car accident, our experienced attorneys can help.</p>
            <h2>Types of Car Accidents</h2>
            <p>There are many types of car accidents including rear-end collisions, side-impact crashes, and head-on collisions.</p>
            <h2>What to Do After an Accident</h2>
            <p>First, seek medical attention. Then contact our law firm for a free consultation about your case.</p>
            <h3>Recent Posts</h3>
            <ul>
              <li><a href="/post1">Post 1</a></li>
              <li><a href="/post2">Post 2</a></li>
              <li><a href="/post3">Post 3</a></li>
            </ul>
            <h2>Free Consultation</h2>
            <p>Call us now! <a href="tel:555-1234">555-1234</a></p>
          </div>
        </div>
      </div>
      [/et_pb_column][/et_pb_row][/et_pb_section]
      <footer><p>Copyright 2024</p></footer>
      <script>console.log('test')</script>
      </body>
      </html>
    `;

    // Stage 1-4: Clean source
    const records: SourceRecord[] = [{ rowIndex: 0, data: { body: rawHtml, title: 'Car Accident Lawyer' } }];
    const cleaned = cleanSourceRecords(records, ['body']);

    // Builder classes should still be present after stages 1-4
    expect(cleaned[0].data.body).not.toContain('[et_pb_');

    // Stage 5: Normalize HTML
    const normalizedBody = normalizeHtml(cleaned[0].data.body, defaultFilterOptions);

    // Should not contain page shell elements
    expect(normalizedBody).not.toContain('DOCTYPE');
    expect(normalizedBody).not.toContain('<script');
    expect(normalizedBody).not.toContain('<style');
    expect(normalizedBody).not.toContain('<nav');
    expect(normalizedBody).not.toContain('<footer');

    // Should not contain builder class names
    expect(normalizedBody).not.toContain('et_pb_');

    // Should contain main content
    expect(normalizedBody).toContain('Types of Car Accidents');
    expect(normalizedBody).toContain('rear-end collisions');

    // Mojibake should be fixed (from source cleaning)
    expect(cleaned[0].data.title).toBe('Car Accident Lawyer');

    // Stage 8: Prepare record
    const mappedRecord = {
      rowIndex: 0,
      sourceData: { body: rawHtml, title: 'Car Accident Lawyer' },
      mappedData: {
        title: 'Car Accident Lawyer',
        slug: 'https://example.com/practice-areas/car-accident/',
        body: normalizedBody,
      },
    };

    const prepared = prepareRecord(mappedRecord, 'practice');

    // Slug should be normalized
    expect(prepared.slug).toBe('/practice-areas/car-accident/');

    // Should have content sections
    expect(prepared.contentSections).toBeDefined();
    expect(prepared.contentSections!.length).toBeGreaterThan(0);

    // CMS record should have proper structure
    const data = prepared.data as Record<string, unknown>;
    expect(data.title).toBe('Car Accident Lawyer');
    expect(data.url_path).toBe('/practice-areas/car-accident/');
    expect(data.page_type).toBe('practice_detail');
  });
});

// ─── CSV/JSON Parsing ───────────────────────────────────────────────────────

describe('CSV parsing', () => {
  it('parses CSV with headers and rows', () => {
    const csv = `title,content,slug\nCar Accident,"<p>Content here</p>",car-accident\nTruck Accident,"<p>More content</p>",truck-accident`;
    const result = parseCsv(csv);

    expect(result.records.length).toBe(2);
    expect(result.columns.length).toBe(3);
    expect(result.records[0].data.title).toBe('Car Accident');
    expect(result.records[1].data.slug).toBe('truck-accident');
  });

  it('handles quoted fields with commas', () => {
    const csv = `title,description\n"Hello, World","A test, with commas"`;
    const result = parseCsv(csv);

    expect(result.records[0].data.title).toBe('Hello, World');
    expect(result.records[0].data.description).toBe('A test, with commas');
  });
});

describe('JSON parsing', () => {
  it('parses JSON array', () => {
    const json = JSON.stringify([
      { title: 'Post 1', body: '<p>Content</p>' },
      { title: 'Post 2', body: '<p>More</p>' },
    ]);

    const result = parseJson(json);
    expect(result.records.length).toBe(2);
    expect(result.records[0].data.title).toBe('Post 1');
  });

  it('extracts nested arrays with jsonPath', () => {
    const json = JSON.stringify({
      data: {
        posts: [
          { title: 'Post 1' },
          { title: 'Post 2' },
        ],
      },
    });

    const result = parseJson(json, 'data.posts');
    expect(result.records.length).toBe(2);
  });
});
