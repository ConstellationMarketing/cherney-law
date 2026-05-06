const ANALYTICS_ERROR_TARGETS = [
  "google-analytics.com/g/collect",
  "googletagmanager.com/gtag/js",
  "googletagmanager.com/gtm.js",
];

export const ANALYTICS_ERROR_FILTER_SCRIPT = `(function(){
  if (typeof window === "undefined" || window.__ANALYTICS_ERROR_FILTER__) return;
  window.__ANALYTICS_ERROR_FILTER__ = true;
  var targets = ${JSON.stringify(ANALYTICS_ERROR_TARGETS)};
  function text(value) {
    if (!value) return "";
    if (typeof value === "string") return value;
    return [value.message, value.stack, value.filename, value.fileName, value.sourceURL]
      .filter(Boolean)
      .join("\\n");
  }
  function isAnalyticsFetchFailure(value) {
    var body = text(value);
    return body.indexOf("Failed to fetch") !== -1 && targets.some(function(target) {
      return body.indexOf(target) !== -1;
    });
  }
  window.addEventListener("error", function(event) {
    if (isAnalyticsFetchFailure(event.error || event.message || event.filename)) {
      event.preventDefault();
    }
  }, true);
  window.addEventListener("unhandledrejection", function(event) {
    if (isAnalyticsFetchFailure(event.reason)) {
      event.preventDefault();
    }
  }, true);
})();`;

export function installAnalyticsErrorFilter(): void {
  if (typeof window === "undefined") {
    return;
  }

  const w = window as Window & { __ANALYTICS_ERROR_FILTER__?: boolean };
  if (w.__ANALYTICS_ERROR_FILTER__) {
    return;
  }

  new Function(ANALYTICS_ERROR_FILTER_SCRIPT)();
}

export function isAnalyticsScriptSrc(src: string | null | undefined): boolean {
  return !!src && ANALYTICS_ERROR_TARGETS.some((target) => src.includes(target));
}
