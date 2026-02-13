import { Link } from "react-router-dom";
import type { AboutHeroContent } from "@site/lib/cms/aboutPageTypes";

interface AboutHeroProps {
  content: AboutHeroContent;
  phoneDisplay: string;
  phoneLabel: string;
}

export default function AboutHero({ content, phoneDisplay, phoneLabel }: AboutHeroProps) {
  return (
    <div className="bg-law-accent pt-[30px] md:pt-[54px] pb-[30px] md:pb-[54px]">
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%]">
        {/* H1 Title */}
        <h1 className="font-outfit text-[18px] md:text-[24px] leading-tight md:leading-[36px] text-white mb-[10px]">
          {content.sectionLabel}
        </h1>
        {/* Tagline */}
        <p className="font-playfair text-[clamp(2.5rem,7vw,68.8px)] font-light leading-[1.2] text-black mb-[20px] md:mb-[30px] max-w-[900px]">
          {content.tagline}
        </p>

        {/* White Hero Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-[820px]">
          {/* Call Box - uses global phone */}
          <a href={`tel:${phoneDisplay.replace(/[^0-9]/g, "")}`} className="w-full sm:w-1/2">
            <div className="bg-white p-[8px] w-full cursor-pointer border-2 border-transparent hover:border-black transition-all duration-300 hover:bg-law-accent group">
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
                  <p className="font-outfit text-[clamp(1.75rem,5vw,40px)] text-black leading-tight group-hover:text-white transition-colors duration-300">
                    {phoneDisplay}
                  </p>
                </div>
              </div>
            </div>
          </a>

          {/* CMS buttons */}
          {content.buttons.map((btn, i) => (
            <Link key={i} to={btn.href || "/about"} className="w-full sm:w-1/2">
              <div className="bg-white p-[8px] h-full cursor-pointer border-2 border-transparent hover:border-black transition-all duration-300 hover:bg-law-accent group flex items-center justify-center min-h-[80px]">
                <span className="font-outfit text-[clamp(1.5rem,4vw,32px)] text-black font-light group-hover:text-white transition-colors duration-300">
                  {btn.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
