import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Seo from "@site/components/Seo";
import Layout from "@site/components/layout/Layout";
import { Phone, User, Scale, Calendar, Briefcase, FileText } from "lucide-react";
import AboutSection from "@site/components/home/AboutSection";
import FirmDescriptionSection from "@site/components/home/FirmDescriptionSection";
import PracticeAreasSection from "@site/components/home/PracticeAreasSection";
import PracticeAreasGrid from "@site/components/home/PracticeAreasGrid";
import AwardsSection from "@site/components/home/AwardsSection";
import TestimonialsSection from "@site/components/home/TestimonialsSection";
import AttorneyInfoSection from "@site/components/home/AttorneyInfoSection";
import ContactUsSection from "@site/components/home/ContactUsSection";
import { useHomepage2Content } from "@site/hooks/useHomepage2Content";
import { useGlobalPhone, useSiteSettings } from "@site/contexts/SiteSettingsContext";
import { resolveSeo } from "@site/utils/resolveSeo";

const DEFAULT_HERO_BG =
  "https://cdn.builder.io/api/v1/image/assets%2F50bd0f2438824f8ea1271cf7dd2c508e%2F1e4bfebf4b62496e9f4b00ad011729ba?format=webp&width=800&height=1200";
const DEFAULT_HERO_IMAGE =
  "https://infykuazzjkapuexhpqe.supabase.co/storage/v1/object/public/media/team/1770915510145-wqwnty.png";

