/**
 * Keep DNI-swapped phone numbers stable across React rerenders.
 *
 * WhatConverts mutates the DOM directly. On SPA navigation, React can later
 * rerender the same anchors with the original phone values, which overwrites
 * the swapped number. This module watches the current swapped primary phone,
 * stores it, and reapplies it to all DNI phone anchors for a short period
 * after route changes / DOM updates.
 */

let syncTimeoutId: ReturnType<typeof setTimeout> | null = null;
let syncStartTime = 0;
const MAX_SYNC_DURATION_MS = 12000;
const POLL_INTERVAL_MS = 250;
const PHONE_TEXT_REGEX = /(\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}/;

let lastKnownDniHref: string | null = null;
let lastKnownDniText: string | null = null;

function extractPhoneText(element: Element | null): string | null {
  if (!element) return null;

  const text = element.textContent?.trim() || "";
  if (!text) return null;

  const matches = text.match(PHONE_TEXT_REGEX);
  return matches?.[0] || null;
}

function captureCurrentDniState(): void {
  const primaryLinks = document.querySelectorAll<HTMLAnchorElement>(
    'a[data-dni-phone="primary"]'
  );

  for (const link of primaryLinks) {
    const href = link.getAttribute("href");
    const phoneText = extractPhoneText(link);

    if (href?.startsWith("tel:")) {
      lastKnownDniHref = href;
    }

    if (phoneText) {
      lastKnownDniText = phoneText;
    }

    if (lastKnownDniHref && lastKnownDniText) {
      return;
    }
  }
}

function replacePhoneText(anchor: HTMLAnchorElement, nextPhoneText: string): void {
  const walker = document.createTreeWalker(anchor, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const value = node.nodeValue || "";
    if (PHONE_TEXT_REGEX.test(value)) {
      textNodes.push(node);
    }
  }

  if (textNodes.length > 0) {
    textNodes.forEach((node) => {
      node.nodeValue = (node.nodeValue || "").replace(PHONE_TEXT_REGEX, nextPhoneText);
    });
    return;
  }

  const leafElements = Array.from(anchor.querySelectorAll("*")).filter(
    (element) => element.children.length === 0 && PHONE_TEXT_REGEX.test(element.textContent || "")
  );

  leafElements.forEach((element) => {
    element.textContent = nextPhoneText;
  });
}

function applyStoredDniState(): void {
  if (typeof document === "undefined" || (!lastKnownDniHref && !lastKnownDniText)) {
    return;
  }

  const allDniLinks = document.querySelectorAll<HTMLAnchorElement>("a[data-dni-phone]");

  allDniLinks.forEach((link) => {
    if (lastKnownDniHref?.startsWith("tel:") && link.getAttribute("href") !== lastKnownDniHref) {
      link.setAttribute("href", lastKnownDniHref);
    }

    if (lastKnownDniText) {
      replacePhoneText(link, lastKnownDniText);
    }
  });
}

/**
 * Start short-lived polling after route changes / DOM updates so DNI changes
 * survive later React rerenders.
 */
export function startDniFooterSync(): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  if (syncTimeoutId) {
    clearTimeout(syncTimeoutId);
  }

  syncStartTime = Date.now();

  function poll(): void {
    try {
      captureCurrentDniState();
      applyStoredDniState();
    } catch (_) {
      // Ignore and keep polling
    }

    const elapsed = Date.now() - syncStartTime;
    if (elapsed < MAX_SYNC_DURATION_MS) {
      syncTimeoutId = setTimeout(poll, POLL_INTERVAL_MS);
    } else {
      syncTimeoutId = null;
    }
  }

  poll();
}

export function stopDniFooterSync(): void {
  if (syncTimeoutId) {
    clearTimeout(syncTimeoutId);
    syncTimeoutId = null;
  }
}
