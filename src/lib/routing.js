// OSRM(오픈소스 라우팅 엔진)의 공개 데모 서버를 이용해 도보 경로를 계산합니다.
// 실서비스로 전환할 때는 자체 호스팅 OSRM 서버나 Mapbox Directions API로 교체하는 것을 권장합니다.
const OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/foot";

export async function fetchWalkingRoute(origin, destination) {
  const url = `${OSRM_BASE_URL}/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`경로 요청 실패: ${response.status}`);
  }

  const data = await response.json();
  if (!data.routes || data.routes.length === 0) {
    throw new Error("경로를 찾을 수 없습니다.");
  }

  const route = data.routes[0];
  const coordinates = route.geometry.coordinates.map(([longitude, latitude]) => ({
    latitude,
    longitude,
  }));

  return {
    coordinates,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
  };
}
