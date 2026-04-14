import { getSupabasePublicConfig } from "@site/lib/runtime-env";

export const PAGE_SEO_SELECT =
  "content,meta_title,meta_description,canonical_url,og_title,og_description,og_image,noindex,url_path,title";

export const CMS_PAGE_SELECT =
  "id,title,url_path,page_type,content,meta_title,meta_description,canonical_url,og_title,og_description,og_image,noindex,status";

export const PRACTICE_DETAIL_SELECT =
  "id,title,url_path,page_type,content,meta_title,meta_description,canonical_url,og_title,og_description,og_image,noindex,schema_type,schema_data";

function getRestHeaders() {
  const { anonKey } = getSupabasePublicConfig();

  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };
}

export async function fetchSupabaseJson<T>(pathWithQuery: string): Promise<T> {
  const { url, anonKey } = getSupabasePublicConfig();

  if (!url || !anonKey) {
    throw new Error("Supabase public credentials are not configured");
  }

  const response = await fetch(`${url}${pathWithQuery}`, {
    headers: getRestHeaders(),
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
