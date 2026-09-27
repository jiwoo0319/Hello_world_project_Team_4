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
import {
  buildMultiFloorGraph,
  shortestPath,
  splitPathByFloor,
  floorEntranceNodeId,
  floorRoomNodeId,
  FLOOR_ORDER,
} from "../lib/indoorPath";
import { buildStepTexts } from "../lib/directions";

const PHASE_START = "start"; // 출발 출입문 선택
const PHASE_DEST = "dest"; // 목적지 방 선택
const PHASE_ROUTE = "route"; // 경로 보기

export default function IndoorScreen({ onBack }) {
  const [phase, setPhase] = useState(PHASE_START);
  const [browseFloor, setBrowseFloor] = useState(FLOORS[1]); // 지금 고르는 중인 층 (기본 1층)
  const [startFloorId, setStartFloorId] = useState(null);
  const [startEntrance, setStartEntrance] = useState(null);
  const [destFloorId, setDestFloorId] = useState(null);
  const [destRoom, setDestRoom] = useState(null);
  const [routeStep, setRouteStep] = useState(0);
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    if (phase !== PHASE_DEST || !query.trim()) return [];
    const q = query.trim().toLowerCase();
    return browseFloor.rooms
      .filter((r) => r.number.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, browseFloor, phase]);

  const route = useMemo(() => {
    if (phase !== PHASE_ROUTE || !startFloorId || !startEntrance || !destFloorId || !destRoom) {
      return null;
    }
    const graph = buildMultiFloorGraph(FLOORS);
    const startId = floorEntranceNodeId(startFloorId, startEntrance.id);
    const endId = floorRoomNodeId(destFloorId, destRoom.id);
    const result = shortestPath(graph, startId, endId);
    if (!result) return null;
    return { segments: splitPathByFloor(result) };
  }, [phase, startFloorId, startEntrance, destFloorId, destRoom]);

  const selectBrowseFloor = (floor) => {
    setBrowseFloor(floor);
    setQuery("");
  };

  const pickEntrance = (entrance) => {
    setStartFloorId(browseFloor.id);
    setStartEntrance(entrance);
    setPhase(PHASE_DEST);
    setQuery("");
  };

  const pickRoom = (room) => {
    setDestFloorId(browseFloor.id);
    setDestRoom(room);
    setQuery("");
    setRouteStep(0);
    setPhase(PHASE_ROUTE);
  };

  const reset = () => {
    setPhase(PHASE_START);
    setStartFloorId(null);
    setStartEntrance(null);
    setDestFloorId(null);
    setDestRoom(null);
    setRouteStep(0);
    setBrowseFloor(FLOORS[1]);
    setQuery("");
  };

  const segments = route?.segments || [];
  const currentSegment = segments[routeStep];
  const currentSegmentFloor = currentSegment
    ? FLOORS.find((f) => f.id === currentSegment.floorId)
    : null;

  const stepTexts = useMemo(() => {
    if (!currentSegment || !currentSegmentFloor) return [];

    const isFirst = routeStep === 0;
    const isLast = routeStep === segments.length - 1;

    let startText;
    if (isFirst) {
      startText = `${startEntrance?.label}에서 출발합니다.`;
    } else {
      const prevIdx = FLOOR_ORDER.indexOf(segments[routeStep - 1].floorId);
      const curIdx = FLOOR_ORDER.indexOf(currentSegment.floorId);
      const dir = curIdx > prevIdx ? "올라와" : "내려와";
      startText = `계단으로 ${dir} ${currentSegmentFloor.label}에 도착했습니다.`;
    }

    let endText;
    if (isLast) {
      endText = `${destRoom?.zone} ${destRoom?.label}호에 도착합니다.`;
    } else {
      const nextIdx = FLOOR_ORDER.indexOf(segments[routeStep + 1].floorId);
      const curIdx = FLOOR_ORDER.indexOf(currentSegment.floorId);
      const nextFloorLabel = FLOORS.find((f) => f.id === segments[routeStep + 1].floorId)?.label;
      const dir = nextIdx > curIdx ? "올라가세요" : "내려가세요";
      endText = `계단을 이용해 ${nextFloorLabel}(으)로 ${dir}.`;
    }

    return buildStepTexts(currentSegment, currentSegmentFloor, { startText, endText });
  }, [currentSegment, currentSegmentFloor, routeStep, segments, startEntrance, destRoom]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>← 지도로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>5호관 내부 안내</Text>
        {phase !== PHASE_START ? (
          <TouchableOpacity onPress={reset}>
            <Text style={styles.resetText}>처음부터</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {phase === PHASE_START && (
        <View style={styles.stepBanner}>
          <Text style={styles.stepBannerText}>
            1단계 · 출발 위치를 선택하세요 (주황: 건물 출입문, 회색: 계단)
          </Text>
        </View>
      )}
      {phase === PHASE_DEST && (
        <View style={styles.stepBanner}>
          <Text style={styles.stepBannerText}>
            2단계 · {startEntrance?.label} ({FLOORS.find((f) => f.id === startFloorId)?.label})에서 출발 ·
            목적지 방을 선택하세요
          </Text>
        </View>
      )}

      {phase !== PHASE_ROUTE && (
        <>
          <View style={styles.floorTabs}>
            {FLOORS.map((floor) => (
              <TouchableOpacity
                key={floor.id}
                style={[
                  styles.floorTab,
                  browseFloor.id === floor.id && styles.floorTabActive,
                ]}
                onPress={() => selectBrowseFloor(floor)}
              >
                <Text
                  style={[
                    styles.floorTabText,
                    browseFloor.id === floor.id && styles.floorTabTextActive,
                  ]}
                >
                  {floor.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {phase === PHASE_DEST && (
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
                      onPress={() => pickRoom(item)}
                    >
                      <Text style={styles.searchResultText}>
                        {item.zone} {item.number}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          )}

          <ScrollView
            style={styles.mapScroll}
            maximumZoomScale={4}
            minimumZoomScale={1}
            pinchGestureEnabled
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            <FloorPlanView
              floor={browseFloor}
              onSelectRoom={phase === PHASE_DEST ? pickRoom : undefined}
              onSelectEntrance={phase === PHASE_START ? pickEntrance : undefined}
            />
          </ScrollView>
        </>
      )}

      {phase === PHASE_ROUTE && (
        <>
          <ScrollView
            style={styles.mapScroll}
            maximumZoomScale={4}
            minimumZoomScale={1}
            pinchGestureEnabled
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            {currentSegmentFloor && (
              <FloorPlanView
                floor={currentSegmentFloor}
                path={currentSegment.points.length > 1 ? currentSegment.points : null}
              />
            )}
          </ScrollView>

          <View style={styles.routeBar}>
            {!route ? (
              <Text style={styles.routeErrorText}>경로를 찾지 못했습니다.</Text>
            ) : (
              <>
                <Text style={styles.routeStepLabel}>
                  {routeStep + 1} / {segments.length} 구간 · {currentSegmentFloor?.label}
                </Text>
                <ScrollView style={styles.stepList} nestedScrollEnabled>
                  {stepTexts.map((text, i) => (
                    <View key={i} style={styles.stepRow}>
                      <View style={styles.stepBadge}>
                        <Text style={styles.stepBadgeText}>{i + 1}</Text>
                      </View>
                      <Text style={styles.stepText}>{text}</Text>
                    </View>
                  ))}
                </ScrollView>
                <View style={styles.routeNavRow}>
                  <TouchableOpacity
                    style={[styles.routeNavButton, routeStep === 0 && styles.routeNavButtonDisabled]}
                    onPress={() => setRouteStep((s) => Math.max(0, s - 1))}
                    disabled={routeStep === 0}
                  >
                    <Text style={styles.routeNavButtonText}>이전 구간</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.routeNavButton,
                      routeStep >= segments.length - 1 && styles.routeNavButtonDisabled,
                    ]}
                    onPress={() => setRouteStep((s) => Math.min(segments.length - 1, s + 1))}
                    disabled={routeStep >= segments.length - 1}
                  >
                    <Text style={styles.routeNavButtonText}>다음 구간</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            <View style={styles.redoRow}>
              <TouchableOpacity style={styles.redoButton} onPress={() => setPhase(PHASE_DEST)}>
                <Text style={styles.redoButtonText}>목적지만 다시 선택</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.redoButton} onPress={reset}>
                <Text style={styles.redoButtonText}>출발지부터 다시 선택</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
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
  resetText: { color: "#e0332f", fontSize: 13, fontWeight: "600" },
  stepBanner: {
    backgroundColor: "#eaf1ff",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  stepBannerText: { fontSize: 13, color: "#0b5fff", fontWeight: "600" },
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
  routeBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  routeErrorText: { color: "#e0332f", fontWeight: "600" },
  routeStepLabel: { fontSize: 13, color: "#666" },
  stepList: { maxHeight: 160, marginTop: 6 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  stepBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#0b5fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginTop: 1,
  },
  stepBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  stepText: { flex: 1, fontSize: 14, color: "#222", lineHeight: 20, fontWeight: "600" },
  routeNavRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  routeNavButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#0b5fff",
    alignItems: "center",
  },
  routeNavButtonDisabled: { backgroundColor: "#c7d6f5" },
  routeNavButtonText: { color: "#fff", fontWeight: "700" },
  redoRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  redoButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f1f3f5",
    alignItems: "center",
  },
  redoButtonText: { color: "#e0332f", fontWeight: "700", fontSize: 13 },
});
