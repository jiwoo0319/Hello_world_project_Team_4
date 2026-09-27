import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
} from "react-native";
import FloorPlanView from "../components/FloorPlanView";
import { FLOORS } from "../data/floorplans";
import { buildFloorGraph, shortestPath } from "../lib/indoorPath";

export default function IndoorScreen({ onBack }) {
  const [selectedFloor, setSelectedFloor] = useState(FLOORS[1]); // 기본값: 1층
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedEntrance, setSelectedEntrance] = useState(null);
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return selectedFloor.rooms
      .filter((r) => r.number.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, selectedFloor]);

  const route = useMemo(() => {
    if (!selectedRoom || !selectedEntrance) return null;
    const graph = buildFloorGraph(selectedFloor);
    return shortestPath(graph, selectedEntrance.id, selectedRoom.id);
  }, [selectedFloor, selectedRoom, selectedEntrance]);

  const selectFloor = (floor) => {
    setSelectedFloor(floor);
    setSelectedRoom(null);
    setSelectedEntrance(null);
    setQuery("");
  };

  const selectRoom = (room) => {
    setSelectedRoom(room);
    setQuery("");
  };

  const selectEntrance = (entrance) => {
    setSelectedEntrance((prev) => (prev?.id === entrance.id ? null : entrance));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>← 지도로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>5호관 내부 안내</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.floorTabs}>
        {FLOORS.map((floor) => (
          <TouchableOpacity
            key={floor.id}
            style={[
              styles.floorTab,
              selectedFloor.id === floor.id && styles.floorTabActive,
            ]}
            onPress={() => selectFloor(floor)}
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

      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="호실 번호로 검색 (예: 417A)"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="characters"
        />
        {matches.length > 0 && (
          <FlatList
            style={styles.searchResults}
            data={matches}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchResultRow}
                onPress={() => selectRoom(item)}
              >
                <Text style={styles.searchResultText}>
                  {item.zone} {item.number}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      <ScrollView
        style={styles.mapScroll}
        maximumZoomScale={4}
        minimumZoomScale={1}
        pinchGestureEnabled
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        <FloorPlanView
          floor={selectedFloor}
          selectedRoomId={selectedRoom?.id}
          onSelectRoom={selectRoom}
          selectedEntranceId={selectedEntrance?.id}
          onSelectEntrance={selectedRoom ? selectEntrance : undefined}
          path={route?.points}
        />
      </ScrollView>

      {selectedRoom && !selectedEntrance && (
        <View style={styles.hintBar}>
          <Text style={styles.hintText}>
            도면 위 노란 점(문) 중 출발할 출입문을 눌러주세요
          </Text>
        </View>
      )}

      {selectedRoom && (
        <View style={styles.infoPanel}>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoZone}>{selectedRoom.zone}</Text>
            <Text style={styles.infoNumber}>{selectedRoom.label}호</Text>
            {selectedEntrance && (
              <Text style={styles.infoRoute}>
                {selectedEntrance.label}에서 출발
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => {
              setSelectedRoom(null);
              setSelectedEntrance(null);
            }}
          >
            <Text style={styles.infoClose}>닫기</Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#f1f3f5",
  },
  floorTabActive: { backgroundColor: "#0b5fff" },
  floorTabText: { color: "#333", fontWeight: "600" },
  floorTabTextActive: { color: "#fff" },
  searchBox: {
    paddingHorizontal: 16,
    marginBottom: 4,
    zIndex: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  searchResults: {
    position: "absolute",
    top: 44,
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    maxHeight: 220,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  searchResultRow: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",
  },
  searchResultText: { fontSize: 14, color: "#222" },
  mapScroll: { flex: 1, backgroundColor: "#f3f5f1" },
  infoPanel: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  infoZone: { fontSize: 13, color: "#666" },
  infoNumber: { fontSize: 20, fontWeight: "800", color: "#0b5fff", marginTop: 2 },
  infoRoute: { fontSize: 13, color: "#e0332f", marginTop: 4, fontWeight: "600" },
  infoClose: { color: "#0b5fff", fontWeight: "600", fontSize: 14 },
  hintBar: {
    backgroundColor: "#fff8e6",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0e0a0",
  },
  hintText: { fontSize: 13, color: "#8a6d1a", textAlign: "center" },
});
