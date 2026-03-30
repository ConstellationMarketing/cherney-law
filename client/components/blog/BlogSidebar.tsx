import { useState, useEffect } from "react";
import { useGlobalPhone } from "@site/contexts/SiteSettingsContext";
import { Phone, Calendar } from "lucide-react";
import CallBox from "@site/components/shared/CallBox";
import { Link } from "react-router-dom";
import type { BlogSidebarSettings } from "@site/lib/cms/blogTypes";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

let sidebarCache: BlogSidebarSettings | null = null;

export default function BlogSidebar() {
  const { phoneDisplay, phoneLabel, phoneNumber } = useGlobalPhone();
  const [sidebar, setSidebar] = useState<BlogSidebarSettings | null>(sidebarCache);

  useEffect(() => {
    if (sidebarCache) return;

    async function fetchSidebar() {
      try {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/blog_sidebar_settings?select=*&limit=1`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );
        if (!response.ok) return;
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          sidebarCache = data[0];
          setSidebar(data[0]);
        }
      } catch (err) {
        console.error("[BlogSidebar] Error:", err);
      }
    }
    fetchSidebar();
  }, []);

  return (
    <div className="space-y-6">
      {/* Attorney Image */}
      {sidebar?.attorney_image && (
        <div className="overflow-hidden">
          <img
            src={sidebar.attorney_image}
            alt="Attorney"
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Phone CTA */}
      <a href={`tel:${phoneNumber}`} data-dni-phone="primary" className="block">
        <CallBox icon={Phone} title={phoneLabel} subtitle={phoneDisplay} />
      </a>

      {/* Consultation CTA */}
      <Link to="/contact/">
        <CallBox
          icon={Calendar}
          title="Schedule Now"
          subtitle="Free Consultation"
        />
      </Link>

      {/* Award Images */}
      {sidebar?.award_images && Array.isArray(sidebar.award_images) && sidebar.award_images.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
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
