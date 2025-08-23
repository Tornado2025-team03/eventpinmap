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

  useLayoutEffect(() => {
    navigation.setOptions({ headerBackTitle: "設定" });
  }, [navigation]);

  const handleNoticePress = (noticeId: number) => {
    // 詳細ページへ遷移（仮）
    // navigation.navigate("NoticeDetail" as never, { id: noticeId } as never);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>お知らせ一覧</Text>
      <View style={styles.noticeList}>
        {notices.map((notice) => (
          <TouchableOpacity
            key={notice.id}
            style={styles.noticeItem}
            onPress={() => handleNoticePress(notice.id)}
          >
            <View>
              <Text style={styles.noticeTitle}>{notice.title}</Text>
              <Text style={styles.noticeDate}>{notice.date}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>プッシュ通知設定</Text>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>イベント関連の通知</Text>
        <Switch value={eventPush} onValueChange={setEventPush} />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>運営からのお知らせ</Text>
        <Switch value={adminPush} onValueChange={setAdminPush} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
