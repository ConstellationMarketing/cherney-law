export type ContentBlock =
  | HeroBlock
  | HeadingBlock
  | ParagraphBlock
  | BulletsBlock
  | CTABlock
  | ImageBlock
  | AttorneyBioBlock
  | ServicesGridBlock
  | TestimonialsBlock
  | ContactFormBlock
  | MapBlock
  | TwoColumnBlock
  | PracticeAreasGridBlock
  | GoogleReviewsBlock;

export type HeroBlock = {
  type: "hero";
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  showCTA?: boolean;
};

export type HeadingBlock = { type: "heading"; level: 1 | 2 | 3; text: string };
export type ParagraphBlock = { type: "paragraph"; content: string };
export type BulletsBlock = { type: "bullets"; items: string[] };

export type CTABlock = {
  type: "cta";
  text: string;
  phone: string;
  // allow whatever older data might contain
  variant?: "primary" | "outline" | "solid";
};

export type ImageBlock = { type: "image"; src: string; alt?: string };

export type AttorneyBioBlock = {
  type: "attorney-bio";
  name: string;
  title: string;
  image: string;
  bio: string;
  phone: string;
};

export type ServicesGridBlock = {
  type: "services-grid";
  services: { icon: string; title: string; description: string }[];
};

export type TestimonialsBlock = {
  type: "testimonials";
  testimonials: {
    initials: string;
    text: string;
    rating: number;
    author?: string;
  }[];
};

export type ContactFormBlock = { type: "contact-form"; heading: string };
export type MapBlock = { type: "map"; address: string };

export type TwoColumnBlock = {
  type: "two-column";
  left: ContentBlock[];
  right: ContentBlock[];
};

export type PracticeAreasGridBlock = {
  type: "practice-areas-grid";
  areas: { icon: string; title: string; description: string; image?: string }[];
};

export type GoogleReviewsBlock = {
  type: "google-reviews";
  reviews: { author: string; rating: number; text: string; image?: string }[];
};
