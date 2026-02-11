import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Scale } from "lucide-react";
import type { ContactContent } from "@/lib/homePageTypes";

interface ContactUsSectionProps {
  content?: ContactContent;
}

const defaultContent: ContactContent = {
  sectionLabel: "– Contact Us",
  heading: "Get your FREE case evaluation today.",
  description:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut.",
  phone: "404-555-5555",
  phoneLabel: "Call Us 24/7",
  address: "4120 Presidential Parkway, Suite 200, Atlanta, GA 30340",
  formHeading: "Contact Us Today To Schedule a Consultation",
};

export default function ContactUsSection({ content }: ContactUsSectionProps) {
  const data = content || defaultContent;
  return (
    <div className="bg-white pt-[30px] md:pt-[54px] relative">
      <div className="max-w-[1600px] mx-auto w-[95%] md:w-[85%] lg:w-[80%] relative flex flex-col lg:flex-row gap-8 lg:gap-[3%]">
        {/* Left Side */}
        <div className="lg:w-[65.667%] relative">
          {/* Top Heading Section */}
          <div className="py-[4.2415%] relative w-full">
            <div className="relative w-full">
              <div className="mb-[10px]">
                <p className="font-outfit text-[18px] md:text-[24px] leading-tight md:leading-[36px] text-[#6b8d0c]">
                  {data.sectionLabel}
                </p>
              </div>
              <div>
                <h2 className="font-playfair text-[32px] md:text-[48px] lg:text-[54px] leading-tight md:leading-[54px] text-black pb-[10px]">
                  {data.heading}
                </h2>
                <p className="font-outfit text-[16px] md:text-[24px] leading-[24px] md:leading-[36px] text-black">
                  {data.description}
                </p>
              </div>
            </div>
          </div>

          {/* Background Image Section with Two Parts */}
          <div
            className="relative w-full flex flex-col sm:flex-row pr-0 sm:pr-[20px]"
            style={{
              backgroundImage: "url(/images/backgrounds/contact-us-bg.jpg)",
              backgroundPosition: "50% 50%",
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
            }}
          >
            {/* Left Image */}
            <div className="sm:w-[45.758%] sm:mr-[8.483%] relative -mt-[30px] ml-auto text-right">
              <img
                src="/images/team/attorney-2.png"
                alt="Contact Us"
                width={338}
                height={462}
                loading="lazy"
                className="inline-block max-w-full w-[338px]"
              />
            </div>

            {/* Right Overlay Box */}
            <div
              className="sm:w-[45.758%] relative p-[30px] ml-auto"
              style={{
                backgroundColor: "rgba(29, 73, 70, 0.54)",
              }}
            >
              <div className="relative mb-[10px]">
                <div className="table w-full mx-auto max-w-full">
                  <div className="table-cell w-[32px] leading-[0] mb-[30px]">
                    <span className="m-auto">
                      <span
                        className="inline-block opacity-0 bg-[#baea0] p-[20px_30px] text-[30px] leading-[30px] font-black"
                        style={{ fontFamily: "FontAwesome" }}
                      ></span>
                    </span>
                  </div>
                  <div className="table-cell align-top pl-[15px]"></div>
                </div>
              </div>

              <div className="relative">
                <div className="mx-auto max-w-full w-full text-center">
                  <div className="text-left">
                    <h4 className="font-playfair text-[22px] md:text-[28px] leading-tight md:leading-[36.4px] text-white pb-[10px]">
                      {data.formHeading}
                    </h4>
                    <div>
                      <p className="font-outfit text-[16px] md:text-[20px] leading-[24px] md:leading-[28px] text-white font-light">
                        Our intake team is available 24 hours a day, seven days
                        a week
                      </p>
                    </div>
                    <div className="mt-[20px] md:mt-[30px] flex justify-start">
                      <div className="bg-law-accent p-[15px] inline-block">
                        <Scale
                          className="w-[40px] h-[40px] md:w-[50px] md:h-[50px] text-black"
                          strokeWidth={1.5}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="lg:w-[31.3333%] relative p-[30px] pt-[30px] shadow-[0px_7px_29px_0px_rgba(100,100,111,0.2)]">
          <div className="relative">
            <form className="p-[5px] mx-auto">
              <div className="space-y-[25px]">
                {/* First Name */}
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="First Name *"
                    required
                    className="w-full h-[50px] bg-[#f7f7f7] border-[0.8px] border-[#c4c4c4] text-[#6b6b6b] text-[16px] px-[12px] py-[12px] rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>

                {/* Last Name */}
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Last Name *"
                    required
                    className="w-full h-[50px] bg-[#f7f7f7] border-[0.8px] border-[#c4c4c4] text-[#6b6b6b] text-[16px] px-[12px] py-[12px] rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>

                {/* Email */}
                <div className="relative">
                  <Input
                    type="email"
                    name="email"
                    placeholder="Email Address *"
                    required
                    className="w-full h-[50px] bg-[#f7f7f7] border-[0.8px] border-[#c4c4c4] text-[#6b6b6b] text-[16px] px-[12px] py-[12px] rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>

                {/* Phone */}
                <div className="relative">
                  <Input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    className="w-full h-[50px] bg-[#f7f7f7] border-[0.8px] border-[#c4c4c4] text-[#6b6b6b] text-[16px] px-[12px] py-[12px] rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>

                {/* Message */}
                <div className="relative">
                  <Textarea
                    placeholder="Message *"
                    required
                    className="w-full h-[200px] bg-[#f7f7f7] border-[0.8px] border-[#c4c4c4] text-[#6b6b6b] text-[16px] px-[12px] py-[12px] rounded-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>

                {/* Submit Button */}
                <div className="relative">
                  <Button
                    type="submit"
                    className="w-full bg-law-accent-dark text-law-accent border-law-accent font-outfit text-[22px] h-[50px] hover:bg-law-accent-dark/90 transition-all duration-500 rounded-none"
                  >
                    SUBMIT
                  </Button>
                </div>
              </div>

              {/* Honeypot Field */}
              <div className="absolute invisible" aria-hidden="true">
                <label htmlFor="honeypot-field">
                  If you are a human seeing this field, please leave it empty.
                  <Input
                    type="text"
                    id="honeypot-field"
                    name="honeypot"
                    tabIndex={-1}
                    autoComplete="off"
                    className="bg-white border-[0.8px] border-[#bbbbbb] text-[#4e4e4e] text-[13.3333px] p-[2px] invisible"
                  />
                </label>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
