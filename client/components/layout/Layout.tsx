import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  /** When provided, this image is applied as the outer wrapper background so it
   *  extends behind the header as well as the hero section. */
  heroBg?: string;
}

export default function Layout({ children, heroBg }: LayoutProps) {
  return (
    <div
      className={`min-h-screen flex flex-col ${heroBg ? 'bg-cover bg-center bg-no-repeat' : 'bg-law-accent'}`}
      style={heroBg ? { backgroundImage: `url(${heroBg})` } : undefined}
    >
      <Header transparentTopBar={!!heroBg} />
      <main className="flex-1 bg-white">{children}</main>
      <Footer />
    </div>
  );
}
