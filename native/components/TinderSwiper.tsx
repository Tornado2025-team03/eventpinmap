// components/TinderSwiper.tsx
import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const SWIPE_THRESHOLD = width * 0.25;

export type CardData = {
  id: number;
  what: string;
  formattedWhen: string;
  where: string;
  title: string;
  suggestedTitle: string;
  tags?: string[];
  capacity?: number;
  fee?: string;
  items?: string;
  rule?: "open" | "approval";
};

export function TinderSwiper({
  cards,
  renderCard,
  onSwipedLeft,
  onSwipedRight,
  onSwipedAll,
}: {
  cards: CardData[];
  renderCard: (c: CardData) => React.ReactNode;
  onSwipedLeft?: (i: number) => void;
  onSwipedRight?: (i: number) => void;
  onSwipedAll?: () => void;
}) {
  const [index, setIndex] = React.useState(0);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const rot = useSharedValue(0);

  const reset = () => {
    tx.value = 0;
    ty.value = 0;
    rot.value = 0;
  };

  const next = (dir: "left" | "right") => {
    const i = index;
    if (dir === "left") onSwipedLeft?.(i);
    else onSwipedRight?.(i);

    const ni = i + 1;
    if (ni >= cards.length) {
      onSwipedAll?.();
      reset();
      setIndex(0);
    } else {
      reset();
      setIndex(ni);
    }
  };

  const pan = Gesture.Pan()
    .onChange((e) => {
      tx.value += e.changeX;
      ty.value += e.changeY;
      rot.value = (tx.value / width) * 12;
    })
    .onEnd(() => {
      const x = tx.value;
      if (x > SWIPE_THRESHOLD) {
        tx.value = withTiming(width, { duration: 200 }, () =>
          runOnJS(next)("right"),
        );
      } else if (x < -SWIPE_THRESHOLD) {
        tx.value = withTiming(-width, { duration: 200 }, () =>
          runOnJS(next)("left"),
        );
      } else {
        reset();
      }
    });

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${rot.value}deg` },
    ],
  }));

  if (index >= cards.length) return <View />;

  const top = cards[index];
  const nextCard = cards[index + 1];

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      {nextCard && (
        <View style={[styles.card, { top: 12, transform: [{ scale: 0.96 }] }]}>
          {renderCard(nextCard)}
        </View>
      )}
      <GestureDetector key={top.id} gesture={pan}>
        <Animated.View key={`top-${top.id}`} style={[styles.card, style]}>
          {renderCard(top)}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    width: width * 0.9,
    height: width * 1.1,
    borderRadius: 12,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
});
