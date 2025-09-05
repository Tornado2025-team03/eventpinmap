import React from "react";
import { View, Text, Button, Platform } from "react-native";
import MapView, {
  Marker,
  Region,
  PROVIDER_GOOGLE,
  LongPressEvent,
} from "react-native-maps";
// No in-map search; selection is via long-press only

type Props = {
  initialRegion?: Region;
  value?: { latitude: number; longitude: number } | null;
  onConfirm: (lat: number, lng: number) => void;
  onCancel?: () => void;
  height?: number;
};

export function MapPicker({
  initialRegion,
  value,
  onConfirm,
  onCancel,
  height = 260,
}: Props) {
  const [coord, setCoord] = React.useState(value ?? null);
  // in-map search removed; rely on long-press

  const onLongPress = (e: LongPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setCoord({ latitude, longitude });
  };

  const region = initialRegion ?? {
    latitude: value?.latitude ?? 35.681236, // 東京駅付近をデフォルト
    longitude: value?.longitude ?? 139.767125,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ marginBottom: 6 }}>地図を長押しで場所を選択</Text>
      <MapView
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        style={{ width: "100%", height }}
        initialRegion={region}
        onLongPress={onLongPress}
      >
        {coord && <Marker coordinate={coord} />}
      </MapView>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 8,
        }}
      >
        <Button title="キャンセル" onPress={onCancel} />
        <Button
          title="この場所にする"
          onPress={() => coord && onConfirm(coord.latitude, coord.longitude)}
          disabled={!coord}
        />
      </View>
    </View>
  );
}
