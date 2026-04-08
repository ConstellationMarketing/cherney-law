import type { PracticeAreaContentSectionItem } from "@site/lib/cms/practiceAreaDetailPageTypes";
import { useGlobalPhone } from "@site/contexts/SiteSettingsContext";
import { Phone, Calendar } from "lucide-react";
import CallBox from "@site/components/shared/CallBox";
import { Link } from "react-router-dom";

interface Props {
  section: PracticeAreaContentSectionItem;
  index: number;
}

export default function PracticeAreaDetailContentSection({ section, index }: Props) {
  const { phoneDisplay, phoneLabel, phoneNumber } = useGlobalPhone();
  const isEven = index % 2 === 0;
  const bgClass = isEven ? "bg-white" : "bg-gray-50";
  const imageLeft = section.imagePosition === "left";

  const hasImage = !!section.image;
  const hasCTAs = section.showCTAs !== false;
  const hasRightColumn = hasImage;

  const ctaContent = hasCTAs ? (
    <div className="space-y-4 w-full">
      <a
        href={`tel:${phoneNumber}`}
        data-dni-phone="primary"
        className="block"
      >
        <CallBox
          icon={Phone}
          title={phoneLabel}
          subtitle={phoneDisplay}
        />
      </a>
      <Link to="/contact/" className="block">
        <CallBox
          icon={Calendar}
          title="Schedule Now"
          subtitle="Free Consultation"
        />
      </Link>
    </div>
  ) : null;

  return (
    <div className={`${bgClass} py-[30px] md:py-[50px]`}>
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
        <div
          className={`flex flex-col ${hasRightColumn ? (imageLeft ? "lg:flex-row-reverse" : "lg:flex-row") : ""} gap-8 lg:gap-[4%]`}
        >
          {/* Content column */}
          <div className={hasRightColumn ? "flex-1 lg:w-[60%]" : "w-full"}>
            <div
              className="font-outfit text-[16px] md:text-[18px] leading-[26px] md:leading-[30px] text-black prose prose-sm max-w-none [&_a]:text-law-accent [&_a]:underline [&_h2]:font-playfair [&_h2]:text-[28px] [&_h2]:md:text-[36px] [&_h2]:leading-tight [&_h2]:mb-4 [&_h3]:font-playfair [&_h3]:text-[22px] [&_h3]:md:text-[28px] [&_h3]:leading-tight [&_h3]:mb-3 [&_p]:mb-4 [&_ul]:mb-4 [&_ol]:mb-4"
              dangerouslySetInnerHTML={{ __html: section.body }}
            />
          </div>

          {/* Image + CTA column */}
          {hasRightColumn && (
            <div className="lg:w-[36%] space-y-6">
              <img
                src={section.image}
                alt={section.imageAlt || ""}
                className="w-full h-auto object-cover"
                loading="lazy"
              />

              {ctaContent}
            </div>
          )}
        </div>

        {!hasImage && hasCTAs && (
          <div className="mt-8 flex justify-center">
            <div className="w-full max-w-[420px]">
              {ctaContent}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
