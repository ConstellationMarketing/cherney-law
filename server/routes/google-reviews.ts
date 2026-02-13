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
}

// Cache for reviews (1 hour)
let cachedReviews: ReviewsResponse | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export const handleGoogleReviews: RequestHandler = async (req, res) => {
  try {
    // Check cache
    const now = Date.now();
    if (cachedReviews && (now - cacheTime) < CACHE_DURATION) {
      return res.json(cachedReviews);
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        reviews: [],
        averageRating: 0,
        totalReviews: 0,
        error: "Google Places API key not configured"
      });
    }

    // Place ID converted from hex format 0x88f513c2103ad111:0xf0c853b13f4aa2fc
    const placeId = "ChIJEa0QIMA1X4gR_KJK_xOI8PA";
    
    // Google Places API (New) endpoint
    const url = `https://places.googleapis.com/v1/places/${placeId}?fields=reviews,rating,userRatingCount&key=${apiKey}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Places API error:", errorText);
      return res.status(500).json({
        reviews: [],
        averageRating: 0,
        totalReviews: 0,
        error: "Failed to fetch reviews from Google"
      });
    }

    const data: GooglePlacesResponse = await response.json();

    // Format the response
    const formattedResponse: ReviewsResponse = {
      reviews: (data.reviews || []).map(review => ({
        authorName: review.authorAttribution?.displayName || "Anonymous",
        authorPhoto: review.authorAttribution?.photoUri,
        rating: review.rating,
        text: review.text?.text || "",
        publishTime: review.relativePublishTimeDescription || ""
      })),
      averageRating: data.rating || 0,
      totalReviews: data.userRatingCount || 0
    };

    // Update cache
    cachedReviews = formattedResponse;
    cacheTime = now;

    res.json(formattedResponse);
  } catch (error) {
    console.error("Error fetching Google reviews:", error);
    res.status(500).json({
      reviews: [],
      averageRating: 0,
      totalReviews: 0,
      error: "An unexpected error occurred"
    });
  }
};
