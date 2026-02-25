/**
 * Schema.org JSON-LD Helper Functions
 * Build structured data for various schema types
 */

/**
 * Parse schema types from raw database value
 * Handles: null, single string, JSON array string, or actual array
 */
export function parseSchemaTypes(raw: unknown): string[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Not JSON, treat as single string type
      return [raw];
    }
  }
  if (Array.isArray(raw)) return raw;
  return [];
}

export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Recursively extract FAQ items from page content
 * Looks for objects with 'question' and 'answer' string fields
 */
export function extractFaqItems(content: unknown): FAQItem[] {
  const items: FAQItem[] = [];

  function recurse(obj: unknown) {
    if (!obj) return;

    if (Array.isArray(obj)) {
      for (const item of obj) {
        // Check if this array item is a FAQ item
        if (
          typeof item === "object" &&
          item !== null &&
          "question" in item &&
          "answer" in item &&
          typeof item.question === "string" &&
          typeof item.answer === "string"
        ) {
          items.push({
            question: item.question,
            answer: item.answer,
          });
        }
        // Recurse into nested objects/arrays
        recurse(item);
      }
    } else if (typeof obj === "object" && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        // Check if this object is a FAQ item
        if (
          key === "question" ||
          key === "answer" ||
          key === "faq" ||
          key === "items"
        ) {
          recurse(value);
        } else {
          recurse(value);
        }
      }
    }
  }

  recurse(content);
  return items;
}

/**
 * Build FAQ Page schema
 */
export function buildFaqSchema(items: FAQItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/**
 * Build LocalBusiness schema
 */
export function buildLocalBusinessSchema(
  siteInfo: {
    name?: string;
    phone?: string;
    logo?: string;
    address?: string;
  },
  schemaType = "LocalBusiness",
  customData?: Record<string, unknown>
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaType,
  };

  if (siteInfo.name) schema.name = siteInfo.name;
  if (siteInfo.phone) schema.telephone = siteInfo.phone;
  if (siteInfo.logo) schema.image = siteInfo.logo;
  if (siteInfo.address) schema.address = siteInfo.address;

  // Merge custom data
  if (customData) {
    Object.assign(schema, customData);
  }

  return schema;
}

/**
 * Build WebPage schema
 */
export function buildWebPageSchema(
  title: string,
  description: string,
  url: string,
  schemaType = "WebPage"
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: title,
    url,
  };

  if (description) {
    schema.description = description;
  }

  return schema;
}

/**
 * Build complete structured data for all schema types
 */
export function buildStructuredData(
  schemaTypes: string[],
  pageData: {
    title: string;
    description: string;
    url: string;
    content?: unknown;
    siteInfo?: {
      name?: string;
      phone?: string;
      logo?: string;
      address?: string;
    };
  },
  customSchemaData?: Record<string, unknown>
): Record<string, unknown>[] {
  const schemas: Record<string, unknown>[] = [];

  for (const type of schemaTypes) {
    switch (type) {
      case "FAQPage":
        // Auto-extract FAQ items from content
        const faqItems = extractFaqItems(pageData.content);
        if (faqItems.length > 0) {
          schemas.push(buildFaqSchema(faqItems));
        }
        break;

      case "LocalBusiness":
      case "Attorney":
      case "LegalService":
        schemas.push(
          buildLocalBusinessSchema(pageData.siteInfo || {}, type, customSchemaData)
        );
        break;

      case "WebPage":
      case "AboutPage":
      case "ContactPage":
        const schema = buildWebPageSchema(
          pageData.title,
          pageData.description,
          pageData.url,
          type
        );
        if (customSchemaData) {
          Object.assign(schema, customSchemaData);
        }
        schemas.push(schema);
        break;

      default:
        // Unknown type, skip
        break;
    }
  }

  return schemas;
}
