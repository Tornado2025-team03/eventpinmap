// Supabase Edge Function: ai-fill
// - Prefer Gemini (GEMINI_API_KEY) with JSON-only response
// - Fallback to OpenAI (OPENAI_API_KEY) with JSON schema
// - Optional server-side geocoding when GOOGLE_MAPS_KEY is present
// - SOFT_FAIL env toggles 200+null JSON instead of 5xx on LLM errors

// CORS headers (adjust origin in production)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AiFillRequest = {
  text: string;
  tz?: string;
  now_iso?: string | null;
  locale?: string;
  hint_city?: string | null;
};

type AiFillResponse = {
  what?: string | null;
  where_text?: string | null;
  start_iso?: string | null;
  end_iso?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

const SYSTEM_PROMPT =
  "あなたは日本語の自由文からイベントの構造化情報を抽出するアシスタントです。" +
  "日付や時間の相対表現（今日/明日/明後日/今週末/曜日）を、与えられた now_iso と tz を使ってISO8601に正規化して下さい。" +
  "時間範囲が不明な場合は開始+2時間で end_iso を補完して下さい。" +
  "出力は必ず厳密なJSONのみ（追加のテキストなし）で、以下のキーを含めてください:{what, where_text, start_iso, end_iso, latitude, longitude}。";

async function callGeminiStructured(
  text: string,
  tz: string,
  nowISO: string,
): Promise<AiFillResponse> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY not set");
  const model = Deno.env.get("GEMINI_MODEL") ?? "gemini-1.5-pro";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  let snippet = text.trim();
  if (snippet.length > 600) snippet = snippet.slice(0, 600);

  const userText =
    `${SYSTEM_PROMPT}\n\n` +
    `text: ${snippet}\n` +
    `tz: ${tz}\n` +
    `now_iso: ${nowISO}\n` +
    `出力はJSONのみ。キーは what, where_text, start_iso, end_iso, latitude, longitude。`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: userText }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  };

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Gemini error ${r.status}: ${t}`);
  }
  const data = await r.json();
  try {
    const parts: Array<{ text?: string }> = data.candidates?.[0]?.content?.parts ?? [];
    const content = parts.map((p) => p.text ?? "").join("");
    const obj = JSON.parse(content);
    return obj as AiFillResponse;
  } catch (e) {
    throw new Error(`Invalid Gemini response: ${e}`);
  }
}

async function callOpenAIStructured(
  text: string,
  tz: string,
  nowISO: string,
): Promise<AiFillResponse> {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("OPENAI_API_KEY not set");
  const model = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";

  let snippet = text.trim();
  if (snippet.length > 600) snippet = snippet.slice(0, 600);

  const schema = {
    type: "object",
    properties: {
      what: { type: "string" },
      where_text: { type: "string" },
      start_iso: { type: "string" },
      end_iso: { type: "string" },
    },
    required: ["what", "start_iso"],
    additionalProperties: false,
  } as const;

  const payload = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content:
          `text: ${snippet}\n` +
          `tz: ${tz}\n` +
          `now_iso: ${nowISO}\n` +
          `出力はJSONのみ。キーは what, where_text, start_iso, end_iso。`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "ai_fill_schema", schema, strict: true },
    },
    temperature: 0.2,
  };

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`OpenAI error ${r.status}: ${t}`);
  }
  const data = await r.json();
  const content = data?.choices?.[0]?.message?.content;
  try {
    const obj = JSON.parse(content);
    return obj as AiFillResponse;
  } catch (e) {
    throw new Error(`Invalid OpenAI response: ${e}`);
  }
}

async function geocode(
  address: string | null | undefined,
): Promise<{ latitude: number | null; longitude: number | null; formatted: string | null }> {
  if (!address) return { latitude: null, longitude: null, formatted: null };
  const key = Deno.env.get("GOOGLE_MAPS_KEY");
  if (!key) return { latitude: null, longitude: null, formatted: address };
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address,
    )}&language=ja&region=JP&key=${key}`;
  try {
    const r = await fetch(url);
    const j = await r.json();
    if (j?.status !== "OK" || !j?.results?.length) {
      return { latitude: null, longitude: null, formatted: address };
    }
    const top = j.results[0];
    const loc = top.geometry?.location;
    const lat = Number(loc?.lat);
    const lng = Number(loc?.lng);
    return {
      latitude: Number.isFinite(lat) ? lat : null,
      longitude: Number.isFinite(lng) ? lng : null,
      formatted: top.formatted_address ?? address,
    };
  } catch (_e) {
    return { latitude: null, longitude: null, formatted: address };
  }
}

