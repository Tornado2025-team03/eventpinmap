import { useNavigation } from "@react-navigation/native";
import React, { useLayoutEffect } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

const APP_VERSION = "1.0.0";
const STORE_URL = "https://apps.apple.com/jp/app/id000000000"; // 仮URL
const LICENSE_URL = "https://example.com/licenses";

export default function VersionScreen() {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ headerBackTitle: "設定" });
  }, [navigation]);

  const handleStorePress = () => {
    Linking.openURL(STORE_URL);
  };
  const handleLicensePress = () => {
    Linking.openURL(LICENSE_URL);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>現在のバージョン</Text>
      <Text style={styles.versionText}>バージョン {APP_VERSION}</Text>

      <TouchableOpacity style={styles.updateButton} onPress={handleStorePress}>
        <Text style={styles.updateButtonText}>アップデートを確認</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.licenseLink} onPress={handleLicensePress}>
        <Text style={styles.licenseText}>ライセンス情報はこちら</Text>
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
  versionText: {
    fontSize: 16,
    color: "#222",
    marginBottom: 24,
  },
  updateButton: {
    backgroundColor: "#1976d2",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
  licenseLink: {
    paddingVertical: 12,
  },
  licenseText: {
    color: "#1976d2",
    fontSize: 15,
    textDecorationLine: "underline",
  },
});
