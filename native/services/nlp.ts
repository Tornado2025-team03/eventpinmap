// Lightweight JP free-text parser for event fields (what/when/where)
// Heuristic, on-device, no LLM dependency
import { geocodeAddress } from "./geocode";

export type ParsedEvent = {
  what?: string;
  whereText?: string;
  when?: Date | null;
  endAt?: Date | null;
};

const DAYPART_DEFAULTS: Record<string, number> = {
  朝: 9,
  午前: 10,
  昼: 12,
  午後: 15,
  夕方: 17,
  夜: 19,
  深夜: 23,
};

function nextDow(now: Date, dow: number) {
  const res = new Date(now);
  const add = (dow - now.getDay() + 7) % 7 || 7; // next occurrence (not today)
  res.setDate(now.getDate() + add);
  return res;
}

function parseDate(input: string, now = new Date()): Date | null {
  const text = input.replace(/\s+/g, "");

  // Relative: 今日/明日/明後日
  if (text.includes("今日")) return new Date(now);
  if (text.includes("明日")) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d;
  }
  if (text.includes("明後日")) {
    const d = new Date(now);
    d.setDate(d.getDate() + 2);
    return d;
  }

  // 今週末 → 次の土曜
  if (text.includes("今週末")) {
    const d = new Date(now);
    const toSat = (6 - now.getDay() + 7) % 7 || 6; // prefer upcoming Sat
    d.setDate(now.getDate() + toSat);
    return d;
  }

  // 曜日（今週のX / X曜）
  const dowMap: Record<string, number> = {
    日: 0,
    月: 1,
    火: 2,
    水: 3,
    木: 4,
    金: 5,
    土: 6,
  };
  const dowMatch = text.match(/(?:今週の)?([日月火水木金土])(?:曜|曜日)?/);
  if (dowMatch) {
    const dow = dowMap[dowMatch[1]];
    const base = text.includes("今週の")
      ? (() => {
          const d = new Date(now);
          const delta = (dow - now.getDay() + 7) % 7; // this week (could be today)
          d.setDate(now.getDate() + delta);
          return d;
        })()
      : nextDow(now, dow);
    return base;
  }

  // 日付 9/10, 9月10日
  const m1 = text.match(/(\d{1,2})[\/／月](\d{1,2})(?:日)?/);
  if (m1) {
    const m = Number(m1[1]);
    const d = Number(m1[2]);
    const y = now.getFullYear();
    const dt = new Date(y, m - 1, d);
    // if past, assume next year
    if (dt < now) dt.setFullYear(y + 1);
    return dt;
  }

  return null;
}

function parseTimeRange(
  input: string,
  date: Date | null,
): { start?: Date; end?: Date } {
  const text = input.replace(/\s+/g, "");
  const base = date ? new Date(date) : new Date();

  // Range e.g. 19-21時, 19時~21時, 19:30〜21:00
  const r = text.match(
    /(?:(午前|午後))?(\d{1,2})(?::|：)?(\d{1,2})?\s*(?:時)?\s*[~〜\-]\s*(?:(午前|午後))?(\d{1,2})(?::|：)?(\d{1,2})?\s*時?/,
  );
  if (r) {
    const [, ampm1, h1s, m1s, ampm2, h2s, m2s] = r as any;
    const s = new Date(base);
    let h1 = Number(h1s);
    let m1 = m1s ? Number(m1s) : 0;
    if (ampm1 === "午後" && h1 < 12) h1 += 12;
    if (ampm1 === "午前" && h1 === 12) h1 = 0;
    s.setHours(h1, m1, 0, 0);

    const e = new Date(base);
    let h2 = Number(h2s);
    let m2 = m2s ? Number(m2s) : 0;
    if (ampm2 === "午後" && h2 < 12) h2 += 12;
    if (ampm2 === "午前" && h2 === 12) h2 = 0;
    e.setHours(h2, m2, 0, 0);

    // if end before start, assume next day
    if (e <= s) e.setDate(e.getDate() + 1);
    return { start: s, end: e };
  }

  // Single time e.g. 午後7時, 19:30, 19時半
  const s1 = text.match(
    /(午前|午後)?(\d{1,2})(?::|：)?(\d{1,2})?\s*(?:時|時半)?/,
  );
  if (s1) {
    const [, ampm, hs, ms] = s1 as any;
    let h = Number(hs);
    let m = ms ? Number(ms) : 0;
    // handle "時半"
    if (!ms && /時半/.test(text)) m = 30;
    if (ampm === "午後" && h < 12) h += 12;
    if (ampm === "午前" && h === 12) h = 0;
    const s = new Date(base);
    s.setHours(h, m, 0, 0);
    const e = new Date(s);
    e.setHours(e.getHours() + 2);
    return { start: s, end: e };
  }

  // Daypart keywords: 夜/夕方/昼/朝/午前/午後
  const dp = Object.keys(DAYPART_DEFAULTS).find((k) => text.includes(k));
  if (dp) {
    const s = new Date(base);
    s.setHours(DAYPART_DEFAULTS[dp], 0, 0, 0);
    const e = new Date(s);
    e.setHours(e.getHours() + 2);
    return { start: s, end: e };
  }

  return {};
}

