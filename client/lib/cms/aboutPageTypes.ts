// Type definitions for structured About page content
// Each section maps directly to a static component's data needs

export interface AboutHeroContent {
  sectionLabel: string; // "– About Us" (H1)
  tagline: string; // "Dedicated to Justice & Excellence" (styled paragraph)
  description: string; // Description paragraph
  phone: string;
  phoneLabel: string;
}

export interface StoryContent {
  sectionLabel: string; // "– Our Story"
  heading: string; // "Building Trust Since 1999"
  paragraphs: string[]; // Array of paragraph texts
  image: string;
  imageAlt: string;
}

export interface MissionVisionContent {
  mission: {
    heading: string; // "Our Mission"
    text: string; // Mission paragraph
  };
  vision: {
    heading: string; // "Our Vision"
    text: string; // Vision paragraph
  };
}

export interface TeamMember {
  name: string;
  title: string;
  bio: string;
  image: string;
  specialties: string[];
}

export interface TeamContent {
  sectionLabel: string; // "– Our Legal Team"
  heading: string; // "Experienced Attorneys..."
  members: TeamMember[];
}

export interface ValueItem {
  icon: string; // Lucide icon name
  title: string;
  description: string;
}

export interface ValuesContent {
  sectionLabel: string; // "– Our Values"
  heading: string; // "Principles That Guide Our Practice"
  subtitle: string; // Subtitle text (NEW)
  items: ValueItem[];
}

export interface StatItem {
  value: string;
  label: string;
}

export interface StatsContent {
  stats: StatItem[];
}

export interface WhyChooseUsItem {
  number: string;
  title: string;
  description: string;
}

export interface WhyChooseUsContent {
  sectionLabel: string; // "– Why Choose Us"
  heading: string; // "What Sets Us Apart"
  description: string; // Intro paragraph
  items: WhyChooseUsItem[];
}

export interface CTAContent {
  heading: string; // "Ready to Discuss Your Case?"
  description: string; // Subtitle text
  primaryButton: {
    label: string; // "Call Us 24/7"
    phone: string; // Phone number
  };
  secondaryButton: {
    label: string; // "Schedule Now"
    sublabel: string; // "Free Consultation"
    link: string; // Link URL
  };
}

// Complete About page content structure
export interface AboutPageContent {
  hero: AboutHeroContent;
  story: StoryContent;
  missionVision: MissionVisionContent;
  team: TeamContent;
  values: ValuesContent;
  stats: StatsContent;
  whyChooseUs: WhyChooseUsContent;
  cta: CTAContent;
}

