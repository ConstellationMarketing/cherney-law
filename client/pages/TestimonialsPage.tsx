import { useLocation } from "react-router-dom";
import Seo from "@site/components/Seo";
import Layout from "@site/components/layout/Layout";
import GoogleReviews from "@site/components/testimonials/GoogleReviews";
import { useTestimonialsContent } from "@site/hooks/useTestimonialsContent";
import { useGlobalPhone, useSiteSettings } from "@site/contexts/SiteSettingsContext";
import { resolveSeo } from "@site/utils/resolveSeo";
import { Link } from "react-router-dom";
import { Phone } from "lucide-react";

export default function TestimonialsPage() {
  const { content, page } = useTestimonialsContent();
  const { phoneDisplay, phoneLabel } = useGlobalPhone();
  const siteSettings = useSiteSettings();
  const { pathname } = useLocation();
  const siteUrl = import.meta.env.VITE_SITE_URL || '';

  // Centralized SEO resolution
  const seo = resolveSeo(page, siteSettings, pathname, siteUrl);

  return (
    <Layout>
      <Seo {...seo} />

      {/* Hero Section - same structure as About page */}
      <div className="bg-law-accent pt-[30px] md:pt-[54px] pb-[30px] md:pb-[54px]">
        <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%]">
          <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
            {/* Left — Text */}
            <div className="flex-1">
              <h1 className="font-outfit text-[18px] md:text-[24px] leading-tight md:leading-[36px] text-white mb-[10px]">
                {content.hero.sectionLabel}
              </h1>
              <p className="font-playfair text-[clamp(2.5rem,7vw,68.8px)] font-light leading-[1.2] text-black max-w-[900px]">
                {content.hero.tagline}
              </p>
            </div>

            {/* Right — Phone Button */}
          <div className="shrink-0 w-full md:w-auto md:max-w-[380px]">
            <a
              href={`tel:${phoneDisplay.replace(/[^0-9]/g, "")}`}
              className="block"
            >
              <div className="bg-white p-[8px] w-full cursor-pointer border-2 border-transparent hover:border-black transition-all duration-300 hover:bg-law-accent group">
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
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Google Reviews Section */}
      <GoogleReviews content={content.reviews} />

      {/* CTA Section */}
      <div className="bg-law-accent py-[40px] md:py-[60px]">
        <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
          <div className="text-center mb-[30px] md:mb-[40px]">
            <h2 className="font-playfair text-[36px] md:text-[48px] lg:text-[60px] leading-tight text-black pb-[15px]">
              {content.cta.heading}
            </h2>
            <p className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-black/80">
              {content.cta.description}
            </p>
          </div>

          {/* Two equal-width white buttons with icons */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 justify-center items-stretch max-w-[820px] mx-auto">
            {/* Phone Button */}
            <a
              href={`tel:${phoneDisplay.replace(/[^0-9]/g, "")}`}
              className="w-full md:w-1/2"
            >
              <div className="bg-white p-[8px] w-full h-full cursor-pointer border-2 border-transparent hover:border-black transition-all duration-300 hover:bg-law-accent group">
                <div className="flex items-start gap-4">
                  <div className="bg-law-accent p-[15px] mt-1 flex items-center justify-center group-hover:bg-black transition-colors duration-300">
                    <Phone className="w-8 h-8 text-black group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-outfit text-[16px] md:text-[18px] leading-tight text-black pb-[10px] font-normal group-hover:text-white transition-colors duration-300">
                      {phoneLabel}
                    </h4>
                    <p className="font-outfit text-[22px] md:text-[26px] text-black leading-tight group-hover:text-white transition-colors duration-300">
                      {phoneDisplay}
                    </p>
                  </div>
                </div>
              </div>
            </a>

            {/* Schedule Button */}
            <Link
              to={content.cta.secondaryButton.href || "/contact"}
              className="w-full md:w-1/2"
            >
              <div className="bg-white p-[8px] w-full h-full cursor-pointer border-2 border-transparent hover:border-black transition-all duration-300 hover:bg-law-accent group">
                <div className="flex items-start gap-4">
                  <div className="bg-law-accent p-[15px] mt-1 flex items-center justify-center group-hover:bg-black transition-colors duration-300">
                    <svg
                      className="w-8 h-8 text-black group-hover:text-white transition-colors duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-outfit text-[16px] md:text-[18px] leading-tight text-black pb-[10px] font-normal group-hover:text-white transition-colors duration-300">
                      {content.cta.secondaryButton.label || "Schedule Now"}
                    </h4>
                    <p className="font-outfit text-[22px] md:text-[26px] text-black leading-tight group-hover:text-white transition-colors duration-300">
                      {content.cta.secondaryButton.sublabel ||
                        "Free Consultation"}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
