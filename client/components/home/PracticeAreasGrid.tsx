import { Link } from "react-router-dom";
import type { PracticeAreaItem } from "@site/lib/cms/homePageTypes";
import { getOptimizedBackgroundImage } from "@site/lib/imageOptimizer";

interface PracticeAreasGridProps {
  areas?: PracticeAreaItem[];
}

const defaultAreas: PracticeAreaItem[] = [
  {
    title: "Practice Area",
    description: "Brief overview of this practice area.",
    image: "/images/practice-areas/personal-injury.jpg",
    href: "/practice-areas/",
  },
  {
    title: "Practice Area",
    description: "Brief overview of this practice area.",
    image: "/images/practice-areas/medical-malpractice.jpg",
    href: "/practice-areas/",
  },
  {
    title: "Practice Area",
    description: "Brief overview of this practice area.",
    image: "/images/practice-areas/workers-compensation.jpg",
    href: "/practice-areas/",
  },
  {
    title: "Practice Area",
    description: "Brief overview of this practice area.",
    image: "/images/practice-areas/wrongful-death.jpg",
    href: "/practice-areas/",
  },
];

export default function PracticeAreasGrid({ areas }: PracticeAreasGridProps) {
  const practiceAreas = areas?.length ? areas : defaultAreas;

  return (
    <div className="bg-[#161715]">
      <div className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
          {practiceAreas.map((area, index) => {
            const href = area.href || area.link || "/practice-areas/";

            return (
              <Link
                key={index}
                to={href}
                className="relative min-h-[400px] lg:min-h-[500px] overflow-hidden group"
                style={{
                  backgroundImage: getOptimizedBackgroundImage(area.image, {
                    width: 700,
                    quality: 75,
                    resize: "cover",
                  }),
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/80 transition-all duration-500 group-hover:from-law-accent-dark/60 group-hover:via-law-accent-dark/70 group-hover:to-law-dark/95"></div>

                <div className="relative flex h-full items-end p-5 md:p-6 lg:p-7">
                  <div className="max-w-[92%] translate-y-0 transition-transform duration-300 group-hover:-translate-y-1">
                    <h3 className="font-outfit text-[30px] md:text-[34px] leading-tight text-white font-normal transition-colors duration-300 group-hover:text-law-accent">
                      {area.title}
                    </h3>
                    {area.description && (
                      <p className="mt-3 font-outfit text-[18px] leading-[28px] text-white/85 max-w-[28ch] transition-colors duration-300 group-hover:text-white">
                        {area.description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
