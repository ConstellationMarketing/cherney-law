/**
 * Global Scripts Manager
 * Injects GA4, Google Ads, and custom head/footer scripts from site settings
 * Mount this globally in App.tsx inside SiteSettingsProvider
 */

import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useSiteSettings } from "@site/contexts/SiteSettingsContext";
import { refreshWhatConvertsDni } from "@site/lib/whatconvertsRefresh";

export default function GlobalScripts(): JSX.Element {
  const { settings } = useSiteSettings();

  useEffect(() => {
    // Inject custom head and footer scripts into the DOM
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      // Head scripts
      if (settings.headScripts && settings.headScripts.trim()) {
        const headDiv = document.createElement("div");
        headDiv.innerHTML = settings.headScripts;

        const scripts = headDiv.querySelectorAll("script");
        const links = headDiv.querySelectorAll("link");

        // Insert script elements
        scripts.forEach((script) => {
          const newScript = document.createElement("script");
          if (script.src) {
            newScript.src = script.src;
          } else {
            newScript.textContent = script.textContent;
          }
          // Copy attributes
          Array.from(script.attributes).forEach((attr) => {
            if (attr.name !== "src" && attr.name !== "textContent") {
              newScript.setAttribute(attr.name, attr.value);
            }
          });
          document.head.appendChild(newScript);
        });

        // Insert link elements
        links.forEach((link) => {
          const newLink = document.createElement("link");
          Array.from(link.attributes).forEach((attr) => {
            newLink.setAttribute(attr.name, attr.value);
          });
          document.head.appendChild(newLink);
        });
      }

      // Footer scripts
      if (settings.footerScripts && settings.footerScripts.trim()) {
        const footerDiv = document.createElement("div");
        footerDiv.innerHTML = settings.footerScripts;

        const scripts = footerDiv.querySelectorAll("script");

        scripts.forEach((script) => {
          const newScript = document.createElement("script");
          if (script.src) {
            newScript.src = script.src;
          } else {
            newScript.textContent = script.textContent;
          }
          // Copy attributes
          Array.from(script.attributes).forEach((attr) => {
            if (attr.name !== "src" && attr.name !== "textContent") {
              newScript.setAttribute(attr.name, attr.value);
            }
          });
          document.body.appendChild(newScript);
        });
      }

      // Refresh WC after injecting scripts
      if (settings.headScripts || settings.footerScripts) {
        setTimeout(() => {
          refreshWhatConvertsDni("head-scripts", { force: true });
        }, 100);
      }
    }
  }, [settings.headScripts, settings.footerScripts]);

  // Render GA4 and Google Ads via Helmet
  return (
    <Helmet>
      {/* GA4 */}
      {settings.ga4MeasurementId && (
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

      {/* Google Ads */}
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
