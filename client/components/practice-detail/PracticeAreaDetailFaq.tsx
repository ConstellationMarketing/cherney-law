import { useState } from "react";
import type { PracticeAreaFaqContent } from "@site/lib/cms/practiceAreaDetailPageTypes";
import DynamicHeading from "@site/components/shared/DynamicHeading";
import { triggerDniRefreshAfterReveal } from "@site/components/WcDniManager";
import { ChevronDown } from "lucide-react";

interface Props {
  content: PracticeAreaFaqContent;
  headingTag?: string;
}

export default function PracticeAreaDetailFaq({ content, headingTag }: Props) {
  const [openIndex, setOpenIndex] = useState<number>(0);

  if (!content.enabled || !content.items || content.items.length === 0) {
    return null;
  }

  return (
    <div className="bg-white py-[40px] md:py-[60px]">
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
        <DynamicHeading
          tag={headingTag}
          defaultTag="h2"
          className="font-playfair text-[32px] md:text-[42px] lg:text-[48px] leading-tight text-black pb-[10px]"
        >
          {content.heading}
        </DynamicHeading>

        {content.description && (
          <p className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-black/70 pb-[30px] max-w-[700px]">
            {content.description}
          </p>
        )}

        <div className="space-y-0 border border-gray-200">
          {content.items.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={`border-b border-gray-200 last:border-b-0 ${isOpen ? "bg-[#1a1a2e]" : "bg-white"}`}
              >
                <button
                  onClick={() => {
                    const nextIndex = isOpen ? -1 : i;
                    setOpenIndex(nextIndex);

                    if (nextIndex !== -1) {
                      triggerDniRefreshAfterReveal();
                    }
                  }}
                  className={`w-full flex items-center justify-between p-5 md:p-6 text-left transition-colors duration-200 ${isOpen ? "text-white" : "text-black hover:bg-gray-50"}`}
                >
                  <span className="font-outfit text-[16px] md:text-[18px] font-medium pr-4">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 md:px-6 pb-5 md:pb-6">
                    <div
                      className="font-outfit text-[15px] md:text-[16px] leading-[24px] text-white/80 prose prose-invert prose-sm max-w-none [&_a]:text-law-accent [&_a]:underline"
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
