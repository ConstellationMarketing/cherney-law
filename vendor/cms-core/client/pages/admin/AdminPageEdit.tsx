import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import type { Page, ContentBlock } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Eye, Loader2, ExternalLink, History } from "lucide-react";
import BlockEditor from "../../components/admin/BlockEditor";
import BlockRenderer from "@site/components/BlockRenderer";
import PageContentEditor from "../../components/admin/PageContentEditor";
import ImageUploader from "../../components/admin/ImageUploader";
import { clearPageCache } from "../../hooks/usePageContent";
import RevisionPanel, { createPageRevision } from "../../components/admin/RevisionPanel";
import URLChangeRedirectModal from "../../components/admin/URLChangeRedirectModal";
import type { PageRevision } from "@/lib/database.types";

export default function AdminPageEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState<Page | null>(null);
  const [activeTab, setActiveTab] = useState("content");
  const [originalUrlPath, setOriginalUrlPath] = useState<string>("");
  const [previousStatus, setPreviousStatus] = useState<string>("");
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPage();
    }
  }, [id]);

  const fetchPage = async () => {
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching page:", error);
      navigate("/admin/pages");
      return;
    }

    setPage(data);
    setOriginalUrlPath(data.url_path);
    setPreviousStatus(data.status);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!page) return;

    // Check if URL path changed and prompt for redirect
    if (page.url_path !== originalUrlPath && originalUrlPath !== "") {
      setPendingSave(true);
      setShowRedirectModal(true);
      return;
    }

    await performSave();
  };

  const performSave = async () => {
    if (!page) return;
    setSaving(true);

    // Auto-create revision when publishing
    const isPublishing = page.status === "published" && previousStatus !== "published";
    if (isPublishing) {
      await createPageRevision(page);
    }

    const { error } = await supabase
      .from("pages")
      .update({
        title: page.title,
        url_path: page.url_path,
        page_type: page.page_type,
        content: page.content as unknown,
        meta_title: page.meta_title,
        meta_description: page.meta_description,
        canonical_url: page.canonical_url,
        og_title: page.og_title,
        og_description: page.og_description,
        og_image: page.og_image,
        noindex: page.noindex,
        schema_type: page.schema_type,
        schema_data: page.schema_data,
        status: page.status,
        published_at:
          page.status === "published" && !page.published_at
            ? new Date().toISOString()
            : page.published_at,
      } as Record<string, unknown>)
      .eq("id", page.id);

    if (error) {
      console.error("Error saving page:", error);
      alert("Failed to save page: " + error.message);
    } else {
      // Clear the page cache so the frontend fetches fresh content
      if (page.url_path === "/") {
        clearPageCache("home");
      } else if (page.url_path === "/about") {
        clearPageCache("about");
      } else if (page.url_path === "/contact") {
        clearPageCache("contact");
      } else if (page.url_path === "/practice-areas") {
        clearPageCache("practice-areas");
      }
      // Update tracking state after successful save
      setOriginalUrlPath(page.url_path);
      setPreviousStatus(page.status);
      alert("Page saved successfully!");
      setPendingSave(false);
    }
    setSaving(false);
  };

  const updatePage = (updates: Partial<Page>) => {
    if (!page) return;
    setPage({ ...page, ...updates });
  };

  const handleContentChange = (content: ContentBlock[]) => {
    updatePage({ content });
  };

  const handleRestoreRevision = (revision: PageRevision) => {
    if (!page) return;
    setPage({
      ...page,
      title: revision.title,
      url_path: revision.url_path,
      page_type: revision.page_type,
      content: revision.content,
      meta_title: revision.meta_title,
      meta_description: revision.meta_description,
      canonical_url: revision.canonical_url,
      og_title: revision.og_title,
      og_description: revision.og_description,
      og_image: revision.og_image,
      noindex: revision.noindex,
      status: revision.status,
    });
    setActiveTab("content");
    alert("Revision restored! Don't forget to save the page.");
  };

  const handleRedirectModalClose = () => {
    setShowRedirectModal(false);
    setPendingSave(false);
  };

  const handleRedirectConfirm = async () => {
    setShowRedirectModal(false);
    await performSave();
  };

  // Check if this is a structured page (main site pages)
  const isStructuredPage =
    page?.url_path &&
    ["/", "/about", "/contact", "/practice-areas"].includes(page.url_path);

  const handleStructuredContentChange = (content: unknown) => {
    updatePage({ content: content as ContentBlock[] });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (!page) {
    return <div>Page not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/pages">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{page.title}</h1>
              <Badge
                variant={page.status === "published" ? "default" : "secondary"}
              >
                {page.status}
              </Badge>
            </div>
            <p className="text-gray-500 text-sm">{page.url_path}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {page.status === "published" && (
            <a href={page.url_path} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Live
              </Button>
            </a>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="seo">SEO & Meta</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="revisions">
            <History className="h-4 w-4 mr-2" />
            Revisions
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            {isStructuredPage ? (
              <div>
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Structured Page Editor:</strong> This page uses a
                    structured content format. Edit each section below to update
                    the page content while preserving the design.
                  </p>
                </div>
                <PageContentEditor
                  pageKey={page.url_path}
                  content={page.content}
                  onChange={handleStructuredContentChange}
                />
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Page Content</CardTitle>
                  <CardDescription>
                    Add and arrange content blocks for this page
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BlockEditor
                    content={page.content}
                    onChange={handleContentChange}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="seo" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO & Meta Tags</CardTitle>
              <CardDescription>
                Optimize your page for search engines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={page.meta_title || ""}
                  onChange={(e) => updatePage({ meta_title: e.target.value })}
                  placeholder="Page Title | Silva Trial Lawyers"
                />
                <p className="text-sm text-gray-500">
                  {(page.meta_title || "").length}/60 characters recommended
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={page.meta_description || ""}
                  onChange={(e) =>
                    updatePage({ meta_description: e.target.value })
                  }
                  placeholder="A brief description of this page..."
                  rows={3}
                />
                <p className="text-sm text-gray-500">
                  {(page.meta_description || "").length}/160 characters
                  recommended
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="canonicalUrl">Canonical URL (Optional)</Label>
                <Input
                  id="canonicalUrl"
                  value={page.canonical_url || ""}
                  onChange={(e) =>
                    updatePage({ canonical_url: e.target.value })
                  }
                  placeholder="https://silvatriallawyers.com/page"
                />
              </div>

              <hr />

              <h3 className="text-lg font-semibold">
                Open Graph (Social Sharing)
              </h3>

              <div className="space-y-2">
                <Label htmlFor="ogTitle">OG Title</Label>
                <Input
                  id="ogTitle"
                  value={page.og_title || ""}
                  onChange={(e) => updatePage({ og_title: e.target.value })}
                  placeholder="Leave blank to use Meta Title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ogDescription">OG Description</Label>
                <Textarea
                  id="ogDescription"
                  value={page.og_description || ""}
                  onChange={(e) =>
                    updatePage({ og_description: e.target.value })
                  }
                  placeholder="Leave blank to use Meta Description"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Featured Image / OG Image</Label>
                <p className="text-sm text-gray-500 mb-2">
                  This image will be used when sharing on social media and as the page's featured image.
                </p>
                <ImageUploader
                  value={page.og_image || ""}
                  onChange={(url) => updatePage({ og_image: url })}
                  folder="og-images"
                  placeholder="Upload a featured image for social sharing"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={page.noindex}
                  onCheckedChange={(checked) =>
                    updatePage({ noindex: checked })
                  }
                />
                <Label>No Index (hide from search engines)</Label>
              </div>

              <hr />

              <h3 className="text-lg font-semibold">
                Schema.org Structured Data
              </h3>
              <p className="text-sm text-gray-500">
                Add structured data to help search engines understand your
                content
              </p>

              <div className="space-y-2">
                <Label htmlFor="schemaType">Schema Type</Label>
                <Select
                  value={page.schema_type || ""}
                  onValueChange={(v) => updatePage({ schema_type: v || null })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select schema type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LocalBusiness">
                      Local Business
                    </SelectItem>
                    <SelectItem value="Attorney">Attorney</SelectItem>
                    <SelectItem value="LegalService">Legal Service</SelectItem>
                    <SelectItem value="WebPage">Web Page</SelectItem>
                    <SelectItem value="AboutPage">About Page</SelectItem>
                    <SelectItem value="ContactPage">Contact Page</SelectItem>
                    <SelectItem value="FAQPage">FAQ Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {page.schema_type && (
                <div className="space-y-2">
                  <Label htmlFor="schemaData">Schema Data (JSON)</Label>
                  <Textarea
                    id="schemaData"
                    value={
                      page.schema_data
                        ? JSON.stringify(page.schema_data, null, 2)
                        : ""
                    }
                    onChange={(e) => {
                      try {
                        const parsed = e.target.value
                          ? JSON.parse(e.target.value)
                          : null;
                        updatePage({ schema_data: parsed });
                      } catch {
                        // Allow typing invalid JSON temporarily
                      }
                    }}
                    placeholder='{"name": "Silva Trial Lawyers", "telephone": "404-905-7742"}'
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-gray-500">
                    Additional properties for the Schema.org type (e.g.,
                    address, phone, etc.)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Page Settings</CardTitle>
              <CardDescription>
                Configure page properties and publishing status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Page Title</Label>
                <Input
                  id="title"
                  value={page.title}
                  onChange={(e) => updatePage({ title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urlPath">URL Path</Label>
                <Input
                  id="urlPath"
                  value={page.url_path}
                  onChange={(e) => updatePage({ url_path: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pageType">Page Type</Label>
                <Select
                  value={page.page_type}
                  onValueChange={(v) =>
                    updatePage({ page_type: v as Page["page_type"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Page</SelectItem>
                    <SelectItem value="practice">Practice Area Page</SelectItem>
                    <SelectItem value="landing">Landing Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={page.status}
                  onValueChange={(v) =>
                    updatePage({ status: v as Page["status"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Only published pages appear on the live site after the next
                  publish
                </p>
              </div>

              {page.published_at && (
                <p className="text-sm text-gray-500">
                  First published:{" "}
                  {new Date(page.published_at).toLocaleString()}
                </p>
              )}
              <p className="text-sm text-gray-500">
                Last updated: {new Date(page.updated_at).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revisions" className="mt-6">
          <RevisionPanel
            pageId={page.id}
            currentPage={page}
            onRestore={handleRestoreRevision}
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Page Preview</CardTitle>
              <CardDescription>
                See how your page content will appear
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden bg-white">
                <BlockRenderer content={page.content} isPreview={true} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* URL Change Redirect Modal */}
      <URLChangeRedirectModal
        open={showRedirectModal}
        onClose={handleRedirectModalClose}
        oldPath={originalUrlPath}
        newPath={page.url_path}
        onConfirm={handleRedirectConfirm}
      />
    </div>
  );
}
