import { RequestHandler } from "express";

interface GoogleReview {
  authorAttribution?: {
    displayName: string;
    photoUri?: string;
  };
  rating: number;
  text?: {
    text: string;
  };
  relativePublishTimeDescription?: string;
}

interface GooglePlacesResponse {
  reviews?: GoogleReview[];
  rating?: number;
  userRatingCount?: number;
}

export type ReviewsErrorSource =
  | "missing_api_key"
  | "missing_place_id"
  | "google_api_forbidden"
  | "google_api_error"
  | "unexpected_error";

export interface ReviewsResponse {
  reviews: Array<{
    authorName: string;
    authorPhoto?: string;
    rating: number;
    text: string;
    publishTime: string;
  }>;
  averageRating: number;
  totalReviews: number;
  error?: string;
  source?: ReviewsErrorSource;
}

// Cache for reviews (1 hour)
let cachedReviews: ReviewsResponse | null = null;
let cacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

function getQueryValue(value: unknown): string {
  return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
}

function canBypassCache(req: Parameters<RequestHandler>[0]): boolean {
  const refreshRequested = getQueryValue(req.query.refresh) === "1";
  if (!refreshRequested) {
    return false;
  }

  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const refreshKey = process.env.GOOGLE_REVIEWS_REFRESH_KEY;
  const providedRefreshKey = getQueryValue(req.query.refreshKey);

  return Boolean(refreshKey && providedRefreshKey === refreshKey);
}

function getSanitizedErrorMessage(errorText: string): string {
  const compact = errorText.replace(/\s+/g, " ").trim();
  return compact.length > 200 ? `${compact.slice(0, 200)}...` : compact;
}

function errorResponse(error: string, source: ReviewsErrorSource): ReviewsResponse {
  return {
    reviews: [],
    averageRating: 0,
    totalReviews: 0,
    error,
    source,
  };
}

export const handleGoogleReviews: RequestHandler = async (req, res) => {
  try {
    const bypassCache = canBypassCache(req);

    // Check cache
    const now = Date.now();
    if (!bypassCache && cachedReviews && now - cacheTime < CACHE_DURATION) {
      return res.json(cachedReviews);
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json(errorResponse("Google Places API key not configured", "missing_api_key"));
    }

    const placeId = process.env.GOOGLE_PLACES_PLACE_ID;
    if (!placeId) {
      return res
        .status(500)
        .json(errorResponse("Google Places place ID not configured", "missing_place_id"));
    }

    const endpointPath = `/v1/places/${placeId}`;
    const url = `https://places.googleapis.com${endpointPath}?fields=reviews,rating,userRatingCount&key=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[google-reviews] Google Places API request failed", {
        status: response.status,
        endpointPath,
        message: getSanitizedErrorMessage(errorText),
      });

      const source = response.status === 403 ? "google_api_forbidden" : "google_api_error";
      const errorMessage =
        response.status === 403
          ? "Google Places API access denied"
          : "Failed to fetch reviews from Google";

      return res.status(500).json(errorResponse(errorMessage, source));
    }

    const data: GooglePlacesResponse = await response.json();

    const formattedResponse: ReviewsResponse = {
      reviews: (data.reviews || []).map((review) => ({
        authorName: review.authorAttribution?.displayName || "Anonymous",
        authorPhoto: review.authorAttribution?.photoUri,
        rating: review.rating,
        text: review.text?.text || "",
        publishTime: review.relativePublishTimeDescription || "",
      })),
      averageRating: data.rating || 0,
      totalReviews: data.userRatingCount || 0,
    };

    // Cache only successful responses
    cachedReviews = formattedResponse;
    cacheTime = now;

    res.json(formattedResponse);
  } catch (error) {
    console.error("[google-reviews] Unexpected error while fetching reviews", {
      message: error instanceof Error ? error.message : String(error),
    });

    res
      .status(500)
      .json(errorResponse("An unexpected error occurred", "unexpected_error"));
  }
};
