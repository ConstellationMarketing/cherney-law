// Type definitions for structured Area page content (reusable template)

import type { LocationItem } from './areasWeServePageTypes';

export type { LocationItem };

export interface AreaHeroContent {
  sectionLabel: string;
  tagline: string;
}

export interface AreaTextSection {
  heading: string;
  headingLevel: 1 | 2 | 3 | 4;
  body: string;
  image?: string;
  imageAlt?: string;
}

export interface AreaCTAContent {
  heading: string;
  description: string;
  image?: string;
  imageAlt?: string;
  secondaryButton: {
    label: string;
    sublabel: string;
    href: string;
  };
}

export interface AreaLocationsSection {
  heading: string;
  introText: string;
  items: LocationItem[];
}

export interface AreaMapSection {
  heading?: string;
  embedUrl: string;
}

export interface AreaFaqItem {
  question: string;
  answer: string;
}

export interface AreaFaqContent {
  enabled: boolean;
  heading: string;
  items: AreaFaqItem[];
}

export interface AreaPageContent {
  hero: AreaHeroContent;
  introSection: AreaTextSection;
  whySection: AreaTextSection;
  closingSection: AreaTextSection;
  faq: AreaFaqContent;
  cta: AreaCTAContent;
  locationsSection: AreaLocationsSection;
  mapSection: AreaMapSection;
}

export const defaultAreaPageContent: AreaPageContent = {
  hero: {
    sectionLabel: '– Areas We Serve',
    tagline: 'Comprehensive Bankruptcy Representation',
  },
  introSection: {
    heading: 'Introduction',
    headingLevel: 2,
    body: '<p>Enter introduction content here.</p>',
    image: '',
    imageAlt: '',
  },
  whySection: {
    heading: 'Why Choose Us',
    headingLevel: 2,
    body: '<p>Enter why section content here.</p>',
    image: '',
    imageAlt: '',
  },
  closingSection: {
    heading: 'Contact Us Today',
    headingLevel: 2,
    body: '<p>Enter closing content here.</p>',
    image: '',
    imageAlt: '',
  },
  faq: {
    enabled: true,
    heading: 'Frequently Asked Questions',
    items: [],
  },
  cta: {
    heading: 'Ready to Get Started?',
    description: 'Contact us today for a free consultation and take the first step toward financial freedom.',
    image: '',
    imageAlt: '',
    secondaryButton: {
      label: 'Schedule Now',
      sublabel: 'Free Consultation',
      href: '/contact/',
    },
  },
  locationsSection: {
    heading: 'Areas We Serve',
    introText: 'We are proud to serve clients in the following communities:',
    items: [],
  },
  mapSection: {
    heading: '',
    embedUrl: '',
  },
};
