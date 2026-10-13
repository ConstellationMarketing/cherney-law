import { useId } from "react";
import { Link, useLocation } from "react-router-dom";
import { normalizeCmsPath } from "@site/lib/cms/dynamicRoute";
import type { PracticeAreaWidget } from "@site/lib/cms/officePracticeAreaWidgets";

interface Props {
  widget: PracticeAreaWidget;
}

const linkBaseClass =
  "block font-outfit transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-law-accent-dark";

export default function PracticeAreasWidget({ widget }: Props) {
  const headingId = useId();
  const currentPath = normalizeCmsPath(useLocation().pathname.toLowerCase());

  return (
    <nav
      aria-labelledby={headingId}
      className="w-full overflow-hidden rounded-[10px] bg-[#F4F5F3]"
    >
      <p
        id={headingId}
        className="bg-law-accent px-5 py-5 text-center font-outfit text-[26px] md:text-[30px] font-semibold leading-tight text-black"
      >
        {widget.heading}
      </p>

      <ul>
        {widget.groups.map((group) => {
          const isGroupCurrent = group.href === currentPath;
          return (
            <li key={group.label} className="border-b border-[#E2E4E0] last:border-b-0">
              {group.href ? (
                <Link
                  to={group.href}
                  aria-current={isGroupCurrent ? "page" : undefined}
                  className={`${linkBaseClass} border-l-4 px-5 pt-5 pb-2 text-[14px] font-bold uppercase tracking-[0.08em] text-black ${
                    isGroupCurrent
                      ? "border-law-accent bg-white"
                      : "border-transparent hover:bg-white hover:text-law-accent-dark"
                  }`}
                >
                  {group.label}
                </Link>
              ) : (
                <p className="border-l-4 border-transparent px-5 pt-5 pb-2 font-outfit text-[14px] font-bold uppercase tracking-[0.08em] text-black">
                  {group.label}
                </p>
              )}

              <ul>
                {group.items.map((item) => {
                  const isCurrent = item.href === currentPath;
                  return (
                    <li key={item.href} className="border-t border-[#E2E4E0]">
                      <Link
                        to={item.href}
                        aria-current={isCurrent ? "page" : undefined}
                        className={`${linkBaseClass} border-l-4 px-5 py-[14px] text-[16px] md:text-[17px] leading-snug ${
                          isCurrent
                            ? "border-law-accent bg-white font-semibold text-black"
                            : "border-transparent text-[#1F2220] hover:bg-white hover:text-law-accent-dark"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
