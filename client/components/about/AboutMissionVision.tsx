import type { MissionVisionContent } from "@site/lib/cms/aboutPageTypes";

interface AboutMissionVisionProps {
  content: MissionVisionContent;
}

export default function AboutMissionVision({ content }: AboutMissionVisionProps) {
  return (
    <div className="bg-law-accent-dark py-[40px] md:py-[60px]">
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-[8%]">
          {/* Mission */}
          <div className="text-center lg:text-left">
            <h2 className="font-playfair text-[32px] md:text-[40px] leading-tight text-white pb-[15px] md:pb-[20px]">
              {content.mission.heading}
            </h2>
            <p className="font-outfit text-[16px] md:text-[18px] leading-[26px] md:leading-[30px] text-white/80">
              {content.mission.text}
            </p>
          </div>

          {/* Vision */}
          <div className="text-center lg:text-left">
            <h2 className="font-playfair text-[32px] md:text-[40px] leading-tight text-white pb-[15px] md:pb-[20px]">
              {content.vision.heading}
            </h2>
            <p className="font-outfit text-[16px] md:text-[18px] leading-[26px] md:leading-[30px] text-white/80">
              {content.vision.text}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
