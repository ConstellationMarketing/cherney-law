// Type definitions for structured Practice Areas page content
// Each section maps directly to a static component's data needs

export interface PracticeAreasHeroContent {
  sectionLabel: string; // "– Practice Areas" (H1)
  tagline: string; // "Comprehensive Legal Expertise" (styled text)
  description: string; // Description paragraph
  phone: string;
  phoneLabel: string;
}

export interface PracticeAreaGridItem {
  icon: string; // Lucide icon name
  title: string; // "Personal Injury"
  description: string; // Description text
  image: string; // Background image URL
  link: string; // Link to detail page
}

export interface PracticeAreasGridContent {
  heading: string; // "Our Areas of Practice"
  description: string; // Intro paragraph
  areas: PracticeAreaGridItem[];
}

export interface WhyChooseItem {
  number: string;
  title: string;
  description: string;
}

export interface WhyChooseContent {
  sectionLabel: string; // "– Why Choose Us"
  heading: string; // "Experience Across All Practice Areas"
  subtitle: string; // Subtitle text
  description: string; // Description paragraph
  items: WhyChooseItem[];
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

// Complete Practice Areas page content structure
export interface PracticeAreasPageContent {
  hero: PracticeAreasHeroContent;
  grid: PracticeAreasGridContent;
  whyChoose: WhyChooseContent;
  cta: CTAContent;
}

// Default content - used as fallback when CMS content is not available
export const defaultPracticeAreasContent: PracticeAreasPageContent = {
  hero: {
    sectionLabel: "– Practice Areas",
    tagline: "Comprehensive Legal Expertise",
    description:
      "Our team of experienced attorneys specializes in a wide range of legal practice areas. Whether you've been injured, wronged, or need expert legal counsel, we have the knowledge and resources to protect your rights and pursue the justice you deserve.",
    phone: "404-555-5555",
    phoneLabel: "Call Us 24/7",
  },
  grid: {
    heading: "Our Areas of Practice",
    description:
      "Select a practice area to learn more about how our attorneys can help with your specific legal needs.",
    areas: [
      {
        icon: "Car",
        title: "Personal Injury",
        description:
          "Comprehensive representation for accident victims. We fight to ensure you receive fair compensation for medical bills, lost wages, and pain and suffering.",
        image: "/images/practice-areas/personal-injury.jpg",
        link: "/practice-areas/personal-injury",
      },
      {
        icon: "Stethoscope",
        title: "Medical Malpractice",
        description:
          "When healthcare providers fail in their duty of care, we hold them accountable. Expert representation for victims of medical negligence.",
        image: "/images/practice-areas/medical-malpractice.jpg",
        link: "/practice-areas/medical-malpractice",
      },
      {
        icon: "Briefcase",
        title: "Workers Compensation",
        description:
          "Injured on the job? We help you navigate the complex workers compensation system to get the benefits you deserve.",
        image: "/images/practice-areas/workers-compensation.jpg",
        link: "/practice-areas/workers-compensation",
      },
      {
        icon: "Heart",
        title: "Wrongful Death",
        description:
          "Compassionate representation for families who have lost loved ones due to negligence. We seek justice and financial security for your family.",
        image: "/images/practice-areas/wrongful-death.jpg",
        link: "/practice-areas/wrongful-death",
      },
      {
        icon: "Building",
        title: "Premises Liability",
        description:
          "Slip and fall, inadequate security, or dangerous property conditions. Property owners must maintain safe environments.",
        image: "/images/practice-areas/premises-liability.jpg",
        link: "/practice-areas/premises-liability",
      },
      {
        icon: "Shield",
        title: "Product Liability",
        description:
          "Defective products can cause serious harm. We hold manufacturers accountable for dangerous or faulty products.",
        image: "/images/practice-areas/product-liability.jpg",
        link: "/practice-areas/product-liability",
      },
      {
        icon: "Scale",
        title: "Civil Litigation",
        description:
          "Complex business disputes, contract disagreements, and civil claims require experienced legal counsel. We deliver results.",
        image: "/images/practice-areas/civil-litigation.jpg",
        link: "/practice-areas/civil-litigation",
      },
      {
        icon: "FileText",
        title: "Insurance Claims",
        description:
          "Insurance companies often deny valid claims. We fight to ensure you receive the full benefits you're entitled to under your policy.",
        image: "/images/practice-areas/insurance-claims.jpg",
        link: "/practice-areas/insurance-claims",
      },
      {
        icon: "Users",
        title: "Class Action",
        description:
          "When multiple people are harmed by the same wrongdoing, class actions provide strength in numbers and efficient justice.",
        image: "/images/practice-areas/class-action.jpg",
        link: "/practice-areas/class-action",
      },
      {
        icon: "Home",
        title: "Nursing Home Abuse",
        description:
          "Protecting our most vulnerable. We investigate and prosecute cases of elder abuse and neglect in care facilities.",
        image: "/images/practice-areas/nursing-home-abuse.jpg",
        link: "/practice-areas/nursing-home-abuse",
      },
      {
        icon: "DollarSign",
        title: "Employment Law",
        description:
          "Workplace discrimination, wrongful termination, wage disputes. We protect employee rights and ensure fair treatment.",
        image: "/images/practice-areas/employment-law.jpg",
        link: "/practice-areas/employment-law",
      },
      {
        icon: "TrendingUp",
        title: "Mass Torts",
        description:
          "Large-scale injuries from pharmaceuticals, toxic exposure, or corporate negligence. We handle complex multi-plaintiff litigation.",
        image: "/images/practice-areas/mass-torts.jpg",
        link: "/practice-areas/mass-torts",
      },
    ],
  },
  whyChoose: {
    sectionLabel: "– Why Choose Us",
    heading: "Experience Across All Practice Areas",
    subtitle: "",
    description:
      "No matter your legal challenge, our diverse team brings the specialized knowledge, resources, and dedication needed to achieve the best possible outcome for your case.",
    items: [
      {
        number: "1",
        title: "Specialized Expertise",
        description:
          "Each attorney on our team brings deep knowledge in their specific practice area, ensuring you receive expert guidance tailored to your case.",
      },
      {
        number: "2",
        title: "Proven Success Record",
        description:
          "Decades of successful verdicts and settlements across all practice areas. Our track record speaks to our ability to win.",
      },
      {
        number: "3",
        title: "Comprehensive Resources",
        description:
          "We invest in expert witnesses, investigators, and cutting-edge technology to build the strongest possible case for you.",
      },
      {
        number: "4",
        title: "Client-Centered Approach",
        description:
          "Your needs drive our strategy. We maintain open communication and keep you informed every step of the way.",
      },
    ],
  },
  cta: {
    heading: "Ready to Discuss Your Case?",
    description:
      "Get a free consultation with one of our experienced attorneys today.",
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
