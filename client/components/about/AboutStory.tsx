import type { StoryContent } from "@site/lib/cms/aboutPageTypes";

interface AboutStoryProps {
  content: StoryContent;
}

export default function AboutStory({ content }: AboutStoryProps) {
  return (
    <div className="bg-white pt-[30px] md:pt-[54px] pb-[30px] md:pb-[54px]">
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
        {/* Section Label + Heading */}
        <div className="mb-[10px]">
          <p className="font-outfit text-[18px] md:text-[24px] leading-tight md:leading-[36px] text-[rgb(107,141,12)]">
            {content.sectionLabel}
          </p>
        </div>
        <h2 className="font-playfair text-[32px] md:text-[48px] lg:text-[54px] leading-tight md:leading-[54px] text-black pb-[20px] md:pb-[30px]">
          {content.heading}
        </h2>

        {/* Two Column Content + Image Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-[4%]">
          {/* Left Column - Rich Text */}
          <div className="lg:col-span-1">
            <div
              className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-black prose prose-sm max-w-none [&_a]:text-law-accent [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: content.leftContent }}
            />
          </div>

          {/* Middle - Image + Badges */}
          <div className="lg:col-span-1 flex flex-col items-center gap-6">
            {content.image && (
              <div className="relative flex items-center justify-center">
                <img
                  src={content.image}
                  alt={content.imageAlt}
                  className="max-w-full w-auto h-auto object-contain"
                  width={338}
                  height={462}
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 h-[80px] bg-gradient-to-t from-white to-transparent pointer-events-none" />
              </div>
            )}

            {/* Linkable Badges */}
            {content.badges.length > 0 && (
              <div className="grid grid-cols-2 gap-4 w-full">
                {content.badges.map((badge, index) => (
                  <a
                    key={index}
                    href={badge.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={badge.image}
                      alt={badge.alt}
                      className="w-full h-auto object-contain"
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Rich Text */}
          <div className="lg:col-span-1">
            <div
              className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-black prose prose-sm max-w-none [&_a]:text-law-accent [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: content.rightContent }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