export default function Homepage2() {
  const { content, page, isLoading } = useHomepage2Content();
  const { phoneDisplay, phoneLabel } = useGlobalPhone();
  const siteSettings = useSiteSettings();
  const { pathname } = useLocation();
  const siteUrl = import.meta.env.VITE_SITE_URL || "";

  // Centralized SEO resolution
  const seo = resolveSeo(page, siteSettings, pathname, siteUrl);

  const heroContent = content.hero;
  const featureBoxes = heroContent.featureBoxes;
  const heroButtons = heroContent.buttons;

  // Icon map for CMS-driven icons
  const iconMap: Record<
    string,
    React.ComponentType<{ className?: string; strokeWidth?: number }>
  > = {
    User,
    Phone,
    Scale,
    Calendar,
    Briefcase,
    FileText,
  };

  return (
    <Layout heroBg={(heroContent as any).heroBgImage || DEFAULT_HERO_BG}>
      <Seo {...seo} />

      {/* Hero Section - background image */}
      <div
        className="relative py-[27px] w-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${(heroContent as any).heroBgImage || DEFAULT_HERO_BG})` }}
      >
        <div className="relative z-10 max-w-[2560px] mx-auto w-[95%] flex flex-col lg:flex-row lg:items-end gap-8 lg:gap-[3%]">
          {/* Left Side: Headline and Call Box */}
          <div className="lg:w-[65.667%]">
            <div className="mb-[30px] md:mb-[40px]">
              <div className="relative">
                <p className="font-playfair text-[clamp(2.5rem,7vw,68.8px)] font-light leading-[1.2] text-black text-left">
                  {(() => {
                    const headline = heroContent.headline || "";
                    const highlight = heroContent.highlightedText || "";
                    if (
                      !highlight ||
                      !headline.toLowerCase().includes(highlight.toLowerCase())
                    ) {
                      return (
                        <>
                          {highlight && (
                            <>
                              <span className="text-law-accent">{highlight}</span>
                              <br />
                            </>
                          )}
                          {headline}
                        </>
                      );
                    }
                    const idx = headline
                      .toLowerCase()
                      .indexOf(highlight.toLowerCase());
                    const before = headline.slice(0, idx);
                    const match = headline.slice(idx, idx + highlight.length);
                    const after = headline.slice(idx + highlight.length);
                    return (
                      <>
                        {before}
                        <span className="text-law-accent">{match}</span>
                        {after}
                      </>
                    );
                  })()}
                </p>
              </div>
            </div>

            {/* Hero Buttons Row */}
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-[820px]">
              {/* Call Box - always uses global phone */}
              <div className="bg-law-accent p-[8px] w-full sm:w-1/2 cursor-pointer transition-all duration-300 hover:bg-law-accent-dark group">
                <div className="flex items-start gap-4">
                  <div className="bg-white p-[15px] mt-1 flex items-center justify-center group-hover:bg-black transition-colors duration-300">
                    <Phone
                      className="w-8 h-8 text-black group-hover:text-white transition-colors duration-300"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-outfit text-[16px] md:text-[18px] leading-tight text-black pb-[10px] font-normal group-hover:text-white transition-colors duration-300">
                      {phoneLabel}
                    </h4>
                    <p className="font-outfit text-[clamp(1.75rem,5vw,40px)] text-black leading-tight group-hover:text-white transition-colors duration-300">
                      {phoneDisplay}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dynamic hero buttons from CMS */}
              {heroButtons.length > 0 ? (
                heroButtons.map((btn, i) => {
                  const IconComponent =
                    btn.icon && iconMap[btn.icon] ? iconMap[btn.icon] : null;

                  return (
                    <Link
                      key={i}
                      to={btn.href || "/about"}
                      className="w-full sm:w-1/2"
                    >
                      <div className="bg-law-accent p-[8px] h-full cursor-pointer transition-all duration-300 hover:bg-law-accent-dark group">
                        {IconComponent ? (
                          <div className="flex items-center gap-4">
                            <div className="bg-white p-[15px] flex items-center justify-center group-hover:bg-black transition-colors duration-300">
                              <IconComponent className="w-8 h-8 text-black group-hover:text-white transition-colors duration-300" />
                            </div>
                            <span className="font-outfit text-[clamp(1.5rem,4vw,32px)] text-black font-semibold leading-tight tracking-wide group-hover:text-white transition-colors duration-300">
                              {btn.label}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <span className="font-outfit text-[clamp(1.5rem,4vw,32px)] text-black font-light group-hover:text-white transition-colors duration-300">
                              {btn.label}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })
              ) : (
                <Link to="/about" className="w-full sm:w-1/2">
                  <div className="bg-law-accent p-[8px] h-full group hover:bg-law-accent-dark transition-colors duration-300">
                    <div className="flex items-start gap-4">
                      <div className="bg-white p-[15px] mt-1 flex items-center justify-center group-hover:bg-black transition-colors duration-300">
                        <User className="w-8 h-8 text-black group-hover:text-white transition-colors duration-300" />
                      </div>
                      <span className="font-outfit text-[clamp(1.5rem,4vw,32px)] text-black font-semibold leading-tight tracking-wide group-hover:text-white transition-colors duration-300">
                        Attorney Profile
                      </span>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>

          {/* Right Side: Attorney Image */}
          <div className="lg:w-[31.3333%] flex items-end justify-center">
            {((heroContent as any).heroImage || DEFAULT_HERO_IMAGE) && (
              <img
                src={(heroContent as any).heroImage || DEFAULT_HERO_IMAGE}
                alt="Attorney"
                className="max-w-full w-auto h-auto object-contain max-h-[480px]"
                style={{
                  maskImage:
                    "linear-gradient(to bottom, black 60%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, black 60%, transparent 100%)",
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Feature Boxes Section - Bottom of Hero */}
      {featureBoxes.length > 0 && (
        <div className="bg-law-accent py-[40px] md:py-[60px] w-full">
          <div className="max-w-[2560px] mx-auto w-[95%] flex justify-center">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 max-w-[1200px]">
              {featureBoxes.map((item, index) => (
                <div
                  key={index}
                  className="bg-[#161715] p-[25px] md:p-[30px] flex items-start gap-4 flex-1"
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-law-accent flex items-center justify-center">
                      <svg
                        className="w-4 h-4 md:w-5 md:h-5 text-black"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-outfit text-[16px] md:text-[18px] text-white font-normal leading-tight">
                    {item.title}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* About Us Section */}
      <AboutSection
        content={content.about}
        syndicationsLabel={(content.about as any).syndicationsLabel}
      />

      {/* Firm Description Section */}
      <FirmDescriptionSection content={content.firmDescription} />

      {/* Practice Areas Section */}
      <PracticeAreasSection content={content.practiceAreasIntro} />

      {/* Practice Areas Grid */}
      <PracticeAreasGrid areas={content.practiceAreas} />

      {/* Awards CTA Section */}
      <AwardsSection content={content.awardsCTA} />

      {/* Testimonials Section */}
      <TestimonialsSection content={content.testimonials} />

      {/* Attorney Info Section */}
      <AttorneyInfoSection content={content.attorneyInfo} />

      {/* Contact Us Section */}
      <ContactUsSection content={content.contact} />
    </Layout>
  );
}
