import { useFocusEffect } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

// --- 型定義 ---
type Tag = {
  id: string;
  name: string;
};

type Event = {
  id: string;
  name: string;
  description: string;
  location: string;
  start_at: string;
  end_at: string;
  status: string;
  capacity: string | null;
  fee: string | null;
  event_tags: { tags: Tag | null }[];
};

type EventMember = {
  id: string;
  user_id: string;
  event_id: string;
  role: string;
  event: Event | null;
};

type Announcement = {
  id: string;
  event_id: string;
  user_id: string;
  comment: string;
  created_at: string;
};

// --- Supabaseからデータ取得・更新する関数 ---
async function fetchEventMembersWithEvents(userId: string) {
  const { data: members, error: memberError } = await supabase
    .from("event_members")
    .select("*, event:events(*, event_tags(tags(*)))")
    .eq("user_id", userId);
  if (memberError) throw memberError;
  return members || [];
}

async function updateEventMemberRole(id: string, newRole: string) {
  const { error } = await supabase
    .from("event_members")
    .update({ role: newRole })
    .eq("id", id);
  if (error) throw error;
}

async function deleteEventMember(id: string) {
  const { error } = await supabase.from("event_members").delete().eq("id", id);
  if (error) throw error;
}

async function fetchAnnouncements(eventId: string): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export default function BookingsScreen() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"bookings" | "invites">(
    "bookings",
  );
  const [bookings, setBookings] = useState<EventMember[]>([]);
  const [invites, setInvites] = useState<EventMember[]>([]);
  const [notice, setNotice] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ユーザーID取得
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) setUserId(data.user.id);
    })();
  }, []);

  // 画面がフォーカスされるたびにイベント一覧を取得
  useFocusEffect(
    React.useCallback(() => {
      if (!userId) return;
      let isActive = true;
      (async () => {
        setLoading(true);
        try {
          const members = await fetchEventMembersWithEvents(userId);
          if (!isActive) return;

          const now = new Date();
          const validMembers = members.filter((m) => {
            if (!m.event) return false;
            const end = new Date(m.event.end_at);
            return end > now;
          });

          const bookingsList = validMembers
            .filter((m) => m.role === "organizer" || m.role === "participant")
            .sort(
              (a, b) =>
                new Date(a.event!.start_at).getTime() -
                new Date(b.event!.start_at).getTime(),
            );
          const invitesList = validMembers
            .filter((m) => m.role === "invited")
            .sort(
              (a, b) =>
                new Date(a.event!.start_at).getTime() -
                new Date(b.event!.start_at).getTime(),
            );
          setBookings(bookingsList);
          setInvites(invitesList);
        } catch (e) {
          if (e instanceof Error) Alert.alert("エラー", e.message);
        } finally {
          if (isActive) setLoading(false);
        }
      })();
      return () => {
        isActive = false;
      };
    }, [userId]),
  );

  // お知らせ取得
  useEffect(() => {
    if (!selectedId) {
      setNotice("");
      return;
    }
    (async () => {
      try {
        const ann = await fetchAnnouncements(selectedId);
        setNotice(
          ann.length > 0 ? ann[0].comment : "まだお知らせはありません。",
        );
      } catch {
        setNotice("お知らせの取得に失敗しました。");
      }
    })();
  }, [selectedId]);

  const eventList = activeTab === "bookings" ? bookings : invites;
  const selectedItem = eventList.find((item) => item.event?.id === selectedId);
  const selectedEvent = selectedItem?.event;

  // 予約を取り消す
  const handleCancelBooking = () => {
    if (!selectedItem) return;
    Alert.alert(
      "予約を取り消しますか？",
      "本当にこのイベントの予約を取り消しますか？",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "取り消す",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteEventMember(selectedItem.id);
              setBookings(bookings.filter((b) => b.id !== selectedItem.id));
              setSelectedId(null);
            } catch (e) {
              if (e instanceof Error) Alert.alert("エラー", e.message);
            }
          },
        },
      ],
    );
  };

  // 招待イベントに「参加」
  const handleAcceptInvite = () => {
    if (!selectedItem) return;
    (async () => {
      try {
        await updateEventMemberRole(selectedItem.id, "participant");
        const acceptedInvite = invites.find((i) => i.id === selectedItem.id);
        if (acceptedInvite) {
          setInvites(invites.filter((i) => i.id !== selectedItem.id));
          setBookings([
            ...bookings,
            { ...acceptedInvite, role: "participant" },
          ]);
        }
        setSelectedId(null);
      } catch (e) {
        if (e instanceof Error) Alert.alert("エラー", e.message);
      }
    })();
  };

  // 招待イベントに「不参加」
  const handleDeclineInvite = () => {
    if (!selectedItem) return;
    (async () => {
      try {
        await deleteEventMember(selectedItem.id);
        setInvites(invites.filter((i) => i.id !== selectedItem.id));
        setSelectedId(null);
      } catch (e) {
        if (e instanceof Error) Alert.alert("エラー", e.message);
      }
    })();
  };

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        style={{ flex: 1, justifyContent: "center" }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "bookings" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("bookings")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "bookings" && styles.tabTextActive,
            ]}
          >
            予約済み ({bookings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "invites" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("invites")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "invites" && styles.tabTextActive,
            ]}
          >
            招待 ({invites.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Event List */}
      {eventList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {activeTab === "bookings"
              ? "予約済みのイベントはありません"
              : "招待されたイベントはありません"}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {eventList.map((item) => {
            if (!item.event) return null;
            const { event } = item;
            const start = new Date(event.start_at);
            const end = new Date(event.end_at);
            const now = new Date();
            const pad = (n: number) => n.toString().padStart(2, "0");
            const startStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())} ${pad(start.getHours())}:${pad(start.getMinutes())}`;
            const endStr = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())} ${pad(end.getHours())}:${pad(end.getMinutes())}`;
            const isOngoing = now >= start && now < end;

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, isOngoing && styles.openCard]}
                activeOpacity={0.8}
                onPress={() => setSelectedId(event.id)}
              >
                {isOngoing && (
                  <View style={styles.openPop}>
                    <Text style={styles.openPopText}>開催中！</Text>
                  </View>
                )}
                <Text style={styles.cardTitle}>{event.name}</Text>
                <Text style={styles.cardDate}>開始: {startStr}</Text>
                <Text style={styles.cardDate}>終了: {endStr}</Text>
                <Text style={styles.cardlocation}>場所: {event.location}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Event Detail Modal */}
      <Modal
        visible={selectedId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedId(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedId(null)}
        >
          <Pressable style={styles.modalContent}>
            {selectedEvent && (
              <>
                <Text style={styles.modalTitle}>{selectedEvent.name}</Text>
                {(() => {
                  const start = new Date(selectedEvent.start_at);
                  const end = new Date(selectedEvent.end_at);
                  const pad = (n: number) => n.toString().padStart(2, "0");
                  const startStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())} ${pad(start.getHours())}:${pad(start.getMinutes())}`;
                  const endStr = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())} ${pad(end.getHours())}:${pad(end.getMinutes())}`;
                  return (
                    <>
                      <Text style={styles.modalItem}>開始: {startStr}</Text>
                      <Text style={styles.modalItem}>終了: {endStr}</Text>
                    </>
                  );
                })()}
                <Text style={styles.modalItem}>
                  場所: {selectedEvent.location}
                </Text>
                <View style={styles.modalDivider} />
                <Text style={styles.modalItem}>
                  説明: {selectedEvent.description}
                </Text>

                {/* Tags, Capacity, Fee */}
                <View style={styles.tagContainer}>
                  {selectedEvent.event_tags?.map(({ tags }) =>
                    tags ? (
                      <View key={tags.id} style={styles.tag}>
                        <Text style={styles.tagText}>#{tags.name}</Text>
                      </View>
                    ) : null,
                  )}
                </View>

                <View style={styles.modalDivider} />
                <Text style={styles.modalNoticeTitle}>お知らせ</Text>
                <Text style={styles.modalNotice}>{notice}</Text>

                {/* Action Buttons */}
                {activeTab === "bookings" ? (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelBooking}
                  >
                    <Text style={styles.cancelButtonText}>予約を取り消す</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.inviteButtonRow}>
                    <TouchableOpacity
                      style={[styles.inviteButton, styles.inviteAccept]}
                      onPress={handleAcceptInvite}
                    >
                      <Text style={styles.inviteButtonText}>参加</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.inviteButton, styles.inviteDecline]}
                      onPress={handleDeclineInvite}
                    >
                      <Text style={styles.inviteButtonText}>不参加</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalDivider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 12,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    marginBottom: 4,
  },
  tag: {
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    color: "#2196F3",
    fontSize: 14,
  },
  modalNoticeTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#000000ff",
    marginBottom: 4,
  },
  modalNotice: {
    fontSize: 15,
    color: "#222",
    marginBottom: 8,
  },
  cancelButton: {
    marginTop: 24,
    backgroundColor: "#F44336",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  inviteButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  inviteButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginHorizontal: 4,
  },
  inviteAccept: {
    backgroundColor: "#2196F3",
  },
  inviteDecline: {
    backgroundColor: "#BDBDBD",
  },
  inviteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    margin: 16,
    marginBottom: 0,
    overflow: "hidden",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#E3F2FD",
  },
  tabActive: {
    backgroundColor: "#2196F3",
  },
  tabText: {
    fontSize: 16,
    color: "#2196F3",
    fontWeight: "bold",
  },
  tabTextActive: {
    color: "#fff",
  },
  cardlocation: {
    fontSize: 15,
    color: "#666",
    marginBottom: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 17,
    color: "#888",
    textAlign: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#F7F9FB",
  },
  listContainer: {
    padding: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
  },
  openCard: {
    borderColor: "#43a047",
    borderWidth: 2,
  },
  openPop: {
    position: "absolute",
    top: 8,
    right: 12,
    backgroundColor: "#43a047",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 2,
    zIndex: 2,
  },
  openPopText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 28,
    minWidth: 320,
    marginHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 16,
    textAlign: "center",
  },
  modalItem: {
    fontSize: 16,
    color: "#222",
    marginBottom: 8,
  },
});
