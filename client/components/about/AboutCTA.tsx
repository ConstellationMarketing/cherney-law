import { Link } from "react-router-dom";
import type { CTAContent } from "@site/lib/cms/aboutPageTypes";

interface AboutCTAProps {
  content: CTAContent;
  phoneDisplay: string;
  phoneLabel: string;
}

export default function AboutCTA({ content, phoneDisplay, phoneLabel }: AboutCTAProps) {
  return (
    <div className="bg-law-accent py-[40px] md:py-[60px]">
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
        <div className="text-center mb-[30px] md:mb-[40px]">
          <h2 className="font-playfair text-[36px] md:text-[48px] lg:text-[60px] leading-tight text-black pb-[15px]">
            {content.heading}
          </h2>
          <p className="font-outfit text-[18px] md:text-[22px] leading-[26px] md:leading-[32px] text-black/80">
            {content.description}
          </p>
        </div>

        {/* Two equal-width white buttons with icons */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 justify-center items-stretch max-w-[820px] mx-auto">
          {/* Phone Button */}
          <a href={`tel:${phoneDisplay.replace(/[^0-9]/g, "")}`} className="w-full md:w-1/2">
            <div className="bg-white p-[8px] w-full h-full cursor-pointer border-2 border-transparent hover:border-black transition-all duration-300 hover:bg-law-accent group">
              <div className="flex items-start gap-4">
                <div className="bg-law-accent p-[15px] mt-1 flex items-center justify-center group-hover:bg-black transition-colors duration-300">
                  <svg
                    className="w-8 h-8 text-black group-hover:text-white transition-colors duration-300"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
                  </svg>
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
          <Link to={content.secondaryButton.href || "/contact"} className="w-full md:w-1/2">
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
                    {content.secondaryButton.label || "Schedule Now"}
                  </h4>
                  <p className="font-outfit text-[22px] md:text-[26px] text-black leading-tight group-hover:text-white transition-colors duration-300">
                    {content.secondaryButton.sublabel || "Free Consultation"}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
