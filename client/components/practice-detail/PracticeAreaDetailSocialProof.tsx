import type { PracticeAreaSocialProofContent } from "@site/lib/cms/practiceAreaDetailPageTypes";

interface Props {
  content: PracticeAreaSocialProofContent;
}

export default function PracticeAreaDetailSocialProof({ content }: Props) {
  if (content.mode === "none") return null;

  if (content.mode === "awards" && content.awards?.logos?.length > 0) {
    return (
      <div className="bg-gray-50 py-[30px] md:py-[40px]">
        <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {content.awards.logos.map((logo, i) => (
              <img
                key={i}
                src={logo.src}
                alt={logo.alt}
                className="h-16 md:h-20 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (content.mode === "testimonials" && content.testimonials?.length > 0) {
    return (
      <div className="bg-white py-[40px] md:py-[60px]">
        <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.testimonials.map((item, i) => (
              <div
                key={i}
                className="bg-gray-50 p-6 border border-gray-200"
              >
                {item.rating && (
                  <img
                    src={item.rating}
                    alt="Rating"
                    className="h-5 mb-3"
                    loading="lazy"
                  />
                )}
                <div
                  className="font-outfit text-[15px] md:text-[16px] leading-[24px] text-gray-700 mb-4"
                  dangerouslySetInnerHTML={{ __html: item.text }}
                />
                <p className="font-outfit text-[14px] font-semibold text-black">
                  — {item.author}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
