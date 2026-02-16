import type { FirmDescriptionContent } from "@site/lib/cms/homePageTypes";

interface FirmDescriptionSectionProps {
  content?: FirmDescriptionContent;
}

export default function FirmDescriptionSection({
  content,
}: FirmDescriptionSectionProps) {
  if (!content?.heading && !content?.body) return null;

  return (
    <div className="py-[30px] md:py-[50px]">
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%]">
        <div className="bg-[#C8D9AD] py-[40px] md:py-[60px] px-[30px] md:px-[60px] lg:px-[100px]">
          <div className="max-w-[900px] mx-auto text-center">
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
          </div>
        </div>
      </div>
    </div>
  );
}
