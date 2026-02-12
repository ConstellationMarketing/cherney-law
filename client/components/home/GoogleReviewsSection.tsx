import type {
  GoogleReviewsContent,
  GoogleReviewItem,
} from "@site/lib/cms/homePageTypes";

interface GoogleReviewsSectionProps {
  content?: GoogleReviewsContent;
}

const defaultContent: GoogleReviewsContent = {
  sectionLabel: "– Google Reviews",
  heading: "Real Voices, Real Trust: Our Google Reviews",
  description:
    "Our clients share their stories and insights about working with us. Dive into their experiences to understand how we prioritize your legal success.",
  reviews: [
    {
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi . Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor. consectetur adipiscing elit, sed do eiusmod tempor.",
      author: "Lorem Ipsum",
      ratingImage:
        "https://design.constellationdev.com/wp-content/uploads/2025/06/Group-2-min.png",
    },
    {
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi . Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor. consectetur adipiscing elit, sed do eiusmod tempor.",
      author: "Lorem Ipsum",
      ratingImage:
        "https://design.constellationdev.com/wp-content/uploads/2025/06/Group-2-min.png",
    },
    {
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi . Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor. consectetur adipiscing elit, sed do eiusmod tempor.",
      author: "Lorem Ipsum",
      ratingImage:
        "https://design.constellationdev.com/wp-content/uploads/2025/06/Group-2-min.png",
    },
    {
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi . Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor. consectetur adipiscing elit, sed do eiusmod tempor.",
      author: "Lorem Ipsum",
      ratingImage:
        "https://design.constellationdev.com/wp-content/uploads/2025/06/Group-2-min.png",
    },
    {
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi . Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor. consectetur adipiscing elit, sed do eiusmod tempor.",
      author: "Lorem Ipsum",
      ratingImage:
        "https://design.constellationdev.com/wp-content/uploads/2025/06/Group-2-min.png",
    },
    {
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi . Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor. consectetur adipiscing elit, sed do eiusmod tempor.",
      author: "Lorem Ipsum",
      ratingImage:
        "https://design.constellationdev.com/wp-content/uploads/2025/06/Group-2-min.png",
    },
  ],
};

export default function GoogleReviewsSection({
  content,
}: GoogleReviewsSectionProps) {
  const data = content || defaultContent;
  const reviews = data.reviews || defaultContent.reviews;

  return (
    <div className="bg-white pt-[54px]">
      {/* Header Section */}
      <div className="max-w-[1080px] mx-auto w-[80%] py-[27px]">
        <div className="text-center mb-[10px]">
          <p className="font-outfit text-[24px] leading-[36px] text-law-accent">
            {data.sectionLabel}
          </p>
        </div>
        <div className="text-center">
          <h2 className="font-playfair text-[28px] md:text-[40px] lg:text-[54px] leading-tight md:leading-[54px] text-black pb-[10px]">
            {data.heading}
          </h2>
          <p className="font-outfit text-[24px] leading-[36px] text-black text-center">
            {data.description}
          </p>
        </div>
      </div>

      {/* First Row - 3 Reviews */}
      <div className="max-w-[1600px] mx-auto w-[80%] flex flex-col md:flex-row gap-0 mb-[30px]">
        {reviews.slice(0, 3).map((review, index) => (
          <div
            key={index}
            className={`md:w-[31.3333%] border-[0.8px] border-[rgb(224,224,224)] p-[20px] ${
              index < 2 ? "md:mr-[3%] mb-4 md:mb-0" : ""
            }`}
          >
            <div className="mb-[30px]">
              <div className="pb-[10px]">
                <img
                  src={review.ratingImage}
                  alt="5 stars"
                  width={186}
                  height={34}
                  loading="lazy"
                  className="max-w-full"
                />
              </div>
              <p className="font-outfit text-[22px] leading-[33px] text-black pb-[22px]">
                {review.text}
              </p>
              <div className="font-outfit text-[22px] leading-[33px] text-black flex items-center justify-between">
                <strong className="font-bold">{review.author}</strong>
                <img
                  src="/images/logos/google-icon.png"
                  alt="Google"
                  loading="lazy"
                  className="max-w-full"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Second Row - 3 Reviews */}
      <div className="max-w-[1600px] mx-auto w-[80%] flex flex-col md:flex-row gap-0">
        {reviews.slice(3, 6).map((review, index) => (
          <div
            key={index}
            className={`md:w-[31.3333%] border-[0.8px] border-[rgb(224,224,224)] p-[20px] ${
              index < 2 ? "md:mr-[3%] mb-4 md:mb-0" : ""
            }`}
          >
            <div className="mb-[30px]">
              <div className="pb-[10px]">
                <img
                  src={review.ratingImage}
                  alt="5 stars"
                  width={186}
                  height={34}
                  loading="lazy"
                  className="max-w-full"
                />
              </div>
              <p className="font-outfit text-[22px] leading-[33px] text-black pb-[22px]">
                {review.text}
              </p>
              <div className="font-outfit text-[22px] leading-[33px] text-black flex items-center justify-between">
                <strong className="font-bold">{review.author}</strong>
                <img
                  src="/images/logos/google-icon.png"
                  alt="Google"
                  loading="lazy"
                  className="max-w-full"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
