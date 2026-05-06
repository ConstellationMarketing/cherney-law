/**
 * WhatConverts Dynamic Number Insertion (DNI) refresh utility
 * Handles SPA route changes and DOM updates by re-triggering WC script logic
 */

let lastRefreshTime = 0;
const THROTTLE_MS = 1500;

/**
 * Find the WhatConverts script element in the DOM.
 * Checks both static script tags and dynamically injected ones.
 */
function findWcScript(): HTMLScriptElement | null {
  const scripts = document.querySelectorAll<HTMLScriptElement>("script[src]");
  for (const script of scripts) {
    const src = script.src || "";
    if (src.includes("whatconverts") || src.includes("_wc.js")) {
      return script;
    }
  }
  return null;
}

/**
 * Refresh WhatConverts DNI to handle phone number swaps in SPA navigation.
 *
 * Strategy order:
 * 1. Notify WC via official SPA API (_wcq / _wci / WhatConverts) — fast path for analytics
 * 2. Always re-insert the WC script tag — this is the only reliable way to trigger
 *    a full DNI re-scan in WhatConverts' current SDK.
 *
 * Note: We do NOT short-circuit after strategy 1 because the API calls only update
 * WC's analytics state; they do not reliably re-scan and swap phone numbers in the DOM.
 */
export function refreshWhatConvertsDni(
  reason: string,
  opts?: { force?: boolean }
): void {
  try {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;

    // Apply throttling unless force is set
    if (!opts?.force && timeSinceLastRefresh < THROTTLE_MS) {
      return;
    }

    lastRefreshTime = now;

    // Strategy 1: Notify WC via official SPA event API (analytics / partial update)
    // We do this but do NOT return early — it alone doesn't guarantee DNI re-scan.
    try {
      if ((window as any)._wcq && typeof (window as any)._wcq.push === "function") {
        (window as any)._wcq.push({
          event: "pageview",
          path: window.location.pathname,
        });
      }
    } catch (_) {
      // Ignore — ad blockers or missing WC init
    }

    try {
      if ((window as any)._wci && typeof (window as any)._wci.run === "function") {
        (window as any)._wci.run();
      }
    } catch (_) {
      // Ignore
    }

    try {
      if (
        (window as any).WhatConverts &&
        typeof (window as any).WhatConverts.track === "function"
      ) {
        (window as any).WhatConverts.track();
      }
    } catch (_) {
      // Ignore
    }

    // Strategy 2: Re-insert the WC script tag to guarantee a full DNI re-scan.
    // WhatConverts DNI works by scanning the DOM when the script runs.
    // Re-inserting triggers that scan fresh on the current page content.
    const wcScript = findWcScript();

    if (wcScript && wcScript.src) {
      // Remove any previously re-inserted DNI copies first
      document
        .querySelectorAll('script[data-wc="dni"]')
        .forEach((el) => el.remove());

      const newScript = document.createElement("script");
      newScript.src = wcScript.src;
      newScript.setAttribute("data-wc", "dni");
      newScript.async = true;
      document.body.appendChild(newScript);
    }
  } catch (err) {
    // Silently catch all errors — WC may be blocked by ad blockers
  }
}

/**
 * Reset the throttle so the next call is not skipped.
 * Call this before intentional refreshes (e.g. route changes).
 */
export function resetWcThrottle(): void {
  lastRefreshTime = 0;
}
