import Seo from "@site/components/Seo";
import Layout from "@site/components/layout/Layout";
import OfficeTabs from "@site/components/contact/OfficeTabs";
import ContactFormNew from "@site/components/contact/ContactFormNew";
import { useContactContent } from "@site/hooks/useContactContent";

export default function ContactPage() {
  const { content } = useContactContent();

  return (
    <Layout>
      <Seo
        title="Contact Us"
        description="Get in touch with our experienced legal team. Free consultation available. We're here to help with your bankruptcy needs."
      />

      {/* Hero Section */}
      <div className="bg-law-accent pt-[30px] md:pt-[54px] pb-[30px] md:pb-[54px]">
        <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%]">
          <div className="text-center max-w-[900px] mx-auto">
            <h1 className="font-outfit text-[18px] md:text-[24px] leading-tight md:leading-[36px] text-white mb-[10px]">
              {content.hero.sectionLabel}
            </h1>
            <p className="font-playfair text-[clamp(2.5rem,7vw,68.8px)] font-light leading-[1.2] text-black mb-[20px] md:mb-[30px]">
              <span
                dangerouslySetInnerHTML={{
                  __html: content.hero.tagline.replace(
                    /(Talk)/g,
                    '<span class="text-white">$1</span>'
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

      {/* Two-Column: Office Tabs + Contact Form */}
      <div className="bg-white py-[40px] md:py-[60px]">
        <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[85%]">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-[30px] lg:gap-[40px] xl:gap-[60px] items-start">
            {/* Left Column — Office Tabs */}
            <div className="min-w-0">
              <OfficeTabs offices={content.offices} />
            </div>

            {/* Right Column — Contact Form (sticky) */}
            <div className="lg:sticky lg:top-[20px]">
              <ContactFormNew settings={content.formSettings} />
            </div>
          </div>
        </div>
      </div>

      {/* Process Section */}
      <div className="bg-white py-[40px] md:py-[60px] border-t border-gray-100">
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
            {content.process.steps.map((item, index) => (
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
    </Layout>
  );
}
