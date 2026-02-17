import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Seo from '@site/components/Seo';
import Layout from '@site/components/layout/Layout';
import { Button } from '@site/components/ui/button';
import { useSiteSettings } from '@site/contexts/SiteSettingsContext';
import { resolveSeo } from '@site/utils/resolveSeo';

const NotFound = () => {
  const location = useLocation();
  const siteSettings = useSiteSettings();
  const { pathname } = location;
  const siteUrl = import.meta.env.VITE_SITE_URL || '';

  // Create a synthetic page object for 404
  const notFoundPage = {
    meta_title: '404 - Page Not Found',
    meta_description: 'The page you are looking for does not exist.',
    canonical_url: null,
    og_title: null,
    og_description: null,
    og_image: null,
    noindex: true, // Always noindex 404 pages
    url_path: pathname,
    title: '404 - Page Not Found',
  };

  const seo = resolveSeo(notFoundPage, siteSettings, pathname, siteUrl);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <Layout>
      <Seo {...seo} />
      
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <h1 className="font-playfair text-[clamp(4rem,10vw,120px)] font-light text-law-accent mb-4">
            404
          </h1>
          <p className="font-outfit text-[28px] text-white mb-4">
            Oops! Page not found
          </p>
          <p className="font-outfit text-[18px] text-white/70 mb-8">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <Link to="/">
            <Button className="bg-law-accent text-black font-outfit text-[20px] px-8 py-6 h-auto hover:bg-law-accent/90">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
