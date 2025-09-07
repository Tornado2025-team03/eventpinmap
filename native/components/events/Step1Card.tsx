import React from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { chip } from "./styles";
import { MapPicker } from "./MapPicker";
import { geocodeAddress } from "../../services/geocode";

export function Step1(props: {
  title: string;
  setTitle: (s: string) => void;
  suggestedTitle: string;
  what: string;
  setWhat: (s: string) => void;
  when: Date | null;
  endAt: Date | null;
  formattedStart: string;
  formattedEnd: string;
  where: string;
  setWhere: (s: string) => void;
  latitude: number | null;
  longitude: number | null;
  setLatitude: (n: number | null) => void;
  setLongitude: (n: number | null) => void;
  geocodeCurrentAddress: () => Promise<void>;
  setCoordinatesAndReverseGeocode: (lat: number, lng: number) => Promise<void>;
  showPicker: boolean;
  pickerMode: "date" | "time";
  targetField: "start" | "end";
  openPicker: (mode: "date" | "time", target: "start" | "end") => void;
  onChangePicker: (_: any, d?: Date) => void;
  setQuickDate: (k: "today" | "tomorrow" | "weekend") => void;
  next: () => void;
  canNext1: boolean;
  aiFill: (freeText: string) => Promise<void>;
}) {
  const {
    // title, setTitle, suggestedTitle, // title はここでは直接いじらない
    what,
    setWhat,
    when,
    endAt,
    formattedStart,
    formattedEnd,
    where,
    setWhere,
    latitude,
    longitude,
    setLatitude,
    setLongitude,
    showPicker,
    pickerMode,
    targetField,
    openPicker,
    onChangePicker,
    setQuickDate,
    next,
    canNext1,
    aiFill,
  } = props;

  const [showMap, setShowMap] = React.useState(false);
  const [aiBusy, setAiBusy] = React.useState(false);
  const [searching, setSearching] = React.useState(false);
  const [freeText, setFreeText] = React.useState("");

  return (
    <View>
      {/* AIらくらく入力（カード） */}
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: 12,
          borderWidth: 1,
          borderColor: "#eee",
          marginTop: 12,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }}
      >
        <Text style={{ fontWeight: "600", marginBottom: 8 }}>
          思いついたことを、そのまま入力！
        </Text>
        <Text style={{ color: "#666", marginBottom: 8 }}>
          1文で自由に書くと、AIが下のフォームに自動反映します
        </Text>
        <View style={{ gap: 8 }}>
          <TextInput
            style={{
              height: 48,
              borderColor: "#ccc",
              borderWidth: 1,
              borderRadius: 12,
              paddingHorizontal: 12,
            }}
            placeholder="例：明日の夜 渋谷でアニメ鑑賞会"
            value={freeText}
            onChangeText={setFreeText}
          />
          <Button
            title={aiBusy ? "解析中…" : "AIらくらく入力"}
            disabled={aiBusy}
            onPress={async () => {
              const text = freeText.trim();
              if (!text) {
                Alert.alert(
                  "自由入力が空です",
                  "上段の自由欄にやりたいことを書いてください",
                );
                return;
              }
              setAiBusy(true);
              try {
                await aiFill(text);
                Alert.alert("反映しました", "候補をフォームに反映しました");
              } catch (e: any) {
                Alert.alert(
                  "AI入力に失敗しました",
                  e?.message ?? "解析に失敗しました",
                );
              } finally {
                setAiBusy(false);
              }
            }}
          />
        </View>
      </View>

      {/* 手動入力 */}
      <Text style={{ fontWeight: "600", marginBottom: 8, marginTop: 16 }}>
        何をする？
      </Text>
      <TextInput
        style={{
          height: 48,
          borderColor: "#ccc",
          borderWidth: 1,
          borderRadius: 12,
          paddingHorizontal: 12,
        }}
        placeholder="作品名 など（みんなで決める でもOK）"
        value={what}
        onChangeText={setWhat}
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
        {["アニメ鑑賞会", "バドミントン", "もくもく勉強"].map((l) => (
          <TouchableOpacity key={l} onPress={() => setWhat(l)} style={chip}>
            <Text>{l}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          onPress={() => setWhat("みんなで決める")}
          style={chip}
        >
          <Text>みんなで決める</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ fontWeight: "600", marginTop: 16, marginBottom: 8 }}>
        いつ？
      </Text>
      <View style={{ gap: 8 }}>
        <Button
          title={when ? when.toLocaleDateString() : "日付を選択"}
          onPress={() => openPicker("date", "start")}
        />
        <Button
          title={
            when
              ? when.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "開始時間を選択"
          }
          onPress={() => openPicker("time", "start")}
        />
        <Button
          title={
            endAt
              ? endAt.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "終了時間を選択"
          }
          onPress={() => openPicker("time", "end")}
        />

        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {[
            ["今日", "today"],
            ["明日", "tomorrow"],
            ["今週末", "weekend"],
          ].map(([label, k]) => (
            <TouchableOpacity
              key={k}
              onPress={() => setQuickDate(k as any)}
              style={chip}
            >
              <Text>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {showPicker && (
          <DateTimePicker
            value={
              targetField === "start"
                ? (when ?? new Date())
                : (endAt ?? when ?? new Date())
            }
            mode={pickerMode}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onChangePicker}
          />
        )}

        {!!formattedStart && (
          <Text
            style={{ marginTop: 4 }}
          >{`選択中: ${formattedStart}${formattedEnd ? ` ~ ${formattedEnd}` : ""}`}</Text>
        )}
      </View>

      <Text style={{ fontWeight: "600", marginTop: 16, marginBottom: 8 }}>
        どこで？
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <TextInput
          style={{
            flex: 1,
            height: 48,
            borderColor: "#ccc",
            borderWidth: 1,
            borderRadius: 12,
            paddingHorizontal: 12,
          }}
          placeholder="例：渋谷駅周辺 / ○○公園 など"
          value={where}
          onChangeText={setWhere}
        />
        <TouchableOpacity
          onPress={async () => {
            const q = (where ?? "").trim();
            if (q.length < 2) {
              Alert.alert(
                "検索ワードが短いです",
                "2文字以上を入力してください",
              );
              return;
            }
            setSearching(true);
            try {
              const r = await geocodeAddress(q);
              if (r) {
                setLatitude(r.latitude);
                setLongitude(r.longitude);
                setShowMap(true);
              } else {
                Alert.alert(
                  "見つかりません",
                  "該当する場所が見つかりませんでした",
                );
              }
            } catch {
              Alert.alert("エラー", "検索中にエラーが発生しました");
            } finally {
              setSearching(false);
            }
          }}
          disabled={searching}
          style={{
            height: 48,
            paddingHorizontal: 12,
            backgroundColor: searching ? "#ccc" : "#007aff",
            borderRadius: 12,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            {searching ? "検索中" : "検索"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 地図で選ぶ */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
        <TouchableOpacity onPress={() => setShowMap((s) => !s)} style={chip}>
          <Text>{showMap ? "地図を閉じる" : "地図で選ぶ"}</Text>
        </TouchableOpacity>
      </View>
      {latitude != null && longitude != null && (
        <Text style={{ marginTop: 4, color: "#555" }}>
          位置情報: {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </Text>
      )}

      {showMap && (
        <MapPicker
          value={
            latitude != null && longitude != null
              ? { latitude, longitude }
              : null
          }
          onConfirm={(lat, lng) => {
            setShowMap(false);
            setLatitude(lat);
            setLongitude(lng);
          }}
          onCancel={() => setShowMap(false)}
        />
      )}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          marginTop: 16,
          paddingBottom: 30,
        }}
      >
        <Button title="次へ" onPress={next} disabled={!canNext1} />
      </View>
    </View>
  );
}

export default Step1;
