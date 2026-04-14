import "./global.css";

import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppProviders, AppShell, ErrorBoundary } from "./App";
import { getWindowPreloadedState } from "./lib/prerender/preloadedState";
import { primePreloadedCmsState } from "./lib/prerender/primePreloadedState";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found");
}

const preloadedState = getWindowPreloadedState();
if (preloadedState) {
  primePreloadedCmsState(preloadedState);
}

const app = (
  <ErrorBoundary>
    <AppProviders>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AppProviders>
  </ErrorBoundary>
);

if (preloadedState && rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, app);
} else {
  createRoot(rootElement).render(app);
}
