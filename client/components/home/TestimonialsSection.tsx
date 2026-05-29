import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { TestimonialsContent, TestimonialItem } from "@site/lib/cms/homePageTypes";
import { getOptimizedImageUrl } from "@site/lib/imageOptimizer";

interface TestimonialsSectionProps {
  content?: TestimonialsContent & { headingLevel?: 1 | 2 | 3 | 4 };
}

const defaultContent: TestimonialsContent = {
  sectionLabel: "– Testimonials",
  heading: "Inspiring client success stories that drive change.",
  backgroundImage: "/images/backgrounds/testimonials-bg.jpg",
  items: [
    {
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi.",
      author: "Sharon",
      ratingImage: "/images/logos/rating-stars.png",
    },
    {
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi.",
      author: "Sharon",
      ratingImage: "/images/logos/rating-stars.png",
    },
    {
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi.",
      author: "Sharon",
      ratingImage: "/images/logos/rating-stars.png",
    },
  ],
};

function getTestimonialText(item: TestimonialItem) {
  return item.text || item.quote || "";
}

function groupTestimonials(items: TestimonialItem[], groupSize: number) {
  const groups: TestimonialItem[][] = [];

  for (let index = 0; index < items.length; index += groupSize) {
    groups.push(items.slice(index, index + groupSize));
  }

  return groups;
}

export default function TestimonialsSection({
  content,
}: TestimonialsSectionProps) {
  const data = content || defaultContent;
  const testimonials = data.items?.length ? data.items : defaultContent.items;
  const testimonialPages = useMemo(
    () => groupTestimonials(testimonials, 3),
    [testimonials],
  );
  const [activeSlide, setActiveSlide] = useState(0);
  const hasMultiplePages = testimonialPages.length > 1;

  const nextSlide = () => {
    if (!hasMultiplePages) return;
    setActiveSlide((prev) => (prev + 1) % testimonialPages.length);
  };

  const prevSlide = () => {
    if (!hasMultiplePages) return;
    setActiveSlide(
      (prev) => (prev - 1 + testimonialPages.length) % testimonialPages.length,
    );
  };

  const goToSlide = (index: number) => {
    setActiveSlide(index);
  };

  return (
    <div className="bg-white py-[30px] md:py-[54px]">
      <div className="max-w-[1080px] mx-auto w-[95%] md:w-[85%] lg:w-[80%] py-[20px] md:py-[27px]">
        <div className="text-center mb-[10px]">
          {(() => {
            const HeadingTag = `h${(content as any)?.headingLevel || 2}` as keyof JSX.IntrinsicElements;
            return (
              <HeadingTag className="font-outfit text-[18px] md:text-[24px] leading-tight md:leading-[36px] text-law-accent">
                {data.sectionLabel}
              </HeadingTag>
            );
          })()}
        </div>
        <div className="text-center">
          <p className="font-playfair text-[32px] md:text-[48px] lg:text-[54px] leading-tight md:leading-[54px] text-black pb-[10px]">
            {data.heading}
          </p>
        </div>
      </div>

      <div className="max-w-[1360px] mx-auto w-[90%] md:w-[85%] lg:w-[80%] py-[27px]">
        <div className="relative group overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
          >
            {testimonialPages.map((page, pageIndex) => (
              <div key={pageIndex} className="w-full shrink-0">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {page.map((testimonial, itemIndex) => {
                    const testimonialText = getTestimonialText(testimonial);

                    return (
                      <article
                        key={`${pageIndex}-${itemIndex}-${testimonial.author}`}
                        className="flex h-full flex-col justify-between border border-[#d8d8d8] bg-white bg-[url('/images/backgrounds/quote-bg.png')] bg-no-repeat bg-[position:left_24px_top_24px] p-8 shadow-sm"
                      >
                        <div>
                          <p className="font-outfit text-[19px] leading-[1.65] text-black">
                            {testimonialText}
                          </p>
                        </div>

                        <div className="mt-8 border-t border-black/10 pt-5">
                          {testimonial.ratingImage && (
                            <img
                              src={getOptimizedImageUrl(testimonial.ratingImage, {
                                width: 200,
                                quality: 80,
                                resize: "contain",
                              })}
                              alt="Rating"
                              width={186}
                              height={34}
                              loading="lazy"
                              className="mb-3 max-w-full"
                            />
                          )}
                          <p className="font-outfit text-[20px] font-semibold text-black">
                            {testimonial.author}
                          </p>
                          {testimonial.location && (
                            <p className="mt-1 font-outfit text-[15px] text-black/70">
                              {testimonial.location}
                            </p>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {hasMultiplePages && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-[rgb(95,99,104)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[100] cursor-pointer bg-white/90 hover:bg-white p-2 shadow-sm"
                aria-label="Previous testimonials"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[rgb(95,99,104)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[100] cursor-pointer bg-white/90 hover:bg-white p-2 shadow-sm"
                aria-label="Next testimonials"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}
        </div>

        {hasMultiplePages && (
          <div className="mt-6 flex justify-center gap-2">
            {testimonialPages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center cursor-pointer"
                aria-label={`Go to testimonial page ${index + 1}`}
              >
                <span
                  className={`block h-2.5 w-2.5 border border-law-accent bg-law-accent-dark transition-opacity ${
                    index === activeSlide ? "opacity-100" : "opacity-50"
                  } hover:opacity-100`}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
