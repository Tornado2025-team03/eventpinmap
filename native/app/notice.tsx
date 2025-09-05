import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Notice = {
  id: number;
  title: string;
  date: string;
  detail: string;
};

const notices: Notice[] = [
  {
    id: 1,
    title: "「ヒマップ」完成しました！",
    date: "2025/09/07",
    detail:
      "Tornado2025ハッカソンにて、チーム「Future Huckers」が開発した「ヒマップ」が、ついに完成しました！このアプリが、地図の上でたくさんの素敵な出会いを生み出すきっかけになることを、開発者一同心から願っています。さあ、あなたの周りのイベントを探しに行きましょう！",
  },
  {
    id: 2,
    title: "UI改善と新デザイン",
    date: "2025/09/06",
    detail:
      "アプリ全体のデザインを全面的に見直し、より直感的で、誰にとっても使いやすい画面になりました。",
  },
  {
    id: 3,
    title: "新機能：「招待機能」を追加",
    date: "2025/09/05",
    detail:
      "主催者がイベントに招待をできるようになりました。気になる人を誘って、もっと楽しいイベントにしましょう！",
  },
  {
    id: 4,
    title: "新機能：「繋がる」を追加",
    date: "2025/09/04",
    detail:
      "イベントに近くのユーザーを直接招待できるようになりました。「繋がる」画面から、気になる人を誘ってイベントをもっと楽しみましょう！",
  },
  {
    id: 5,
    title: "新機能：「フィルター機能」を追加",
    date: "2025/09/04",
    detail:
      "「見る」画面で、たくさんのイベントの中から条件を指定して、あなたの興味に合ったものだけを簡単に見つけられるようになりました。",
  },
  {
    id: 6,
    title: "機能改善：アカウントへのデータ保存",
    date: "2025/09/02",
    detail:
      "あなたの企画、予約、設定などの情報が、安全にアカウントに保存されるようになりました。",
  },
  {
    id: 7,
    title: "新機能：「Googleログイン」に対応",
    date: "2025/08/24",
    detail:
      "安全で簡単なGoogle認証を導入しました。これにより、パスワードを覚えることなく、すぐにアプリを始められます。",
  },
  {
    id: 8,
    title: "新機能：「設定」を追加",
    date: "2025/08/24",
    detail:
      "ユーザーがプロフィールや通知設定を変更できる設定画面を追加しました。",
  },
  {
    id: 9,
    title: "新機能：「見る」を追加",
    date: "2025/08/22",
    detail:
      "このアプリのメイン機能であるマップ表示画面が完成しました。あなたの周りで、今どんな面白いことが起きているかを探してみましょう！",
  },
  {
    id: 10,
    title: "新機能：「予約一覧」を追加",
    date: "2025/08/15",
    detail:
      "予約したイベントを確認できる予約一覧画面を追加しました。これにより、あなたの参加予定のイベントを簡単に管理できます。",
  },
  {
    id: 11,
    title: "新機能：「企画」を追加",
    date: "2025/08/14",
    detail:
      "自由にイベントを作成できる企画画面を追加しました。ユーザーは自分の興味に合わせたイベントを簡単に企画・投稿できます。",
  },
  {
    id: 12,
    title: "「ヒマップ」開発スタートのお知らせ",
    date: "2025/08/07",
    detail:
      "Tornado2025ハッカソンのキックオフイベントをきっかけに、チーム「Future Huckers」による「ヒマップ」の開発がスタートしました。このアプリが、行動の壁を越えて、たくさんの素敵な出会いを生み出すことを願っています。",
  },
];

export default function NoticeScreen() {
  const navigation = useNavigation();
  const [eventPush, setEventPush] = useState(true);
  const [adminPush, setAdminPush] = useState(false);

  // プッシュ通知設定の保存・復元（見た目だけ）
  useEffect(() => {
    (async () => {
      const eventPushValue = await AsyncStorage.getItem("eventPush");
      const adminPushValue = await AsyncStorage.getItem("adminPush");
      if (eventPushValue !== null) setEventPush(eventPushValue === "true");
      if (adminPushValue !== null) setAdminPush(adminPushValue === "true");
    })();
  }, []);

  const handleEventPushChange = async (value: boolean) => {
    setEventPush(value);
    await AsyncStorage.setItem("eventPush", value ? "true" : "false");
  };
  const handleAdminPushChange = async (value: boolean) => {
    setAdminPush(value);
    await AsyncStorage.setItem("adminPush", value ? "true" : "false");
  };
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
        <Switch value={eventPush} onValueChange={handleEventPushChange} />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>運営からのお知らせ</Text>
        <Switch value={adminPush} onValueChange={handleAdminPushChange} />
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

      {/* 詳細モーダル（bookings.tsx風UI） */}
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
          <View style={styles.modalContentBookings}>
            {selectedNotice && (
              <>
                <Text style={styles.modalTitleBookings}>
                  {selectedNotice.title}
                </Text>
                <Text style={styles.modalDateBookings}>
                  {selectedNotice.date}
                </Text>
                <View style={{ height: 12 }} />
                <Text style={styles.modalTextBookings}>
                  {selectedNotice.detail}
                </Text>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
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
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContentBookings: {
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
  modalTitleBookings: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 8,
    textAlign: "center",
  },
  modalDateBookings: {
    fontSize: 15,
    color: "#888",
    marginBottom: 8,
    textAlign: "center",
  },
  modalTextBookings: {
    fontSize: 16,
    color: "#222",
    marginBottom: 8,
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
