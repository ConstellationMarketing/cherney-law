// Type definitions for structured Common Questions page content

export interface CommonQuestionsHeroContent {
  sectionLabel: string; // "– Common Questions" (H1)
  tagline: string; // Tagline below H1
}

export interface FaqItem {
  question: string; // H3 question
  answer: string; // Rich text HTML answer
}

export interface FaqSection {
  sectionLabel: string; // "Common Questions and Answers About Bankruptcy:"
  heading: string; // "Is Bankruptcy Right For You?" (H2)
  description: string; // Rich text HTML for intro paragraph
  items: FaqItem[]; // FAQ items in accordions
}

export interface ClosingSection {
  heading: string; // "Dedicated to Helping You" (H2)
  body: string; // Rich text HTML
}

export interface CTAContent {
  heading: string; // "Ready to Talk?"
  description: string; // CTA description text
  secondaryButton: {
    label: string; // "Schedule Now"
    sublabel: string; // "Free Consultation"
    href: string; // "/contact"
  };
}

// Complete Common Questions page content structure
export interface CommonQuestionsPageContent {
  hero: CommonQuestionsHeroContent;
  faqSection: FaqSection;
  closingSection: ClosingSection;
  cta: CTAContent;
}

// Default content - used as fallback when CMS content is not available
export const defaultCommonQuestionsContent: CommonQuestionsPageContent = {
  hero: {
    sectionLabel: "– Common Questions",
    tagline: "Answers to Your Bankruptcy Questions",
  },
  faqSection: {
    sectionLabel: "Common Questions and Answers About Bankruptcy:",
    heading: "Is Bankruptcy Right For You?",
    description:
      "<p>Are you facing foreclosure, wage garnishment, or creditor harassment?</p><p>Serious debt can result in a lot of stress and emotional hardship and anyone considering bankruptcy is likely to have common questions that need answering. At Cherney Law Firm LLC I understand the hardships that you are experiencing and the difficulty of the decisions before you. As a skilled attorney, I have the knowledge and the resources to provide the answers you need. Read below for responses to some of the most common questions asked about bankruptcy.</p>",
    items: [
      {
        question: "Will I lose everything if I file for bankruptcy?",
        answer:
          "<p>Not necessarily. It is a common myth that filing for bankruptcy will result in you losing your home, your car, and/or all of your assets. Depending on your situation, you may qualify for bankruptcy exemptions that allow you to keep certain things, such as your home or your car. If you file under Chapter 13 bankruptcy, your possessions will be safe and cannot be touched, but in Chapter 7 there is a possibility that you may lose some things. It is also important to keep in mind that, although you may have to make sacrifices, there are many benefits of bankruptcy that make up for it in the end. Without the stress of your overwhelming debt, you could find peace of mind again, so consult with an attorney if you think that filing could be beneficial for you.</p>",
      },
      {
        question: "What is the difference between Chapter 7 and Chapter 13?",
        answer:
          "<p>The basic difference between Chapter 7 and Chapter 13 bankruptcy is that one results in the dismissal of most or all of your debt, while the other involves a repayment plan. Chapter 7 bankruptcy is available for those who, after taking the means test, are found to be unable to repay their debt in full. As a result, a significant portion of debt, if not all, will be discharged with a few exceptions. Student loans, child support payments, alimony, fines owed to the government for criminal offenses, money that must be paid in a personal injury case and a few other areas constitute as exceptions that must still be paid by the debtor.</p><p>Filing for Chapter 13 allows for a repayment plan to be created based on the means test results. This allows the individual to repay their debts over the course of three to five years. While still being held accountable for money owed, it makes the prospect of paying them off much more accessible. Relieving a good portion of stress, it allows for you as the debtor to make manageable payments for a few years, after which the rest of your debt will be dismissed.</p>",
      },
      {
        question: "Am I eligible for bankruptcy?",
        answer:
          "<p>Any individual, business, partnership or corporation may file for bankruptcy. The results of a means test help determine what type of bankruptcy you may pursue. In order to determine if youqualify for Chapter 7 or Chapter 13 bankruptcy, you must first complete the means test. It weighs your income versus your expenditures and determines your ability or inability to repay your debts, either in part or in full. If you cannot repay your debts at all due to financial hardship, you may be eligible for Chapter 7. If you are able to repay your debts over several years, you may be qualified for Chapter 13. Consult with a bankruptcy attorney for advice and guidance in taking the means test.</p>",
      },
      {
        question: "What are bankruptcy exemptions?",
        answer:
          "<p>When you file for bankruptcy, you may be able to request certain property exemptions. The purpose of bankruptcy is to allow you to eliminate your debts and start over; but in order to do so you may fear that you will lose your home or other valuable possessions. The Bankruptcy Code allows for certain exceptions depending on the type of bankruptcy you file.</p><p>In Georgia there certain rules that allow for you to keep fine jewelry, heirlooms, tools you use for your business, money received from personal injury or wrongful death settlements, burial plots, household furnishings, pets, and other items up to a certain amount. Keeping your car and home may be a bit trickier, but if they fall under a certain dollar amount you do not have to worry. You may not always be able to keep what you want, but an experienced bankruptcy lawyer could counsel you and help you find out what items you could keep.</p><p>Call my firm today to learn more about bankruptcy exemption laws in Georgia.</p>",
      },
      {
        question: "Are there alternatives to bankruptcy?",
        answer:
          "<p>There are alternatives to bankruptcy that may be viable options for you and your family. It is always best to consult with an attorney first who can look at your financial situation and make a proper judgment call. Alternatives include such things as debt negotiation, which allows you to negotiate a repayment plan with your lender. There is also debt settlement, which allows you to have your debts dismissed by paying a lump sum that is less than you owe and clearing your name with your creditors. Another option is also to discharge your debt, which releases you from having to repay certain debts at all. Talk with a qualified lawyer who understands Georgia's laws and practices regarding debt relief before you jump into anything permanent.</p>",
      },
      {
        question: "How can a bankruptcy attorney help me?",
        answer:
          "<p>The bankruptcy process is detailed, difficult and very confusing unless you have a trained and experienced legal representative on your side. By hiring a bankruptcy lawyer, you can have confidence that you are making the right decisions and taking the right legal actions. Otherwise, you might make a mistake and damage your finances and your future if you are not careful. Call Cherney Law Firm LLC today for the guidance you need to properly navigate the area of bankruptcy law.</p>",
      },
      {
        question: "Will all my debt be discharged?",
        answer:
          "<p>Filing for bankruptcy will either liquidate (Chapter 7) or reorganize (Chapter 13) your debt. This means that under Chapter 7, you can have your debts discharged, while under Chapter 13, you will have a repayment plan to hopefully enable you to pay off your debts either partially or in full. Some debt cannot be discharged; however, as you must still pay back child support, alimony, and sometimes some tax debt. Student loans cannot be discharged either, unless you can pull off the feat of proving that repaying these loans would be an undue burden. What bankruptcy does do is place an \"automatic stay\" on your creditors that may give you the relief and time you need to get on your feet. Learn more by speaking with our Marietta bankruptcy lawyer today.</p>",
      },
      {
        question: "What is an automatic stay?",
        answer:
          "<p>An automatic stay can stop a lawsuit in its tracks and keep creditors from collecting, for the time being. This action can avert utility disconnections, foreclosure, eviction, collection of overpayments from public benefits, and wage garnishments. What it does NOT do is stop audits, some taxes, support actions, criminal proceedings, or pension loans. An automatic stay might still be enough to keep you afloat and to get everything in order.</p>",
      },
      {
        question: "How will bankruptcy affect my credit?",
        answer:
          "<p>If you file for Chapter 7, then this will appear on your credit report for ten years. Chapter 13 will stay on your record for seven years. This can hurt your credit in the short-term, but it does not kill your credit. In fact, you can immediately start to rebuild credit after bankruptcy. After filing, you can build your credit by meeting all your subsequent payments, such as your rent/mortgage and utilities.</p><p>Depending on the creditor, you may even be able to keep credit cards or obtain new ones, and you can make small purchases as long as you repay them on time. Bankruptcy can give you the chance to move on from bad credit and start strengthening your credit score, starting over with a clean slate.</p>",
      },
      {
        question: "How long will bankruptcy take in Marietta?",
        answer:
          "<p>Chapter 7 bankruptcy will probably take three to six months. Once the unsecured debt has been discharged, you can move on. Chapter 13 bankruptcy takes three to five years, and this is because you still have to repay the debts. Your payment plan is reorganized into something you can manage, buying you the time you need.</p>",
      },
    ],
  },
  closingSection: {
    heading: "Dedicated to Helping You",
    body: "<p>At my firm, you can receive the caring service and capable representation of a Marietta bankruptcy lawyer who truly cares about your situation. In addition to addressing common questions about bankruptcy and bankruptcy alternatives, as well as providing basic information online, I take the time to guide and support each of my clients and provide them with quality advice throughout their bankruptcy process.</p><p>From your free initial consultation to the completion of your case, you can rest assured that I will be by your side. Fill out the free online case evaluation or call my firm today so that I can review your situation and provide you with comprehensive options. Do not let yourself be trapped by debt, but contact my office today!</p>",
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
