import { Link } from "react-router-dom";
import type { PracticeAreasCTAContent } from "@site/lib/cms/practiceAreasPageTypes";

interface PracticeAreasCTAProps {
  content: PracticeAreasCTAContent;
}

export default function PracticeAreasCTA({ content }: PracticeAreasCTAProps) {
  return (
    <div className="bg-law-dark py-[40px] md:py-[60px]">
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
        <h2 className="font-playfair text-[32px] md:text-[42px] lg:text-[48px] leading-tight text-white mb-[20px] md:mb-[30px]">
          {content.heading}
        </h2>
        <div
          className="font-outfit text-[16px] md:text-[18px] leading-[26px] md:leading-[30px] text-white/85 prose prose-lg prose-invert max-w-none [&_p]:mb-4 [&_a]:text-law-accent [&_a]:underline mb-[30px] md:mb-[40px]"
          dangerouslySetInnerHTML={{ __html: content.content }}
        />
        <Link
          to={content.buttonLink}
          className="inline-block bg-law-accent px-[30px] md:px-[40px] py-[14px] md:py-[18px] font-outfit text-[16px] md:text-[18px] font-semibold text-black hover:bg-white transition-colors duration-300"
        >
          {content.buttonLabel}
        </Link>
      </div>
    </div>
  );
}
