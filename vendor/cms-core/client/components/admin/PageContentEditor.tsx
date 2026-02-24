import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  normalizeHomePageContent,
  normalizeAboutPageContent,
  normalizeContactPageContent,
  normalizePracticeAreasPageContent,
  normalizeTestimonialsPageContent,
} from "../../lib/contentNormalizer";
import HomePageFieldEditor from "./HomePageFieldEditor";
import Homepage2FieldEditor from "./Homepage2FieldEditor";
import AboutPageFieldEditor from "./AboutPageFieldEditor";
import ContactPageFieldEditor from "./ContactPageFieldEditor";
import PracticeAreasPageFieldEditor from "./PracticeAreasPageFieldEditor";
import TestimonialsPageFieldEditor from "./TestimonialsPageFieldEditor";

interface PageContentEditorProps {
  pageKey: string;
  content: any;
  onChange: (content: any) => void;
}

export default function PageContentEditor({
  pageKey,
  content,
  onChange,
}: PageContentEditorProps) {
  const [normalized, setNormalized] = useState<any>(null);

  // Determine page type from URL path
  const getPageType = (path: string): string => {
    if (path === "/" || path === "" || path === "/homepage-2") return "home";
    if (path.startsWith("/about")) return "about";
    if (path.startsWith("/contact")) return "contact";
    if (path.startsWith("/practice-areas")) return "practice-areas";
    if (path.startsWith("/testimonials")) return "testimonials";
    return "unknown";
  };

  const pageType = getPageType(pageKey);

  // Normalize on mount / when content changes from outside
  useEffect(() => {
    try {
      let n: any;
      switch (pageType) {
        case "home": n = normalizeHomePageContent(content); break;
        case "about": n = normalizeAboutPageContent(content); break;
        case "contact": n = normalizeContactPageContent(content); break;
        case "practice-areas": n = normalizePracticeAreasPageContent(content); break;
        case "testimonials": n = normalizeTestimonialsPageContent(content); break;
        default: n = content || {};
      }
      setNormalized(n);
    } catch (err) {
      console.error("[PageContentEditor] Normalization error:", err);
      setNormalized(content || {});
    }
  }, [pageKey]); // intentionally only re-normalize when the page changes, not on every keystroke

  const handleChange = (updated: any) => {
    setNormalized(updated);
    onChange(updated);
  };

  if (!normalized) return null;

  if (pageType === "unknown") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Content Editor</CardTitle>
          <CardDescription>
            This page type doesn't have a structured content editor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-50 p-4 rounded border overflow-auto max-h-[400px]">
            {JSON.stringify(normalized, null, 2)}
          </pre>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {pageType === "home" && pageKey === "/homepage-2" && (
        <Homepage2FieldEditor content={normalized} onChange={handleChange} />
      )}
      {pageType === "home" && pageKey !== "/homepage-2" && (
        <HomePageFieldEditor content={normalized} onChange={handleChange} />
      )}
      {pageType === "about" && (
        <AboutPageFieldEditor content={normalized} onChange={handleChange} />
      )}
      {pageType === "contact" && (
        <ContactPageFieldEditor content={normalized} onChange={handleChange} />
      )}
      {pageType === "practice-areas" && (
        <PracticeAreasPageFieldEditor content={normalized} onChange={handleChange} />
      )}
      {pageType === "testimonials" && (
        <TestimonialsPageFieldEditor content={normalized} onChange={handleChange} />
      )}
    </div>
  );
}
