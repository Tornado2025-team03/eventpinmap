// Supabase Edge Function: ai-fill
// Mirrors eventpinmap/ai-server/main.py in Deno/TypeScript.
// - Prefer Gemini (GEMINI_API_KEY) with JSON-only response
// - Fallback to OpenAI (OPENAI_API_KEY) with JSON schema
// - Optional server-side geocoding when GOOGLE_MAPS_KEY is present

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
  "出力は必ず厳密なJSONのみ（追加のテキストなし）で、以下のキーを含めてください:{what, where_text, start_iso, end_iso}。";

async function callGeminiStructured(
  text: string,
  tz: string,
  nowISO: string,
): Promise<AiFillResponse> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY not set");
  const model = Deno.env.get("GEMINI_MODEL") ?? "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  let snippet = text.trim();
  if (snippet.length > 600) snippet = snippet.slice(0, 600);

  const userText =
    `${SYSTEM_PROMPT}\n\n` +
    `text: ${snippet}\n` +
    `tz: ${tz}\n` +
    `now_iso: ${nowISO}\n` +
    `出力はJSONのみ。キーは what, where_text, start_iso, end_iso。`;

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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return errorResponse(405, "Method Not Allowed");
  }

  let body: AiFillRequest;
  try {
    body = (await req.json()) as AiFillRequest;
  } catch {
    return errorResponse(400, "Invalid JSON body");
  }

  const text = (body?.text ?? "").trim();
  if (!text) return errorResponse(400, "text is required");
  const tz = body?.tz || "Asia/Tokyo";
  const nowISO = body?.now_iso || new Date().toISOString();

  const hasGemini = !!Deno.env.get("GEMINI_API_KEY");
  const hasOpenAI = !!Deno.env.get("OPENAI_API_KEY");
  if (!hasGemini && !hasOpenAI) {
    return errorResponse(500, "No LLM API key set (GEMINI_API_KEY or OPENAI_API_KEY)");
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
    return errorResponse(502, String(e?.message || e));
  }
});

