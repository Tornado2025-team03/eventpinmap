import { useNavigation } from "@react-navigation/native";
import React, { useLayoutEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput } from "react-native";

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [sns, setSNS] = useState("");

  useLayoutEffect(() => {
    navigation.setOptions({ headerBackTitle: "設定" });
  }, [navigation]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>ニックネーム</Text>
      <TextInput
        style={styles.input}
        value={nickname}
        onChangeText={setNickname}
        placeholder="ニックネームを入力"
      />

      <Text style={styles.label}>自己紹介文</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={bio}
        onChangeText={setBio}
        placeholder="自己紹介文を入力"
        multiline
      />

      <Text style={styles.label}>性別</Text>
      <TextInput
        style={styles.input}
        value={gender}
        onChangeText={setGender}
        placeholder="男性・女性・その他・回答しない など"
      />

      <Text style={styles.label}>SNSリンク</Text>
      <TextInput
        style={styles.input}
        value={sns}
        onChangeText={setSNS}
        placeholder="XやInstagramなどのURLを入力"
        autoCapitalize="none"
        autoCorrect={false}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#fff",
    minHeight: "100%",
  },
  label: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 6,
    marginTop: 18,
    color: "#222",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    backgroundColor: "#fafafa",
    marginBottom: 8,
  },
  textarea: {
    height: 80,
    textAlignVertical: "top",
  },
});
