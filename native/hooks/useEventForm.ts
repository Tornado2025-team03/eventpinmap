import React from "react";
import { Alert, Platform } from "react-native";
import { supabase } from "../lib/supabase";
import { insertEvent, insertEventTags } from "../services/events";
import { geocodeAddress, reverseGeocode } from "../services/geocode";
import type { Rule, Step, TargetField } from "../types/event";

function quickDate(kind: "today" | "tomorrow" | "weekend") {
  const now = new Date();
  const d = new Date(now);
  if (kind === "tomorrow") d.setDate(d.getDate() + 1);
  if (kind === "weekend") {
    const day = now.getDay();
    const toSat = (6 - day + 7) % 7 || 6;
    d.setDate(now.getDate() + toSat);
  }
  d.setHours(19, 0, 0, 0);
  return d;
}

function mergeDateOrTime(
  prev: Date | null,
  picked: Date,
  mode: "date" | "time",
) {
  if (!prev) return picked;
  const merged = new Date(prev);
  if (mode === "date") {
    merged.setFullYear(
      picked.getFullYear(),
      picked.getMonth(),
      picked.getDate(),
    );
  } else {
    merged.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
  }
  return merged;
}

function buildDescription(params: {
  tags: string[];
  capacity: string;
  fee: string;
  description: string;
}) {
  const parts: string[] = [];
  if (params.description) parts.push(params.description);
  if (params.tags.length) parts.push("タグ: " + params.tags.join(", "));
  if (params.capacity) parts.push("募集人数: " + params.capacity);
  if (params.fee) parts.push("参加費: " + params.fee);
  return parts.join("\n");
}

