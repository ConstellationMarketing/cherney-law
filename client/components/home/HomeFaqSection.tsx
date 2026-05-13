import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { triggerDniRefreshAfterReveal } from "@site/components/WcDniManager";
import type { HomeFaqContent } from "@site/lib/cms/homePageTypes";

interface HomeFaqSectionProps {
  content?: HomeFaqContent;
}

export default function HomeFaqSection({ content }: HomeFaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const heading = content?.heading?.trim();
  const items = (content?.items ?? []).filter(
    (item) => item.question?.trim() && item.answer?.trim(),
  );

  if (items.length === 0) {
    return null;
  }

  const toggle = (index: number) => {
    const nextIndex = openIndex === index ? null : index;
    setOpenIndex(nextIndex);

    if (nextIndex !== null) {
      triggerDniRefreshAfterReveal();
    }
  };

  return (
    <section className="bg-white py-[40px] md:py-[60px]">
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
        {heading && (
          <h2 className="font-playfair text-[32px] md:text-[42px] lg:text-[48px] leading-tight text-black mb-[30px] md:mb-[40px] text-center">
            {heading}
          </h2>
        )}

        {items.length > 0 && (
          <div className="max-w-[900px] mx-auto space-y-[4px]">
            {items.map((item, index) => {
              const isOpen = openIndex === index;

              return (
                <div key={index} className="bg-white border border-gray-200">
                  <button
                    type="button"
                    onClick={() => toggle(index)}
                    className="w-full flex items-center justify-between px-[20px] md:px-[30px] py-[16px] md:py-[20px] text-left hover:bg-gray-50 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="font-outfit text-[16px] md:text-[18px] font-medium text-black pr-4">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-law-accent shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
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
        )}
      </div>
    </section>
  );
}
