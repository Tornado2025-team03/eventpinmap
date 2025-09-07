import React, { useState, useEffect } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (visible) {
      setComment("");
    }
  }, [visible]);

  const handleSend = () => {
    if (!comment.trim()) {
      Alert.alert("エラー", "アナウンス内容を入力してください");
      return;
    }
    Alert.alert("成功", "アナウンスを送信しました");
    setComment("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>アナウンス</Text>
          <Text style={styles.subtitle}>{eventName}</Text>
          <TextInput
            style={styles.input}
            placeholder="アナウンス内容を入力してください"
            value={comment}
            onChangeText={setComment}
            multiline
          />
          <View style={styles.footer}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleSend}>
              <Text style={styles.buttonText}>送信</Text>
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  container: {
    width: "90%",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    height: 100,
    textAlignVertical: "top",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    padding: 10,
    backgroundColor: "#007BFF",
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
