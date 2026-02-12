import {
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Twitter,
  Phone,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useGlobalPhone, useSiteSettings } from "@site/contexts/SiteSettingsContext";

// Map platform names to Lucide icon components
const SOCIAL_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
  twitter: Twitter,
  x: Twitter,
};

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
          <div>
            <p className="font-playfair text-[clamp(2rem,6vw,59.136px)] leading-tight md:leading-[70.9632px] font-light text-white">
              <span className="text-law-accent">Your rights. Our mission.</span>
              <br />
              Backed by integrity and relentless representation.
            </p>
          </div>
        </div>

        {/* Right: Call Us Box */}
        <div className="lg:w-[25%]">
          <div className="bg-law-accent p-[8px] w-full ml-auto cursor-pointer transition-all duration-300 hover:bg-law-accent-dark group">
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
          </div>
        </div>
      </div>

      {/* Footer Links Section */}
      <div className="border-t border-b border-[#838383] max-w-[2560px] mx-auto w-[95%] py-[20px] md:py-[27px] flex flex-col lg:flex-row gap-6 md:gap-8 lg:gap-[3%]">
        {/* Logo Column */}
        <div className="lg:w-[20%] lg:mr-[3%]">
          <Link to="/" className="block">
            <img
              src={settings.logoUrl}
              alt={settings.logoAlt}
              className="w-[200px] max-w-full"
              width={200}
              height={33}
            />
          </Link>
        </div>

        {/* Resources Column */}
        <div className="lg:w-[20%] lg:mr-[3%]">
          <div className="font-outfit text-[18px] md:text-[24px] font-light leading-tight md:leading-[36px] text-white">
            <h3 className="font-outfit text-[28px] md:text-[36px] leading-tight md:leading-[36px] text-white pb-[10px]">
              Resources
            </h3>
            <ul className="text-[18px] md:text-[24px] font-light leading-tight md:leading-[36px] space-y-1">
              {[...settings.navigationItems]
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((item) => (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className="hover:text-law-accent transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        </div>

        {/* Practice Areas Column */}
        <div className="lg:w-[20%] lg:mr-[3%]">
          <div className="font-outfit text-[18px] md:text-[24px] font-light leading-tight md:leading-[36px] text-white">
            <h3 className="font-outfit text-[28px] md:text-[36px] leading-tight md:leading-[36px] text-white pb-[10px]">
              Practice Areas
            </h3>
            {settings.footerPracticeLinks.length > 0 ? (
              <ul className="text-[18px] md:text-[24px] font-light leading-tight md:leading-[36px] space-y-1">
                {settings.footerPracticeLinks.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <Link
                        to={link.href}
                        className="hover:text-law-accent transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <span>{link.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[18px] md:text-[24px] font-light leading-tight md:leading-[36px]">
                Practice Area
                <br />
                Practice Area
                <br />
                Practice Area
                <br />
                Practice Area
              </p>
            )}
          </div>
        </div>

        {/* Map Column */}
        <div className="lg:w-[40%] max-w-[900px]">
          <div className="relative">
            <iframe
              src={settings.mapEmbedUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d212271.35861186526!2d-84.42020704999999!3d33.7673845!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88f5045d6993098d%3A0x66fede2f990b630b!2sAtlanta%2C%20GA%2C%20USA!5e0!3m2!1sen!2srs!4v1750395791543!5m2!1sen!2srs"}
              width="100%"
              height="250"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-[250px]"
              title="Office Location"
            ></iframe>
          </div>
        </div>
      </div>

      {/* Social Media Section */}
      <div className="max-w-[1080px] mx-auto w-[80%] py-[20px]">
        <div className="w-full">
          <ul className="text-center leading-[26px]">
            {enabledSocials.length > 0
              ? enabledSocials.map((social, idx) => {
                  const IconComponent =
                    SOCIAL_ICONS[social.platform.toLowerCase()] || Twitter;
                  const displayName =
                    social.platform.charAt(0).toUpperCase() +
                    social.platform.slice(1);
                  return (
                    <li key={social.platform} className="inline-block mb-[8px]">
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-block w-[52px] h-[52px] bg-law-card border border-law-border ${
                          idx < enabledSocials.length - 1 ? "mr-[8px]" : ""
                        } align-middle transition-all duration-300 hover:bg-law-accent hover:border-law-accent group flex items-center justify-center`}
                        title={`Follow on ${displayName}`}
                      >
                        <IconComponent className="w-6 h-6 text-white group-hover:text-black transition-colors duration-300" />
                        <span className="sr-only">
                          Follow on {displayName}
                        </span>
                      </a>
                    </li>
                  );
                })
              : /* Fallback: show default social icons if none configured */
                [
                  { Icon: Facebook, name: "Facebook", url: "https://facebook.com" },
                  { Icon: Instagram, name: "Instagram", url: "https://instagram.com" },
                  { Icon: Youtube, name: "Youtube", url: "https://youtube.com" },
                  { Icon: Linkedin, name: "LinkedIn", url: "https://linkedin.com" },
                  { Icon: Twitter, name: "X", url: "https://x.com" },
                ].map((social, idx, arr) => (
                  <li key={social.name} className="inline-block mb-[8px]">
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-block w-[52px] h-[52px] bg-law-card border border-law-border ${
                        idx < arr.length - 1 ? "mr-[8px]" : ""
                      } align-middle transition-all duration-300 hover:bg-law-accent hover:border-law-accent group flex items-center justify-center`}
                      title={`Follow on ${social.name}`}
                    >
                      <social.Icon className="w-6 h-6 text-white group-hover:text-black transition-colors duration-300" />
                      <span className="sr-only">Follow on {social.name}</span>
                    </a>
                  </li>
                ))}
          </ul>
        </div>
      </div>

      {/* Copyright Section */}
      <div className="border-t border-[#838383] max-w-[2560px] mx-auto w-full py-[10px] px-[30px]">
        <div className="w-full mx-auto my-auto">
          <div className="font-outfit text-[18px] font-light leading-[27px] text-white text-center">
            <p>
              {settings.copyrightText ||
                `Copyright \u00A9 2017-${new Date().getFullYear()} | Constellation Marketing | All Rights Reserved`}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
