import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { AreaLocationsSection, AreaCTAContent } from '@/lib/cms/areaPageTypes';

function getSupabaseClient() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

interface HubAreaData {
  locationsSection: AreaLocationsSection | null;
  cta: AreaCTAContent | null;
}

let cachedData: HubAreaData = { locationsSection: null, cta: null };
let cacheLoaded = false;

/**
 * Fetches the locationsSection and cta from the /areas-we-serve/ hub page.
 * These are the single source of truth — individual area pages render from
 * this instead of their own stored data.
 */
export function useHubPageLocations(): {
  locationsSection: AreaLocationsSection | null;
  cta: AreaCTAContent | null;
  loading: boolean;
} {
  const [data, setData] = useState<HubAreaData>(cachedData);
  const [loading, setLoading] = useState(!cacheLoaded);

  useEffect(() => {
    if (cacheLoaded) {
      setData(cachedData);
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase
      .from('pages')
      .select('content')
      .eq('url_path', '/areas-we-serve/')
      .eq('status', 'published')
      .single()
      .then(({ data: pageData, error }) => {
        if (!error && pageData?.content) {
          const content = pageData.content as Record<string, unknown>;
          if (content.locationsSection) {
            cachedData.locationsSection = content.locationsSection as AreaLocationsSection;
          }
          if (content.cta) {
            cachedData.cta = content.cta as AreaCTAContent;
          }
        }
        cacheLoaded = true;
        setData({ ...cachedData });
        setLoading(false);
      });
  }, []);

  return { locationsSection: data.locationsSection, cta: data.cta, loading };
}
