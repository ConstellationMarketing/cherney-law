import { useState, useEffect } from "react";
import { Star, ExternalLink, User } from "lucide-react";
import type { GoogleReviewsContent } from "@site/lib/cms/testimonialsPageTypes";

interface Review {
  authorName: string;
  authorPhoto?: string;
  rating: number;
  text: string;
  publishTime: string;
}

interface ReviewsData {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  error?: string;
}

interface GoogleReviewsProps {
  content: GoogleReviewsContent;
}

// Star Rating Component
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

export default function GoogleReviews({ content }: GoogleReviewsProps) {
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Construct Google reviews URL
  const googleReviewsUrl = `https://www.google.com/search?q=Cherney+Law+Firm%2C+LLC&oq=cherney+law+firm#lrd=${content.placeId},1,,,,`;

  useEffect(() => {
    async function fetchReviews() {
      try {
        const response = await fetch("/api/google-reviews");
        const data = await response.json();
        setReviewsData(data);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setReviewsData({
          reviews: [],
          averageRating: 0,
          totalReviews: 0,
          error: "Failed to load reviews"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, []);

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

        <div className="max-w-[1200px] mx-auto">
          {/* Overall Rating Header */}
          {!loading && reviewsData && reviewsData.averageRating > 0 && (
            <div className="text-center mb-[35px]">
              <div className="flex justify-center items-center gap-3 mb-[12px]">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-8 h-8 ${
                        i < Math.round(reviewsData.averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-playfair text-[28px] md:text-[36px] font-semibold text-black">
                  {reviewsData.averageRating.toFixed(1)}
                </span>
              </div>
              <p className="font-outfit text-[15px] md:text-[17px] text-black/70">
                Based on {reviewsData.totalReviews} Google reviews
              </p>
            </div>
          )}

          {/* See All Reviews Button */}
          <div className="text-center mb-[35px]">
            <a
              href={googleReviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-law-accent px-[30px] py-[16px] hover:bg-law-accent-dark transition-all duration-300 border-2 border-transparent hover:border-black group"
            >
              <span className="font-outfit text-[17px] md:text-[19px] font-semibold text-black group-hover:text-white transition-colors duration-300">
                See All Reviews on Google
              </span>
              <ExternalLink className="w-5 h-5 text-black group-hover:text-white transition-colors duration-300" />
            </a>
          </div>

          {/* Reviews Grid */}
          {loading ? (
            <div className="text-center py-[60px]">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-law-accent border-r-transparent"></div>
              <p className="font-outfit text-[16px] text-black/60 mt-[20px]">
                Loading reviews...
              </p>
            </div>
          ) : reviewsData?.error ? (
            <div className="bg-red-50 border-2 border-red-200 p-[40px] text-center mb-[30px]">
              <p className="font-outfit text-[16px] text-red-800 mb-[20px]">
                {reviewsData.error}
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
          ) : reviewsData && reviewsData.reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[25px] mb-[40px]">
              {reviewsData.reviews.map((review, index) => (
                <div
                  key={index}
                  className="bg-white border-2 border-black p-[25px] hover:shadow-lg transition-shadow duration-300"
                >
                  {/* Reviewer Info */}
                  <div className="flex items-center gap-3 mb-[15px]">
                    {review.authorPhoto ? (
                      <img
                        src={review.authorPhoto}
                        alt={review.authorName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-law-accent/20 flex items-center justify-center border-2 border-law-accent/30">
                        <User className="w-6 h-6 text-law-accent-dark" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-outfit text-[16px] font-semibold text-black">
                        {review.authorName}
                      </h4>
                      <StarRating rating={review.rating} />
                    </div>
                  </div>

                  {/* Review Text */}
                  <p className="font-outfit text-[14px] md:text-[15px] leading-[22px] md:leading-[24px] text-black/80 mb-[12px]">
                    {review.text}
                  </p>

                  {/* Publish Time */}
                  {review.publishTime && (
                    <p className="font-outfit text-[13px] text-black/50">
                      {review.publishTime}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-gray-200 p-[40px] text-center mb-[30px]">
              <p className="font-outfit text-[16px] text-gray-600 mb-[20px]">
                No reviews available at this time.
              </p>
              <a
                href={googleReviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-law-accent px-[25px] py-[12px] font-outfit text-[15px] font-semibold text-black hover:bg-black hover:text-white transition-all duration-300 border-2 border-black"
              >
                View on Google
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
