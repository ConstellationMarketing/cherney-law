// Type definitions for structured homepage content
// Each section maps directly to a static component's data needs

export interface HeroContent {
  h1Title: string; // H1 title text (all caps, ~20px) between headline and phone button
  headline: string;
  highlightedText: string;
  phone: string;
  phoneLabel: string;
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
}

// Default content - used as fallback when CMS content is not available
export const defaultHomeContent: HomePageContent = {
  hero: {
    h1Title: "ATLANTA PERSONAL INJURY LAWYERS",
    headline: "with integrity, experience, and relentless advocacy.",
    highlightedText: "Protecting your rights",
    phone: "404-555-5555",
    phoneLabel: "Call Us 24/7",
  },
  partnerLogos: [
    { src: "/images/logos/google-rating.png", alt: "Google Rating" },
    {
      src: "/images/logos/atlanta-law-firm-marketing.png",
      alt: "Atlanta Law Firm Marketing 2023",
    },
    { src: "/images/logos/award-badge-1.png", alt: "Award Badge" },
    { src: "/images/logos/legal-talk-network.png", alt: "Legal Talk Network" },
    { src: "/images/logos/award-badge-2.png", alt: "Award Badge" },
    { src: "/images/logos/award-badge-3.png", alt: "Award Badge" },
  ],
  about: {
    sectionLabel: "– About Us",
    heading: "A Leading Lawyer for an Atlanta Law Firm",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi",
    phone: "404-555-5555",
    phoneLabel: "Call Us 24/7",
    contactLabel: "Contact Us",
    contactText: "For a Free Consultation",
    attorneyImage: "/images/team/attorney-1.png",
    attorneyImageAlt: "Attorney",
    features: [
      {
        number: "1",
        title: "Nationwide Representation",
        description:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi eget augue tincidunt, rhoncus lacus a, congue diam.",
      },
      {
        number: "2",
        title: "Understanding Your Case",
        description:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi eget augue tincidunt, rhoncus lacus a, congue diam.",
      },
      {
        number: "3",
        title: "Seeking Compensation",
        description:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi eget augue tincidunt, rhoncus lacus a, congue diam.",
      },
    ],
    stats: [
      { value: "1000+", label: "Trusted Clients Served" },
      { value: "$50 Million", label: "Recovered in Legal Dispute Settlements" },
      { value: "98%", label: "Client Satisfaction Rate" },
      { value: "150+", label: "Legal Professionals Available 24/7" },
    ],
  },
  practiceAreasIntro: {
    sectionLabel: "– Practice Areas",
    heading: "Legal Cases We Handle",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  practiceAreas: [
    {
      title: "Practice Area",
      image: "/images/practice-areas/personal-injury.jpg",
      link: "/practice-areas",
    },
    {
      title: "Practice Area",
      image: "/images/practice-areas/medical-malpractice.jpg",
      link: "/practice-areas",
    },
    {
      title: "Practice Area",
      image: "/images/practice-areas/workers-compensation.jpg",
      link: "/practice-areas",
    },
    {
      title: "Practice Area",
      image: "/images/practice-areas/wrongful-death.jpg",
      link: "/practice-areas",
    },
  ],
  awards: {
    sectionLabel: "– Achievements",
    heading: "Awards & Membership",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi",
    logos: [
      { src: "/images/awards/award-1.png", alt: "Award Logo" },
      { src: "/images/awards/award-2.png", alt: "Award Logo" },
      { src: "/images/awards/award-3.png", alt: "Award Logo" },
      { src: "/images/awards/award-4.png", alt: "Award Logo" },
      { src: "/images/awards/award-5.png", alt: "Award Logo" },
      { src: "/images/awards/award-6.png", alt: "Award Logo" },
      { src: "/images/awards/forbes.png", alt: "Forbes" },
      { src: "/images/awards/lc-logo.png", alt: "LC Logo" },
    ],
  },
  testimonials: {
    sectionLabel: "– Testimonials",
    heading: "Inspiring client success stories that drive change.",
    backgroundImage: "/images/backgrounds/testimonials-bg.jpg",
    items: [
      {
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi . Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
        author: "Sharon",
        ratingImage: "/images/logos/rating-stars.png",
      },
      {
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi . Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
        author: "Sharon",
        ratingImage: "/images/logos/rating-stars.png",
      },
      {
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi . Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
        author: "Sharon",
        ratingImage: "/images/logos/rating-stars.png",
      },
    ],
  },
  process: {
    sectionLabel: "– Process",
    headingLine1: "Get Started Easily.",
    headingLine2: "Take a Look at The Steps",
    steps: [
      {
        number: "01",
        title: "Step 1",
        description:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut.",
      },
      {
        number: "02",
        title: "Step 2",
        description:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut.",
      },
      {
        number: "03",
        title: "Step 3",
        description:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut.",
      },
    ],
  },
  googleReviews: {
    sectionLabel: "– Google Reviews",
    heading: "Real Voices, Real Trust: Our Google Reviews",
    description:
      "Our clients share their stories and insights about working with us. Dive into their experiences to understand how we prioritize your legal success.",
    reviews: [
      {
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi . Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor. consectetur adipiscing elit, sed do eiusmod tempor.",
        author: "Lorem Ipsum",
        ratingImage:
          "https://design.constellationdev.com/wp-content/uploads/2025/06/Group-2-min.png",
      },
      {
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi . Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor. consectetur adipiscing elit, sed do eiusmod tempor.",
        author: "Lorem Ipsum",
        ratingImage:
          "https://design.constellationdev.com/wp-content/uploads/2025/06/Group-2-min.png",
      },
      {
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi . Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor. consectetur adipiscing elit, sed do eiusmod tempor.",
        author: "Lorem Ipsum",
        ratingImage:
          "https://design.constellationdev.com/wp-content/uploads/2025/06/Group-2-min.png",
      },
      {
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi . Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor. consectetur adipiscing elit, sed do eiusmod tempor.",
        author: "Lorem Ipsum",
        ratingImage:
          "https://design.constellationdev.com/wp-content/uploads/2025/06/Group-2-min.png",
      },
      {
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi . Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor. consectetur adipiscing elit, sed do eiusmod tempor.",
        author: "Lorem Ipsum",
        ratingImage:
          "https://design.constellationdev.com/wp-content/uploads/2025/06/Group-2-min.png",
      },
      {
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi . Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor. consectetur adipiscing elit, sed do eiusmod tempor.",
        author: "Lorem Ipsum",
        ratingImage:
          "https://design.constellationdev.com/wp-content/uploads/2025/06/Group-2-min.png",
      },
    ],
  },
  faq: {
    heading: "Frequently Asked Questions",
    description:
      "Aenean porta erat id urna porttitor scelerisque. Aliquam vitae auctor nunc.",
    videoThumbnail: "/images/backgrounds/faq-bg.jpg",
    videoUrl:
      "https://www.youtube.com/embed/FkQuawiGWUw?autoplay=1&feature=oembed",
    items: [
      {
        question: "This is an example FAQ",
        answer:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut.",
      },
      {
        question: "This is an example FAQ",
        answer:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut.",
      },
      {
        question: "This is an example FAQ",
        answer:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut.",
      },
      {
        question: "This is an example FAQ",
        answer:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut.",
      },
    ],
  },
  contact: {
    sectionLabel: "– Contact",
    heading: "Get in Touch",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    phone: "404-555-5555",
    phoneLabel: "Call Us 24/7",
    address: "4120 Presidential Parkway, Suite 200, Atlanta, GA 30340",
    formHeading: "Send Us a Message",
  },
};
