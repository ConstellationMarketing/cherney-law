import { Star } from "lucide-react";
import type { GoogleReviewsContent } from "@site/lib/cms/testimonialsPageTypes";

interface GoogleReviewsProps {
  content: GoogleReviewsContent;
}

export default function GoogleReviews({ content }: GoogleReviewsProps) {
  // Construct Google Maps embed URL with reviews tab
  // Format: https://www.google.com/maps/embed/v1/place?key=YOUR_KEY&q=place_id:PLACE_ID
  // For public embedding without API key, we'll use the search URL format
  const googleReviewsUrl = `https://www.google.com/search?q=Cherney+Law+Firm%2C+LLC&oq=cherney+law+firm#lrd=${content.placeId},1,,,,`;

  return (
    <div className="bg-white py-[40px] md:py-[60px]">
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[85%]">
        {/* Section Header */}
        <div className="text-center mb-[30px] md:mb-[40px] max-w-[800px] mx-auto">
          <h2 className="font-playfair text-[36px] md:text-[48px] lg:text-[54px] leading-tight text-black pb-[15px]">
            {content.heading}
          </h2>
          {content.subtext && (
            <p className="font-outfit text-[16px] md:text-[18px] leading-[24px] md:leading-[28px] text-black/80">
              {content.subtext}
            </p>
          )}
        </div>

        {/* Google Reviews Embed Container */}
        <div className="max-w-[1200px] mx-auto">
          {/* Reviews Badge/Link */}
          <div className="text-center mb-[30px]">
            <a
              href={googleReviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-law-accent px-[30px] py-[18px] hover:bg-law-accent-dark transition-all duration-300 border-2 border-transparent hover:border-black group"
            >
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-6 h-6 fill-black text-black group-hover:fill-white group-hover:text-white transition-colors duration-300"
                  />
                ))}
              </div>
              <span className="font-outfit text-[18px] md:text-[20px] font-semibold text-black group-hover:text-white transition-colors duration-300">
                Read Our Google Reviews
              </span>
            </a>
          </div>

          {/* Embedded Google Reviews - using iframe with search results */}
          <div className="bg-gray-50 border-2 border-gray-200 p-[20px] md:p-[30px]">
            <div className="aspect-[16/12] md:aspect-[16/9] w-full">
              <iframe
                src={`https://www.google.com/maps/embed/v1/place?key=&q=place_id:${content.placeId.split(':')[1]}`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Cherney Law Firm Google Reviews"
                className="w-full h-full"
              />
            </div>
            <p className="text-center mt-[20px] font-outfit text-[14px] text-gray-600">
              Reviews are provided by Google and reflect genuine client experiences.
              <br />
              <a
                href={googleReviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-law-accent-dark hover:underline font-medium"
              >
                View all reviews on Google →
              </a>
            </p>
          </div>
        </div>

        {/* Alternative: Display invitation to leave a review */}
        <div className="mt-[40px] md:mt-[50px] max-w-[700px] mx-auto text-center bg-law-accent/10 border border-law-accent/30 p-[30px] md:p-[40px]">
          <h3 className="font-playfair text-[26px] md:text-[32px] text-black mb-[15px]">
            Share Your Experience
          </h3>
          <p className="font-outfit text-[15px] md:text-[17px] text-black/80 mb-[20px] leading-[24px] md:leading-[28px]">
            If you've worked with Cherney Law Firm, we'd love to hear about your experience. Your feedback helps us serve our clients better.
          </p>
          <a
            href={googleReviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-law-accent px-[30px] py-[14px] font-outfit text-[16px] md:text-[18px] font-semibold text-black hover:bg-black hover:text-white transition-all duration-300 border-2 border-black"
          >
            Leave a Review on Google
          </a>
        </div>
      </div>
    </div>
  );
}
