import type { FeatureBox } from "@site/lib/cms/aboutPageTypes";

interface AboutFeatureBoxesProps {
  featureBoxes: FeatureBox[];
}

export default function AboutFeatureBoxes({ featureBoxes }: AboutFeatureBoxesProps) {
  if (featureBoxes.length === 0) return null;

  return (
    <div className="bg-law-accent py-[40px] md:py-[60px] w-full">
      <div className="max-w-[2560px] mx-auto w-[95%] flex justify-center">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 max-w-[1200px]">
          {featureBoxes.map((item, index) => (
            <div
              key={index}
              className="bg-[#161715] p-[25px] md:p-[30px] flex items-start gap-4 flex-1"
            >
              <div className="flex-shrink-0 mt-1">
                <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-law-accent flex items-center justify-center">
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5 text-black"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="font-outfit text-[16px] md:text-[18px] text-white font-normal leading-tight">
                {item.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
