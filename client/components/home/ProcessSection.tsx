import type { ProcessContent, ProcessStep } from "@/lib/homePageTypes";

interface ProcessSectionProps {
  content?: ProcessContent;
}

const defaultContent: ProcessContent = {
  sectionLabel: "– Process",
  headingLine1: "Get Started Easily.",
  headingLine2: "Take a Look at The Steps",
  steps: [
    {
      number: "01",
      title: "Step 1",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut.",
    },
    {
      number: "02",
      title: "Step 2",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut.",
    },
    {
      number: "03",
      title: "Step 3",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut.",
    },
  ],
};

export default function ProcessSection({ content }: ProcessSectionProps) {
  const data = content || defaultContent;
  const steps = data.steps || defaultContent.steps;

  return (
    <div className="bg-law-dark pt-[30px] pb-[60px]">
      {/* Header Section */}
      <div className="max-w-[1080px] mx-auto w-[80%] py-[27px]">
        <div className="text-center mb-[10px]">
          <p className="font-outfit text-[24px] leading-[36px] text-law-accent">
            {data.sectionLabel}
          </p>
        </div>
        <div className="text-center">
          <h2 className="font-playfair text-[28px] md:text-[40px] lg:text-[54px] leading-tight md:leading-[48.6px] text-white pb-[10px]">
            {data.headingLine1}
          </h2>
          <h2 className="font-playfair text-[28px] md:text-[40px] lg:text-[54px] leading-tight md:leading-[48.6px] text-white pb-[10px]">
            {data.headingLine2}
          </h2>
        </div>
      </div>

      {/* Steps Grid */}
      <div className="max-w-[1600px] mx-auto w-[80%] flex flex-col md:flex-row gap-[3%]">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`md:w-[31.3333%] bg-law-card p-[20px] ${
              index < steps.length - 1 ? "mb-4 md:mb-0" : ""
            }`}
          >
            {/* Step Number */}
            <div className="mb-[20px]">
              <p className="font-outfit text-[24px] leading-[36px] text-law-accent">
                {step.number}
              </p>
            </div>

            {/* Step Content */}
            <div className="mb-[30px]">
              <h3 className="font-outfit text-[32px] leading-[32px] text-white pb-[10px]">
                {step.title}
              </h3>
              <p className="font-outfit text-[20px] leading-[30px] text-white">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
