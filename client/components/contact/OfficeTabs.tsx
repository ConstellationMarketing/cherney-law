import { useState } from "react";
import { MapPin, Phone, Navigation } from "lucide-react";
import type { OfficeTab } from "@site/lib/cms/contactPageTypes";

interface OfficeTabsProps {
  offices: OfficeTab[];
}

export default function OfficeTabs({ offices }: OfficeTabsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!offices.length) return null;

  const active = offices[activeIndex];

  return (
    <div>
      {/* Tab Buttons */}
      <div className="flex flex-wrap gap-0 border-b-2 border-gray-200 mb-[24px] md:mb-[32px]">
        {offices.map((office, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`font-outfit text-[14px] md:text-[16px] px-[16px] md:px-[24px] py-[12px] md:py-[16px] transition-all duration-300 border-b-3 -mb-[2px] whitespace-nowrap ${
              activeIndex === index
                ? "border-law-accent text-black font-semibold bg-law-accent/5"
                : "border-transparent text-black/60 hover:text-black hover:border-gray-300"
            }`}
          >
            {office.name}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-[24px] md:space-y-[32px]">
        {/* Heading */}
        <h2 className="font-playfair text-[26px] md:text-[34px] lg:text-[38px] leading-tight text-black">
          {active.heading}
        </h2>

        {/* Body text */}
        <div
          className="font-outfit text-[15px] md:text-[17px] leading-[26px] md:leading-[30px] text-black/80 prose prose-lg max-w-none [&_p]:mb-4 [&_a]:text-law-accent [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: active.content }}
        />

        {/* Address + Map */}
        <OfficeAddress address={active.address} mapEmbedUrl={active.mapEmbedUrl} />

        {/* Phone */}
        <OfficePhone phone={active.phone} phoneDisplay={active.phoneDisplay} />

        {/* Directions */}
        {active.directions && (
          <OfficeDirections directions={active.directions} />
        )}
      </div>
    </div>
  );
}

function OfficeAddress({ address, mapEmbedUrl }: { address: string; mapEmbedUrl: string }) {
  return (
    <div className="bg-gray-50 border border-gray-200 p-[20px] md:p-[24px]">
      <div className="flex items-start gap-3 mb-[16px]">
        <MapPin className="w-5 h-5 text-law-accent-dark mt-0.5 shrink-0" strokeWidth={2} />
        <p className="font-outfit text-[16px] md:text-[18px] text-black font-medium">
          {address}
        </p>
      </div>
      {mapEmbedUrl && (
        <iframe
          src={mapEmbedUrl}
          width="100%"
          height="280"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-[220px] md:h-[280px] border-0"
          title={`Map for ${address}`}
        />
      )}
    </div>
  );
}

function OfficePhone({ phone, phoneDisplay }: { phone: string; phoneDisplay: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-law-accent p-[10px]">
        <Phone className="w-5 h-5 text-black" strokeWidth={2} />
      </div>
      <a
        href={`tel:${phone}`}
        className="font-outfit text-[20px] md:text-[24px] text-black font-semibold hover:text-law-accent-dark transition-colors"
      >
        {phoneDisplay}
      </a>
    </div>
  );
}

function OfficeDirections({ directions }: { directions: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 p-[16px] md:p-[20px] bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Navigation className="w-5 h-5 text-law-accent-dark shrink-0" strokeWidth={2} />
          <span className="font-outfit text-[16px] md:text-[18px] text-black font-medium">
            Driving Directions
          </span>
        </div>
        <span className="font-outfit text-[14px] text-law-accent-dark">
          {isOpen ? "Hide" : "Show"}
        </span>
      </button>
      {isOpen && (
        <div
          className="p-[16px] md:p-[24px] font-outfit text-[14px] md:text-[15px] leading-[24px] md:leading-[26px] text-black/80 prose max-w-none [&_h3]:font-outfit [&_h3]:text-[16px] [&_h3]:md:text-[18px] [&_h3]:font-semibold [&_h3]:text-black [&_h3]:mt-5 [&_h3]:mb-2 [&_p]:mb-2 [&_br]:leading-[24px]"
          dangerouslySetInnerHTML={{ __html: directions }}
        />
      )}
    </div>
  );
}
