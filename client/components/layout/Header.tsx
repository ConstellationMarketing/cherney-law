import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, ArrowRight } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Header() {
  const navItems = [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about" },
    { label: "Practice Areas", href: "/practice-areas" },
  ];

  return (
    <>
      {/* Green padding that scrolls away */}
      <div className="bg-law-accent h-[30px]"></div>

      {/* Sticky dark header */}
      <div className="sticky top-0 z-50 bg-[#161715]">
        <div className="max-w-[2560px] mx-auto w-[95%]">
          <div className="border border-law-border px-[30px] py-[10px] flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center w-[300px]">
              <Link to="/" className="mr-[30px]">
                <img
                  src="/images/logos/firm-logo.png"
                  alt="Constellation Law Firm"
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
              <Link to="/contact">
                <Button className="bg-white text-black font-outfit text-[22px] py-[25px] px-[15.4px] h-auto w-[200px] hover:bg-law-accent hover:text-white transition-all duration-300 flex items-center justify-center gap-2">
                  Contact Us
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
                  <Link to="/contact" className="mt-4">
                    <Button className="bg-white text-black font-outfit text-[22px] py-[25px] w-full hover:bg-law-accent hover:text-white transition-all duration-300 flex items-center justify-center gap-2">
                      Contact Us
                      <ArrowRight className="w-5 h-5 group-hover:text-white" />
                    </Button>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </>
  );
}
