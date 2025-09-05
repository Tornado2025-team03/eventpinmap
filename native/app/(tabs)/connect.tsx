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
} from "react-native";
import { useAuth } from "../../provider/AuthProvider";
import {
  getOrganizerEvents,
  getEventMembers,
  updateMemberStatus,
  type OrganizerEvent,
  type EventMember,
} from "../../services/organizer";
import { useRouter } from "expo-router";
import { InviteModal } from "../../components/InviteModal";
import { AnnounceModal } from "../../components/AnnounceModal";

interface EventDetailModalProps {
  event: OrganizerEvent | null;
  visible: boolean;
  onClose: () => void;
  onInviteUsers: () => void;
  onAnnounce: () => void;
}

function EventDetailModal({
  event,
  visible,
  onClose,
  onInviteUsers,
  onAnnounce,
}: EventDetailModalProps) {
  const [members, setMembers] = useState<EventMember[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMembers = useCallback(async () => {
    if (!event) return;
    setLoading(true);
    try {
      const memberList = await getEventMembers(event.id);
      setMembers(memberList);
    } catch (error: any) {
      Alert.alert("エラー", "参加者情報の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [event]);

  useEffect(() => {
    if (visible && event) {
      loadMembers();
    }
  }, [visible, event, loadMembers]);

  const handleMemberStatusUpdate = async (
    memberId: string,
    status: "approved" | "rejected",
  ) => {
    try {
      await updateMemberStatus(memberId, status);
      await loadMembers(); // リロード
      Alert.alert(
        "成功",
        `参加者の状態を${status === "approved" ? "承認" : "拒否"}に変更しました`,
      );
    } catch (error: any) {
      Alert.alert("エラー", "状態の更新に失敗しました");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!event) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>{event.name}</Text>

            <View style={styles.eventInfo}>
              <Text style={styles.eventInfoLabel}>日時</Text>
              <Text style={styles.eventInfoText}>
                {formatDate(event.start_at)}
              </Text>

              {event.location && (
                <>
                  <Text style={styles.eventInfoLabel}>場所</Text>
                  <Text style={styles.eventInfoText}>{event.location}</Text>
                </>
              )}

              {event.description && (
                <>
                  <Text style={styles.eventInfoLabel}>説明</Text>
                  <Text style={styles.eventInfoText}>{event.description}</Text>
                </>
              )}
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onInviteUsers}
              >
                <Text style={styles.actionButtonText}>暇な人を誘う</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onAnnounce}
              >
                <Text style={styles.actionButtonText}>アナウンス</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>
              参加者一覧 ({members.length}人)
            </Text>

            {loading ? (
              <Text style={styles.loadingText}>読み込み中...</Text>
            ) : members.length === 0 ? (
              <Text style={styles.emptyText}>まだ参加者がいません</Text>
            ) : (
              members.map((member) => (
                <View key={member.id} style={styles.memberCard}>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {member.profiles?.[0]?.display_name || "ユーザー"}
                    </Text>
                    <Text
                      style={[
                        styles.memberStatus,
                        member.status === "approved" && styles.approvedStatus,
                        member.status === "pending" && styles.pendingStatus,
                        member.status === "rejected" && styles.rejectedStatus,
                      ]}
                    >
                      {member.status === "approved"
                        ? "承認済み"
                        : member.status === "pending"
                          ? "承認待ち"
                          : "拒否"}
                    </Text>
                  </View>

                  {member.status === "pending" && (
                    <View style={styles.memberActions}>
                      <TouchableOpacity
                        style={[styles.memberButton, styles.approveButton]}
                        onPress={() =>
                          handleMemberStatusUpdate(member.id, "approved")
                        }
                      >
                        <Text style={styles.memberButtonText}>承認</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.memberButton, styles.rejectButton]}
                        onPress={() =>
                          handleMemberStatusUpdate(member.id, "rejected")
                        }
                      >
                        <Text style={styles.memberButtonText}>拒否</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>閉じる</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function ConnectScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<OrganizerEvent | null>(
    null,
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [announceModalVisible, setAnnounceModalVisible] = useState(false);

  const loadEvents = useCallback(async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const organizerEvents = await getOrganizerEvents(session.user.id);
      setEvents(organizerEvents);
    } catch (error: any) {
      Alert.alert("エラー", "イベント情報の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleEventPress = (event: OrganizerEvent) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const handleInviteUsers = () => {
    setModalVisible(false);
    setTimeout(() => setInviteModalVisible(true), 100);
  };

  const handleAnnounce = () => {
    setModalVisible(false);
    setTimeout(() => setAnnounceModalVisible(true), 100);
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEventStatus = (event: OrganizerEvent) => {
    const now = new Date();
    const startDate = new Date(event.start_at);
    const endDate = event.end_at ? new Date(event.end_at) : null;

    if (endDate && now > endDate) return "ended";
    if (now > startDate) return "ongoing";
    return "upcoming";
  };

  if (!session) {
    return (
      <View style={styles.container}>
        <View style={styles.authRequired}>
          <Text style={styles.authRequiredText}>ログインが必要です</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/auth")}
          >
            <Text style={styles.loginButtonText}>ログイン</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>繋がる</Text>
        <Text style={styles.headerSubtext}>主催イベントの管理</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadEvents} />
        }
      >
        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              主催しているイベントはありません
            </Text>
            <TouchableOpacity
              style={styles.createEventButton}
              onPress={() => router.push("/(tabs)/plan")}
            >
              <Text style={styles.createEventButtonText}>
                イベントを作成する
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          events.map((event) => {
            const status = getEventStatus(event);
            return (
              <TouchableOpacity
                key={event.id}
                style={[
                  styles.eventCard,
                  status === "ended" && styles.endedCard,
                ]}
                onPress={() => handleEventPress(event)}
                activeOpacity={0.8}
              >
                <View style={styles.eventCardHeader}>
                  <Text style={styles.eventTitle}>{event.name}</Text>
                  <Text
                    style={[
                      styles.eventStatusBadge,
                      status === "upcoming" && styles.upcomingBadge,
                      status === "ongoing" && styles.ongoingBadge,
                      status === "ended" && styles.endedBadge,
                    ]}
                  >
                    {status === "upcoming"
                      ? "開催予定"
                      : status === "ongoing"
                        ? "開催中"
                        : "終了"}
                  </Text>
                </View>
                <Text style={styles.eventDate}>
                  {formatEventDate(event.start_at)}
                </Text>
                {event.location && (
                  <Text style={styles.eventLocation}>{event.location}</Text>
                )}
                <Text style={styles.detailLink}>タップして管理</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <EventDetailModal
        event={selectedEvent}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onInviteUsers={handleInviteUsers}
        onAnnounce={handleAnnounce}
      />

      <InviteModal
        visible={inviteModalVisible}
        eventId={selectedEvent?.id || null}
        eventName={selectedEvent?.name || ""}
        onClose={() => setInviteModalVisible(false)}
      />

      <AnnounceModal
        visible={announceModalVisible}
        eventId={selectedEvent?.id || null}
        eventName={selectedEvent?.name || ""}
        onClose={() => setAnnounceModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FB",
  },
  header: {
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222",
  },
  headerSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
  },
  authRequired: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  authRequiredText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  loginButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  createEventButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createEventButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  endedCard: {
    opacity: 0.7,
    backgroundColor: "#F5F5F5",
  },
  eventCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
    flex: 1,
  },
  eventStatusBadge: {
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  upcomingBadge: {
    backgroundColor: "#E3F2FD",
    color: "#2196F3",
  },
  ongoingBadge: {
    backgroundColor: "#E8F5E8",
    color: "#4CAF50",
  },
  endedBadge: {
    backgroundColor: "#EEEEEE",
    color: "#666",
  },
  eventDate: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: "#999",
    marginBottom: 8,
  },
  detailLink: {
    fontSize: 14,
    color: "#2196F3",
    textAlign: "right",
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    maxWidth: "90%",
    maxHeight: "80%",
    width: 350,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 16,
    textAlign: "center",
  },
  eventInfo: {
    marginBottom: 20,
  },
  eventInfoLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
    marginTop: 12,
    marginBottom: 4,
  },
  eventInfoText: {
    fontSize: 16,
    color: "#222",
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    padding: 20,
  },
  memberCard: {
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  memberInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
  },
  memberStatus: {
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  approvedStatus: {
    backgroundColor: "#E8F5E8",
    color: "#4CAF50",
  },
  pendingStatus: {
    backgroundColor: "#FFF3E0",
    color: "#FF9800",
  },
  rejectedStatus: {
    backgroundColor: "#FFEBEE",
    color: "#F44336",
  },
  memberActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  memberButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  approveButton: {
    backgroundColor: "#4CAF50",
  },
  rejectButton: {
    backgroundColor: "#F44336",
  },
  memberButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  closeButton: {
    backgroundColor: "#666",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
