// Heuristic icon picker for lucide-react-native
// Returns a single Lucide icon component name (string) based on free-text inputs.
import iconAliasesJa from "../constants/iconAliasesJa";

export type IconPickInput = {
  what?: string;
};

// A small dictionary of keyword => lucide icon name
const rules: { kw: RegExp; icon: string }[] = [
  { kw: /アニメ|映画|シネマ|鑑賞|動画|ムービー/i, icon: "Film" },
  { kw: /テレビ|ドラマ|配信|ストリーミング/i, icon: "TvMinimalPlay" },
  { kw: /カラオケ|歌|うた|合唱|ボーカル/i, icon: "Mic2" },
  { kw: /音楽|ライブ|バンド|コンサート/i, icon: "Music" },
  { kw: /勉強|もくもく|学習|自習|読書|本/i, icon: "BookOpen" },
  {
    kw: /ゲーム|ボドゲ|ボードゲーム|Switch|PS5|任天堂|TRPG/i,
    icon: "Gamepad2",
  },
  {
    kw: /スポーツ|運動|ジム|筋トレ|ラン|マラソン|サッカー|野球|テニス|バドミントン|バスケ/i,
    icon: "Dumbbell",
  },
  { kw: /飲み会|居酒屋|乾杯|ビール|酒|飲酒/i, icon: "Beer" },
  { kw: /コーヒー|カフェ|喫茶|珈琲/i, icon: "Coffee" },
  { kw: /写真|撮影|カメラ|フォト/i, icon: "Camera" },
  { kw: /旅行|遠足|散歩|お出かけ|外出|ハイキング|登山/i, icon: "MapPin" },
  {
    kw: /料理|ご飯|ごはん|ゴハン|食事|ランチ|ディナー|スイーツ|グルメ/i,
    icon: "Utensils",
  },
  { kw: /交流|雑談|ミートアップ|オフ会|懇親/i, icon: "Users" },
  { kw: /映画館|映画鑑賞/i, icon: "Clapperboard" },
];

export function pickLucideIconName(input: IconPickInput): string {
  const text = `${input.what ?? ""}`.trim();
  if (text) {
    // 1) direct regex rules
    for (const r of rules) if (r.kw.test(text)) return r.icon;

    // 2) japanese alias dictionary
    for (const [ja, names] of Object.entries(iconAliasesJa)) {
      if (text.includes(ja)) return names[0];
    }

    // 3) simple english fallbacks if user typed English
    const lower = text.toLowerCase();
    if (/(film|movie|cinema|watch)/i.test(lower)) return "Film";
    if (/(study|learn|read|book)/i.test(lower)) return "BookOpen";
    if (/(game|play|board)/i.test(lower)) return "Gamepad2";
    if (/(sport|run|gym|train)/i.test(lower)) return "Dumbbell";
    if (/(coffee|cafe)/i.test(lower)) return "Coffee";
    if (/(photo|camera|shoot)/i.test(lower)) return "Camera";
    if (/(travel|trip|walk|hike)/i.test(lower)) return "MapPin";
    if (/(eat|lunch|dinner|food)/i.test(lower)) return "Utensils";
    if (/(chat|meet|friend|social)/i.test(lower)) return "Users";

    // みんなで決めたい → Users
    if (/みんなで決めたい/i.test(text)) return "Users";
  }
  // Fallback
  return "Calendar";
}
