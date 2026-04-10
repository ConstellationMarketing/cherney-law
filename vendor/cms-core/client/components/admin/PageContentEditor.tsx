import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  normalizeHomePageContent,
  normalizeAboutPageContent,
  normalizeContactPageContent,
  normalizePracticeAreasPageContent,
  normalizeTestimonialsPageContent,
  normalizeCommonQuestionsPageContent,
  normalizeAreasWeServePageContent,
  normalizeAreaPageContent,
  normalizePracticeAreaDetailContent,
} from "../../lib/contentNormalizer";
import HomePageFieldEditor from "@site/components/admin/HomePageFieldEditor";
import Homepage2FieldEditor from "@site/components/admin/Homepage2FieldEditor";
import AboutPageFieldEditor from "@site/components/admin/AboutPageFieldEditor";
import ContactPageFieldEditor from "@site/components/admin/ContactPageFieldEditor";
import PracticeAreasPageFieldEditor from "@site/components/admin/PracticeAreasPageFieldEditor";
import TestimonialsPageFieldEditor from "@site/components/admin/TestimonialsPageFieldEditor";
import CommonQuestionsPageFieldEditor from "@site/components/admin/CommonQuestionsPageFieldEditor";
import AreasWeServePageFieldEditor from "@site/components/admin/AreasWeServePageFieldEditor";
import AreaPageFieldEditor from "@site/components/admin/AreaPageFieldEditor";
import PracticeAreaDetailFieldEditor from "@site/components/admin/PracticeAreaDetailFieldEditor";

type ResolvedPageType =
  | "home"
  | "about"
  | "contact"
  | "practice-areas"
  | "testimonials"
  | "common-questions"
  | "areas-we-serve"
  | "area"
  | "practice_detail"
  | "unknown";

interface PageContentEditorProps {
  pageKey: string;
  content: any;
  onChange: (content: any) => void;
  pageType?: string;
  pageUrlPath?: string;
}

const normalizePath = (path: string): string => {
  if (!path) return "";
  if (path === "/") return "/";
  return `/${path.replace(/^\/+|\/+$/g, "")}`;
};

const getPageTypeFromPath = (path: string): ResolvedPageType => {
  const p = normalizePath(path);
  if (p === "/" || p === "/homepage-2") return "home";
  if (p.startsWith("/about")) return "about";
  if (p.startsWith("/contact")) return "contact";
  if (p.startsWith("/practice-areas")) return "practice-areas";
  if (p.startsWith("/testimonials")) return "testimonials";
  if (p.startsWith("/common-questions")) return "common-questions";
  if (p.startsWith("/areas-we-serve")) return "areas-we-serve";
  return "unknown";
};

const getPageTypeFromContent = (content: any): ResolvedPageType | null => {
  if (!content || typeof content !== "object") return null;

  if (Array.isArray(content?.contentSections) && content?.faqSection && content?.closingSection) {
    return "practice_detail";
  }

  if (Array.isArray(content?.locations) && content?.localCourt && content?.whyChooseUs) {
    return "area";
  }

  if (content?.hero?.h1Title && content?.about && Array.isArray(content?.practiceAreas)) {
    return "home";
  }

  if (content?.story && content?.missionVision && content?.whyChooseUs) {
    return "about";
  }

  if (Array.isArray(content?.offices) && content?.formSettings && content?.process) {
    return "contact";
  }

  if (Array.isArray(content?.tabs) && content?.grid && content?.faq) {
    return "practice-areas";
  }

  if (content?.reviews && content?.cta && content?.hero?.tagline) {
    return "testimonials";
  }

  if (content?.faqSection && content?.closingSection && content?.hero?.tagline) {
    return "common-questions";
  }

  if (content?.locationsSection && content?.introSection && content?.whySection) {
    return "areas-we-serve";
  }

  return null;
};

const getResolvedPageType = ({
  explicitPageType,
  content,
  pageUrlPath,
}: {
  explicitPageType?: string;
  content: any;
  pageUrlPath?: string;
}): ResolvedPageType => {
  if (explicitPageType === "area") return "area";
  if (explicitPageType === "practice_detail") return "practice_detail";
  if (
    explicitPageType === "home" ||
    explicitPageType === "about" ||
    explicitPageType === "contact" ||
    explicitPageType === "practice-areas" ||
    explicitPageType === "testimonials" ||
    explicitPageType === "common-questions" ||
    explicitPageType === "areas-we-serve"
  ) {
    return explicitPageType;
  }

  const fromContent = getPageTypeFromContent(content);
  if (fromContent) return fromContent;

  return getPageTypeFromPath(pageUrlPath || "");
};

export default function PageContentEditor({
  pageKey,
  content,
  onChange,
  pageType: explicitPageType,
  pageUrlPath,
}: PageContentEditorProps) {
  const [normalized, setNormalized] = useState<any>(null);

  const pageType = getResolvedPageType({ explicitPageType, content, pageUrlPath });
  const isHomepage2 = normalizePath(pageUrlPath || "") === "/homepage-2";

  useEffect(() => {
    try {
      let n: any;
      switch (pageType) {
        case "home": n = normalizeHomePageContent(content); break;
        case "about": n = normalizeAboutPageContent(content); break;
        case "contact": n = normalizeContactPageContent(content); break;
        case "practice-areas": n = normalizePracticeAreasPageContent(content); break;
        case "testimonials": n = normalizeTestimonialsPageContent(content); break;
        case "common-questions": n = normalizeCommonQuestionsPageContent(content); break;
        case "areas-we-serve": n = normalizeAreasWeServePageContent(content); break;
        case "area": n = normalizeAreaPageContent(content); break;
        case "practice_detail": n = normalizePracticeAreaDetailContent(content); break;
        default: n = content || {};
      }
      setNormalized(n);
    } catch (err) {
      console.error("[PageContentEditor] Normalization error:", err);
      setNormalized(content || {});
    }
  }, [pageKey, pageType]);

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
      {pageType === "home" && isHomepage2 && (
        <Homepage2FieldEditor content={normalized} onChange={handleChange} />
      )}
      {pageType === "home" && !isHomepage2 && (
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
      {pageType === "common-questions" && (
        <CommonQuestionsPageFieldEditor content={normalized} onChange={handleChange} />
      )}
      {pageType === "areas-we-serve" && (
        <AreasWeServePageFieldEditor content={normalized} onChange={handleChange} />
      )}
      {pageType === "area" && (
        <AreaPageFieldEditor content={normalized} onChange={handleChange} />
      )}
      {pageType === "practice_detail" && (
        <PracticeAreaDetailFieldEditor content={normalized} onChange={handleChange} />
      )}
    </div>
  );
}
