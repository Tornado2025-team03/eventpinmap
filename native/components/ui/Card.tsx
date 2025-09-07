import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";

type Props = {
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
};

export function Card({ style, children }: Props) {
  return <View style={[styles.card, style as any]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#eee",
  },
});

export default Card;
