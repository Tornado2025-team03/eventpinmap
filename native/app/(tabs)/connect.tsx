import React, { useState, useEffect, useCallback } from "react";
import {
  Image,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useAuth } from "../../provider/AuthProvider";
import {
  inviteUsersToEvent,
  setUserStatusAvailable,
  getUserStatus,
  type OrganizerEvent,
  type AvailableUser,
} from "../../services/organizer";
import { getMatchingUsersAndEvents } from "@/services/getConnec";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

interface AvailableUserItemProps {
  user: AvailableUser;
  isSelected: boolean;
  onToggle: (userId: string) => void;
}

function AvailableUserItem({
  user,
  isSelected,
  onToggle,
}: AvailableUserItemProps) {
  return (
    <TouchableOpacity
      style={[styles.userItem, isSelected && styles.selectedUserItem]}
      onPress={() => onToggle(user.id)}
    >
      {/* Avatar on the left */}
      <Image
        source={
          user.avatar_url
            ? { uri: user.avatar_url }
            : require("../../assets/images/react-logo.png") // fallback image
        }
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {user.display_name || `User ${user.id.substring(0, 8)}`}
        </Text>
      </View>
      <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </View>
    </TouchableOpacity>
  );
}

interface EventSelectorProps {
  events: OrganizerEvent[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
}

function EventSelector({
  events,
  selectedEventId,
  onSelectEvent,
}: EventSelectorProps) {
  return (
    <View style={styles.eventSelector}>
      <Text style={styles.sectionTitle}>招待先のイベントを選択</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.eventList}
      >
        {events.map((event) => (
          <TouchableOpacity
            key={event.id}
            style={[
              styles.eventItem,
              selectedEventId === event.id && styles.selectedEventItem,
            ]}
            onPress={() => onSelectEvent(event.id)}
          >
            <Text
              style={[
                styles.eventName,
                selectedEventId === event.id && styles.selectedEventName,
              ]}
            >
              {event.name}
            </Text>
            <Text style={styles.eventDate}>
              {new Date(event.start_at).toLocaleDateString("ja-JP")}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

export default function ConnectScreen() {
  const { session } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserStatus, setCurrentUserStatus] = useState<any>(null);

  // イベント一覧を取得
  const loadEvents = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const now = new Date().toISOString();
      // Fetch events where user is organizer and start_at is in the future
      const { data: eventList, error } = await supabase
        .from("events")
        .select("*")
        .eq("created_by", session.user.id)
        .gte("start_at", now)
        .order("start_at", { ascending: true });

      if (error) throw error;
      setEvents(eventList || []);

      // 最初のイベントを自動選択
      if (eventList && eventList.length > 0 && !selectedEventId) {
        setSelectedEventId(eventList[0].id);
      }
    } catch (error: any) {
      console.error("Error loading events:", error);
      Alert.alert("エラー", "イベント一覧の取得に失敗しました");
    }
  }, [session?.user?.id, selectedEventId]);

  // 利用可能なユーザーを取得（マッチしたユーザーのみ表示）
  const loadAvailableUsers = useCallback(async () => {
    if (!selectedEventId) {
      setAvailableUsers([]);
      return;
    }

    setLoading(true);
    try {
      // Get all matched user-event pairs
      const matches = await getMatchingUsersAndEvents();

      // Filter for the selected event
      const matchedUsers = matches
        .filter(({ event }) => event.id === selectedEventId)
        .map(({ user }) => ({
          id: user.user_id, // user_profiles.id
          display_name: user.nickname || `User ${user.user_id.slice(0, 8)}`,
          avatar_url: user.avatar_url || null,
          last_active: user.start_at,
        }));
      // console.log("Matched Users:", matches);
      setAvailableUsers(matchedUsers);
      setSelectedUsers(new Set()); // 選択をリセット
    } catch (error: any) {
      console.error("Error loading available users:", error);
      Alert.alert("エラー", "利用可能ユーザーの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  // 現在のユーザーステータスを取得
  const loadCurrentUserStatus = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const status = await getUserStatus(session.user.id);
      setCurrentUserStatus(status);
    } catch (error: any) {
      console.error("Error loading user status:", error);
    }
  }, [session?.user?.id]);

  // 初期データ読み込み
  useEffect(() => {
    loadEvents();
    loadCurrentUserStatus();
  }, [loadEvents, loadCurrentUserStatus]);

  // 選択されたイベントが変更されたら利用可能ユーザーを再読み込み
  useEffect(() => {
    loadAvailableUsers();
  }, [loadAvailableUsers]);

  // リフレッシュ処理
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadEvents(),
      loadAvailableUsers(),
      loadCurrentUserStatus(),
    ]);
    setRefreshing(false);
  }, [loadEvents, loadAvailableUsers, loadCurrentUserStatus]);

  // ユーザー選択の切り替え
  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  // 全選択/全解除
  const toggleSelectAll = () => {
    if (selectedUsers.size === availableUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(availableUsers.map((user) => user.id)));
    }
  };

  // 招待送信
  const handleInvite = async () => {
    if (!selectedEventId || selectedUsers.size === 0) {
      Alert.alert("エラー", "イベントとユーザーを選択してください");
      return;
    }

    const selectedEvent = events.find((e) => e.id === selectedEventId);
    if (!selectedEvent) {
      Alert.alert("エラー", "選択されたイベントが見つかりません");
      return;
    }

    const realUserIds = Array.from(selectedUsers);

    Alert.alert(
      "招待を送信しますか？",
      `「${selectedEvent.name}」に${selectedUsers.size}人のユーザーを招待します。`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "送信",
          onPress: async () => {
            setInviting(true);
            try {
              if (realUserIds.length > 0) {
                await inviteUsersToEvent(selectedEventId, realUserIds);
              }

              Alert.alert("成功", "招待を送信しました！");

              // リストを更新
              await loadAvailableUsers();
            } catch (error: any) {
              console.error("Error sending invitations:", error);
              Alert.alert("エラー", "招待の送信に失敗しました");
            } finally {
              setInviting(false);
            }
          },
        },
      ],
    );
  };

  // テスト用：自分を利用可能に設定
  const handleSetAvailable = async () => {
    if (!session?.user?.id) {
      Alert.alert("エラー", "ユーザーIDが取得できません");
      return;
    }

    try {
      await setUserStatusAvailable(session.user.id);
      Alert.alert("成功", "あなたのステータスを利用可能に設定しました");
      await loadCurrentUserStatus();
    } catch (error: any) {
      console.error("Error setting user available:", error);
      Alert.alert("エラー", "ステータス設定に失敗しました");
    }
  };

  if (!session?.user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>ログインが必要です</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>暇な人を誘う</Text>
          <Text style={styles.subtitle}>
            利用可能なユーザーをあなたのイベントに招待しよう
          </Text>
        </View>

        {/* 現在のユーザーステータス表示 */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>あなたの状態</Text>
          <View style={styles.statusCard}>
            {currentUserStatus ? (
              <>
                <Text style={styles.statusText}>
                  ステータス:{" "}
                  {currentUserStatus.status === "available"
                    ? "オンライン"
                    : "オフライン"}
                </Text>
                {/* {currentUserStatus.status === "available" && (
                  <Text style={styles.statusTime}>
                    {currentUserStatus.end_at
                      ? `利用可能期限: ${new Date(currentUserStatus.end_at).toLocaleString("ja-JP")}`
                      : "無期限で利用可能"}
                  </Text>
                )} */}
              </>
            ) : (
              <Text style={styles.statusText}>ステータス: 未設定</Text>
            )}
            {/* <TouchableOpacity
              style={styles.setAvailableButton}
              onPress={handleSetAvailable}
            >
              <Text style={styles.setAvailableButtonText}>利用可能に設定</Text>
            </TouchableOpacity> */}
          </View>
        </View>

        {/* イベント選択 */}
        <View style={styles.eventSelector}>
          {events.length > 0 ? (
            <EventSelector
              events={events}
              selectedEventId={selectedEventId}
              onSelectEvent={setSelectedEventId}
            />
          ) : (
            <View style={styles.noEventContainer}>
              <Text style={styles.noEventText}>イベントを企画してみよう！</Text>
            </View>
          )}
        </View>
        {/* 利用可能ユーザー一覧 */}
        {events.length > 0 && (
          <View style={styles.usersSection}>
            <View style={styles.usersSectionHeader}>
              <Text style={styles.sectionTitle}>
                利用可能なユーザー ({availableUsers.length}人)
              </Text>
              {availableUsers.length > 0 && (
                <TouchableOpacity onPress={toggleSelectAll}>
                  <Text style={styles.selectAllText}>
                    {selectedUsers.size === availableUsers.length
                      ? "全解除"
                      : "全選択"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>読み込み中...</Text>
              </View>
            ) : availableUsers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  現在利用可能なユーザーはいません
                </Text>
                <Text style={styles.emptySubtext}>
                  他のユーザーが利用可能ステータスを設定するまでお待ちください
                </Text>
              </View>
            ) : (
              <View style={styles.usersList}>
                {availableUsers.map((user) => (
                  <AvailableUserItem
                    key={user.id}
                    user={user}
                    isSelected={selectedUsers.has(user.id)}
                    onToggle={toggleUserSelection}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* 招待ボタン */}
      {selectedUsers.size > 0 && selectedEventId && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.inviteButton,
              inviting && styles.inviteButtonDisabled,
            ]}
            onPress={handleInvite}
            disabled={inviting}
          >
            {inviting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.inviteButtonText}>
                {selectedUsers.size}人を招待する
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ...styles definition remains unchanged...

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#007AFF",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.8,
    textAlign: "center",
  },
  statusSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  statusCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
  },
  statusTime: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  setAvailableButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  setAvailableButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  eventSelector: {
    margin: 16,
  },
  eventList: {
    paddingVertical: 8,
  },
  eventItem: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    minWidth: 150,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  selectedEventItem: {
    borderColor: "#007AFF",
    backgroundColor: "#E3F2FD",
  },
  eventName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  selectedEventName: {
    color: "#007AFF",
  },
  eventDate: {
    fontSize: 12,
    color: "#666",
  },
  usersSection: {
    margin: 16,
  },
  usersSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  selectAllText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  loadingContainer: {
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  usersList: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectedUserItem: {
    backgroundColor: "#E3F2FD",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  userStatus: {
    fontSize: 14,
    color: "#666",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#ddd",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  checkedBox: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  checkmark: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  inviteButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  inviteButtonDisabled: {
    backgroundColor: "#ccc",
  },
  inviteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  noEventContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 16,
  },
  noEventText: {
    fontSize: 18,
    color: "#666",
    fontWeight: "bold",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: "#eee",
  },
});
