import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import React, { useLayoutEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const navigation = useNavigation();
  // プロフィールデータ一括管理
  const [profile, setProfile] = useState({
    image: null as string | null,
    nickname: "",
    gender: "",
    birthYear: "",
    birthMonth: "",
    birthDay: "",
    bio: "",
  });
  const [genderPickerOpen, setGenderPickerOpen] = useState(false);
  const [birthPickerOpen, setBirthPickerOpen] = useState(false);

  // 保存処理（ダミー）
  // 保存処理（DB/API連携用）
  const handleSave = async () => {
    // ここでDB保存処理を実装予定
    // 例: await api.saveProfile(profile)
    navigation.goBack();
  };

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

  // 画像選択関数（expo-image-picker使用）
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileImageBlock}>
        <View style={styles.profileImageContainer}>
          {/* 画像があれば表示、なければグレー丸 */}
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
          <Text style={styles.selectImageText}>画像を選択する</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />
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
      <View style={styles.infoItem}>
        <Text style={styles.accountLabel}>性別</Text>
        <TouchableOpacity
          onPress={() => setGenderPickerOpen(!genderPickerOpen)}
        >
          <View style={[styles.input, { justifyContent: "center" }]}>
            <Text
              style={{ color: profile.gender ? "#222" : "#888", fontSize: 15 }}
            >
              {profile.gender || "性別を選択"}
            </Text>
          </View>
        </TouchableOpacity>
        {genderPickerOpen && (
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={profile.gender}
              onValueChange={(itemValue) =>
                setProfile((prev) => ({ ...prev, gender: itemValue }))
              }
            >
              <Picker.Item label="男性" value="男性" />
              <Picker.Item label="女性" value="女性" />
              <Picker.Item label="その他" value="その他" />
              <Picker.Item label="回答しない" value="回答しない" />
            </Picker>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => setGenderPickerOpen(false)}
            >
              <Text style={styles.confirmButtonText}>決定</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={styles.infoItem}>
        <Text style={styles.accountLabel}>生年月日</Text>
        <TouchableOpacity onPress={() => setBirthPickerOpen(!birthPickerOpen)}>
          <View style={[styles.input, { justifyContent: "center" }]}>
            <Text
              style={{
                color:
                  profile.birthYear && profile.birthMonth && profile.birthDay
                    ? "#222"
                    : "#888",
                fontSize: 15,
              }}
            >
              {profile.birthYear && profile.birthMonth && profile.birthDay
                ? `${profile.birthYear}年 ${profile.birthMonth}月 ${profile.birthDay}日（${getAge()}歳）`
                : "生年月日を選択"}
            </Text>
          </View>
        </TouchableOpacity>
        {birthPickerOpen && (
          <View style={styles.pickerContainer}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 4,
              }}
            >
              <View style={{ flex: 1, minWidth: 80 }}>
                <Picker
                  selectedValue={profile.birthYear}
                  style={{ width: "100%" }}
                  onValueChange={(itemValue) =>
                    setProfile((prev) => ({ ...prev, birthYear: itemValue }))
                  }
                >
                  <Picker.Item label="年" value="" />
                  {[...Array(80)].map((_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <Picker.Item
                        key={year}
                        label={`${year}`}
                        value={String(year)}
                      />
                    );
                  })}
                </Picker>
              </View>
              <View style={{ flex: 1, minWidth: 60 }}>
                <Picker
                  selectedValue={profile.birthMonth}
                  style={{ width: "100%" }}
                  onValueChange={(itemValue) =>
                    setProfile((prev) => ({ ...prev, birthMonth: itemValue }))
                  }
                >
                  <Picker.Item label="月" value="" />
                  {[...Array(12)].map((_, i) => (
                    <Picker.Item
                      key={i + 1}
                      label={`${i + 1}`}
                      value={String(i + 1)}
                    />
                  ))}
                </Picker>
              </View>
              <View style={{ flex: 1, minWidth: 60 }}>
                <Picker
                  selectedValue={profile.birthDay}
                  style={{ width: "100%" }}
                  onValueChange={(itemValue) =>
                    setProfile((prev) => ({ ...prev, birthDay: itemValue }))
                  }
                >
                  <Picker.Item label="日" value="" />
                  {[...Array(31)].map((_, i) => (
                    <Picker.Item
                      key={i + 1}
                      label={`${i + 1}`}
                      value={String(i + 1)}
                    />
                  ))}
                </Picker>
              </View>
            </View>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => setBirthPickerOpen(false)}
            >
              <Text style={styles.confirmButtonText}>決定</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginTop: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  container: {
    padding: 24,
    backgroundColor: "#fff",
    minHeight: "100%",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 4,
    color: "#222",
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
  profileImage: {
    fontSize: 24,
    color: "#4285F4",
    fontWeight: "bold",
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
    marginBottom: 4,
  },
  accountLabel: {
    fontSize: 14,
    color: "#000",
    marginTop: 4,
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
  confirmButton: {
    alignSelf: "flex-end",
    margin: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: "#1976d2",
    borderRadius: 20,
    minWidth: 80,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
