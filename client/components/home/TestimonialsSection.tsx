import { useEffect, useMemo, useState } from "react";
import { Helmet } from "@site/lib/helmet";
import { ChevronLeft, ChevronRight, Star, User } from "lucide-react";
import type { TestimonialsContent } from "@site/lib/cms/homePageTypes";

interface TestimonialsSectionProps {
  content?: TestimonialsContent & { headingLevel?: 1 | 2 | 3 | 4 };
}

interface Review {
  authorName: string;
  authorPhoto?: string;
  rating: number;
  text: string;
  publishTime: string;
}

type ReviewsErrorSource =
  | "missing_api_key"
  | "missing_place_id"
  | "google_api_forbidden"
  | "google_api_error"
  | "unexpected_error";

interface ReviewsData {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  error?: string;
  source?: ReviewsErrorSource;
}

type ReviewerNameDisplay = "full" | "firstName" | "initials" | "hidden";

const REVIEWS_PER_SLIDE = 3;
const REVIEW_PREVIEW_WORD_COUNT = 28;

const defaultContent: TestimonialsContent = {
  sectionLabel: "– Testimonials",
  heading: "Inspiring client success stories that drive change.",
  googlePlaceId: "0x88f513c2103ad111:0xf0c853b13f4aa2fc",
  minimumRating: 0,
  reviewStartNumber: 1,
  showReviewerName: true,
  reviewerNameDisplay: "full",
  items: [],
};

