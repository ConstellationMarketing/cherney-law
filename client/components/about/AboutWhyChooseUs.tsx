import type { WhyChooseUsContent } from "@site/lib/cms/aboutPageTypes";

interface AboutWhyChooseUsProps {
  content: WhyChooseUsContent;
}

export default function AboutWhyChooseUs({ content }: AboutWhyChooseUsProps) {
  return (
    <div className="bg-white pt-[30px] md:pt-[40px] pb-[40px] md:pb-[60px]">
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-[8%]">
          {/* Left Side - Heading + Image */}
          <div>
            <div className="mb-[10px]">
              <p className="font-outfit text-[18px] md:text-[24px] leading-tight md:leading-[36px] text-[rgb(107,141,12)]">
                {content.sectionLabel}
              </p>
            </div>
            <h2 className="font-playfair text-[32px] md:text-[48px] lg:text-[54px] leading-tight md:leading-[54px] text-black pb-[20px]">
              {content.heading}
            </h2>
            <div
              className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-black mb-[30px] prose prose-sm max-w-none [&_a]:text-law-accent [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: content.description }}
            />
            {content.image && (
              <div className="hidden lg:block">
                <img
                  src={content.image}
                  alt={content.imageAlt}
                  className="w-full max-w-[400px] h-auto object-cover"
                  loading="lazy"
                />
              </div>
            )}
          </div>

          {/* Right Side - Features List */}
          <div className="space-y-[20px] md:space-y-[30px]">
            {content.items.map((feature, index) => (
              <div key={index}>
                <div className="mb-[15px] md:mb-[20px]">
                  <h3 className="font-outfit text-[22px] md:text-[28px] leading-tight md:leading-[28px] text-black pb-[10px]">
                    {feature.number}. {feature.title}
                  </h3>
                  <p className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-black">
                    {feature.description}
                  </p>
                </div>
                {index < content.items.length - 1 && (
                  <div className="h-[1px] bg-law-border/30"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
