import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import type { Database } from '../client/lib/database.types';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// siteUrl resolved after fetching DB settings below

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.log('Supabase credentials not configured. Skipping SSG generation.');
  console.log('To enable SSG, set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(0);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);

interface Page {
  id: string;
  title: string;
  url_path: string;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  noindex: boolean;
  updated_at: string;
}

interface Redirect {
  from_path: string;
  to_path: string;
  status_code: number;
}

interface SiteSettings {
  site_url: string | null;
  site_noindex: boolean;
  ga4_measurement_id: string | null;
  google_ads_id: string | null;
  google_ads_conversion_label: string | null;
  head_scripts: string | null;
  footer_scripts: string | null;
}

async function generateSSG() {
  console.log('Starting SSG generation...');

  // 0. Fetch site settings for analytics and scripts
  const { data: siteSettingsData } = await supabase
    .from('site_settings')
    .select('site_url, site_noindex, ga4_measurement_id, google_ads_id, google_ads_conversion_label, head_scripts, footer_scripts')
    .eq('settings_key', 'global')
    .single();

  const siteSettings: SiteSettings = siteSettingsData || {
    site_url: null,
    site_noindex: false,
    ga4_measurement_id: null,
    google_ads_id: null,
    google_ads_conversion_label: null,
    head_scripts: null,
    footer_scripts: null,
  };

  // Resolve site URL: env var takes priority, then CMS setting, then warn
  const siteUrl = process.env.SITE_URL || siteSettings.site_url || '';
  if (!siteUrl) {
    console.warn('[SSG] No SITE_URL configured — canonical URLs and sitemap will be incomplete.');
  }

  console.log('Site settings loaded:', {
    siteNoindex: siteSettings.site_noindex,
    hasGA4: !!siteSettings.ga4_measurement_id,
    hasGoogleAds: !!siteSettings.google_ads_id,
    hasHeadScripts: !!siteSettings.head_scripts,
    hasFooterScripts: !!siteSettings.footer_scripts,
  });

  // 1. Fetch all published pages
  const { data: pages, error: pagesError } = await supabase
    .from('pages')
    .select('id, title, url_path, meta_title, meta_description, canonical_url, og_title, og_description, og_image, noindex, updated_at')
    .eq('status', 'published');

  if (pagesError) {
    console.error('Error fetching pages:', pagesError);
    process.exit(1);
  }

  console.log(`Found ${pages?.length || 0} published pages`);

  // 1b. Fetch all published blog posts
  const { data: blogPosts, error: postsError } = await supabase
    .from('posts')
    .select('id, title, slug, meta_title, meta_description, canonical_url, og_title, og_description, og_image, noindex, updated_at')
    .eq('status', 'published');

  if (postsError) {
    console.error('Error fetching blog posts:', postsError);
  }

  console.log(`Found ${blogPosts?.length || 0} published blog posts`);

  // 2. Read the SPA index.html as template
  const templatePath = path.join(process.cwd(), 'dist/spa/index.html');
  if (!fs.existsSync(templatePath)) {
    console.error('Template not found at dist/spa/index.html. Run build:client first.');
    process.exit(1);
  }

  const template = fs.readFileSync(templatePath, 'utf-8');

  // 3. For each page, generate static HTML with SEO meta tags
  for (const page of pages || []) {
    const html = generatePageHTML(template, page, siteSettings, siteUrl);
    
    let outputPath: string;
    if (page.url_path === '/') {
      outputPath = path.join(process.cwd(), 'dist/spa/index.html');
    } else {
      const pagePath = page.url_path.startsWith('/') ? page.url_path.slice(1) : page.url_path;
      outputPath = path.join(process.cwd(), 'dist/spa', pagePath, 'index.html');
    }
    
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, html);
    console.log(`Generated: ${page.url_path}`);
  }

  // 3b. Generate static HTML for blog posts
  for (const post of blogPosts || []) {
    const postSlug = post.slug.endsWith('/') ? post.slug : `${post.slug}/`;
    const postUrlPath = `/${postSlug}`;
    const postPage: Page = {
      id: post.id,
      title: post.title,
      url_path: postUrlPath,
      meta_title: post.meta_title,
      meta_description: post.meta_description,
      canonical_url: post.canonical_url,
      og_title: post.og_title,
      og_description: post.og_description,
      og_image: post.og_image,
      noindex: post.noindex,
      updated_at: post.updated_at,
    };
    const html = generatePageHTML(template, postPage, siteSettings, siteUrl);
    const outputPath = path.join(process.cwd(), 'dist/spa', postSlug, 'index.html');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, html);
    console.log(`Generated: ${postUrlPath}`);
  }

  // 4. Fetch and generate _redirects
  const { data: redirects, error: redirectsError } = await supabase
    .from('redirects')
    .select('from_path, to_path, status_code')
    .eq('enabled', true);

  // Build blog post trailing-slash redirects
  const blogTrailingSlashRules = (blogPosts || [])
    .map(p => {
      const postSlug = p.slug.endsWith('/') ? p.slug : `${p.slug}/`;
      const withSlash = `/${postSlug}`;
      const withoutSlash = withSlash.slice(0, -1);
      return `${withoutSlash} ${withSlash} 301`;
    })
    .join('\n');

  // Build per-page trailing-slash redirects (e.g. /about -> /about/ 301)
  const trailingSlashRules = (pages || [])
    .filter(p => p.url_path !== '/')
    .map(p => {
      // Ensure the stored path has a trailing slash; derive non-slash version
      const withSlash = p.url_path.endsWith('/') ? p.url_path : `${p.url_path}/`;
      const withoutSlash = withSlash.slice(0, -1);
      return `${withoutSlash} ${withSlash} 301`;
    })
    .join('\n');

  const userRedirects = (redirects && !redirectsError)
    ? redirects.map((r: Redirect) => `${r.from_path} ${r.to_path} ${r.status_code}`).join('\n')
    : '';

  const fullRedirectsContent = [
    '# Trailing-slash enforcement',
    trailingSlashRules,
    blogTrailingSlashRules ? `\n# Blog trailing-slash enforcement\n${blogTrailingSlashRules}` : '',
    userRedirects ? `\n# Custom redirects\n${userRedirects}` : '',
    '\n/* /index.html 200',
  ].filter(Boolean).join('\n');

  fs.writeFileSync(path.join(process.cwd(), 'dist/spa/_redirects'), fullRedirectsContent);
  console.log(`Generated _redirects with ${(pages || []).length} trailing-slash rules + ${(redirects || []).length} custom redirects`);

  if (redirectsError) {
    console.error('Error fetching redirects (custom rules skipped):', redirectsError);
  }

  // 5. Generate sitemap.xml (only if site is indexable)
  if (!siteSettings.site_noindex) {
    // Combine pages and blog posts for sitemap
    const allPages: Page[] = [
      ...(pages || []),
      ...(blogPosts || []).map(p => ({
        id: p.id,
        title: p.title,
        url_path: `/${p.slug.endsWith('/') ? p.slug : p.slug + '/'}`,
        meta_title: p.meta_title,
        meta_description: p.meta_description,
        canonical_url: p.canonical_url,
        og_title: p.og_title,
        og_description: p.og_description,
        og_image: p.og_image,
        noindex: p.noindex,
        updated_at: p.updated_at,
      })),
    ];
    const sitemap = generateSitemap(allPages, siteUrl);
    fs.writeFileSync(path.join(process.cwd(), 'dist/spa/sitemap.xml'), sitemap);
    console.log('Generated sitemap.xml');
  } else {
    // Remove sitemap if it exists when site is noindex
    const sitemapPath = path.join(process.cwd(), 'dist/spa/sitemap.xml');
    if (fs.existsSync(sitemapPath)) {
      fs.unlinkSync(sitemapPath);
    }
    console.log('Skipped sitemap.xml (site is noindex)');
  }

  // 6. Generate robots.txt (conditional based on site_noindex)
  let robotsTxt: string;
  if (siteSettings.site_noindex) {
    // Block all crawlers when site is noindex
    robotsTxt = `User-agent: *
Disallow: /`;
    console.log('Generated robots.txt with Disallow (site is noindex)');
  } else {
    // Allow crawlers and reference sitemap
    robotsTxt = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml`;
    console.log('Generated robots.txt with Allow');
  }
  fs.writeFileSync(path.join(process.cwd(), 'dist/spa/robots.txt'), robotsTxt);

  console.log('SSG generation complete!');
}

function generatePageHTML(template: string, page: Page, siteSettings: SiteSettings, siteUrl: string): string {
  const title = page.meta_title || page.title;
  const description = page.meta_description || '';
  const normalizedPath = page.url_path === '/' ? '/' : page.url_path.replace(/\/?$/, '/');
  let canonical = page.canonical_url || `${siteUrl}${normalizedPath}`;
  // Ensure trailing slash on canonical URL
  if (canonical && !canonical.endsWith('/')) {
    canonical = canonical + '/';
  }
  const ogTitle = page.og_title || title;
  const ogDescription = page.og_description || description;
  
  const metaTags = `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${escapeHtml(canonical)}">
    <meta property="og:title" content="${escapeHtml(ogTitle)}">
    <meta property="og:description" content="${escapeHtml(ogDescription)}">
    <meta property="og:url" content="${escapeHtml(canonical)}">
    <meta property="og:type" content="website">
    ${page.og_image ? `<meta property="og:image" content="${escapeHtml(page.og_image)}">` : ''}
    ${page.noindex || siteSettings.site_noindex ? '<meta name="robots" content="noindex, nofollow">' : ''}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(ogTitle)}">
    <meta name="twitter:description" content="${escapeHtml(ogDescription)}">
    ${page.og_image ? `<meta name="twitter:image" content="${escapeHtml(page.og_image)}">` : ''}
  `;

  // Generate analytics scripts
  let analyticsScripts = '';

  // GA4 Script
  if (siteSettings.ga4_measurement_id) {
    analyticsScripts += `
    <!-- Google Analytics 4 -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${escapeHtml(siteSettings.ga4_measurement_id)}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${escapeHtml(siteSettings.ga4_measurement_id)}');
    </script>`;
  }

  // Google Ads Script
  if (siteSettings.google_ads_id) {
    // Only add gtag.js if not already added by GA4
    if (!siteSettings.ga4_measurement_id) {
      analyticsScripts += `
    <!-- Google Ads -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${escapeHtml(siteSettings.google_ads_id)}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
    </script>`;
    }
    analyticsScripts += `
    <script>
      gtag('config', '${escapeHtml(siteSettings.google_ads_id)}');
    </script>`;
  }

  // Custom head scripts
  const customHeadScripts = siteSettings.head_scripts || '';

  // Custom footer scripts
  const customFooterScripts = siteSettings.footer_scripts || '';
  
  // Replace the existing <title> tag and inject our meta tags before </head>
  let html = template.replace(/<title>.*?<\/title>/, '');

  // Inject meta tags, analytics, and custom head scripts before </head>
  const headInjection = `${metaTags}\n${analyticsScripts}\n${customHeadScripts}\n`;
  html = html.replace('</head>', `${headInjection}</head>`);

  // Inject custom footer scripts before </body>
  if (customFooterScripts) {
    html = html.replace('</body>', `${customFooterScripts}\n</body>`);
  }

  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateSitemap(pages: Page[], siteUrl: string): string {
  const urls = pages
    .filter(p => !p.noindex)
    .map(p => {
      const normalizedPath = p.url_path === '/' ? '/' : p.url_path.replace(/\/?$/, '/');
      return `  <url>
    <loc>${siteUrl}${normalizedPath}</loc>
    <lastmod>${new Date(p.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${p.url_path === '/' ? '1.0' : '0.8'}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

generateSSG().catch(err => {
  console.error('SSG generation failed:', err);
  process.exit(1);
});
