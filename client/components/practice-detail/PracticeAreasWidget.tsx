import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Link, useLocation } from "react-router-dom";
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
  const [activeIndex, setActiveIndex] = useState(() =>
    getActiveGroupIndex(widget, currentPath),
  );
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectTab = (index: number) => {
    setActiveIndex(index);
    tabRefs.current[index]?.focus();
  };

  // Arrow keys / Home / End move between tabs (WAI-ARIA tabs pattern)
  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const lastIndex = widget.groups.length - 1;
    const keyTargets: Record<string, number> = {
      ArrowRight: activeIndex === lastIndex ? 0 : activeIndex + 1,
      ArrowLeft: activeIndex === 0 ? lastIndex : activeIndex - 1,
      Home: 0,
      End: lastIndex,
    };
    if (event.key in keyTargets) {
      event.preventDefault();
      selectTab(keyTargets[event.key]);
    }
  };

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

      <div
        role="tablist"
        aria-label={`${widget.heading} categories`}
        className="grid border-b border-[#E2E4E0]"
        style={{
          gridTemplateColumns: `repeat(${widget.groups.length}, minmax(0, 1fr))`,
        }}
      >
        {widget.groups.map((group, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={group.label}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${i}`}
              aria-selected={isActive}
              aria-controls={`${baseId}-panel-${i}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveIndex(i)}
              onKeyDown={handleTabKeyDown}
              className={`${focusRingClass} -mb-px border-b-[3px] px-2 py-3 font-outfit text-[15px] font-bold leading-tight transition-colors duration-300 [&:not(:last-child)]:border-r [&:not(:last-child)]:border-r-[#E2E4E0] ${
                isActive
                  ? "border-b-law-accent bg-white text-black"
                  : "border-b-transparent bg-[#E9EBE7] text-black/70 hover:bg-[#F4F5F3] hover:text-black"
              }`}
            >
              {group.label}
            </button>
          );
        })}
      </div>

      {/* All panels stay in the HTML so every link remains crawlable */}
      {widget.groups.map((group, i) => (
        <div
          key={group.label}
          role="tabpanel"
          id={`${baseId}-panel-${i}`}
          aria-labelledby={`${baseId}-tab-${i}`}
          hidden={i !== activeIndex}
        >
          <ul>
            {group.items.map((item) => {
              const isCurrent = item.href === currentPath;
              return (
                <li
                  key={item.href}
                  className="border-b border-[#E2E4E0] last:border-b-0"
                >
                  <Link
                    to={item.href}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`${focusRingClass} block border-l-4 px-5 py-[14px] font-outfit text-[16px] md:text-[17px] leading-snug transition-colors duration-300 ${
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
      ))}
    </nav>
  );
}
