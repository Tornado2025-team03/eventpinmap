import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
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
  Image,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as Location from "expo-location";
import { supabase } from "../../lib/supabase";
import { useLocalSearchParams } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as LucideIcons from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type LatLng = { latitude: number; longitude: number };
type Tag = { id: string; name: string };
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
  event_tags?: { tag?: Tag }[];
};
type Pin = LatLng & {
  id: string;
  title?: string;
  description?: string;
  location?: string;
  start_at?: string | null;
  end_at?: string | null;
  tags?: Tag[];
  icon?: string;
};

function normalizeIconName(name?: string) {
  if (!name) return undefined;
  // Remove spaces/underscores and convert to PascalCase
  return name
    .trim()
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

export default function App() {
  const mapRef = useRef<MapView>(null);
  const { lat: latParam, lng: lngParam } = useLocalSearchParams<{
    lat?: string;
    lng?: string;
  }>();

  const targetCoord = useMemo(() => {
    const la = latParam ? parseFloat(String(latParam)) : NaN;
    const lo = lngParam ? parseFloat(String(lngParam)) : NaN;
    if (!Number.isFinite(la) || !Number.isFinite(lo)) return null;
    return { latitude: la, longitude: lo } as LatLng;
  }, [latParam, lngParam]);

  // 現在地・リージョン
  const [region, setRegion] = useState<Region | null>(null);
  const [myCoord, setMyCoord] = useState<LatLng | null>(null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  // イベント（ピン）
  const [pins, setPins] = useState<Pin[]>([]);
  const [loadingPins, setLoadingPins] = useState(true);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  const [searchStart, setSearchStart] = useState<Date | null>(null);
  const [searchEnd, setSearchEnd] = useState<Date | null>(null);

  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [viewChanges, setViewChanges] = useState(true);

  const allTags = useMemo(
    () =>
      Array.from(
        new Map(
          pins.flatMap((p) => p.tags ?? []).map((tag) => [tag.id, tag]),
        ).values(),
      ),
    [pins],
  );

  const filteredPins = useMemo(() => {
    let result = pins;
    // Remove tag filtering here!
    if (searchStart || searchEnd) {
      result = result.filter((p) => {
        const start = p.start_at ? new Date(p.start_at) : null;
        const end = p.end_at ? new Date(p.end_at) : null;
        if (searchStart && start && start < searchStart) return false;
        if (searchEnd && end && end > searchEnd) return false;
        return true;
      });
    }
    return result;
  }, [pins, searchStart, searchEnd, selectedTags]);
  useEffect(() => {
    setViewChanges(true);
    const timer = setTimeout(() => setViewChanges(false), 500);
    return () => clearTimeout(timer);
  }, [filteredPins, selectedTags]);
  // モーダルの対象
  const [selectedEvent, setSelectedEvent] = useState<Pin | null>(null);
  const [dropPinModal, setDropPinModal] = useState<{
    visible: boolean;
    coord: LatLng | null;
  }>(() => ({ visible: false, coord: null }));

  const [pinStartAt, setPinStartAt] = useState<Date | null>(null);
  const [pinEndAt, setPinEndAt] = useState<Date | null>(null);

  const [androidPicker, setAndroidPicker] = useState<{
    type: "start" | "end";
    mode: "date" | "time";
    show: boolean;
    tempDate: Date | null;
    target: "search" | "status";
  } | null>(null);

  const [myAvailablePin, setMyAvailablePin] = useState<{
    coord: LatLng;
    startAt: Date;
    endAt: Date;
  } | null>(null);

  async function setUserStatusAvailable(
    coord: { latitude: number; longitude: number },
    startAt: Date,
    endAt: Date | null,
  ) {
    const user = supabase.auth.getUser ? await supabase.auth.getUser() : null;
    const userId = user?.data?.user?.id;
    if (!userId) {
      Alert.alert("ログインしてください");
      return;
    }
    const { error } = await supabase.from("user_statuses").upsert(
      {
        user_id: userId,
        status: "available",
        latitude: coord.latitude,
        longitude: coord.longitude,
        start_at: startAt.toISOString(),
        end_at: endAt ? endAt.toISOString() : null,
      },
      { onConflict: "user_id" },
    );

    if (error) {
      Alert.alert("ステータス更新エラー", error.message);
      return;
    }
    setMyAvailablePin(endAt ? { coord, startAt, endAt } : null);
    Alert.alert("ステータスをオンラインにしました！");
  }

  async function setUserStatusHidden() {
    const user = supabase.auth.getUser ? await supabase.auth.getUser() : null;
    const userId = user?.data?.user?.id;
    if (!userId) {
      Alert.alert("ログインしてください");
      return;
    }
    const { error } = await supabase.from("user_statuses").upsert(
      {
        user_id: userId,
        status: "hidden",
        latitude: null,
        longitude: null,
        start_at: new Date().toISOString(),
        end_at: null,
      },
      { onConflict: "user_id" },
    );
    if (error) {
      Alert.alert("ステータス更新エラー", error.message);
      return;
    }
    setMyAvailablePin(null);
    Alert.alert("ステータスをオフラインにしました");
  }
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
      tags: (r.event_tags?.map((et) => et.tag).filter(Boolean) as Tag[]) ?? [],
      icon: r.icon ?? undefined,
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
  }, [targetCoord]);

  // 初回フェッチ
  const loadEvents = useCallback(async () => {
    setLoadingPins(true);
    const { data, error } = await supabase
      .from("events")
      .select(
        `
        id, name, description, location, latitude, longitude, start_at, end_at, updated_at, icon,
        event_tags (
          tag:tags (
            id, name
          )
        )
      `,
      )
      .order("start_at", { ascending: true });

    if (error) {
      Alert.alert("データ取得エラー", error.message);
      setLoadingPins(false);
      return;
    }

    const now = new Date();
    // Fix event_tags structure to match EventRow type
    const normalizedData = (data ?? []).map((row: any) => {
      // event_tags may be [{ tag: [{ id, name }, ...] }] instead of [{ tag: { id, name } }]
      if (Array.isArray(row.event_tags)) {
        row.event_tags = row.event_tags.flatMap((et: any) =>
          Array.isArray(et.tag) ? et.tag.map((tag: any) => ({ tag })) : [et],
        );
      }
      return row;
    });
    const clean: Pin[] = normalizedData.map(rowToPin).filter((p): p is Pin => {
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
    mapRef.current?.animateToRegion(
      {
        latitude: pin.latitude,
        longitude: pin.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      },
      500,
    );
  }, []);

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

  const handleMapLongPress = useCallback(
    (e: { nativeEvent: { coordinate: LatLng } }) => {
      setDropPinModal({ visible: true, coord: e.nativeEvent.coordinate });
      const now = new Date();
      setPinStartAt(now);
      setPinEndAt(new Date(now.getTime() + 60 * 60 * 1000)); // 1 hour later
    },
    [],
  );

  if (!region) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 12 }}>現在地を取得中…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          // paddingTop: 35,
          padding: 8,
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderColor: "#eee",
        }}
      >
        <DateTimeInput
          value={searchStart}
          onChange={setSearchStart}
          onAndroidPress={() => {
            setAndroidPicker({
              type: "start",
              mode: "date",
              show: true,
              tempDate: null,
              target: "search",
            });
          }}
          type="start"
        />
        <Text style={{ marginHorizontal: 10 }}>〜</Text>
        <DateTimeInput
          value={searchEnd}
          onChange={setSearchEnd}
          onAndroidPress={() => {
            setAndroidPicker({
              type: "end",
              mode: "date",
              show: true,
              tempDate: null,
              target: "search",
            });
          }}
          type="end"
        />
        <TouchableOpacity
          onPress={() => {
            setSearchStart(null);
            setSearchEnd(null);
          }}
          style={{
            marginLeft: 8,
            backgroundColor: "#eee",
            borderRadius: 8,
            padding: 8,
          }}
        >
          <Text>クリア</Text>
        </TouchableOpacity>
      </View>
      {/* Map */}
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
        onLongPress={handleMapLongPress}
      >
        {/* Existing pins */}
        {!loadingPins &&
          filteredPins.map((pin) => {
            const iconName = normalizeIconName(pin.icon);
            const IconComponent =
              iconName &&
              (LucideIcons as any)[iconName] &&
              (LucideIcons as any)[iconName].$$typeof
                ? (LucideIcons as any)[iconName]
                : LucideIcons.MapPin;
            const isHighlighted =
              selectedTags.length > 0 &&
              pin.tags?.some((t) =>
                selectedTags.some((sel) => sel.id === t.id),
              );
            // Log every time pins are rendered (including after refresh)
            //console.log("Pin:", pin.title, "isHighlighted:", isHighlighted, "tags:", pin.tags, "selectedTags:", selectedTags);
            // console.log("isHighlighted:", isHighlighted, "color:", isHighlighted ? "red" : "#ffa200ff");
            return (
              <Marker
                key={pin.id}
                coordinate={{
                  latitude: pin.latitude,
                  longitude: pin.longitude,
                }}
                onPress={() => handleMarkerPress(pin)}
                tracksViewChanges={viewChanges}
              >
                <View
                  style={{
                    backgroundColor: "white",
                    borderRadius: 16, // half of width/height for circle
                    width: 32,
                    height: 32,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#000",
                    shadowOpacity: 0.15,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <IconComponent
                    size={32}
                    color={isHighlighted ? "red" : "#f6c604ff"}
                    strokeWidth={2}
                  />
                </View>
              </Marker>
            );
          })}

        {/* Blue pin for user's available status */}
        {myAvailablePin &&
          (() => {
            const now = new Date();
            if (now >= myAvailablePin.startAt && now <= myAvailablePin.endAt) {
              return (
                <Marker
                  coordinate={myAvailablePin.coord}
                  pinColor="blue"
                  title="あなたの利用可能ピン"
                  onPress={() => {
                    Alert.alert(
                      "ステータス変更",
                      "ステータスをオフラインにしますか？",
                      [
                        { text: "キャンセル", style: "cancel" },
                        {
                          text: "OK",
                          onPress: async () => {
                            await setUserStatusHidden();
                          },
                        },
                      ],
                    );
                  }}
                />
              );
            }
            return null;
          })()}
      </MapView>

      {/* 右上のツール群 */}
      <View
        style={{
          position: "absolute",
          right: 5,
          bottom: 5,
          zIndex: 20,
        }}
      >
        <RoundBtn label="更新" onPress={() => void loadEvents()} />
      </View>
      <View
        style={{
          position: "absolute",
          top: 100,
          right: 16,
          gap: 8,
          alignItems: "center",
        }}
      >
        {/* <RoundBtn label="中心へ" onPress={recenter} /> */}
        <TouchableOpacity
          onPress={() => setTagModalVisible(true)}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            width: 48,
            height: 48,
            padding: 16,
            marginTop: 2,
            elevation: 4,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            source={require("../../assets/images/search.png")} // Update path as needed
            style={{ width: 24, height: 24 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setHelpModalVisible(true)}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            width: 48,
            height: 48,
            marginTop: 2,
            elevation: 4,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "bold", color: "#0A84FF" }}>
            ?
          </Text>
        </TouchableOpacity>
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
                {selectedEvent?.tags && selectedEvent.tags.length > 0 ? (
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      marginTop: 8,
                    }}
                  >
                    {selectedEvent.tags.map((tag) => (
                      <View
                        key={tag.id}
                        style={{
                          backgroundColor: "#eee",
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          marginRight: 6,
                          marginBottom: 4,
                        }}
                      >
                        <Text style={{ fontSize: 12, color: "#555" }}>
                          #{tag.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}

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

                <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
                  <ActionBtn
                    label="Directions"
                    onPress={() => {
                      if (selectedEvent) {
                        openDirections(selectedEvent);
                      }
                      return;
                    }}
                  />
                  <ActionBtn
                    label="participate"
                    onPress={async () => {
                      Alert.alert(
                        "参加確認",
                        "本当にこのイベントに参加しますか？",
                        [
                          { text: "キャンセル", style: "cancel" },
                          {
                            text: "参加する",
                            onPress: async () => {
                              await handleParticipate(selectedEvent);
                            },
                          },
                        ],
                      );
                    }}
                  />
                </View>

                <View style={{ height: 12 }} />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Tag Selection Modal */}
      <Modal
        visible={tagModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTagModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setTagModalVisible(false)}>
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
                  minHeight: 200,
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "700", marginBottom: 12 }}
                >
                  タグで絞り込み
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedTags([]);
                      setTagModalVisible(false);
                    }}
                    style={{
                      backgroundColor:
                        selectedTags.length === 0 ? "#0A84FF" : "#eee",
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      marginRight: 6,
                      marginBottom: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: selectedTags.length === 0 ? "white" : "#555",
                      }}
                    >
                      すべて
                    </Text>
                  </TouchableOpacity>
                  {allTags.map((tag) => {
                    const isSelected = selectedTags.some(
                      (t) => t.id === tag.id,
                    );
                    return (
                      <TouchableOpacity
                        key={tag.id}
                        onPress={() => {
                          setSelectedTags((prev) =>
                            isSelected
                              ? prev.filter((t) => t.id !== tag.id)
                              : [...prev, tag],
                          );
                        }}
                        style={{
                          backgroundColor: isSelected ? "#0A84FF" : "#eee",
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          marginRight: 6,
                          marginBottom: 4,
                        }}
                      >
                        <Text style={{ color: isSelected ? "white" : "#555" }}>
                          #{tag.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <View style={{ alignItems: "flex-end", marginTop: 12 }}>
                  <TouchableOpacity
                    onPress={() => setTagModalVisible(false)}
                    style={{
                      backgroundColor: "#0A84FF",
                      borderRadius: 8,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "700" }}>
                      閉じる
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ドロップピンモーダル */}
      <Modal
        visible={dropPinModal.visible}
        animationType="slide"
        transparent
        onRequestClose={() => setDropPinModal({ visible: false, coord: null })}
      >
        <TouchableWithoutFeedback
          onPress={() => setDropPinModal({ visible: false, coord: null })}
        >
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
                  minHeight: 220,
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "700", marginBottom: 12 }}
                >
                  ステータスをオンラインに変更
                </Text>
                <Text>開始時刻</Text>
                <DateTimeInput
                  value={pinStartAt}
                  onChange={setPinStartAt}
                  onAndroidPress={() => {
                    setDropPinModal({
                      visible: false,
                      coord: dropPinModal.coord,
                    });
                    setTimeout(() => {
                      setAndroidPicker({
                        type: "start",
                        mode: "date",
                        show: true,
                        tempDate: null,
                        target: "status",
                      });
                    }, 300);
                  }}
                  type="start"
                />
                <DateTimeInput
                  value={pinEndAt}
                  onChange={setPinEndAt}
                  onAndroidPress={() => {
                    setDropPinModal({
                      visible: false,
                      coord: dropPinModal.coord,
                    });
                    setTimeout(() => {
                      setAndroidPicker({
                        type: "end",
                        mode: "date",
                        show: true,
                        tempDate: null,
                        target: "status",
                      });
                    }, 300);
                  }}
                  type="end"
                />
                <View style={{ flexDirection: "row", marginTop: 16, gap: 12 }}>
                  <ActionBtn
                    label="キャンセル"
                    onPress={() =>
                      setDropPinModal({ visible: false, coord: null })
                    }
                  />
                  <ActionBtn
                    label="確定"
                    onPress={async () => {
                      if (!dropPinModal.coord || !pinStartAt) {
                        Alert.alert("開始時刻を入力してください");
                        return;
                      }
                      Alert.alert("確認", "この場所でオンラインにしますか？", [
                        { text: "キャンセル", style: "cancel" },
                        {
                          text: "OK",
                          onPress: async () => {
                            if (dropPinModal.coord) {
                              await setUserStatusAvailable(
                                dropPinModal.coord,
                                pinStartAt,
                                pinEndAt,
                              );
                              setDropPinModal({
                                visible: false,
                                coord: null,
                              });
                            }
                          },
                        },
                      ]);
                    }}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={helpModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setHelpModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setHelpModalVisible(false)}>
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
                  padding: 20,
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  minHeight: 220,
                }}
              >
                <Text
                  style={{ fontSize: 18, fontWeight: "700", marginBottom: 12 }}
                >
                  ドロップピンでオンラインステータスを設定する方法
                </Text>
                <Text style={{ fontSize: 15, marginBottom: 16, color: "#444" }}>
                  マップ上で長押しするとピンをドロップできます。{"\n"}
                  ピンをドロップした後、開始時刻と終了時刻を選択して「確定」を押すと、あなたのステータスがオンラインになり
                  主催者に誘ってもらえるようになります！
                </Text>
                <View style={{ alignItems: "flex-end", marginTop: 12 }}>
                  <TouchableOpacity
                    onPress={() => setHelpModalVisible(false)}
                    style={{
                      backgroundColor: "#0A84FF",
                      borderRadius: 8,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "700" }}>
                      閉じる
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {androidPicker?.show && Platform.OS === "android" && (
        <DateTimePicker
          value={
            androidPicker.tempDate ??
            (androidPicker.target === "search"
              ? androidPicker.type === "start"
                ? (searchStart ?? new Date())
                : (searchEnd ?? new Date())
              : androidPicker.type === "start"
                ? (pinStartAt ?? new Date())
                : (pinEndAt ?? new Date()))
          }
          mode={androidPicker.mode}
          display="default"
          minuteInterval={1}
          onChange={(_, date) => {
            if (!date) {
              setAndroidPicker(null);
              return;
            }
            if (androidPicker.mode === "date") {
              // After picking date, show time picker
              setAndroidPicker({
                ...androidPicker,
                mode: "time",
                show: true,
                tempDate: date,
              });
            } else {
              // Combine date and time
              const baseDate = androidPicker.tempDate ?? new Date();
              const finalDate = new Date(baseDate);
              finalDate.setHours(date.getHours());
              finalDate.setMinutes(date.getMinutes());
              finalDate.setSeconds(0);
              if (androidPicker.target === "search") {
                if (androidPicker.type === "start") setSearchStart(finalDate);
                else setSearchEnd(finalDate);
              } else {
                if (androidPicker.type === "start") setPinStartAt(finalDate);
                else setPinEndAt(finalDate);
                setTimeout(() => {
                  setDropPinModal({ visible: true, coord: dropPinModal.coord });
                }, 300);
              }
              setAndroidPicker(null);
            }
          }}
        />
      )}
    </SafeAreaView>
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

