import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  Bell,
  ChevronRight,
  FileText,
  HelpCircle,
  UserRound,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase"; // Supabaseクライアントをインポート

// プロフィールデータの型を定義
type Profile = {
  nickname: string | null;
  profile_image_url: string | null;
  email?: string;
};

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // 画面が表示されるたびに最新のプロフィール情報を取得
  useFocusEffect(
    React.useCallback(() => {
      const fetchProfile = async () => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) throw new Error("ユーザーが見つかりません");

          const { data, error } = await supabase
            .from("user_profiles")
            .select("nickname, profile_image_url")
            .eq("id", user.id)
            .single();

          if (error && error.code !== "PGRST116") {
            throw error;
          }

          setProfile({
            nickname: data?.nickname || null,
            profile_image_url: data?.profile_image_url || null,
            email: user.email,
          });
        } catch (error) {
          if (error instanceof Error) {
            Alert.alert(
              "エラー",
              "プロフィールの取得に失敗しました: " + error.message,
            );
          }
        } finally {
          setLoading(false);
        }
      };

      fetchProfile();
    }, []),
  );

  // ログアウト処理
  const handleLogout = async () => {
    Alert.alert("ログアウト", "本当にログアウトしますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "ログアウト",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          navigation.reset({
            index: 0,
            routes: [{ name: "auth" as never }],
          });
        },
      },
    ]);
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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* プロフィールは最上部 */}
        <TouchableOpacity
          style={styles.profileItem}
          onPress={() => navigation.navigate("profile" as never)}
        >
          <View style={styles.profileRow}>
            {profile?.profile_image_url ? (
              <Image
                source={{ uri: profile.profile_image_url }}
                style={styles.profileIcon}
              />
            ) : (
              <View style={styles.profileIcon} />
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileNickname}>
                {profile?.nickname || "ニックネーム未設定"}
              </Text>
              <Text style={styles.profileEmail}>{profile?.email}</Text>
            </View>
            <ChevronRight size={20} color="#bbb" />
          </View>
        </TouchableOpacity>
        <View style={{ height: 12 }} />

        {/* アカウントグループ */}
        <Text style={styles.groupLabel}>アカウント</Text>
        <TouchableOpacity
          style={styles.item}
          onPress={() => navigation.navigate("account" as never)}
        >
          <View style={styles.itemRow}>
            <UserRound size={22} color="#555" style={styles.itemIcon} />
            <Text style={styles.itemText}>アカウント情報</Text>
            <ChevronRight size={20} color="#bbb" />
          </View>
        </TouchableOpacity>

        {/* サポートグループ */}
        <Text style={styles.groupLabel}>サポート</Text>
        <TouchableOpacity
          style={styles.item}
          onPress={() => navigation.navigate("notice" as never)}
        >
          <View style={styles.itemRow}>
            <Bell size={22} color="#555" style={styles.itemIcon} />
            <Text style={styles.itemText}>お知らせ</Text>
            <ChevronRight size={20} color="#bbb" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.item}
          onPress={() => navigation.navigate("help" as never)}
        >
          <View style={styles.itemRow}>
            <HelpCircle size={22} color="#555" style={styles.itemIcon} />
            <Text style={styles.itemText}>ヘルプセンター</Text>
            <ChevronRight size={20} color="#bbb" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.item}
          onPress={() => navigation.navigate("terms" as never)}
        >
          <View style={styles.itemRow}>
            <FileText size={22} color="#555" style={styles.itemIcon} />
            <Text style={styles.itemText}>利用規約</Text>
            <ChevronRight size={20} color="#bbb" />
          </View>
        </TouchableOpacity>

        {/* ログアウトは一番下 */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>ログアウト</Text>
        </TouchableOpacity>

        {/* バージョン情報 */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingVertical: 0,
  },
  item: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  profileItem: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 20,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#eee",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#eee",
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
    justifyContent: "center",
  },
  profileNickname: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
  },
  profileEmail: {
    fontSize: 15,
    color: "#888",
    marginTop: 4,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemIcon: {
    marginRight: 16,
  },
  itemText: {
    fontSize: 16,
    color: "#222",
    flex: 1,
  },
  logoutButton: {
    marginTop: 32,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d32f2f",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginHorizontal: 20,
  },
  logoutButtonText: {
    color: "#d32f2f",
    fontWeight: "bold",
    fontSize: 15,
  },
  versionContainer: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  versionText: {
    fontSize: 14,
    color: "#888",
  },
  groupLabel: {
    fontSize: 13,
    color: "#888",
    backgroundColor: "#f5f5f5",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
});
