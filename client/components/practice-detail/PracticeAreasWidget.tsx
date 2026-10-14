import { useId, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { normalizeCmsPath } from "@site/lib/cms/dynamicRoute";
import {
  getActiveGroupIndex,
  type PracticeAreaWidget,
} from "@site/lib/cms/officePracticeAreaWidgets";

interface Props {
  widget: PracticeAreaWidget;
}

const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-law-accent-dark";

export default function PracticeAreasWidget({ widget }: Props) {
  const baseId = useId();
  const headingId = `${baseId}-heading`;
  const currentPath = normalizeCmsPath(useLocation().pathname.toLowerCase());
  // One group open at a time; the group containing the current page starts open
  const [openIndex, setOpenIndex] = useState<number | null>(() =>
    getActiveGroupIndex(widget, currentPath),
  );

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
        {widget.groups.map((group, i) => {
          const isOpen = i === openIndex;
          const buttonId = `${baseId}-group-${i}`;
          const panelId = `${baseId}-panel-${i}`;
          return (
            <li
              key={group.label}
              className="border-b border-[#E2E4E0] last:border-b-0"
            >
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className={`${focusRingClass} flex w-full items-center justify-between gap-3 border-l-4 px-5 py-4 text-left font-outfit text-[14px] font-bold uppercase tracking-[0.08em] text-black transition-colors duration-300 ${
                  isOpen
                    ? "border-law-accent bg-white"
                    : "border-transparent hover:bg-white"
                }`}
              >
                {group.label}
                <ChevronDown
                  aria-hidden="true"
                  className={`h-5 w-5 shrink-0 transition-transform duration-300 motion-reduce:transition-none ${
                    isOpen ? "rotate-180 text-law-accent-dark" : "text-black/60"
                  }`}
                  strokeWidth={2}
                />
              </button>

              {/* Collapsed panels stay in the HTML so every link remains crawlable */}
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={`grid transition-all duration-300 motion-reduce:transition-none ${
                  isOpen
                    ? "visible grid-rows-[1fr]"
                    : "invisible grid-rows-[0fr]"
                }`}
              >
                <ul className="overflow-hidden">
                  {group.items.map((item) => {
                    const isCurrent = item.href === currentPath;
                    return (
                      <li key={item.href} className="border-t border-[#E2E4E0]">
                        <Link
                          to={item.href}
                          aria-current={isCurrent ? "page" : undefined}
                          className={`${focusRingClass} block border-l-4 py-[13px] pl-9 pr-5 font-outfit text-[16px] md:text-[17px] leading-snug transition-colors duration-300 ${
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
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
