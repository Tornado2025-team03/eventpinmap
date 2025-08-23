import { useNavigation } from "@react-navigation/native";
import React, { useLayoutEffect } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

const TERMS_TEXT = `第1条（目的）\n本サービスは...（ここに利用規約全文を記載）\n\n第2条（禁止事項）\n...`;
const PRIVACY_POLICY_URL = "https://example.com/privacy";

export default function TermsScreen() {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ headerBackTitle: "設定" });
  }, [navigation]);

  const handlePrivacyPress = () => {
    Linking.openURL(PRIVACY_POLICY_URL);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>利用規約</Text>
      <Text style={styles.termsText}>{TERMS_TEXT}</Text>

      <TouchableOpacity style={styles.privacyLink} onPress={handlePrivacyPress}>
        <Text style={styles.privacyText}>プライバシーポリシーはこちら</Text>
      </TouchableOpacity>
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
  termsText: {
    fontSize: 14,
    color: "#222",
    lineHeight: 22,
    marginBottom: 24,
  },
  privacyLink: {
    paddingVertical: 12,
  },
  privacyText: {
    color: "#1976d2",
    fontSize: 15,
    textDecorationLine: "underline",
  },
});
