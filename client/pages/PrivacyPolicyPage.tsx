/**
 * Privacy Policy Page
 */

import { Helmet } from "react-helmet-async";
import SimpleContentPage from "@site/components/pages/SimpleContentPage";
import { useSimplePageContent } from "@site/hooks/useSimplePageContent";
import { defaultPrivacyPolicyContent } from "@site/lib/cms/simplePageTypes";

export default function PrivacyPolicyPage() {
  const { content, isLoading } = useSimplePageContent(
    "/privacy-policy",
    defaultPrivacyPolicyContent
  );

  return (
    <>
      <Helmet>
        <title>Privacy Policy | Constellation Law Firm</title>
        <meta name="description" content="Read our privacy policy to understand how we protect your personal information." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${window.location.origin}/privacy-policy`} />
      </Helmet>
      <SimpleContentPage content={content} isLoading={isLoading} />
    </>
  );
}
