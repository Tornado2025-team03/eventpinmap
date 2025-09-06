import { Platform } from "react-native";
import iconNames from "../constants/lucideIconNames.json";

const AI_ENDPOINT = process.env.EXPO_PUBLIC_AI_FILL_ENDPOINT;

export type IconAIResponse = {
  icon?: string;
  iconName?: string;
  icon_name?: string;
};

export async function classifyIconByAI(
  what: string,
  opts?: { signal?: AbortSignal },
): Promise<string | null> {
  if (!AI_ENDPOINT) return null;
  const body = {
    action: "icon_pick",
    input: { what },
    // option: model or temperature is left to server implementation
  };
  try {
    const res = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: opts?.signal,
    });
    if (!res.ok) return null;
    const json: IconAIResponse | any = await res.json().catch(() => ({}));
    const name = (
      json?.iconName ||
      json?.icon_name ||
      json?.icon ||
      ""
    ).toString();
    if (!name) return null;
    // normalize e.g., "utensils" -> "Utensils"
    const canonical = normalizeIconName(name);
    return isValidIcon(canonical) ? canonical : null;
  } catch (e) {
    return null;
  }
}

function normalizeIconName(n: string): string {
  const trimmed = n.trim();
  if (!trimmed) return "";
  // Try exact, then case-insensitive match
  if (isValidIcon(trimmed)) return trimmed;
  const match = (iconNames as string[]).find(
    (x) => x.toLowerCase() === trimmed.toLowerCase(),
  );
  return match ?? trimmed;
}

function isValidIcon(n: string) {
  return (iconNames as string[]).includes(n);
}
