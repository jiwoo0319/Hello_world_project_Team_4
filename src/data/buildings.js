// 캠퍼스 건물 데이터.
// coordinate는 정확한 값이 아니라 인하대학교 캠퍼스 중심 근처의 임시(placeholder) 좌표입니다.
// 정확한 좌표로 바꾸려면: 구글 지도에서 "5호관"을 우클릭 -> 표시되는 위도,경도 숫자를 복사해서
// 아래 latitude / longitude 값을 교체하세요.
export const BUILDINGS = [
  {
    id: "bldg-5",
    name: "5호관",
    description: "인하대학교 5호관",
    coordinate: {
      latitude: 37.4499,
      longitude: 126.6529,
    },
  },
];

export function findBuildingById(id) {
  return BUILDINGS.find((b) => b.id === id);
}
