// Type definitions for structured homepage content
// Each section maps directly to a static component's data needs

// Hero feature boxes (the 3 boxes below the hero)
export interface HeroFeatureBox {
  title: string;
}

// Hero button links (Call box + Attorney Profile)
export interface HeroButtonLink {
  label: string;
  href: string;
}

export interface HeroContent {
  h1Title: string;
  headline: string;
  highlightedText: string;
  phone: string;
  phoneLabel: string;
  featureBoxes: HeroFeatureBox[];
  buttons: HeroButtonLink[];
}

export interface PartnerLogo {
  src: string;
  alt: string;
}

export interface AboutFeature {
  number: string;
  title: string;
  description: string;
}

export interface AboutStat {
  value: string;
  label: string;
}

export interface AboutContent {
  sectionLabel: string;
  heading: string;
  description: string;
  phone: string;
  phoneLabel: string;
  contactLabel: string;
  contactText: string;
  attorneyImage: string;
  attorneyImageAlt: string;
  features: AboutFeature[];
  stats: AboutStat[];
}

export interface PracticeAreaItem {
  title: string;
  image: string;
  link: string;
}

export interface PracticeAreasIntroContent {
  sectionLabel: string;
  heading: string;
  description: string;
}

export interface AwardsContent {
  sectionLabel: string;
  heading: string;
  description: string;
  logos: Array<{ src: string; alt: string }>;
}

export interface TestimonialItem {
  text: string;
  author: string;
  ratingImage: string;
}

export interface TestimonialsContent {
  sectionLabel: string;
  heading: string;
  backgroundImage: string;
  items: TestimonialItem[];
}

export interface ProcessStep {
  number: string;
  title: string;
  description: string;
}

export interface ProcessContent {
  sectionLabel: string;
  headingLine1: string;
  headingLine2: string;
  steps: ProcessStep[];
}

export interface GoogleReviewItem {
  text: string;
  author: string;
  ratingImage: string;
}

export interface GoogleReviewsContent {
  sectionLabel: string;
  heading: string;
  description: string;
  reviews: GoogleReviewItem[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqContent {
  heading: string;
  description: string;
  videoThumbnail: string;
  videoUrl: string;
  items: FaqItem[];
}

export interface ContactContent {
  sectionLabel: string;
  heading: string;
  description: string;
  phone: string;
  phoneLabel: string;
  address: string;
  formHeading: string;
}

// Firm Description section (green box)
export interface FirmDescriptionContent {
  heading: string;
  body: string; // rich text HTML
}

// Awards CTA section (gray box with "What Are Your Options?")
export interface AwardsCTAContent {
  sectionLabel: string;
  heading: string;
  description: string; // rich text HTML
  ctaText: string;
  ctaLink: string;
}

// Attorney Info section
export interface AttorneyInfoContent {
  heading: string;
  image: string;
  imageAlt: string;
  body: string; // rich text HTML
  stayInformedHeading: string;
  stayInformedText: string;
  stayInformedImage: string;
  stayInformedImageAlt: string;
  stayInformedCaption: string;
}

// Complete homepage content structure
export interface HomePageContent {
  hero: HeroContent;
  partnerLogos: PartnerLogo[];
  about: AboutContent;
  practiceAreasIntro: PracticeAreasIntroContent;
  practiceAreas: PracticeAreaItem[];
  awards: AwardsContent;
  testimonials: TestimonialsContent;
  process: ProcessContent;
  googleReviews: GoogleReviewsContent;
  faq: FaqContent;
  contact: ContactContent;
  firmDescription: FirmDescriptionContent;
  awardsCTA: AwardsCTAContent;
  attorneyInfo: AttorneyInfoContent;
}

// Default content - minimal placeholders as structural fallback
// Real content lives in the database
export const defaultHomeContent: HomePageContent = {
  hero: {
    h1Title: "",
    headline: "",
    highlightedText: "",
    phone: "",
    phoneLabel: "",
    featureBoxes: [],
    buttons: [],
  },
  partnerLogos: [],
  about: {
    sectionLabel: "",
    heading: "",
    description: "",
    phone: "",
    phoneLabel: "",
    contactLabel: "",
    contactText: "",
    attorneyImage: "",
    attorneyImageAlt: "",
    features: [],
    stats: [],
  },
  practiceAreasIntro: {
    sectionLabel: "",
    heading: "",
    description: "",
  },
  practiceAreas: [],
  awards: {
    sectionLabel: "",
    heading: "",
    description: "",
    logos: [],
  },
  testimonials: {
    sectionLabel: "",
    heading: "",
    backgroundImage: "",
    items: [],
  },
  process: {
    sectionLabel: "",
    headingLine1: "",
    headingLine2: "",
    steps: [],
  },
  googleReviews: {
    sectionLabel: "",
    heading: "",
    description: "",
    reviews: [],
  },
  faq: {
    heading: "",
    description: "",
    videoThumbnail: "",
    videoUrl: "",
    items: [],
  },
  contact: {
    sectionLabel: "",
    heading: "",
    description: "",
    phone: "",
    phoneLabel: "",
    address: "",
    formHeading: "",
  },
  firmDescription: {
    heading: "",
    body: "",
  },
  awardsCTA: {
    sectionLabel: "",
    heading: "",
    description: "",
    ctaText: "",
    ctaLink: "",
  },
  attorneyInfo: {
    heading: "",
    image: "",
    imageAlt: "",
    body: "",
    stayInformedHeading: "",
    stayInformedText: "",
    stayInformedImage: "",
    stayInformedImageAlt: "",
    stayInformedCaption: "",
  },
};
