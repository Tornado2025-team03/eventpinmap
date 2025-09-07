import React from "react";
import { View, Text } from "react-native";
import { Card } from "../ui/Card";
import { SectionLabel } from "../ui/SectionLabel";
import { PrimaryButton, OutlineButton } from "../ui/Button";

export function Step3(props: {
  what: string;
  formattedStart: string;
  formattedEnd: string;
  where: string;
  latitude?: number | null;
  longitude?: number | null;
  title: string;
  suggestedTitle: string;
  tags: string[];
  capacity: string;
  fee: string;
  description: string;
  rule: "open" | "approval";
  publishing: boolean;
  back: () => void;
  handlePublish: () => void;
}) {
  const {
    what,
    formattedStart,
    formattedEnd,
    where,
    latitude,
    longitude,
    title,
    suggestedTitle,
    tags,
    capacity,
    fee,
    description,
    rule,
    publishing,
    back,
    handlePublish,
  } = props;

  return (
    <View>
      <SectionLabel>内容の確認</SectionLabel>
      <Card>
        <View style={{ gap: 6 }}>
          <Text>・何を：{what}</Text>
          <Text>
            ・いつ：{formattedStart || "未設定"}
            {formattedEnd ? ` ~ ${formattedEnd}` : ""}
          </Text>
          <Text>・どこ：{where}</Text>
          {latitude != null && longitude != null && (
            <Text>
              ・位置情報：{latitude.toFixed(6)}, {longitude.toFixed(6)}
            </Text>
          )}
          <Text>・タイトル：{title || suggestedTitle}</Text>
          {tags.length > 0 && (
            <Text>・雰囲気：{tags.map((t) => `#${t}`).join(" ")}</Text>
          )}
          {!!capacity && <Text>・募集人数：{capacity}</Text>}
          {!!fee && <Text>・参加費：{fee}</Text>}
          {!!description && <Text>・説明：{description}</Text>}
          <Text>・参加方法：{rule === "open" ? "誰でも参加OK" : "承認制"}</Text>
        </View>
      </Card>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 16,
        }}
      >
        <OutlineButton title="戻る" onPress={back} />
        <PrimaryButton
          title={publishing ? "投稿中…" : "投稿する"}
          onPress={handlePublish}
          disabled={publishing}
        />
      </View>
    </View>
  );
}
