import React from "react";
import { Text, StyleSheet } from "react-native";

type Props = { children: React.ReactNode };

export function SectionLabel({ children }: Props) {
  return <Text style={styles.groupLabel}>{children}</Text>;
}

const styles = StyleSheet.create({
  groupLabel: {
    fontSize: 13,
    color: "#888",
    backgroundColor: "#f5f5f5",
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
});

export default SectionLabel;
