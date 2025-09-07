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
  role?: string; // 現在の実装（participant, organizer, invited）
  status?: "pending" | "approved" | "rejected"; // 将来の実装用
  created_at: string;
  updated_at: string;
  profiles?:
    | {
        display_name: string | null;
        avatar_url: string | null;
      }[]
    | null;
}

export interface AvailableUser {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  last_active: string | null;
}

// テスト用：利用可能なユーザーを作成（実際のUUID形式を使用）
export async function createTestAvailableUsers(): Promise<void> {
  try {
    console.log("Creating test available users...");

    // 実際のUUID形式のテストユーザーIDを生成
    const testUserIds = [
      "11111111-1111-1111-1111-111111111111",
      "22222222-2222-2222-2222-222222222222",
      "33333333-3333-3333-3333-333333333333",
    ];

    // 各テストユーザーを利用可能に設定
    for (const userId of testUserIds) {
      // user_statusesに挿入
      const { error: statusError } = await supabase
        .from("user_statuses")
        .upsert({
          user_id: userId,
          status: "available",
          start_at: new Date().toISOString(),
          end_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2時間後
          latitude: 35.6812 + Math.random() * 0.01,
          longitude: 139.7671 + Math.random() * 0.01,
          updated_at: new Date().toISOString(),
        });

      if (statusError) {
        console.error(`Error creating status for ${userId}:`, statusError);
        continue;
      }

      // user_profilesに挿入（表示名を含む）
      const { error: profileError } = await supabase
        .from("user_profiles")
        .upsert({
          user_id: userId,
          display_name: `テストユーザー${userId.slice(-3)}`,
          avatar_url: null,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error(`Error creating profile for ${userId}:`, profileError);
      } else {
        console.log(`Created test user: ${userId}`);
      }
    }

    console.log("Test users creation completed");
  } catch (error: any) {
    console.error("Error in createTestAvailableUsers:", error);
    throw new Error(
      "テスト用ユーザーの作成はセキュリティポリシーにより制限されています。代わりに別のアカウントでログインして利用可能ステータスを設定してください。",
    );
  }
}

// デモ用：現在のユーザーを指定イベントのメンバーから一時的に除外
export async function removeUserFromEventForDemo(
  eventId: string,
  userId: string,
): Promise<void> {
  try {
    console.log(
      `Removing user ${userId} from event ${eventId} for demo purposes`,
    );

    const { error } = await supabase
      .from("event_members")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error removing user from event:", error);
      throw error;
    }

    console.log("User removed from event successfully");
  } catch (error: any) {
    console.error("Error in removeUserFromEventForDemo:", error);
    throw error;
  }
}

// デモ用：利用可能ユーザーのテスト表示
export async function getAvailableUsersForDemo(
  eventId: string,
): Promise<AvailableUser[]> {
  try {
    console.log("Getting available users for demo with eventId:", eventId);

    // まず通常の処理を実行
    const normalUsers = await getAvailableUsers(eventId);

    // 通常のユーザーがいない場合、デモ用のダミーデータを返す
    if (normalUsers.length === 0) {
      console.log("No real users available, returning demo data");

      return [
        {
          id: "demo-user-1",
          display_name: "デモユーザー1",
          avatar_url: null,
          last_active: new Date().toISOString(),
        },
        {
          id: "demo-user-2",
          display_name: "デモユーザー2",
          avatar_url: null,
          last_active: new Date().toISOString(),
        },
      ];
    }

    return normalUsers;
  } catch (error: any) {
    console.error("Error in getAvailableUsersForDemo:", error);
    throw error;
  }
}

// テスト用：現在のユーザーのステータスをavailableに設定
export async function setUserStatusAvailable(userId: string): Promise<void> {
  try {
    console.log("Setting user status to available for:", userId);

    // まず既存のレコードがあるかチェック
    const { data: existingStatus, error: selectError } = await supabase
      .from("user_statuses")
      .select("user_id")
      .eq("user_id", userId)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      // PGRST116は"row not found"エラー（正常な場合）
      console.error("Error checking existing status:", selectError);
      throw selectError;
    }

    const now = new Date();
    const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2時間後

    const statusData = {
      user_id: userId,
      status: "available",
      start_at: now.toISOString(),
      end_at: endTime.toISOString(),
      updated_at: now.toISOString(),
    };

    let error;

    if (existingStatus) {
      // 既存のレコードを更新
      console.log("Updating existing status");
      const result = await supabase
        .from("user_statuses")
        .update({
          status: "available",
          start_at: now.toISOString(),
          end_at: endTime.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("user_id", userId);
      error = result.error;
    } else {
      // 新しいレコードを挿入
      console.log("Inserting new status");
      const result = await supabase.from("user_statuses").insert(statusData);
      error = result.error;
    }

    if (error) {
      console.error("Error setting user status:", error);
      throw error;
    }

    console.log("User status set to available successfully");
  } catch (error) {
    console.error("Error in setUserStatusAvailable:", error);
    throw error;
  }
}

// 現在のユーザーステータスを取得
export async function getUserStatus(userId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from("user_statuses")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error getting user status:", error);
    throw error;
  }
}

