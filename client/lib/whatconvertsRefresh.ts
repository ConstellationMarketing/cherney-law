/**
 * WhatConverts Dynamic Number Insertion (DNI) refresh utility.
 *
 * WhatConverts is loaded from CMS-managed head scripts. In React/CMS pages,
 * content can render after the WC script has already scanned the DOM, so this
 * utility forces WC to see the current URL and rescan the current document.
 */

interface RefreshOptions {
  force?: boolean;
}

const THROTTLE_MS = 1500;
const SERIES_DELAYS_MS = [100, 500, 1500, 3000];
const WC_REFRESH_ATTR = "data-wc-dni-refresh";

let lastRefreshTime = 0;

function isWcScriptSrc(src: string): boolean {
  return (
    src.includes("whatconverts") ||
    src.includes("_wc.js") ||
    src.includes("ksrndkehqnwntyxlhgto.com") ||
    /\/103496\.js(?:[?#]|$)/.test(src)
  );
}

function findOriginalWcScript(): HTMLScriptElement | null {
  const scripts = document.querySelectorAll<HTMLScriptElement>("script[src]");

  for (const script of scripts) {
    const src = script.src || script.getAttribute("src") || "";
    if (src && isWcScriptSrc(src)) {
      return script;
    }
  }

  return null;
}

function cloneForWc(value: string): string {
  try {
    const wcLoad = (window as any).$wc_load;
    if (typeof wcLoad === "function") {
      return wcLoad(value);
    }
  } catch (_) {
    // Fall through to the same cloning behavior as the WC snippet.
  }

  return JSON.parse(JSON.stringify(value));
}

function refreshWcLeadDocument(): void {
  const wcWindow = window as any;

  wcWindow.$wc_load =
    typeof wcWindow.$wc_load === "function" ? wcWindow.$wc_load : cloneForWc;

  wcWindow.$wc_leads = wcWindow.$wc_leads || {};
  wcWindow.$wc_leads.doc = {
    url: cloneForWc(document.URL),
    ref: cloneForWc(document.referrer),
    search: cloneForWc(location.search),
    hash: cloneForWc(location.hash),
  };
}

function pushSpaPageview(): void {
  const w = window as any;
  const path = window.location.pathname + window.location.search;

  try {
    if (Array.isArray(w._wcq) || typeof w._wcq?.push === "function") {
      w._wcq.push({
        event: "pageview",
        path,
      });
    }
  } catch (_) {
    // Ignore WC/ad-blocker/runtime failures.
  }
}

function runDirectWcApis(): void {
  const w = window as any;

  try {
    if (typeof w._wci?.run === "function") {
      w._wci.run();
    }
  } catch (_) {
    // Ignore WC/ad-blocker/runtime failures.
  }

  try {
    if (typeof w.WhatConverts?.track === "function") {
      w.WhatConverts.track();
    }
  } catch (_) {
    // Ignore WC/ad-blocker/runtime failures.
  }
}

function reinsertWcScript(): void {
  const original = findOriginalWcScript();
  const src = original?.src || original?.getAttribute("src");

  if (!src) {
    return;
  }

  document
    .querySelectorAll<HTMLScriptElement>(`script[${WC_REFRESH_ATTR}="true"]`)
    .forEach((script) => script.remove());

  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  script.setAttribute(WC_REFRESH_ATTR, "true");
  script.setAttribute("data-wc", "dni");
  document.head.appendChild(script);
}

export function refreshWhatConvertsDni(
  reason: string,
  opts: RefreshOptions = {},
): void {
  try {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const now = Date.now();
    if (!opts.force && now - lastRefreshTime < THROTTLE_MS) {
      return;
    }

    lastRefreshTime = now;
    refreshWcLeadDocument();
    pushSpaPageview();
    runDirectWcApis();
    reinsertWcScript();
  } catch (_) {
    // WC is third-party code and may be blocked. Never break the app for it.
  }
}

export function scheduleWhatConvertsRefreshSeries(
  reason: string,
  afterEachRefresh?: () => void,
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const timers = SERIES_DELAYS_MS.map((delay) =>
    window.setTimeout(() => {
      refreshWhatConvertsDni(`${reason}-${delay}`, { force: true });
      afterEachRefresh?.();
    }, delay),
  );

  return () => {
    timers.forEach((timer) => window.clearTimeout(timer));
  };
}

export function resetWcThrottle(): void {
  lastRefreshTime = 0;
}
