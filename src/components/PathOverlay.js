import React from "react";
import { View, StyleSheet } from "react-native";

// FloorPlanView와 같은 좌표계(뷰박스) 위에 경로를 이어진 선분으로 그린다.
// 뷰박스 가로세로 비율과 컨테이너의 aspectRatio가 같기 때문에, 백분율로 폭/높이/회전을
// 표현해도 실제 렌더링 크기와 무관하게 각도와 길이가 일정하게 유지된다.
export default function PathOverlay({ points, viewBoxWidth, viewBoxHeight }) {
  if (!points || points.length < 2) return null;

  const segments = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;

    segments.push(
      <View
        key={i}
        style={[
          styles.segment,
          {
            left: `${(midX / viewBoxWidth) * 100}%`,
            top: `${(midY / viewBoxHeight) * 100}%`,
            width: `${(length / viewBoxWidth) * 100}%`,
            height: `${(8 / viewBoxHeight) * 100}%`,
            transform: [{ translateX: "-50%" }, { translateY: "-50%" }, { rotate: `${angle}deg` }],
          },
        ]}
      />
    );
  }

  const start = points[0];
  const end = points[points.length - 1];

  return (
    <>
      {segments}
      <View
        style={[
          styles.marker,
          styles.startMarker,
          {
            left: `${(start.x / viewBoxWidth) * 100}%`,
            top: `${(start.y / viewBoxHeight) * 100}%`,
          },
        ]}
      />
      <View
        style={[
          styles.marker,
          styles.endMarker,
          {
            left: `${(end.x / viewBoxWidth) * 100}%`,
            top: `${(end.y / viewBoxHeight) * 100}%`,
          },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  segment: {
    position: "absolute",
    backgroundColor: "#0b5fff",
    borderRadius: 4,
    opacity: 0.85,
  },
  marker: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: -9,
    marginTop: -9,
    borderWidth: 3,
    borderColor: "#fff",
  },
  startMarker: { backgroundColor: "#0b5fff" },
  endMarker: { backgroundColor: "#e0332f" },
});
