import Seo from "@site/components/Seo";
import Layout from "@site/components/layout/Layout";
import ContactForm from "@site/components/home/ContactForm";
import CallBox from "@site/components/shared/CallBox";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Calendar,
  type LucideIcon,
} from "lucide-react";
import { useContactContent } from "@site/hooks/useContactContent";
import { useGlobalPhone } from "@site/contexts/SiteSettingsContext";

// Icon mapping for contact methods
const iconMap: Record<string, LucideIcon> = {
  Phone,
  Mail,
  MapPin,
  Clock,
};

export default function ContactPage() {
  const { content } = useContactContent();
  const { phoneDisplay, phoneLabel } = useGlobalPhone();

  // Map contact methods from CMS content with icon components
  const contactMethods = content.contactMethods.methods.map((method) => ({
    icon: iconMap[method.icon] || Phone,
    title: method.title,
    detail: method.detail,
    subdDetail: method.subDetail,
  }));

  // Map office hours from CMS content
  const officeHours = content.officeHours.items;

  // Map process steps from CMS content
  const whatToExpect = content.process.steps;

  return (
    <Layout>
      <Seo
        title="Contact Us"
        description="Get in touch with our experienced legal team. Free consultation available 24/7. We're here to help with your legal needs."
      />

      {/* Hero Section */}
      <div className="bg-law-accent pt-[30px] md:pt-[54px] pb-[30px] md:pb-[54px]">
        <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%]">
          <div className="text-center max-w-[900px] mx-auto">
            {/* H1 Title - Section Label */}
            <h1 className="font-outfit text-[18px] md:text-[24px] leading-tight md:leading-[36px] text-white mb-[10px]">
              {content.hero.sectionLabel}
            </h1>
            {/* Tagline - styled as large text but not H1 */}
            <p className="font-playfair text-[clamp(2.5rem,7vw,68.8px)] font-light leading-[1.2] text-black mb-[20px] md:mb-[30px]">
              <span
                dangerouslySetInnerHTML={{
                  __html: content.hero.tagline.replace(
                    /(Talk)/g,
                    '<span class="text-white">$1</span>',
                  ),
                }}
              />
            </p>
            <p className="font-outfit text-[16px] md:text-[20px] leading-[24px] md:leading-[30px] text-black/80">
              {content.hero.description}
            </p>
          </div>
        </div>
      </div>

      {/* Contact Methods Section */}
      <div className="bg-white py-[40px] md:py-[60px]">
        <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[85%]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <div
                  key={index}
                  className="bg-law-card border border-law-border p-[30px] md:p-[40px] text-center group hover:border-law-accent transition-all duration-300"
                >
                  <div className="flex justify-center mb-[20px]">
                    <div className="bg-law-accent p-[20px] inline-block transition-all duration-300 group-hover:bg-white group-hover:scale-110">
                      <Icon
                        className="w-[35px] h-[35px] md:w-[40px] md:h-[40px] text-black"
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>
                  <h3 className="font-playfair text-[24px] md:text-[28px] leading-tight text-law-accent mb-[15px]">
                    {method.title}
                  </h3>
                  <p className="font-outfit text-[18px] md:text-[20px] text-white mb-[8px]">
                    {method.detail}
                  </p>
                  <p className="font-outfit text-[14px] md:text-[16px] text-white/70">
                    {method.subdDetail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contact Form & Office Hours Section */}
      <div className="bg-law-dark py-[40px] md:py-[60px]">
        <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[85%]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-[8%]">
            {/* Left Side - Contact Form */}
            <div>
              <div className="mb-[20px] md:mb-[30px]">
                <h2 className="font-playfair text-[32px] md:text-[40px] leading-tight text-white pb-[10px]">
                  {content.form.heading}
                </h2>
                {content.form.subtext && (
                  <p className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-white/80">
                    {content.form.subtext}
                  </p>
                )}
              </div>
              <ContactForm />
            </div>

            {/* Right Side - Office Hours & Additional Info */}
            <div className="space-y-[30px] md:space-y-[40px]">
              {/* Office Hours */}
              <div className="bg-law-card border border-law-border p-[30px] md:p-[40px]">
                <div className="flex items-center gap-3 mb-[20px]">
                  <div className="bg-law-accent p-[15px]">
                    <Clock
                      className="w-[30px] h-[30px] text-black"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="font-playfair text-[24px] md:text-[28px] leading-tight text-white">
                    {content.officeHours.heading}
                  </h3>
                </div>
                <div className="space-y-[15px]">
                  {officeHours.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center pb-[15px] border-b border-law-border/50 last:border-0 last:pb-0"
                    >
                      <span className="font-outfit text-[16px] md:text-[18px] text-white/80">
                        {item.day}
                      </span>
                      <span className="font-outfit text-[16px] md:text-[18px] text-law-accent font-medium">
                        {item.hours}
                      </span>
                    </div>
                  ))}
                </div>
                {content.officeHours.note && (
                  <div className="mt-[25px] pt-[25px] border-t border-law-border/50">
                    <p className="font-outfit text-[14px] md:text-[16px] text-white/70 leading-[22px] md:leading-[24px]">
                      {content.officeHours.note}
                    </p>
                  </div>
                )}
              </div>

              {/* Call to Action Boxes */}
              <div className="space-y-[20px]">
                <CallBox
                  icon={Phone}
                  title={phoneLabel}
                  subtitle={phoneDisplay}
                  className="w-full max-w-none"
                />
                <CallBox
                  icon={Calendar}
                  title={content.cta.secondaryButton.label}
                  subtitle={content.cta.secondaryButton.sublabel}
                  className="w-full max-w-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What to Expect Section */}
      <div className="bg-white py-[40px] md:py-[60px]">
        <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
          <div className="text-center mb-[30px] md:mb-[50px]">
            <div className="mb-[10px]">
              <p className="font-outfit text-[18px] md:text-[24px] leading-tight md:leading-[36px] text-[rgb(107,141,12)]">
                {content.process.sectionLabel}
              </p>
            </div>
            <h2 className="font-playfair text-[32px] md:text-[48px] lg:text-[54px] leading-tight md:leading-[54px] text-black">
              {content.process.heading}
            </h2>
            {content.process.subtitle && (
              <p className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-black/80 mt-[15px]">
                {content.process.subtitle}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {whatToExpect.map((item, index) => (
              <div key={index} className="text-center">
                <div className="mb-[20px] flex justify-center">
                  <div className="w-[60px] h-[60px] md:w-[70px] md:h-[70px] bg-law-accent flex items-center justify-center">
                    <span className="font-playfair text-[32px] md:text-[40px] text-black font-bold">
                      {item.number}
                    </span>
                  </div>
                </div>
                <h3 className="font-playfair text-[22px] md:text-[26px] leading-tight text-black pb-[12px]">
                  {item.title}
                </h3>
                <p className="font-outfit text-[14px] md:text-[16px] leading-[22px] md:leading-[24px] text-black/80">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-law-dark py-[40px] md:py-[60px]">
        <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%]">
          <div className="text-center mb-[30px] md:mb-[40px]">
            <h2 className="font-playfair text-[32px] md:text-[48px] leading-tight text-white pb-[10px]">
              {content.visitOffice.heading}
            </h2>
            {content.visitOffice.subtext && (
              <p className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-white/80">
                {content.visitOffice.subtext}
              </p>
            )}
          </div>

          <div className="bg-law-card border border-law-border p-[20px] md:p-[30px]">
            <iframe
              src={content.visitOffice.mapEmbedUrl}
              width="100%"
              height="450"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-[350px] md:h-[450px]"
              title="Office Location"
            ></iframe>
          </div>
        </div>
      </div>
    </Layout>
  );
}
