import React, { useEffect, useRef, useState } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";

export default function App() {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [myCoord, setMyCoord] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      // 1) 権限リクエスト
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("位置情報の許可が必要です");
        return;
      }

      // 2) 現在地取得（高精度は端末負荷↑。必要に応じて accuracy を下げてね）
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = pos.coords;
      setMyCoord({ latitude, longitude });

      // 3) 地図の初期リージョン決定（ズーム量はお好みで）
      const nextRegion: Region = {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(nextRegion);

      // 4) アニメーションで移動（任意）
      mapRef.current?.animateToRegion(nextRegion, 600);
    })();
  }, []);

  if (!region) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={region}
        showsUserLocation // 青い現在地ドット
        showsMyLocationButton // Androidで現在地ボタン
        onRegionChangeComplete={(r) => setRegion(r)}
      >
        {myCoord && (
          <Marker
            coordinate={myCoord}
            title="現在地"
            description={`${myCoord.latitude.toFixed(5)}, ${myCoord.longitude.toFixed(5)}`}
          />
        )}
      </MapView>
    </View>
  );
}
