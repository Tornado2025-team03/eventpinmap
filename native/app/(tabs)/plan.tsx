// EventCreateScreen.tsx
import React, { useMemo, useState } from "react";
import {
  Text,
  View,
  Button,
  TextInput,
  SafeAreaView,
  ScrollView,
  Platform,
  TouchableOpacity,
  Switch,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

type Step = 1 | 2 | 3;
type Rule = "open" | "approval";

const chip = {
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 16,
  backgroundColor: "#eef",
  marginRight: 8,
  marginTop: 8,
};

const quickDate = (kind: "today" | "tomorrow" | "weekend") => {
  const now = new Date();
  const d = new Date(now);
  if (kind === "tomorrow") d.setDate(d.getDate() + 1);
  if (kind === "weekend") {
    const day = now.getDay(); // 0=Sun
    const toSat = (6 - day + 7) % 7 || 6; // 今週土曜へ寄せる（今日が日曜なら6日後）
    d.setDate(now.getDate() + toSat);
  }
  d.setHours(19, 0, 0, 0); // 初期は19:00にしておく
  return d;
};

export default function EventCreateScreen() {
  const [step, setStep] = useState<Step>(1);

  // Step1（必須）
  const [what, setWhat] = useState<string>(""); // 何を観る？
  const [when, setWhen] = useState<Date | null>(null); // いつ？
  const [where, setWhere] = useState<string>(""); // どこで？
  const [title, setTitle] = useState<string>(""); // タイトル

  // Step2（任意）
  const [tags, setTags] = useState<string[]>([]); // 雰囲気タグ
  const [capacity, setCapacity] = useState<string>(""); // 募集人数（文字で保持）
  const [fee, setFee] = useState<string>("0"); // 参加費
  const [items, setItems] = useState<string>(""); // 持ち物
  const [addDetailsOpen, setAddDetailsOpen] = useState<boolean>(true);

  // Step3（ルール）
  const [rule, setRule] = useState<Rule>("open"); // "open" | "approval"

  // date/time picker
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
  const openPicker = (mode: "date" | "time") => {
    setPickerMode(mode);
    setShowPicker(true);
  };
  const onChange = (_: any, selected?: Date) => {
    if (Platform.OS !== "ios") setShowPicker(false);
    if (!selected) return;
    setWhen((prev) => {
      if (!prev) return selected;
      const merged = new Date(prev);
      if (pickerMode === "date")
        merged.setFullYear(
          selected.getFullYear(),
          selected.getMonth(),
          selected.getDate(),
        );
      else merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      return merged;
    });
  };
  const formattedWhen = when
    ? `${when.toLocaleDateString()} ${when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "";

  // タイトル自動提案
  const suggestedTitle = useMemo(() => {
    if (!what && !when) return "";
    const datePart = when ? when.toLocaleDateString() : "日時未定";
    return `『${what}』をする会（${datePart}）`;
  }, [what, when]);

  // 必須のバリデーション
  //   const canNext1 = !!what && !!when && !!where;
  const canNext1 = true; // 仮で常に有効にしてる

  const next = () => setStep((s) => Math.min(4, s + 1) as Step);
  const back = () => setStep((s) => Math.max(1, s - 1) as Step);

  // 便宜：タグトグル
  const toggleTag = (t: string) =>
    setTags((arr) =>
      arr.includes(t) ? arr.filter((x) => x !== t) : [...arr, t],
    );

  const handlePublish = () => {
    // ここでAPIへPOSTするだけでOK（MVP）
    const payload = {
      what,
      when: when?.toISOString(),
      where,
      title: title || suggestedTitle,
      details: {
        tags,
        capacity: capacity ? Number(capacity) : null,
        fee: fee ? Number(fee) : 0,
        items,
      },
      rule,
    };
    console.log("POST /events", payload);
    alert("イベントを作成しました！");
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 4,
          }}
        >
          募集する
        </Text>
        <Text style={{ textAlign: "center", color: "#666", marginBottom: 16 }}>
          必要事項を入力
        </Text>

        {/* --- STEP 1: 必須だけ --- */}
        {step === 1 && (
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

            <Text style={{ fontWeight: "600", marginBottom: 8 }}>
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
            <View
              style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}
            >
              {["アニメ鑑賞会", "バドミントン", "もくもく勉強"].map((l) => (
                <TouchableOpacity
                  key={l}
                  onPress={() => setWhat(l)}
                  style={chip}
                >
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
                onPress={() => openPicker("date")}
              />
              <Button
                title={
                  when
                    ? when.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "時間を選択"
                }
                onPress={() => openPicker("time")}
              />
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {[
                  ["今日", "today"],
                  ["明日", "tomorrow"],
                  ["今週末", "weekend"],
                ].map(([label, k]) => (
                  <TouchableOpacity
                    key={k}
                    onPress={() => setWhen(quickDate(k as any))}
                    style={chip}
                  >
                    <Text>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {showPicker && (
                <DateTimePicker
                  value={when ?? new Date()}
                  mode={pickerMode}
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onChange}
                />
              )}
              {!!formattedWhen && (
                <Text style={{ marginTop: 4 }}>選択中: {formattedWhen}</Text>
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
        )}

        {/* --- STEP 2: 任意詳細（折りたたみ） --- */}
        {step === 2 && (
          <View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ fontWeight: "600" }}>もっと詳しく</Text>
              <Switch
                value={addDetailsOpen}
                onValueChange={setAddDetailsOpen}
              />
            </View>

            {addDetailsOpen && (
              <>
                <Text style={{ marginTop: 12 }}>雰囲気タグ（複数選択可）</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {[
                    "初心者歓迎",
                    "10代",
                    "20代",
                    "30代以上",
                    "年齢不問",
                    "男子会",
                    "女子会",
                    "静かに集中",
                    "飲食持込自由",
                    "ネタバレ配慮",
                    "初見歓迎",
                  ].map((t) => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => toggleTag(t)}
                      style={[
                        chip,
                        { backgroundColor: tags.includes(t) ? "#cfe" : "#eef" },
                      ]}
                    >
                      <Text>#{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={{ marginTop: 12 }}>募集人数</Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    marginTop: 8,
                  }}
                >
                  {["何人でも", "2~3人", "4~5人", "6人以上"].map((person) => (
                    <TouchableOpacity
                      key={person}
                      onPress={() => setCapacity(person)}
                      style={[
                        chip,
                        {
                          backgroundColor:
                            capacity === person ? "#cfe" : "#eef",
                        },
                      ]}
                    >
                      <Text>{person}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={{ marginTop: 12 }}>参加費（円）</Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    marginTop: 8,
                  }}
                >
                  {[
                    "未定",
                    "0円",
                    "1000円以下",
                    "1000~2000円",
                    "2000~3000円",
                  ].map((money) => (
                    <TouchableOpacity
                      key={money}
                      onPress={() => setFee(money)}
                      style={[
                        chip,
                        { backgroundColor: fee === money ? "#cfe" : "#eef" },
                      ]}
                    >
                      <Text>{money}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={{ marginTop: 12 }}>持ち物・準備</Text>
                <TextInput
                  placeholder="例：好きなお菓子。手ぶらでOKも選べます"
                  value={items}
                  onChangeText={setItems}
                  multiline
                  style={{
                    height: 90,
                    borderColor: "#ccc",
                    borderWidth: 1,
                    borderRadius: 12,
                    padding: 12,
                  }}
                />
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    marginTop: 8,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setItems("手ぶらでOK！")}
                    style={chip}
                  >
                    <Text>手ぶらでOK！</Text>
                  </TouchableOpacity>
                </View>

                {/* 画像アップロードは後で実装（ボタンだけ用意）
                <View style={{marginTop:12}}>
                  <Button title="表紙画像を選ぶ（後で実装）" onPress={()=>alert("画像ピッカーは後で実装")} />
                </View> */}
              </>
            )}

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 16,
                paddingBottom: 30,
              }}
            >
              <Button title="戻る" onPress={back} />
              <Button title="次へ" onPress={next} />
            </View>
          </View>
        )}

        {/* --- STEP 3: 参加ルール ---
        {step === 3 && (
          <View>
            <Text style={{fontWeight:"600", marginBottom:8}}>参加方法</Text>
            <View style={{gap:8}}>
              <TouchableOpacity onPress={()=>setRule("open")} style={[{padding:12, borderWidth:1, borderRadius:12}, {borderColor: rule==="open" ? "#0a0" : "#ccc"}]}>
                <Text>誰でも参加OK（最も手軽）</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={()=>setRule("approval")} style={[{padding:12, borderWidth:1, borderRadius:12}, {borderColor: rule==="approval" ? "#0a0" : "#ccc"}]}>
                <Text>主催者の承認が必要（安心重視）</Text>
              </TouchableOpacity>
            </View>

            <View style={{flexDirection:"row", justifyContent:"space-between", marginTop:16}}>
              <Button title="戻る" onPress={back} />
              <Button title="確認へ" onPress={next} />
            </View>
          </View>
        )} */}

        {/* --- STEP 4: 最終確認／投稿 --- */}
        {step === 3 && (
          <View>
            <Text style={{ fontWeight: "600", marginBottom: 8 }}>
              内容の確認
            </Text>
            <View
              style={{
                gap: 6,
                padding: 12,
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 12,
              }}
            >
              <Text>・何を：{what}</Text>
              <Text>・いつ：{formattedWhen || "未設定"}</Text>
              <Text>・どこ：{where}</Text>
              <Text>・タイトル：{title || suggestedTitle}</Text>
              {tags.length > 0 && (
                <Text>・雰囲気：{tags.map((t) => `#${t}`).join(" ")}</Text>
              )}
              {capacity && <Text>・募集人数：{capacity}人</Text>}
              {fee && <Text>・参加費：{fee}</Text>}
              {items && <Text>・持ち物：{items}</Text>}
              <Text>
                ・参加方法：{rule === "open" ? "誰でも参加OK" : "承認制"}
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 16,
              }}
            >
              <Button title="戻る" onPress={back} />
              <Button title="投稿する" onPress={handlePublish} />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
