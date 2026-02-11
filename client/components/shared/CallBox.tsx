import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface CallBoxProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  link?: string;
  className?: string;
  variant?: "light" | "dark"; // light = black text on light bg, dark = white text on dark bg
}

export default function CallBox({
  icon: Icon,
  title,
  subtitle,
  link,
  className = "",
  variant = "light",
}: CallBoxProps) {
  // Text colors based on variant - only affects text, not icons
  const textColor = variant === "dark" ? "text-white" : "text-black";
  const textHoverColor =
    variant === "dark"
      ? ""
      : "group-hover:text-white transition-colors duration-300";

  const content = (
    <div
      className={`bg-law-accent p-[8px] w-full md:w-[340px] cursor-pointer transition-all duration-300 hover:bg-law-accent-dark group ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="bg-white p-[15px] mt-1 flex items-center justify-center group-hover:bg-black transition-colors duration-300">
          <Icon
            className="w-8 h-8 [&>*]:fill-none [&>*]:stroke-black group-hover:[&>*]:stroke-white transition-colors duration-300"
            strokeWidth={1.5}
          />
        </div>
        <div className="flex-1">
          <h4
            className={`font-outfit text-[16px] md:text-[18px] leading-tight ${textColor} ${textHoverColor} pb-[10px]`}
          >
            {title}
          </h4>
          <p
            className={`font-outfit text-[18px] md:text-[24px] ${textColor} ${textHoverColor} leading-none whitespace-nowrap`}
          >
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );

  if (link) {
    return <Link to={link}>{content}</Link>;
  }

  return content;
}
