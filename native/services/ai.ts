// Client for LLM-based AI fill (server endpoint)
export type AiFillRemoteResponse = {
  what?: string;
  where_text?: string;
  start_iso?: string;
  end_iso?: string;
  latitude?: number | null;
  longitude?: number | null;
};

export async function aiFillRemote(text: string): Promise<{
  what?: string;
  where?: string;
  when?: Date | null;
  endAt?: Date | null;
  latitude?: number | null;
  longitude?: number | null;
} | null> {
  const endpoint = process.env.EXPO_PUBLIC_AI_FILL_ENDPOINT;
  if (!endpoint) return null;

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Tokyo";
  const now_iso = new Date().toISOString();
  const locale = "ja-JP";

  const r = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, tz, now_iso, locale }),
  });
  if (!r.ok) throw new Error(`AI endpoint error: ${r.status}`);
  const data: AiFillRemoteResponse = await r.json();

  const when = data.start_iso ? new Date(data.start_iso) : null;
  const endAt = data.end_iso ? new Date(data.end_iso) : null;

  return {
    what: data.what,
    where: data.where_text,
    when,
    endAt,
    latitude: typeof data.latitude === "number" ? data.latitude : null,
    longitude: typeof data.longitude === "number" ? data.longitude : null,
  };
}

// Generate a suitable title using AI (Gemini via server)
export async function generateTitle(params: {
  what?: string;
  when?: Date | null;
  where?: string;
  tags?: string[];
  capacity?: string;
  fee?: string;
}): Promise<string | null> {
  const direct = process.env.EXPO_PUBLIC_AI_TITLE_ENDPOINT;
  const fallback = process.env.EXPO_PUBLIC_AI_FILL_ENDPOINT;
  const endpoint = direct || fallback;
  if (!endpoint) return null;

  const body = direct
    ? {
        what: params.what,
        when_iso: params.when?.toISOString(),
        where: params.where,
        tags: params.tags,
        capacity: params.capacity,
        fee: params.fee,
      }
    : {
        action: "generate_title",
        input: {
          what: params.what,
          when_iso: params.when?.toISOString(),
          where: params.where,
          tags: params.tags,
          capacity: params.capacity,
          fee: params.fee,
        },
      };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const json: any = await res.json().catch(() => ({}));
    const t = (json?.title || json?.name || json?.data?.title || "")
      .toString()
      .trim();
    return t || null;
  } catch {
    return null;
  }
}
