import { useFocusEffect } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
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

// --- Supabase用 型定義 ---
export type Event = {
  id: string;
  name: string;
  description: string;
  location: string;
  start_at: string;
  end_at: string;
  status: string;
};

export type EventMember = {
  id: string;
  user_id: string;
  event_id: string;
  role: string;
};

export type Announcement = {
  id: string;
  event_id: string;
  user_id: string;
  comment: string;
  created_at: string;
};

// --- Supabaseからデータ取得・更新する関数 ---
export async function fetchEventMembersWithEvents(userId: string) {
  // event_membersから自分の参加・招待情報を取得
  const { data: members, error: memberError } = await supabase
    .from("event_members")
    .select("*, event:events(*)")
    .eq("user_id", userId);
  if (memberError) throw memberError;
  // event:events(*)でイベント詳細も同時取得
  return members || [];
}

export async function updateEventMemberRole(id: string, newRole: string) {
  const { error } = await supabase
    .from("event_members")
    .update({ role: newRole })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteEventMember(id: string) {
  const { error } = await supabase.from("event_members").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchAnnouncements(
  eventId: string,
): Promise<Announcement[]> {
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
  const [bookings, setBookings] = useState<any[]>([]); // 予約済み
  const [invites, setInvites] = useState<any[]>([]); // 招待
  const [notice, setNotice] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);

  // ユーザーID取得
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user?.id) setUserId(data.user.id);
    })();
  }, []);

  // 画面がフォーカスされるたびにイベント一覧を取得
  useFocusEffect(
    React.useCallback(() => {
      if (!userId) return;
      let isActive = true;
      (async () => {
        try {
          const members = await fetchEventMembersWithEvents(userId);
          const now = new Date();
          const valid = members.filter((m: any) => {
            const end = new Date(m.event.end_at);
            return end > now;
          });
          if (isActive) {
            // 開始日時が早い順にソート
            const bookingsList = valid
              .filter(
                (m: any) => m.role === "organizer" || m.role === "participant",
              )
              .map((m: any) => ({ ...m.event, memberId: m.id }))
              .sort(
                (a: any, b: any) =>
                  new Date(a.start_at).getTime() -
                  new Date(b.start_at).getTime(),
              );
            const invitesList = valid
              .filter((m: any) => m.role === "invited")
              .map((m: any) => ({ ...m.event, memberId: m.id }))
              .sort(
                (a: any, b: any) =>
                  new Date(a.start_at).getTime() -
                  new Date(b.start_at).getTime(),
              );
            setBookings(bookingsList);
            setInvites(invitesList);
          }
        } catch (e) {
          if (isActive) {
            setBookings([]);
            setInvites([]);
          }
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
        setNotice(ann.length > 0 ? ann[0].comment : "");
      } catch {
        setNotice("");
      }
    })();
  }, [selectedId]);

  // タブごとに表示するリストを切り替え
  const eventList = activeTab === "bookings" ? bookings : invites;
  const selectedBooking = eventList.find((b) => b.id === selectedId);

  // 予約を取り消す
  const handleCancelBooking = () => {
    if (!selectedBooking) return;
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
              await deleteEventMember(selectedBooking.memberId);
              setBookings(bookings.filter((b) => b.id !== selectedBooking.id));
              setSelectedId(null);
            } catch {}
          },
        },
      ],
    );
  };

  // 招待イベントに「参加」
  const handleAcceptInvite = () => {
    if (!selectedBooking) return;
    (async () => {
      try {
        await updateEventMemberRole(selectedBooking.memberId, "participant");
        setInvites(invites.filter((b) => b.id !== selectedBooking.id));
        setBookings([...bookings, selectedBooking]);
        setSelectedId(null);
      } catch {}
    })();
  };

  // 招待イベントに「不参加」
  const handleDeclineInvite = () => {
    if (!selectedBooking) return;
    (async () => {
      try {
        await deleteEventMember(selectedBooking.memberId);
        setInvites(invites.filter((b) => b.id !== selectedBooking.id));
        setSelectedId(null);
      } catch {}
    })();
  };

  return (
    <View style={styles.container}>
      {/* タブ切り替え */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "bookings" && styles.tabActive,
          ]}
          onPress={() => {
            setActiveTab("bookings");
            setSelectedId(null);
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "bookings" && styles.tabTextActive,
            ]}
          >
            予約済み
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "invites" && styles.tabActive,
          ]}
          onPress={() => {
            setActiveTab("invites");
            setSelectedId(null);
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "invites" && styles.tabTextActive,
            ]}
          >
            招待
          </Text>
        </TouchableOpacity>
      </View>

      {/* リスト表示 */}
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
          {eventList.map((booking) => {
            const isSelected = selectedId === booking.id;
            // 日付フォーマット: 開始時間: YYYY-MM-DD HH:mm, 終了時間: YYYY-MM-DD HH:mm
            const start = new Date(booking.start_at);
            const end = new Date(booking.end_at);
            const now = new Date();
            const pad = (n: number) => n.toString().padStart(2, "0");
            const startStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())} ${pad(start.getHours())}:${pad(start.getMinutes())}`;
            const endStr = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())} ${pad(end.getHours())}:${pad(end.getMinutes())}`;
            // 開催中判定: 現在時刻が開始以上・終了未満
            const isOngoing = now >= start && now < end;
            return (
              <TouchableOpacity
                key={booking.id}
                style={[
                  styles.card,
                  isSelected && styles.selectedCard,
                  isOngoing && styles.openCard,
                ]}
                activeOpacity={0.8}
                onPress={() => setSelectedId(booking.id)}
              >
                {/* 開催中ポップ */}
                {isOngoing && (
                  <View style={styles.openPop}>
                    <Text style={styles.openPopText}>開催中！</Text>
                  </View>
                )}
                <Text style={styles.cardTitle}>{booking.name}</Text>
                <Text style={styles.cardDate}>開始時間: {startStr}</Text>
                <Text style={styles.cardDate}>終了時間: {endStr}</Text>
                <Text style={styles.cardlocation}>
                  場所: {booking.location}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* 詳細表示 */}
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
          <View style={styles.modalContent}>
            {selectedBooking && (
              <>
                <Text style={styles.modalTitle}>{selectedBooking.name}</Text>
                {(() => {
                  const start = new Date(selectedBooking.start_at);
                  const end = new Date(selectedBooking.end_at);
                  const pad = (n: number) => n.toString().padStart(2, "0");
                  const startStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())} ${pad(start.getHours())}:${pad(start.getMinutes())}`;
                  const endStr = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())} ${pad(end.getHours())}:${pad(end.getMinutes())}`;
                  return (
                    <>
                      <Text style={styles.modalItem}>開始日時: {startStr}</Text>
                      <Text style={styles.modalItem}>終了日時: {endStr}</Text>
                    </>
                  );
                })()}
                <Text style={styles.modalItem}>
                  場所: {selectedBooking.location}
                </Text>
                <View style={styles.modalDivider} />
                {(() => {
                  const lines = selectedBooking.description.split(/\r?\n/);
                  return lines.map((line: string, idx: number) => (
                    <Text style={styles.modalItem} key={idx}>
                      {idx === 0 ? `説明: ${line}` : line}
                    </Text>
                  ));
                })()}
                <View style={{ height: 8 }} />
                <Text style={styles.modalNoticeTitle}>お知らせ</Text>
                <Text style={styles.modalNotice}>
                  {notice ? notice : "お知らせはありません"}
                </Text>

                {/* ボタン群 */}
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
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
  cardStatus: {
    fontSize: 15,
    color: "#2196F3",
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "right",
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
  selectedCard: {
    borderColor: "#2196F3",
    backgroundColor: "#E3F2FD",
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
    marginBottom: 12,
  },
  detailLink: {
    fontSize: 16,
    color: "#2196F3",
    textAlign: "right",
    marginTop: 8,
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
    minWidth: 280,
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
  modalDivider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 12,
  },
  modalHint: {
    fontSize: 14,
    color: "#2196F3",
    marginTop: 16,
    textAlign: "center",
  },
});
