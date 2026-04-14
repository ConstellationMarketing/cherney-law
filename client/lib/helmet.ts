import ReactHelmetAsync from "react-helmet-async/lib/index.js";

const helmetModule =
  (ReactHelmetAsync as {
    default?: {
      Helmet?: unknown;
      HelmetProvider?: unknown;
    };
    Helmet?: unknown;
    HelmetProvider?: unknown;
  }).default ?? ReactHelmetAsync;

export const Helmet = helmetModule.Helmet as typeof import("react-helmet-async").Helmet;
export const HelmetProvider =
  helmetModule.HelmetProvider as typeof import("react-helmet-async").HelmetProvider;
