import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  /** When provided, the header is made transparent so the hero section's
   *  background image shows through behind it. */
  heroBg?: string;
}

export default function Layout({ children, heroBg }: LayoutProps) {
  const hasHeroBg = !!heroBg;
  return (
    <div className={`min-h-screen flex flex-col ${hasHeroBg ? '' : 'bg-law-accent'}`}>
      <Header transparentTopBar={hasHeroBg} />
      <main className="flex-1 bg-white">{children}</main>
      <Footer />
    </div>
  );
}
