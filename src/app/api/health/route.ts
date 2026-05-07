import { ok } from "@/lib/api";
import { getSupabaseBrowserConfig } from "@/lib/supabase";

export async function GET() {
  const config = getSupabaseBrowserConfig();

  return ok({
    app: "Parcel Pivot",
    hasSupabaseUrl: Boolean(config.url),
    hasSupabaseAnonKey: Boolean(config.anonKey),
  });
}
