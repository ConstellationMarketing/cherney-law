/**
 * Disclaimer Page
 */

import { Helmet } from "react-helmet-async";
import SimpleContentPage from "@site/components/pages/SimpleContentPage";
import { useSimplePageContent } from "@site/hooks/useSimplePageContent";
import { defaultDisclaimerContent } from "@site/lib/cms/simplePageTypes";

export default function DisclaimerPage() {
  const { content, isLoading } = useSimplePageContent(
    "/disclaimer",
    defaultDisclaimerContent
  );

  return (
    <>
      <Helmet>
        <title>Disclaimer | Constellation Law Firm</title>
        <meta name="description" content="Review our disclaimer and legal disclaimers for our services." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${window.location.origin}/disclaimer`} />
      </Helmet>
      <SimpleContentPage content={content} isLoading={isLoading} />
    </>
  );
}
