import Seo from "@site/components/Seo";
import Layout from "@site/components/layout/Layout";
import PracticeAreaCard from "@site/components/practice/PracticeAreaCard";
import PracticeAreasHero from "@site/components/practice/PracticeAreasHero";
import ContentTabs from "@site/components/practice/ContentTabs";
import PracticeAreasCTA from "@site/components/practice/PracticeAreasCTA";
import PracticeAreasFAQ from "@site/components/practice/PracticeAreasFAQ";
import AboutWhyChooseUs from "@site/components/about/AboutWhyChooseUs";
import StatsGrid from "@site/components/shared/StatsGrid";
import AboutFeatureBoxes from "@site/components/about/AboutFeatureBoxes";
import AboutCTA from "@site/components/about/AboutCTA";
import {
  Scale,
  FileText,
  ClipboardList,
  Handshake,
  Home,
  DollarSign,
  type LucideIcon,
} from "lucide-react";
import { usePracticeAreasContent } from "@site/hooks/usePracticeAreasContent";
import { useAboutContent } from "@site/hooks/useAboutContent";
import { useHomeContent } from "@site/hooks/useHomeContent";
import { useGlobalPhone } from "@site/contexts/SiteSettingsContext";

// Icon mapping for practice areas
const iconMap: Record<string, LucideIcon> = {
  Scale,
  FileText,
  ClipboardList,
  Handshake,
  Home,
  DollarSign,
};

export default function PracticeAreas() {
  const { content } = usePracticeAreasContent();
  const { content: aboutContent } = useAboutContent();
  const { content: homeContent } = useHomeContent();
  const { phoneDisplay, phoneLabel } = useGlobalPhone();

  // Feature boxes and stats from homepage (shared)
  const featureBoxes = homeContent.hero.featureBoxes;
  const stats = homeContent.about.stats;

  // Map practice areas from CMS content with icon components
  const practiceAreas = content.grid.areas.map((area) => ({
    icon: iconMap[area.icon] || Scale,
    title: area.title,
    description: area.description,
    image: area.image,
    link: area.link,
  }));

  return (
    <Layout>
      <Seo
        title="Practice Areas"
        description="Do you need help understanding bankruptcy? A Marietta bankruptcy attorney can guide you through the bankruptcy process. Call Cherney Law Firm today."
      />

      {/* Hero Section - About page style */}
      <PracticeAreasHero
        content={content.hero}
        phoneDisplay={phoneDisplay}
        phoneLabel={phoneLabel}
      />

      {/* Tabbed Content Section */}
      <ContentTabs tabs={content.tabs} />

      {/* Practice Areas Grid Section */}
      <div className="bg-gray-50 py-[40px] md:py-[60px]">
        <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[85%]">
          <div className="text-center mb-[30px] md:mb-[50px]">
            <h2 className="font-playfair text-[32px] md:text-[48px] lg:text-[54px] leading-tight md:leading-[54px] text-black">
              {content.grid.heading}
            </h2>
            <p className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-black/80 mt-[15px] max-w-[800px] mx-auto">
              {content.grid.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {practiceAreas.map((area, index) => (
              <PracticeAreaCard key={index} {...area} />
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <PracticeAreasCTA content={content.cta} />

      {/* FAQ Section */}
      <PracticeAreasFAQ content={content.faq} />

      {/* Feature Boxes (shared from homepage) */}
      <AboutFeatureBoxes featureBoxes={featureBoxes} />

      {/* Stats Section (shared from homepage) */}
      <div className="bg-white py-[30px] md:py-[40px]">
        <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%]">
          <StatsGrid stats={stats} />
        </div>
      </div>

      {/* Why Choose Us (shared from About page) */}
      <AboutWhyChooseUs content={aboutContent.whyChooseUs} />

      {/* Final CTA (shared from About page) */}
      <AboutCTA
        content={aboutContent.cta}
        phoneDisplay={phoneDisplay}
        phoneLabel={phoneLabel}
      />
    </Layout>
  );
}