export function useEventForm() {
  // global
  const [step, setStep] = React.useState<Step>(1);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [publishing, setPublishing] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error) setUserId(data.user?.id ?? null);
    })();
  }, []);

  // Step 1
  const [what, setWhat] = React.useState("");
  const [when, setWhen] = React.useState<Date | null>(null);
  const [endAt, setEndAt] = React.useState<Date | null>(null);
  const [where, setWhere] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [latitude, setLatitude] = React.useState<number | null>(null);
  const [longitude, setLongitude] = React.useState<number | null>(null);

  // Step 2
  const [tags, setTags] = React.useState<string[]>([]);
  const [capacity, setCapacity] = React.useState("");
  const [fee, setFee] = React.useState("0");
  const [description, setDescription] = React.useState("");
  const [addDetailsOpen, setAddDetailsOpen] = React.useState(true);

  // Step 3
  const [rule, setRule] = React.useState<Rule>("open");

  // picker state
  const [showPicker, setShowPicker] = React.useState(false);
  const [pickerMode, setPickerMode] = React.useState<"date" | "time">("date");
  const [targetField, setTargetField] = React.useState<TargetField>("start");

  const openPicker = (mode: "date" | "time", target: TargetField) => {
    setPickerMode(mode);
    setTargetField(target);
    setShowPicker(true);
  };

  const onChangePicker = (_: any, selected?: Date) => {
    if (Platform.OS !== "ios") setShowPicker(false);
    if (!selected) return;

    if (targetField === "start") {
      const nextStart = mergeDateOrTime(when, selected, pickerMode);
      setWhen(nextStart);
      if (endAt && nextStart && endAt < nextStart) {
        const fixed = new Date(nextStart.getTime() + 60 * 60 * 1000);
        setEndAt(fixed);
      }
    } else {
      const base = endAt ?? when ?? new Date();
      const nextEnd = mergeDateOrTime(base, selected, pickerMode);
      if (when && nextEnd < when) {
        Alert.alert(
          "終了時間が開始時間より前です",
          "開始以降に設定してください。",
        );
        return;
      }
      setEndAt(nextEnd);
    }
  };

  const formattedStart = React.useMemo(
    () =>
      when
        ? `${when.toLocaleDateString()} ${when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        : "",
    [when],
  );

  const formattedEnd = React.useMemo(
    () =>
      endAt
        ? `${endAt.toLocaleDateString()} ${endAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        : "",
    [endAt],
  );

  const suggestedTitle = React.useMemo(() => {
    if (!what && !when) return "";
    const datePart = when ? when.toLocaleDateString() : "日時未定";
    return `『${what}』をする会（${datePart}）`;
  }, [what, when]);

  const canNext1 = true;
  const next = () =>
    setStep((s) =>
      s === 1 ? (2 as Step) : s === 2 ? (3 as Step) : (3 as Step),
    );
  const back = () =>
    setStep((s) =>
      s === 3 ? (2 as Step) : s === 2 ? (1 as Step) : (1 as Step),
    );

  const toggleTag = (t: string) =>
    setTags((arr) =>
      arr.includes(t) ? arr.filter((x) => x !== t) : [...arr, t],
    );

  const setQuickDate = (kind: "today" | "tomorrow" | "weekend") => {
    setWhen(quickDate(kind));
  };

  const handlePublish = async () => {
    if (publishing) return;
    if (!userId) {
      Alert.alert(
        "エラー",
        "ユーザー情報を取得できません。再ログインしてください。",
      );
      return;
    }
    if (!when) {
      Alert.alert("エラー", "開始日時を入力してください。");
      return;
    }

    const name = title || suggestedTitle || "無題のイベント";
    const payload = {
      name,
      description: buildDescription({ tags, capacity, fee, description }),
      location: where,
      start_at: when.toISOString(),
      end_at: endAt ? endAt.toISOString() : null,
      created_by: userId,
      status: rule,
      latitude,
      longitude,
    } as const;

    try {
      setPublishing(true);
      const created = await insertEvent(payload);

      // event_tags へタグを保存（存在すれば）
      try {
        const id = (created as any)?.id;
        if (id && tags.length > 0) {
          await insertEventTags(id, tags);
        }
      } catch (tagErr) {
        console.warn("tag insert error:", tagErr);
        // タグ失敗は致命的ではないため継続
      }

      Alert.alert("成功", "イベントを作成しました！");
    } catch (error: any) {
      console.log("insert error:", error);
      Alert.alert("投稿に失敗しました", error?.message ?? "不明なエラー");
    } finally {
      setPublishing(false);
    }
  };

  return {
    // state
    step,
    publishing,
    what,
    when,
    endAt,
    where,
    title,
    latitude,
    longitude,
    tags,
    capacity,
    fee,
    description,
    addDetailsOpen,
    rule,
    showPicker,
    pickerMode,
    targetField,
    // setters
    setWhat,
    setWhen,
    setEndAt,
    setWhere,
    setTitle,
    setLatitude,
    setLongitude,
    setTags,
    setCapacity,
    setFee,
    setDescription,
    setAddDetailsOpen,
    setRule,
    // derived
    formattedStart,
    formattedEnd,
    suggestedTitle,
    canNext1,
    // actions
    next,
    back,
    toggleTag,
    openPicker,
    onChangePicker,
    setQuickDate,
    handlePublish,
    // geo helpers
    async geocodeCurrentAddress() {
      if (!where?.trim()) return;
      try {
        const r = await geocodeAddress(where);
        if (r) {
          setLatitude(r.latitude);
          setLongitude(r.longitude);
          // Googleの整形住所があれば上書き
          if (r.formattedAddress) setWhere(r.formattedAddress);
          Alert.alert("位置情報を設定", "住所から座標を取得しました。");
        } else {
          Alert.alert("見つかりません", "住所から座標を取得できませんでした。");
        }
      } catch (e: any) {
        Alert.alert("エラー", "ジオコーディングでエラーが発生しました。");
      }
    },
    async setCoordinatesAndReverseGeocode(lat: number, lng: number) {
      setLatitude(lat);
      setLongitude(lng);
      // 可能なら逆ジオコーディングで "where" を補完
      try {
        const addr = await reverseGeocode({ latitude: lat, longitude: lng });
        if (addr) setWhere(addr);
      } catch {}
    },
  } as const;
}
