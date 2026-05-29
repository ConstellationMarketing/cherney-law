import type { FirmDescriptionContent } from "@site/lib/cms/homePageTypes";
import { getOptimizedImageUrl } from "@site/lib/imageOptimizer";

interface FirmDescriptionSectionProps {
  content?: FirmDescriptionContent;
}

export default function FirmDescriptionSection({
  content,
}: FirmDescriptionSectionProps) {
  if (!content?.heading && !content?.body && !content?.image) return null;

  const hasImage = Boolean(content?.image);
  const hasCta = Boolean(content?.ctaText && content?.ctaLink);

  return (
    <div className="py-[30px] md:py-[50px]">
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%]">
        <div className="bg-[#C8D9AD] py-[40px] md:py-[60px] px-[30px] md:px-[60px] lg:px-[100px]">
          <div
            className={`mx-auto items-center gap-10 lg:gap-14 ${
              hasImage
                ? "grid max-w-[1320px] grid-cols-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]"
                : "max-w-[900px]"
            }`}
          >
            <div className="text-left">
              {content.heading && (
                <h2 className="font-playfair text-[28px] md:text-[36px] lg:text-[42px] leading-[1.3] text-[#1a1a1a] mb-[20px] md:mb-[30px]">
                  {content.heading}
                </h2>
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
                    className="inline-flex items-center justify-center bg-[#161715] px-7 py-4 font-outfit text-[15px] font-semibold uppercase tracking-[0.08em] text-white transition-colors duration-300 hover:bg-black"
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
        </div>
      </div>
    </div>
  );
}
