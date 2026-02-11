import Seo from "@site/components/Seo";
import Layout from "@site/components/layout/Layout";
import PracticeAreaCard from "@site/components/practice/PracticeAreaCard";
import CallBox from "@site/components/shared/CallBox";
import {
  Phone,
  Calendar,
  Scale,
  Car,
  Briefcase,
  Users,
  Home,
  DollarSign,
  FileText,
  Heart,
  Shield,
  TrendingUp,
  Stethoscope,
  Building,
  type LucideIcon,
} from "lucide-react";
import { usePracticeAreasContent } from "@site/hooks/usePracticeAreasContent";
import { useGlobalPhone } from "@site/contexts/SiteSettingsContext";

// Icon mapping for practice areas
const iconMap: Record<string, LucideIcon> = {
  Car,
  Stethoscope,
  Briefcase,
  Heart,
  Building,
  Shield,
  Scale,
  FileText,
  Users,
  Home,
  DollarSign,
  TrendingUp,
};

export default function PracticeAreas() {
  const { content } = usePracticeAreasContent();
  const { phoneDisplay, phoneLabel } = useGlobalPhone();

  // Map practice areas from CMS content with icon components
  const practiceAreas = content.grid.areas.map((area) => ({
    icon: iconMap[area.icon] || Scale,
    title: area.title,
    description: area.description,
    image: area.image,
    link: area.link,
  }));

  // Map why choose items from CMS content
  const whyChooseOurPractice = content.whyChoose.items;

  return (
    <Layout>
      <Seo
        title="Practice Areas"
        description="Explore our comprehensive areas of legal expertise. From personal injury to complex litigation, our experienced attorneys are ready to fight for your rights."
      />

      {/* Hero Section */}
      <div className="bg-law-accent pt-[30px] md:pt-[54px] pb-[30px] md:pb-[54px]">
        <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%]">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-[5%]">
            {/* Left Side - Heading */}
            <div className="lg:w-[65%]">
              {/* H1 Title - Section Label */}
              <h1 className="font-outfit text-[18px] md:text-[24px] leading-tight md:leading-[36px] text-white mb-[10px]">
                {content.hero.sectionLabel}
              </h1>
              {/* Tagline - styled as large text */}
              <p className="font-playfair text-[clamp(2.5rem,7vw,68.8px)] font-light leading-[1.2] text-black mb-[20px] md:mb-[30px]">
                <span
                  dangerouslySetInnerHTML={{
                    __html: content.hero.tagline.replace(
                      /(Expertise)/g,
                      '<span class="text-law-accent">$1</span>',
                    ),
                  }}
                />
              </p>
              <p className="font-outfit text-[16px] md:text-[20px] leading-[24px] md:leading-[30px] text-black/80">
                {content.hero.description}
              </p>
            </div>

            {/* Right Side - CallBox */}
            <div className="lg:w-[30%] flex items-center">
              <CallBox
                icon={Phone}
                title={phoneLabel}
                subtitle={phoneDisplay}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Practice Areas Grid Section */}
      <div className="bg-white py-[40px] md:py-[60px]">
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

      {/* Why Choose Our Practice Section */}
      <div className="bg-law-dark py-[40px] md:py-[60px]">
        <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-[8%]">
            {/* Left Side - Heading + Image */}
            <div>
              <div className="mb-[10px]">
                <p className="font-outfit text-[18px] md:text-[24px] leading-tight md:leading-[36px] text-law-accent">
                  {content.whyChoose.sectionLabel}
                </p>
              </div>
              <h2 className="font-playfair text-[32px] md:text-[48px] lg:text-[54px] leading-tight md:leading-[54px] text-white pb-[20px]">
                {content.whyChoose.heading}
              </h2>
              {content.whyChoose.subtitle && (
                <p className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-white/80 pb-[15px]">
                  {content.whyChoose.subtitle}
                </p>
              )}
              <p className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-white/90 mb-[30px]">
                {content.whyChoose.description}
              </p>
              {/* Stock image */}
              <div className="hidden lg:block">
                <img
                  src="/images/stock/lawyer-consulting.jpg"
                  alt="Law book with scales of justice"
                  className="w-full max-w-[400px] h-auto object-cover"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Right Side - Features List */}
            <div className="space-y-[20px] md:space-y-[30px]">
              {whyChooseOurPractice.map((feature, index) => (
                <div key={index}>
                  <div className="mb-[15px] md:mb-[20px]">
                    <h3 className="font-outfit text-[22px] md:text-[28px] leading-tight md:leading-[28px] text-white pb-[10px]">
                      {feature.number}. {feature.title}
                    </h3>
                    <p className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-white/80">
                      {feature.description}
                    </p>
                  </div>
                  {index < whyChooseOurPractice.length - 1 && (
                    <div className="h-[1px] bg-law-border/50"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="bg-law-accent py-[40px] md:py-[60px]">
        <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
          <div className="text-center mb-[30px] md:mb-[40px]">
            <h2 className="font-playfair text-[36px] md:text-[48px] lg:text-[60px] leading-tight text-black pb-[15px]">
              {content.cta.heading}
            </h2>
            <p className="font-outfit text-[18px] md:text-[22px] leading-[26px] md:leading-[32px] text-black/80">
              {content.cta.description}
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-8 justify-center items-center md:items-start">
            <CallBox
              icon={Phone}
              title={phoneLabel}
              subtitle={phoneDisplay}
              className="bg-law-accent-dark hover:bg-black"
              variant="dark"
            />
            <CallBox
              icon={Calendar}
              title={content.cta.secondaryButton.label}
              subtitle={content.cta.secondaryButton.sublabel}
              link={content.cta.secondaryButton.link}
              className="bg-law-accent-dark hover:bg-black"
              variant="dark"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
