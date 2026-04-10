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

interface LegacyGoogleReview {
  author_name?: string;
  profile_photo_url?: string;
  rating?: number;
  text?: string;
  relative_time_description?: string;
}

interface LegacyGooglePlacesResponse {
  status?: string;
  result?: {
    reviews?: LegacyGoogleReview[];
    rating?: number;
    user_ratings_total?: number;
  };
  error_message?: string;
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

let cachedReviews: ReviewsResponse | null = null;
let cacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000;

function getQueryValue(value: unknown): string {
  return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
}

function canBypassCache(req: Parameters<RequestHandler>[0]): boolean {
  const refreshRequested = getQueryValue(req.query.refresh) === "1";
  if (!refreshRequested) return false;

  if (process.env.NODE_ENV !== "production") return true;

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

function formatNewApiResponse(data: GooglePlacesResponse): ReviewsResponse {
  return {
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
}

function formatLegacyApiResponse(data: LegacyGooglePlacesResponse): ReviewsResponse {
  return {
    reviews: (data.result?.reviews || []).map((review) => ({
      authorName: review.author_name || "Anonymous",
      authorPhoto: review.profile_photo_url,
      rating: review.rating || 0,
      text: review.text || "",
      publishTime: review.relative_time_description || "",
    })),
    averageRating: data.result?.rating || 0,
    totalReviews: data.result?.user_ratings_total || 0,
  };
}

async function fetchFromPlacesNew(placeId: string, apiKey: string): Promise<ReviewsResponse> {
  const endpointPath = `/v1/places/${placeId}`;
  const url = `https://places.googleapis.com${endpointPath}?fields=reviews,rating,userRatingCount&key=${apiKey}`;
  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();

    console.error("[google-reviews] Google Places API (New) request failed", {
      status: response.status,
      endpointPath,
      message: getSanitizedErrorMessage(errorText),
    });

    const error = new Error("Google Places API (New) request failed");
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  const data: GooglePlacesResponse = await response.json();
  return formatNewApiResponse(data);
}

async function fetchFromPlacesLegacy(placeId: string, apiKey: string): Promise<ReviewsResponse> {
  const endpointPath = "/maps/api/place/details/json";
  const url = `https://maps.googleapis.com${endpointPath}?place_id=${encodeURIComponent(placeId)}&fields=rating,user_ratings_total,reviews&key=${apiKey}`;
  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[google-reviews] Legacy Place Details request failed", {
      status: response.status,
      endpointPath,
      message: getSanitizedErrorMessage(errorText),
    });
    throw new Error("Google Place Details API request failed");
  }

  const data: LegacyGooglePlacesResponse = await response.json();

  if (data.status !== "OK") {
    console.error("[google-reviews] Legacy Place Details returned non-OK status", {
      status: data.status,
      endpointPath,
      message: getSanitizedErrorMessage(data.error_message || "Unknown legacy API error"),
    });
    throw new Error("Legacy Place Details API returned non-OK status");
  }

  return formatLegacyApiResponse(data);
}

export const handleGoogleReviews: RequestHandler = async (req, res) => {
  try {
    const bypassCache = canBypassCache(req);
    const now = Date.now();

    if (!bypassCache && cachedReviews && now - cacheTime < CACHE_DURATION) {
      return res.json(cachedReviews);
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return res.status(500).json(errorResponse("Google Places API key not configured", "missing_api_key"));
    }

    const placeId = process.env.GOOGLE_PLACES_PLACE_ID;
    if (!placeId) {
      return res.status(500).json(errorResponse("Google Places place ID not configured", "missing_place_id"));
    }

    let formattedResponse: ReviewsResponse;

    try {
      formattedResponse = await fetchFromPlacesNew(placeId, apiKey);
    } catch (error) {
      const status = (error as Error & { status?: number })?.status;
      if (status !== 403) {
        throw error;
      }

      console.warn("[google-reviews] Falling back to legacy Place Details API due to Places API (New) 403");
      formattedResponse = await fetchFromPlacesLegacy(placeId, apiKey);
    }

    cachedReviews = formattedResponse;
    cacheTime = now;

    res.json(formattedResponse);
  } catch (error) {
    console.error("[google-reviews] Unexpected error while fetching reviews", {
      message: error instanceof Error ? error.message : String(error),
    });

    const status = (error as Error & { status?: number })?.status;
    const source: ReviewsErrorSource = status === 403 ? "google_api_forbidden" : "google_api_error";
    const message =
      source === "google_api_forbidden"
        ? "Google Places API access denied"
        : "Failed to fetch reviews from Google";

    res.status(500).json(errorResponse(message, source));
  }
};
