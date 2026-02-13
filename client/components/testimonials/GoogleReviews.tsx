import { Star, ExternalLink, Quote } from "lucide-react";
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

        <div className="max-w-[1100px] mx-auto">
          {/* Google Reviews Badge */}
          <div className="text-center mb-[25px]">
            <a
              href={googleReviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-law-accent px-[30px] py-[16px] hover:bg-law-accent-dark transition-all duration-300 border-2 border-transparent hover:border-black group"
            >
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-6 h-6 fill-black text-black group-hover:fill-white group-hover:text-white transition-colors duration-300"
                  />
                ))}
              </div>
              <span className="font-outfit text-[17px] md:text-[19px] font-semibold text-black group-hover:text-white transition-colors duration-300">
                See All Reviews on Google
              </span>
              <ExternalLink className="w-5 h-5 text-black group-hover:text-white transition-colors duration-300" />
            </a>
          </div>

          {/* Embedded Google Reviews Widget */}
          {content.mapEmbedUrl ? (
            <div className="bg-gray-50 border-2 border-gray-200 p-[16px] md:p-[24px] mb-[30px]">
              <div className="w-full" style={{ minHeight: "500px", height: "600px" }}>
                <iframe
                  src={content.mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Cherney Law Firm - Google Reviews"
                  className="w-full h-full"
                />
              </div>
              <p className="text-center mt-[16px] font-outfit text-[13px] md:text-[14px] text-gray-600">
                Reviews are provided by Google and reflect genuine client experiences.{" "}
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
          ) : (
            // Fallback if no embed URL is provided
            <div className="bg-gray-50 border-2 border-gray-200 p-[40px] md:p-[60px] mb-[30px] text-center">
              <Quote className="w-16 h-16 text-gray-300 mx-auto mb-[20px]" />
              <h3 className="font-playfair text-[24px] md:text-[28px] text-black mb-[12px]">
                Google Reviews Widget
              </h3>
              <p className="font-outfit text-[15px] text-gray-600 mb-[20px] max-w-[500px] mx-auto">
                Add your Google reviews widget embed URL in the CMS to display reviews here.
              </p>
              <a
                href={googleReviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-law-accent px-[25px] py-[12px] font-outfit text-[15px] font-semibold text-black hover:bg-black hover:text-white transition-all duration-300 border-2 border-black"
              >
                View Reviews on Google
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Share Your Experience Section */}
          <div className="bg-law-accent/10 border-2 border-law-accent/30 p-[30px] md:p-[40px] text-center">
            <div className="flex justify-center mb-[15px]">
              <Star className="w-10 h-10 fill-law-accent-dark text-law-accent-dark" />
            </div>
            <h3 className="font-playfair text-[26px] md:text-[32px] text-black mb-[12px]">
              Share Your Experience
            </h3>
            <p className="font-outfit text-[15px] md:text-[17px] text-black/80 mb-[22px] leading-[24px] md:leading-[28px] max-w-[600px] mx-auto">
              If you've worked with Cherney Law Firm, we'd love to hear about your experience. Your feedback helps us serve our clients better.
            </p>
            <a
              href={googleReviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-law-accent px-[30px] py-[14px] font-outfit text-[16px] md:text-[18px] font-semibold text-black hover:bg-black hover:text-white transition-all duration-300 border-2 border-black"
            >
              Leave a Review on Google
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
