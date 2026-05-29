import type { AttorneyInfoContent } from "@site/lib/cms/homePageTypes";
import { getOptimizedImageUrl } from "@site/lib/imageOptimizer";

interface AttorneyInfoSectionProps {
  content?: AttorneyInfoContent;
}

export default function AttorneyInfoSection({
  content,
}: AttorneyInfoSectionProps) {
  if (!content?.heading && !content?.body) return null;

  const featuredLogos = content.featuredLogos?.filter((logo) => logo.image) || [];
  const hasFeaturedSection = Boolean(content.featuredInHeading || featuredLogos.length);
  const FeaturedHeadingTag = `h${content.featuredInHeadingLevel || 3}` as keyof JSX.IntrinsicElements;
  const slidingLogos = featuredLogos.length > 1 ? [...featuredLogos, ...featuredLogos] : featuredLogos;

  return (
    <div className="bg-white py-[40px] md:py-[60px]">
      <div className="max-w-[1100px] mx-auto w-[90%] md:w-[85%]">
        {content.heading && (
          <h2 className="font-playfair text-[32px] md:text-[42px] lg:text-[48px] leading-[1.2] text-black text-center mb-[30px] md:mb-[40px]">
            {content.heading}
          </h2>
        )}

        <div className="flex flex-col md:flex-row gap-[25px] md:gap-[35px] mb-[40px] md:mb-[60px]">
          {content.image && (
            <div className="md:w-[35%] flex-shrink-0">
              <img
                src={getOptimizedImageUrl(content.image, {
                  width: 600,
                  quality: 75,
                  resize: "cover",
                })}
                alt={content.imageAlt || ""}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {content.body && (
            <div className={content.image ? "md:w-[65%]" : "w-full"}>
              <div
                className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-black prose prose-sm max-w-none [&_p]:mb-[18px] [&_p:last-child]:mb-0 [&_a]:text-black [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: content.body }}
              />
            </div>
          )}
        </div>

        {(content.stayInformedHeading || content.stayInformedText) && (
          <div className="bg-law-accent px-[25px] md:px-[40px] lg:px-[50px] py-[30px] md:py-[40px]">
            {content.stayInformedHeading && (
              <h3 className="font-playfair text-[28px] md:text-[36px] lg:text-[40px] leading-[1.2] text-black text-center mb-[10px]">
                {content.stayInformedHeading}
              </h3>
            )}
            {content.stayInformedText && (
              <p className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-black text-center mb-[25px] md:mb-[30px]">
                {content.stayInformedText}
              </p>
            )}

            {(content.stayInformedImage || content.stayInformedCaption) && (
              <div className="flex flex-col sm:flex-row items-center gap-[20px] md:gap-[25px]">
                {content.stayInformedImage && (
                  <div className="flex-shrink-0">
                    <img
                      src={getOptimizedImageUrl(content.stayInformedImage, {
                        width: 420,
                        quality: 75,
                        resize: "contain",
                      })}
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

        {hasFeaturedSection && (
          <div className="mt-[40px] md:mt-[56px]">
            {content.featuredInHeading && (
              <FeaturedHeadingTag className="font-playfair text-[24px] md:text-[30px] leading-[1.2] text-black text-center mb-[24px] md:mb-[30px]">
                {content.featuredInHeading}
              </FeaturedHeadingTag>
            )}

            {featuredLogos.length > 0 && (
              <div className="mx-auto max-w-[940px] overflow-hidden">
                {featuredLogos.length === 1 ? (
                  <div className="flex justify-center">
                    <div className="flex h-[96px] w-[220px] items-center justify-center px-6 py-4">
                      <img
                        src={getOptimizedImageUrl(featuredLogos[0].image, {
                          width: 320,
                          quality: 85,
                          resize: "contain",
                        })}
                        alt={featuredLogos[0].alt || "Featured logo"}
                        className="max-h-[56px] w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="featured-logo-marquee flex w-max items-center gap-8 py-2">
                    {slidingLogos.map((logo, index) => (
                      <div
                        key={`${logo.image}-${index}`}
                        className="flex h-[96px] w-[220px] shrink-0 items-center justify-center border border-black/10 bg-[#f8f8f4] px-6 py-4"
                      >
                        <img
                          src={getOptimizedImageUrl(logo.image, {
                            width: 320,
                            quality: 85,
                            resize: "contain",
                          })}
                          alt={logo.alt || "Featured logo"}
                          className="max-h-[56px] w-full object-contain"
                          loading="lazy"
                        />
                      </div>
                    ))}
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
