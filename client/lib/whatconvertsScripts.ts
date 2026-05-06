const WC_SCRIPT_SRC_PATTERNS = [
  /whatconverts/i,
  /_wc\.js(?:[?#]|$)/i,
  /ksrndkehqnwntyxlhgto\.com/i,
  /\/103496\.js(?:[?#]|$)/i,
];

const WC_INLINE_PATTERNS = [/\$wc_load/, /\$wc_leads/, /\b_wcq\b/, /\b_wci\b/, /WhatConverts/];

const SCRIPT_TAG_REGEX = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const SRC_ATTR_REGEX = /\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i;

export interface SplitWhatConvertsScriptsResult {
  safeHtml: string;
  whatConvertsHtml: string;
}

export function isWhatConvertsScriptSrc(src: string | null | undefined): boolean {
  if (!src) {
    return false;
  }

  return WC_SCRIPT_SRC_PATTERNS.some((pattern) => pattern.test(src));
}

export function isWhatConvertsInlineScript(content: string | null | undefined): boolean {
  if (!content) {
    return false;
  }

  return WC_INLINE_PATTERNS.some((pattern) => pattern.test(content));
}

export function isWhatConvertsScript(attrs: string, content: string): boolean {
  const srcMatch = attrs.match(SRC_ATTR_REGEX);
  const src = srcMatch?.[1] || srcMatch?.[2] || srcMatch?.[3] || "";

  return isWhatConvertsScriptSrc(src) || isWhatConvertsInlineScript(content);
}

export function splitWhatConvertsScripts(html: string | null | undefined): SplitWhatConvertsScriptsResult {
  if (!html?.trim()) {
    return { safeHtml: "", whatConvertsHtml: "" };
  }

  const whatConvertsScripts: string[] = [];
  const safeHtml = html.replace(SCRIPT_TAG_REGEX, (fullTag, attrs, content) => {
    if (isWhatConvertsScript(attrs || "", content || "")) {
      whatConvertsScripts.push(fullTag);
      return "";
    }

    return fullTag;
  });

  return {
    safeHtml: safeHtml.trim(),
    whatConvertsHtml: whatConvertsScripts.join("\n"),
  };
}
