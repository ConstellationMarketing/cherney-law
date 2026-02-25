/**
 * Terms of Service Page
 */

import { Helmet } from "react-helmet-async";
import SimpleContentPage from "@site/components/pages/SimpleContentPage";
import { useSimplePageContent } from "@site/hooks/useSimplePageContent";
import { defaultTermsOfServiceContent } from "@site/lib/cms/simplePageTypes";

export default function TermsOfServicePage() {
  const { content, isLoading } = useSimplePageContent(
    "/terms-of-service",
    defaultTermsOfServiceContent
  );

  return (
    <>
      <Helmet>
        <title>Terms of Service | Constellation Law Firm</title>
        <meta name="description" content="Review our terms of service and legal terms for using our website." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${window.location.origin}/terms-of-service`} />
      </Helmet>
      <SimpleContentPage content={content} isLoading={isLoading} />
    </>
  );
}
