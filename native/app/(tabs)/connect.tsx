import React, { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../provider/AuthProvider";
import {
  getOrganizerEvents,
  getAvailableUsers,
  inviteIdleUsers,
  setUserStatusAvailable,
  getUserStatus,
  createTestAvailableUsers,
  type OrganizerEvent,
  type AvailableUser,
} from "../../services/organizer";
import { useRouter } from "expo-router";

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
  const isDemo = user.id.startsWith("demo-user-");

  return (
    <TouchableOpacity
      style={[
        styles.userItem,
        isSelected && styles.selectedUserItem,
        isDemo && styles.demoUserItem,
      ]}
      onPress={() => onToggle(user.id)}
    >
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {user.display_name || `User ${user.id.substring(0, 8)}`}
        </Text>
        <Text style={styles.userStatus}>
          最終利用可能:{" "}
          {user.last_active
            ? new Date(user.last_active).toLocaleString("ja-JP")
            : "不明"}
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
      const eventList = await getOrganizerEvents(session.user.id);
      setEvents(eventList);

      // 最初のイベントを自動選択
      if (eventList.length > 0 && !selectedEventId) {
        setSelectedEventId(eventList[0].id);
      }
    } catch (error: any) {
      console.error("Error loading events:", error);
      Alert.alert("エラー", "イベント一覧の取得に失敗しました");
    }
  }, [session?.user?.id, selectedEventId]);

  // 利用可能なユーザーを取得
  const loadAvailableUsers = useCallback(async () => {
    if (!selectedEventId) {
      setAvailableUsers([]);
      return;
    }

    setLoading(true);
    try {
      const users = await getAvailableUsers(selectedEventId);

      // 実際のユーザーが0人の場合、デモ用データを表示
      if (users.length === 0) {
        console.log("No real users available, showing demo users");
        const demoUsers: AvailableUser[] = [
          {
            id: "demo-user-1",
            display_name: "ゆうき",
            avatar_url: null,
            last_active: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30分前
          },
          {
            id: "demo-user-2",
            display_name: "あかり",
            avatar_url: null,
            last_active: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15分前
          },
          {
            id: "demo-user-3",
            display_name: "だいき",
            avatar_url: null,
            last_active: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45分前
          },
          {
            id: "demo-user-4",
            display_name: "みお",
            avatar_url: null,
            last_active: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1時間前
          },
          {
            id: "demo-user-5",
            display_name: "りょう",
            avatar_url: null,
            last_active: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10分前
          },
        ];
        setAvailableUsers(demoUsers);
      } else {
        setAvailableUsers(users);
      }

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

    // デモユーザーを除外
    const realUserIds = Array.from(selectedUsers).filter(
      (id) => !id.startsWith("demo-user-"),
    );
    const demoUserCount = selectedUsers.size - realUserIds.length;

    if (demoUserCount > 0 && realUserIds.length === 0) {
      Alert.alert(
        "招待完了",
        `${demoUserCount}人のユーザーに招待を送信しました！\n\n※ この機能のデモンストレーションです。実際のアプリでは本物のユーザーに招待が送信されます。`,
      );
      // リストを更新（選択をクリア）
      setSelectedUsers(new Set());
      return;
    }

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
                await inviteIdleUsers(selectedEventId, realUserIds);
              }

              const message =
                demoUserCount > 0 && realUserIds.length === 0
                  ? `${demoUserCount}人のユーザーに招待を送信しました！\n\n※ この機能のデモンストレーションです。`
                  : `招待を送信しました！${demoUserCount > 0 ? `\n(${demoUserCount}人はデモユーザーです)` : ""}`;

              Alert.alert("成功", message);

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
    <View style={styles.container}>
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
                    ? "利用可能"
                    : currentUserStatus.status}
                </Text>
                {currentUserStatus.status === "available" && (
                  <Text style={styles.statusTime}>
                    {currentUserStatus.end_at
                      ? `利用可能期限: ${new Date(currentUserStatus.end_at).toLocaleString("ja-JP")}`
                      : "無期限で利用可能"}
                  </Text>
                )}
              </>
            ) : (
              <Text style={styles.statusText}>ステータス: 未設定</Text>
            )}
            <TouchableOpacity
              style={styles.setAvailableButton}
              onPress={handleSetAvailable}
            >
              <Text style={styles.setAvailableButtonText}>利用可能に設定</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* イベント選択 */}
        {events.length > 0 && (
          <EventSelector
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={setSelectedEventId}
          />
        )}

        {/* 利用可能ユーザー一覧 */}
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
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
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
  demoUserItem: {
    backgroundColor: "#F8F9FA",
    borderLeftWidth: 3,
    borderLeftColor: "#6C757D",
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
    marginTop: 40,
  },
});
