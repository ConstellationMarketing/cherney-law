// Page content type definitions for CMS

// Common types
export interface Button {
  text: string;
  href: string;
}

export interface FeatureBox {
  icon?: string;
  title: string;
  description: string;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface TestimonialItem {
  quote: string;
  author: string;
  location?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface PracticeAreaItem {
  title: string;
  description: string;
  icon?: string;
  href?: string;
}

export interface Badge {
  image: string;
  alt: string;
}

export interface ProcessStep {
  stepNumber: string;
  title: string;
  description: string;
}

export interface ContentTab {
  tabLabel: string;
  heading: string;
  content: string;
  image?: string;
  imageAlt?: string;
}

export interface OfficeTab {
  tabLabel: string;
  addressLine1: string;
  addressLine2?: string;
  phone: string;
  email?: string;
  hours?: string;
  mapEmbedUrl?: string;
}

// ========== HOME PAGE ==========
export interface HomePageContent {
  hero: {
    h1Title: string;
    headline: string;
    highlightedText: string;
    phone: string;
    phoneLabel: string;
    featureBoxes: FeatureBox[];
    buttons: Button[];
    heroImage?: string;
    heroBgImage?: string;
  };
  about: {
    sectionLabel: string;
    heading: string;
    headingLevel?: 1 | 2 | 3 | 4;
    description: string;
    phone: string;
    phoneLabel: string;
    contactLabel: string;
    contactText: string;
    attorneyImage: string;
    features: FeatureBox[];
    stats: StatItem[];
  };
  practiceAreasIntro: {
    sectionLabel: string;
    heading: string;
    headingLevel?: 1 | 2 | 3 | 4;
    description: string;
  };
  practiceAreas: PracticeAreaItem[];
  testimonials: {
    sectionLabel: string;
    heading: string;
    headingLevel?: 1 | 2 | 3 | 4;
    backgroundImage: string;
    items: TestimonialItem[];
  };
  contact: {
    sectionLabel: string;
    heading: string;
    headingLevel?: 1 | 2 | 3 | 4;
    description: string;
    phone: string;
    phoneLabel: string;
    address: string;
    formHeading: string;
    formHeadingLevel?: 1 | 2 | 3 | 4;
    attorneyImage: string;
  };
  firmDescription: {
    heading: string;
    headingLevel?: 1 | 2 | 3 | 4;
    body: string;
  };
  awardsCTA: {
    sectionLabel: string;
    heading: string;
    headingLevel?: 1 | 2 | 3 | 4;
    description: string;
    ctaText: string;
    ctaLink: string;
  };
  attorneyInfo: {
    heading: string;
    headingLevel?: 1 | 2 | 3 | 4;
    image: string;
    imageAlt: string;
    body: string;
    stayInformedHeading: string;
    stayInformedHeadingLevel?: 1 | 2 | 3 | 4;
    stayInformedText: string;
    stayInformedImage: string;
    stayInformedImageAlt: string;
    stayInformedCaption: string;
  };
}

// ========== ABOUT PAGE ==========
export interface AboutPageContent {
  hero: {
    sectionLabel: string;
    tagline: string;
  };
  story: {
    sectionLabel: string;
    heading: string;
    leftContent: string;
    rightContent: string;
    image: string;
    imageAlt: string;
    badges: Badge[];
  };
  missionVision: {
    mission: {
      heading: string;
      text: string;
    };
    vision: {
      heading: string;
      text: string;
    };
  };
  featureBoxes: FeatureBox[];
  stats: {
    stats: StatItem[];
  };
  whyChooseUs: {
    sectionLabel: string;
    heading: string;
    description: string;
    image: string;
    imageAlt: string;
    items: FeatureBox[];
  };
  cta: {
    heading: string;
    description: string;
    secondaryButton: Button;
  };
}

// ========== CONTACT PAGE ==========
export interface ContactPageContent {
  hero: {
    sectionLabel: string;
    tagline: string;
    description: string;
  };
  offices: OfficeTab[];
  formSettings: {
    heading: string;
    subtext: string;
    submitButtonText: string;
    consentText: string;
    privacyPolicyUrl: string;
    termsOfServiceUrl: string;
  };
  process: {
    sectionLabel: string;
    heading: string;
    subtitle: string;
    steps: ProcessStep[];
  };
}

// ========== PRACTICE AREAS PAGE ==========
export interface PracticeAreasPageContent {
  hero: {
    sectionLabel: string;
    tagline: string;
    subtext: string;
  };
  tabs: ContentTab[];
  grid: {
    heading: string;
    description: string;
    areas: PracticeAreaItem[];
  };
  cta: {
    heading: string;
    content: string;
    buttonLabel: string;
    buttonLink: string;
  };
  faq: {
    heading: string;
    items: FAQItem[];
  };
}

// ========== TESTIMONIALS PAGE ==========
export interface TestimonialsPageContent {
  hero: {
    sectionLabel: string;
    tagline: string;
  };
  reviews: {
    placeId: string;
    heading: string;
    subtext: string;
  };
  cta: {
    heading: string;
    description: string;
    secondaryButton: Button;
  };
}

// Union type for all page content
export type PageContent =
  | HomePageContent
  | AboutPageContent
  | ContactPageContent
  | PracticeAreasPageContent
  | TestimonialsPageContent;
