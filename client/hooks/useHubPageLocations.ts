import { useEffect, useState } from "react";
import type {
  AreaCTAContent,
  AreaLocationsSection,
} from "@site/lib/cms/areaPageTypes";
import { fetchSupabaseJson } from "@site/lib/cms/api";

interface HubAreaData {
  locationsSection: AreaLocationsSection | null;
  cta: AreaCTAContent | null;
}

let cachedData: HubAreaData = { locationsSection: null, cta: null };
let cacheLoaded = false;

export async function loadHubPageLocations(): Promise<HubAreaData> {
  if (cacheLoaded) {
    return { ...cachedData };
  }

  try {
    const data = await fetchSupabaseJson<{ content?: Record<string, unknown> }[]>(
      "/rest/v1/pages?url_path=eq./areas-we-serve/&status=eq.published&select=content&limit=1",
    );

    if (Array.isArray(data) && data.length > 0 && data[0]?.content) {
      const content = data[0].content as Record<string, unknown>;
      if (content.locationsSection) {
        cachedData.locationsSection =
          content.locationsSection as AreaLocationsSection;
      }
      if (content.cta) {
        cachedData.cta = content.cta as AreaCTAContent;
      }
    }
  } catch (error) {
    console.error("[useHubPageLocations] Error:", error);
  }

  cacheLoaded = true;
  return { ...cachedData };
}

export function primeHubPageLocationsCache(data: HubAreaData) {
  cachedData = { ...data };
  cacheLoaded = true;
}

export function clearHubPageLocationsCache() {
  cachedData = { locationsSection: null, cta: null };
  cacheLoaded = false;
}

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

    let isMounted = true;

    loadHubPageLocations()
      .then((loadedData) => {
        if (!isMounted) return;
        setData(loadedData);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { locationsSection: data.locationsSection, cta: data.cta, loading };
}
