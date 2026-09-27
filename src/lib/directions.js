// 경로 좌표(점들)를 분석해서 "직진하다가 왼쪽/오른쪽으로 꺾으세요" 같은
// 말로 된 이동 안내 문장을 만든다. 실제 거리 축척이 없어서 미터 단위 대신
// 방향 전환과 관(zone) 진입 시점만 짚어준다.
const TURN_THRESHOLD_DEG = 35;

function bearing(a, b) {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

function normalizeAngle(deg) {
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

function zoneOfLocalId(floor, localId) {
  const room = floor.rooms.find((r) => r.id === localId);
  if (room) return room.zone;
  const entrance = (floor.entrances || []).find((e) => e.id === localId);
  if (entrance) return entrance.zone || null;
  if (localId?.startsWith("virtual-stair-")) return null;
  return null;
}

// segment: { floorId, ids, points } (splitPathByFloor가 만든 형태, ids는 접두어 제거된 원래 id)
// opts: { startText, endText } — 이 구간의 첫/마지막 안내 문장
export function buildStepTexts(segment, floor, { startText, endText }) {
  const { ids, points } = segment;
  const steps = [startText];

  if (points.length < 2) {
    if (endText) steps.push(endText);
    return steps;
  }

  let legBearing = bearing(points[0], points[1]);
  let lastZone = zoneOfLocalId(floor, ids[0]);

  for (let i = 1; i < points.length - 1; i++) {
    const nextBearing = bearing(points[i], points[i + 1]);
    const delta = normalizeAngle(nextBearing - legBearing);

    const zoneHere = zoneOfLocalId(floor, ids[i]);
    if (zoneHere && zoneHere !== lastZone) {
      steps.push(`${zoneHere} 복도로 들어섭니다.`);
      lastZone = zoneHere;
    }

    if (Math.abs(delta) > TURN_THRESHOLD_DEG) {
      steps.push(delta > 0 ? "오른쪽으로 꺾어 이동하세요." : "왼쪽으로 꺾어 이동하세요.");
      legBearing = nextBearing;
    }
  }

  if (endText) steps.push(endText);
  return steps;
}
