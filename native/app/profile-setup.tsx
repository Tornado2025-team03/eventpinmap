import React, { useState, useMemo } from "react";
import {
  Alert,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
  useColorScheme,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function ProfileSetup() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState<Date>(new Date());
  const [nickname, setNickname] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const colors = useMemo(
    () => ({
      bg: isDark ? "#0b0f16" : "#f7f9fc",
      card: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.7)",
      inputBg: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.9)",
      text: isDark ? "#e6eef8" : "#0b1020",
      subText: isDark ? "#b7c3d6" : "#55607a",
      border: isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)",
      primary: "#3b82f6",
      gradientFrom: isDark ? "#0b1324" : "#eaf2ff",
      gradientTo: isDark ? "#06101f" : "#f9fbff",
      danger: "#ef4444",
      success: "#22c55e",
    }),
    [isDark],
  );

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  }

  async function uploadImage(uri: string): Promise<string | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("ユーザーが見つかりません");

      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `${user.id}-${Date.now()}.jpg`;

      const { data, error } = await supabase.storage
        .from("profiles")
        .upload(fileName, blob, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("profiles")
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Image upload error:", error);
      return null;
    }
  }

  async function handleSubmit() {
    if (loading) return;
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("ユーザーが見つかりません");

      let profileImageUrl = null;
      if (profileImage) {
        profileImageUrl = await uploadImage(profileImage);
      }

      const { error } = await supabase.from("user_profiles").upsert({
        id: user.id,
        profile_image_url: profileImageUrl,
        bio: bio.trim() || null,
        gender: gender || null,
        birth_date: birthDate.toISOString().split("T")[0],
        nickname: nickname.trim(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      Alert.alert("プロフィール設定完了", "アプリをお楽しみください！", [
        { text: "OK", onPress: () => router.replace("/(tabs)/see") },
      ]);
    } catch (error: any) {
      Alert.alert(
        "エラー",
        error.message || "プロフィールの保存に失敗しました",
      );
    } finally {
      setLoading(false);
    }
  }

  const genderOptions = [
    { label: "男性", value: "male" },
    { label: "女性", value: "female" },
    { label: "その他", value: "other" },
    { label: "回答しない", value: "prefer_not_to_say" },
  ];

  return (
    <LinearGradient
      colors={[colors.gradientFrom, colors.gradientTo]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.container, { padding: 20 }]}>
              {/* Header */}
              <View style={{ gap: 6, marginBottom: 24 }}>
                <Text style={[styles.title, { color: colors.text }]}>
                  プロフィールを設定
                </Text>
                <Text style={{ color: colors.subText }}>
                  あなたについて教えてください
                </Text>
              </View>

              {/* Card */}
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                {/* Profile Image */}
                <View style={styles.inputWrap}>
                  <Text style={[styles.label, { color: colors.subText }]}>
                    プロフィール画像
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.imagePickerButton,
                      { borderColor: colors.border },
                    ]}
                    onPress={pickImage}
                  >
                    {profileImage ? (
                      <Image
                        source={{ uri: profileImage }}
                        style={styles.profileImage}
                      />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Ionicons
                          name="camera"
                          size={40}
                          color={colors.subText}
                        />
                        <Text
                          style={[
                            styles.imagePlaceholderText,
                            { color: colors.subText },
                          ]}
                        >
                          写真を選択
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Nickname */}
                <View style={styles.inputWrap}>
                  <Text style={[styles.label, { color: colors.subText }]}>
                    ニックネーム *
                  </Text>
                  <View
                    style={[
                      styles.inputRow,
                      {
                        backgroundColor: colors.inputBg,
                        borderColor: "transparent",
                      },
                    ]}
                  >
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={colors.subText}
                      style={{ marginLeft: 10 }}
                    />
                    <TextInput
                      placeholder="表示名を入力"
                      placeholderTextColor={colors.subText}
                      value={nickname}
                      onChangeText={setNickname}
                      style={[styles.input, { color: colors.text }]}
                      maxLength={20}
                    />
                  </View>
                </View>

                {/* Bio */}
                <View style={styles.inputWrap}>
                  <Text style={[styles.label, { color: colors.subText }]}>
                    自己紹介
                  </Text>
                  <View
                    style={[
                      styles.inputRow,
                      {
                        backgroundColor: colors.inputBg,
                        borderColor: "transparent",
                      },
                    ]}
                  >
                    <TextInput
                      placeholder="あなたについて教えてください"
                      placeholderTextColor={colors.subText}
                      value={bio}
                      onChangeText={setBio}
                      style={[
                        styles.input,
                        styles.bioInput,
                        { color: colors.text },
                      ]}
                      multiline
                      numberOfLines={3}
                      maxLength={300}
                      textAlignVertical="top"
                    />
                  </View>
                  <Text style={[styles.charCount, { color: colors.subText }]}>
                    {bio.length}/300
                  </Text>
                </View>

                {/* Gender */}
                <View style={styles.inputWrap}>
                  <Text style={[styles.label, { color: colors.subText }]}>
                    性別
                  </Text>
                  <View style={styles.genderOptions}>
                    {genderOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.genderOption,
                          {
                            backgroundColor:
                              gender === option.value
                                ? colors.primary
                                : colors.inputBg,
                            borderColor: colors.border,
                          },
                        ]}
                        onPress={() => setGender(option.value)}
                      >
                        <Text
                          style={[
                            styles.genderOptionText,
                            {
                              color:
                                gender === option.value ? "#fff" : colors.text,
                            },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Birth Date */}
                <View style={styles.inputWrap}>
                  <Text style={[styles.label, { color: colors.subText }]}>
                    生年月日
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.inputRow,
                      {
                        backgroundColor: colors.inputBg,
                        borderColor: "transparent",
                      },
                    ]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={colors.subText}
                      style={{ marginLeft: 10 }}
                    />
                    <Text style={[styles.input, { color: colors.text }]}>
                      {birthDate.toLocaleDateString("ja-JP")}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={18}
                      color={colors.subText}
                      style={{ marginRight: 10 }}
                    />
                  </TouchableOpacity>
                </View>

                {showDatePicker && (
                  <DateTimePicker
                    value={birthDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(Platform.OS === "ios");
                      if (selectedDate) {
                        setBirthDate(selectedDate);
                      }
                    }}
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                  />
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    {
                      backgroundColor:
                        loading || !nickname.trim()
                          ? `${colors.primary}55`
                          : colors.primary,
                    },
                  ]}
                  disabled={loading || !nickname.trim()}
                  onPress={handleSubmit}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>
                      プロフィールを保存
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => router.replace("/(tabs)/see")}
              >
                <Text style={{ color: colors.subText }}>
                  スキップして始める
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    gap: 12,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  inputWrap: { gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  bioInput: {
    minHeight: 80,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
  },
  imagePickerButton: {
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  imagePlaceholderText: {
    fontSize: 14,
    fontWeight: "500",
  },
  genderOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  genderOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  genderOptionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  primaryBtn: {
    marginTop: 6,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  skipButton: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 12,
  },
});
