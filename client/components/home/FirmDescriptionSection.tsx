import { Check } from "lucide-react";
import type { FirmDescriptionContent } from "@site/lib/cms/homePageTypes";
import { getOptimizedImageUrl } from "@site/lib/imageOptimizer";

interface FirmDescriptionSectionProps {
  content?: FirmDescriptionContent;
}

export default function FirmDescriptionSection({
  content,
}: FirmDescriptionSectionProps) {
  if (
    !content?.heading &&
    !content?.body &&
    !content?.image &&
    !content?.trustHeading &&
    !content?.trustReasons?.length
  ) {
    return null;
  }

  const hasImage = Boolean(content?.image);
  const hasCta = Boolean(content?.ctaText && content?.ctaLink);
  const hasTrustSection = Boolean(content?.trustHeading || content?.trustReasons?.length);
  const MainHeadingTag = `h${content?.headingLevel || 2}` as keyof JSX.IntrinsicElements;
  const TrustHeadingTag = `h${content?.trustHeadingLevel || 3}` as keyof JSX.IntrinsicElements;

  return (
    <div className="py-[30px] md:py-[50px]">
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%]">
        <div className="bg-[#C8D9AD] py-[40px] md:py-[60px] px-[30px] md:px-[60px] lg:px-[100px]">
          <div className="mx-auto max-w-[1320px] space-y-12">
            <div
              className={`items-center gap-10 lg:gap-14 ${
                hasImage
                  ? "grid grid-cols-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]"
                  : "max-w-[900px]"
              }`}
            >
              <div className="text-left">
                {content.heading && (
                  <MainHeadingTag className="font-playfair text-[28px] md:text-[36px] lg:text-[42px] leading-[1.3] text-[#1a1a1a] mb-[20px] md:mb-[30px]">
                    {content.heading}
                  </MainHeadingTag>
                )}

                {content.body && (
                  <div
                    className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-[#2a2a2a] prose prose-sm max-w-none [&_p]:mb-[20px] [&_p:last-child]:mb-0 [&_a]:text-[#2a2a2a] [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: content.body }}
                  />
                )}

                {hasCta && (
                  <div className="mt-8">
                    <a
                      href={content.ctaLink}
                      className="inline-flex items-center justify-center border border-transparent bg-[#161715] px-7 py-4 font-outfit text-[15px] font-semibold uppercase tracking-[0.08em] text-white shadow-[0_10px_25px_rgba(22,23,21,0.15)] transition-all duration-300 hover:-translate-y-1 hover:border-[#161715] hover:bg-black hover:shadow-[0_16px_35px_rgba(22,23,21,0.28)]"
                    >
                      {content.ctaText}
                    </a>
                  </div>
                )}
              </div>

              {hasImage && (
                <div className="flex justify-center lg:justify-end">
                  <img
                    src={getOptimizedImageUrl(content.image!, {
                      width: 720,
                      quality: 80,
                      resize: "contain",
                    })}
                    alt={content.heading || "Firm description"}
                    width={560}
                    height={560}
                    loading="lazy"
                    className="h-auto max-w-full object-contain"
                  />
                </div>
              )}
            </div>

            {hasTrustSection && (
              <div className="border-t border-[#161715]/10 pt-10 md:pt-12">
                {content.trustHeading && (
                  <TrustHeadingTag className="mx-auto max-w-[900px] text-center font-playfair text-[26px] md:text-[34px] leading-[1.3] text-[#1a1a1a]">
                    {content.trustHeading}
                  </TrustHeadingTag>
                )}

                {content.trustReasons?.length ? (
                  <div className="mx-auto mt-8 flex max-w-[1180px] flex-wrap justify-center gap-4">
                    {content.trustReasons.map((reason, index) => (
                      <div
                        key={`${reason}-${index}`}
                        className="flex w-full max-w-[360px] items-start gap-3 border border-[#161715]/10 bg-white/45 px-4 py-4 backdrop-blur-sm sm:w-[calc(50%-0.5rem)] xl:w-[calc(25%-0.75rem)]"
                      >
                        <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#161715] text-white">
                          <Check className="h-4 w-4" strokeWidth={2.5} />
                        </span>
                        <p className="font-outfit text-[15px] leading-[24px] text-[#1f1f1f]">
                          {reason}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
