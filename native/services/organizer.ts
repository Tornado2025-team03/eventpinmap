import { supabase } from "../lib/supabase";

export interface OrganizerEvent {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string | null;
  status: "open" | "approval";
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
  participants_count?: number;
}

export interface EventMember {
  id: string;
  user_id: string;
  event_id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  profiles?:
    | {
        display_name: string | null;
        avatar_url: string | null;
      }[]
    | null;
}

// 主催者として作成したイベント一覧を取得
export async function getOrganizerEvents(
  userId: string,
): Promise<OrganizerEvent[]> {
  const { data, error } = await supabase
    .from("events")
    .select(
      `
      id,
      name,
      description,
      location,
      start_at,
      end_at,
      status,
      latitude,
      longitude,
      created_at,
      updated_at
    `,
    )
    .eq("created_by", userId)
    .order("start_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

// 特定のイベントの参加者一覧を取得
export async function getEventMembers(eventId: string): Promise<EventMember[]> {
  const { data, error } = await supabase
    .from("event_members")
    .select(
      `
      id,
      user_id,
      event_id,
      status,
      created_at,
      updated_at,
      profiles(
        display_name,
        avatar_url
      )
    `,
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as unknown as EventMember[];
}

// 参加者の承認状態を変更
export async function updateMemberStatus(
  memberId: string,
  status: "approved" | "rejected",
): Promise<void> {
  const { error } = await supabase
    .from("event_members")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", memberId);

  if (error) throw error;
}

// イベントの詳細を更新
export async function updateEvent(
  eventId: string,
  updates: Partial<
    Pick<
      OrganizerEvent,
      "name" | "description" | "location" | "start_at" | "end_at" | "status"
    >
  >,
): Promise<void> {
  const { error } = await supabase
    .from("events")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", eventId);

  if (error) throw error;
}

// 暇な人を招待する機能（仮実装）
export async function inviteIdleUsers(
  eventId: string,
  userIds: string[],
): Promise<void> {
  const invitations = userIds.map((userId) => ({
    event_id: eventId,
    user_id: userId,
    status: "pending" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("event_members").insert(invitations);

  if (error) throw error;
}

// アナウンスを作成（仮実装 - 実際のアナウンステーブルが必要）
export async function createAnnouncement(
  eventId: string,
  title: string,
  content: string,
): Promise<void> {
  // 実際の実装では、announcementsテーブルに保存
  // 現在は仮でevent_membersテーブルを利用してプッシュ通知など
  console.log("Announcement created:", { eventId, title, content });

  // 実装例: すべての参加者にプッシュ通知を送信
  // await sendPushNotificationToEventMembers(eventId, title, content);
}
