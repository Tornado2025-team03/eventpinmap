import { useNavigation } from "@react-navigation/native";
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
  { label: "ユーザー管理", screen: "userManagement" },
  { label: "お知らせ", screen: "notice" },
  { label: "利用規約", screen: "terms" },
  { label: "バージョン情報", screen: "version" },
  { label: "ログアウト", screen: "logout" },
];

export default function SettingsScreen() {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={{ height: 50 }} />
        {settingsItems.map((item, idx) => {
          if (item.label === "ログアウト") {
            return (
              <TouchableOpacity
                key={item.label}
                style={styles.item}
                onPress={() => {
                  Alert.alert("ログアウト", "本当にログアウトしますか？", [
                    { text: "キャンセル", style: "cancel" },
                    {
                      text: "ログアウトする",
                      style: "destructive",
                      onPress: () => {
                        /* ログアウト処理 */
                      },
                    },
                  ]);
                }}
              >
                <Text style={styles.logoutText}>{item.label}</Text>
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity
              key={item.label}
              style={styles.item}
              onPress={() => navigation.navigate(item.screen as never)}
            >
              <View style={styles.itemRow}>
                <Text style={styles.itemText}>{item.label}</Text>
                <Text style={styles.chevron}>{">"}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
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
    paddingVertical: 16,
  },
  item: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemText: {
    fontSize: 16,
    color: "#222",
  },
  chevron: {
    fontSize: 18,
    color: "#bbb",
    marginLeft: 8,
  },
  logoutText: {
    fontSize: 16,
    color: "#d32f2f",
    textAlign: "left",
  },
});