function extractWhereText(input: string): string | undefined {
  // Heuristic: take phrase before the last "で" if present
  // e.g. "明日の夜渋谷でエヴァ…見たい" → "渋谷"
  const lastDe = input.lastIndexOf("で");
  if (lastDe >= 0) {
    const before = input.slice(0, lastDe);
    // trim to the last chunk of JP chars/word
    const m = before.match(/[\u3040-\u30FF\u4E00-\u9FAF\w\-\s々ヶヶー]+$/);
    const loc = (m ? m[0] : before).trim();
    if (loc) return loc.replace(/[はもにへを]$/, "").trim();
  }

  // Fallback: tokens ending with 駅/公園/周辺/カフェ/映画館
  const m2 = input.match(
    /([\u4E00-\u9FAF\u3040-\u30FF\w]+)(駅|公園|周辺|カフェ|映画館)/,
  );
  if (m2) return (m2[0] ?? "").trim();

  return undefined;
}

function stripKnownParts(input: string, parts: (string | undefined)[]): string {
  let s = input;
  for (const p of parts.filter(Boolean) as string[]) s = s.replace(p, " ");
  s = s.replace(
    /(したい|やりたい|見たい|行きたい|鑑賞したい|鑑賞|集まりたい|したいなぁ?|したいです)/g,
    " ",
  );
  s = s.replace(/(で|を|に)/g, " ");
  return s.replace(/\s+/g, " ").trim();
}

export async function parseFreeFormJP(
  input: string,
  now = new Date(),
): Promise<ParsedEvent> {
  const date = parseDate(input, now);
  const { start, end } = parseTimeRange(input, date);
  const when = start ?? date ?? null;
  let endAt = end ?? null;
  if (!endAt && when) {
    const e = new Date(when);
    e.setHours(e.getHours() + 2);
    endAt = e;
  }

  const whereText = extractWhereText(input);
  let what: string | undefined;
  if (whereText) what = stripKnownParts(input, [whereText]);
  else what = stripKnownParts(input, []);
  if (what && what.length > 30) what = what.slice(0, 30);

  return { what: what || undefined, whereText, when, endAt };
}

export async function aiFillFromText(input: string): Promise<{
  what?: string;
  where?: string;
  latitude?: number | null;
  longitude?: number | null;
  when?: Date | null;
  endAt?: Date | null;
}> {
  const parsed = await parseFreeFormJP(input);
  let where: string | undefined;
  let latitude: number | null | undefined;
  let longitude: number | null | undefined;

  if (parsed.whereText) {
    try {
      const geo = await geocodeAddress(parsed.whereText);
      if (geo) {
        where = geo.formattedAddress || parsed.whereText;
        latitude = geo.latitude;
        longitude = geo.longitude;
      } else {
        where = parsed.whereText;
      }
    } catch {
      where = parsed.whereText;
    }
  }

  return {
    what: parsed.what,
    where,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    when: parsed.when ?? null,
    endAt: parsed.endAt ?? null,
  };
}
