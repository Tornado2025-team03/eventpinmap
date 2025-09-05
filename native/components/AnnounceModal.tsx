import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { createAnnouncement } from "../services/organizer";

interface AnnounceModalProps {
  visible: boolean;
  eventId: string | null;
  eventName: string;
  onClose: () => void;
}

export function AnnounceModal({
  visible,
  eventId,
  eventName,
  onClose,
}: AnnounceModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!eventId) return;

    if (!title.trim()) {
      Alert.alert("エラー", "タイトルを入力してください");
      return;
    }

    if (!content.trim()) {
      Alert.alert("エラー", "内容を入力してください");
      return;
    }

    setSending(true);
    try {
      await createAnnouncement(eventId, title.trim(), content.trim());
      Alert.alert("成功", "アナウンスを送信しました");
      setTitle("");
      setContent("");
      onClose();
    } catch (error: any) {
      Alert.alert("エラー", "アナウンスの送信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setContent("");
    onClose();
  };

  // 定型文テンプレート
  const templates = [
    {
      title: "時間変更のお知らせ",
      content:
        "イベントの開始時間を変更いたします。\n\n変更前: \n変更後: \n\nご都合が悪くなった方はお知らせください。",
    },
    {
      title: "場所変更のお知らせ",
      content:
        "イベントの開催場所を変更いたします。\n\n変更前: \n変更後: \n\n詳細な住所は別途お送りします。",
    },
    {
      title: "持ち物のお知らせ",
      content:
        "イベント当日の持ち物についてお知らせします。\n\n必須：\n- \n- \n\nあると便利：\n- \n- ",
    },
    {
      title: "リマインダー",
      content:
        "イベント開催が近づいてまいりました。\n\n日時: \n場所: \n\n楽しみにお待ちしております！",
    },
  ];

  const applyTemplate = (template: { title: string; content: string }) => {
    setTitle(template.title);
    setContent(template.content);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>アナウンス</Text>
            <Text style={styles.subtitle}>{eventName}</Text>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.label}>テンプレート</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.templateContainer}
            >
              {templates.map((template, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.templateButton}
                  onPress={() => applyTemplate(template)}
                >
                  <Text style={styles.templateButtonText}>
                    {template.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>タイトル</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="アナウンスのタイトル"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            <Text style={styles.characterCount}>{title.length}/100</Text>

            <Text style={styles.label}>内容</Text>
            <TextInput
              style={styles.contentInput}
              placeholder="アナウンスの内容を入力してください..."
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.characterCount}>{content.length}/500</Text>

            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>プレビュー</Text>
              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>
                  {title || "タイトルが表示されます"}
                </Text>
                <Text style={styles.previewContent}>
                  {content || "内容が表示されます"}
                </Text>
                <Text style={styles.previewEvent}>イベント: {eventName}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!title.trim() || !content.trim() || sending) &&
                  styles.disabledButton,
              ]}
              onPress={handleSend}
              disabled={!title.trim() || !content.trim() || sending}
            >
              <Text style={styles.sendButtonText}>
                {sending ? "送信中..." : "送信"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "90%",
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 8,
    marginTop: 16,
  },
  templateContainer: {
    marginBottom: 8,
  },
  templateButton: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  templateButtonText: {
    color: "#2196F3",
    fontSize: 12,
    fontWeight: "bold",
  },
  titleInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
  },
  contentInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
    height: 120,
  },
  characterCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
  previewContainer: {
    marginTop: 16,
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 8,
  },
  previewCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 8,
  },
  previewContent: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
    marginBottom: 8,
  },
  previewEvent: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#666",
    marginRight: 8,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  sendButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#2196F3",
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