async function handleParticipate(event: Pin | null) {
  if (!event) return;
  const user = supabase.auth.getUser ? await supabase.auth.getUser() : null;
  const userId = user?.data?.user?.id;
  if (!userId) {
    Alert.alert("ログインしてください");
    return;
  }

  // Check if already participating
  const { data: existing, error: selectError } = await supabase
    .from("event_members")
    .select("id")
    .eq("user_id", userId)
    .eq("event_id", event.id)
    .single();

  if (selectError && selectError.code !== "PGRST116") {
    Alert.alert("確認エラー", selectError.message);
    return;
  }
  if (existing) {
    Alert.alert("既に参加しています");
    return;
  }

  // Add as participant
  const { error: insertError } = await supabase.from("event_members").insert({
    user_id: userId,
    event_id: event.id,
    role: "participant",
  });

  if (insertError) {
    Alert.alert("参加エラー", insertError.message);
    return;
  }
  Alert.alert("参加しました！");
}

function DateTimeInput({
  value,
  onChange,
  onAndroidPress,
  type,
}: {
  value: Date | null;
  onChange: (d: Date) => void;
  onAndroidPress?: () => void;
  type: "start" | "end";
}) {
  const [show, setShow] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => {
          if (Platform.OS === "android" && onAndroidPress) {
            onAndroidPress();
          } else {
            setShow(true);
          }
        }}
        style={{
          backgroundColor: "#eee",
          borderRadius: 8,
          padding: 8,
          marginTop: 4,
          maxWidth: 120, // Limit width
        }}
      >
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ fontSize: 13 }} // Slightly smaller font
        >
          {value
            ? value.toLocaleString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })
            : "選択してください"}
        </Text>
      </TouchableOpacity>
      {Platform.OS === "ios" && show && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            zIndex: 100,
            backgroundColor: "rgba(255,255,255,0.95)", // 半透明で背景を隠す
          }}
        >
          <DateTimePicker
            value={value ?? new Date()}
            mode="datetime"
            display="spinner"
            minuteInterval={1}
            onChange={(_, date) => {
              setShow(false);
              if (date) onChange(date);
            }}
          />
        </View>
      )}
    </>
  );
}
// {Platform.OS === "ios" && show && (
//   <View
//     style={{
//       position: "absolute",
//       top: 0,
//       left: 0,
//       right: 0,
//       bottom: 0,
//       justifyContent: "center",
//       alignItems: "center",
//       zIndex: 100,
//       backgroundColor: "rgba(255,255,255,0.95)", // 半透明で背景を隠す
//     }}
//   >
//     <DateTimePicker
//       value={value ?? new Date()}
//       mode="datetime"
//       display="spinner"
//       minuteInterval={1}
//       onChange={(_, date) => {
//         setShow(false);
//         if (date) onChange(date);
//       }}
//     />
//   </View>
//       )}
//     </>
//   );
// }
