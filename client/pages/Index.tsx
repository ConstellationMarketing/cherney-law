import { Link } from "react-router-dom";
import Seo from "@site/components/Seo";
import Layout from "@site/components/layout/Layout";
import { Phone, User } from "lucide-react";
import ContactForm from "@site/components/home/ContactForm";
import AboutSection from "@site/components/home/AboutSection";
import FirmDescriptionSection from "@site/components/home/FirmDescriptionSection";
import PracticeAreasSection from "@site/components/home/PracticeAreasSection";
import PracticeAreasGrid from "@site/components/home/PracticeAreasGrid";
import AwardsSection from "@site/components/home/AwardsSection";
import TestimonialsSection from "@site/components/home/TestimonialsSection";
import AttorneyInfoSection from "@site/components/home/AttorneyInfoSection";
import ContactUsSection from "@site/components/home/ContactUsSection";
import { useHomeContent } from "@site/hooks/useHomeContent";
import { useGlobalPhone } from "@site/contexts/SiteSettingsContext";

export default function Index() {
  const { content, isLoading } = useHomeContent();
  const { phoneDisplay, phoneLabel } = useGlobalPhone();

  const heroContent = content.hero;
  const featureBoxes = heroContent.featureBoxes;
  const heroButtons = heroContent.buttons;

  return (
    <Layout>
      <Seo
        title="Home"
        description="Protecting your rights with integrity, experience, and relentless advocacy."
      />

      {/* Hero and Contact Form Section */}
      <div className="bg-law-accent py-[27px] w-full">
        <div className="max-w-[2560px] mx-auto w-[95%] flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-[3%]">
          {/* Left Side: Headline and Call Box */}
          <div className="lg:w-[65.667%]">
            <div className="mb-[30px] md:mb-[40px]">
              <div className="relative">
                <p className="font-playfair text-[clamp(2.5rem,7vw,68.8px)] font-light leading-[1.2] text-black text-left">
                  {(() => {
                    const headline = heroContent.headline || '';
                    const highlight = heroContent.highlightedText || '';
                    if (!highlight || !headline.toLowerCase().includes(highlight.toLowerCase())) {
                      return (
                        <>
                          {highlight && <><span className="text-white">{highlight}</span><br /></>}
                          {headline}
                        </>
                      );
                    }
                    const idx = headline.toLowerCase().indexOf(highlight.toLowerCase());
                    const before = headline.slice(0, idx);
                    const match = headline.slice(idx, idx + highlight.length);
                    const after = headline.slice(idx + highlight.length);
                    return (
                      <>
                        {before}<span className="text-white">{match}</span>{after}
                      </>
                    );
                  })()}
                </p>
              </div>
              {heroContent.h1Title && (
                <h1 className="font-outfit text-[18px] md:text-[20px] font-medium tracking-wider uppercase text-black mt-[20px] md:mt-[30px]">
                  {heroContent.h1Title}
                </h1>
              )}
            </div>

            {/* Hero Buttons Row */}
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-[820px]">
              {/* Call Box - always uses global phone */}
              <div className="bg-white p-[8px] w-full sm:w-1/2 cursor-pointer border-2 border-transparent hover:border-black transition-all duration-300 hover:bg-law-accent group">
                <div className="flex items-start gap-4">
                  <div className="bg-law-accent p-[15px] mt-1 flex items-center justify-center group-hover:bg-black transition-colors duration-300">
                    <Phone className="w-8 h-8 text-black group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
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
                heroButtons.map((btn, i) => (
                  <Link key={i} to={btn.href || "/about"} className="w-full sm:w-1/2">
                    <div className="bg-white p-[8px] h-full cursor-pointer border-2 border-transparent hover:border-black transition-all duration-300 hover:bg-law-accent group flex items-center justify-center">
                      <span className="font-outfit text-[clamp(1.5rem,4vw,32px)] text-black font-light group-hover:text-white transition-colors duration-300">
                        {btn.label}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <Link to="/about" className="w-full sm:w-1/2">
                  <div className="bg-white p-[8px] h-full group hover:bg-law-accent transition-colors duration-300">
                    <div className="flex items-start gap-4">
                      <div className="bg-law-accent p-[15px] mt-1 flex items-center justify-center group-hover:bg-white transition-colors duration-300">
                        <User className="w-8 h-8 text-black group-hover:text-law-accent transition-colors duration-300" />
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

          {/* Right Side: Contact Form */}
          <div className="lg:w-[31.3333%]">
            <ContactForm />
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
      <AboutSection content={content.about} />

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
