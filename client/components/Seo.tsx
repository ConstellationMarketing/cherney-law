import { Helmet } from "@site/lib/helmet";
import { isProductionRuntime } from "@site/lib/runtime-env";

interface SeoProps {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  noindex?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  schemaType?: string | null;
  schemaData?: Record<string, unknown> | null;
  pageContent?: unknown;
}

export default function Seo({
  title,
  description,
  canonical,
  image,
  noindex = false,
  ogTitle,
  ogDescription,
  schemaType,
  schemaData,
  pageContent,
}: SeoProps) {
  const isProduction = isProductionRuntime();
  const hasPrerenderedMeta =
    typeof document !== "undefined" &&
    document.querySelector('meta[name="description"]')?.getAttribute("content");

  if (isProduction && hasPrerenderedMeta) {
    return null;
  }

  const resolvedOgTitle = ogTitle || title;
  const resolvedOgDescription = ogDescription || description;

  let jsonLd: Record<string, unknown> | null = null;
  if (schemaType) {
    jsonLd = {
      "@context": "https://schema.org",
      "@type": schemaType,
      ...schemaData,
    };
  }

  if (!jsonLd && pageContent) {
    const faqItems = extractFaqItems(pageContent);
    if (faqItems.length > 0) {
      jsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      };
    }
  }

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}
      <meta property="og:title" content={resolvedOgTitle} />
      <meta property="og:description" content={resolvedOgDescription} />
      <meta property="og:type" content="website" />
      {canonical && <meta property="og:url" content={canonical} />}
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={resolvedOgTitle} />
      <meta name="twitter:description" content={resolvedOgDescription} />
      {image && <meta name="twitter:image" content={image} />}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}

function extractFaqItems(
  content: unknown,
): { question: string; answer: string }[] {
  if (!content || typeof content !== "object") return [];
  const c = content as Record<string, unknown>;
  const faq = c.faq as Record<string, unknown> | undefined;
  if (!faq || !faq.enabled) return [];
  const items = faq.items;
  if (!Array.isArray(items)) return [];
  return items
    .filter((item: any) => item?.question && item?.answer)
    .map((item: any) => ({ question: item.question, answer: item.answer }));
}
