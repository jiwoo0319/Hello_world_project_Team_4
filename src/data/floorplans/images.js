// Metro 번들러는 동적 require를 지원하지 않아 각 층 이미지를 정적으로 매핑합니다.
export const FLOOR_IMAGES = {
  b1: require("../../assets/floorplans/5호관_B1.png"),
  "1f": require("../../assets/floorplans/5호관_1F.png"),
  "2f": require("../../assets/floorplans/5호관_2F.png"),
  "3f": require("../../assets/floorplans/5호관_3F.png"),
  "4f": require("../../assets/floorplans/5호관_4F.png"),
};
