import React from "react";
import { View, Image, Text, TouchableOpacity, StyleSheet } from "react-native";
import PathOverlay from "./PathOverlay";

// PNG 평면도 위에 SVG에서 뽑아낸 좌표(뷰박스 기준)를 백분율로 환산해
// 투명한 터치 영역을 겹쳐 그립니다. 컨테이너의 aspectRatio를 뷰박스와
// 동일하게 맞추기 때문에 실제 렌더링 크기와 무관하게 위치가 정확히 맞습니다.
export default function FloorPlanView({
  floor,
  selectedRoomId,
  onSelectRoom,
  selectedEntranceId,
  onSelectEntrance,
  path,
}) {
  const { viewBoxWidth, viewBoxHeight, rooms, image, entrances } = floor;

  return (
    <View style={[styles.container, { aspectRatio: viewBoxWidth / viewBoxHeight }]}>
      <Image source={image} style={styles.image} resizeMode="contain" />

      {onSelectRoom &&
        rooms.map((room) => {
          const isSelected = room.id === selectedRoomId;
          return (
            <TouchableOpacity
              key={room.id}
              onPress={() => onSelectRoom(room)}
              style={[
                styles.hotspot,
                {
                  left: `${(room.x / viewBoxWidth) * 100}%`,
                  top: `${(room.y / viewBoxHeight) * 100}%`,
                  width: `${(room.width / viewBoxWidth) * 100}%`,
                  height: `${(room.height / viewBoxHeight) * 100}%`,
                },
                isSelected && styles.hotspotSelected,
              ]}
              activeOpacity={0.6}
            />
          );
        })}

      {path && <PathOverlay points={path} viewBoxWidth={viewBoxWidth} viewBoxHeight={viewBoxHeight} />}

      {onSelectEntrance &&
        (entrances || []).map((entrance) => {
          const isSelected = entrance.id === selectedEntranceId;
          return (
            <TouchableOpacity
              key={entrance.id}
              onPress={() => onSelectEntrance(entrance)}
              style={[
                styles.entrance,
                {
                  left: `${(entrance.x / viewBoxWidth) * 100}%`,
                  top: `${(entrance.y / viewBoxHeight) * 100}%`,
                },
                isSelected && styles.entranceSelected,
              ]}
              activeOpacity={0.7}
            >
              <Text style={styles.entranceText}>{isSelected ? "출발" : "문"}</Text>
            </TouchableOpacity>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#fff",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  hotspot: {
    position: "absolute",
  },
  hotspotSelected: {
    backgroundColor: "rgba(11, 95, 255, 0.35)",
    borderWidth: 2,
    borderColor: "#0b5fff",
  },
  entrance: {
    position: "absolute",
    width: 30,
    height: 30,
    marginLeft: -15,
    marginTop: -15,
    borderRadius: 15,
    backgroundColor: "#ffb020",
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  entranceSelected: {
    backgroundColor: "#0b5fff",
  },
  entranceText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
});
