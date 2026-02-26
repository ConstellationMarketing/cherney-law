// Type definitions for structured Areas We Serve page content

export interface AreasWeServeHeroContent {
  sectionLabel: string; // "– Areas We Serve"
  tagline: string; // Tagline below H1
}

export interface LocationItem {
  name: string; // Location name (required)
  description?: string; // Optional description text
  href?: string; // Optional link to individual location page
}

export interface IntroSection {
  heading: string; // Implicit H1 in hero
  body: string; // Rich text HTML for intro paragraph
}

export interface WhySection {
  heading: string; // "Advantageous Atlanta Bankruptcy Representation" (H2)
  body: string; // Rich text HTML with benefits and closing text
}

export interface LocationsSection {
  heading: string; // "At Cherney Law Firm LLC, we are proud to serve..."
  introText: string; // Intro text before locations list
  items: LocationItem[]; // Array of location items
}

export interface CTAContent {
  heading: string; // "Ready to Get Started?"
  description: string; // CTA description text
  image?: string; // CTA image URL (optional)
  imageAlt?: string; // CTA image alt text
  secondaryButton: {
    label: string; // "Schedule Now"
    sublabel: string; // "Free Consultation"
    href: string; // "/contact"
  };
}

// Complete Areas We Serve page content structure
export interface AreasWeServePageContent {
  hero: AreasWeServeHeroContent;
  introSection: IntroSection;
  whySection: WhySection;
  locationsSection: LocationsSection;
  cta: CTAContent;
}

// Default content - used as fallback when CMS content is not available
export const defaultAreasWeServeContent: AreasWeServePageContent = {
  hero: {
    sectionLabel: "– Areas We Serve",
    tagline: "Comprehensive Bankruptcy Representation Across Greater Atlanta",
  },
  introSection: {
    heading: "Areas We Serve",
    body: "<p>Struggling to make monthly payments on your loans or consumer debt? A passionate Atlanta bankruptcy attorney from Cherney Law Firm LLC could help! Since 2005, I have personally represented thousands of clients in both Chapter 7 and Chapter 13 bankruptcy cases. I have also assisted clients in pursuing different alternatives to bankruptcy. You may be able to achieve relief through debt negotiation or debt settlement, discharging your debt so that you are no longer held responsible for repayment. The process starts by taking a means test, so speak with an attorney as soon as possible to get started. Consult with my firm today to determine whether or not bankruptcy is the right course of action for your situation.</p>",
  },
  whySection: {
    heading: "Advantageous Atlanta Bankruptcy Representation",
    body: "<p>Don't be afraid to consider bankruptcy as an option. There are many benefits of bankruptcy, including putting an end to creditor harassment and your financial stress. There may be many myths about bankruptcy and its downsides but do not be fooled. It does not liquidate all of your assets and take everything you own from you. Bankruptcy exemptions could allow you to keep certain necessary items, which means that you will not lose everything. There is life after bankruptcy and you shouldn't hesitate to consult with an attorney to learn what such action could do to help you achieve financial freedom.</p><p>If you are located in the Marietta area, please contact my firm today for a free initial consultation. At no cost to you, you could learn exactly how I could provide you with the advice and representation that you need to successfully file for bankruptcy. To get started, fill out the online case evaluation or call my offices to schedule an appointment. I look forward to hearing from you and assisting you as you pursue financial relief!</p>",
  },
  locationsSection: {
    heading: "At Cherney Law Firm LLC, we are proud to serve clients in Marietta, Georgia as well as all the following Atlanta area communities:",
    introText: "At Cherney Law Firm LLC, we are proud to serve clients in Marietta, Georgia as well as all the following Atlanta area communities:",
    items: [
      { name: "Alpharetta" },
      { name: "Atlanta" },
      { name: "Austell" },
      { name: "Cherokee County" },
      { name: "Cobb County" },
      { name: "Kennesaw" },
      { name: "Mableton" },
      { name: "Marietta" },
      { name: "North Fulton County" },
      { name: "Paulding County" },
      { name: "Powder Springs" },
      { name: "Roswell" },
      { name: "Smyrna" },
      { name: "Woodstock" },
    ],
  },
  cta: {
    heading: "Ready to Get Started?",
    description: "Contact us today for a free consultation and take the first step toward financial freedom.",
    image: "",
    imageAlt: "",
    secondaryButton: {
      label: "Schedule Now",
      sublabel: "Free Consultation",
      href: "/contact",
    },
  },
};
