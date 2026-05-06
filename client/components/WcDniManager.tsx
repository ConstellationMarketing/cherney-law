import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  refreshWhatConvertsDni,
  scheduleWhatConvertsRefreshSeries,
} from "@site/lib/whatconvertsRefresh";
import {
  startUniversalPhoneSync,
  stopUniversalPhoneSync,
  syncPhoneNumbersNow,
} from "@site/lib/syncDniPhone";

const PHONE_TEXT_REGEX = /(\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}/;
const MUTATION_DEBOUNCE_MS = 150;

function nodeContainsPhoneContent(node: Node): boolean {
  if (node instanceof HTMLAnchorElement && node.matches('a[href^="tel:"]')) {
    return true;
  }

  if (node instanceof Element) {
    if (node.querySelector('a[href^="tel:"]')) {
      return true;
    }

    return PHONE_TEXT_REGEX.test(node.textContent || "");
  }

  return PHONE_TEXT_REGEX.test(node.textContent || "");
}

export function triggerDniRefreshAfterReveal(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.setTimeout(() => {
    refreshWhatConvertsDni("content-reveal", { force: true });
    syncPhoneNumbersNow();
    startUniversalPhoneSync();
  }, 100);
}

export default function WcDniManager(): null {
  const location = useLocation();

  useEffect(() => {
    const cancelInitialSeries = scheduleWhatConvertsRefreshSeries(
      "initial",
      startUniversalPhoneSync,
    );
    startUniversalPhoneSync();

    const handleWindowLoad = () => {
      refreshWhatConvertsDni("window-load", { force: true });
      startUniversalPhoneSync();
    };

    window.addEventListener("load", handleWindowLoad);

    if (document.readyState === "complete") {
      handleWindowLoad();
    }

    let mutationDebounce: number | null = null;
    const observer = new MutationObserver((mutations) => {
      const hasPhoneContent = mutations.some((mutation) => {
        if (mutation.type === "attributes") {
          return nodeContainsPhoneContent(mutation.target);
        }

        return Array.from(mutation.addedNodes).some(nodeContainsPhoneContent);
      });

      if (!hasPhoneContent) {
        return;
      }

      if (mutationDebounce) {
        window.clearTimeout(mutationDebounce);
      }

      mutationDebounce = window.setTimeout(() => {
        mutationDebounce = null;
        refreshWhatConvertsDni("dom-phone-added", { force: true });
        syncPhoneNumbersNow();
        startUniversalPhoneSync();
      }, MUTATION_DEBOUNCE_MS);
    });

    if (document.body) {
      observer.observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["href"],
      });
    }

    return () => {
      cancelInitialSeries();
      window.removeEventListener("load", handleWindowLoad);
      observer.disconnect();

      if (mutationDebounce) {
        window.clearTimeout(mutationDebounce);
      }

      stopUniversalPhoneSync();
    };
  }, []);

  useEffect(() => {
    const cancelRouteSeries = scheduleWhatConvertsRefreshSeries(
      "route",
      startUniversalPhoneSync,
    );
    startUniversalPhoneSync();

    return cancelRouteSeries;
  }, [location.pathname, location.search, location.hash]);

  return null;
}
