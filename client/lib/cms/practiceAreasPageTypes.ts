// Type definitions for structured Practice Areas page content
// Each section maps directly to a static component's data needs

export interface PracticeAreasHeroContent {
  sectionLabel: string; // "– Practice Areas" (H1)
  tagline: string; // "Comprehensive Legal Expertise" (styled text)
  subtext: string; // Paragraph below tagline (rich text)
}

export interface ContentTab {
  title: string; // Tab heading (H2)
  content: string; // Rich text HTML content for the tab
}

export interface PracticeAreaGridItem {
  icon: string; // Lucide icon name
  title: string;
  description: string; // Short description sentence
  image: string; // Background image URL
  link: string; // Link to detail page
}

export interface PracticeAreasGridContent {
  heading: string;
  description: string;
  areas: PracticeAreaGridItem[];
}

export interface PracticeAreasCTAContent {
  heading: string;
  content: string; // Rich text HTML
  buttonLabel: string;
  buttonLink: string;
}

export interface FAQItem {
  question: string;
  answer: string; // Rich text HTML
}

export interface PracticeAreasFAQContent {
  heading: string;
  items: FAQItem[];
}

// Complete Practice Areas page content structure
// Note: Why Choose Us and Feature Boxes/Stats are pulled from the About/Home page CMS (shared)
export interface PracticeAreasPageContent {
  hero: PracticeAreasHeroContent;
  tabs: ContentTab[];
  grid: PracticeAreasGridContent;
  cta: PracticeAreasCTAContent;
  faq: PracticeAreasFAQContent;
}

