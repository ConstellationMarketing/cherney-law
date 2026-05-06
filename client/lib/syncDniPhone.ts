const PHONE_TEXT_REGEX = /(\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}/;
const PRIMARY_SELECTOR = 'a[data-dni-phone="primary"]';
const FOOTER_SELECTOR = 'a[data-dni-phone="footer"]';

let syncTimeoutId: ReturnType<typeof setTimeout> | null = null;
let syncStartTime = 0;
let lastPrimaryHref: string | null = null;
let lastPrimaryText: string | null = null;

const MAX_SYNC_DURATION_MS = 6000;
const POLL_INTERVAL_MS = 250;

function extractPhoneText(element: Element | null): string | null {
  const text = element?.textContent?.trim() || "";
  const matches = text.match(PHONE_TEXT_REGEX);
  return matches?.[0] || null;
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

  textNodes.forEach((node) => {
    node.nodeValue = (node.nodeValue || "").replace(PHONE_TEXT_REGEX, nextPhoneText);
  });
}

function capturePrimaryDniPhone(): void {
  const primaryLink = document.querySelector<HTMLAnchorElement>(PRIMARY_SELECTOR);
  if (!primaryLink) {
    return;
  }

  const href = primaryLink.getAttribute("href");
  const phoneText = extractPhoneText(primaryLink);

  if (href?.startsWith("tel:")) {
    lastPrimaryHref = href;
  }

  if (phoneText) {
    lastPrimaryText = phoneText;
  }
}

function syncFooterDniPhone(): void {
  if (!lastPrimaryHref && !lastPrimaryText) {
    return;
  }

  document.querySelectorAll<HTMLAnchorElement>(FOOTER_SELECTOR).forEach((footerLink) => {
    if (lastPrimaryHref) {
      footerLink.setAttribute("href", lastPrimaryHref);
    }

    if (lastPrimaryText) {
      replacePhoneText(footerLink, lastPrimaryText);
    }
  });
}

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
      capturePrimaryDniPhone();
      syncFooterDniPhone();
    } catch {
      // WhatConverts may be blocked; footer sync is best-effort only.
    }

    if (Date.now() - syncStartTime < MAX_SYNC_DURATION_MS) {
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
