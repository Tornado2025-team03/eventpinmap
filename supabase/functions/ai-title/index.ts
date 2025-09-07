// Supabase Edge Function: ai-title
// 仕様:
// - what/where/tags/capacity/fee/description から魅力的で簡潔なタイトルを生成
// - Gemini を優先使用（GEMINI_API_KEY）。失敗時は baseTitle にフォールバック
// - isValid を少し緩和（長さ 8〜32、部分一致の許容）。
// - レスポンスに source:"llm"|"base" を付与（デバッグ用）

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const JSON_UTF8 = { ...cors, "Content-Type": "application/json; charset=utf-8" };

const KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-1.5-flash";
const BANNED = /(未定|お問(い)?合わせ|TBD|coming soon|〇〇|○○|◯◯)/i;

// 30s タイムアウト
const timeout = (ms: number) => (AbortSignal as any)?.timeout?.(ms);

const TITLE_SYSTEM_PROMPT =
  "あなたは日本語でイベントの魅力的で簡潔なタイトルを作るアシスタントです。" +
  "以下の指示に厳密に従ってください。" +
  "1) 使ってよい情報は入力の what / where / tags / capacity / fee / description のみ。" +
  "   入力にない事実・評価・誇張（例: 大人気, 本格, プロ級 など）は付け足さない。" +
  "   意味が等価な範囲の言い換えのみ可（例: 持込可→持込自由）。" +
  "2) タイトルには必ず what と where を含める。" +
  "3) 強調要素は入力から最大2つ（tags / capacity / fee / description から抽出）。" +
  "4) 日時（年月日・曜日・時刻）はタイトルに含めない（日時は別の場所で使う）。" +
  "5) 禁止: 『未定』『お問い合わせ』『TBD』『coming soon』『〇〇／○○／◯◯』等の曖昧語、絵文字や過度な記号、煽り表現。" +
  "6) トーンは具体的・端的。長さはおよそ12〜28文字を目安に自然な日本語。" +
  "7) 区切り記号は必要に応じて「｜」「・」「×」「＠」を使用してよい（使い過ぎない）。" +
  "8) 出力は JSON のみで {\"title\":\"...\"} を返す。前後に追加テキストは一切不要。";

const norm = (s: string) => (s ?? "").replace(/\s+/g, " ").replace(/[ 　]+/g, " ").trim();

function baseTitle(p: any) {
  const head = p.where ? `${p.where}で${p.what ?? ""}`.trim() : p.what ?? "";
  const extras: string[] = [];
  if (p.tags?.length) extras.push(p.tags.slice(0, 2).map((x: string) => `#${x}`).join("・"));
  if (p.capacity) extras.push(p.capacity);
  if (p.fee) extras.push(p.fee === "0円" ? "無料" : p.fee);
  return extras.length ? `${head}｜${extras.join("・")}` : head;
}

function isValid(title: string, p: any) {
  if (!title || BANNED.test(title)) return false;
  if (!p.what || !p.where) return false;
  const tt = norm(title);
  const ww = norm(p.where);
  const ww2 = ww.replace(/[都道府県市区町村]/g, "");
  const what = norm(p.what);
  // 部分一致の許容幅を拡大: what/where のどちらも、正規化した文字列が含まれていればOK
  if (!(tt.includes(what) && (tt.includes(ww) || tt.includes(ww2)))) return false;
  const len = tt.length;
  // 長さを 8〜32 に緩和
  return len >= 8 && len <= 32;
}

async function gen(p: any): Promise<string> {
  if (!KEY) return "";
  const tags2 = p.tags?.slice(0, 2).join("・") ?? "";
  const prompt =
    TITLE_SYSTEM_PROMPT +
    "\n\n" +
    `what: ${p.what ?? ""}\nwhere: ${p.where ?? ""}\ntags: ${tags2}\ncapacity: ${p.capacity ?? ""}\nfee: ${p.fee ?? ""}\ndescription: ${p.description ?? ""}`;
  const body = {
    contents: [
      { role: "user", parts: [{ text: prompt }] },
    ],
    generationConfig: {
      temperature: 0.3,
      topP: 0.9,
      responseMimeType: "application/json",
    },
  } as const;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
      signal: timeout?.(30000),
    });
    if (!r.ok) return "";
    const j = await r.json();
    const parts = j?.candidates?.[0]?.content?.parts ?? [];
    const text = parts.map((x: any) => x?.text || "").join("");
    try {
      return (JSON.parse(text)?.title ?? "").trim();
    } catch {
      return "";
    }
  } catch {
    return ""; // タイムアウト/ネットワーク等は静かにフォールバック
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("", { headers: cors });
  if (req.method !== "POST")
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: JSON_UTF8,
    });
  try {
    const p = await req.json();
    p.what = norm(p.what);
    p.where = norm(p.where);
    let title = "";
    let source: "llm" | "base" = "base";

    if (!p.what || !p.where) {
      title = baseTitle(p);
      return new Response(JSON.stringify({ title, source }), { headers: JSON_UTF8 });
    }

    const cand = await gen(p);
    if (cand && isValid(cand, p)) {
      title = cand;
      source = "llm";
    } else {
      title = baseTitle(p);
      source = "base";
    }
    return new Response(JSON.stringify({ title, source }), { headers: JSON_UTF8 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: JSON_UTF8,
    });
  }
});

