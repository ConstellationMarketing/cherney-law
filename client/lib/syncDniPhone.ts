import { refreshWhatConvertsDni } from "@site/lib/whatconvertsRefresh";

const PHONE_REGEX = /(\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}/;
const PHONE_GLOBAL_REGEX = /(\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}/g;
const TEL_SELECTOR = 'a[href^="tel:"]';
const POLL_INTERVAL_MS = 250;
const MAX_POLL_DURATION_MS = 15_000;

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "TEXTAREA",
  "INPUT",
  "SELECT",
  "NOSCRIPT",
  "IFRAME",
  "SVG",
]);

interface DniPhoneCapture {
  href: string | null;
  display: string | null;
  key: string | null;
  updatedAt: number;
}

interface AnchorSnapshot {
  href: string | null;
  hrefKey: string | null;
  text: string | null;
  textKey: string | null;
}

declare global {
  interface Window {
    __WC_DNI_CAPTURE__?: Partial<DniPhoneCapture> & { text?: string | null };
    __WC_DNI_CAPTURE_GUARD__?: boolean;
  }
}

let syncTimer: ReturnType<typeof setInterval> | null = null;
let syncStopTimer: ReturnType<typeof setTimeout> | null = null;
let latestCapture: DniPhoneCapture | null = null;
let originalAnchors = new WeakMap<HTMLAnchorElement, AnchorSnapshot>();
let originalPhoneKeys = new Set<string>();
let originalPhoneTexts = new Map<string, Set<string>>();

function normalizePhone(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  let digits = value.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    digits = digits.slice(1);
  }

  return digits.length === 10 ? digits : null;
}

function extractPhoneText(element: Element | null): string | null {
  const match = element?.textContent?.match(PHONE_REGEX);
  return match?.[0] || null;
}

function getTelHrefKey(href: string | null | undefined): string | null {
  if (!href?.startsWith("tel:")) {
    return null;
  }

  return normalizePhone(href);
}

function formatPhoneDisplay(key: string): string {
  return `(${key.slice(0, 3)}) ${key.slice(3, 6)}-${key.slice(6)}`;
}

function normalizeCapture(
  capture: Partial<DniPhoneCapture> & { text?: string | null } | null | undefined,
): DniPhoneCapture | null {
  const href = capture?.href?.startsWith("tel:") ? capture.href : null;
  const display = capture?.display || capture?.text || null;
  const key = capture?.key || getTelHrefKey(href) || normalizePhone(display);

  if (!key || originalPhoneKeys.has(key)) {
    return null;
  }

  return {
    href: href || `tel:${key}`,
    display: display && PHONE_REGEX.test(display) ? display : formatPhoneDisplay(key),
    key,
    updatedAt: typeof capture?.updatedAt === "number" ? capture.updatedAt : Date.now(),
  };
}

function rememberOriginalPhone(key: string | null, text?: string | null): void {
  if (!key || key === latestCapture?.key) {
    return;
  }

  originalPhoneKeys.add(key);

  if (text && PHONE_REGEX.test(text)) {
    const texts = originalPhoneTexts.get(key) || new Set<string>();
    texts.add(text);
    originalPhoneTexts.set(key, texts);
  }
}

function rememberAnchor(anchor: HTMLAnchorElement): void {
  const href = anchor.getAttribute("href");
  const hrefKey = getTelHrefKey(href);
  const text = extractPhoneText(anchor);
  const textKey = normalizePhone(text);

  if (!originalAnchors.has(anchor)) {
    originalAnchors.set(anchor, {
      href,
      hrefKey,
      text,
      textKey,
    });
  }

  rememberOriginalPhone(hrefKey, text);
  rememberOriginalPhone(textKey, text);
}

function rememberAnchors(root: ParentNode | Element | Document = document): void {
  if (root instanceof HTMLAnchorElement && root.matches(TEL_SELECTOR)) {
    rememberAnchor(root);
  }

  root.querySelectorAll?.<HTMLAnchorElement>(TEL_SELECTOR).forEach(rememberAnchor);
}

function getGuardCapture(): DniPhoneCapture | null {
  return normalizeCapture(window.__WC_DNI_CAPTURE__);
}

function setLatestCapture(capture: DniPhoneCapture): void {
  if (!latestCapture || capture.updatedAt >= latestCapture.updatedAt) {
    latestCapture = capture;
    window.__WC_DNI_CAPTURE__ = capture;
  }
}

