import { useGlobalPhone } from "@site/contexts/SiteSettingsContext";
import { Phone } from "lucide-react";

interface Props {
  title: string;
  subtitle: string;
}

export default function BlogHero({ title, subtitle }: Props) {
  const { phoneDisplay, phoneLabel } = useGlobalPhone();

  return (
    <div className="bg-[#1a1a2e] pt-[30px] md:pt-[54px] pb-[30px] md:pb-[54px]">
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%]">
        <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
          <div className="flex-1">
            <h1 className="font-playfair text-[clamp(2.5rem,7vw,68.8px)] font-light leading-[1.2] text-white max-w-[900px]">
              {title}
            </h1>
            {subtitle && (
              <p className="font-outfit text-[18px] md:text-[22px] leading-tight text-white/70 mt-3">
                {subtitle}
              </p>
            )}
          </div>

          <div className="shrink-0 w-full md:w-auto md:max-w-[380px]">
            <a href={`tel:${phoneDisplay.replace(/[^0-9]/g, "")}`} data-dni-phone="primary" className="block">
              <div className="bg-law-accent p-[8px] w-full cursor-pointer border-2 border-transparent hover:border-white transition-all duration-300 group">
                <div className="flex items-start gap-4">
                  <div className="bg-white p-[15px] mt-1 flex items-center justify-center group-hover:bg-black transition-colors duration-300">
                    <Phone className="w-8 h-8 text-black group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-outfit text-[16px] md:text-[18px] leading-tight text-black pb-[10px] font-normal">
                      {phoneLabel}
                    </h4>
                    <p className="font-outfit text-[clamp(1.75rem,5vw,40px)] text-black leading-tight">
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
