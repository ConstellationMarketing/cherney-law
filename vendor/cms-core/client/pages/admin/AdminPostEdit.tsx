import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
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
import { ArrowLeft, Save, Loader2, ExternalLink } from "lucide-react";
import RichTextEditor from "../../components/admin/RichTextEditor";
import ImageUploader from "../../components/admin/ImageUploader";
import { useSiteSettings } from "@site/contexts/SiteSettingsContext";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  category_id: string | null;
  body: string | null;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  noindex: boolean;
  status: string;
  published_at: string | null;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function AdminPostEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const siteSettings = useSiteSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState("content");
  const siteUrl = siteSettings.settings.siteUrl || "";

  useEffect(() => {
    if (id) {
      fetchPost();
      fetchCategories();
    }
  }, [id]);

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching post:", error);
      navigate("/admin/posts");
      return;
    }

    setPost(data as Post);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("post_categories")
      .select("id, name, slug")
      .order("name");
    setCategories((data as Category[]) || []);
  };

  const handleSave = async () => {
    if (!post) return;
    setSaving(true);

    const { error } = await supabase
      .from("posts")
      .update({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        featured_image: post.featured_image,
        category_id: post.category_id,
        body: post.body,
        meta_title: post.meta_title,
        meta_description: post.meta_description,
        canonical_url: post.canonical_url,
        og_title: post.og_title,
        og_description: post.og_description,
        og_image: post.og_image,
        noindex: post.noindex,
        status: post.status,
        published_at:
          post.status === "published" && !post.published_at
            ? new Date().toISOString()
            : post.published_at,
      } as Record<string, unknown>)
      .eq("id", post.id);

    if (error) {
      console.error("Error saving post:", error);
      alert("Failed to save post: " + error.message);
    } else {
      alert("Post saved successfully!");
    }
    setSaving(false);
  };

  const updatePost = (updates: Partial<Post>) => {
    if (!post) return;
    setPost({ ...post, ...updates });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (!post) return <div>Post not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/posts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
              <Badge variant={post.status === "published" ? "default" : "secondary"}>
                {post.status}
              </Badge>
            </div>
            <p className="text-gray-500 text-sm">/{post.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.status === "published" && (
            <a
              href={`/${post.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
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
        </TabsList>

        <TabsContent value="content" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Post Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={post.title}
                    onChange={(e) => updatePost({ title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Featured Image</Label>
                  <ImageUploader
                    value={post.featured_image || ""}
                    onChange={(url) => updatePost({ featured_image: url })}
                    folder="blog"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Body</Label>
                  <RichTextEditor
                    value={post.body || ""}
                    onChange={(v) => updatePost({ body: v })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="seo" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO & Meta Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input
                  value={post.meta_title || ""}
                  onChange={(e) => updatePost({ meta_title: e.target.value })}
                  placeholder="Post Title | Blog"
                />
                <p className="text-sm text-gray-500">
                  {(post.meta_title || "").length}/60 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea
                  value={post.meta_description || ""}
                  onChange={(e) => updatePost({ meta_description: e.target.value })}
                  rows={3}
                />
                <p className="text-sm text-gray-500">
                  {(post.meta_description || "").length}/160 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label>Canonical URL</Label>
                <Input
                  value={post.canonical_url || ""}
                  onChange={(e) => updatePost({ canonical_url: e.target.value })}
                  placeholder={
                    siteUrl
                      ? `${siteUrl}/${post.slug}`
                      : "https://your-domain.com/post-slug/"
                  }
                />
              </div>

              <hr />
              <h3 className="text-lg font-semibold">Open Graph</h3>

              <div className="space-y-2">
                <Label>OG Title</Label>
                <Input
                  value={post.og_title || ""}
                  onChange={(e) => updatePost({ og_title: e.target.value })}
                  placeholder="Leave blank to use Meta Title"
                />
              </div>

              <div className="space-y-2">
                <Label>OG Description</Label>
                <Textarea
                  value={post.og_description || ""}
                  onChange={(e) => updatePost({ og_description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>OG Image</Label>
                <ImageUploader
                  value={post.og_image || ""}
                  onChange={(url) => updatePost({ og_image: url })}
                  folder="og-images"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={post.noindex}
                  onCheckedChange={(checked) => updatePost({ noindex: checked })}
                />
                <Label>No Index</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Post Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={post.slug}
                  onChange={(e) => updatePost({ slug: e.target.value })}
                />
                <p className="text-sm text-gray-500">
                  Accessible at /{post.slug}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={post.category_id || "none"}
                  onValueChange={(v) =>
                    updatePost({ category_id: v === "none" ? null : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Excerpt</Label>
                <Textarea
                  value={post.excerpt || ""}
                  onChange={(e) => updatePost({ excerpt: e.target.value })}
                  rows={3}
                  placeholder="Brief summary of the post"
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={post.status}
                  onValueChange={(v) => updatePost({ status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {post.published_at && (
                <p className="text-sm text-gray-500">
                  Published: {new Date(post.published_at).toLocaleString()}
                </p>
              )}
              <p className="text-sm text-gray-500">
                Last updated: {new Date(post.updated_at).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
