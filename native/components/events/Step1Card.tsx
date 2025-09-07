import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { chip } from "./styles";
import { MapPicker } from "./MapPicker";
import { geocodeAddress } from "../../services/geocode";
import { Card } from "../ui/Card";
import { SectionLabel } from "../ui/SectionLabel";
import { PrimaryButton, OutlineButton } from "../ui/Button";

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
  setStartTimeQuick: (h: number, m?: number) => void;
  setDurationQuick: (hours: number) => void;
  next: () => void;
  canNext1: boolean;
  aiFill: (freeText: string) => Promise<void>;
}) {
  const {
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
    setStartTimeQuick,
    setDurationQuick,
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
      <SectionLabel>AI らくらく入力</SectionLabel>
      <Card>
        <Text style={{ fontWeight: "600", marginBottom: 8 }}>
          思いついたことを、そのまま入力！
        </Text>
        <Text style={{ color: "#666", marginBottom: 8 }}>
          1行で自由に書くと、AIが下のフォームに自動反映します
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
          <PrimaryButton
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
      </Card>

      <View style={{ height: 12 }} />
      <SectionLabel>基本情報</SectionLabel>
      <Card style={{ gap: 8 }}>
        <Text style={{ fontWeight: "600" }}>何をする？（必須）</Text>
        <TextInput
          style={{
            height: 48,
            borderColor: "#ccc",
            borderWidth: 1,
            borderRadius: 12,
            paddingHorizontal: 12,
          }}
          placeholder="作品名など／みんなで決める でもOK"
          value={what}
          onChangeText={setWhat}
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4 }}>
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
      </Card>

      <Card style={{ gap: 8 }}>
        <Text style={{ fontWeight: "600" }}>いつ？（必須）</Text>
        <View style={{ gap: 8 }}>
          <OutlineButton
            title={when ? when.toLocaleDateString() : "日付を選択"}
            onPress={() => openPicker("date", "start")}
          />
          <OutlineButton
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
          <OutlineButton
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
                key={String(k)}
                onPress={() => setQuickDate(k as any)}
                style={chip}
              >
                <Text>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* クイック時刻 */}
          <View
            style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4 }}
          >
            {[18, 19, 20, 21].map((h) => (
              <TouchableOpacity
                key={h}
                onPress={() => setStartTimeQuick(h, 0)}
                style={chip}
              >
                <Text>{`${h}:00`}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* 所要時間 */}
          <View
            style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4 }}
          >
            {[
              ["1時間", 1],
              ["2時間", 2],
              ["3時間", 3],
            ].map(([label, hrs]) => (
              <TouchableOpacity
                key={String(hrs)}
                onPress={() => setDurationQuick(hrs as number)}
                style={chip}
              >
                <Text>{label as string}</Text>
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
            <Text style={{ marginTop: 4 }}>{`選択中: ${formattedStart}${
              formattedEnd ? ` ~ ${formattedEnd}` : ""
            }`}</Text>
          )}
        </View>
      </Card>

      <Card style={{ gap: 8 }}>
        <Text style={{ fontWeight: "600" }}>どこで？（必須）</Text>
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
            placeholder="例：渋谷駅周辺 / ○○公園など"
            value={where}
            onChangeText={setWhere}
          />
          <PrimaryButton
            title={searching ? "検索中" : "検索"}
            disabled={searching}
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
          />
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
          <TouchableOpacity onPress={() => setShowMap((s) => !s)} style={chip}>
            <Text>{showMap ? "地図を閉じる" : "地図で選ぶ"}</Text>
          </TouchableOpacity>
        </View>
        {latitude != null && longitude != null ? (
          <Text style={{ marginTop: 4, color: "#2a7" }}>
            位置情報（OK）: {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </Text>
        ) : (
          <Text style={{ marginTop: 4, color: "#c33" }}>
            位置情報（必須・未設定）: 検索 or 地図で選ぶ
            で座標を設定してください
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
      </Card>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          marginTop: 16,
          paddingBottom: 30,
        }}
      >
        <PrimaryButton title="次へ" onPress={next} disabled={!canNext1} />
      </View>
    </View>
  );
}

export default Step1;
