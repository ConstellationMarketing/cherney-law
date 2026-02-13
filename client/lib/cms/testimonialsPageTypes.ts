// Type definitions for structured Testimonials page content

export interface TestimonialsHeroContent {
  sectionLabel: string; // "– Testimonials" (H1)
  tagline: string; // Tagline below H1
}

export interface GoogleReviewsContent {
  placeId: string; // Google Place ID for reviews (used in direct link and API)
  heading: string; // Section heading above reviews
  subtext: string; // Optional description text
}

export interface CTAContent {
  heading: string; // "Ready to Get Started?"
  description: string; // CTA description text
  secondaryButton: {
    label: string; // "Schedule Now"
    sublabel: string; // "Free Consultation"
    href: string; // "/contact"
  };
}

// Complete Testimonials page content structure
export interface TestimonialsPageContent {
  hero: TestimonialsHeroContent;
  reviews: GoogleReviewsContent;
  cta: CTAContent;
}

// Default content - used as fallback when CMS content is not available
export const defaultTestimonialsContent: TestimonialsPageContent = {
  hero: {
    sectionLabel: "– Testimonials",
    tagline: "What Our Clients Say",
  },
  reviews: {
    placeId: "0x88f513c2103ad111:0xf0c853b13f4aa2fc", // Cherney Law Firm, LLC
    heading: "Client Reviews",
    subtext:
      "Read what our clients have to say about their experience working with Cherney Law Firm.",
  },
  cta: {
    heading: "Ready to Get Started?",
    description:
      "Contact us today for a free consultation and take the first step toward financial freedom.",
    secondaryButton: {
      label: "Schedule Now",
      sublabel: "Free Consultation",
      href: "/contact",
    },
  },
};
