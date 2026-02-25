/**
 * JsonLdSchema Component
 * Renders JSON-LD structured data via React Helmet
 */

import { Helmet } from "react-helmet-async";
import {
  parseSchemaTypes,
  buildStructuredData,
} from "@site/lib/schemaHelpers";

interface JsonLdSchemaProps {
  schemaType: unknown; // Raw from DB (null, string, JSON array string, or array)
  schemaData?: unknown; // Custom schema data override
  pageContent?: unknown; // Page content for FAQ extraction
  siteInfo?: {
    name?: string;
    phone?: string;
    logo?: string;
    address?: string;
  };
  pageUrl: string;
  pageTitle: string;
  pageDescription: string;
}

export default function JsonLdSchema({
  schemaType,
  schemaData,
  pageContent,
  siteInfo,
  pageUrl,
  pageTitle,
  pageDescription,
}: JsonLdSchemaProps) {
  // Parse schema types
  const schemaTypes = parseSchemaTypes(schemaType);

  if (schemaTypes.length === 0) {
    // No schema types selected, don't render anything
    return null;
  }

  // Parse custom schema data
  const customData =
    schemaData && typeof schemaData === "object" ? schemaData : undefined;

  // Build all schemas
  const schemas = buildStructuredData(schemaTypes, {
    title: pageTitle,
    description: pageDescription,
    url: pageUrl,
    content: pageContent,
    siteInfo,
  }, customData as Record<string, unknown> | undefined);

  if (schemas.length === 0) {
    return null;
  }

  return (
    <Helmet>
      {schemas.map((schema, index) => (
        <script
          key={`schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema, null, 2),
          }}
        />
      ))}
    </Helmet>
  );
}
