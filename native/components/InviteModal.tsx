import React, { useState, useEffect } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { inviteIdleUsers } from "../services/organizer";

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
  const [idleUsers, setIdleUsers] = useState<IdleUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadIdleUsers = async () => {
    setLoading(true);
    try {
      // 実装例: 最近アクティブでまだこのイベントに参加していないユーザーを取得
      const { data: currentMembers } = await supabase
        .from("event_members")
        .select("user_id")
        .eq("event_id", eventId);

      const excludeUserIds = currentMembers?.map((m) => m.user_id) || [];

      const { data: users, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, last_active")
        .not("id", "in", `(${excludeUserIds.join(",")})`)
        .order("last_active", { ascending: false })
        .limit(50);

      if (error) throw error;
      setIdleUsers(users || []);
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
      setSearchQuery("");
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

  const handleInvite = async () => {
    if (!eventId || selectedUsers.size === 0) {
      Alert.alert("エラー", "招待するユーザーを選択してください");
      return;
    }

    setInviting(true);
    try {
      await inviteIdleUsers(eventId, Array.from(selectedUsers));
      Alert.alert(
        "成功",
        `${selectedUsers.size}人のユーザーに招待を送信しました`,
      );
      onClose();
    } catch (error: any) {
      Alert.alert("エラー", "招待の送信に失敗しました");
    } finally {
      setInviting(false);
    }
  };

  const filteredUsers = idleUsers.filter(
    (user) =>
      !searchQuery ||
      user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="ユーザー名で検索..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <ScrollView
            style={styles.userList}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <Text style={styles.loadingText}>読み込み中...</Text>
            ) : filteredUsers.length === 0 ? (
              <Text style={styles.emptyText}>
                {searchQuery
                  ? "該当するユーザーが見つかりません"
                  : "招待可能なユーザーがいません"}
              </Text>
            ) : (
              filteredUsers.map((user) => (
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
  searchInput: {
    margin: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    fontSize: 16,
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
