// Type definitions for structured Testimonials page content

export interface TestimonialsHeroContent {
  sectionLabel: string; // "– Testimonials" (H1)
  tagline: string; // Tagline below H1
}

export interface GoogleReviewsContent {
  placeId: string; // Google Place ID for reviews (used in direct link)
  mapEmbedUrl: string; // Google Maps embed URL (get from Google Maps > Share > Embed a map)
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
    mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d106243.86665951178!2d-84.63047908671876!3d33.95288770000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88f513c2103ad111%3A0xf0c853b13f4aa2fc!2sCherney%20Law%20Firm%2C%20LLC!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus",
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
