import React from "react";
import * as Lucide from "lucide-react-native";

type Props = {
  name: string;
  size?: number;
  color?: string;
};

export function LucideIcon({ name, size = 24, color = "#222" }: Props) {
  const Cmp = (Lucide as any)[name] as React.ComponentType<any> | undefined;
  if (!Cmp) {
    // Graceful fallback when icon name is unknown
    const Fallback = (Lucide as any).Calendar as React.ComponentType<any>;
    return <Fallback size={size} color={color} />;
  }
  return <Cmp size={size} color={color} />;
}
