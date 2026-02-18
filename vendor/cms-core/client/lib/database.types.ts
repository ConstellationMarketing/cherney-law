export type ContentBlock =
  | {
      type: "hero";
      title: string;
      subtitle?: string;
      backgroundImage?: string;
      showCTA?: boolean;
    }
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; content: string }
  | { type: "bullets"; items: string[] }
  | {
      type: "cta";
      text: string;
      phone: string;
      variant?: "primary" | "outline";
    }
  | { type: "image"; src: string; alt: string }
  | {
      type: "attorney-bio";
      name: string;
      title: string;
      image: string;
      bio: string;
      phone: string;
    }
  | {
      type: "services-grid";
      services: { icon: string; title: string; description: string }[];
    }
  | {
      type: "testimonials";
      testimonials: { initials: string; text: string; rating: number }[];
    }
  | { type: "contact-form"; heading: string }
  | { type: "map"; address: string }
  | { type: "two-column"; left: ContentBlock[]; right: ContentBlock[] }
  | {
      type: "practice-areas-grid";
      areas: { icon: string; title: string; description: string }[];
    };

export type PageStatus = "draft" | "published";
export type PageType = "standard" | "practice" | "landing";

export interface Page {
  id: string;
  title: string;
  url_path: string;
  page_type: PageType;
  content: unknown; // template-specific blocks live in the site repo
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  noindex: boolean;
  schema_type: string | null;
  schema_data: Record<string, unknown> | null;
  status: PageStatus;
  published_at: string | null;
  updated_at: string;
  created_at: string;
}

export interface Template {
  id: string;
  name: string;
  page_type: PageType;
  default_content: unknown;
  default_meta_title: string | null;
  default_meta_description: string | null;
  created_at: string;
}

export interface Redirect {
  id: string;
  from_path: string;
  to_path: string;
  status_code: 301 | 302;
  enabled: boolean;
  created_at: string;
}

export interface Media {
  id: string;
  file_name: string;
  file_path: string;
  public_url: string;
  file_size: number | null;
  mime_type: string | null;
  alt_text: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface CMSUser {
  id: string;
  user_id: string;
  email: string;
  role: "admin" | "editor";
  created_at: string;
  created_by: string | null;
}

export interface PageRevision {
  id: string;
  page_id: string;
  title: string;
  url_path: string;
  page_type: PageType;
  content: unknown;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  noindex: boolean;
  status: PageStatus;
  created_at: string;
  created_by: string | null;
}

export interface Database {
  public: {
    Tables: {
      pages: {
        Row: Page;
        Insert: Omit<Page, "id" | "created_at" | "updated_at"> & {
          id?: string;
        };
        Update: Partial<Omit<Page, "id" | "created_at">>;
      };
      templates: {
        Row: Template;
        Insert: Omit<Template, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<Template, "id" | "created_at">>;
      };
      redirects: {
        Row: Redirect;
        Insert: Omit<Redirect, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<Redirect, "id" | "created_at">>;
      };
      media: {
        Row: Media;
        Insert: Omit<Media, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<Media, "id" | "created_at">>;
      };
      cms_users: {
        Row: CMSUser;
        Insert: Omit<CMSUser, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<CMSUser, "id" | "created_at">>;
      };
      page_revisions: {
        Row: PageRevision;
        Insert: Omit<PageRevision, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<PageRevision, "id" | "created_at">>;
      };
    };
  };
}
