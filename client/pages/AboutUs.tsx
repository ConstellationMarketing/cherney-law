import { useLocation } from "react-router-dom";
import Seo from "@site/components/Seo";
import Layout from "@site/components/layout/Layout";
import StatsGrid from "@site/components/shared/StatsGrid";
import { useAboutContent } from "@site/hooks/useAboutContent";
import { useHomeContent } from "@site/hooks/useHomeContent";
import { useGlobalPhone, useSiteSettings } from "@site/contexts/SiteSettingsContext";
import { resolveSeo } from "@site/utils/resolveSeo";
import AboutHero from "@site/components/about/AboutHero";
import AboutStory from "@site/components/about/AboutStory";
import AboutMissionVision from "@site/components/about/AboutMissionVision";
import AboutFeatureBoxes from "@site/components/about/AboutFeatureBoxes";
import AboutWhyChooseUs from "@site/components/about/AboutWhyChooseUs";
import AboutCTA from "@site/components/about/AboutCTA";

export default function AboutUs() {
  const { content, page } = useAboutContent();
  const { content: homeContent } = useHomeContent();
  const { phoneDisplay, phoneLabel } = useGlobalPhone();
  const siteSettings = useSiteSettings();
  const { pathname } = useLocation();
  const siteUrl = import.meta.env.VITE_SITE_URL || '';

  // Centralized SEO resolution
  const seo = resolveSeo(page, siteSettings, pathname, siteUrl);

  // Feature boxes and stats are managed on the homepage CMS only
  const featureBoxes = homeContent.hero.featureBoxes;
  const stats = homeContent.about.stats;

  return (
    <Layout>
      <Seo {...seo} />

      <AboutHero
        content={content.hero}
        phoneDisplay={phoneDisplay}
        phoneLabel={phoneLabel}
      />

      <AboutStory
        content={content.story}
        phoneDisplay={phoneDisplay}
        phoneLabel={phoneLabel}
      />

      <AboutMissionVision content={content.missionVision} />

      <AboutFeatureBoxes featureBoxes={featureBoxes} />

      {/* Stats Section */}
      <div className="bg-white py-[30px] md:py-[40px]">
        <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%]">
          <StatsGrid stats={stats} />
        </div>
      </div>

      <AboutWhyChooseUs content={content.whyChooseUs} />

      <AboutCTA
        content={content.cta}
        phoneDisplay={phoneDisplay}
        phoneLabel={phoneLabel}
      />
    </Layout>
  );
}
