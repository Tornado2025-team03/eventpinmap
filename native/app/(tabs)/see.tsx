// App.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  Linking,
  TouchableWithoutFeedback,
} from "react-native";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  Region,
  MapType,
} from "react-native-maps";
import * as Location from "expo-location";
import { supabase } from "../../lib/supabase";

type LatLng = { latitude: number; longitude: number };
type EventRow = {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  latitude: number | null;
  longitude: number | null;
  start_at?: string | null;
  end_at?: string | null;
  updated_at?: string | null;
};
type Pin = LatLng & {
  id: string;
  title?: string;
  description?: string;
  location?: string;
  start_at?: string | null;
  end_at?: string | null;
};

export default function App() {
  const mapRef = useRef<MapView>(null);

  // 現在地・リージョン
  const [region, setRegion] = useState<Region | null>(null);
  const [myCoord, setMyCoord] = useState<LatLng | null>(null);
  const [watching, setWatching] = useState(false);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  // マップ表示用
  const [mapType, setMapType] = useState<MapType>("standard");

  // イベント（ピン）
  const [pins, setPins] = useState<Pin[]>([]);
  const [loadingPins, setLoadingPins] = useState(true);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  // モーダルの対象
  const [selectedEvent, setSelectedEvent] = useState<Pin | null>(null);

  // Row → Pin 変換
  const rowToPin = useCallback((r: EventRow): Pin | null => {
    const lat = r.latitude != null ? Number(r.latitude) : NaN;
    const lng = r.longitude != null ? Number(r.longitude) : NaN;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return {
      id: String(r.id),
      title: r.name ?? undefined,
      description: r.description ?? undefined,
      location: r.location ?? undefined,
      start_at: r.start_at ?? null,
      end_at: r.end_at ?? null,
      latitude: lat,
      longitude: lng,
    };
  }, []);

  // 起動時：権限→現在地→初期リージョン
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location permission needed", "Enable it in Settings.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;
      const reg: Region = {
        latitude,
        longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
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

  // 初回フェッチ
  const loadEvents = useCallback(async () => {
    setLoadingPins(true);
    const { data, error } = await supabase
      .from("events")
      .select(
        "id, name, description, location, latitude, longitude, start_at, end_at, updated_at",
      )
      .order("start_at", { ascending: true });

    if (error) {
      Alert.alert("データ取得エラー", error.message);
      setLoadingPins(false);
      return;
    }

    const now = new Date();
    const clean: Pin[] = (data ?? []).map(rowToPin).filter((p): p is Pin => {
      if (!p) return false;
      const isFuture = !p.end_at || new Date(p.end_at) > now;
      return isFuture;
    });
    setPins(clean);
    setLoadingPins(false);
    setLastSyncAt(new Date());
  }, [rowToPin]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Realtime購読（INSERT/UPDATE/DELETE）
  useEffect(() => {
    const channel = supabase
      .channel("events-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        (payload) => {
          const row = (payload.new ?? payload.old) as EventRow | null;
          if (!row) return;
          const pin = rowToPin(row);

          // ...inside the postgres_changes handler...
          setPins((prev) => {
            const now = new Date();
            let next: Pin[];
            const idx = prev.findIndex((p) => p.id === String(row.id));

            if (payload.eventType === "DELETE") {
              if (idx === -1) return prev;
              next = prev.slice();
              next.splice(idx, 1);
            } else {
              // INSERT/UPDATE
              if (!pin) {
                if (idx === -1) return prev;
                next = prev.slice();
                next.splice(idx, 1);
              } else if (idx === -1) {
                next = [...prev, pin];
              } else {
                next = prev.slice();
                next[idx] = { ...next[idx], ...pin };
              }
            }
            // ★ ここで未来のイベントだけに絞る
            return next.filter((p) => !p.end_at || new Date(p.end_at) > now);
          });

          // モーダル表示中なら内容も同期
          setSelectedEvent((prev) =>
            prev && prev.id === String(row.id) && pin
              ? { ...prev, ...pin }
              : prev,
          );

          setLastSyncAt(new Date());
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rowToPin]);

  // すべて表示にフィット
  useEffect(() => {
    if (!region) return;
    const coords = [
      ...pins.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
      ...(myCoord ? [myCoord] : []),
    ];
    if (!coords.length) return;
    mapRef.current?.fitToCoordinates(coords, {
      edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
      animated: true,
    });
  }, [pins, myCoord]);

  // ピン押下 → すぐモーダル
  const handleMarkerPress = useCallback((pin: Pin) => {
    setSelectedEvent(pin);
  }, []);

  // 追従ON/OFF
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
            latitudeDelta: region?.latitudeDelta ?? 0.02,
            longitudeDelta: region?.longitudeDelta ?? 0.02,
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
      { ...myCoord, latitudeDelta: 0.02, longitudeDelta: 0.02 },
      500,
    );
  }, [myCoord]);

  const openDirections = useCallback((pin: Pin) => {
    const lat = pin.latitude;
    const lng = pin.longitude;
    const label = encodeURIComponent(pin.title ?? "Event");
    const url = Platform.select({
      ios: `http://maps.apple.com/?ll=${lat},${lng}&q=${label}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    })!;
    Linking.openURL(url).catch(() => {});
  }, []);

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
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={Platform.OS === "android"}
        showsCompass
        showsScale={Platform.OS === "ios"}
        onRegionChangeComplete={(r) => setRegion(r)}
        mapType={mapType}
      >
        {/* バブルを出さないため、title/descriptionは渡さない */}
        {!loadingPins &&
          pins.map((pin) => (
            <Marker
              key={pin.id}
              coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
              pinColor="tomato"
              onPress={() => handleMarkerPress(pin)}
            />
          ))}
      </MapView>

      {/* 右上のツール群 */}
      <View style={{ position: "absolute", top: 16, right: 16, gap: 8 }}>
        <RoundBtn label="Refresh" onPress={() => void loadEvents()} />
        <RoundBtn
          label={watching ? "追従ON" : "追従OFF"}
          onPress={toggleWatch}
        />
        <RoundBtn label="中心へ" onPress={recenter} />
        <RoundBtn
          label={mapTypeLabel(mapType)}
          onPress={() => setMapType(nextMapType(mapType))}
        />
      </View>

      {/* 左下：同期時刻 */}
      <View
        style={{
          position: "absolute",
          left: 12,
          bottom: 12,
          backgroundColor: "rgba(255,255,255,0.9)",
          borderRadius: 8,
          paddingHorizontal: 8,
          paddingVertical: 4,
        }}
      >
        <Text style={{ fontSize: 12, color: "#333" }}>
          {lastSyncAt
            ? `Synced: ${lastSyncAt.toLocaleTimeString()}`
            : "Syncing…"}
        </Text>
      </View>

      {/* 詳細モーダル（ピン押下で即表示） */}
      <Modal
        visible={!!selectedEvent}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedEvent(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSelectedEvent(null)}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.35)",
              justifyContent: "flex-end",
            }}
          >
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: "white",
                  padding: 16,
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                }}
              >
                <View style={{ alignItems: "center", marginBottom: 8 }}>
                  <View
                    style={{
                      width: 40,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: "#ddd",
                    }}
                  />
                </View>

                <Text style={{ fontSize: 18, fontWeight: "700" }}>
                  {selectedEvent?.title ?? "Event"}
                </Text>

                {selectedEvent?.location ? (
                  <Text style={{ color: "#666", marginTop: 4 }}>
                    📍 {selectedEvent.location}
                  </Text>
                ) : null}

                {selectedEvent?.start_at ? (
                  <Text style={{ color: "#666", marginTop: 4 }}>
                    🕒{" "}
                    {formatRange(selectedEvent.start_at, selectedEvent.end_at)}
                  </Text>
                ) : null}

                {selectedEvent?.description ? (
                  <Text style={{ marginTop: 10, lineHeight: 20 }}>
                    {selectedEvent.description}
                  </Text>
                ) : null}

                <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                  {selectedEvent ? (
                    <ActionBtn
                      label="Directions"
                      onPress={() => openDirections(selectedEvent)}
                    />
                  ) : null}
                  <ActionBtn
                    label="Close"
                    onPress={() => setSelectedEvent(null)}
                  />
                </View>

                <View style={{ height: 12 }} />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

/* ---------- small UI helpers ---------- */
function ActionBtn({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void | Promise<void>;
}) {
  return (
    <TouchableOpacity
      onPress={() => {
        void onPress();
      }}
      style={{
        backgroundColor: "#0A84FF",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
      }}
    >
      <Text style={{ color: "white", fontWeight: "700" }}>{label}</Text>
    </TouchableOpacity>
  );
}

function RoundBtn({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void | Promise<void>;
}) {
  return (
    <TouchableOpacity
      onPress={() => {
        void onPress();
      }}
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

// ISO → 表示用
function formatRange(start?: string | null, end?: string | null) {
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;
  if (!s && !e) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const ss = s
    ? `${s.getFullYear()}-${pad(s.getMonth() + 1)}-${pad(s.getDate())} ${pad(
        s.getHours(),
      )}:${pad(s.getMinutes())}`
    : "";
  const ee = e ? `${pad(e.getHours())}:${pad(e.getMinutes())}` : "";
  return e ? `${ss} - ${ee}` : ss;
}
