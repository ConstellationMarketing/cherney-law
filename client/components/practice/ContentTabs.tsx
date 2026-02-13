import { useState } from "react";
import type { ContentTab } from "@site/lib/cms/practiceAreasPageTypes";

interface ContentTabsProps {
  tabs: ContentTab[];
}

export default function ContentTabs({ tabs }: ContentTabsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!tabs.length) return null;

  return (
    <div className="bg-white py-[40px] md:py-[60px]">
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-0 border-b-2 border-gray-200 mb-[30px] md:mb-[40px]">
          {tabs.map((tab, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`font-outfit text-[14px] md:text-[16px] px-[16px] md:px-[24px] py-[12px] md:py-[16px] transition-all duration-300 border-b-3 -mb-[2px] whitespace-nowrap ${
                activeIndex === index
                  ? "border-law-accent text-black font-semibold bg-law-accent/5"
                  : "border-transparent text-black/60 hover:text-black hover:border-gray-300"
              }`}
            >
              {tab.title}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[200px]">
          <h2 className="font-playfair text-[28px] md:text-[36px] lg:text-[42px] leading-tight text-black mb-[20px]">
            {tabs[activeIndex].title}
          </h2>
          <div
            className="font-outfit text-[16px] md:text-[18px] leading-[26px] md:leading-[30px] text-black/80 prose prose-lg max-w-none [&_h3]:font-playfair [&_h3]:text-[22px] [&_h3]:md:text-[28px] [&_h3]:text-black [&_h3]:mt-8 [&_h3]:mb-4 [&_p]:mb-4 [&_a]:text-law-accent [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: tabs[activeIndex].content }}
          />
        </div>
      </div>
    </div>
  );
}
