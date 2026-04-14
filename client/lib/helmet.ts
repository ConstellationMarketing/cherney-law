import * as ReactHelmetAsyncModule from "react-helmet-async";

const ReactHelmetAsync =
  ((ReactHelmetAsyncModule as any)["default"] as typeof ReactHelmetAsyncModule) ||
  ReactHelmetAsyncModule;

export const Helmet = (ReactHelmetAsync as any).Helmet;
export const HelmetProvider = (ReactHelmetAsync as any).HelmetProvider;
