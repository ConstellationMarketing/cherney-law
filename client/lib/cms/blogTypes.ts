// Type definitions for the Blog system

export interface Post {
  id: string;
  title: string;
  slug: string; // stored WITH trailing slash
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
  status: "draft" | "published";
  published_at: string | null;
  updated_at: string;
  created_at: string;
}

export interface PostWithCategory extends Post {
  post_categories: { name: string; slug: string } | null;
}

export interface PostCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at?: string;
}

export interface BlogSidebarSettings {
  id: string;
  attorney_image: string;
  award_images: { src: string; alt: string }[];
  updated_at?: string;
}
