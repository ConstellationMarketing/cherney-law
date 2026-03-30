import { useParams } from "react-router-dom";
import Layout from "@site/components/layout/Layout";
import Seo from "@site/components/Seo";
import { useSiteSettings } from "@site/contexts/SiteSettingsContext";
import { resolveSeo } from "@site/utils/resolveSeo";
import { usePracticeAreaDetailContent } from "@site/hooks/usePracticeAreaDetailContent";
import PracticeAreaDetailHero from "./PracticeAreaDetailHero";
import PracticeAreaDetailSocialProof from "./PracticeAreaDetailSocialProof";
import PracticeAreaDetailContentSection from "./PracticeAreaDetailContentSection";
import PracticeAreaDetailFaq from "./PracticeAreaDetailFaq";
import NotFound from "@site/pages/NotFound";
import { useLocation } from "react-router-dom";

export default function PracticeAreaDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { pathname } = useLocation();
  const siteSettings = useSiteSettings();
  const siteUrl = siteSettings.settings.siteUrl || "";

  const { content, page, isLoading, notFound } = usePracticeAreaDetailContent(
    slug || ""
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (notFound || !page) {
    return <NotFound />;
  }

  const seo = resolveSeo(page as any, siteSettings.settings, pathname, siteUrl);

  return (
    <Layout>
      <Seo
        {...seo}
        ogTitle={page.og_title || undefined}
        ogDescription={page.og_description || undefined}
        schemaType={page.schema_type}
        schemaData={page.schema_data}
        pageContent={content}
      />

      <PracticeAreaDetailHero
        content={content.hero}
        headingTag={content.headingTags?.hero}
      />

      <PracticeAreaDetailSocialProof content={content.socialProof} />

      {content.contentSections.map((section, i) => (
        <PracticeAreaDetailContentSection key={i} section={section} index={i} />
      ))}

      <PracticeAreaDetailFaq
        content={content.faq}
        headingTag={content.headingTags?.faq}
      />
    </Layout>
  );
}
