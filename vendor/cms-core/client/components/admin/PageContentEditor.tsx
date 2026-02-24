import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle } from "lucide-react";
import {
  normalizeHomePageContent,
  normalizeAboutPageContent,
  normalizeContactPageContent,
  normalizePracticeAreasPageContent,
  normalizeTestimonialsPageContent,
} from "../../lib/contentNormalizer";

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
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [normalizedContent, setNormalizedContent] = useState<any>(null);

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

  // Normalize content based on page type
  const normalizeContent = (rawContent: any) => {
    try {
      switch (pageType) {
        case "home":
          return normalizeHomePageContent(rawContent);
        case "about":
          return normalizeAboutPageContent(rawContent);
        case "contact":
          return normalizeContactPageContent(rawContent);
        case "practice-areas":
          return normalizePracticeAreasPageContent(rawContent);
        case "testimonials":
          return normalizeTestimonialsPageContent(rawContent);
        default:
          return rawContent || {};
      }
    } catch (error) {
      console.error("Error normalizing content:", error);
      return rawContent || {};
    }
  };

  // Initialize content
  useEffect(() => {
    const normalized = normalizeContent(content);
    setNormalizedContent(normalized);
    setJsonText(JSON.stringify(normalized, null, 2));
  }, [content, pageType]);

  // Handle JSON text changes
  const handleJsonChange = (text: string) => {
    setJsonText(text);
    
    try {
      const parsed = JSON.parse(text);
      setJsonError(null);
      
      // Normalize parsed content
      const normalized = normalizeContent(parsed);
      setNormalizedContent(normalized);
      
      // Update parent
      onChange(normalized);
    } catch (error) {
      if (error instanceof Error) {
        setJsonError(error.message);
      } else {
        setJsonError("Invalid JSON");
      }
    }
  };

  const getPageTypeName = () => {
    switch (pageType) {
      case "home": return "Home Page";
      case "about": return "About Page";
      case "contact": return "Contact Page";
      case "practice-areas": return "Practice Areas Page";
      case "testimonials": return "Testimonials Page";
      default: return "Page";
    }
  };

  const getContentDescription = () => {
    switch (pageType) {
      case "home":
        return "Edit hero, about section, practice areas, testimonials, contact form, and other home page content.";
      case "about":
        return "Edit hero, story, mission/vision, features, stats, and CTA sections.";
      case "contact":
        return "Edit hero, office locations, form settings, and process steps.";
      case "practice-areas":
        return "Edit hero, tabs, practice area grid, CTA, and FAQ sections.";
      case "testimonials":
        return "Edit hero, Google reviews integration, and CTA sections.";
      default:
        return "Edit page content structure as JSON.";
    }
  };

  if (pageType === "unknown") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Content Editor</CardTitle>
          <CardDescription>
            This page type doesn't have a structured content editor. You can edit raw JSON below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            className="font-mono text-sm min-h-[400px]"
            placeholder="{}"
          />
          {jsonError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>JSON Error: {jsonError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{getPageTypeName()} Content</CardTitle>
          <CardDescription>
            {getContentDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!jsonError && normalizedContent && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Content is valid and normalized according to the {getPageTypeName()} schema.
              </AlertDescription>
            </Alert>
          )}
          
          <div>
            <label className="text-sm font-medium mb-2 block">
              Content JSON
              <span className="text-gray-500 font-normal ml-2">
                (Edit the structure below - content is automatically validated)
              </span>
            </label>
            <Textarea
              value={jsonText}
              onChange={(e) => handleJsonChange(e.target.value)}
              className="font-mono text-sm min-h-[600px]"
              placeholder="{}"
            />
          </div>

          {jsonError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>JSON Error:</strong> {jsonError}
                <br />
                <span className="text-xs">Fix the JSON syntax to save changes.</span>
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-gray-500 space-y-1">
            <p><strong>Tip:</strong> The content structure is validated against the {getPageTypeName()} schema.</p>
            <p>Missing fields will be automatically filled with empty defaults when you save.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content Structure Reference</CardTitle>
          <CardDescription>
            Key sections available for this page type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            {pageType === "home" && (
              <ul className="list-disc list-inside space-y-1">
                <li><code>hero</code> - Hero section with title, headline, phone, buttons</li>
                <li><code>about</code> - About section with description, features, stats</li>
                <li><code>practiceAreasIntro</code> - Practice areas intro section</li>
                <li><code>practiceAreas</code> - Array of practice area items</li>
                <li><code>testimonials</code> - Testimonials section with items</li>
                <li><code>contact</code> - Contact form section</li>
                <li><code>firmDescription</code> - Firm description</li>
                <li><code>awardsCTA</code> - Awards CTA section</li>
                <li><code>attorneyInfo</code> - Attorney information section</li>
              </ul>
            )}
            {pageType === "about" && (
              <ul className="list-disc list-inside space-y-1">
                <li><code>hero</code> - Hero section with tagline</li>
                <li><code>story</code> - Story section with content and badges</li>
                <li><code>missionVision</code> - Mission and vision statements</li>
                <li><code>featureBoxes</code> - Array of feature boxes</li>
                <li><code>stats</code> - Statistics section</li>
                <li><code>whyChooseUs</code> - Why choose us section</li>
                <li><code>cta</code> - Call to action section</li>
              </ul>
            )}
            {pageType === "contact" && (
              <ul className="list-disc list-inside space-y-1">
                <li><code>hero</code> - Hero section with tagline</li>
                <li><code>offices</code> - Array of office tabs</li>
                <li><code>formSettings</code> - Contact form configuration</li>
                <li><code>process</code> - Process steps section</li>
              </ul>
            )}
            {pageType === "practice-areas" && (
              <ul className="list-disc list-inside space-y-1">
                <li><code>hero</code> - Hero section</li>
                <li><code>tabs</code> - Array of content tabs</li>
                <li><code>grid</code> - Practice areas grid</li>
                <li><code>cta</code> - Call to action</li>
                <li><code>faq</code> - FAQ section with items</li>
              </ul>
            )}
            {pageType === "testimonials" && (
              <ul className="list-disc list-inside space-y-1">
                <li><code>hero</code> - Hero section</li>
                <li><code>reviews</code> - Google reviews integration</li>
                <li><code>cta</code> - Call to action</li>
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