// Default content - used as fallback when CMS content is not available
export const defaultAboutContent: AboutPageContent = {
  hero: {
    sectionLabel: "– About Us",
    tagline: "Dedicated to Justice & Excellence",
    description:
      "For over two decades, our law firm has stood as a beacon of hope for individuals facing legal challenges. We combine deep legal expertise with genuine compassion to deliver results that change lives.",
    phone: "404-555-5555",
    phoneLabel: "Call Us 24/7",
  },
  story: {
    sectionLabel: "– Our Story",
    heading: "Building Trust Since 1999",
    paragraphs: [
      "Our firm was founded on a simple but powerful principle: every person deserves access to exceptional legal representation, regardless of their circumstances.",
      "What started as a small practice has grown into one of Atlanta's most respected law firms, but our core values remain unchanged. We still treat every client like family and fight for their rights with unwavering dedication.",
      "Today, our team of experienced attorneys has recovered over $50 million for our clients and continues to set new standards for legal excellence in our community.",
    ],
    image: "/images/team/attorney-2.png",
    imageAlt: "Our Law Firm",
  },
  missionVision: {
    mission: {
      heading: "Our Mission",
      text: "To provide exceptional legal representation that empowers our clients, protects their rights, and delivers justice. We are committed to being accessible, responsive, and relentless in pursuing the best outcomes for those we serve.",
    },
    vision: {
      heading: "Our Vision",
      text: "To be the most trusted and respected law firm in Atlanta, recognized for our unwavering integrity, legal excellence, and genuine care for our clients. We envision a community where everyone has access to justice.",
    },
  },
  team: {
    sectionLabel: "– Our Legal Team",
    heading: "Experienced Attorneys Dedicated to Your Success",
    members: [
      {
        name: "John Anderson",
        title: "Senior Partner",
        bio: "With over 20 years of experience in personal injury law, John has successfully represented thousands of clients and recovered millions in settlements.",
        image: "/images/team/attorney-1.png",
        specialties: [
          "Personal Injury",
          "Medical Malpractice",
          "Wrongful Death",
        ],
      },
      {
        name: "Sarah Mitchell",
        title: "Managing Partner",
        bio: "Sarah specializes in complex litigation and has a proven track record of winning cases that others considered unwinnable.",
        image: "/images/team/attorney-1.png",
        specialties: ["Civil Litigation", "Class Actions", "Product Liability"],
      },
      {
        name: "Michael Chen",
        title: "Senior Attorney",
        bio: "Michael brings expertise in workplace injury cases and has helped countless workers receive the compensation they deserve.",
        image: "/images/team/attorney-1.png",
        specialties: [
          "Workers Compensation",
          "Employment Law",
          "Disability Claims",
        ],
      },
    ],
  },
  values: {
    sectionLabel: "– Our Values",
    heading: "Principles That Guide Our Practice",
    subtitle: "",
    items: [
      {
        icon: "Scale",
        title: "Integrity",
        description:
          "We uphold the highest ethical standards in every case we handle. Your trust is our foundation, and we never compromise on honesty and transparency.",
      },
      {
        icon: "Award",
        title: "Excellence",
        description:
          "Our commitment to excellence drives us to thoroughly prepare every case, leverage cutting-edge legal strategies, and pursue the best possible outcomes.",
      },
      {
        icon: "Users",
        title: "Client-First Approach",
        description:
          "Your needs come first. We listen carefully, communicate clearly, and work tirelessly to protect your rights and achieve your goals.",
      },
      {
        icon: "Heart",
        title: "Compassion",
        description:
          "We understand that legal issues often arise during difficult times. Our team provides not just legal expertise, but genuine care and support.",
      },
    ],
  },
  stats: {
    stats: [
      { value: "25+", label: "Years Combined Legal Experience" },
      { value: "1000+", label: "Cases Successfully Handled" },
      { value: "$50M+", label: "Recovered for Clients" },
      { value: "98%", label: "Client Satisfaction Rate" },
    ],
  },
  whyChooseUs: {
    sectionLabel: "– Why Choose Us",
    heading: "What Sets Us Apart",
    description:
      "When you choose our firm, you're choosing a team that combines legal expertise with genuine care for your well-being. Here's what makes us different:",
    items: [
      {
        number: "1",
        title: "Personalized Attention",
        description:
          "Every case receives individualized care. We take time to understand your unique situation and develop a tailored legal strategy.",
      },
      {
        number: "2",
        title: "Proven Track Record",
        description:
          "Our history of successful verdicts and settlements speaks for itself. We have the experience and skills to win.",
      },
      {
        number: "3",
        title: "24/7 Availability",
        description:
          "Legal emergencies don't wait for business hours. Our team is available around the clock to address your concerns.",
      },
      {
        number: "4",
        title: "No Win, No Fee",
        description:
          "We work on a contingency basis for most cases, meaning you pay nothing unless we win your case.",
      },
    ],
  },
  cta: {
    heading: "Ready to Discuss Your Case?",
    description: "Our experienced legal team is standing by to help you.",
    primaryButton: {
      label: "Call Us 24/7",
      phone: "404-555-5555",
    },
    secondaryButton: {
      label: "Schedule Now",
      sublabel: "Free Consultation",
      link: "/contact",
    },
  },
};
