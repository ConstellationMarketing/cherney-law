// Type definitions for individual Practice Area Detail pages

export interface PracticeAreaDetailHero {
  sectionLabel: string;
  tagline: string;
  description: string;
  backgroundImage?: string;
  backgroundImageAlt?: string;
}

export interface PracticeAreaTestimonialItem {
  rating?: string;
  text: string;
  author: string;
}

export interface PracticeAreaAwardsContent {
  logos: { src: string; alt: string }[];
}

export interface PracticeAreaSocialProofContent {
  mode: "testimonials" | "awards" | "none";
  testimonials: PracticeAreaTestimonialItem[];
  awards: PracticeAreaAwardsContent;
}

export interface PracticeAreaContentSectionItem {
  body: string;
  image?: string;
  imageAlt?: string;
  imagePosition?: "left" | "right";
  showCTAs?: boolean;
}

export interface PracticeAreaFaqItem {
  question: string;
  answer: string;
}

export interface PracticeAreaFaqContent {
  enabled: boolean;
  heading: string;
  description?: string;
  items: PracticeAreaFaqItem[];
}

export interface PracticeAreaDetailPageContent {
  hero: PracticeAreaDetailHero;
  socialProof: PracticeAreaSocialProofContent;
  contentSections: PracticeAreaContentSectionItem[];
  faq: PracticeAreaFaqContent;
  headingTags?: Record<string, string>;
}

export const defaultPracticeAreaDetailContent: PracticeAreaDetailPageContent = {
  hero: {
    sectionLabel: "",
    tagline: "",
    description: "",
    backgroundImage: "",
    backgroundImageAlt: "",
  },
  socialProof: {
    mode: "none",
    testimonials: [],
    awards: { logos: [] },
  },
  contentSections: [
    {
      body: "<p>Enter content here.</p>",
      image: "",
      imageAlt: "",
      imagePosition: "right",
      showCTAs: true,
    },
  ],
  faq: {
    enabled: true,
    heading: "Frequently Asked Questions",
    description: "",
    items: [],
  },
  headingTags: {},
};
