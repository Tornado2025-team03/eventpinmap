import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";

type ButtonProps = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
};

export function PrimaryButton({
  title,
  onPress,
  disabled,
  style,
}: ButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        styles.primary,
        disabled && styles.disabled,
        style as any,
      ]}
    >
      <Text style={styles.primaryText}>{title}</Text>
    </TouchableOpacity>
  );
}

export function OutlineButton({
  title,
  onPress,
  disabled,
  style,
}: ButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        styles.outline,
        disabled && styles.disabledOutline,
        style as any,
      ]}
    >
      <Text style={styles.outlineText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: "#2196F3",
  },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  outline: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  outlineText: {
    color: "#2196F3",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabled: {
    backgroundColor: "#9ecbf3",
  },
  disabledOutline: {
    borderColor: "#9ecbf3",
  },
});

export default PrimaryButton;
