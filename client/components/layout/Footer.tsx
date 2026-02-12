import { Facebook, Youtube, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import {
  useGlobalPhone,
  useSiteSettings,
} from "@site/contexts/SiteSettingsContext";

// Custom SVG icons for platforms not in Lucide
function NoloIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        fontFamily="Arial, sans-serif"
      >
        N
      </text>
    </svg>
  );
}

function AvvoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        fontFamily="Arial, sans-serif"
      >
        A
      </text>
    </svg>
  );
}

const SOCIAL_ICONS: Record<
  string,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  facebook: Facebook,
  youtube: Youtube,
  nolo: NoloIcon,
  avvo: AvvoIcon,
};

/** Detect if a string looks like a phone number */
function isPhone(str: string): boolean {
  return /^\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(str.trim());
}

/** Detect if a string looks like an email */
function isEmail(str: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
}

/** Strip non-digits from phone for tel: link */
function phoneToTel(str: string): string {
  return str.replace(/\D/g, "");
}

function LocationColumn({
  title,
  lines,
}: {
  title: string;
  lines: string[];
}) {
  return (
    <div>
      <h3 className="font-outfit text-[18px] md:text-[20px] font-semibold text-white mb-3">
        {title}
      </h3>
      <ul className="font-outfit text-[14px] md:text-[15px] font-light leading-[1.7] text-gray-300 space-y-0.5">
        {lines.map((line, i) => {
          const trimmed = line.trim();
          if (isEmail(trimmed)) {
            return (
              <li key={i}>
                <a
                  href={`mailto:${trimmed}`}
                  className="hover:text-law-accent transition-colors"
                >
                  {trimmed}
                </a>
              </li>
            );
          }
          if (isPhone(trimmed)) {
            return (
              <li key={i}>
                <a
                  href={`tel:${phoneToTel(trimmed)}`}
                  className="hover:text-law-accent transition-colors"
                >
                  {trimmed}
                </a>
              </li>
            );
          }
          if (trimmed.toLowerCase() === "download vcard") {
            return (
              <li key={i}>
                <span className="text-law-accent cursor-pointer hover:underline">
                  {trimmed}
                </span>
              </li>
            );
          }
          return <li key={i}>{trimmed}</li>;
        })}
      </ul>
    </div>
  );
}

