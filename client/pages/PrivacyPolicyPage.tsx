/**
 * Privacy Policy Page
 */

import { Helmet } from "@site/lib/helmet";
import SimpleContentPage from "@site/components/pages/SimpleContentPage";
import { useSimplePageContent } from "@site/hooks/useSimplePageContent";
import { defaultPrivacyPolicyContent } from "@site/lib/cms/simplePageTypes";
import { useSiteSettings } from "@site/contexts/SiteSettingsContext";

export default function PrivacyPolicyPage() {
  const { content, isLoading } = useSimplePageContent(
    "/privacy-policy/",
    defaultPrivacyPolicyContent
  );
  const { settings } = useSiteSettings();
  const siteUrl = settings.siteUrl || window.location.origin;

  return (
    <>
      <Helmet>
        <title>Privacy Policy | Constellation Law Firm</title>
        <meta name="description" content="Read our privacy policy to understand how we protect your personal information." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${siteUrl}/privacy-policy/`} />
      </Helmet>
      <SimpleContentPage content={content} isLoading={isLoading} />
    </>
  );
}
