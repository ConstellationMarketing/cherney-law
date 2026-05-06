import {
  refreshWhatConvertsDni,
  resetWcThrottle,
} from "@site/lib/whatconvertsRefresh";

const PHONE_TEXT_REGEX = /(\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}/;
const DNI_SELECTOR = "a[data-dni-phone]";

const MAX_POLL_DURATION_MS = 10000;
const POLL_INTERVAL_MS = 150;
const FALLBACK_REFRESH_DELAY_MS = 750;

interface DniPhoneCapture {
  href: string | null;
  text: string | null;
  updatedAt: number;
}

interface AnchorSnapshot {
  href: string | null;
  text: string | null;
}

declare global {
  interface Window {
    __WC_DNI_CAPTURE__?: Partial<DniPhoneCapture>;
    __WC_DNI_CAPTURE_GUARD__?: boolean;
  }
}

let pollTimeoutId: ReturnType<typeof setTimeout> | null = null;
let fallbackTimeoutId: ReturnType<typeof setTimeout> | null = null;
let observer: MutationObserver | null = null;
let pollStartTime = 0;
let latestCapture: DniPhoneCapture | null = null;
let originalAnchors = new WeakMap<HTMLAnchorElement, AnchorSnapshot>();

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
    node.nodeValue = (node.nodeValue || "").replace(
      PHONE_TEXT_REGEX,
      nextPhoneText,
    );
  });
}

function normalizeCapture(
  capture: Partial<DniPhoneCapture> | null | undefined,
): DniPhoneCapture | null {
  const href = capture?.href?.startsWith("tel:") ? capture.href : null;
  const text = capture?.text && PHONE_TEXT_REGEX.test(capture.text)
    ? capture.text
    : null;

  if (!href && !text) {
    return null;
  }

  return {
    href,
    text,
    updatedAt: typeof capture?.updatedAt === "number" ? capture.updatedAt : Date.now(),
  };
}

function getGuardCapture(): DniPhoneCapture | null {
  return normalizeCapture(window.__WC_DNI_CAPTURE__);
}

function setLatestCapture(capture: DniPhoneCapture): void {
  latestCapture = capture;
  window.__WC_DNI_CAPTURE__ = capture;
}

function captureFromGuard(): boolean {
  const capture = getGuardCapture();
  if (!capture) {
    return false;
  }

  if (!latestCapture || capture.updatedAt >= latestCapture.updatedAt) {
    setLatestCapture(capture);
  }

  return true;
}

function rememberAnchor(anchor: HTMLAnchorElement): void {
  if (originalAnchors.has(anchor)) {
    return;
  }

  originalAnchors.set(anchor, {
    href: anchor.getAttribute("href"),
    text: extractPhoneText(anchor),
  });
}

function rememberAnchors(root: ParentNode | Element | Document = document): void {
  if (root instanceof HTMLAnchorElement && root.matches(DNI_SELECTOR)) {
    rememberAnchor(root);
  }

  root.querySelectorAll?.<HTMLAnchorElement>(DNI_SELECTOR).forEach(rememberAnchor);
}

function getAnchorFromMutationTarget(target: Node): HTMLAnchorElement | null {
  if (target instanceof HTMLAnchorElement && target.matches(DNI_SELECTOR)) {
    return target;
  }

  if (target instanceof Element) {
    return target.closest<HTMLAnchorElement>(DNI_SELECTOR);
  }

  return target.parentElement?.closest<HTMLAnchorElement>(DNI_SELECTOR) || null;
}

function captureChangedAnchor(anchor: HTMLAnchorElement): boolean {
  rememberAnchor(anchor);

  const original = originalAnchors.get(anchor);
  if (!original) {
    return false;
  }

  const href = anchor.getAttribute("href");
  const text = extractPhoneText(anchor);
  const changedHref = !!href && href.startsWith("tel:") && href !== original.href;
  const changedText = !!text && text !== original.text;

  if (!changedHref && !changedText) {
    return false;
  }

  setLatestCapture({
    href: href?.startsWith("tel:") ? href : latestCapture?.href || null,
    text: text || latestCapture?.text || null,
    updatedAt: Date.now(),
  });

  return true;
}

function applyCapturedDniPhone(): boolean {
  const capture = latestCapture || getGuardCapture();
  if (!capture) {
    return false;
  }

  let applied = false;

  document.querySelectorAll<HTMLAnchorElement>(DNI_SELECTOR).forEach((anchor) => {
    rememberAnchor(anchor);

    if (capture.href && anchor.getAttribute("href") !== capture.href) {
      anchor.setAttribute("href", capture.href);
      applied = true;
    }

    if (capture.text && extractPhoneText(anchor) !== capture.text) {
      replacePhoneText(anchor, capture.text);
      applied = true;
    }
  });

  return applied;
}

function handleMutations(mutations: MutationRecord[]): void {
  mutations.forEach((mutation) => {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) {
          rememberAnchors(node);
        }
      });
    }

    const anchor = getAnchorFromMutationTarget(mutation.target);
    if (anchor) {
      captureChangedAnchor(anchor);
    }
  });

  captureFromGuard();
  applyCapturedDniPhone();
}

function pollForDniCapture(): void {
  captureFromGuard();
  document
    .querySelectorAll<HTMLAnchorElement>(DNI_SELECTOR)
    .forEach(captureChangedAnchor);
  applyCapturedDniPhone();

  if (Date.now() - pollStartTime < MAX_POLL_DURATION_MS) {
    pollTimeoutId = setTimeout(pollForDniCapture, POLL_INTERVAL_MS);
  } else {
    pollTimeoutId = null;
  }
}

function scheduleWhatConvertsFallback(): void {
  fallbackTimeoutId = setTimeout(() => {
    fallbackTimeoutId = null;

    if (latestCapture || getGuardCapture()) {
      return;
    }

    rememberAnchors();
    resetWcThrottle();
    refreshWhatConvertsDni("dni-stabilizer-fallback", { force: true });
  }, FALLBACK_REFRESH_DELAY_MS);
}

export function startDniPhoneStabilizer(): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  stopDniPhoneStabilizer();

  originalAnchors = new WeakMap<HTMLAnchorElement, AnchorSnapshot>();
  pollStartTime = Date.now();

  captureFromGuard();
  rememberAnchors();
  applyCapturedDniPhone();

  observer = new MutationObserver(handleMutations);
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["href"],
  });

  pollForDniCapture();
  scheduleWhatConvertsFallback();
}

export function stopDniPhoneStabilizer(): void {
  if (pollTimeoutId) {
    clearTimeout(pollTimeoutId);
    pollTimeoutId = null;
  }

  if (fallbackTimeoutId) {
    clearTimeout(fallbackTimeoutId);
    fallbackTimeoutId = null;
  }

  if (observer) {
    observer.disconnect();
    observer = null;
  }
}
