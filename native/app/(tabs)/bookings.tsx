import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// サンプルデータ
const bookings = [
  {
    id: 1,
    title: "イベントA",
    age: "25",
    gender: "男性のみ",
    date: "2025/08/20",
    place: "東京都渋谷区",
    people: "10人",
  },
  {
    id: 2,
    title: "イベントB",
    age: "30",
    gender: "制限なし",
    date: "2025/08/22",
    place: "大阪府大阪市",
    people: "5人",
  },
];

export default function BookingsScreen() {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selectedBooking = bookings.find((b) => b.id === selectedId);

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerText}>予約一覧</Text>
      </View>
      {/* 予約リスト */}
      <ScrollView contentContainerStyle={styles.listContainer}>
        {bookings.map((booking) => {
          const isSelected = selectedId === booking.id;
          return (
            <TouchableOpacity
              key={booking.id}
              style={[styles.card, isSelected && styles.selectedCard]}
              activeOpacity={0.8}
              onPress={() => setSelectedId(booking.id)}
            >
              <Text style={styles.cardTitle}>{booking.title}</Text>
              <Text style={styles.cardDate}>{booking.date}</Text>
              <Text style={styles.detailLink}>詳細を見る</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
                <Text style={styles.modalTitle}>{selectedBooking.title}</Text>
                <Text style={styles.modalItem}>
                  年齢: {selectedBooking.age}
                </Text>
                <Text style={styles.modalItem}>
                  性別: {selectedBooking.gender}
                </Text>
                <Text style={styles.modalItem}>
                  日程: {selectedBooking.date}
                </Text>
                <Text style={styles.modalItem}>
                  場所: {selectedBooking.place}
                </Text>
                <Text style={styles.modalItem}>
                  人数: {selectedBooking.people}
                </Text>
                <Text style={styles.modalHint}>タップで詳細を閉じる</Text>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
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
  listContainer: {
    padding: 16,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2196F3",
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
