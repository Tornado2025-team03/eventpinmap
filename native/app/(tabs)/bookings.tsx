import React, { useState } from "react";
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

// サンプルデータ
const initialBookings = [
  {
    id: 1,
    name: "React Native もくもく会@渋谷",
    description:
      "アプリ開発者やデザイナーが集まって、各自の作業を進める会です。初心者も歓迎！",
    location: "TECH BISTRO SHIBUYA",
    start_at: "2025/09/15 19:00",
    end_at: "2025/09/15 21:30",
    status: "開催前",
  },
  {
    id: 2,
    name: "スタートアップのための資金調達セミナー",
    description:
      "VCからの資金調達のノウハウや、魅力的な事業計画書の作り方を解説します。",
    location: "ナレッジベース大阪 カンファレンスルームB",
    start_at: "2025/08/25 14:00",
    end_at: "2025/08/25 16:00",
    status: "終了",
  },
];

const initialInvites = [
  {
    id: 101,
    name: "新規イベントの招待",
    description: "あああ",
    location: "新宿コワーキングスペース",
    start_at: "2025/09/20 18:00",
    end_at: "2025/09/20 20:00",
    status: "招待中",
  },
];

export default function BookingsScreen() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"bookings" | "invites">(
    "bookings",
  );
  const [bookings, setBookings] = useState(initialBookings);
  const [invites, setInvites] = useState(initialInvites);
  // お知らせ（DBから取得する想定）
  const [notice, setNotice] = useState<string>("");

  React.useEffect(() => {
    // 仮: DBから取得する処理
    if (selectedId !== null) {
      // ここでAPI等から取得する
      // 例: fetchNotice(selectedId).then(setNotice)
      // 今はダミー
      setNotice("イベントに関する最新のお知らせが表示されます。");
    } else {
      setNotice("");
    }
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
          onPress: () => {
            setBookings(bookings.filter((b) => b.id !== selectedBooking.id));
            setSelectedId(null);
          },
        },
      ],
    );
  };

  // 招待イベントに「参加」
  const handleAcceptInvite = () => {
    if (!selectedBooking) return;
    setBookings([...bookings, selectedBooking]);
    setInvites(invites.filter((b) => b.id !== selectedBooking.id));
    setSelectedId(null);
  };

  // 招待イベントに「不参加」
  const handleDeclineInvite = () => {
    if (!selectedBooking) return;
    setInvites(invites.filter((b) => b.id !== selectedBooking.id));
    setSelectedId(null);
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
            return (
              <TouchableOpacity
                key={booking.id}
                style={[styles.card, isSelected && styles.selectedCard]}
                activeOpacity={0.8}
                onPress={() => setSelectedId(booking.id)}
              >
                <Text style={styles.cardTitle}>{booking.name}</Text>
                <Text style={styles.cardDate}>開始: {booking.start_at}</Text>
                <Text style={styles.cardDate}>終了: {booking.end_at}</Text>
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
                <Text style={styles.modalItem}>
                  開始日時: {selectedBooking.start_at}
                </Text>
                <Text style={styles.modalItem}>
                  終了日時: {selectedBooking.end_at}
                </Text>
                <Text style={styles.modalItem}>
                  場所: {selectedBooking.location}
                </Text>
                <View style={{ height: 12 }} />
                <Text style={styles.modalItem}>
                  説明: {selectedBooking.description}
                </Text>
                <Text style={styles.modalItem}>
                  ステータス: {selectedBooking.status}
                </Text>
                <View style={{ height: 8 }} />
                <Text style={styles.modalNoticeTitle}>お知らせ</Text>
                <Text style={styles.modalNotice}>{notice}</Text>

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
  modalHint: {
    fontSize: 14,
    color: "#2196F3",
    marginTop: 16,
    textAlign: "center",
  },
});
