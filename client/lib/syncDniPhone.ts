/**
 * Sync footer phone number with primary when WhatConverts swaps the primary
 * Polls for up to 10 seconds to detect and copy swapped phone number
 */

let syncTimeoutId: NodeJS.Timeout | null = null;
let syncStartTime = 0;
const MAX_SYNC_DURATION_MS = 10000;
const POLL_INTERVAL_MS = 250;

/**
 * Start polling to sync footer phone with primary when WC swaps primary phone
 * Expected footer phone structure:
 * <a data-dni-phone="footer" href="tel:...">
 *   <span>Label</span>
 *   <span>NUMBER</span>
 * </a>
 */
export function startDniFooterSync(): void {
  // Clear any existing timeout
  if (syncTimeoutId) {
    clearTimeout(syncTimeoutId);
  }

  syncStartTime = Date.now();

  function poll(): void {
    try {
      const primaryLink = document.querySelector(
        'a[data-dni-phone="primary"]'
      ) as HTMLAnchorElement | null;
      const footerLink = document.querySelector(
        'a[data-dni-phone="footer"]'
      ) as HTMLAnchorElement | null;

      if (!primaryLink || !footerLink) {
        // Links not found yet, reschedule poll
        scheduleNextPoll();
        return;
      }

      // Extract phone from primary link
      const primaryHref = primaryLink.getAttribute("href");
      const primaryText = primaryLink.textContent?.trim() || "";

      // Extract phone from footer link
      const footerHref = footerLink.getAttribute("href");

      // Check if there's a mismatch (WC has swapped primary but not footer)
      if (primaryHref && primaryHref !== footerHref && primaryHref.startsWith("tel:")) {
        // Copy primary href to footer
        footerLink.setAttribute("href", primaryHref);

        // Try to sync the display text too (look for NUMBER span)
        const footerSpans = footerLink.querySelectorAll("span");
        if (footerSpans.length >= 2) {
          // Last span is usually the number
          const numberSpan = footerSpans[footerSpans.length - 1];
          const primaryNumber = primaryText
            .split("\n")
            .map((s) => s.trim())
            .filter((s) => /[\d\-\(\)]/.test(s))
            .pop();

          if (primaryNumber && numberSpan) {
            numberSpan.textContent = primaryNumber;
          }
        }

        // Sync complete, stop polling
        if (syncTimeoutId) {
          clearTimeout(syncTimeoutId);
          syncTimeoutId = null;
        }
        return;
      }

      // No mismatch, reschedule poll
      scheduleNextPoll();
    } catch (err) {
      // Silently catch errors
      scheduleNextPoll();
    }
  }

  function scheduleNextPoll(): void {
    const elapsed = Date.now() - syncStartTime;
    if (elapsed < MAX_SYNC_DURATION_MS) {
      syncTimeoutId = setTimeout(poll, POLL_INTERVAL_MS);
    } else {
      // Max duration reached, stop polling
      syncTimeoutId = null;
    }
  }

  // Start polling
  poll();
}

/**
 * Stop the footer sync polling
 */
export function stopDniFooterSync(): void {
  if (syncTimeoutId) {
    clearTimeout(syncTimeoutId);
    syncTimeoutId = null;
  }
}
