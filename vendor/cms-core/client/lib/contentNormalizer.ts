// Content normalizers ensure page content matches expected types

import type {
  HomePageContent,
  AboutPageContent,
  ContactPageContent,
  PracticeAreasPageContent,
  TestimonialsPageContent,
  FeatureBox,
  StatItem,
  TestimonialItem,
  FAQItem,
  PracticeAreaItem,
  Button,
  Badge,
  ProcessStep,
  ContentTab,
  OfficeTab,
} from './pageContentTypes';

// Helper to ensure object with defaults
function ensureObject<T>(val: unknown, defaults: T): T {
  if (typeof val === 'object' && val !== null) {
    return { ...defaults, ...(val as any) };
  }
  return defaults;
}

// Helper to ensure array
function ensureArray<T>(val: unknown, itemDefaults: T): T[] {
  if (Array.isArray(val)) {
    return val.map(item => ensureObject(item, itemDefaults));
  }
  return [];
}

// String field helper
function str(val: unknown): string {
  return typeof val === 'string' ? val : '';
}

export function normalizeHomePageContent(content: unknown): HomePageContent {
  const c = ensureObject(content, {});

  return {
    hero: ensureObject(c.hero, {
      h1Title: str(c.hero?.h1Title),
      headline: str(c.hero?.headline),
      highlightedText: str(c.hero?.highlightedText),
      phone: str(c.hero?.phone),
      phoneLabel: str(c.hero?.phoneLabel),
      featureBoxes: ensureArray(c.hero?.featureBoxes, { icon: '', title: '', description: '' }),
      buttons: ensureArray(c.hero?.buttons, { text: '', href: '' }),
      heroImage: str(c.hero?.heroImage),
      heroBgImage: str(c.hero?.heroBgImage),
    }),
    about: ensureObject(c.about, {
      sectionLabel: str(c.about?.sectionLabel),
      heading: str(c.about?.heading),
      description: str(c.about?.description),
      phone: str(c.about?.phone),
      phoneLabel: str(c.about?.phoneLabel),
      contactLabel: str(c.about?.contactLabel),
      contactText: str(c.about?.contactText),
      attorneyImage: str(c.about?.attorneyImage),
      features: ensureArray(c.about?.features, { icon: '', title: '', description: '' }),
      stats: ensureArray(c.about?.stats, { value: '', label: '' }),
    }),
    practiceAreasIntro: ensureObject(c.practiceAreasIntro, {
      sectionLabel: str(c.practiceAreasIntro?.sectionLabel),
      heading: str(c.practiceAreasIntro?.heading),
      description: str(c.practiceAreasIntro?.description),
    }),
    practiceAreas: ensureArray(c.practiceAreas, { title: '', description: '', icon: '', href: '' }),
    testimonials: ensureObject(c.testimonials, {
      sectionLabel: str(c.testimonials?.sectionLabel),
      heading: str(c.testimonials?.heading),
      backgroundImage: str(c.testimonials?.backgroundImage),
      items: ensureArray(c.testimonials?.items, { quote: '', author: '', location: '' }),
    }),
    contact: ensureObject(c.contact, {
      sectionLabel: str(c.contact?.sectionLabel),
      heading: str(c.contact?.heading),
      description: str(c.contact?.description),
      phone: str(c.contact?.phone),
      phoneLabel: str(c.contact?.phoneLabel),
      address: str(c.contact?.address),
      formHeading: str(c.contact?.formHeading),
      attorneyImage: str(c.contact?.attorneyImage),
    }),
    firmDescription: ensureObject(c.firmDescription, {
      heading: str(c.firmDescription?.heading),
      body: str(c.firmDescription?.body),
    }),
    awardsCTA: ensureObject(c.awardsCTA, {
      sectionLabel: str(c.awardsCTA?.sectionLabel),
      heading: str(c.awardsCTA?.heading),
      description: str(c.awardsCTA?.description),
      ctaText: str(c.awardsCTA?.ctaText),
      ctaLink: str(c.awardsCTA?.ctaLink),
    }),
    attorneyInfo: ensureObject(c.attorneyInfo, {
      heading: str(c.attorneyInfo?.heading),
      image: str(c.attorneyInfo?.image),
      imageAlt: str(c.attorneyInfo?.imageAlt),
      body: str(c.attorneyInfo?.body),
      stayInformedHeading: str(c.attorneyInfo?.stayInformedHeading),
      stayInformedText: str(c.attorneyInfo?.stayInformedText),
      stayInformedImage: str(c.attorneyInfo?.stayInformedImage),
      stayInformedImageAlt: str(c.attorneyInfo?.stayInformedImageAlt),
      stayInformedCaption: str(c.attorneyInfo?.stayInformedCaption),
    }),
  };
}

