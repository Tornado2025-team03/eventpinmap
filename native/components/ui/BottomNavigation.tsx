import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Eye, Users2, ClipboardList, Settings } from "lucide-react-native";

export default function BottomNavigation({
  state,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  // タブ定義
  const tabs = [
    { key: "see", label: "見る", Icon: Eye },
    { key: "connect", label: "繋がる", Icon: Users2 },
    { key: "plan", label: "企画", Icon: null }, // 中央ボタン
    { key: "bookings", label: "予約一覧", Icon: ClipboardList },
    { key: "settings", label: "設定", Icon: Settings },
  ];

  const handleTabPress = (routeKey: string, index: number) => {
    const isFocused = state.index === index;
    const route = state.routes.find((r) => r.name === routeKey);
    if (!route) return;

    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* メインコンテナ */}
      <View style={styles.tabContainer}>
        {/* 左側のタブ（2つ） */}
        <View style={styles.sideContainer}>
          {tabs.slice(0, 2).map((tab, index) => {
            const isActive = state.index === index;
            const Icon = tab.Icon;

            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabButton}
                onPress={() => handleTabPress(tab.key, index)}
              >
                {Icon && (
                  <Icon
                    size={24}
                    color={isActive ? colors.active : colors.inactive}
                  />
                )}
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isActive ? colors.active : colors.inactive },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 中央の半円ボタン */}
        <View style={styles.centerContainer}>
          {/* 半円の背景 */}
          <View style={styles.semicircleBackground} />

          {/* 中央ボタン */}
          <TouchableOpacity
            style={styles.centerButton}
            onPress={() => handleTabPress("plan", 2)}
          >
            <Text style={styles.centerButtonText}>企画</Text>
          </TouchableOpacity>
        </View>

        {/* 右側のタブ（2つ） */}
        <View style={styles.sideContainer}>
          {tabs.slice(3, 5).map((tab, localIndex) => {
            const index = localIndex + 3;
            const isActive = state.index === index;
            const Icon = tab.Icon!;

            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabButton}
                onPress={() => handleTabPress(tab.key, index)}
              >
                <Icon
                  size={24}
                  color={isActive ? colors.active : colors.inactive}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isActive ? colors.active : colors.inactive },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const colors = {
  background: "#0E2B36",
  inactive: "#E7ECEF",
  active: "#FFC107",
  centerButton: "#FFC107",
  centerText: "#1B1B1B",
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },

  tabContainer: {
    height: 70,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    position: "relative",
  },

  // 左右のタブコンテナ
  sideContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    paddingBottom: 8,
  },

  // 通常のタブボタン
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },

  // 中央コンテナ
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 80,
    height: 70,
    position: "relative",
  },

  // 円の背景
  semicircleBackground: {
    position: "absolute",
    top: -30,
    width: 90,
    height: 90,
    backgroundColor: colors.background,
    borderRadius: 40,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // 中央ボタン
  centerButton: {
    position: "absolute",
    top: -25,
    width: 90,
    height: 90,
    backgroundColor: colors.centerButton,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },

  centerButtonText: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.centerText,
    textAlign: "center",
  },
});
