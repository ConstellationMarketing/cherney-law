/**
 * WhatConverts Dynamic Number Insertion (DNI) refresh utility
 * Handles SPA route changes and DOM updates by re-triggering WC script logic
 */

let lastRefreshTime = 0;
const THROTTLE_MS = 2000;

/**
 * Refresh WhatConverts DNI to handle phone number swaps in SPA
 * Uses three strategies in order:
 * 1. Official WC SPA API: window._wcq.push({event: 'pageview', path: location.pathname})
 * 2. Internal WC re-scan: window._wci.run() or WhatConverts.track()
 * 3. Fallback: re-insert the original WC script tag (clone and append)
 */
export function refreshWhatConvertsDni(
  reason: string,
  opts?: { force?: boolean }
): void {
  try {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;

    // Apply throttling unless force is set
    if (!opts?.force && timeSinceLastRefresh < THROTTLE_MS) {
      return;
    }

    lastRefreshTime = now;

    // Strategy 1: Official WC SPA API
    if (
      typeof window !== "undefined" &&
      (window as any)._wcq &&
      typeof (window as any)._wcq.push === "function"
    ) {
      try {
        (window as any)._wcq.push({
          event: "pageview",
          path: location.pathname,
        });
        return;
      } catch (e) {
        // Fall through to strategy 2
      }
    }

    // Strategy 2: Internal WC re-scan
    if (typeof window !== "undefined") {
      // Try _wci.run()
      if (
        (window as any)._wci &&
        typeof (window as any)._wci.run === "function"
      ) {
        try {
          (window as any)._wci.run();
          return;
        } catch (e) {
          // Fall through to strategy 3
        }
      }

      // Try WhatConverts.track()
      if (
        (window as any).WhatConverts &&
        typeof (window as any).WhatConverts.track === "function"
      ) {
        try {
          (window as any).WhatConverts.track();
          return;
        } catch (e) {
          // Fall through to strategy 3
        }
      }
    }

    // Strategy 3: Fallback - re-insert WC script
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      // Find the original WC script tag
      const scripts = document.querySelectorAll("script");
      let wcScript: HTMLScriptElement | null = null;

      for (const script of scripts) {
        if (
          script.src &&
          (script.src.includes("whatconverts") ||
            script.src.includes("_wc.js"))
        ) {
          wcScript = script;
          break;
        }
      }

      if (wcScript && wcScript.src) {
        // Remove any previously re-inserted copies
        const oldCopies = document.querySelectorAll(
          'script[data-wc="dni"]'
        );
        oldCopies.forEach((copy) => copy.remove());

        // Clone and re-append the original script
        const newScript = document.createElement("script");
        newScript.src = wcScript.src;
        newScript.setAttribute("data-wc", "dni");
        newScript.async = true;
        document.body.appendChild(newScript);
      }
    }
  } catch (err) {
    // Silently catch all errors to never break the page
    // WhatConverts might be blocked by ad blockers
  }
}

/**
 * Clear the throttle timer (useful for testing)
 */
export function resetWcThrottle(): void {
  lastRefreshTime = 0;
}
