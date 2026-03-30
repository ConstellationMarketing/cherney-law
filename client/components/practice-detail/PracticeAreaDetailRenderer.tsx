import type { PracticeAreaDetailPageContent } from "@site/lib/cms/practiceAreaDetailPageTypes";
import { defaultPracticeAreaDetailContent } from "@site/lib/cms/practiceAreaDetailPageTypes";
import PracticeAreaDetailHero from "./PracticeAreaDetailHero";
import PracticeAreaDetailSocialProof from "./PracticeAreaDetailSocialProof";
import PracticeAreaDetailContentSection from "./PracticeAreaDetailContentSection";
import PracticeAreaDetailFaq from "./PracticeAreaDetailFaq";

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
}

export default function PracticeAreaDetailRenderer({ content: rawContent }: Props) {
  const content = deepMerge(defaultPracticeAreaDetailContent, rawContent);

  return (
    <>
      <PracticeAreaDetailHero
        content={content.hero}
        headingTag={content.headingTags?.hero}
      />
      <PracticeAreaDetailSocialProof content={content.socialProof} />
      {content.contentSections.map((section: any, i: number) => (
        <PracticeAreaDetailContentSection key={i} section={section} index={i} />
      ))}
      <PracticeAreaDetailFaq
        content={content.faq}
        headingTag={content.headingTags?.faq}
      />
    </>
  );
}
