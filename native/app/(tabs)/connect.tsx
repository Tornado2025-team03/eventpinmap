import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { TinderSwiper, CardData } from "../../components/TinderSwiper";

export default function Connect() {
  const DATA: CardData[] = [
    {
      id: 1,
      what: "アニメ鑑賞会",
      formattedWhen: "2025/09/01 19:00",
      where: "渋谷駅近くのカフェ",
      title: "みんなで鬼滅を見る会",
      suggestedTitle: "アニメ鑑賞イベント",
      tags: ["アニメ", "カフェ", "交流"],
      capacity: 5,
      fee: "1000円",
      items: "飲み物",
    },
    {
      id: 2,
      what: "ボードゲーム会",
      formattedWhen: "2025/09/02 13:00",
      where: "秋葉原レンタルスペース",
      title: "",
      suggestedTitle: "カタン＆人狼で遊ぶ会",
      tags: ["ボドゲ", "初対面歓迎"],
      capacity: 8,
      fee: "2000円",
      items: "",
    },
  ];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.wrapper}>
        {/* 上部タイトル */}
        <Text style={styles.header}>興味あるイベントを見つけよう！</Text>

        {/* スワイパー領域（中央） */}
        <View style={styles.swiperArea}>
          <TinderSwiper
            cards={DATA}
            renderCard={(card) => (
              <View style={styles.card}>
                <Text>・何を：{card.what}</Text>
                <Text>・いつ：{card.formattedWhen || "未設定"}</Text>
                <Text>・どこ：{card.where}</Text>
                <Text>・タイトル：{card.title || card.suggestedTitle}</Text>
                {card.tags && card.tags.length > 0 && (
                  <Text>・タグ：{card.tags.join(", ")}</Text>
                )}
                {card.capacity && <Text>・募集人数：{card.capacity}人</Text>}
                {card.fee && <Text>・参加費：{card.fee}</Text>}
                {card.items && <Text>・持ち物：{card.items}</Text>}
                <Text>
                  ・参加方法：{card.rule === "open" ? "誰でも参加OK" : "承認制"}
                </Text>
              </View>
            )}
            onSwipedLeft={(i) => console.log("left:", DATA[i]?.title)}
            onSwipedRight={(i) => console.log("right:", DATA[i]?.title)}
            onSwipedAll={() => console.log("all swiped")}
          />
        </View>

        {/* 下部：スワイプルール表示 */}
        <View style={styles.footer} pointerEvents="none">
          <View style={[styles.badge, styles.badgeLeft]}>
            <Text style={styles.badgeText}>← 興味ない</Text>
          </View>
          <View style={[styles.badge, styles.badgeRight]}>
            <Text style={styles.badgeText}>気になる →</Text>
          </View>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    paddingTop: 40, // 上余白
    paddingBottom: 12, // 下余白（フッター分のマージン）
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
    marginTop: 12,
    color: "#333",
  },
  swiperArea: {
    flex: 1, // 余白はすべてスワイパーに
    justifyContent: "center",
  },
  card: {
    gap: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    backgroundColor: "white",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingTop: 8,
  },
  badge: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  badgeLeft: {
    backgroundColor: "#e8e8e8", // グレー系（No側）
  },
  badgeRight: {
    backgroundColor: "#4CAF50", // グリーン系（Yes側）
  },
  badgeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
