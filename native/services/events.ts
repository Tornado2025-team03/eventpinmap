import { supabase } from "../lib/supabase";
import type { EventInsertPayload } from "../types/event";

export async function insertEvent(payload: EventInsertPayload) {
  const { data, error } = await supabase
    .from("events")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
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
