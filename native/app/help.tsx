import { useNavigation } from "@react-navigation/native";
import React, { useLayoutEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const faqs = [
  {
    question: "Q. このアプリの主な機能は何ですか？",
    answer:
      "A. このアプリは、イベントを通じて人々が簡単につながるためのサービスです。「見る」タブでイベントを探して参加したり、「企画」タブからご自身でイベントを主催したりすることができます。",
  },
  {
    question: "Q. イベントの「企画」とは何ですか？",
    answer:
      "A. ホーム画面中央の「企画」ボタンから、ご自身が主催者となって新しいイベントを作成できる機能です。日時や場所、内容などを設定し、他のユーザーに参加を呼びかけることができます。",
  },
  {
    question: "Q. イベントの予約方法は？",
    answer:
      "A. 参加したいイベントの詳細ページにある「予約する」ボタンをタップすると予約が完了します。予約したイベントは「予約一覧」タブからご確認いただけます。",
  },
  {
    question: "Q. 予約をキャンセルしたい場合は？",
    answer:
      "A. 「予約一覧」タブからキャンセルしたいイベントを選択し、画面の指示に従って手続きを行ってください。ただし、イベントごとにキャンセルポリシーが定められている場合がありますのでご注意ください。",
  },
  {
    question: "Q. プロフィールはどこで編集できますか？",
    answer:
      "A. 「設定」タブの上部に表示されている、ご自身の名前の部分をタップしてください。プロフィール編集画面に移動し、ニックネームや自己紹介などを変更できます。",
  },
  {
    question: "Q. ログイン（認証）はどのように行われますか？",
    answer:
      "A. 当アプリは、安全なGoogleアカウントを利用した認証方法を採用しています。お客様のパスワードは当サービスでは保管しておりませんので、安心してご利用いただけます。",
  },
  {
    question: "Q. 退会方法を教えてください",
    answer:
      "A. 「設定」タブの「アカウント情報」画面から、アカウントの削除（退会）手続きを行えます。\n注意：一度退会すると、全てのデータが削除され復元することはできません。",
  },
];

const supportEmail = "support@example.com";

export default function HelpScreen() {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ headerBackTitle: "設定" });
  }, [navigation]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* よくある質問 */}
      <Text style={styles.sectionTitle}>よくある質問</Text>
      {faqs.map((faq, idx) => (
        <View key={idx} style={styles.faqItem}>
          <TouchableOpacity
            onPress={() => setOpenIndex(openIndex === idx ? null : idx)}
          >
            <Text style={styles.question}>{faq.question}</Text>
          </TouchableOpacity>
          {openIndex === idx && (
            <View style={styles.answerBox}>
              <Text style={styles.answer}>{faq.answer}</Text>
            </View>
          )}
        </View>
      ))}
      <View style={styles.divider} />
      {/* 問題が解決しない場合 */}
      <Text style={styles.sectionTitle}>問題が解決しない場合</Text>
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          お手数をおかけしますが、以下のメールアドレスまで連絡をください。
        </Text>
        <Text style={styles.email}>{supportEmail}</Text>
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
  faqItem: {
    marginBottom: 4,
  },
  question: {
    fontSize: 15,
    color: "#1976d2",
    fontWeight: "bold",
    paddingVertical: 8,
  },
  answerBox: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  answer: {
    fontSize: 15,
    color: "#222",
  },
  infoBox: {
    marginTop: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 14,
  },
  infoText: {
    fontSize: 15,
    color: "#222",
    marginBottom: 8,
  },
  email: {
    fontSize: 15,
    color: "#1976d2",
    fontWeight: "bold",
  },
});
