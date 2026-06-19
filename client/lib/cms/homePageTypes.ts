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
  icon?: string;
}

export interface HeroContent {
  h1Title: string;
  headline: string;
  highlightedText: string;
  phone: string;
  phoneLabel: string;
  featureBoxes: HeroFeatureBox[];
  buttons: HeroButtonLink[];
  heroImage?: string;
  heroBgImage?: string;
}

export interface AboutFeature {
  number: string;
  title: string;
  description: string;
  readMoreLabel?: string;
  readMoreLink?: string;
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
  description?: string;
  image: string;
  href?: string;
  link?: string;
  icon?: string;
}

export interface PracticeAreasIntroContent {
  sectionLabel: string;
  heading: string;
  description: string;
}

export interface TestimonialItem {
  text?: string;
  quote?: string;
  author: string;
  location?: string;
  ratingImage?: string;
}

export interface TestimonialsContent {
  sectionLabel: string;
  heading: string;
  headingLevel?: 1 | 2 | 3 | 4;
  backgroundImage?: string;
  googlePlaceId?: string;
  minimumRating?: number;
  reviewStartNumber?: number;
  showReviewerName?: boolean;
  items: TestimonialItem[];
}

export interface HomeFaqItem {
  question: string;
  answer: string;
}

export interface HomeFaqContent {
  heading: string;
  items: HomeFaqItem[];
}

export interface ContactContent {
  sectionLabel: string;
  heading: string;
  description: string;
  phone: string;
  phoneLabel: string;
  address: string;
  formHeading: string;
  attorneyImage: string;
  attorneyImageAlt: string;
}

// Firm Description section (green box)
export interface FirmDescriptionContent {
  heading: string;
  headingLevel?: 1 | 2 | 3 | 4;
  body: string; // rich text HTML
  image?: string;
  ctaText?: string;
  ctaLink?: string;
  trustHeading?: string;
  trustHeadingLevel?: 1 | 2 | 3 | 4;
  trustReasons?: string[];
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
export interface AttorneyInfoFeaturedLogo {
  image: string;
  alt: string;
}

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
  featuredInHeading?: string;
  featuredInHeadingLevel?: 1 | 2 | 3 | 4;
  featuredLogos?: AttorneyInfoFeaturedLogo[];
}

// Complete homepage content structure
export interface HomePageContent {
  hero: HeroContent;
  about: AboutContent;
  practiceAreasIntro: PracticeAreasIntroContent;
  practiceAreas: PracticeAreaItem[];
  testimonials: TestimonialsContent;
  contact: ContactContent;
  firmDescription: FirmDescriptionContent;
  awardsCTA: AwardsCTAContent;
  attorneyInfo: AttorneyInfoContent;
  faq: HomeFaqContent;
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
  testimonials: {
    sectionLabel: "",
    heading: "",
    backgroundImage: "",
    googlePlaceId: "0x88f513c2103ad111:0xf0c853b13f4aa2fc",
    minimumRating: 0,
    reviewStartNumber: 1,
    showReviewerName: true,
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
    attorneyImage: "",
    attorneyImageAlt: "",
  },
  firmDescription: {
    heading: "",
    body: "",
    image: "",
    ctaText: "",
    ctaLink: "",
    trustHeading: "",
    trustReasons: [],
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
    featuredInHeading: "",
    featuredLogos: [],
  },
  faq: {
    heading: "",
    items: [],
  },
};
