import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { PracticeAreasFAQContent } from "@site/lib/cms/practiceAreasPageTypes";

interface PracticeAreasFAQProps {
  content: PracticeAreasFAQContent;
}

export default function PracticeAreasFAQ({ content }: PracticeAreasFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (!content.items.length) return null;

  return (
    <div className="bg-gray-50 py-[40px] md:py-[60px]">
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
        <h2 className="font-playfair text-[32px] md:text-[42px] lg:text-[48px] leading-tight text-black mb-[30px] md:mb-[40px] text-center">
          {content.heading}
        </h2>

        <div className="max-w-[900px] mx-auto space-y-[4px]">
          {content.items.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index} className="bg-white border border-gray-200">
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="w-full flex items-center justify-between px-[20px] md:px-[30px] py-[16px] md:py-[20px] text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-outfit text-[16px] md:text-[18px] font-medium text-black pr-4">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-law-accent shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-[20px] md:px-[30px] pb-[20px] md:pb-[25px]">
                    <div
                      className="font-outfit text-[15px] md:text-[16px] leading-[24px] md:leading-[26px] text-black/75 prose prose-sm max-w-none [&_p]:mb-3 [&_a]:text-law-accent [&_a]:underline"
                      dangerouslySetInnerHTML={{ __html: item.answer }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
