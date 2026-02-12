import type { AttorneyInfoContent } from "@/lib/cms/homePageTypes";

interface AttorneyInfoSectionProps {
  content?: AttorneyInfoContent;
}

export default function AttorneyInfoSection({
  content,
}: AttorneyInfoSectionProps) {
  if (!content?.heading && !content?.body) return null;

  return (
    <div className="bg-white py-[40px] md:py-[60px]">
      <div className="max-w-[1100px] mx-auto w-[90%] md:w-[85%]">
        {/* Centered Title */}
        {content.heading && (
          <h2 className="font-playfair text-[32px] md:text-[42px] lg:text-[48px] leading-[1.2] text-black text-center mb-[30px] md:mb-[40px]">
            {content.heading}
          </h2>
        )}

        {/* Two Column Layout: Image (narrower) + Text (wider) */}
        <div className="flex flex-col md:flex-row gap-[25px] md:gap-[35px] mb-[40px] md:mb-[60px]">
          {/* Left Column - City Image */}
          {content.image && (
            <div className="md:w-[35%] flex-shrink-0">
              <img
                src={content.image}
                alt={content.imageAlt || ""}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Right Column - Text Content */}
          {content.body && (
            <div className={content.image ? "md:w-[65%]" : "w-full"}>
              <div
                className="font-outfit text-[15px] md:text-[16px] leading-[1.8] text-black prose prose-sm max-w-none [&_p]:mb-[18px] [&_p:last-child]:mb-0 [&_a]:text-black [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: content.body }}
              />
            </div>
          )}
        </div>

        {/* Green Box - Stay Informed */}
        {(content.stayInformedHeading || content.stayInformedText) && (
          <div className="bg-law-accent px-[25px] md:px-[40px] lg:px-[50px] py-[30px] md:py-[40px]">
            {content.stayInformedHeading && (
              <h3 className="font-playfair text-[28px] md:text-[36px] lg:text-[40px] leading-[1.2] text-black text-center mb-[10px]">
                {content.stayInformedHeading}
              </h3>
            )}
            {content.stayInformedText && (
              <p className="font-outfit text-[15px] md:text-[16px] leading-[1.7] text-black text-center mb-[25px] md:mb-[30px]">
                {content.stayInformedText}
              </p>
            )}

            {/* Radio Network Feature */}
            {(content.stayInformedImage || content.stayInformedCaption) && (
              <div className="flex flex-col sm:flex-row items-center gap-[20px] md:gap-[25px]">
                {content.stayInformedImage && (
                  <div className="flex-shrink-0">
                    <img
                      src={content.stayInformedImage}
                      alt={content.stayInformedImageAlt || ""}
                      className="w-[280px] md:w-[340px] h-auto"
                      loading="lazy"
                    />
                  </div>
                )}
                {content.stayInformedCaption && (
                  <div>
                    <h4 className="font-playfair text-[18px] md:text-[22px] leading-[1.3] text-black font-bold">
                      {content.stayInformedCaption}
                    </h4>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
