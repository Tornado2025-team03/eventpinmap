import React from "react";
import { Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { insertEvent, insertEventTagIds } from "../services/events";
import { fetchTagOptionsByNames } from "../services/tagOptions";
import { geocodeAddress, reverseGeocode } from "../services/geocode";
import { aiFillFromText } from "../services/nlp";
import { aiFillRemote, generateTitle } from "../services/ai";
import type { Rule, Step, TargetField } from "../types/event";

function quickDate(kind: "today" | "tomorrow" | "weekend") {
  const now = new Date();
  const d = new Date(now);
  if (kind === "tomorrow") d.setDate(d.getDate() + 1);
  if (kind === "weekend") {
    const day = now.getDay();
    const toSat = (6 - day + 7) % 7 || 6; // next Saturday (today->6)
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

function buildDescription(params: { description: string }) {
  return params.description || "";
}

function buildAutoTitle(what?: string, when?: Date | null) {
  const w = (what || "").trim();
  const datePart = when ? when.toLocaleDateString() : "日時未定";
  if (!w && !when) return "";
  if (!w) return `イベント（${datePart}）`;
  return `${w}（${datePart}）`;
}

export function useEventForm() {
  const router = useRouter();

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
  const [fee, setFee] = React.useState("");
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
          "開始以降に設定してください",
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

  // Auto-generate title via AI when inputs change (only if title is empty)
  React.useEffect(() => {
    let timer: any;
    if (!what && !when && !where) return;
    if (title && title.trim()) return;
    timer = setTimeout(async () => {
      const t = await generateTitle({ what, when, where }).catch(() => null);
      setTitle((t && t.trim()) || (what ? String(what).trim() : ""));
    }, 400);
    return () => clearTimeout(timer);
  }, [what, when, where, title]);

  const suggestedTitle = React.useMemo(
    () => (what ? String(what).trim() : ""),
    [what],
  );

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
        "ユーザー情報を取得できません。ログインしてください",
      );
      return;
    }
    if (!when) {
      Alert.alert("エラー", "開始日時を入力してください");
      return;
    }

    const name = title || suggestedTitle || "";
    const payload = {
      name,
      description: buildDescription({ description }),
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

      // event_tags へタグを保存。tag_options から name -> id を解決
      try {
        const eventId = (created as any)?.id;
        if (eventId) {
          const names: string[] = [];
          if (tags.length) names.push(...tags);
          if (capacity) names.push(capacity);
          if (fee) names.push(fee);

          const map = await fetchTagOptionsByNames(names);
          const tagIds = names
            .map((n) => map.get(n)?.id)
            .filter((v): v is string => typeof v === "string");

          if (tagIds.length) {
            await insertEventTagIds(eventId, tagIds);
          } else if (names.length > 0) {
            console.warn("No tag ids resolved from tag_options for:", names);
            Alert.alert(
              "タグ未登録",
              "選択したタグに対応するデータが見つからず、タグは保存されませんでした",
            );
          }
        }
      } catch (tagErr) {
        console.warn("tag insert error:", tagErr);
        // タグ挿入の失敗は致命的ではないため続行
      }

      const lat = latitude ?? undefined;
      const lng = longitude ?? undefined;
      Alert.alert("成功", "イベントを作成しました", [
        {
          text: "OK",
          onPress: () => {
            // reset to Step1 state before navigating
            setStep(1);
            setWhat("");
            setTitle("");
            setWhen(null);
            setEndAt(null);
            setWhere("");
            setLatitude(null);
            setLongitude(null);
            setTags([]);
            setCapacity("");
            setFee("");
            setDescription("");
            setAddDetailsOpen(true);
            setRule("open");

            const params: Record<string, string> = {};
            if (typeof lat === "number") params.lat = String(lat);
            if (typeof lng === "number") params.lng = String(lng);
            router.replace({ pathname: "/(tabs)/see", params });
          },
        },
      ]);
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
    // AI free text helper
    async aiFill(freeText: string) {
      const text = (freeText ?? "").trim();
      if (!text) return;
      // Try remote first; on any failure, gracefully fall back to local parsing
      let updated = false;
      try {
        const remote = await aiFillRemote(text);
        if (remote) {
          const newWhat = remote.what ?? what;
          const newWhere = remote.where ?? where;
          const newWhen = remote.when ?? null;
          const newEnd = remote.endAt ?? null;
          setWhat(newWhat ?? "");
          setWhere(newWhere ?? "");
          setWhen(newWhen);
          setEndAt(newEnd);
          setLatitude(
            typeof remote.latitude === "number" ? remote.latitude : null,
          );
          setLongitude(
            typeof remote.longitude === "number" ? remote.longitude : null,
          );
          const t = await generateTitle({
            what: newWhat ?? "",
            when: newWhen,
            where: newWhere,
          }).catch(() => null);
          setTitle((t && t.trim()) || buildAutoTitle(newWhat ?? "", newWhen));
          updated = true;
        }
      } catch (_err) {
        // ignore; will fallback to local
      }

      if (!updated) {
        const local = await aiFillFromText(text);
        const newWhat = local.what ?? what;
        const newWhere = local.where ?? where;
        const newWhen = local.when ?? null;
        const newEnd = local.endAt ?? null;
        setWhat(newWhat ?? "");
        setWhere(newWhere ?? "");
        setWhen(newWhen);
        setEndAt(newEnd);
        setLatitude(typeof local.latitude === "number" ? local.latitude : null);
        setLongitude(
          typeof local.longitude === "number" ? local.longitude : null,
        );
        const t = await generateTitle({
          what: newWhat ?? "",
          when: newWhen,
          where: newWhere,
        }).catch(() => null);
        setTitle((t && t.trim()) || buildAutoTitle(newWhat ?? "", newWhen));
      }
    },
    // geo helpers
    async geocodeCurrentAddress() {
      if (!where?.trim()) return;
      try {
        const r = await geocodeAddress(where);
        if (r) {
          setLatitude(r.latitude);
          setLongitude(r.longitude);
          // Google の整形住所があれば上書き
          if (r.formattedAddress) setWhere(r.formattedAddress);
          Alert.alert("位置情報を設定", "住所から座標を取得しました");
        } else {
          Alert.alert("見つかりません", "住所から座標を取得できませんでした");
        }
      } catch (e: any) {
        Alert.alert("エラー", "ジオコーディングでエラーが発生しました");
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
