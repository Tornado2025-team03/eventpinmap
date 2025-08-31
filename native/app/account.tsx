import { useNavigation } from "@react-navigation/native";
import React, { useLayoutEffect } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function AccountScreen() {
  const navigation = useNavigation();
  // 仮データ: DBから取得予定
  const email = "user@example.com";
  const registeredDate = "2025年8月1日";

  useLayoutEffect(() => {
    navigation.setOptions({ headerBackTitle: "設定" });
  }, [navigation]);

  const handleDeleteAccount = () => {
    Alert.alert(
      "アカウント削除",
      "本当にアカウントを削除しますか？この操作は取り消せません。",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: () => {
            /* 削除処理 */
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 連携中のアカウント */}
      <Text style={styles.sectionTitle}>連携中のアカウント</Text>
      <View style={styles.accountRow}>
        {/* Googleアイコン */}
        <View style={styles.googleIconContainer}>
          <Text style={styles.googleIcon}>G</Text>
        </View>
        <View style={styles.accountInfoContainer}>
          <View style={styles.infoItem}>
            <Text style={styles.accountLabel}>メールアドレス</Text>
            <Text style={styles.accountValue}>{email}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.accountLabel}>パスワード</Text>
            <Text style={styles.accountValue}>
              Googleアカウントで管理・変更されています
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.accountLabel}>初回登録日</Text>
            <Text style={styles.accountValue}>{registeredDate}</Text>
          </View>
        </View>
      </View>
      <View style={styles.divider} />
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDeleteAccount}
      >
        <Text style={styles.deleteButtonText}>アカウントの削除</Text>
      </TouchableOpacity>
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
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  googleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  googleIcon: {
    fontSize: 28,
    color: "#4285F4",
    fontWeight: "bold",
  },
  accountInfoContainer: {
    flex: 1,
  },
  accountLabel: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },
  accountValue: {
    fontSize: 15,
    color: "#222",
    marginBottom: 2,
  },
  infoItem: {
    marginBottom: 4,
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
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    backgroundColor: "#fafafa",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  emailText: {
    fontSize: 15,
    color: "#222",
  },
  changeButton: {
    backgroundColor: "#eee",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeButtonText: {
    color: "#1976d2",
    fontWeight: "bold",
    fontSize: 14,
  },
  deleteButton: {
    marginTop: 32,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d32f2f",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#d32f2f",
    fontWeight: "bold",
    fontSize: 15,
  },
});
