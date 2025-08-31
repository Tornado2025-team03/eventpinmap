import { useNavigation } from "@react-navigation/native";
import { Bell, FileText, HelpCircle, UserRound } from "lucide-react-native";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const settingsItems = [
  { label: "プロフィール", screen: "profile" },
  { label: "アカウント情報", screen: "account" },
  { label: "お知らせ", screen: "notice" },
  { label: "ヘルプセンター", screen: "help" },
  { label: "利用規約", screen: "terms" },
  { label: "ログアウト", screen: "logout" },
];

export default function SettingsScreen() {
  const navigation = useNavigation();
  // 仮データ: DBから取得する予定
  const nickname = "山田太郎";
  const email = "user@example.com";

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* プロフィールは最上部 */}
        <TouchableOpacity
          style={styles.profileItem}
          onPress={() => navigation.navigate("profile" as never)}
        >
          <View style={styles.profileRow}>
            <View style={styles.profileIcon} /> {/* 仮プロフィール画像 */}
            <View style={styles.profileInfo}>
              <Text style={styles.profileNickname}>{nickname}</Text>
              <Text style={styles.profileEmail}>{email}</Text>
            </View>
            <Text style={styles.chevron}>{">"}</Text>
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
            <UserRound size={22} color="#888" style={styles.itemIcon} />
            <Text style={styles.itemText}>アカウント情報</Text>
            <Text style={styles.chevron}>{">"}</Text>
          </View>
        </TouchableOpacity>

        {/* サポートグループ */}
        <Text style={styles.groupLabel}>サポート</Text>
        <TouchableOpacity
          style={styles.item}
          onPress={() => navigation.navigate("notice" as never)}
        >
          <View style={styles.itemRow}>
            <Bell size={22} color="#888" style={styles.itemIcon} />
            <Text style={styles.itemText}>お知らせ</Text>
            <Text style={styles.chevron}>{">"}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.item}
          onPress={() => navigation.navigate("help" as never)}
        >
          <View style={styles.itemRow}>
            <HelpCircle size={22} color="#888" style={styles.itemIcon} />
            <Text style={styles.itemText}>ヘルプセンター</Text>
            <Text style={styles.chevron}>{">"}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.item}
          onPress={() => navigation.navigate("terms" as never)}
        >
          <View style={styles.itemRow}>
            <FileText size={22} color="#888" style={styles.itemIcon} />
            <Text style={styles.itemText}>利用規約</Text>
            <Text style={styles.chevron}>{">"}</Text>
          </View>
        </TouchableOpacity>

        {/* ログアウトは一番下 */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            Alert.alert("ログアウト", "本当にログアウトしますか？", [
              { text: "キャンセル", style: "cancel" },
              {
                text: "ログアウト",
                style: "destructive",
                onPress: () => {
                  /* ログアウト処理 */
                },
              },
            ]);
          }}
        >
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
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingVertical: 0,
  },
  item: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  profileItem: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 28,
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
    marginRight: 20,
    justifyContent: "center",
    alignItems: "center",
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
    justifyContent: "space-between",
  },
  itemIcon: {
    marginRight: 12,
  },
  itemText: {
    fontSize: 16,
    color: "#222",
    textAlign: "left",
    flex: 1,
  },
  chevron: {
    fontSize: 18,
    color: "#bbb",
    marginLeft: 8,
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
    textAlign: "center",
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
  },
});
