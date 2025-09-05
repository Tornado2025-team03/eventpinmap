import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Button } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function EventDetail() {
  const { id } = useLocalSearchParams() as { id?: string };
  const [event, setEvent] = useState<any>(null);

  useEffect(() => {
    if (id) fetchEvent(Number(id));
  }, [id]);

  async function fetchEvent(eventId: number) {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();
      if (error) throw error;
      setEvent(data);
    } catch (err: any) {
      console.error("fetchEvent error", err.message || err);
    }
  }

  if (!id)
    return (
      <View style={styles.container}>
        <Text>イベントIDが不明です</Text>
      </View>
    );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!event && <Text>読み込み中…</Text>}
      {event && (
        <View style={styles.card}>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.item}>何を: {event.what}</Text>
          <Text style={styles.item}>
            日時: {event.when ? new Date(event.when).toLocaleString() : "未定"}
          </Text>
          <Text style={styles.item}>場所: {event.where}</Text>
          <Text style={styles.item}>
            詳細: {event.details ? JSON.stringify(event.details) : "-"}
          </Text>
          <Button title="編集（未実装）" onPress={() => {}} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#F7F9FB", flexGrow: 1 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  item: { fontSize: 14, color: "#333", marginBottom: 6 },
});
