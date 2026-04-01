import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { AreaLocationsSection } from '@/lib/cms/areaPageTypes';

function getSupabaseClient() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

let cachedLocations: AreaLocationsSection | null = null;
let cacheLoaded = false;

/**
 * Fetches the locationsSection from the /areas-we-serve/ hub page.
 * This is the single source of truth for the locations section —
 * individual area pages render from this instead of their own stored data.
 */
export function useHubPageLocations(): {
  locationsSection: AreaLocationsSection | null;
  loading: boolean;
} {
  const [locationsSection, setLocationsSection] = useState<AreaLocationsSection | null>(cachedLocations);
  const [loading, setLoading] = useState(!cacheLoaded);

  useEffect(() => {
    if (cacheLoaded) {
      setLocationsSection(cachedLocations);
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
      .then(({ data, error }) => {
        if (!error && data?.content?.locationsSection) {
          cachedLocations = data.content.locationsSection as AreaLocationsSection;
        }
        cacheLoaded = true;
        setLocationsSection(cachedLocations);
        setLoading(false);
      });
  }, []);

  return { locationsSection, loading };
}
