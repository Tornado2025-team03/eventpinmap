import React from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Platform,
} from "react-native";
import iconNames from "../../constants/lucideIconNames.json";
import iconAliasesJa from "../../constants/iconAliasesJa";
import { LucideIcon } from "../LucideIcon";

type Props = {
  visible: boolean;
  value?: string;
  onClose: () => void;
  onSelect: (name: string) => void;
};

export function IconPickerModal({ visible, value, onClose, onSelect }: Props) {
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const PAGE_SIZE = 200;
  const filtered = React.useMemo(() => {
    const source = iconNames as string[];
    const query = q.trim();
    if (!query) return source.slice(0, PAGE_SIZE * page);

    const qLower = query.toLowerCase();
    const base = source.filter((n) => n.toLowerCase().includes(qLower));

    // Japanese alias expansion
    const aliasHits = new Set<string>();
    for (const [ja, names] of Object.entries(iconAliasesJa)) {
      if (ja.includes(query) || query.includes(ja)) {
        for (const nm of names) aliasHits.add(nm);
      }
    }
    const merged = Array.from(new Set([...aliasHits, ...base]));
    return merged.slice(0, PAGE_SIZE * page);
  }, [q, page]);

  const totalCount = React.useMemo(() => (iconNames as string[]).length, []);

  React.useEffect(() => {
    if (!visible) {
      setQ("");
      setPage(1);
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          padding: 16,
          paddingTop: Platform.OS === "ios" ? 48 : 16,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>
          アイコンを選択
        </Text>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="検索（例: Film, Music, MapPin ...）"
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            height: 44,
            borderColor: "#ccc",
            borderWidth: 1,
            borderRadius: 12,
            paddingHorizontal: 12,
            marginBottom: 12,
          }}
        />

        <FlatList
          data={filtered}
          keyExtractor={(name) => name}
          numColumns={3}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
          onEndReached={() => setPage((p) => p + 1)}
          onEndReachedThreshold={0.5}
          renderItem={({ item: name }) => (
            <TouchableOpacity
              onPress={() => {
                onSelect(name);
                onClose();
              }}
              style={{
                flex: 1,
                minWidth: 0,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: value === name ? "#0a84ff" : "#ddd",
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <LucideIcon name={name} />
              <Text
                numberOfLines={1}
                style={{ fontSize: 12, color: "#333", maxWidth: 90 }}
              >
                {name}
              </Text>
            </TouchableOpacity>
          )}
        />

        <Text style={{ textAlign: "right", color: "#666" }}>
          {filtered.length} / {totalCount} 件表示
        </Text>

        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <TouchableOpacity
            onPress={onClose}
            style={{ paddingHorizontal: 16, paddingVertical: 12 }}
          >
            <Text style={{ color: "#0a84ff", fontWeight: "600" }}>閉じる</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
