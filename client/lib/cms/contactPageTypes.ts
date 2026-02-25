// Type definitions for structured Contact page content
// Each section maps directly to a static component's data needs

export interface ContactHeroContent {
  sectionLabel: string; // "– Contact Us" (H1)
  tagline: string; // "Let's Talk About Your Case" (styled paragraph)
  description: string; // Description paragraph
}

export interface OfficeTab {
  name: string; // Tab label, e.g. "Marietta"
  heading: string; // "Contact a Marietta/Cobb County Bankruptcy Attorney"
  content: string; // Rich text HTML body
  address: string; // "1744 Roswell Road, Suite 100 Marietta, GA 30062"
  mapEmbedUrl: string; // Google Maps embed URL for this office
  phone: string; // tel: href value e.g. "770-485-4141"
  phoneDisplay: string; // Formatted phone display e.g. "(770) 485-4141"
  directions: string; // Rich text HTML for driving directions
}

export interface ContactFormSettings {
  heading: string; // e.g. "Free Case Evaluation"
  subtext: string; // Description text
  submitButtonText: string;
  consentText: string; // "I agree to receive marketing messaging..."
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
}

export interface ProcessStepItem {
  number: string;
  title: string;
  description: string;
}

export interface ProcessContent {
  sectionLabel: string; // "– The Process"
  heading: string; // "What to Expect When You Contact Us"
  subtitle: string; // Subtitle text
  steps: ProcessStepItem[];
}

// Complete Contact page content structure
export interface ContactPageContent {
  hero: ContactHeroContent;
  offices: OfficeTab[];
  formSettings: ContactFormSettings;
  process: ProcessContent;
}

// Default content - used as fallback when CMS content is not available
export const defaultContactContent: ContactPageContent = {
  hero: {
    sectionLabel: "– Contact Us",
    tagline: "Let's Talk About Your Case",
    description:
      "Our team is ready to listen, answer your questions, and provide the expert legal guidance you need. Contact us today for a free consultation.",
  },
  offices: [
    {
      name: "Marietta",
      heading: "Contact a Marietta/Cobb County Bankruptcy Attorney",
      content:
        "<p>As a knowledgeable bankruptcy lawyer, I will seek to answer any and all questions you may have so that you can enter into the legal process with a peace of mind. My office offers weekend appointments for your convenience as I understand that it can be tricky attempting to get time off of work. Doing everything I can to make this process as smooth as possible for you and your family, I have provided a free case evaluation form. If you decide to fill it out, I can get in touch with you concerning your case and get you started on the road to freedom before you know it. For those who would rather speak with me over the phone or in person, your first consultation is always free. Please do not hesitate to contact my office today!</p>",
      address: "1744 Roswell Road, Suite 100 Marietta, GA 30062",
      mapEmbedUrl:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3311.5!2d-84.55!3d33.97!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s1744+Roswell+Road+Marietta+GA!5e0!3m2!1sen!2sus",
      phone: "", // Will be populated from global phone settings
      phoneDisplay: "", // Will be populated from global phone settings
      directions: "",
    },
    {
      name: "Woodstock",
      heading: "Contact a Woodstock/Cherokee County Bankruptcy Attorney",
      content:
        "<p>Contact our Woodstock office for a free consultation about your bankruptcy options.</p>",
      address: "Woodstock, GA",
      mapEmbedUrl: "",
      phone: "", // Will be populated from global phone settings
      phoneDisplay: "", // Will be populated from global phone settings
      directions: "",
    },
    {
      name: "Alpharetta",
      heading: "Contact an Alpharetta/North Fulton Bankruptcy Attorney",
      content:
        "<p>Contact our Alpharetta office for a free consultation about your bankruptcy options.</p>",
      address: "Alpharetta, GA",
      mapEmbedUrl: "",
      phone: "", // Will be populated from global phone settings
      phoneDisplay: "", // Will be populated from global phone settings
      directions: "",
    },
  ],
  formSettings: {
    heading: "Free Case Evaluation",
    subtext: "Fill out the form below for a free case review.",
    submitButtonText: "SUBMIT",
    consentText:
      "I agree to receive marketing messaging from Cherney Law Firm at the phone number provided above. Data rates may apply. Reply STOP to opt out.",
    privacyPolicyUrl: "/privacy-policy",
    termsOfServiceUrl: "/terms-of-service",
  },
  process: {
    sectionLabel: "– The Process",
    heading: "What to Expect When You Contact Us",
    subtitle: "",
    steps: [
      {
        number: "1",
        title: "Contact Us",
        description:
          "Reach out via phone, email, or our contact form. Our intake team is available 24/7 to take your call.",
      },
      {
        number: "2",
        title: "Free Consultation",
        description:
          "Schedule a no-obligation consultation where we'll review your case, answer questions, and explain your legal options.",
      },
      {
        number: "3",
        title: "Case Evaluation",
        description:
          "Our experienced attorneys will thoroughly evaluate your case and develop a strategic plan tailored to your needs.",
      },
      {
        number: "4",
        title: "Take Action",
        description:
          "Once you decide to work with us, we immediately begin building your case and fighting for the compensation you deserve.",
      },
    ],
  },
};
