/**
 * WhatConverts Dynamic Number Insertion (DNI) Manager
 * Handles WC integration for SPA route changes and DOM updates
 * Mount this globally in App.tsx
 */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  refreshWhatConvertsDni,
  resetWcThrottle,
} from "@site/lib/whatconvertsRefresh";
import {
  startDniFooterSync,
  stopDniFooterSync,
} from "@site/lib/syncDniPhone";

function mutationTouchesDniPhone(mutation: MutationRecord): boolean {
  if (mutation.type === "childList") {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      const element = node as Element;
      if (element.matches("[data-dni-phone]") || element.querySelector("[data-dni-phone]")) {
        return true;
      }
    }

    return false;
  }

  const target = mutation.target;

  if (target.nodeType === Node.TEXT_NODE) {
    return !!target.parentElement?.closest("[data-dni-phone]");
  }

  if (target.nodeType === Node.ELEMENT_NODE) {
    return !!(target as Element).closest("[data-dni-phone]");
  }

  return false;
}

export default function WcDniManager(): null {
  const location = useLocation();

  // On mount: initial refresh and footer sync
  useEffect(() => {
    resetWcThrottle();
    refreshWhatConvertsDni("initial");
    startDniFooterSync();

    return () => {
      stopDniFooterSync();
    };
  }, []);

  // On route change: refresh for the new page and keep stabilizing DNI
  useEffect(() => {
    resetWcThrottle();
    refreshWhatConvertsDni("route");
    startDniFooterSync();

    const timers = [300, 1200, 2500, 5000].map((delay, index) =>
      setTimeout(() => {
        resetWcThrottle();
        refreshWhatConvertsDni(`route-${index + 1}`);
        startDniFooterSync();
      }, delay)
    );

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [location.pathname]);

  // Watch for later React rerenders that overwrite WC's DOM mutation.
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    let mutationTimer: ReturnType<typeof setTimeout> | null = null;

    const observer = new MutationObserver((mutations) => {
      const shouldRefresh = mutations.some(mutationTouchesDniPhone);
      if (!shouldRefresh) {
        return;
      }

      if (mutationTimer) {
        clearTimeout(mutationTimer);
      }

      mutationTimer = setTimeout(() => {
        resetWcThrottle();
        refreshWhatConvertsDni("mutation");
        startDniFooterSync();
      }, 150);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["href"],
    });

    return () => {
      if (mutationTimer) {
        clearTimeout(mutationTimer);
      }
      observer.disconnect();
    };
  }, []);

  return null;
}
