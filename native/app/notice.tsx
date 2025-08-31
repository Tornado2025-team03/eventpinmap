import { useNavigation } from "@react-navigation/native";
import React, { useLayoutEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const notices = [
  { id: 1, title: "新機能リリースのお知らせ", date: "2025/08/01" },
  { id: 2, title: "メンテナンスのお知らせ", date: "2025/07/15" },
  { id: 3, title: "利用規約改定", date: "2025/07/01" },
];

export default function NoticeScreen() {
  const navigation = useNavigation();
  const [eventPush, setEventPush] = useState(true);
  const [adminPush, setAdminPush] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selectedNotice = notices.find((n) => n.id === selectedId);

  useLayoutEffect(() => {
    navigation.setOptions({ headerBackTitle: "設定" });
  }, [navigation]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* プッシュ通知設定 */}
      <Text style={styles.sectionTitle}>プッシュ通知</Text>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>イベント関連の通知</Text>
        <Switch value={eventPush} onValueChange={setEventPush} />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>運営からのお知らせ</Text>
        <Switch value={adminPush} onValueChange={setAdminPush} />
      </View>

      <View style={styles.divider} />
      {/* お知らせ一覧 */}
      <Text style={styles.sectionTitle}>お知らせ一覧</Text>
      <View style={styles.noticeList}>
        {notices.map((notice) => (
          <TouchableOpacity
            key={notice.id}
            style={styles.noticeItem}
            onPress={() => setSelectedId(notice.id)}
          >
            <Text style={styles.noticeTitle}>{notice.title}</Text>
            <Text style={styles.noticeDate}>{notice.date}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 詳細モーダル */}
      {selectedId !== null && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedId(null)}
          >
            <View style={styles.modalContent}>
              {selectedNotice && (
                <>
                  <Text style={styles.modalTitle}>{selectedNotice.title}</Text>
                  <Text style={styles.modalDate}>{selectedNotice.date}</Text>
                  <Text style={styles.modalText}>
                    詳細内容はここに表示されます。
                  </Text>
                  <Text style={styles.modalHint}>タップで閉じる</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 4,
    color: "#222",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 16,
  },
  container: {
    padding: 24,
    backgroundColor: "#fff",
    minHeight: "100%",
  },
  label: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 6,
    marginTop: 18,
    color: "#222",
  },
  noticeList: {
    marginBottom: 8,
  },
  noticeItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  noticeTitle: {
    fontSize: 15,
    color: "#222",
  },
  noticeDate: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 12,
    textAlign: "center",
  },
  modalDate: {
    fontSize: 13,
    color: "#888",
    marginBottom: 16,
    textAlign: "center",
  },
  modalText: {
    fontSize: 15,
    color: "#222",
    marginBottom: 12,
    textAlign: "center",
  },
  modalHint: {
    fontSize: 13,
    color: "#1976d2",
    marginTop: 8,
    textAlign: "center",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 15,
    color: "#222",
  },
});