// 暇な人（availableなユーザー）を取得
export async function getAvailableUsers(
  eventId: string,
): Promise<AvailableUser[]> {
  try {
    console.log("getAvailableUsers called with eventId:", eventId);
    const currentTime = new Date().toISOString();
    console.log("Current time:", currentTime);

    // 現在のイベントの参加者を除外するためのユーザーIDを取得
    const { data: currentMembers } = await supabase
      .from("event_members")
      .select("user_id")
      .eq("event_id", eventId);

    console.log("Current members:", currentMembers);
    const excludeUserIds = currentMembers?.map((m) => m.user_id) || [];

    // デバッグ用: 全てのuser_statusesレコードを確認
    console.log("Checking all user_statuses records...");
    const { data: allStatuses, error: allStatusesError } = await supabase
      .from("user_statuses")
      .select("user_id, status, start_at, end_at")
      .order("updated_at", { ascending: false });

    console.log("All user_statuses records:", {
      allStatuses,
      allStatusesError,
    });

    // user_statusesからavailableなユーザーを取得し、user_profilesと結合
    console.log("Building query for available users...");
    let query = supabase
      .from("user_statuses")
      .select(
        `
        user_id,
        start_at,
        end_at,
        latitude,
        longitude,
        status
      `,
      )
      .eq("status", "available")
      .lte("start_at", currentTime); // start_at <= 現在時刻

    // まずクエリを実行してから、JavaScriptでend_atの条件をフィルタリング
    console.log("Executing query to get all available users...");
    const { data: allUserStatuses, error: statusError } = await query
      .order("start_at", { ascending: false })
      .limit(50);

    console.log("All user statuses before filtering:", {
      allUserStatuses,
      statusError,
    });

    if (statusError) {
      console.error("Error fetching user statuses:", statusError);
      throw statusError;
    }

    if (!allUserStatuses || allUserStatuses.length === 0) {
      console.log("No available users found");
      return [];
    }

    // end_atがnullまたは現在時刻以降のレコードのみをフィルタリング
    const userStatuses = allUserStatuses.filter((status: any) => {
      return !status.end_at || new Date(status.end_at) >= new Date(currentTime);
    });

    console.log("User statuses after end_at filtering:", userStatuses);

    if (userStatuses.length === 0) {
      console.log("No users within time range found");
      return [];
    }

    // 現在のイベント参加者を除外
    const filteredStatuses = userStatuses.filter((status: any) => {
      return !excludeUserIds.includes(status.user_id);
    });

    console.log(
      "User statuses after excluding event members:",
      filteredStatuses,
    );

    if (filteredStatuses.length === 0) {
      console.log("No available users after excluding event members");
      return [];
    }

    // 個別にuser_profilesからプロフィール情報を取得
    const userIds = filteredStatuses.map((status: any) => status.user_id);
    console.log("Fetching profiles for user IDs:", userIds);

    const { data: userProfiles, error: profileError } = await supabase
      .from("user_profiles")
      .select("id, nickname, profile_image_url")
      .in("id", userIds);

    console.log("User profiles result:", { userProfiles, profileError });

    if (profileError) {
      console.warn("Error fetching user profiles:", profileError);
      // プロフィール取得に失敗してもユーザー情報は返す
    }

    // データを結合して整形
    const result = filteredStatuses.map((status: any) => {
      const profile = userProfiles?.find((p: any) => p.id === status.user_id);
      return {
        id: status.user_id,
        display_name: profile?.nickname || `User ${status.user_id.slice(0, 8)}`,
        avatar_url: profile?.profile_image_url || null,
        last_active: status.start_at,
      };
    });

    console.log("Final available users result:", result);
    return result;
  } catch (error) {
    console.error("Error in getAvailableUsers:", error);
    throw error;
  }
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
  // まずevent_membersを取得
  const { data: members, error: memberError } = await supabase
    .from("event_members")
    .select(
      `
      id,
      user_id,
      event_id,
      role,
      created_at,
      updated_at
    `,
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (memberError) throw memberError;

  if (!members || members.length === 0) {
    return [];
  }

  // 個別にuser_profilesからプロフィール情報を取得
  const userIds = members.map((member: any) => member.user_id);
  const { data: userProfiles, error: profileError } = await supabase
    .from("user_profiles")
    .select("id, nickname, profile_image_url")
    .in("id", userIds);

  if (profileError) {
    console.warn("プロフィール取得エラー:", profileError);
    // プロフィール取得に失敗してもメンバー情報は返す
  }

  // データを結合
  return members.map((member: any) => {
    const profile = userProfiles?.find((p: any) => p.id === member.user_id);
    return {
      ...member,
      profiles: profile
        ? [
            {
              display_name: profile.nickname,
              avatar_url: profile.profile_image_url,
            },
          ]
        : null,
    };
  });
}

// 参加者のロールを変更（現在の実装に合わせて）
export async function updateMemberRole(
  memberId: string,
  role: "participant" | "organizer",
): Promise<void> {
  const { error } = await supabase
    .from("event_members")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", memberId);

  if (error) throw error;
}

// 参加者を削除
export async function deleteMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from("event_members")
    .delete()
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

// 暇な人を招待する機能
export async function inviteIdleUsers(
  eventId: string,
  userIds: string[],
): Promise<void> {
  try {
    console.log("inviteIdleUsers called with:", { eventId, userIds });

    const invitations = userIds.map((userId) => ({
      event_id: eventId,
      user_id: userId,
      role: "invited",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    console.log("Inserting invitations:", invitations);

    const { error, data } = await supabase
      .from("event_members")
      .insert(invitations)
      .select();

    console.log("Insert result:", { data, error });

    if (error) {
      console.error("Error inserting invitations:", error);
      throw error;
    }

    console.log("Invitations successfully sent!");
  } catch (error) {
    console.error("Error in inviteIdleUsers:", error);
    throw error;
  }
}

// アナウンスを作成
export async function createAnnouncement(
  eventId: string,
  userId: string,
  comment: string,
): Promise<void> {
  const { error } = await supabase.from("announcements").insert({
    event_id: eventId,
    user_id: userId,
    comment,
    created_at: new Date().toISOString(),
  });

  if (error) throw error;
}
