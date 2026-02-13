import { Link } from "react-router-dom";
import Seo from "@site/components/Seo";
import Layout from "@site/components/layout/Layout";
import StatsGrid from "@site/components/shared/StatsGrid";
import { useAboutContent } from "@site/hooks/useAboutContent";
import { useGlobalPhone } from "@site/contexts/SiteSettingsContext";
import AboutHero from "@site/components/about/AboutHero";
import AboutStory from "@site/components/about/AboutStory";
import AboutMissionVision from "@site/components/about/AboutMissionVision";
import AboutFeatureBoxes from "@site/components/about/AboutFeatureBoxes";
import AboutWhyChooseUs from "@site/components/about/AboutWhyChooseUs";
import AboutCTA from "@site/components/about/AboutCTA";

export default function AboutUs() {
  const { content } = useAboutContent();
  const { phoneDisplay, phoneLabel } = useGlobalPhone();

  return (
    <Layout>
      <Seo
        title="About Us"
        description="Learn about Attorney Matthew J. Cherney and Cherney Law Firm — experienced bankruptcy representation in Cobb County, Cherokee County, and Fulton County."
      />

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

      <AboutFeatureBoxes featureBoxes={content.featureBoxes} />

      {/* Stats Section */}
      <div className="bg-white py-[30px] md:py-[40px]">
        <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%]">
          <StatsGrid stats={content.stats.stats} />
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
