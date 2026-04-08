import { describe, expect, it } from "vitest";
import {
  defaultPracticeAreasContent,
  normalizePracticeAreasPageContent,
} from "./practiceAreasPageTypes";

describe("normalizePracticeAreasPageContent", () => {
  it("normalizes legacy tab and grid field names into the canonical practice-areas schema", () => {
    const normalized = normalizePracticeAreasPageContent({
      hero: {
        sectionLabel: "Practice Areas",
        tagline: "Practice Area Help",
        subtext: "Subtext",
      },
      tabs: [
        {
          tabLabel: "Debt Relief",
          heading: "Debt Relief Options",
          content: "<p>Tab content</p>",
        } as never,
      ],
      grid: {
        heading: "Our Practice Areas",
        description: "Grid description",
        areas: [
          {
            title: "Chapter 7",
            description: "Description",
            icon: "FileText",
            image: "https://example.com/chapter-7.jpg",
            href: "/practice-areas/chapter-7",
          } as never,
        ],
      },
      cta: defaultPracticeAreasContent.cta,
      faq: defaultPracticeAreasContent.faq,
    });

    expect(normalized.tabs[0]).toEqual({
      title: "Debt Relief",
      content: "<p>Tab content</p>",
    });
    expect(normalized.grid.areas[0].link).toBe("/practice-areas/chapter-7");
  });

  it("falls back to default content when arrays are empty after normalization", () => {
    const normalized = normalizePracticeAreasPageContent({
      tabs: [{ tabLabel: "", heading: "", content: "" } as never],
      grid: {
        heading: "",
        description: "",
        areas: [{ title: "", description: "", icon: "", image: "", href: "" } as never],
      },
      faq: {
        heading: "",
        items: [{ question: "", answer: "" }],
      },
    });

    expect(normalized.tabs).toEqual(defaultPracticeAreasContent.tabs);
    expect(normalized.grid.areas).toEqual(defaultPracticeAreasContent.grid.areas);
    expect(normalized.faq.items).toEqual(defaultPracticeAreasContent.faq.items);
  });
});
