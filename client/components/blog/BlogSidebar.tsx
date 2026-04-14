import { useEffect, useState } from "react";
import { useGlobalPhone } from "@site/contexts/SiteSettingsContext";
import { Link } from "react-router-dom";
import type { BlogSidebarSettings } from "@site/lib/cms/blogTypes";
import { fetchSupabaseJson } from "@site/lib/cms/api";

let sidebarCache: BlogSidebarSettings | null = null;

export async function loadBlogSidebarSettings(): Promise<BlogSidebarSettings | null> {
  if (sidebarCache) {
    return sidebarCache;
  }

  try {
    const data = await fetchSupabaseJson<BlogSidebarSettings[]>(
      "/rest/v1/blog_sidebar_settings?select=*&limit=1",
    );

    if (Array.isArray(data) && data.length > 0) {
      sidebarCache = data[0];
    }
  } catch (err) {
    console.error("[BlogSidebar] Error:", err);
  }

  return sidebarCache;
}

export function primeBlogSidebarCache(settings: BlogSidebarSettings | null) {
  sidebarCache = settings;
}

export default function BlogSidebar() {
  const { phoneDisplay, phoneNumber } = useGlobalPhone();
  const [sidebar, setSidebar] = useState<BlogSidebarSettings | null>(sidebarCache);

  useEffect(() => {
    if (sidebarCache) return;

    let isMounted = true;

    loadBlogSidebarSettings().then((settings) => {
      if (!isMounted) return;
      setSidebar(settings);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      {sidebar?.attorney_image && (
        <div className="relative overflow-hidden">
          <img
            src={sidebar.attorney_image}
            alt="Attorney"
            className="w-full h-auto object-cover"
            loading="lazy"
          />
          <div className="absolute bottom-0 left-0 right-0 h-[60px] bg-gradient-to-t from-[#1a1a2e] to-transparent pointer-events-none" />
        </div>
      )}

      <div className="bg-[#1a1a2e] p-6 text-center space-y-4">
        <h3 className="font-playfair text-[22px] md:text-[26px] text-white leading-tight">
          Ready to Talk?
        </h3>
        <Link
          to="/contact/"
          className="block w-full bg-law-accent text-black font-outfit text-[16px] md:text-[18px] font-semibold py-3 px-6 hover:bg-[#7a9e10] transition-colors duration-300 text-center"
        >
          Contact Us
        </Link>
        <a
          href={`tel:${phoneNumber}`}
          data-dni-phone="primary"
          className="flex items-center justify-center gap-2 text-white hover:text-law-accent transition-colors duration-300"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
          </svg>
          <span className="font-outfit text-[18px] md:text-[20px]">
            {phoneDisplay}
          </span>
        </a>
      </div>

      {sidebar?.award_images && Array.isArray(sidebar.award_images) && sidebar.award_images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mt-6">
          {(sidebar.award_images as { src: string; alt: string }[]).map((img, i) => (
            <img
              key={i}
              src={img.src}
              alt={img.alt}
              className="w-full h-auto object-contain"
              loading="lazy"
            />
          ))}
        </div>
      )}
    </div>
  );
}
