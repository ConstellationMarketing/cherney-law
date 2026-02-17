import { Helmet } from 'react-helmet-async';

interface SeoProps {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  noindex?: boolean;
}

export default function Seo({ 
  title, 
  description, 
  canonical, 
  image, 
  noindex = false 
}: SeoProps) {
  // In production SSG builds, meta tags are already in static HTML
  // Only use Helmet in dev mode or if SSG didn't run
  const isProduction = import.meta.env.PROD;
  const hasPrerenderedMeta = typeof document !== 'undefined' &&
    document.querySelector('meta[name="description"]')?.getAttribute('content');

  // Skip Helmet if production and meta tags already exist
  if (isProduction && hasPrerenderedMeta) {
    return null;
  }

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      {canonical && <meta property="og:url" content={canonical} />}
      {image && <meta property="og:image" content={image} />}
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  );
}
