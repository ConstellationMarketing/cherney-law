import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, ArrowRight, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSiteSettings, type NavigationItem } from "@site/contexts/SiteSettingsContext";

interface HeaderProps {
  /** When true, the green top bar is made transparent so an underlying
   *  hero background image shows through (used on Homepage-2). */
  transparentTopBar?: boolean;
}

function normalizeInternalHref(href?: string, external?: boolean) {
  if (!href || external) return href || "#";
  if (
    href.startsWith("/") ||
    href.startsWith("#") ||
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) {
    return href;
  }

  return `/${href}`;
}

function chunkMenuItems<T>(items: T[], chunkSize: number): T[][] {
  if (chunkSize <= 0) return [items];

  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

export default function Header({ transparentTopBar = false }: HeaderProps) {
  const { settings } = useSiteSettings();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const navItems = [...settings.navigationItems]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .filter((item) => item.label); // Don't require href - dropdown parents may not have href

  return (
    <>
      {/* Green padding that scrolls away — hidden when hero bg covers header */}
      {!transparentTopBar && <div className="bg-law-accent h-[30px]"></div>}

      {/* Sticky dark header (only this sticks to top) */}
      <div className={`sticky z-[999] bg-transparent${transparentTopBar ? ' top-[-30px] pt-[30px]' : ' top-0'}`}>
        <div className="max-w-[2560px] w-[95%] mx-auto bg-[#161715] border border-law-border px-[30px] py-[10px] flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center w-[300px]">
              <Link to="/" className="mr-[30px]">
                <img
                  src={settings.logoUrl}
                  alt={settings.logoAlt}
                  className="w-[306px] max-w-full"
                  width={306}
                  height={50}
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center flex-1 justify-end">
              <ul className="flex flex-wrap justify-end -mx-[11px]">
                {(() => {
                  // Shared class for both link and trigger to ensure identical alignment
                  const navItemClass =
                    "font-outfit text-[20px] text-white py-[31px] whitespace-nowrap hover:opacity-80 transition-opacity duration-400 inline-flex items-center gap-1";

                  return navItems.map((item) => {
                    const childColumns = item.children?.length
                      ? chunkMenuItems(item.children, 10)
                      : [];

                    const renderDropdownItem = (child: NavigationItem) => {
                      if (child.children && child.children.length > 0) {
                        return (
                          <DropdownMenuSub key={child.id || child.href || child.label}>
                            <DropdownMenuSubTrigger className="font-outfit font-normal text-[17px] leading-[1.25] text-white hover:bg-law-accent hover:text-black focus:bg-transparent focus:text-white data-[state=open]:bg-transparent data-[state=open]:text-white transition-colors cursor-pointer px-4 py-3 rounded-none">
                              {child.label}
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="bg-law-dark border border-law-border z-50 p-1">
                              {child.children.map((grandchild) => (
                                <DropdownMenuItem key={grandchild.id || grandchild.href || grandchild.label} asChild>
                                  <Link
                                    to={normalizeInternalHref(grandchild.href, grandchild.external || grandchild.openInNewTab)}
                                    className="font-outfit font-normal text-[17px] leading-[1.25] text-white hover:bg-law-accent hover:text-black transition-colors cursor-pointer px-4 py-3"
                                    target={
                                      grandchild.external || grandchild.openInNewTab
                                        ? "_blank"
                                        : undefined
                                    }
                                    rel={
                                      grandchild.external || grandchild.openInNewTab
                                        ? "noopener noreferrer"
                                        : undefined
                                    }
                                  >
                                    {grandchild.label}
                                  </Link>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        );
                      }

                      return (
                        <DropdownMenuItem key={child.id || child.href || child.label} asChild>
                          <Link
                            to={normalizeInternalHref(child.href, child.external || child.openInNewTab)}
                            className="font-outfit font-normal text-[17px] leading-[1.25] text-white hover:bg-law-accent hover:text-black transition-colors cursor-pointer px-4 py-3"
                            target={
                              child.external || child.openInNewTab
                                ? "_blank"
                                : undefined
                            }
                            rel={
                              child.external || child.openInNewTab
                                ? "noopener noreferrer"
                                : undefined
                            }
                          >
                            {child.label}
                          </Link>
                        </DropdownMenuItem>
                      );
                    };

                    return (
                    <li
                      key={item.id || item.href}
                      className={item.children?.length ? "px-[11px] relative" : "px-[11px]"}
                      onMouseEnter={() => item.children?.length && setOpenDropdown(item.id || item.href || item.label)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      {item.children && item.children.length > 0 ? (
                        // Item with dropdown - no wrapper, DropdownMenu is direct child
                        <DropdownMenu
                          open={openDropdown === (item.id || item.href || item.label)}
                          onOpenChange={(open) => setOpenDropdown(open ? (item.id || item.href || item.label) : null)}
                        >
                          <DropdownMenuTrigger asChild>
                            <button type="button" className={`${navItemClass} bg-transparent border-0 cursor-pointer outline-none focus:outline-none`}>
                              {item.label}
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            sideOffset={8}
                            className="bg-law-dark border border-law-border z-50"
                          >
                            <div className="grid grid-flow-col auto-cols-max divide-x divide-law-border">
                              {childColumns.map((column, columnIndex) => (
                                <div
                                  key={`${item.id || item.href || item.label}-column-${columnIndex}`}
                                  className="py-1"
                                >
                                  {column.map((child) => renderDropdownItem(child))}
                                </div>
                              ))}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        // Simple link (no dropdown)
                        <Link
                          to={normalizeInternalHref(item.href, item.external || item.openInNewTab)}
                          className={navItemClass}
                          target={
                            item.external || item.openInNewTab
                              ? "_blank"
                            : undefined
                          }
                          rel={
                            item.external || item.openInNewTab
                              ? "noopener noreferrer"
                              : undefined
                          }
                        >
                          {item.label}
                        </Link>
                      )}
                    </li>
                  );
                  });
                })()}
              </ul>
            </nav>

            {/* Contact CTA Button - Desktop */}
            <div className="hidden md:block w-[280px] ml-6">
              <Link to={normalizeInternalHref(settings.headerCtaUrl)}>
                <Button className="bg-white text-black font-outfit text-[22px] py-[25px] px-[15.4px] h-auto w-[200px] border-2 border-transparent hover:border-black hover:bg-law-accent hover:text-white transition-all duration-300 flex items-center justify-center gap-2">
                  {settings.headerCtaText}
                  <ArrowRight className="w-5 h-5 group-hover:text-white" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="text-white">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="bg-law-card border-law-border"
              >
                <nav className="flex flex-col gap-2 mt-8">
                  {navItems.map((item) =>
                    item.children && item.children.length > 0 ? (
                      // Item with accordion dropdown
                      <Accordion
                        key={item.id || item.href || item.label}
                        type="single"
                        collapsible
                      >
                        <AccordionItem
                          value={item.id || item.href || item.label}
                          className="border-b border-black/5"
                        >
                          <AccordionTrigger className="font-outfit text-[20px] text-white py-[10px] px-[5%] hover:no-underline hover:opacity-80">
                            {item.href ? (
                              <Link
                                to={normalizeInternalHref(item.href, item.external || item.openInNewTab)}
                                className="flex-1 text-left"
                                onClick={(e) => e.stopPropagation()}
                                target={
                                  item.external || item.openInNewTab
                                    ? "_blank"
                                    : undefined
                                }
                                rel={
                                  item.external || item.openInNewTab
                                    ? "noopener noreferrer"
                                    : undefined
                                }
                              >
                                {item.label}
                              </Link>
                            ) : (
                              <span className="flex-1 text-left">
                                {item.label}
                              </span>
                            )}
                          </AccordionTrigger>
                          <AccordionContent className="pl-8 space-y-1">
                            {item.children.map((child) =>
                              child.children && child.children.length > 0 ? (
                                <Accordion
                                  key={child.id || child.href || child.label}
                                  type="single"
                                  collapsible
                                  className="border-b border-black/10"
                                >
                                  <AccordionItem value={`${item.id || item.label}-${child.id || child.label}`}>
                                    <AccordionTrigger className="font-outfit text-[18px] text-gray-300 py-2 hover:no-underline hover:text-law-accent">
                                      {child.href ? (
                                        <Link
                                          to={normalizeInternalHref(child.href, child.external || child.openInNewTab)}
                                          className="flex-1 text-left"
                                          onClick={(e) => e.stopPropagation()}
                                          target={
                                            child.external || child.openInNewTab
                                              ? "_blank"
                                              : undefined
                                          }
                                          rel={
                                            child.external || child.openInNewTab
                                              ? "noopener noreferrer"
                                              : undefined
                                          }
                                        >
                                          {child.label}
                                        </Link>
                                      ) : (
                                        <span className="flex-1 text-left">{child.label}</span>
                                      )}
                                    </AccordionTrigger>
                                    <AccordionContent className="pl-5 space-y-1">
                                      {child.children.map((grandchild) => (
                                        <Link
                                          key={grandchild.id || grandchild.href || grandchild.label}
                                          to={normalizeInternalHref(grandchild.href, grandchild.external || grandchild.openInNewTab)}
                                          className="block font-outfit text-[17px] text-gray-400 py-2 hover:text-law-accent transition-colors"
                                          target={
                                            grandchild.external || grandchild.openInNewTab
                                              ? "_blank"
                                              : undefined
                                          }
                                          rel={
                                            grandchild.external || grandchild.openInNewTab
                                              ? "noopener noreferrer"
                                              : undefined
                                          }
                                        >
                                          {grandchild.label}
                                        </Link>
                                      ))}
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              ) : (
                                <Link
                                  key={child.id || child.href || child.label}
                                  to={normalizeInternalHref(child.href, child.external || child.openInNewTab)}
                                  className="block font-outfit text-[18px] text-gray-300 py-2 hover:text-law-accent transition-colors"
                                  target={
                                    child.external || child.openInNewTab
                                      ? "_blank"
                                      : undefined
                                  }
                                  rel={
                                    child.external || child.openInNewTab
                                      ? "noopener noreferrer"
                                      : undefined
                                  }
                                >
                                  {child.label}
                                </Link>
                              )
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ) : (
                      // Simple link (no accordion)
                      <Link
                        key={item.id || item.href}
                        to={normalizeInternalHref(item.href, item.external || item.openInNewTab)}
                        className="font-outfit text-[20px] text-white py-[10px] px-[5%] border-b border-black/5 hover:opacity-80 transition-opacity"
                        target={
                          item.external || item.openInNewTab
                            ? "_blank"
                            : undefined
                        }
                        rel={
                          item.external || item.openInNewTab
                            ? "noopener noreferrer"
                            : undefined
                        }
                      >
                        {item.label}
                      </Link>
                    )
                  )}
                  <Link to={normalizeInternalHref(settings.headerCtaUrl)} className="mt-4">
                    <Button className="bg-white text-black font-outfit text-[22px] py-[25px] w-full border-2 border-transparent hover:border-black hover:bg-law-accent hover:text-white transition-all duration-300 flex items-center justify-center gap-2">
                      {settings.headerCtaText}
                      <ArrowRight className="w-5 w-5 group-hover:text-white" />
                    </Button>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
        </div>
      </div>
    </>
  );
}
