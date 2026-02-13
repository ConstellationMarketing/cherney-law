import { Star, ExternalLink, MessageCircle } from "lucide-react";
import type { GoogleReviewsContent } from "@site/lib/cms/testimonialsPageTypes";

interface GoogleReviewsProps {
  content: GoogleReviewsContent;
}

export default function GoogleReviews({ content }: GoogleReviewsProps) {
  // Construct Google reviews URL
  const googleReviewsUrl = `https://www.google.com/search?q=Cherney+Law+Firm%2C+LLC&oq=cherney+law+firm#lrd=${content.placeId},1,,,,`;

  return (
    <div className="bg-white py-[40px] md:py-[60px]">
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[85%]">
        {/* Section Header */}
        <div className="text-center mb-[40px] md:mb-[50px] max-w-[800px] mx-auto">
          <h2 className="font-playfair text-[36px] md:text-[48px] lg:text-[54px] leading-tight text-black pb-[15px]">
            {content.heading}
          </h2>
          {content.subtext && (
            <p className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-black/80">
              {content.subtext}
            </p>
          )}
        </div>

        <div className="max-w-[900px] mx-auto">
          {/* Main Reviews CTA Card */}
          <div className="bg-law-accent border-4 border-black p-[30px] md:p-[50px] text-center mb-[30px] md:mb-[40px]">
            {/* 5 Stars */}
            <div className="flex justify-center gap-2 mb-[20px]">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-10 h-10 md:w-12 md:h-12 fill-black text-black"
                />
              ))}
            </div>

            <h3 className="font-playfair text-[28px] md:text-[36px] text-black mb-[15px] leading-tight">
              See What Our Clients Are Saying
            </h3>
            <p className="font-outfit text-[16px] md:text-[18px] text-black/80 mb-[25px] leading-[26px] md:leading-[30px]">
              Real reviews from real clients who found financial freedom through bankruptcy. Read their stories on Google.
            </p>

            <a
              href={googleReviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-black px-[35px] py-[16px] hover:bg-white transition-all duration-300 border-2 border-black group"
            >
              <span className="font-outfit text-[18px] md:text-[20px] font-semibold text-white group-hover:text-black transition-colors duration-300">
                View Our Google Reviews
              </span>
              <ExternalLink className="w-5 h-5 text-white group-hover:text-black transition-colors duration-300" />
            </a>
          </div>

          {/* Two Column Layout - View Reviews + Leave Review */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* View Reviews Card */}
            <a
              href={googleReviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-50 border-2 border-gray-200 p-[30px] hover:border-law-accent hover:bg-law-accent/5 transition-all duration-300 group"
            >
              <div className="flex flex-col items-center text-center h-full">
                <div className="bg-law-accent p-[18px] mb-[20px] group-hover:bg-black transition-colors duration-300">
                  <MessageCircle className="w-8 h-8 text-black group-hover:text-white transition-colors duration-300" />
                </div>
                <h4 className="font-playfair text-[24px] md:text-[28px] text-black mb-[12px]">
                  Read Reviews
                </h4>
                <p className="font-outfit text-[14px] md:text-[15px] text-black/70 leading-[22px] md:leading-[24px] flex-1">
                  See honest feedback from clients we've helped achieve financial freedom.
                </p>
                <div className="flex items-center gap-2 mt-[20px] font-outfit text-[15px] font-medium text-law-accent-dark group-hover:text-black">
                  View on Google
                  <ExternalLink className="w-4 h-4" />
                </div>
              </div>
            </a>

            {/* Leave Review Card */}
            <a
              href={googleReviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-law-accent/10 border-2 border-law-accent/30 p-[30px] hover:bg-law-accent hover:border-black transition-all duration-300 group"
            >
              <div className="flex flex-col items-center text-center h-full">
                <div className="bg-law-accent p-[18px] mb-[20px] group-hover:bg-black transition-colors duration-300">
                  <Star className="w-8 h-8 fill-black text-black group-hover:fill-white group-hover:text-white transition-colors duration-300" />
                </div>
                <h4 className="font-playfair text-[24px] md:text-[28px] text-black mb-[12px]">
                  Share Your Experience
                </h4>
                <p className="font-outfit text-[14px] md:text-[15px] text-black/70 leading-[22px] md:leading-[24px] flex-1">
                  If you've worked with us, we'd love to hear about your experience. Your feedback matters.
                </p>
                <div className="flex items-center gap-2 mt-[20px] font-outfit text-[15px] font-medium text-law-accent-dark group-hover:text-black">
                  Leave a Review
                  <ExternalLink className="w-4 h-4" />
                </div>
              </div>
            </a>
          </div>

          {/* Trust Badge */}
          <div className="mt-[30px] text-center">
            <p className="font-outfit text-[13px] md:text-[14px] text-gray-500">
              Reviews are provided by Google and reflect genuine client experiences
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
