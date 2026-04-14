function getProcessEnv(): Record<string, string | undefined> | undefined {
  if (typeof globalThis === "undefined" || !("process" in globalThis)) {
    return undefined;
  }

  const runtimeProcess = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return runtimeProcess?.env;
}

export function getEnv(name: string): string | undefined {
  const importMetaEnv =
    typeof import.meta !== "undefined"
      ? (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
      : undefined;

  return importMetaEnv?.[name] ?? getProcessEnv()?.[name];
}

export function isProductionRuntime(): boolean {
  const importMetaEnv =
    typeof import.meta !== "undefined"
      ? (import.meta as ImportMeta & { env?: Record<string, string | boolean | undefined> }).env
      : undefined;

  if (typeof importMetaEnv?.PROD === "boolean") {
    return importMetaEnv.PROD;
  }

  return getProcessEnv()?.NODE_ENV === "production";
}

export function getSiteUrlFallback(): string {
  return getEnv("VITE_SITE_URL") || "";
}

export function getSupabasePublicConfig(): { url: string; anonKey: string } {
  const url = getEnv("VITE_SUPABASE_URL") || "";
  const anonKey = getEnv("VITE_SUPABASE_ANON_KEY") || "";

  return { url, anonKey };
}
