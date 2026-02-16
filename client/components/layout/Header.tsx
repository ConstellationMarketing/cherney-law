import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, ArrowRight } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSiteSettings } from "@site/contexts/SiteSettingsContext";

export default function Header() {
  const { settings } = useSiteSettings();

  const navItems = [...settings.navigationItems]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .filter((item) => item.label && item.href);

  return (
    <>
      {/* Green padding that scrolls away */}
      <div className="bg-law-accent h-[30px]"></div>

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
                {navItems.map((item) => (
                  <li key={item.href} className="px-[11px]">
                    <Link
                      to={item.href}
                      className="font-outfit text-[20px] text-white py-[31px] mr-[20px] whitespace-nowrap hover:opacity-80 transition-opacity duration-400"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Contact CTA Button - Desktop */}
            <div className="hidden md:block w-[280px]">
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
                <nav className="flex flex-col gap-4 mt-8">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="font-outfit text-[20px] text-white py-[10px] px-[5%] border-b border-black/5 hover:opacity-80 transition-opacity"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Link to={settings.headerCtaUrl} className="mt-4">
                    <Button className="bg-white text-black font-outfit text-[22px] py-[25px] w-full border-2 border-transparent hover:border-black hover:bg-law-accent hover:text-white transition-all duration-300 flex items-center justify-center gap-2">
                      {settings.headerCtaText}
                      <ArrowRight className="w-5 h-5 group-hover:text-white" />
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
