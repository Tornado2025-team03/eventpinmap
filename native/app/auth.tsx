import React, { useMemo, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";

export default function Auth() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    root?: string;
  }>({});

  const colors = useMemo(
    () => ({
      bg: isDark ? "#0b0f16" : "#f7f9fc",
      card: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.7)",
      inputBg: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.9)",
      text: isDark ? "#e6eef8" : "#0b1020",
      subText: isDark ? "#b7c3d6" : "#55607a",
      border: isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)",
      primary: "#3b82f6", // trend: 少し鮮やかめのブルー
      gradientFrom: isDark ? "#0b1324" : "#eaf2ff",
      gradientTo: isDark ? "#06101f" : "#f9fbff",
      danger: "#ef4444",
      success: "#22c55e",
    }),
    [isDark],
  );

  function validate() {
    const errs: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      errs.email = "正しいメールアドレスを入力してください";
    }
    if (password.length < 8) {
      errs.password = "パスワードは8文字以上を推奨します";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (loading) return;
    setErrors({});
    if (!validate()) return;

    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.replace("/(tabs)/see");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        router.replace("/profile-setup");
      }
    } catch (e: any) {
      setErrors((prev) => ({
        ...prev,
        root: e?.message ?? "エラーが発生しました",
      }));
    } finally {
      setLoading(false);
    }
  }

  const isValid =
    email.length > 0 &&
    password.length >= 8 &&
    Object.keys(errors).length === 0;

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
          <View style={[styles.container, { padding: 20 }]}>
            {/* ヘッダー */}
            <View style={{ gap: 6, marginBottom: 24 }}>
              <Text style={[styles.title, { color: colors.text }]}>
                {mode === "signin" ? "おかえりなさい" : "新規登録"}
              </Text>
              <Text style={{ color: colors.subText }}>
                {mode === "signin"
                  ? "メールとパスワードでログインしてください"
                  : "数秒で開始できます"}
              </Text>
            </View>

            {/* カード */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Email */}
              <View style={styles.inputWrap}>
                <Text style={[styles.label, { color: colors.subText }]}>
                  メールアドレス
                </Text>
                <View
                  style={[
                    styles.inputRow,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: errors.email ? colors.danger : "transparent",
                    },
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={errors.email ? colors.danger : colors.subText}
                    style={{ marginLeft: 10 }}
                  />
                  <TextInput
                    accessibilityLabel="Email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                    keyboardType="email-address"
                    returnKeyType="next"
                    placeholder="email@address.com"
                    placeholderTextColor={colors.subText}
                    value={email}
                    onChangeText={setEmail}
                    style={[styles.input, { color: colors.text }]}
                    textContentType="emailAddress"
                  />
                </View>
                {!!errors.email && (
                  <Text style={[styles.err, { color: colors.danger }]}>
                    {errors.email}
                  </Text>
                )}
              </View>

              {/* Password */}
              <View style={styles.inputWrap}>
                <Text style={[styles.label, { color: colors.subText }]}>
                  パスワード
                </Text>
                <View
                  style={[
                    styles.inputRow,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: errors.password
                        ? colors.danger
                        : "transparent",
                    },
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={errors.password ? colors.danger : colors.subText}
                    style={{ marginLeft: 10 }}
                  />
                  <TextInput
                    accessibilityLabel="Password"
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={!showPw}
                    placeholder="8文字以上を推奨"
                    placeholderTextColor={colors.subText}
                    value={password}
                    onChangeText={setPassword}
                    style={[styles.input, { color: colors.text }]}
                    textContentType="password"
                    returnKeyType="go"
                    onSubmitEditing={handleSubmit}
                  />
                  <Pressable
                    onPress={() => setShowPw((s) => !s)}
                    accessibilityLabel={
                      showPw ? "パスワードを隠す" : "パスワードを表示"
                    }
                    hitSlop={8}
                    style={{ padding: 8, marginRight: 6 }}
                  >
                    <Ionicons
                      name={showPw ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color={colors.subText}
                    />
                  </Pressable>
                </View>
                {!!errors.password && (
                  <Text style={[styles.err, { color: colors.danger }]}>
                    {errors.password}
                  </Text>
                )}
              </View>

              {/* Root error */}
              {!!errors.root && (
                <View style={{ marginTop: 6, marginBottom: 2 }}>
                  <Text style={[styles.err, { color: colors.danger }]}>
                    {errors.root}
                  </Text>
                </View>
              )}

              {/* Action */}
              <TouchableOpacity
                accessibilityLabel={
                  mode === "signin" ? "サインイン" : "サインアップ"
                }
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor:
                      loading || !isValid
                        ? `${colors.primary}55`
                        : colors.primary,
                  },
                ]}
                disabled={loading}
                onPress={handleSubmit}
              >
                {loading ? (
                  <ActivityIndicator />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {mode === "signin" ? "サインイン" : "アカウント作成"}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Sub actions */}
              <View style={styles.rowBetween}>
                <Pressable
                  onPress={() => {
                    setErrors({});
                    setMode((m) => (m === "signin" ? "signup" : "signin"));
                  }}
                  hitSlop={8}
                >
                  <Text style={{ color: colors.subText }}>
                    {mode === "signin" ? "新規登録へ" : "ログインへ"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />
              <Text style={{ color: colors.subText, marginHorizontal: 8 }}>
                または
              </Text>
              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />
            </View>

            {/* Social (必要になったらここで OAuth を有効化) */}
            {/* 例：
            <OAuthButton
              icon="logo-apple"
              label="Appleで続ける"
              onPress={() => supabase.auth.signInWithOAuth({ provider: "apple" })}
            />
            <OAuthButton
              icon="logo-google"
              label="Googleで続ける"
              onPress={() => supabase.auth.signInWithOAuth({ provider: "google" })}
            />
            */}

            <Text style={{ color: colors.subText, fontSize: 12, marginTop: 8 }}>
              続行すると、利用規約およびプライバシーポリシーに同意したものとみなされます。
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", gap: 12 },
  title: { fontSize: 28, fontWeight: "700", letterSpacing: 0.3 },
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
  label: { fontSize: 13, fontWeight: "600", letterSpacing: 0.2 },
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
  err: { fontSize: 13, lineHeight: 18 },
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
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    marginBottom: -4,
  },
  divider: { height: 1, flex: 1, opacity: 0.6, borderRadius: 999 },
});
