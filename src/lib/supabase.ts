import { createClient } from "@supabase/supabase-js";

function getEnv(name: string) {
  return process.env[name];
}

export function getSupabaseServerClient() {
  const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getSupabaseBrowserConfig() {
  return {
    url: getEnv("NEXT_PUBLIC_SUPABASE_URL") ?? "",
    anonKey: getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ?? "",
  };
}
