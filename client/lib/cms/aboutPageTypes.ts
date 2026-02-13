// Type definitions for structured About page content
// Each section maps directly to a static component's data needs

export interface AboutHeroButton {
  label: string;
  href: string;
}

export interface AboutHeroContent {
  sectionLabel: string; // "– About Us" (H1)
  tagline: string; // Tagline below H1
  buttons: AboutHeroButton[]; // White hero buttons (like homepage)
}

export interface BadgeItem {
  image: string;
  alt: string;
  link: string;
}

export interface StoryContent {
  sectionLabel: string; // "– Our Story"
  heading: string; // Section heading
  leftContent: string; // Rich text HTML for left column
  rightContent: string; // Rich text HTML for right column
  image: string; // Main attorney/firm image
  imageAlt: string;
  badges: BadgeItem[]; // Linkable badge images
}

export interface MissionVisionContent {
  mission: {
    heading: string;
    text: string;
  };
  vision: {
    heading: string;
    text: string;
  };
}

export interface FeatureBox {
  title: string;
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
  sectionLabel: string;
  heading: string;
  description: string; // Rich text HTML
  image: string;
  imageAlt: string;
  items: WhyChooseUsItem[];
}

export interface CTAButton {
  label: string;
  href: string;
}

export interface CTAContent {
  heading: string;
  description: string;
  buttons: CTAButton[];
}

// Complete About page content structure
export interface AboutPageContent {
  hero: AboutHeroContent;
  story: StoryContent;
  missionVision: MissionVisionContent;
  featureBoxes: FeatureBox[];
  stats: StatsContent;
  whyChooseUs: WhyChooseUsContent;
  cta: CTAContent;
}

// Default content - used as fallback when CMS content is not available
export const defaultAboutContent: AboutPageContent = {
  hero: {
    sectionLabel: "– About Us",
    tagline: "Matthew J. Cherney: Cobb County Bankruptcy Attorney Profile",
    buttons: [
      { label: "Attorney Profile", href: "/about" },
    ],
  },
  story: {
    sectionLabel: "– Our Story",
    heading: "Building Trust Through Experienced Representation",
    leftContent:
      "<p>Bankruptcy should be pursued along with the counsel and representation of a <a href=\"/about\">Cobb County bankruptcy attorney</a> with an outstanding attorney profile. It is important to hire a legal advisor who is experienced and capable of obtaining the best possible results for your situation.</p><p>Attorney Matthew Cherney, founder of Cherney Law Firm LLC, received his Bachelor's Degree from Carthage College in Kenosha, Wisconsin before going on to receive his Juris Doctorate from Western Michigan University (The Thomas M. Cooley Law School) in Lansing, Michigan.</p><p>After graduating law school, Matthew was admitted to the State Bar of Illinois and began his legal career in his hometown of Chicago, Illinois, where he represented clients in all areas of debt relief for a large bankruptcy firm. In 2008, he moved to Georgia and was admitted to the State Bar of Georgia. Over the years, he gained experience at both large-volume and mid-volume consumer bankruptcy firms before starting his own practice in 2012.</p>",
    rightContent:
      "<p>Mr. Cherney now seeks to provide personal attention and counseling for all his clients, working personally with them from their initial consultation all the way through the completion of their case. Having represented over thousands of clients since he began practicing law, Matthew has helped to improve many individuals' quality of life and to decrease their financial stress.</p>",
    image: "/images/team/attorney-2.png",
    imageAlt: "Attorney Matthew J. Cherney",
    badges: [],
  },
  missionVision: {
    mission: {
      heading: "Our Mission",
      text: "To provide exceptional legal representation that empowers our clients, protects their rights, and delivers justice. We are committed to being accessible, responsive, and relentless in pursuing the best outcomes for those we serve.",
    },
    vision: {
      heading: "Our Vision",
      text: "To be the most trusted and respected bankruptcy law firm in the greater Atlanta area, recognized for our unwavering integrity, legal excellence, and genuine care for our clients.",
    },
  },
  featureBoxes: [
    { title: "Veterans Discount Available" },
    { title: "Chapter 7 Payment Plans Starting at $0 Down" },
    { title: "Free Initial Consultation" },
  ],
  stats: {
    stats: [
      { value: "14+", label: "Years of Bankruptcy Experience" },
      { value: "1000+", label: "Cases Successfully Handled" },
      { value: "3", label: "Office Locations" },
      { value: "98%", label: "Client Satisfaction Rate" },
    ],
  },
  whyChooseUs: {
    sectionLabel: "– Why Choose Us",
    heading: "What Sets Us Apart",
    description:
      "<p>When you choose Cherney Law Firm, you're choosing a team that combines legal expertise with genuine care for your well-being. Here's what makes us different:</p>",
    image: "/images/stock/law-firm-team.jpg",
    imageAlt: "Cherney Law Firm office",
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
          "Our history of successful cases speaks for itself. We have the experience and skills to get results.",
      },
      {
        number: "3",
        title: "Convenient Locations",
        description:
          "With offices in Marietta, Woodstock, and Alpharetta, we are conveniently located to serve clients across the greater Atlanta area.",
      },
      {
        number: "4",
        title: "Free Consultation",
        description:
          "We offer a free initial consultation to discuss your situation and explore your options with no obligation.",
      },
    ],
  },
  cta: {
    heading: "Ready to Discuss Your Case?",
    description: "Our experienced legal team is standing by to help you.",
    buttons: [
      { label: "Call Us 24/7", href: "tel:7703831527" },
      { label: "Schedule a Consultation", href: "/contact" },
    ],
  },
};
