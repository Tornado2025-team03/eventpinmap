// native/services/ai.ts
// 共通のAIユーティリティ（AIフィル、タイトル生成、アイコン分類）

import iconNames from "../constants/lucideIconNames.json";

const DEBUG = (() => {
  const v = (process.env.EXPO_PUBLIC_DEBUG_AI || "").toString().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
})();

// ---- 共通ヘッダ ----
function authHeaders() {
  const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${anon}`,
    apikey: anon ?? "",
  };
}

// ---- 型 ----
export type AiFillRemoteResponse = {
  what?: string;
  where_text?: string;
  start_iso?: string;
  end_iso?: string;
  latitude?: number | null;
  longitude?: number | null;
};

export type AiFillResult = {
  what?: string;
  where?: string;
  when?: Date | null;
  endAt?: Date | null;
  latitude?: number | null;
  longitude?: number | null;
} | null;

// ---- AIフィル（文から what/where/when を抽出）----
export async function aiFillRemote(text: string): Promise<AiFillResult> {
  const endpoint = process.env.EXPO_PUBLIC_AI_FILL_ENDPOINT;
  if (!endpoint) return null;

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Tokyo";
  const now_iso = new Date().toISOString();
  const locale = "ja-JP";

  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ text, tz, now_iso, locale }),
    });
    if (DEBUG) {
      try {
        const copy = r.clone();
        const preview = await copy.text();
        console.log(
          "[AI] aiFillRemote status=",
          r.status,
          "body=",
          preview.slice(0, 400),
        );
      } catch {}
    }
    if (!r.ok) {
      console.warn("aiFillRemote non-OK:", r.status);
      return null;
    }
    const data: AiFillRemoteResponse = await r.json();

    const when = data.start_iso ? new Date(data.start_iso) : null;
    const endAt = data.end_iso ? new Date(data.end_iso) : null;

    return {
      what: data.what,
      where: data.where_text,
      when,
      endAt,
      latitude:
        typeof data.latitude === "number" && Number.isFinite(data.latitude)
          ? data.latitude
          : null,
      longitude:
        typeof data.longitude === "number" && Number.isFinite(data.longitude)
          ? data.longitude
          : null,
    };
  } catch (e) {
    console.error("aiFillRemote error", e);
    return null;
  }
}

// ---- タイトル生成（ダイレクト or フォールバックで /ai-fill に投げる）----
export async function generateTitle(params: {
  what?: string;
  when?: Date | null;
  where?: string;
  tags?: string[];
  capacity?: string;
  fee?: string;
  description?: string;
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
        description: params.description,
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
          description: params.description,
        },
      };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    if (DEBUG) {
      try {
        const copy = res.clone();
        const preview = await copy.text();
        console.log(
          "[AI] generateTitle status=",
          res.status,
          "body=",
          preview.slice(0, 400),
        );
      } catch {}
    }
    if (!res.ok) {
      console.warn("generateTitle non-OK:", res.status);
      return null;
    }
    const json: any = await res.json().catch(() => ({}));
    const t = (json?.title || json?.name || json?.data?.title || "")
      .toString()
      .trim();
    return t || null;
  } catch (e) {
    console.error("generateTitle error", e);
    return null;
  }
}

// ---- アイコン自動分類（what から Lucide 名を選ぶ）----
export type IconAIResponse = {
  icon?: string;
  iconName?: string;
  icon_name?: string;
};

const AI_ENDPOINT = process.env.EXPO_PUBLIC_AI_FILL_ENDPOINT;

export async function classifyIconByAI(
  what: string,
  opts?: { signal?: AbortSignal },
): Promise<string | null> {
  if (!AI_ENDPOINT) return null;

  const body = {
    action: "icon_pick",
    input: { what },
  };

  try {
    const res = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
      signal: opts?.signal,
    });
    if (DEBUG) {
      try {
        const copy = res.clone();
        const preview = await copy.text();
        console.log(
          "[AI] iconPick status=",
          res.status,
          "body=",
          preview.slice(0, 400),
        );
      } catch {}
    }
    if (!res.ok) {
      console.warn("classifyIconByAI non-OK:", res.status);
      return null;
    }
    const json: IconAIResponse | any = await res.json().catch(() => ({}));
    const name = (
      json?.iconName ||
      json?.icon_name ||
      json?.icon ||
      ""
    ).toString();

    if (!name) return null;

    const canonical = normalizeIconName(name);
    return isValidIcon(canonical) ? canonical : null;
  } catch (e: any) {
    const name = (e?.name || "").toString();
    const msg = (e?.message || "").toString();
    const text = `${name}:${msg}`.toLowerCase();
    if (name === "AbortError" || text.includes("abort")) {
      if (DEBUG) console.log("[AI] iconPick aborted (expected on rapid edits)");
      return null; // silent for user; this is expected due to effect cleanup
    }
    console.error("classifyIconByAI error", e);
    return null;
  }
}

// ---- アイコン名の正規化＆存在チェック ----
export function normalizeIconName(n: string): string {
  const trimmed = n.trim();
  if (!trimmed) return "";
  if (isValidIcon(trimmed)) return trimmed;

  const list = iconNames as string[];
  const ci = list.find((x) => x.toLowerCase() === trimmed.toLowerCase());
  return ci ?? trimmed;
}

export function isValidIcon(n: string) {
  return (iconNames as string[]).includes(n);
}
