import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Audio } from "expo-av";

export default function AudioRecorderScreen() {
  const [recording, setRecording] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  async function stopCurrentSound() {
    if (!sound) return;

    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch (error) {
      console.log("Erro ao parar áudio atual:", error);
    }

    setSound(null);
    setIsPlaying(false);
  }

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        alert("Permissão negada");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
    } catch (err) {
      console.error("Falha ao iniciar gravação", err);
    }
  }

  async function stopRecording() {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recording.getURI();

      if (uri) {
        const timestamp = new Date();
        const newRecording = {
          id: `${timestamp.getTime()}`,
          uri,
          name: `Gravação ${timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}`,
          createdAt: timestamp,
        };

        setRecordings((prev) => [newRecording, ...prev]);
        setSelectedRecording(newRecording);
      }
    } catch (error) {
      console.error("Erro ao finalizar gravação", error);
    } finally {
      setRecording(null);
    }
  }

  async function playRecording(recordingItem) {
    if (!recordingItem?.uri) return;

    await stopCurrentSound();

    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingItem.uri },
        { shouldPlay: true }
      );

      setSelectedRecording(recordingItem);
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error("Erro ao reproduzir gravação", error);
    }
  }

  async function togglePlayback() {
    if (!selectedRecording) return;

    if (!sound) {
      await playRecording(selectedRecording);
      return;
    }

    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
      return;
    }

    await sound.playAsync();
    setIsPlaying(true);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gravações</Text>

      <TouchableOpacity
        style={[styles.recordButton, recording && styles.recordButtonActive]}
        onPress={recording ? stopRecording : startRecording}
      >
        <Text style={styles.recordButtonText}>
          {recording ? "⏹️" : "▶️"}
        </Text>
      </TouchableOpacity>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {recordings.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma gravação</Text>
        ) : (
          recordings.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.item,
                selectedRecording?.id === item.id && styles.itemSelected,
              ]}
              onPress={() => playRecording(item)}
            >
              <Text style={styles.itemText}>{item.name}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <View style={styles.player}>
        <Text style={styles.playerTitle}>Playlist</Text>

        {selectedRecording ? (
          <Text style={styles.playerName}>{selectedRecording.name}</Text>
        ) : (
          <Text style={styles.emptyText}>Selecione uma gravação</Text>
        )}

        <TouchableOpacity
          style={[styles.playButton, !selectedRecording && styles.playButtonDisabled]}
          onPress={togglePlayback}
          disabled={!selectedRecording}
        >
          <Text style={styles.playButtonText}>
            {selectedRecording ? (isPlaying ? "⏸️" : "▶️") : "▶️"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    paddingHorizontal: 18,
    paddingTop: 40,
    paddingBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 18,
  },
  recordButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 18,
  },
  recordButtonActive: {
    backgroundColor: "#D32F2F",
  },
  recordButtonText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
  },
  list: {
    flex: 1,
    marginBottom: 12,
  },
  item: {
    backgroundColor: "#1d1d1d",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2c2c2c",
  },
  itemSelected: {
    borderColor: "#4CAF50",
    backgroundColor: "#1f2c1f",
  },
  itemText: {
    color: "#fff",
    fontSize: 15,
  },
  emptyText: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
  },
  player: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2d2d2d",
  },
  playerTitle: {
    color: "#8bc34a",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  playerName: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 12,
  },
  playButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  playButtonDisabled: {
    backgroundColor: "#555",
  },
  playButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
});
