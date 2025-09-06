import { supabase } from "../lib/supabase";
import type { EventInsertPayload } from "../types/event";

export async function insertEvent(payload: EventInsertPayload) {
  let { data, error } = await supabase
    .from("events")
    .insert(payload as any)
    .select()
    .single();
  if (!error) return data;
  const msg = String((error as any)?.message || "").toLowerCase();
  // Fallback for environments where `icon` column doesn't exist yet.
  if (msg.includes("column") && msg.includes("icon")) {
    const { icon, ...rest } = (payload as any) || {};
    const retry = await supabase.from("events").insert(rest).select().single();
    if (retry.error) throw retry.error;
    return retry.data;
  }
  throw error;
}

export async function insertEventTags(
  eventId: string | number,
  tags: string[],
) {
  const rows = Array.from(
    new Set(tags.map((t) => t.trim()).filter(Boolean)),
  ).map((t) => ({ event_id: eventId, tag: t }));

  if (rows.length === 0) return { count: 0 } as const;

  const { error, count } = await supabase
    .from("event_tags")
    .insert(rows, { count: "exact" });
  if (error) throw error;
  return { count: count ?? rows.length } as const;
}

export async function insertEventTagIds(
  eventId: string | number,
  tagIds: string[],
) {
  const unique = Array.from(new Set(tagIds.filter(Boolean)));
  if (unique.length === 0) return { count: 0 } as const;

  const now = new Date().toISOString();
  const rows = unique.map((id) => ({
    event_id: eventId,
    tag_id: id,
    created_at: now,
  }));
  const { error, count } = await supabase
    .from("event_tags")
    .insert(rows, { count: "exact" });
  if (error) throw error;
  return { count: count ?? rows.length } as const;
}
