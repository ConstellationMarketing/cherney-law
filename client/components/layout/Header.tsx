import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, ArrowRight, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSiteSettings } from "@site/contexts/SiteSettingsContext";

interface HeaderProps {
  /** When true, the green top bar is made transparent so an underlying
   *  hero background image shows through (used on Homepage-2). */
  transparentTopBar?: boolean;
}

export default function Header({ transparentTopBar = false }: HeaderProps) {
  const { settings } = useSiteSettings();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const navItems = [...settings.navigationItems]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .filter((item) => item.label); // Don't require href - dropdown parents may not have href

  return (
    <>
      {/* Green padding that scrolls away — transparent when hero bg covers it */}
      <div className={`h-[30px] ${transparentTopBar ? '' : 'bg-law-accent'}`}></div>

      {/* Sticky dark header (only this sticks to top) */}
      <div className="sticky top-0 z-[999] bg-transparent">
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

                  return navItems.map((item) => (
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
                            <button type="button" className={`${navItemClass} bg-transparent border-0 cursor-pointer`}>
                              {item.label}
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            sideOffset={8}
                            className="bg-law-dark border border-law-border z-50"
                          >
                            {item.children.map((child) => (
                              <DropdownMenuItem
                                key={child.id || child.href}
                                asChild
                              >
                                <Link
                                  to={child.href || "#"}
                                  className="font-outfit text-[19px] text-white hover:bg-law-accent hover:text-black transition-colors cursor-pointer px-4 py-3"
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
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        // Simple link (no dropdown)
                        <Link
                          to={item.href || "#"}
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
                  ));
                })()}
              </ul>
            </nav>

            {/* Contact CTA Button - Desktop */}
            <div className="hidden md:block w-[280px] ml-6">
              <Link to={settings.headerCtaUrl}>
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
                                to={item.href}
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
                            {item.children.map((child) => (
                              <Link
                                key={child.id || child.href}
                                to={child.href || "#"}
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
                            ))}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ) : (
                      // Simple link (no accordion)
                      <Link
                        key={item.id || item.href}
                        to={item.href || "#"}
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
                  <Link to={settings.headerCtaUrl} className="mt-4">
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