// Default content - used as fallback when CMS content is not available
export const defaultPracticeAreasContent: PracticeAreasPageContent = {
  hero: {
    sectionLabel: "– Practice Areas",
    tagline: "Comprehensive Legal Expertise",
    subtext:
      "Do you need help understanding bankruptcy? A Marietta bankruptcy attorney can guide you through the bankruptcy process. Call Cherney Law Firm today.",
  },
  tabs: [
    {
      title: "What Is Bankruptcy?",
      content:
        "<p>If you're overwhelmed by your financial obligations, bankruptcy is a debt relief option worth considering. Although it is sometimes considered an embarrassing last resort, bankruptcy filing is a surprisingly common strategy to deal with debt.</p><p>If you or your business can't repay outstanding debt obligations, you can declare bankruptcy. After that, you will start a proceeding where a court-appointed bankruptcy trustee will examine your income and debts, as well as liquidate some of your assets in order to repay certain creditors.</p><p>However, there are other steps. For example, you as a debtor will have to undergo credit counseling before you file for bankruptcy, complete required bankruptcy forms, and attend a creditor's meeting.</p><p>It is not recommended that you attempt to file for bankruptcy without first consulting with a qualified bankruptcy lawyer in Marietta.</p><p>Since 2006, I have represented thousands of clients in understanding bankruptcy cases of all types and helped them to find the relief that they need. I also seek to remain affordable and may be able to provide payment options depending on your circumstances. Call Cherney Law Firm LLC today for a free case evaluation to determine what legal steps you should take to find debt relief today!</p>",
    },
    {
      title: "How Does Bankruptcy Work?",
      content:
        "<p>Bankruptcy proceedings give the debtor a chance for a fresh start and creditors an opportunity for repayment. Bankruptcy cases are typically filed in federal court. In general, a bankruptcy court judge examines the case to determine whether the debtor is eligible and then decides whether to discharge their debt.</p><p>Most cases are handled between the judge and the trustee. The debtor usually doesn't have to appear in court.</p><p>In order to determine your eligibility for Chapter 7 or Chapter 13 bankruptcy, you must take the means test. This test calculates your financial state and ability to repay any or all of your debt by comparing your income with your expenditures.</p><p>One of the most powerful aspects of the U.S. Bankruptcy Code is the fact that as soon as you file your petition with the court, you will be protected by an automatic stay against further creditor action. It can put an end to wage garnishment, repossessions, evictions, and even foreclosure.</p>",
    },
    {
      title: "Benefits of Bankruptcy",
      content:
        "<p>Contrary to popular belief, bankruptcy has many benefits. For example, if you are financially incapable of repaying part or all of your debt, you may be able to have it discharged. This means that you will be released from some of your debts through bankruptcy and no longer have to worry about repayment.</p><p>In addition to allowing you to eliminate your debts and financial stress, bankruptcy can also provide relief from creditor harassment. It can provide you with a certain peace of mind, while helping to solve your debt issues.</p><p>In fact, one of the most stressful aspects of serious debt is the harassing calls made by your creditors. According to Federal law, these calls must stop once you file for bankruptcy. If you have been threatened or coerced into paying your debts, get in touch with my office immediately.</p><h3>Bankruptcy Exemptions</h3><p>Many individuals are allowed to petition certain property exemptions when filing for bankruptcy, allowing them to keep things such as their household items, clothes, heirlooms, jewelry, car, and house in order to continue rebuilding their life after filing.</p>",
    },
    {
      title: "Do I Qualify for Bankruptcy?",
      content:
        "<p>As more consumers turned to bankruptcy as a way to find much-needed debt relief, legislation was enacted to tighten the eligibility requirements. My firm can help you determine if you qualify for bankruptcy.</p><p>Determining whether or not bankruptcy is a good choice for your financial situation can bring up a lot of questions. As an experienced Marietta bankruptcy lawyer, I know you want to feel comfortable before deciding to file. Thus I have provided a list of common questions and relevant answers.</p>",
    },
  ],
  grid: {
    heading: "Our Practice Areas",
    description:
      "Select a practice area to learn more about how our attorneys can help with your specific legal needs.",
    areas: [
      {
        icon: "FileText",
        title: "Chapter 7",
        description:
          "Liquidation bankruptcy that can eliminate most unsecured debts and give you a fresh financial start.",
        image: "https://images.pexels.com/photos/7926955/pexels-photo-7926955.jpeg?auto=compress&cs=tinysrgb&w=800",
        link: "/practice-areas/chapter-7",
      },
      {
        icon: "ClipboardList",
        title: "Chapter 13",
        description:
          "Reorganization bankruptcy that lets you keep your assets while repaying debts over a 3-5 year plan.",
        image: "https://images.pexels.com/photos/7821474/pexels-photo-7821474.jpeg?auto=compress&cs=tinysrgb&w=800",
        link: "/practice-areas/chapter-13",
      },
      {
        icon: "Handshake",
        title: "Debt Settlement",
        description:
          "Negotiate with creditors to reduce the total amount of debt you owe without filing for bankruptcy.",
        image: "https://images.pexels.com/photos/6170758/pexels-photo-6170758.jpeg?auto=compress&cs=tinysrgb&w=800",
        link: "/practice-areas/debt-settlement",
      },
      {
        icon: "Home",
        title: "Loan Modification",
        description:
          "Modify the terms of your existing loan to make payments more manageable and avoid foreclosure.",
        image: "/images/practice-areas/premises-liability.jpg",
        link: "/practice-areas/loan-modification",
      },
      {
        icon: "DollarSign",
        title: "Tax Debt Relief",
        description:
          "Resolve outstanding tax obligations through bankruptcy or negotiation with tax authorities.",
        image: "/images/practice-areas/civil-litigation.jpg",
        link: "/practice-areas/tax-debt-relief",
      },
    ],
  },
  cta: {
    heading: "Overwhelmed by Debt? Call Cherney Law Firm!",
    content:
      "<p>Are you scared of losing your home? A bankruptcy attorney could defend you from foreclosure and help you save your home. Filing for bankruptcy could halt a foreclosure.</p><p>Filing for bankruptcy is often one of the best decisions a person can make. Such an action could end harassing calls from creditors, eliminate financial stress, and allow debtors to get a fresh start in life.</p><p>As an educated attorney with years of experience, I can help you understand bankruptcy by providing the qualified advice, caring guidance, and aggressive representation that you need when pursuing it. Such a decision is not easy to make and requires the guidance of a qualified bankruptcy lawyer. If you are considering filing for bankruptcy, make sure you are fully informed.</p>",
    buttonLabel: "Get Help Today!",
    buttonLink: "/contact",
  },
  faq: {
    heading: "Frequently Asked Questions",
    items: [
      {
        question: "Are There Alternatives to Bankruptcy?",
        answer:
          "<p>Bankruptcy is not for everyone. You might instead benefit from debt negotiation, debt settlement, or discharging your debt. Always talk to an attorney first about debt management options so that you make the right decision for your financial situation.</p>",
      },
      {
        question:
          "What Are the Differences Between Ch. 7 and Ch. 13?",
        answer:
          "<p>It is important to understand the differences between Chapter 7 and Chapter 13 so you can pursue the option most beneficial to you. Consult with a bankruptcy attorney to learn more about the pros and cons when filing either type.</p>",
      },
      {
        question: "What Is Repossession?",
        answer:
          "<p>Many people worry that filing for bankruptcy may cause them to lose their homes, cars, and valuable possessions. In fact, it may put a stop to having certain items repossessed due to lack of payments. When you file a bankruptcy petition, it puts an automatic stay in place, protecting your goods until the bankruptcy process is over. For further information, do not hesitate to contact my firm.</p>",
      },
      {
        question: "What Is Wage Garnishment?",
        answer:
          "<p>When consumers are unable to remain current on their debts, creditors can have their wages garnished so that they receive payment. As wage garnishment can severely compromise your well-being, my firm offers assistance in protecting you against debt collection and in helping you attain financial stability.</p>",
      },
    ],
  },
};
