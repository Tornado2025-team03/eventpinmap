import React from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  TouchableOpacity,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { chip } from "./styles";
import { MapPicker } from "./MapPicker";

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
}) {
  const {
    title,
    setTitle,
    suggestedTitle,
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
    geocodeCurrentAddress,
    setCoordinatesAndReverseGeocode,
    showPicker,
    pickerMode,
    targetField,
    openPicker,
    onChangePicker,
    setQuickDate,
    next,
    canNext1,
  } = props;

  const [showMap, setShowMap] = React.useState(false);

  return (
    <View>
      <Text style={{ fontWeight: "600", marginTop: 16, marginBottom: 8 }}>
        思いついたことを、そのまま入力！
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
          placeholder="明日の夜渋谷でエヴァンゲリオンのアニメ見たいなぁ"
          value={title}
          onChangeText={setTitle}
        />
        <Button
          title="AIらくらく入力"
          onPress={() => setTitle(suggestedTitle)}
        />
      </View>

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
        placeholder="作品名 or みんなで決めたい"
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
          onPress={() => setWhat("みんなで決めたい")}
          style={chip}
        >
          <Text>みんなで決めたい</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ fontWeight: "600", marginTop: 16, marginBottom: 8 }}>
        いつやる？
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
          <Text style={{ marginTop: 4 }}>
            {`選択中: ${formattedStart}${formattedEnd ? ` ~ ${formattedEnd}` : ""}`}
          </Text>
        )}
      </View>

      <Text style={{ fontWeight: "600", marginTop: 16, marginBottom: 8 }}>
        どこでやる？
      </Text>
      <TextInput
        style={{
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

      {/* 住所→座標化、地図で選択 */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
        <TouchableOpacity onPress={geocodeCurrentAddress} style={chip}>
          <Text>住所から検索</Text>
        </TouchableOpacity>
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
            setCoordinatesAndReverseGeocode(lat, lng);
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
