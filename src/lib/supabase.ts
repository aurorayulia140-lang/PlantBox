import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../../utils/supabase/info";

const GLOBAL_KEY = "__plantbox_supabase__";

function getClient(): SupabaseClient {
  const g = globalThis as Record<string, unknown>;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = createClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey,
      { auth: { persistSession: false, storageKey: "plantbox-auth" } }
    );
  }
  return g[GLOBAL_KEY] as SupabaseClient;
}

export const supabase = getClient();

export type Plant = {
  id: number;
  nama: string;
  deskripsi: string;
  foto_path: string;
  created_at: string;
};

export function getPhotoUrl(path: string): string {
  const { data } = supabase.storage.from("plant-images").getPublicUrl(path);
  return data.publicUrl;
}
