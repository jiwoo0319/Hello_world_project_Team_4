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
    floors: [
      {
        id: "f1",
        label: "1층",
        rooms: [
          {
            id: "101",
            name: "101호",
            steps: [
              "정문으로 들어가 바로 앞 로비를 지나세요.",
              "로비 왼쪽 복도로 이동하세요.",
              "복도 중간 오른쪽 101호가 목적지입니다.",
            ],
          },
          {
            id: "lounge1",
            name: "1층 라운지",
            steps: [
              "정문으로 들어가면 정면에 라운지가 보입니다.",
              "라운지는 로비 정면 바로 앞에 있습니다.",
            ],
          },
        ],
      },
      {
        id: "f5",
        label: "5층",
        rooms: [
          {
            id: "504",
            name: "504호 강의실",
            steps: [
              "1층 로비의 엘리베이터 또는 계단으로 5층까지 이동하세요.",
              "5층에 도착하면 오른쪽 복도로 이동하세요.",
              "복도 끝에서 두 번째 문이 504호입니다.",
            ],
          },
          {
            id: "seminar5",
            name: "세미나실",
            steps: [
              "1층 로비에서 엘리베이터를 타고 5층으로 이동하세요.",
              "5층에서 왼쪽 복도로 이동하세요.",
              "복도 초입 첫 번째 문이 세미나실입니다.",
            ],
          },
        ],
      },
    ],
  },
];

export function findBuildingById(id) {
  return BUILDINGS.find((b) => b.id === id);
}
