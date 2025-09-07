import React from "react";
import { View, Text, TouchableOpacity, TextInput, Switch } from "react-native";
import { chip } from "./styles";
import { Card } from "../ui/Card";
import { SectionLabel } from "../ui/SectionLabel";
import { PrimaryButton, OutlineButton } from "../ui/Button";
import { LucideIcon } from "../LucideIcon";
import { IconPickerModal } from "./IconPickerModal";

export function Step2(props: {
  tags: string[];
  toggleTag: (t: string) => void;
  capacity: string;
  setCapacity: (s: string) => void;
  fee: string;
  setFee: (s: string) => void;
  description: string;
  setDescription: (s: string) => void;
  addDetailsOpen: boolean;
  setAddDetailsOpen: (b: boolean) => void;
  back: () => void;
  next: () => void;
  iconName: string;
  setIconName: (n: string) => void;
  chooseIconManually: (n: string) => void;
  resetIconAuto?: () => void;
}) {
  const {
    tags,
    toggleTag,
    capacity,
    setCapacity,
    fee,
    setFee,
    description,
    setDescription,
    addDetailsOpen,
    setAddDetailsOpen,
    back,
    next,
    iconName,
    setIconName,
    chooseIconManually,
    resetIconAuto,
  } = props;

  const [iconModalOpen, setIconModalOpen] = React.useState(false);

  return (
    <View>
      <SectionLabel>詳細設定</SectionLabel>
      <Card>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontWeight: "600" }}>もっと詳しく</Text>
          <Switch value={addDetailsOpen} onValueChange={setAddDetailsOpen} />
        </View>

        {addDetailsOpen && (
          <>
            {/* 追加: アイコン設定（main） */}
            <Text style={{ marginTop: 12 }}>イベントのアイコン</Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 8,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <LucideIcon name={iconName} />
                <Text style={{ color: "#555" }}>{iconName}</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setIconModalOpen(true)}
                  style={{
                    backgroundColor: "#0a84ff",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>変更</Text>
                </TouchableOpacity>
                {resetIconAuto && (
                  <TouchableOpacity
                    onPress={() => resetIconAuto()}
                    style={{
                      backgroundColor: "#eee",
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: "#333", fontWeight: "600" }}>
                      自動に戻す
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* 既存: 雰囲気タグ（両方にあるが配置を main に合わせる） */}
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

            {/* 追加: 募集人数（main） */}
            <Text style={{ marginTop: 12 }}>募集人数</Text>
            <View
              style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}
            >
              {["何人でも", "2~3人", "4~5人", "6人以上"].map((person) => (
                <TouchableOpacity
                  key={person}
                  onPress={() => setCapacity(person)}
                  style={[
                    chip,
                    { backgroundColor: capacity === person ? "#cfe" : "#eef" },
                  ]}
                >
                  <Text>{person}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={{ marginTop: 12 }}>募集人数</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
          {["何人でも", "2~3人", "4~5人", "6人以上"].map((person) => (
            <TouchableOpacity
              key={person}
              onPress={() => setCapacity(person)}
              style={[
                chip,
                { backgroundColor: capacity === person ? "#cfe" : "#eef" },
              ]}
            >
              <Text>{person}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ marginTop: 12 }}>参加費（円）</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
          {["未定", "0円", "1000円以下", "1000~2000円", "2000~3000円"].map(
            (money) => (
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
            ),
          )}
        </View>

        <Text style={{ marginTop: 12 }}>説明</Text>
        <TextInput
          placeholder="例：好きなお菓子。手ぶらでOKも選べます"
          value={description}
          onChangeText={setDescription}
          multiline
          style={{
            height: 90,
            borderColor: "#ccc",
            borderWidth: 1,
            borderRadius: 12,
            padding: 12,
          }}
        />

        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
          <TouchableOpacity
            onPress={() => setDescription("手ぶらでOKです")}
            style={chip}
          >
            <Text>手ぶらでOK！</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <IconPickerModal
        visible={iconModalOpen}
        value={iconName}
        onClose={() => setIconModalOpen(false)}
        onSelect={(n) => chooseIconManually(n)}
      />

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 16,
          paddingBottom: 30,
        }}
      >
        <OutlineButton title="戻る" onPress={back} />
        <PrimaryButton title="次へ" onPress={next} />
      </View>
    </View>
  );
}