export function normalizeAboutPageContent(content: unknown): AboutPageContent {
  const c = ensureObject(content, {});

  return {
    hero: ensureObject(c.hero, {
      sectionLabel: str(c.hero?.sectionLabel),
      tagline: str(c.hero?.tagline),
    }),
    story: ensureObject(c.story, {
      sectionLabel: str(c.story?.sectionLabel),
      heading: str(c.story?.heading),
      leftContent: str(c.story?.leftContent),
      rightContent: str(c.story?.rightContent),
      image: str(c.story?.image),
      imageAlt: str(c.story?.imageAlt),
      badges: ensureArray(c.story?.badges, { image: '', alt: '' }),
    }),
    missionVision: ensureObject(c.missionVision, {
      mission: ensureObject(c.missionVision?.mission, {
        heading: str(c.missionVision?.mission?.heading),
        text: str(c.missionVision?.mission?.text),
      }),
      vision: ensureObject(c.missionVision?.vision, {
        heading: str(c.missionVision?.vision?.heading),
        text: str(c.missionVision?.vision?.text),
      }),
    }),
    featureBoxes: ensureArray(c.featureBoxes, { icon: '', title: '', description: '' }),
    stats: ensureObject(c.stats, {
      stats: ensureArray(c.stats?.stats, { value: '', label: '' }),
    }),
    whyChooseUs: ensureObject(c.whyChooseUs, {
      sectionLabel: str(c.whyChooseUs?.sectionLabel),
      heading: str(c.whyChooseUs?.heading),
      description: str(c.whyChooseUs?.description),
      image: str(c.whyChooseUs?.image),
      imageAlt: str(c.whyChooseUs?.imageAlt),
      items: ensureArray(c.whyChooseUs?.items, { icon: '', title: '', description: '' }),
    }),
    cta: ensureObject(c.cta, {
      heading: str(c.cta?.heading),
      description: str(c.cta?.description),
      secondaryButton: ensureObject(c.cta?.secondaryButton, { text: '', href: '' }),
    }),
  };
}

export function normalizeContactPageContent(content: unknown): ContactPageContent {
  const c = ensureObject(content, {});

  return {
    hero: ensureObject(c.hero, {
      sectionLabel: str(c.hero?.sectionLabel),
      tagline: str(c.hero?.tagline),
      description: str(c.hero?.description),
    }),
    offices: ensureArray(c.offices, {
      tabLabel: '',
      addressLine1: '',
      addressLine2: '',
      phone: '',
      email: '',
      hours: '',
      mapEmbedUrl: '',
    }),
    formSettings: ensureObject(c.formSettings, {
      heading: str(c.formSettings?.heading),
      subtext: str(c.formSettings?.subtext),
      submitButtonText: str(c.formSettings?.submitButtonText),
      consentText: str(c.formSettings?.consentText),
      privacyPolicyUrl: str(c.formSettings?.privacyPolicyUrl),
      termsOfServiceUrl: str(c.formSettings?.termsOfServiceUrl),
    }),
    process: ensureObject(c.process, {
      sectionLabel: str(c.process?.sectionLabel),
      heading: str(c.process?.heading),
      subtitle: str(c.process?.subtitle),
      steps: ensureArray(c.process?.steps, { stepNumber: '', title: '', description: '' }),
    }),
  };
}

export function normalizePracticeAreasPageContent(content: unknown): PracticeAreasPageContent {
  const c = ensureObject(content, {});

  return {
    hero: ensureObject(c.hero, {
      sectionLabel: str(c.hero?.sectionLabel),
      tagline: str(c.hero?.tagline),
      subtext: str(c.hero?.subtext),
    }),
    tabs: ensureArray(c.tabs, {
      tabLabel: '',
      heading: '',
      content: '',
      image: '',
      imageAlt: '',
    }),
    grid: ensureObject(c.grid, {
      heading: str(c.grid?.heading),
      description: str(c.grid?.description),
      areas: ensureArray(c.grid?.areas, { title: '', description: '', icon: '', href: '' }),
    }),
    cta: ensureObject(c.cta, {
      heading: str(c.cta?.heading),
      content: str(c.cta?.content),
      buttonLabel: str(c.cta?.buttonLabel),
      buttonLink: str(c.cta?.buttonLink),
    }),
    faq: ensureObject(c.faq, {
      heading: str(c.faq?.heading),
      items: ensureArray(c.faq?.items, { question: '', answer: '' }),
    }),
  };
}

export function normalizeTestimonialsPageContent(content: unknown): TestimonialsPageContent {
  const c = ensureObject(content, {});

  return {
    hero: ensureObject(c.hero, {
      sectionLabel: str(c.hero?.sectionLabel),
      tagline: str(c.hero?.tagline),
    }),
    reviews: ensureObject(c.reviews, {
      placeId: str(c.reviews?.placeId),
      heading: str(c.reviews?.heading),
      subtext: str(c.reviews?.subtext),
    }),
    cta: ensureObject(c.cta, {
      heading: str(c.cta?.heading),
      description: str(c.cta?.description),
      secondaryButton: ensureObject(c.cta?.secondaryButton, { text: '', href: '' }),
    }),
  };
}
