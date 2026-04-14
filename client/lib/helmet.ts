import * as ReactHelmetAsyncModule from "react-helmet-async/lib/index.js";

type HelmetModuleShape = {
  default?: {
    Helmet?: unknown;
    HelmetProvider?: unknown;
  };
  Helmet?: unknown;
  HelmetProvider?: unknown;
};

const helmetSource = ReactHelmetAsyncModule as HelmetModuleShape | undefined;
const helmetModule = helmetSource?.default ?? helmetSource;

export const Helmet = helmetModule?.Helmet as typeof import("react-helmet-async").Helmet;
export const HelmetProvider =
  helmetModule?.HelmetProvider as typeof import("react-helmet-async").HelmetProvider;
