import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import React, { useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

// UIで使うStateの型定義
type UiProfile = {
  image: string | null;
  nickname: string;
  gender: string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  bio: string;
};

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UiProfile>({
    image: null,
    nickname: "",
    gender: "",
    birthYear: "",
    birthMonth: "",
    birthDay: "",
    bio: "",
  });

  // 画面表示時にSupabaseからデータを取得
  useFocusEffect(
    React.useCallback(() => {
      const fetchProfile = async () => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) throw new Error("ユーザーが見つかりません");

          const { data, error } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (error && error.code !== "PGRST116") throw error;

          if (data) {
            const [year, month, day] = data.birth_date
              ? data.birth_date.split("-")
              : ["", "", ""];
            setProfile({
              image: data.profile_image_url || null,
              nickname: data.nickname || "",
              gender: data.gender || "",
              birthYear: year,
              birthMonth: month,
              birthDay: day,
              bio: data.bio || "",
            });
          }
        } catch (error) {
          if (error instanceof Error) Alert.alert("エラー", error.message);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }, []),
  );

  // ヘッダーに保存ボタンを設置
  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackTitle: "設定",
      headerRight: () => (
        <TouchableOpacity onPress={handleSave} style={{ marginRight: 16 }}>
          <Text style={{ color: "#1976d2", fontSize: 16, fontWeight: "bold" }}>
            保存
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, profile]);

  // 保存処理
  const handleSave = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("ユーザーが見つかりません");

      let newAvatarUrl = profile.image;

      // 画像が新しく選択され、まだアップロードされていない場合
      if (profile.image && !profile.image.startsWith("http")) {
        const arraybuffer = await fetch(profile.image).then((res) =>
          res.arrayBuffer(),
        );
        const fileExt = profile.image.split(".").pop()?.toLowerCase() ?? "jpeg";
        const path = `${user.id}/${new Date().getTime()}.${fileExt}`;

        const { data, error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, arraybuffer, {
            contentType: `image/${fileExt}`,
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(data.path);
        newAvatarUrl = publicUrl;
      }

      // 保存する項目を編集可能なもの（プロフィール画像・ニックネーム・自己紹介）だけに絞る
      const updates = {
        id: user.id,
        nickname: profile.nickname,
        bio: profile.bio,
        profile_image_url: newAvatarUrl,
        updated_at: new Date(),
      };

      const { error } = await supabase.from("user_profiles").upsert(updates);
      if (error) throw error;

      Alert.alert("成功", "プロフィールを保存しました。");
      navigation.goBack();
    } catch (error) {
      if (error instanceof Error) Alert.alert("エラー", error.message);
    } finally {
      setLoading(false);
    }
  };

  // 画像選択処理
  const handleSelectImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("画像選択の権限が必要です");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfile((prev) => ({ ...prev, image: result.assets[0].uri }));
    }
  };

  // 年齢計算関数
  const getAge = () => {
    if (!profile.birthYear || !profile.birthMonth || !profile.birthDay)
      return "";
    const today = new Date();
    const birthDate = new Date(
      Number(profile.birthYear),
      Number(profile.birthMonth) - 1,
      Number(profile.birthDay),
    );
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        style={{ flex: 1, justifyContent: "center" }}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* プロフィール画像 (変更可能) */}
      <View style={styles.profileImageBlock}>
        <View style={styles.profileImageContainer}>
          {profile.image ? (
            <View style={styles.profileImageSelected}>
              <Image
                source={{ uri: profile.image }}
                style={{ width: 92, height: 92, borderRadius: 46 }}
                resizeMode="cover"
              />
            </View>
          ) : (
            <View style={styles.profileImagePlaceholder} />
          )}
        </View>
        <TouchableOpacity onPress={handleSelectImage}>
          <Text style={styles.selectImageText}>画像を変更する</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      {/* ニックネーム (変更可能) */}
      <View style={styles.infoItem}>
        <Text style={styles.accountLabel}>ニックネーム</Text>
        <TextInput
          style={styles.input}
          value={profile.nickname}
          onChangeText={(text) =>
            setProfile((prev) => ({ ...prev, nickname: text }))
          }
          placeholder="ニックネームを入力"
          placeholderTextColor="#888"
        />
      </View>

      {/* 性別 (表示のみ) */}
      <View style={styles.infoItem}>
        <Text style={styles.accountLabel}>性別</Text>
        <View style={[styles.input, styles.readOnlyField]}>
          <Text style={styles.readOnlyText}>{profile.gender || "未設定"}</Text>
        </View>
      </View>

      {/* 生年月日 (表示のみ) */}
      <View style={styles.infoItem}>
        <Text style={styles.accountLabel}>生年月日</Text>
        <View style={[styles.input, styles.readOnlyField]}>
          <Text style={styles.readOnlyText}>
            {profile.birthYear && profile.birthMonth && profile.birthDay
              ? `${profile.birthYear}年 ${profile.birthMonth}月 ${profile.birthDay}日（${getAge()}歳）`
              : "未設定"}
          </Text>
        </View>
      </View>

      {/* 自己紹介 (変更可能) */}
      <View style={styles.infoItem}>
        <Text style={styles.accountLabel}>自己紹介</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={profile.bio}
          onChangeText={(text) =>
            setProfile((prev) => ({ ...prev, bio: text }))
          }
          placeholder="自己紹介文を入力"
          placeholderTextColor="#888"
          multiline
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#fff",
    minHeight: "100%",
  },
  profileImageBlock: {
    alignItems: "center",
    marginBottom: 8,
  },
  profileImageContainer: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  profileImagePlaceholder: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#eee",
  },
  profileImageSelected: {
    width: 92,
    height: 92,
    borderRadius: 46,
    overflow: "hidden",
  },
  selectImageText: {
    color: "#1976d2",
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 16,
  },
  infoItem: {
    marginBottom: 12,
  },
  accountLabel: {
    fontSize: 14,
    color: "#000",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    backgroundColor: "#fafafa",
  },
  // ★★★ 追加: 表示専用フィールドのスタイル ★★★
  readOnlyField: {
    backgroundColor: "#f0f0f0", // 少し色を変えて編集不可を表現
    justifyContent: "center",
  },
  readOnlyText: {
    fontSize: 15,
    color: "#555", // 少し濃いめのグレー
  },
  textarea: {
    height: 80,
    textAlignVertical: "top",
  },
});