function captureFromGuard(): boolean {
  const capture = getGuardCapture();
  if (!capture) {
    return false;
  }

  setLatestCapture(capture);
  return true;
}

function captureFromAnchor(anchor: HTMLAnchorElement): boolean {
  rememberAnchor(anchor);

  const href = anchor.getAttribute("href");
  const hrefKey = getTelHrefKey(href);
  const text = extractPhoneText(anchor);
  const textKey = normalizePhone(text);
  const snapshot = originalAnchors.get(anchor);

  const changedFromSnapshot =
    (!!hrefKey && !!snapshot?.hrefKey && hrefKey !== snapshot.hrefKey) ||
    (!!textKey && !!snapshot?.textKey && textKey !== snapshot.textKey);
  const nonOriginalHref = !!hrefKey && !originalPhoneKeys.has(hrefKey);
  const nonOriginalText = !!textKey && !originalPhoneKeys.has(textKey);

  if (!changedFromSnapshot && !nonOriginalHref && !nonOriginalText) {
    return false;
  }

  const key = nonOriginalHref || changedFromSnapshot ? hrefKey : textKey;
  if (!key || originalPhoneKeys.has(key)) {
    return false;
  }

  setLatestCapture({
    href: hrefKey === key && href?.startsWith("tel:") ? href : `tel:${key}`,
    display: textKey === key && text ? text : formatPhoneDisplay(key),
    key,
    updatedAt: Date.now(),
  });

  return true;
}

function updateElementPhoneText(root: Element, display: string): boolean {
  let changed = false;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;

      if (!parent || SKIP_TAGS.has(parent.tagName) || parent.closest("[data-builder-editor]")) {
        return NodeFilter.FILTER_REJECT;
      }

      return PHONE_REGEX.test(node.nodeValue || "")
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text);
  }

  nodes.forEach((node) => {
    const current = node.nodeValue || "";
    const next = current.replace(PHONE_GLOBAL_REGEX, (match) => {
      const key = normalizePhone(match);
      return key && originalPhoneKeys.has(key) ? display : match;
    });

    if (next !== current) {
      node.nodeValue = next;
      changed = true;
    }
  });

  return changed;
}

function applyCapturedDniPhone(): boolean {
  const capture = latestCapture || getGuardCapture();
  if (!capture?.key) {
    return false;
  }

  setLatestCapture(capture);

  let applied = false;
  const display = capture.display || formatPhoneDisplay(capture.key);
  const href = capture.href || `tel:${capture.key}`;

  document.querySelectorAll<HTMLAnchorElement>(TEL_SELECTOR).forEach((anchor) => {
    rememberAnchor(anchor);

    const hrefKey = getTelHrefKey(anchor.getAttribute("href"));
    const textKey = normalizePhone(extractPhoneText(anchor));
    const shouldSyncHref = !!hrefKey && originalPhoneKeys.has(hrefKey);
    const shouldSyncText = !!textKey && originalPhoneKeys.has(textKey);

    if (shouldSyncHref && anchor.getAttribute("href") !== href) {
      anchor.setAttribute("href", href);
      applied = true;
    }

    if (shouldSyncText) {
      applied = updateElementPhoneText(anchor, display) || applied;
    }
  });

  if (document.body) {
    applied = updateElementPhoneText(document.body, display) || applied;
  }

  return applied;
}

export function syncPhoneNumbersNow(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  rememberAnchors();
  captureFromGuard();
  document.querySelectorAll<HTMLAnchorElement>(TEL_SELECTOR).forEach(captureFromAnchor);
  return applyCapturedDniPhone();
}

export function startUniversalPhoneSync(): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }

  if (syncStopTimer) {
    clearTimeout(syncStopTimer);
    syncStopTimer = null;
  }

  syncPhoneNumbersNow();

  syncTimer = setInterval(syncPhoneNumbersNow, POLL_INTERVAL_MS);
  syncStopTimer = setTimeout(() => {
    if (syncTimer) {
      clearInterval(syncTimer);
      syncTimer = null;
    }
    syncStopTimer = null;
  }, MAX_POLL_DURATION_MS);
}

export function stopUniversalPhoneSync(): void {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }

  if (syncStopTimer) {
    clearTimeout(syncStopTimer);
    syncStopTimer = null;
  }
}

export const startDniPhoneStabilizer = startUniversalPhoneSync;
export const stopDniPhoneStabilizer = stopUniversalPhoneSync;
