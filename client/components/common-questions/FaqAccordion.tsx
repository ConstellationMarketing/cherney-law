import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/lib/cms/commonQuestionsPageTypes";

interface FaqAccordionProps {
  items: FaqItem[];
}

export default function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (!items.length) return null;

  return (
    <div className="space-y-[4px]">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={index} className="bg-white border-2 border-black">
            <button
              type="button"
              onClick={() => toggle(index)}
              className="w-full flex items-center justify-between px-[20px] md:px-[30px] py-[16px] md:py-[20px] text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-outfit text-[16px] md:text-[18px] font-semibold text-black pr-4">
                {item.question}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-black shrink-0 transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-[20px] md:px-[30px] pb-[20px] md:pb-[25px] border-t border-gray-200">
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
  );
}
