import type { PracticeAreaDetailPageContent } from "@site/lib/cms/practiceAreaDetailPageTypes";
import { defaultPracticeAreaDetailContent } from "@site/lib/cms/practiceAreaDetailPageTypes";
import PracticeAreaDetailHero from "./PracticeAreaDetailHero";
import PracticeAreaDetailSocialProof from "./PracticeAreaDetailSocialProof";
import PracticeAreaDetailContentSection from "./PracticeAreaDetailContentSection";
import PracticeAreaDetailFaq from "./PracticeAreaDetailFaq";
import PracticeAreasWidget from "./PracticeAreasWidget";
import { getPracticeAreaWidgetForPath } from "@site/lib/cms/officePracticeAreaWidgets";

function deepMerge(defaults: any, cms: any): any {
  if (!cms || typeof cms !== "object") return defaults;
  if (Array.isArray(defaults)) return Array.isArray(cms) ? cms : defaults;
  const result = { ...defaults };
  for (const key of Object.keys(cms)) {
    if (cms[key] !== undefined && cms[key] !== null) {
      if (typeof cms[key] === "object" && !Array.isArray(cms[key]) && typeof defaults[key] === "object" && !Array.isArray(defaults[key])) {
        result[key] = deepMerge(defaults[key], cms[key]);
      } else {
        result[key] = cms[key];
      }
    }
  }
  return result;
}

interface Props {
  content: PracticeAreaDetailPageContent;
  lastUpdated?: string;
  pathname?: string;
}

export default function PracticeAreaDetailRenderer({
  content: rawContent,
  lastUpdated,
  pathname,
}: Props) {
  const content = deepMerge(defaultPracticeAreaDetailContent, rawContent);
  const widget = getPracticeAreaWidgetForPath(pathname);

  return (
    <>
      <PracticeAreaDetailHero
        content={content.hero}
        headingTag={content.headingTags?.hero}
        lastUpdated={lastUpdated}
      />
      <PracticeAreaDetailSocialProof content={content.socialProof} />
      {content.contentSections.map((section: any, i: number) => (
        <PracticeAreaDetailContentSection
          key={i}
          section={section}
          index={i}
          sidebar={i === 0 && widget ? <PracticeAreasWidget widget={widget} /> : undefined}
        />
      ))}
      <PracticeAreaDetailFaq
        content={content.faq}
        headingTag={content.headingTags?.faq}
      />
    </>
  );
}
