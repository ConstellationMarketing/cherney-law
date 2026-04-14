/**
 * Terms of Service Page
 */

import { Helmet } from "@site/lib/helmet";
import SimpleContentPage from "@site/components/pages/SimpleContentPage";
import { useSimplePageContent } from "@site/hooks/useSimplePageContent";
import { defaultTermsOfServiceContent } from "@site/lib/cms/simplePageTypes";
import { useSiteSettings } from "@site/contexts/SiteSettingsContext";

export default function TermsOfServicePage() {
  const { content, isLoading } = useSimplePageContent(
    "/terms-of-service/",
    defaultTermsOfServiceContent
  );
  const { settings } = useSiteSettings();
  const siteUrl = settings.siteUrl || window.location.origin;

  return (
    <>
      <Helmet>
        <title>Terms of Service | Constellation Law Firm</title>
        <meta name="description" content="Review our terms of service and legal terms for using our website." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${siteUrl}/terms-of-service/`} />
      </Helmet>
      <SimpleContentPage content={content} isLoading={isLoading} />
    </>
  );
}