export default function Footer() {
  const { phoneDisplay, phoneLabel } = useGlobalPhone();
  const { settings } = useSiteSettings();

  const enabledSocials = settings.socialLinks.filter((s) => s.enabled && s.url);

  return (
    <footer className="bg-law-dark relative">
      {/* Top Section: Tagline and Call Box */}
      <div className="max-w-[2560px] mx-auto w-[95%] py-[20px] md:py-[27px] flex flex-col lg:flex-row lg:items-center gap-8">
        {/* Left: Tagline */}
        <div className="lg:w-[75%]">
          <p className="font-playfair text-[clamp(1.1rem,2.8vw,26px)] leading-snug font-light text-white">
            {settings.footerTagline ||
              "Bankruptcy should be pursued along with the counsel and representation of an experienced bankruptcy attorney with an outstanding attorney profile."}
          </p>
        </div>

        {/* Right: Call Us Box */}
        <div className="lg:w-[25%]">
          <a
            href={`tel:${settings.phoneNumber || phoneToTel(phoneDisplay)}`}
            className="block bg-law-accent p-[8px] w-full ml-auto cursor-pointer transition-all duration-300 hover:bg-law-accent-dark group no-underline"
          >
            <div className="table w-full mx-auto max-w-full flex-row-reverse">
              <div className="table-cell w-[32px] leading-[0] mb-[30px]">
                <span className="m-auto">
                  <span className="inline-block bg-white p-[15px] text-black group-hover:bg-black transition-colors duration-300">
                    <Phone
                      className="w-[31px] h-[31px] [&>*]:fill-none [&>*]:stroke-black group-hover:[&>*]:stroke-white transition-colors duration-300"
                      strokeWidth={1.5}
                    />
                  </span>
                </span>
              </div>
              <div className="table-cell align-top pl-[15px]">
                <h4 className="font-outfit text-[16px] md:text-[18px] leading-tight text-black pb-[10px] group-hover:text-white transition-colors duration-300">
                  {phoneLabel}
                </h4>
                <div>
                  <p className="font-outfit text-[28px] md:text-[40px] leading-tight md:leading-[44px] text-black group-hover:text-white transition-colors duration-300 whitespace-nowrap">
                    {phoneDisplay}
                  </p>
                </div>
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Office Locations + Logo Section */}
      <div className="border-t border-b border-[#838383] max-w-[2560px] mx-auto w-[95%] py-[24px] md:py-[32px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {/* Location Columns */}
          {settings.footerLocations.map((loc, i) => (
            <LocationColumn key={i} title={loc.title} lines={loc.lines} />
          ))}

          {/* Logo Column - vertically centered */}
          <div className="flex items-center justify-center lg:justify-center">
            <Link to="/">
              <img
                src={settings.logoUrl}
                alt={settings.logoAlt}
                className="w-[160px] md:w-[200px] max-w-full h-auto object-contain"
              />
            </Link>
          </div>
        </div>
      </div>

      {/* Social Media Section */}
      <div className="max-w-[1080px] mx-auto w-[80%] py-[20px]">
        <ul className="text-center leading-[26px]">
          {enabledSocials.length > 0
            ? enabledSocials.map((social, idx) => {
                const IconComponent =
                  SOCIAL_ICONS[social.platform.toLowerCase()] || Facebook;
                const displayName =
                  social.platform.charAt(0).toUpperCase() +
                  social.platform.slice(1);
                return (
                  <li key={social.platform} className="inline-block mb-[8px]">
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center justify-center w-[52px] h-[52px] bg-law-card border border-law-border ${
                        idx < enabledSocials.length - 1 ? "mr-[8px]" : ""
                      } transition-all duration-300 hover:bg-law-accent hover:border-law-accent group`}
                      title={`Follow on ${displayName}`}
                    >
                      <IconComponent className="w-6 h-6 text-white group-hover:text-black transition-colors duration-300" />
                      <span className="sr-only">Follow on {displayName}</span>
                    </a>
                  </li>
                );
              })
            : [
                {
                  Icon: Facebook,
                  name: "Facebook",
                  url: "https://facebook.com",
                },
                { Icon: NoloIcon, name: "Nolo", url: "https://nolo.com" },
                {
                  Icon: Youtube,
                  name: "Youtube",
                  url: "https://youtube.com",
                },
                { Icon: AvvoIcon, name: "Avvo", url: "https://avvo.com" },
              ].map((social, idx, arr) => (
                <li key={social.name} className="inline-block mb-[8px]">
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center justify-center w-[52px] h-[52px] bg-law-card border border-law-border ${
                      idx < arr.length - 1 ? "mr-[8px]" : ""
                    } transition-all duration-300 hover:bg-law-accent hover:border-law-accent group`}
                    title={`Follow on ${social.name}`}
                  >
                    <social.Icon className="w-6 h-6 text-white group-hover:text-black transition-colors duration-300" />
                    <span className="sr-only">Follow on {social.name}</span>
                  </a>
                </li>
              ))}
        </ul>
      </div>

      {/* Copyright + Bottom Links Section */}
      <div className="border-t border-[#838383] max-w-[2560px] mx-auto w-full py-[10px] px-[30px]">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <p className="font-outfit text-[14px] md:text-[16px] font-light leading-[27px] text-white text-center">
            {settings.copyrightText ||
              `Copyright \u00A9 2017-${new Date().getFullYear()} | All Rights Reserved`}
          </p>
          {settings.footerBottomLinks.length > 0 && (
            <div className="flex items-center gap-3">
              {settings.footerBottomLinks.map((link, i) => (
                <span key={i} className="flex items-center gap-3">
                  <span className="text-gray-500 hidden sm:inline">|</span>
                  {link.href ? (
                    <Link
                      to={link.href}
                      className="font-outfit text-[14px] md:text-[16px] font-light text-gray-400 hover:text-law-accent transition-colors"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <span className="font-outfit text-[14px] md:text-[16px] font-light text-gray-400">
                      {link.label}
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
