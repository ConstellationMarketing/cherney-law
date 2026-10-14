// Office-specific "Practice Areas" sidebar widgets shown on practice detail pages

import { normalizeCmsPath } from "@site/lib/cms/dynamicRoute";

export interface PracticeAreaWidgetLink {
  label: string;
  href: string;
}

// Each group is an expandable section; its items are the links shown when it opens
export interface PracticeAreaWidgetGroup {
  label: string;
  items: PracticeAreaWidgetLink[];
}

export interface PracticeAreaWidget {
  heading: string;
  groups: PracticeAreaWidgetGroup[];
  // Normalized URL paths (with trailing slash) that display this widget
  pagePaths: string[];
}

export const mariettaPracticeAreaWidget: PracticeAreaWidget = {
  heading: "Practice Areas",
  groups: [
    {
      label: "Bankruptcy",
      items: [
        { label: "Chapter 7 Bankruptcy", href: "/marietta-chapter-7-bankruptcy-attorney/" },
        { label: "Chapter 13 Bankruptcy", href: "/marietta-chapter-13-bankruptcy-attorney/" },
        { label: "Business Bankruptcy", href: "/business-bankruptcy-lawyer-marietta/" },
      ],
    },
    {
      label: "Debt Protection",
      items: [
        { label: "Foreclosure Defense", href: "/marietta-foreclosure-attorney/" },
        { label: "Wage Garnishment", href: "/wage-garnishment-attorney-marietta/" },
      ],
    },
    {
      label: "Debt Relief",
      items: [
        { label: "Debt Relief", href: "/marietta-debt-relief-lawyer/" },
        { label: "Debt Settlement", href: "/marietta-debt-settlement-attorney/" },
        { label: "Loan Modification", href: "/loan-modification-attorney-marietta/" },
        { label: "Student Loan Debt", href: "/marietta-student-loan-lawyer/" },
        { label: "Credit Report Disputes", href: "/credit-report-attorney-marietta/" },
      ],
    },
  ],
  pagePaths: [
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
  ],
};

const officePracticeAreaWidgets: PracticeAreaWidget[] = [mariettaPracticeAreaWidget];

export function getPracticeAreaWidgetForPath(
  pathname: string | undefined,
): PracticeAreaWidget | null {
  if (!pathname) return null;
  const normalizedPath = normalizeCmsPath(pathname.toLowerCase());
  return (
    officePracticeAreaWidgets.find((widget) =>
      widget.pagePaths.includes(normalizedPath),
    ) ?? null
  );
}

// Index of the group containing the current page, so it starts open
export function getActiveGroupIndex(
  widget: PracticeAreaWidget,
  pathname: string,
): number {
  const normalizedPath = normalizeCmsPath(pathname.toLowerCase());
  const index = widget.groups.findIndex((group) =>
    group.items.some((item) => item.href === normalizedPath),
  );
  return index === -1 ? 0 : index;
}
