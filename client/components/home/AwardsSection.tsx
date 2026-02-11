import type { AwardsContent } from "@/lib/homePageTypes";

interface AwardsSectionProps {
  content?: AwardsContent;
}

const defaultContent: AwardsContent = {
  sectionLabel: "– Achievements",
  heading: "Awards & Membership",
  description:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi",
  logos: [
    { src: "/images/awards/award-1.png", alt: "Award Logo" },
    { src: "/images/awards/award-2.png", alt: "Award Logo" },
    { src: "/images/awards/award-3.png", alt: "Award Logo" },
    { src: "/images/awards/award-4.png", alt: "Award Logo" },
    { src: "/images/awards/award-5.png", alt: "Award Logo" },
    { src: "/images/awards/award-6.png", alt: "Award Logo" },
    { src: "/images/awards/forbes.png", alt: "Forbes" },
    { src: "/images/awards/lc-logo.png", alt: "LC Logo" },
  ],
};

export default function AwardsSection({ content }: AwardsSectionProps) {
  const data = content || defaultContent;
  const logos = data.logos || defaultContent.logos;

  return (
    <div
      className="relative pt-[30px] md:pt-[54px]"
      style={{
        backgroundImage:
          "linear-gradient(#161715 54%, rgb(255, 255, 255) 54%)",
      }}
    >
      <div className="max-w-[1640px] mx-auto w-[95%] md:w-[85%] lg:w-[80%] flex flex-col lg:flex-row relative">
        {/* Left Side - Text Content */}
        <div className="lg:w-1/3 lg:min-w-[40%] bg-[rgb(239,239,239)] p-[30px] md:p-[40px] relative z-[2]">
          <div className="mb-[10px]">
            <p className="font-outfit text-[18px] md:text-[24px] leading-tight md:leading-[36px] text-law-accent">
              {data.sectionLabel}
            </p>
          </div>
          <div>
            <h2 className="font-playfair text-[32px] md:text-[48px] lg:text-[54px] leading-tight md:leading-[54px] text-black pb-[10px]">
              {data.heading}
            </h2>
            <p className="font-outfit text-[20px] leading-[30px] text-black">
              {data.description}
            </p>
          </div>
        </div>

        {/* Right Side - Logo Grid */}
        <div className="lg:w-2/3 bg-[rgb(239,239,239)] relative z-[2]">
          {/* First Row */}
          <div className="flex p-[50px] px-[30px] w-full">
            {logos.slice(0, 4).map((logo, index) => (
              <div
                key={index}
                className="bg-white flex-shrink-0"
                style={{
                  width: "21.574%",
                  marginRight: index < 3 ? "4.569%" : "0",
                }}
              >
                <div className="text-center">
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    width={240}
                    height={155}
                    loading="lazy"
                    className="max-w-full inline-block"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Second Row */}
          <div className="flex p-[50px] px-[30px] w-full">
            {logos.slice(4, 8).map((logo, index) => (
              <div
                key={index}
                className="bg-white flex-shrink-0"
                style={{
                  width: "21.574%",
                  marginRight: index < 3 ? "4.569%" : "0",
                }}
              >
                <div className="text-center">
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    width={240}
                    height={155}
                    loading="lazy"
                    className="max-w-full inline-block"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
