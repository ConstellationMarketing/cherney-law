// Office-specific "Practice Areas" sidebar widgets shown on practice detail pages

import { normalizeCmsPath } from "@site/lib/cms/dynamicRoute";

export interface PracticeAreaWidgetLink {
  label: string;
  href: string;
}

export interface PracticeAreaWidgetGroup {
  label: string;
  // Optional link for the group heading itself
  href?: string;
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
      href: "/marietta-debt-relief-lawyer/",
      items: [
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
