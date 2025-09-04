import { supabase } from "../lib/supabase";

export type TagOption = {
  id: string;
  name: string;
  slug?: string | null;
};

export async function fetchTagOptionsByNames(names: string[]) {
  const unique = Array.from(
    new Set(names.map((s) => s.trim()).filter(Boolean)),
  );
  if (unique.length === 0) return new Map<string, TagOption>();

  const { data, error } = await supabase
    .from("tags")
    .select("id,name,slug")
    .in("name", unique);
  if (error) throw error;
  const map = new Map<string, TagOption>();
  for (const row of data || []) map.set(row.name, row as TagOption);
  return map;
}
