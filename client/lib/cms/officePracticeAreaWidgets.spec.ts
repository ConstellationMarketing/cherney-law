import { describe, expect, it } from "vitest";
import {
  getPracticeAreaWidgetForPath,
  mariettaPracticeAreaWidget,
} from "./officePracticeAreaWidgets";

const MARIETTA_PAGES = [
  "/marietta-chapter-7-bankruptcy-attorney/",
  "/marietta-chapter-13-bankruptcy-attorney/",
  "/business-bankruptcy-lawyer-marietta/",
  "/marietta-foreclosure-attorney/",
  "/wage-garnishment-attorney-marietta/",
  "/marietta-debt-relief-lawyer/",
  "/marietta-debt-settlement-attorney/",
  "/loan-modification-attorney-marietta/",
  "/marietta-student-loan-lawyer/",
  "/credit-report-attorney-marietta/",
];

describe("mariettaPracticeAreaWidget", () => {
  it("lists the grouped practice area links from the widget spec", () => {
    expect(
      mariettaPracticeAreaWidget.groups.map((group) => ({
        label: group.label,
        href: group.href,
        items: group.items.map((item) => [item.label, item.href]),
      })),
    ).toEqual([
      {
        label: "Bankruptcy",
        href: undefined,
        items: [
          ["Chapter 7 Bankruptcy", "/marietta-chapter-7-bankruptcy-attorney/"],
          ["Chapter 13 Bankruptcy", "/marietta-chapter-13-bankruptcy-attorney/"],
          ["Business Bankruptcy", "/business-bankruptcy-lawyer-marietta/"],
        ],
      },
      {
        label: "Debt Protection",
        href: undefined,
        items: [
          ["Foreclosure Defense", "/marietta-foreclosure-attorney/"],
          ["Wage Garnishment", "/wage-garnishment-attorney-marietta/"],
        ],
      },
      {
        label: "Debt Relief",
        href: "/marietta-debt-relief-lawyer/",
        items: [
          ["Debt Settlement", "/marietta-debt-settlement-attorney/"],
          ["Loan Modification", "/loan-modification-attorney-marietta/"],
          ["Student Loan Debt", "/marietta-student-loan-lawyer/"],
          ["Credit Report Disputes", "/credit-report-attorney-marietta/"],
        ],
      },
    ]);
  });
});

describe("getPracticeAreaWidgetForPath", () => {
  it.each(MARIETTA_PAGES)("returns the Marietta widget for %s", (path) => {
    expect(getPracticeAreaWidgetForPath(path)).toBe(mariettaPracticeAreaWidget);
  });

  it("matches paths without a trailing slash or with different casing", () => {
    expect(getPracticeAreaWidgetForPath("/marietta-chapter-7-bankruptcy-attorney")).toBe(
      mariettaPracticeAreaWidget,
    );
    expect(getPracticeAreaWidgetForPath("/Marietta-Foreclosure-Attorney/")).toBe(
      mariettaPracticeAreaWidget,
    );
  });

  it("returns null for pages outside the Marietta office list", () => {
    expect(getPracticeAreaWidgetForPath("/bankruptcy-areas-of-specialty/chapter-13-bankruptcy/")).toBeNull();
    expect(getPracticeAreaWidgetForPath("/areas-we-serve/marietta-bankruptcy-lawyer/")).toBeNull();
    expect(getPracticeAreaWidgetForPath("/")).toBeNull();
    expect(getPracticeAreaWidgetForPath(undefined)).toBeNull();
  });
});
