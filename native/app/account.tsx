import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase"; // Supabaseクライアントをインポート

// アカウント情報の型を定義
type AccountInfo = {
  email: string | undefined;
  registeredDate: string;
};

export default function AccountScreen() {
  const navigation = useNavigation();
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({ headerBackTitle: "設定" });
  }, [navigation]);

  // 画面が表示されるたびに最新のアカウント情報を取得
  useFocusEffect(
    React.useCallback(() => {
      const fetchAccountInfo = async () => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) throw new Error("ユーザー情報が取得できませんでした。");

          // 取得した日付をフォーマット
          const formattedDate = new Date(user.created_at).toLocaleDateString(
            "ja-JP",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
            },
          );

          setAccountInfo({
            email: user.email,
            registeredDate: formattedDate,
          });
        } catch (error) {
          if (error instanceof Error) {
            Alert.alert("エラー", error.message);
          }
        } finally {
          setLoading(false);
        }
      };

      fetchAccountInfo();
    }, []),
  );

  const handleDeleteAccount = () => {
    Alert.alert(
      "アカウント削除",
      "本当にアカウントを削除しますか？この操作は取り消せません。",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: async () => {
            try {
              // Supabaseのユーザー削除APIを呼び出し
              const { error } = await supabase.rpc("delete_user");
              if (error) throw error;
              // サインアウトしてauth画面に遷移
              await supabase.auth.signOut();
              navigation.reset({
                index: 0,
                routes: [{ name: "auth" as never }],
              });
            } catch (error) {
              if (error instanceof Error) {
                Alert.alert("削除エラー", error.message);
              } else {
                Alert.alert("削除エラー", "アカウント削除に失敗しました。");
              }
            }
          },
        },
      ],
    );
  };

  // ローディング中はスピナーを表示
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

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
            <Text style={styles.accountValue}>{accountInfo?.email}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.accountLabel}>パスワード</Text>
            <Text style={styles.accountValue}>
              Googleアカウントで管理・変更されています
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.accountLabel}>初回登録日</Text>
            <Text style={styles.accountValue}>
              {accountInfo?.registeredDate}
            </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
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
