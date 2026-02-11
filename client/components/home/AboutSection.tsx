import { Phone, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import type { AboutContent } from "@/lib/homePageTypes";
import { useGlobalPhone } from "@site/contexts/SiteSettingsContext";

interface AboutSectionProps {
  content?: AboutContent;
}

const defaultContent: AboutContent = {
  sectionLabel: "– About Us",
  heading: "A Leading Lawyer for an Atlanta Law Firm",
  description:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi",
  phone: "404-555-5555",
  phoneLabel: "Call Us 24/7",
  contactLabel: "Contact Us",
  contactText: "For a Free Consultation",
  attorneyImage: "/images/team/attorney-1.png",
  attorneyImageAlt: "Attorney",
  features: [
    {
      number: "1",
      title: "Nationwide Representation",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi eget augue tincidunt, rhoncus lacus a, congue diam.",
    },
    {
      number: "2",
      title: "Understanding Your Case",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi eget augue tincidunt, rhoncus lacus a, congue diam.",
    },
    {
      number: "3",
      title: "Seeking Compensation",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi eget augue tincidunt, rhoncus lacus a, congue diam.",
    },
  ],
  stats: [
    { value: "1000+", label: "Trusted Clients Served" },
    { value: "$50 Million", label: "Recovered in Legal Dispute Settlements" },
    { value: "98%", label: "Client Satisfaction Rate" },
    { value: "150+", label: "Legal Professionals Available 24/7" },
  ],
};

export default function AboutSection({ content }: AboutSectionProps) {
  const data = content || defaultContent;
  const features = data.features || defaultContent.features;
  const stats = data.stats || defaultContent.stats;
  const { phoneDisplay, phoneLabel } = useGlobalPhone();

  return (
    <div className="bg-white pt-[30px] md:pt-[54px]">
      {/* Main Content Section */}
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] pt-[20px] md:pt-[27px]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-[5.5%]">
          {/* Left Column - About Text and CTAs */}
          <div className="md:w-full">
            {/* About Us Label */}
            <div className="text-law-accent font-outfit text-[18px] md:text-[24px] leading-tight md:leading-[36px] mb-[10px]">
              {data.sectionLabel}
            </div>

            {/* Heading */}
            <div className="mb-[20px] md:mb-[9.27%]">
              <h2 className="font-playfair text-[32px] md:text-[48px] lg:text-[54px] leading-tight md:leading-[54px] text-black pb-[10px]">
                {data.heading}
              </h2>
              <p className="font-outfit text-[16px] md:text-[20px] leading-[24px] md:leading-[30px] text-black">
                {data.description}
              </p>
            </div>

            {/* Call Us 24/7 Box */}
            <div className="bg-law-accent p-[8px] w-full max-w-[400px] mb-[9.27%] cursor-pointer transition-all duration-300 hover:bg-law-accent-dark group">
              <div className="flex items-start gap-4">
                <div className="bg-white p-[15px] mt-1 flex items-center justify-center group-hover:bg-black transition-colors duration-300">
                  <Phone
                    className="w-8 h-8 [&>*]:fill-none [&>*]:stroke-black group-hover:[&>*]:stroke-white transition-colors duration-300"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-outfit text-[16px] md:text-[18px] leading-tight text-black pb-[10px] group-hover:text-white transition-colors duration-300">
                    {phoneLabel}
                  </h4>
                  <p className="font-outfit text-[28px] md:text-[40px] text-black leading-none group-hover:text-white transition-colors duration-300">
                    {phoneDisplay}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Us Box */}
            <div className="bg-law-accent p-[8px] w-full max-w-[400px] cursor-pointer transition-all duration-300 hover:bg-law-accent-dark group">
              <div className="flex items-start gap-4">
                <div className="bg-white p-[15px] mt-1 flex items-center justify-center group-hover:bg-black transition-colors duration-300">
                  <DollarSign
                    className="w-8 h-8 [&>*]:fill-none [&>*]:stroke-black group-hover:[&>*]:stroke-white transition-colors duration-300"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-outfit text-[16px] md:text-[18px] leading-tight text-black pb-[10px] group-hover:text-white transition-colors duration-300">
                    {data.contactLabel}
                  </h4>
                  <p className="font-outfit text-[18px] md:text-[24px] text-black leading-none group-hover:text-white transition-colors duration-300">
                    {data.contactText}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Image */}
          <div className="md:w-full flex justify-center md:justify-start">
            <img
              src={data.attorneyImage}
              alt={data.attorneyImageAlt}
              className="max-w-full w-auto h-auto object-contain"
              width={462}
              height={631}
              loading="lazy"
            />
          </div>

          {/* Right Column - Features */}
          <div className="md:w-full space-y-[20px] md:space-y-[30px]">
            {features.map((feature, index) => (
              <div key={index}>
                <div className="mb-[20px] md:mb-[30px]">
                  <h3 className="font-outfit text-[22px] md:text-[28px] leading-tight md:leading-[28px] text-black pb-[10px]">
                    {feature.number}. {feature.title}
                  </h3>
                  <p className="font-outfit text-[16px] md:text-[20px] leading-[24px] md:leading-[30px] text-black">
                    {feature.description}
                  </p>
                </div>
                {index < features.length - 1 && (
                  <div className="h-[23px]">
                    <div className="inline-block w-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] py-[20px] md:py-[27px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-[3%]">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="max-w-[550px] mx-auto">
                <h4 className="font-[Crimson_Pro,Georgia,Times_New_Roman,serif] text-[40px] md:text-[60px] leading-tight md:leading-[60px] text-black pb-[10px]">
                  {stat.value}
                </h4>
                <div className="font-outfit text-[16px] md:text-[20px] font-light text-black text-center">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
