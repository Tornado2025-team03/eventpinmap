import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import MapView, {
  Marker,
  Callout,
  Polyline,
  PROVIDER_GOOGLE,
  Region,
  MapType,
} from "react-native-maps";
import * as Location from "expo-location";

type LatLng = { latitude: number; longitude: number };
type Pin = LatLng & { id: string; title?: string; description?: string };

export default function App() {
  const mapRef = useRef<MapView>(null);

  // 現在地・リージョン
  const [region, setRegion] = useState<Region | null>(null);
  const [myCoord, setMyCoord] = useState<LatLng | null>(null);
  const [watching, setWatching] = useState(false);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  // マップ表示用
  const [mapType, setMapType] = useState<MapType>("standard");
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);

  // サンプルの既存ピン（渋谷・新宿・上野）
  const [pins, setPins] = useState<Pin[]>([
    {
      id: "shibuya",
      latitude: 35.6595,
      longitude: 139.7005,
      title: "渋谷",
      description: "Shibuya",
    },
    {
      id: "shinjuku",
      latitude: 35.6896,
      longitude: 139.7006,
      title: "新宿",
      description: "Shinjuku",
    },
    {
      id: "ueno",
      latitude: 35.7138,
      longitude: 139.7765,
      title: "上野",
      description: "Ueno",
    },
  ]);

  // Haversine距離（m）
  const distanceMeters = useCallback((a: LatLng, b: LatLng) => {
    const R = 6371000;
    const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
    const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
    const lat1 = (a.latitude * Math.PI) / 180;
    const lat2 = (b.latitude * Math.PI) / 180;
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }, []);

  // 起動時：権限→現在地→初期リージョン
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("位置情報の許可が必要です", "設定から有効にしてください。");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;
      const reg: Region = {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setMyCoord({ latitude, longitude });
      setRegion(reg);
      mapRef.current?.animateToRegion(reg, 600);
    })();
    return () => {
      watchRef.current?.remove();
      watchRef.current = null;
    };
  }, []);

  // 追従のON/OFF
  const toggleWatch = useCallback(async () => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
      setWatching(false);
      return;
    }
    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 2000,
        distanceInterval: 5,
      },
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const next = { latitude, longitude };
        setMyCoord(next);
        mapRef.current?.animateToRegion(
          {
            ...next,
            latitudeDelta: region?.latitudeDelta ?? 0.01,
            longitudeDelta: region?.longitudeDelta ?? 0.01,
          },
          400,
        );
      },
    );
    watchRef.current = sub;
    setWatching(true);
  }, [region]);

  // 現在地へリセンタ
  const recenter = useCallback(() => {
    if (!myCoord) return;
    mapRef.current?.animateToRegion(
      { ...myCoord, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      500,
    );
  }, [myCoord]);

  // ロングタップでピン追加
  const onLongPress = useCallback((e: any) => {
    const c = e.nativeEvent.coordinate as LatLng;
    const id = `pin_${Date.now()}`;
    setPins((prev) => [
      ...prev,
      { id, ...c, title: "追加ピン", description: "Long Press で追加" },
    ]);
  }, []);

  // 主要ピン + 現在地でフィット
  const fitAll = useCallback(() => {
    const coords: LatLng[] = [
      ...pins.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
      ...(myCoord ? [myCoord] : []),
    ];
    if (coords.length === 0) return;
    mapRef.current?.fitToCoordinates(coords, {
      animated: true,
      edgePadding: { top: 80, bottom: 80, left: 80, right: 80 },
    });
  }, [pins, myCoord]);

  // 選択ピンへ簡易「ルート線」（Directions APIなしで直線）
  const routeLine = useMemo(() => {
    if (!myCoord || !selectedPin) return [];
    return [myCoord, selectedPin];
  }, [myCoord, selectedPin]);

  if (!region) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 12 }}>現在地を取得中…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE} // Expo GoでもOK（iOSはApple MapのUIっぽい時もあり）
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={Platform.OS === "android"} // Androidの標準現在地ボタン
        showsCompass
        showsScale={Platform.OS === "ios"}
        onRegionChangeComplete={(r) => setRegion(r)}
        onLongPress={onLongPress}
        mapType={mapType}
      >
        {/* 既存ピン */}
        {pins.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
            onPress={() => setSelectedPin(p)}
          >
            <Callout onPress={() => setSelectedPin(p)}>
              <View style={{ maxWidth: 220 }}>
                <Text style={{ fontWeight: "600" }}>{p.title ?? "地点"}</Text>
                <Text>{p.description ?? ""}</Text>
                {myCoord && (
                  <Text style={{ marginTop: 4, opacity: 0.8 }}>
                    現在地から約 {Math.round(distanceMeters(myCoord, p))} m
                  </Text>
                )}
                <Text style={{ marginTop: 4, color: "#007aff" }}>
                  ここまでの簡易ルート線を表示（直線）
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}

        {/* 直線Polyline（現在地→選択ピン） */}
        {routeLine.length === 2 && (
          <Polyline coordinates={routeLine} geodesic strokeWidth={4} />
        )}
      </MapView>

      {/* 右上のツール群 */}
      <View style={{ position: "absolute", top: 16, right: 16, gap: 8 }}>
        <RoundBtn
          label={watching ? "追従ON" : "追従OFF"}
          onPress={toggleWatch}
        />
        <RoundBtn label="中心へ" onPress={recenter} />
        <RoundBtn label="全体表示" onPress={fitAll} />
        <RoundBtn
          label={mapTypeLabel(mapType)}
          onPress={() => setMapType(nextMapType(mapType))}
        />
      </View>

      {/* 下部のヒント */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 16,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            backgroundColor: "rgba(0,0,0,0.6)",
            color: "white",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
          }}
        >
          地図を長押しでピン追加・タップで距離と直線ルート表示
        </Text>
      </View>
    </View>
  );
}

function RoundBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: "white",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
        alignItems: "center",
      }}
    >
      <Text style={{ fontWeight: "600" }}>{label}</Text>
    </TouchableOpacity>
  );
}

// マップタイプ切替（Expo Goで動く範囲）
function nextMapType(t: MapType): MapType {
  const order: MapType[] = Platform.select({
    ios: ["standard", "satellite", "hybrid", "mutedStandard"] as MapType[],
    android: ["standard", "satellite", "terrain", "hybrid"] as MapType[],
    default: ["standard", "satellite", "hybrid"] as MapType[],
  })!;
  const i = order.indexOf(t);
  return order[(i + 1) % order.length];
}
function mapTypeLabel(t: MapType) {
  switch (t) {
    case "standard":
      return "標準";
    case "satellite":
      return "航空写真";
    case "hybrid":
      return "ハイブリッド";
    case "terrain":
      return "地形";
    case "mutedStandard":
      return "淡色";
    default:
      return String(t);
  }
}
