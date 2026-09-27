import React from "react";
import { View, Image, TouchableOpacity, StyleSheet } from "react-native";

// PNG 평면도 위에 SVG에서 뽑아낸 좌표(뷰박스 기준)를 백분율로 환산해
// 투명한 터치 영역을 겹쳐 그립니다. 컨테이너의 aspectRatio를 뷰박스와
// 동일하게 맞추기 때문에 실제 렌더링 크기와 무관하게 위치가 정확히 맞습니다.
export default function FloorPlanView({ floor, selectedRoomId, onSelectRoom }) {
  const { viewBoxWidth, viewBoxHeight, rooms, image } = floor;

  return (
    <View style={[styles.container, { aspectRatio: viewBoxWidth / viewBoxHeight }]}>
      <Image source={image} style={styles.image} resizeMode="contain" />
      {rooms.map((room) => {
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
});