function jsonResponse(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders,
      ...(init?.headers ?? {}),
    },
  });
}

function errorResponse(status: number, message: string) {
  return jsonResponse({ error: message }, { status });
}

Deno.serve(async (req) => {
  // Basic request logging
  try {
    const clone = req.clone();
    const bodyText = await clone.text().catch(() => "");
    console.log("[ai-fill] request start", { method: req.method, url: new URL(req.url).pathname });
    if (bodyText) console.log("[ai-fill] body", bodyText.slice(0, 800));
  } catch {}

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return errorResponse(405, "Method Not Allowed");
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return errorResponse(400, "Invalid JSON body");
  }

  const softFail = (Deno.env.get("SOFT_FAIL") || "").toLowerCase() === "true";

  // Action router (backward compatibility)
  const action = (body?.action || "").toString();
  if (action === "generate_title") {
    try {
      const input = body?.input || {};
      const what = (input?.what || "").toString().trim();
      const whenIso = (input?.when_iso || "").toString();
      const where = (input?.where || "").toString().trim();
      // Simple title: prefer what, optionally append date
      let title = what || "";
      try {
        if (whenIso) {
          const d = new Date(whenIso);
          if (!isNaN(d.getTime())) {
            const datePart = d.toLocaleDateString("ja-JP");
            title = title ? `${title}（${datePart}）` : `イベント（${datePart}）`;
          }
        }
      } catch {}
      if (!title && where) title = `${where}でイベント`;
      title = title || what || where || "イベント";
      return jsonResponse({ title });
    } catch (e: any) {
      console.error("[ai-fill] generate_title error", e);
      return softFail ? jsonResponse({ title: null, error: String(e?.message || e) }) : errorResponse(502, String(e?.message || e));
    }
  }
  if (action === "icon_pick") {
    try {
      const input = body?.input || {};
      const what = (input?.what || "").toString();
      const lower = what.toLowerCase();
      let icon = "Calendar";
      if (/ボードゲーム|ボドゲ|board|game/.test(lower)) icon = "Gamepad2";
      else if (/ランチ|ご飯|cafe|カフェ|食|飲/.test(lower)) icon = "Coffee";
      else if (/映画|鑑賞|シネマ|anime|アニメ/.test(lower)) icon = "Clapperboard";
      else if (/勉強|study|もくもく/.test(lower)) icon = "BookOpen";
      else if (/運動|スポーツ|バド|ラン|run/.test(lower)) icon = "Activity";
      return jsonResponse({ icon, iconName: icon, icon_name: icon });
    } catch (e: any) {
      console.error("[ai-fill] icon_pick error", e);
      return softFail ? jsonResponse({ icon: null, error: String(e?.message || e) }) : errorResponse(502, String(e?.message || e));
    }
  }

  const text = (body?.text ?? "").trim();
  if (!text) return errorResponse(400, "text is required");
  const tz = body?.tz || "Asia/Tokyo";
  const nowISO = body?.now_iso || new Date().toISOString();

  const hasGemini = !!Deno.env.get("GEMINI_API_KEY");
  const hasOpenAI = !!Deno.env.get("OPENAI_API_KEY");
  if (!hasGemini && !hasOpenAI) {
    const msg = "No LLM API key set (GEMINI_API_KEY or OPENAI_API_KEY)";
    console.error("[ai-fill] config error:", msg);
    return softFail
      ? jsonResponse({ what: null, where_text: null, start_iso: null, end_iso: null, latitude: null, longitude: null, error: msg })
      : errorResponse(500, msg);
  }

  try {
    const base: AiFillResponse = hasGemini
      ? await callGeminiStructured(text, tz, nowISO)
      : await callOpenAIStructured(text, tz, nowISO);

    // Optional server-side geocoding
    const geo = await geocode(base.where_text ?? null);
    const resp: AiFillResponse = {
      what: base.what ?? null,
      where_text: geo.formatted ?? base.where_text ?? null,
      start_iso: base.start_iso ?? null,
      end_iso: base.end_iso ?? null,
      latitude: geo.latitude,
      longitude: geo.longitude,
    };
    return jsonResponse(resp);
  } catch (e: any) {
    console.error("[ai-fill] error", e);
    const msg = String(e?.message || e);
    return softFail
      ? jsonResponse({ what: null, where_text: null, start_iso: null, end_iso: null, latitude: null, longitude: null, error: msg })
      : errorResponse(502, msg);
  }
});
