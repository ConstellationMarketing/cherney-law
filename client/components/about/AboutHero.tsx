import type { AboutHeroContent } from "@site/lib/cms/aboutPageTypes";
import { Phone } from "lucide-react";

interface AboutHeroProps {
  content: AboutHeroContent;
  phoneDisplay: string;
  phoneLabel: string;
}

export default function AboutHero({ content, phoneDisplay, phoneLabel }: AboutHeroProps) {
  return (
    <div className="bg-law-accent pt-[30px] md:pt-[54px] pb-[30px] md:pb-[54px]">
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%]">
        <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
          {/* Left — Text */}
          <div className="flex-1">
            <h1 className="font-outfit text-[18px] md:text-[24px] leading-tight md:leading-[36px] text-white mb-[10px]">
              {content.sectionLabel}
            </h1>
            <p className="font-playfair text-[clamp(2.5rem,7vw,68.8px)] font-light leading-[1.2] text-black max-w-[900px]">
              {content.tagline}
            </p>
          </div>

          {/* Right — Phone Button */}
          <div className="shrink-0 w-full md:w-auto md:max-w-[380px]">
            <a href={`tel:${phoneDisplay.replace(/[^0-9]/g, "")}`} className="block">
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
  );
}
