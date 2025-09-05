import { useNavigation } from "@react-navigation/native";
import React, { useLayoutEffect } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

const TERMS_TEXT = `この利用規約（以下、「本規約」といいます。）は、Future Huckers（以下、「当方」といいます。）がこのアプリケーション上で提供するサービス（以下、「本サービス」といいます。）の利用条件を定めるものです。ユーザーの皆様（以下、「ユーザー」といいます。）には、本規約に従って、本サービスをご利用いただきます。

第1条（適用）
本規約は、ユーザーと当方との間の本サービスの利用に関わる一切の関係に適用されるものとします。

第2条（利用登録）
1. 本サービスの利用を希望する者は、本規約に同意の上、当方の定める方法（Google認証）によって利用登録を申請し、当方がこれを承認することによって、利用登録が完了するものとします。
2. ユーザーは、自己の責任において、本サービスのアカウントを適切に管理するものとします。

第3条（禁止事項）
ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
1. 法令または公序良俗に違反する行為
2. 犯罪行為に関連する行為
3. 他のユーザー、第三者、または当方のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為
4. 他のユーザーに関する個人情報等を収集または蓄積する行為
5. 他のユーザーに成りすます行為
6. 当方のサービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為
7. その他、当方が不適切と判断する行為

第4条（免責事項）
1. 当方は、本サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。
2. 当方は、本サービスに関して、ユーザーと他のユーザーまたは第三者との間において生じた取引、連絡または紛争等について一切責任を負いません。
3. 当方は、当方の都合により、本サービスの内容を変更し、または提供を終了することができます。

第5条（利用規約の変更）
当方は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。

第6条（準拠法・裁判管轄）
本規約の解釈にあたっては、日本法を準拠法とします。

附則
2025年9月5日 制定`;
const PRIVACY_POLICY_URL =
  "https://tornado2025-team03.github.io/eventpinmap/privacy-policy.html";

export default function TermsScreen() {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ headerBackTitle: "設定" });
  }, [navigation]);

  const handlePrivacyPress = () => {
    Linking.openURL(PRIVACY_POLICY_URL);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>利用規約</Text>
      <Text style={styles.termsText}>{TERMS_TEXT}</Text>

      <TouchableOpacity style={styles.privacyLink} onPress={handlePrivacyPress}>
        <Text style={styles.privacyText}>プライバシーポリシーはこちら</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 16,
  },
  termsText: {
    fontSize: 15,
    color: "#222",
    lineHeight: 22,
    marginBottom: 24,
  },
  privacyLink: {
    paddingVertical: 12,
  },
  privacyText: {
    color: "#1976d2",
    fontSize: 15,
    textDecorationLine: "underline",
  },
});
