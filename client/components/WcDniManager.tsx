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

export default function WcDniManager(): null {
  const location = useLocation();

  // On mount: initial refresh and footer sync
  useEffect(() => {
    // Reset throttle to allow immediate initial refresh
    resetWcThrottle();
    refreshWhatConvertsDni("initial");
    startDniFooterSync();

    return () => {
      stopDniFooterSync();
    };
  }, []);

  // On route change: refresh for the new page
  useEffect(() => {
    refreshWhatConvertsDni("route");
    startDniFooterSync();
  }, [location.pathname]);

  // Optional: Use MutationObserver to detect DOM changes with phone markup
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const observer = new MutationObserver((mutations) => {
      // Check if any mutations contain data-dni-phone elements
      let hasDniPhone = false;
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (
                element.hasAttribute("data-dni-phone") ||
                element.querySelector("[data-dni-phone]")
              ) {
                hasDniPhone = true;
                break;
              }
            }
          }
        }
      }

      if (hasDniPhone) {
        // Delay slightly to allow DOM to settle
        setTimeout(() => {
          refreshWhatConvertsDni("mutation");
          startDniFooterSync();
        }, 100);
      }
    });

    // Observe the whole document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // This component doesn't render anything
  return null;
}
