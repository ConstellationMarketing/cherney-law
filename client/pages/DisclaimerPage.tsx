/**
 * Disclaimer Page
 */

import { Helmet } from "react-helmet-async";
import SimpleContentPage from "@site/components/pages/SimpleContentPage";
import { useSimplePageContent } from "@site/hooks/useSimplePageContent";
import { defaultDisclaimerContent } from "@site/lib/cms/simplePageTypes";
import { useSiteSettings } from "@site/contexts/SiteSettingsContext";

export default function DisclaimerPage() {
  const { content, isLoading } = useSimplePageContent(
    "/disclaimer/",
    defaultDisclaimerContent
  );
  const { settings } = useSiteSettings();
  const siteUrl = settings.siteUrl || window.location.origin;

  return (
    <>
      <Helmet>
        <title>Disclaimer | Constellation Law Firm</title>
        <meta name="description" content="Review our disclaimer and legal disclaimers for our services." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${siteUrl}/disclaimer/`} />
      </Helmet>
      <SimpleContentPage content={content} isLoading={isLoading} />
    </>
  );
}
