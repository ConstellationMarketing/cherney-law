/**
 * Global Scripts Manager
 * Injects GA4, Google Ads, and custom head/footer scripts from site settings
 * Mount this globally in App.tsx inside SiteSettingsProvider
 */

import { useEffect } from "react";
import { Helmet } from "@site/lib/helmet";
import { useSiteSettings } from "@site/contexts/SiteSettingsContext";
import { refreshWhatConvertsDni } from "@site/lib/whatconvertsRefresh";
import { startUniversalPhoneSync } from "@site/lib/syncDniPhone";
import {
  isWhatConvertsInlineScript,
  isWhatConvertsScriptSrc,
  splitWhatConvertsScripts,
} from "@site/lib/whatconvertsScripts";
import {
  ANALYTICS_ERROR_FILTER_SCRIPT,
  installAnalyticsErrorFilter,
  isAnalyticsScriptSrc,
} from "@site/lib/analyticsErrorFilter";

function isWhatConvertsScriptElement(script: HTMLScriptElement): boolean {
  return (
    isWhatConvertsScriptSrc(script.getAttribute("src") || script.src) ||
    isWhatConvertsInlineScript(script.textContent)
  );
}

function copyScriptElement(script: HTMLScriptElement): HTMLScriptElement {
  const newScript = document.createElement("script");
  const src = script.getAttribute("src");

  if (src) {
    if (!script.hasAttribute("async")) {
      newScript.async = false;
    }
    newScript.src = src;
  } else {
    newScript.textContent = script.textContent;
  }

  Array.from(script.attributes).forEach((attr) => {
    if (attr.name !== "src" && attr.name !== "textContent") {
      newScript.setAttribute(attr.name, attr.value);
    }
  });

  if (isAnalyticsScriptSrc(newScript.getAttribute("src") || newScript.src)) {
    newScript.onerror = () => true;
  }

  return newScript;
}

function injectHtml(html: string, target: HTMLElement): boolean {
  const container = document.createElement("div");
  container.innerHTML = html;

  let injectedWhatConverts = false;

  container.querySelectorAll("link").forEach((link) => {
    const newLink = document.createElement("link");
    Array.from(link.attributes).forEach((attr) => {
      newLink.setAttribute(attr.name, attr.value);
    });
    target.appendChild(newLink);
  });

  container.querySelectorAll("script").forEach((script) => {
    const isWhatConverts = isWhatConvertsScriptElement(script);
    const newScript = copyScriptElement(script);

    if (isWhatConverts) {
      injectedWhatConverts = true;
      if (newScript.src) {
        newScript.addEventListener("load", () => {
          refreshWhatConvertsDni("wc-script-load", { force: true });
          startUniversalPhoneSync();
        });
      }
    }

    target.appendChild(newScript);
  });

  return injectedWhatConverts;
}

export default function GlobalScripts(): JSX.Element {
  const { settings } = useSiteSettings();
  const ga4AlreadyInHeadScripts = !!(
    settings.ga4MeasurementId && settings.headScripts?.includes(settings.ga4MeasurementId)
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    installAnalyticsErrorFilter();

    const hasPrerenderedHeadScripts = !!document.querySelector(
      'meta[name="cms-prerendered-head-scripts"]',
    );
    const hasPrerenderedFooterScripts = !!document.querySelector(
      'meta[name="cms-prerendered-footer-scripts"]',
    );
    const headScripts = splitWhatConvertsScripts(settings.headScripts);

    if (settings.headScripts?.trim()) {
      const htmlToInject = hasPrerenderedHeadScripts
        ? headScripts.whatConvertsHtml
        : settings.headScripts;

      if (htmlToInject.trim()) {
        const injectedWhatConverts = injectHtml(htmlToInject, document.head);

        if (injectedWhatConverts) {
          refreshWhatConvertsDni("head-scripts", { force: true });
          startUniversalPhoneSync();
        }
      }
    }

    if (
      settings.footerScripts &&
      settings.footerScripts.trim() &&
      !hasPrerenderedFooterScripts
    ) {
      injectHtml(settings.footerScripts, document.body);
    }
  }, [settings.headScripts, settings.footerScripts]);

  return (
    <Helmet>
      <script>{ANALYTICS_ERROR_FILTER_SCRIPT}</script>

      {settings.ga4MeasurementId && !ga4AlreadyInHeadScripts && (
        <>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${settings.ga4MeasurementId}`}
          />
          <script>
            {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${settings.ga4MeasurementId}');`}
          </script>
        </>
      )}

      {settings.googleAdsId && (
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${settings.googleAdsId}`}
          crossOrigin="anonymous"
        />
      )}
    </Helmet>
  );
}
