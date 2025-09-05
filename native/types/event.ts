export type Step = 1 | 2 | 3;
export type Rule = "open" | "approval";
export type TargetField = "start" | "end";

export interface EventInsertPayload {
  name: string;
  description: string | null;
  location: string | null;
  start_at: string; // ISO8601
  end_at: string | null; // ISO8601 | null
  created_by: string;
  status: Rule;
  latitude: number | null;
  longitude: number | null;
}

export interface OptionalDetails {
  tags: string[];
  capacity: string;
  fee: string;
  description: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}
