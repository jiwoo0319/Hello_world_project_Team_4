import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";

export default function IndoorScreen({ building, onBack }) {
  const [selectedFloor, setSelectedFloor] = useState(building.floors[0]);
  const [selectedRoom, setSelectedRoom] = useState(null);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>← 지도로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{building.name} 내부 안내</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.floorTabs}>
        {building.floors.map((floor) => (
          <TouchableOpacity
            key={floor.id}
            style={[
              styles.floorTab,
              selectedFloor.id === floor.id && styles.floorTabActive,
            ]}
            onPress={() => {
              setSelectedFloor(floor);
              setSelectedRoom(null);
            }}
          >
            <Text
              style={[
                styles.floorTabText,
                selectedFloor.id === floor.id && styles.floorTabTextActive,
              ]}
            >
              {floor.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionLabel}>{selectedFloor.label} 목적지 선택</Text>
        <View style={styles.roomGrid}>
          {selectedFloor.rooms.map((room) => (
            <TouchableOpacity
              key={room.id}
              style={[
                styles.roomChip,
                selectedRoom?.id === room.id && styles.roomChipActive,
              ]}
              onPress={() => setSelectedRoom(room)}
            >
              <Text
                style={[
                  styles.roomChipText,
                  selectedRoom?.id === room.id && styles.roomChipTextActive,
                ]}
              >
                {room.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedRoom && (
          <View style={styles.stepsBox}>
            <Text style={styles.stepsTitle}>{selectedRoom.name} 가는 길</Text>
            {selectedRoom.steps.map((step, idx) => (
              <View key={idx} style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{idx + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backText: { color: "#0b5fff", fontSize: 15, fontWeight: "600" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  floorTabs: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  floorTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f1f3f5",
  },
  floorTabActive: { backgroundColor: "#0b5fff" },
  floorTabText: { color: "#333", fontWeight: "600" },
  floorTabTextActive: { color: "#fff" },
  content: { flex: 1, paddingHorizontal: 16 },
  sectionLabel: { fontSize: 14, color: "#666", marginTop: 8, marginBottom: 8 },
  roomGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roomChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  roomChipActive: { borderColor: "#0b5fff", backgroundColor: "#eaf1ff" },
  roomChipText: { color: "#333", fontWeight: "600" },
  roomChipTextActive: { color: "#0b5fff" },
  stepsBox: {
    marginTop: 20,
    marginBottom: 24,
    backgroundColor: "#f8f9fb",
    borderRadius: 14,
    padding: 16,
  },
  stepsTitle: { fontSize: 15, fontWeight: "700", marginBottom: 12, color: "#111" },
  stepRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#0b5fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 1,
  },
  stepBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  stepText: { flex: 1, fontSize: 14, color: "#333", lineHeight: 20 },
});
