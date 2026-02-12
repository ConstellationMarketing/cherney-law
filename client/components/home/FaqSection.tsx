import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FaqContent, FaqItem } from "@site/lib/cms/homePageTypes";

interface FaqSectionProps {
  content?: FaqContent;
}

const defaultContent: FaqContent = {
  heading: "Frequently Asked Questions",
  description:
    "Aenean porta erat id urna porttitor scelerisque. Aliquam vitae auctor nunc.",
  videoThumbnail: "/images/backgrounds/faq-bg.jpg",
  videoUrl:
    "https://www.youtube.com/embed/FkQuawiGWUw?autoplay=1&feature=oembed",
  items: [
    {
      question: "This is an example FAQ",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut.",
    },
    {
      question: "This is an example FAQ",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut.",
    },
    {
      question: "This is an example FAQ",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut.",
    },
    {
      question: "This is an example FAQ",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut.",
    },
  ],
};

export default function FaqSection({ content }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState(0);

  const data = content || defaultContent;
  const faqs = data.items || defaultContent.items;

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <div className="bg-white pt-[30px] md:pt-[54px]">
      {/* Header Section */}
      <div className="max-w-[1080px] mx-auto w-[95%] md:w-[85%] lg:w-[80%] py-[20px] md:py-[27px]">
        <div className="text-center">
          <h2 className="font-playfair text-[32px] md:text-[48px] lg:text-[54px] leading-tight md:leading-[54px] text-black pb-[10px]">
            {data.heading}
          </h2>
          <p className="font-outfit text-[16px] md:text-[24px] leading-[24px] md:leading-[36px] text-black text-center">
            {data.description}
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-[1600px] mx-auto w-[95%] md:w-[85%] lg:w-[80%] py-[20px] md:py-[27px] flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-[5.5%]">
        {/* Left Side - Image */}
        <div className="lg:w-[47.25%]">
          <img
            src={data.videoThumbnail}
            alt="Frequently Asked Questions"
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </div>

        {/* Right Side - Custom Accordion */}
        <div className="lg:w-[47.25%]">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`border-[0.8px] border-[rgb(217,217,217)] ${
                index < faqs.length - 1 ? "mb-[5.82%]" : ""
              } ${openIndex === index ? "bg-law-dark" : "bg-white"}`}
            >
              <button
                onClick={() => toggleFaq(index)}
                className={`w-full font-outfit text-[28px] leading-[28px] px-[20px] py-[20px] text-left flex items-center justify-between cursor-pointer ${
                  openIndex === index ? "text-white" : "text-[rgb(67,67,67)]"
                }`}
              >
                <span className="pr-[50px]">{faq.question}</span>
                <ChevronDown
                  className={`h-6 w-6 flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === index && (
                <div
                  className="font-outfit text-[22px] leading-[33px] font-light px-[20px] pb-[20px] pt-[20px] text-white [&_a]:underline [&_p]:mb-2 [&_p:last-child]:mb-0"
                  dangerouslySetInnerHTML={{ __html: faq.answer }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
