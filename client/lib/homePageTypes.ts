export type ImageRef = {
  url: string;
  alt?: string;
};

export type GoogleReview = {
  author: string;
  rating: number;
  text: string;
  profileUrl?: string;
};

export type HomePageData = {
  hero?: {
    headline?: string;
    subheadline?: string;
    ctaText?: string;
    ctaUrl?: string;
    image?: ImageRef;
  };
  reviews?: GoogleReview[];
  // add sections you use (awards, about, contact, etc.)
};
