import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface PracticeAreaCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  image: string;
  link?: string;
}

export default function PracticeAreaCard({
  icon: Icon,
  title,
  description,
  image,
  link = "/contact",
}: PracticeAreaCardProps) {
  return (
    <Link
      to={link}
      className="relative min-h-[450px] overflow-hidden group bg-law-card border border-law-border transition-all duration-300 hover:border-law-accent"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
        style={{
          backgroundImage: `url(${image})`,
        }}
      ></div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/90 transition-all duration-500 group-hover:from-law-accent-dark/40 group-hover:via-law-accent-dark/70 group-hover:to-law-dark/95"></div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-[25px] md:p-[30px]">
        {/* Icon */}
        <div className="flex justify-start">
          <div className="bg-law-accent p-[15px] inline-block transition-all duration-300 group-hover:bg-white">
            <Icon
              className="w-[30px] h-[30px] md:w-[35px] md:h-[35px] text-black"
              strokeWidth={1.5}
            />
          </div>
        </div>

        {/* Title and Description */}
        <div>
          <h3 className="font-playfair text-[28px] md:text-[32px] leading-tight text-white pb-[15px] transition-all duration-300 group-hover:text-law-accent">
            {title}
          </h3>
          <p className="font-outfit text-[14px] md:text-[16px] leading-[22px] md:leading-[24px] text-white/90 mb-[15px]">
            {description}
          </p>

          {/* Learn More Link */}
          <div className="flex items-center gap-2 text-law-accent group-hover:text-white transition-colors duration-300">
            <span className="font-outfit text-[14px] md:text-[16px]">
              Learn More
            </span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}
