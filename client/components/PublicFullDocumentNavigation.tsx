import { useEffect } from "react";

function isModifiedClick(event: MouseEvent): boolean {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

function findAnchor(event: MouseEvent): HTMLAnchorElement | null {
  const target = event.target;
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest<HTMLAnchorElement>("a[href]");
}

function shouldUseFullDocumentNavigation(anchor: HTMLAnchorElement): boolean {
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#")) {
    return false;
  }

  if (anchor.hasAttribute("download") || anchor.target === "_blank") {
    return false;
  }

  const loweredHref = href.trim().toLowerCase();
  if (
    loweredHref.startsWith("tel:") ||
    loweredHref.startsWith("mailto:") ||
    loweredHref.startsWith("javascript:")
  ) {
    return false;
  }

  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin) {
    return false;
  }

  if (url.pathname.startsWith("/admin")) {
    return false;
  }

  const current = new URL(window.location.href);
  if (
    url.pathname === current.pathname &&
    url.search === current.search &&
    url.hash !== current.hash
  ) {
    return false;
  }

  return url.href !== current.href;
}

export default function PublicFullDocumentNavigation(): null {
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || isModifiedClick(event)) {
        return;
      }

      const anchor = findAnchor(event);
      if (!anchor || !shouldUseFullDocumentNavigation(anchor)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      window.location.assign(anchor.href);
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  return null;
}