function groupReviews(items: Review[], groupSize: number) {
  const groups: Review[][] = [];

  for (let index = 0; index < items.length; index += groupSize) {
    groups.push(items.slice(index, index + groupSize));
  }

  return groups;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[...Array(5)].map((_, index) => (
        <Star
          key={index}
          className={`h-3.5 w-3.5 ${
            index < Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

function getErrorMessage(data: ReviewsData): string {
  if (!data.error) return "Unable to load Google reviews right now.";

  switch (data.source) {
    case "missing_api_key":
      return "Google reviews are temporarily unavailable due to API configuration.";
    case "missing_place_id":
      return "Google reviews are temporarily unavailable due to place ID configuration.";
    case "google_api_forbidden":
      return "Google reviews are unavailable because Google Places API access is denied.";
    default:
      return "Google reviews are temporarily unavailable. Please try again shortly.";
  }
}

function getReviewerNameDisplayMode(
  content: TestimonialsContent,
): ReviewerNameDisplay {
  if (content.reviewerNameDisplay) {
    return content.reviewerNameDisplay;
  }

  return content.showReviewerName === false ? "hidden" : "full";
}

function formatReviewerName(
  authorName: string,
  displayMode: ReviewerNameDisplay,
): string {
  const normalizedName = authorName.trim();
  if (!normalizedName || displayMode === "hidden") return "";

  const parts = normalizedName.split(/\s+/).filter(Boolean);
  if (!parts.length) return "";

  if (displayMode === "firstName") {
    return parts[0];
  }

  if (displayMode === "initials") {
    return parts.map((part) => part.charAt(0).toUpperCase()).join(".") + ".";
  }

  return normalizedName;
}

function getExcerpt(text: string, maxWords: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);

  if (words.length <= maxWords) {
    return { text, isTruncated: false };
  }

  return {
    text: `${words.slice(0, maxWords).join(" ")}…`,
    isTruncated: true,
  };
}

function ReviewCard({
  review,
  displayMode,
}: {
  review: Review;
  displayMode: ReviewerNameDisplay;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const reviewName = formatReviewerName(review.authorName, displayMode);
  const excerpt = useMemo(
    () => getExcerpt(review.text, REVIEW_PREVIEW_WORD_COUNT),
    [review.text],
  );
  const reviewText = isExpanded || !excerpt.isTruncated ? review.text : excerpt.text;

  return (
    <article className="flex h-full flex-col justify-between border border-[#d8d8d8] bg-white bg-[url('/images/backgrounds/quote-bg.png')] bg-[length:56px] bg-no-repeat bg-[position:left_18px_top_18px] p-6 shadow-sm">
      <div>
        <StarRating rating={review.rating} />
        <p className="mt-4 font-outfit text-[16px] leading-[1.7] text-black">
          {reviewText}
        </p>
        {excerpt.isTruncated && (
          <button
            type="button"
            onClick={() => setIsExpanded((expanded) => !expanded)}
            className="mt-3 font-outfit text-[13px] font-semibold uppercase tracking-[0.08em] text-law-accent transition-colors duration-200 hover:text-black"
          >
            {isExpanded ? "Read less" : "Read more"}
          </button>
        )}
      </div>

      <div className="mt-6 border-t border-black/10 pt-4">
        <div className="flex items-center gap-3">
          {review.authorPhoto ? (
            <img
              src={review.authorPhoto}
              alt={review.authorName}
              className="h-10 w-10 rounded-full border border-gray-200 object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-law-accent/30 bg-law-accent/20">
              <User className="h-4 w-4 text-law-accent-dark" />
            </div>
          )}
          <div>
            {reviewName && (
              <p className="font-outfit text-[16px] font-semibold text-black">
                {reviewName}
              </p>
            )}
            {review.publishTime && (
              <p className="mt-1 font-outfit text-[13px] text-black/65">
                {review.publishTime}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function TestimonialsSection({
  content,
}: TestimonialsSectionProps) {
  const data = { ...defaultContent, ...content };
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const minimumRating = Number(data.minimumRating || 0);
  const reviewStartIndex = Math.max(0, Number(data.reviewStartNumber || 1) - 1);
  const reviewerNameDisplay = getReviewerNameDisplayMode(data);
  const googleReviewsUrl = `https://www.google.com/search?q=Cherney+Law+Firm%2C+LLC#lrd=${data.googlePlaceId || defaultContent.googlePlaceId},1,,,,`;

  useEffect(() => {
    async function fetchReviews() {
      try {
        const endpoints = [
          "/api/google-reviews",
          "/.netlify/functions/api/google-reviews",
        ];

        let lastFailureData: ReviewsData | null = null;

        for (const endpoint of endpoints) {
          const response = await fetch(endpoint);
          const rawBody = await response.text();
          let parsedData: ReviewsData | null = null;

          try {
            parsedData = rawBody ? (JSON.parse(rawBody) as ReviewsData) : null;
          } catch {
            parsedData = null;
          }

          if (!response.ok || !parsedData) {
            lastFailureData =
              parsedData ?? {
                reviews: [],
                averageRating: 0,
                totalReviews: 0,
                error: "Failed to load reviews",
                source: "google_api_error",
              };
            continue;
          }

          setReviewsData(parsedData);
          return;
        }

        setReviewsData(
          lastFailureData ?? {
            reviews: [],
            averageRating: 0,
            totalReviews: 0,
            error: "Failed to load reviews",
            source: "google_api_error",
          },
        );
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setReviewsData({
          reviews: [],
          averageRating: 0,
          totalReviews: 0,
          error: "Failed to load reviews",
          source: "google_api_error",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, []);

  const filteredReviews = useMemo(() => {
    const reviews = reviewsData?.reviews || [];
    const ratingFilteredReviews = minimumRating > 0
      ? reviews.filter((review) => review.rating >= minimumRating)
      : reviews;

    return ratingFilteredReviews.slice(reviewStartIndex);
  }, [minimumRating, reviewStartIndex, reviewsData?.reviews]);

  const testimonialPages = useMemo(
    () => groupReviews(filteredReviews, REVIEWS_PER_SLIDE),
    [filteredReviews],
  );
  const hasMultiplePages = testimonialPages.length > 1;

  useEffect(() => {
    setActiveSlide(0);
  }, [minimumRating, reviewStartIndex, filteredReviews.length]);

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

  const HeadingTag = `h${data.headingLevel || 2}` as keyof JSX.IntrinsicElements;
  const reviewSchema =
    reviewsData && reviewsData.averageRating > 0
      ? {
          "@context": "https://schema.org",
          "@type": "LegalService",
          name: "Cherney Law Firm, LLC",
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviewsData.averageRating.toFixed(1),
            reviewCount: reviewsData.totalReviews,
            bestRating: 5,
            worstRating: 1,
          },
          review: filteredReviews.slice(0, 3).map((review) => ({
            "@type": "Review",
            author: {
              "@type": "Person",
              name: review.authorName || "Google reviewer",
            },
            reviewRating: {
              "@type": "Rating",
              ratingValue: review.rating,
              bestRating: 5,
              worstRating: 1,
            },
            reviewBody: review.text,
          })),
        }
      : null;

  return (
    <div className="bg-white py-[18px] md:py-[34px]">
      {reviewSchema && (
        <Helmet>
          <script type="application/ld+json">{JSON.stringify(reviewSchema)}</script>
        </Helmet>
      )}
      <div className="max-w-[1080px] mx-auto w-[95%] md:w-[85%] lg:w-[80%] py-[12px] md:py-[18px]">
        <div className="text-center mb-[8px]">
          <HeadingTag className="font-outfit text-[18px] md:text-[22px] leading-tight md:leading-[32px] text-law-accent">
            {data.sectionLabel}
          </HeadingTag>
        </div>
        <div className="text-center">
          <p className="font-playfair text-[30px] md:text-[42px] lg:text-[48px] leading-tight text-black pb-[8px]">
            {data.heading}
          </p>
        </div>

        {!loading && reviewsData && reviewsData.averageRating > 0 && (
          <div className="mt-4 text-center">
            <div className="flex items-center justify-center gap-3">
              <StarRating rating={reviewsData.averageRating} />
              <span className="font-outfit text-[16px] font-semibold text-black">
                {reviewsData.averageRating.toFixed(1)} Google rating
              </span>
            </div>
            <p className="mt-1 font-outfit text-[13px] text-black/60">
              Based on {reviewsData.totalReviews} Google reviews
            </p>
          </div>
        )}
      </div>

      <div className="max-w-[1320px] mx-auto w-[92%] md:w-[86%] lg:w-[80%] py-[18px]">
        {loading ? (
          <div className="py-14 text-center">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-law-accent border-r-transparent" />
            <p className="mt-4 font-outfit text-[15px] text-black/60">
              Loading Google reviews...
            </p>
          </div>
        ) : reviewsData?.error ? (
          <div className="border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-outfit text-[15px] text-red-800">
              {getErrorMessage(reviewsData)}
            </p>
          </div>
        ) : testimonialPages.length > 0 ? (
          <>
            <div className="relative group overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${activeSlide * 100}%)` }}
              >
                {testimonialPages.map((page, pageIndex) => (
                  <div key={pageIndex} className="w-full shrink-0">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {page.map((review, itemIndex) => (
                        <ReviewCard
                          key={`${pageIndex}-${itemIndex}-${review.authorName}-${review.publishTime}`}
                          review={review}
                          displayMode={reviewerNameDisplay}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {hasMultiplePages && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-2 top-1/2 z-[100] -translate-y-1/2 cursor-pointer bg-white/90 p-2 text-[rgb(95,99,104)] opacity-0 shadow-sm transition-opacity duration-200 hover:bg-white group-hover:opacity-100"
                    aria-label="Previous testimonials"
                  >
                    <ChevronLeft className="w-7 h-7" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-2 top-1/2 z-[100] -translate-y-1/2 cursor-pointer bg-white/90 p-2 text-[rgb(95,99,104)] opacity-0 shadow-sm transition-opacity duration-200 hover:bg-white group-hover:opacity-100"
                    aria-label="Next testimonials"
                  >
                    <ChevronRight className="w-7 h-7" />
                  </button>
                </>
              )}
            </div>

            {hasMultiplePages && (
              <div className="mt-5 flex justify-center gap-2">
                {testimonialPages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveSlide(index)}
                    className="inline-flex min-h-10 min-w-10 cursor-pointer items-center justify-center"
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

            <div className="mt-6 text-center">
              <a
                href={googleReviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center border border-transparent bg-[#161715] px-6 py-3 font-outfit text-[14px] font-semibold uppercase tracking-[0.08em] text-white transition-all duration-300 hover:-translate-y-1 hover:border-[#161715] hover:bg-black hover:shadow-[0_16px_35px_rgba(22,23,21,0.28)]"
              >
                See all reviews on Google
              </a>
            </div>
          </>
        ) : (
          <div className="border border-gray-200 bg-gray-50 p-6 text-center">
            <p className="font-outfit text-[15px] text-gray-600">
              No Google reviews match the current rating filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
