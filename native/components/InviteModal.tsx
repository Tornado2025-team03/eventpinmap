import React, { useState, useEffect } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getAvailableUsers,
  inviteIdleUsers,
  setUserStatusAvailable,
  getUserStatus,
  createTestAvailableUsers,
  type AvailableUser,
} from "../services/organizer";
import { useAuth } from "../provider/AuthProvider";

interface IdleUser {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  last_active: string | null;
}

interface InviteModalProps {
  visible: boolean;
  eventId: string | null;
  eventName: string;
  onClose: () => void;
}

export function InviteModal({
  visible,
  eventId,
  eventName,
  onClose,
}: InviteModalProps) {
  const { session } = useAuth();
  const [idleUsers, setIdleUsers] = useState<IdleUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [currentUserStatus, setCurrentUserStatus] = useState<any>(null);

  const loadIdleUsers = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const availableUsers = await getAvailableUsers(eventId);
      setIdleUsers(availableUsers);

      // 現在のユーザーステータスも取得
      if (session?.user?.id) {
        const userStatus = await getUserStatus(session.user.id);
        setCurrentUserStatus(userStatus);
        console.log("Current user status:", userStatus);
      }
    } catch (error: any) {
      Alert.alert("エラー", "ユーザー情報の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && eventId) {
      loadIdleUsers();
      setSelectedUsers(new Set());
    }
  }, [visible, eventId]);

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const selectAllUsers = () => {
    const allUserIds = idleUsers.map((user) => user.id);
    setSelectedUsers(new Set(allUserIds));
  };

  const clearAllSelection = () => {
    setSelectedUsers(new Set());
  };

  const handleTestAvailable = async () => {
    if (!session?.user?.id) {
      Alert.alert("エラー", "ユーザーIDが取得できません");
      return;
    }

    try {
      await setUserStatusAvailable(session.user.id);
      Alert.alert(
        "成功",
        "あなたのステータスをavailableに設定しました。更新ボタンを押してください。",
      );
    } catch (error: any) {
      console.error("Test available error:", error);
      Alert.alert("エラー", "ステータス設定に失敗しました");
    }
  };

  const handleCreateTestUsers = async () => {
    try {
      await createTestAvailableUsers();
      Alert.alert(
        "情報",
        "テスト用ユーザー作成はセキュリティ制限により無効です。代わりに別のアカウントでログインして利用可能ステータスを設定してください。",
      );
    } catch (error: any) {
      console.error("Create test users error:", error);
      Alert.alert("情報", error.message || "テストユーザー作成に失敗しました");
    }
  };

  const handleInvite = async () => {
    if (!eventId || selectedUsers.size === 0) {
      Alert.alert("エラー", "招待するユーザーを選択してください");
      return;
    }

    Alert.alert(
      "招待を送信しますか？",
      `選択した${selectedUsers.size}人のユーザーに招待を送信します。\n招待されたユーザーは予約一覧で確認・参加可能になります。`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "送信",
          onPress: async () => {
            setInviting(true);
            try {
              await inviteIdleUsers(eventId, Array.from(selectedUsers));
              Alert.alert(
                "招待送信完了！",
                `${selectedUsers.size}人のユーザーに招待を送信しました。\n相手の予約一覧に表示され、参加・不参加を選択できます。`,
                [{ text: "OK", onPress: onClose }],
              );
            } catch (error: any) {
              console.error("招待送信エラー:", error);
              Alert.alert(
                "エラー",
                "招待の送信に失敗しました。\nネットワーク接続を確認してもう一度お試しください。",
              );
              setInviting(false);
            }
          },
        },
      ],
    );
  };

  const formatLastActive = (lastActive: string | null) => {
    if (!lastActive) return "不明";
    const date = new Date(lastActive);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return "1時間以内";
    if (diffInHours < 24) return `${diffInHours}時間前`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}日前`;
    return "1週間以上前";
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>暇な人を誘う</Text>
            <Text style={styles.subtitle}>{eventName}</Text>

            {idleUsers.length > 0 && (
              <View style={styles.selectionButtons}>
                <TouchableOpacity
                  style={styles.selectionButton}
                  onPress={selectAllUsers}
                >
                  <Text style={styles.selectionButtonText}>全選択</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.selectionButton}
                  onPress={clearAllSelection}
                >
                  <Text style={styles.selectionButtonText}>全解除</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={loadIdleUsers}
                  disabled={loading}
                >
                  <Text style={styles.refreshButtonText}>
                    {loading ? "更新中..." : "更新"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {idleUsers.length === 0 && !loading && (
              <View style={styles.testSection}>
                <Text style={styles.testText}>
                  招待可能なユーザーがいません。{"\n"}
                  テスト用に自分をavailableに設定してください：
                </Text>
                <TouchableOpacity
                  style={styles.testButton}
                  onPress={handleTestAvailable}
                >
                  <Text style={styles.testButtonText}>
                    自分をavailableに設定
                  </Text>
                </TouchableOpacity>
                <Text
                  style={[styles.testText, { fontSize: 12, marginTop: 10 }]}
                >
                  注意：テストモードでは自分自身も招待可能として表示されます
                </Text>
              </View>
            )}
          </View>

          <ScrollView
            style={styles.userList}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <Text style={styles.loadingText}>読み込み中...</Text>
            ) : idleUsers.length === 0 ? (
              <Text style={styles.emptyText}>招待可能なユーザーがいません</Text>
            ) : (
              idleUsers.map((user) => (
                <TouchableOpacity
                  key={user.id}
                  style={[
                    styles.userCard,
                    selectedUsers.has(user.id) && styles.selectedUserCard,
                  ]}
                  onPress={() => toggleUserSelection(user.id)}
                >
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {user.display_name || "ユーザー"}
                    </Text>
                    <Text style={styles.lastActive}>
                      最終アクティブ: {formatLastActive(user.last_active)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      selectedUsers.has(user.id) && styles.checkedBox,
                    ]}
                  >
                    {selectedUsers.has(user.id) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.selectedCount}>
              {selectedUsers.size}人選択中
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.inviteButton,
                  (selectedUsers.size === 0 || inviting) &&
                    styles.disabledButton,
                ]}
                onPress={handleInvite}
                disabled={selectedUsers.size === 0 || inviting}
              >
                <Text style={styles.inviteButtonText}>
                  {inviting ? "送信中..." : "招待を送信"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
  },
  selectionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  selectionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    backgroundColor: "#F5F5F5",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  selectionButtonText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
  },
  refreshButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    backgroundColor: "#2196F3",
    borderRadius: 6,
  },
  refreshButtonText: {
    fontSize: 12,
    color: "#fff",
    textAlign: "center",
    fontWeight: "500",
  },
  testSection: {
    padding: 20,
    alignItems: "center",
  },
  testText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  testButton: {
    backgroundColor: "#FF9800",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  testButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  userList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingText: {
    textAlign: "center",
    padding: 20,
    color: "#666",
  },
  emptyText: {
    textAlign: "center",
    padding: 20,
    color: "#999",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedUserCard: {
    borderColor: "#2196F3",
    backgroundColor: "#E3F2FD",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
  },
  lastActive: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  checkedBox: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  selectedCount: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#666",
    marginRight: 8,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  inviteButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#2196F3",
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
  },
  inviteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
