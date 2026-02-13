import { Link } from "react-router-dom";
import type { StoryContent } from "@site/lib/cms/aboutPageTypes";

interface AboutStoryProps {
  content: StoryContent;
  phoneDisplay: string;
  phoneLabel: string;
}

export default function AboutStory({ content, phoneDisplay, phoneLabel }: AboutStoryProps) {
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

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-[4%]">
          {/* Left Column — All text + badges */}
          <div className="lg:col-span-3 space-y-8">
            {/* First text block */}
            <div
              className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-black prose prose-sm max-w-none [&_a]:text-law-accent [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: content.leftContent }}
            />

            {/* Linkable Badges */}
            {content.badges.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 py-4">
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

            {/* Second text block */}
            <div
              className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-black prose prose-sm max-w-none [&_a]:text-law-accent [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: content.rightContent }}
            />
          </div>

          {/* Right Column — Sticky CTA image box */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-[100px]">
              {content.image && (
                <div className="relative overflow-hidden">
                  <img
                    src={content.image}
                    alt={content.imageAlt}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                  {/* Fade into card below */}
                  <div className="absolute bottom-0 left-0 right-0 h-[60px] bg-gradient-to-t from-[#1a1a2e] to-transparent pointer-events-none" />
                </div>
              )}
              {/* CTA card */}
              <div className="bg-[#1a1a2e] p-6 text-center space-y-4">
                <h3 className="font-playfair text-[22px] md:text-[26px] text-white leading-tight">
                  Ready to Talk?
                </h3>
                <Link
                  to="/contact"
                  className="block w-full bg-law-accent text-black font-outfit text-[16px] md:text-[18px] font-semibold py-3 px-6 hover:bg-[#7a9e10] transition-colors duration-300 text-center"
                >
                  Contact Us
                </Link>
                <a
                  href={`tel:${phoneDisplay.replace(/[^0-9]/g, "")}`}
                  className="flex items-center justify-center gap-2 text-white hover:text-law-accent transition-colors duration-300"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
                  </svg>
                  <span className="font-outfit text-[18px] md:text-[20px]">
                    {phoneDisplay}
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
