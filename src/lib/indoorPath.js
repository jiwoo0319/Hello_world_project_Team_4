// 층 평면도 데이터(방 좌표)만으로 복도 그래프를 만들고 최단경로(다익스트라)를 구한다.
// 같은 관(zone) 안에서는 "물리적으로 가까운 방"끼리 연결하고(배열 순서로 이으면
// 복도 양쪽 면을 바로 못 건너가고 한 바퀴 돌아야 하는 경로가 나온다), 관과 관 사이는
// 가장 가까운 방 쌍끼리 이어서 층 전체를 연결한다. 여러 층에 걸친 경로는 각 층에
// "계단" 노드를 두고 위아래 층의 계단 노드끼리 이어서 하나의 그래프로 합친다.
export const FLOOR_ORDER = ["b1", "1f", "2f", "3f", "4f"];

// 실제 계단 좌표 데이터가 없어서, 2층 도면에서 확인한 중앙계단 위치를 모든 층에
// 공통으로 사용한다(모든 층이 같은 뷰박스를 쓰고 있어 근사치로 적용 가능).
const STAIR_POINT = { x: 1300, y: 1030 };
const FLOOR_TRANSITION_COST = 500; // 한 층 오르내리는 데 드는 가상 거리

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function addFloorSubgraph(nodes, adj, floor, prefix) {
  const addNode = (localId, x, y) => {
    const id = prefix + localId;
    if (!nodes.has(id)) {
      nodes.set(id, { x, y });
      adj.set(id, []);
    }
    return id;
  };
  const addEdge = (a, b) => {
    if (a === b) return;
    if (adj.get(a).some((e) => e.to === b)) return;
    const w = dist(nodes.get(a), nodes.get(b));
    adj.get(a).push({ to: b, w });
    adj.get(b).push({ to: a, w });
  };

  const roomNodeId = new Map(); // room.id -> graph id
  for (const room of floor.rooms) {
    roomNodeId.set(room.id, addNode(room.id, room.x + room.width / 2, room.y + room.height / 2));
  }

  const K_NEAREST = 3;
  const zoneGroups = new Map();
  for (const room of floor.rooms) {
    if (!zoneGroups.has(room.zone)) zoneGroups.set(room.zone, []);
    zoneGroups.get(room.zone).push(room.id);
  }
  for (const ids of zoneGroups.values()) {
    for (const id of ids) {
      const gid = roomNodeId.get(id);
      const neighbors = ids
        .filter((otherId) => otherId !== id)
        .map((otherId) => ({ gid: roomNodeId.get(otherId), w: dist(nodes.get(gid), nodes.get(roomNodeId.get(otherId))) }))
        .sort((a, b) => a.w - b.w)
        .slice(0, K_NEAREST);
      for (const { gid: otherGid } of neighbors) addEdge(gid, otherGid);
    }
  }

  // 관과 관 사이는 가장 가까운 방 쌍끼리 이어서 전체를 연결
  const zoneNames = [...zoneGroups.keys()];
  for (let i = 0; i < zoneNames.length; i++) {
    for (let j = i + 1; j < zoneNames.length; j++) {
      let best = null;
      for (const a of zoneGroups.get(zoneNames[i])) {
        for (const b of zoneGroups.get(zoneNames[j])) {
          const ga = roomNodeId.get(a);
          const gb = roomNodeId.get(b);
          const w = dist(nodes.get(ga), nodes.get(gb));
          if (!best || w < best.w) best = { a: ga, b: gb, w };
        }
      }
      if (best) addEdge(best.a, best.b);
    }
  }

  // 출입문 노드: 가장 가까운 방과 연결
  for (const entrance of floor.entrances || []) {
    const eid = addNode(entrance.id, entrance.x, entrance.y);
    let bestId = null;
    let bestW = Infinity;
    for (const room of floor.rooms) {
      const gid = roomNodeId.get(room.id);
      const w = dist(nodes.get(eid), nodes.get(gid));
      if (w < bestW) {
        bestW = w;
        bestId = gid;
      }
    }
    if (bestId) addEdge(eid, bestId);
  }

  // 계단 노드: 가장 가까운 방 2개와 연결(층간 이동의 출발/도착점)
  const stairId = addNode("__stairs__", STAIR_POINT.x, STAIR_POINT.y);
  const nearestRooms = floor.rooms
    .map((room) => ({ gid: roomNodeId.get(room.id), w: dist(STAIR_POINT, nodes.get(roomNodeId.get(room.id))) }))
    .sort((a, b) => a.w - b.w)
    .slice(0, 2);
  for (const { gid } of nearestRooms) addEdge(stairId, gid);

  return { roomNodeId, entranceNodeId: (id) => prefix + id, stairId };
}

export function buildFloorGraph(floor) {
  const nodes = new Map();
  const adj = new Map();
  addFloorSubgraph(nodes, adj, floor, "");
  return { nodes, adj };
}

// floors: FLOOR_ORDER 순서(지하1층 -> 4층)에 맞춘 floor 객체 배열.
// 반환되는 그래프의 노드 id는 "{floorId}::{원래id}" 형태이다.
export function buildMultiFloorGraph(floors) {
  const nodes = new Map();
  const adj = new Map();
  const stairIds = {};

  for (const floor of floors) {
    const prefix = `${floor.id}::`;
    const { stairId } = addFloorSubgraph(nodes, adj, floor, prefix);
    stairIds[floor.id] = stairId;
  }

  const addEdge = (a, b, w) => {
    adj.get(a).push({ to: b, w });
    adj.get(b).push({ to: a, w });
  };
  for (let i = 0; i < floors.length - 1; i++) {
    const a = stairIds[floors[i].id];
    const b = stairIds[floors[i + 1].id];
    if (a && b) addEdge(a, b, FLOOR_TRANSITION_COST);
  }

  return { nodes, adj };
}

export function floorEntranceNodeId(floorId, entranceId) {
  return `${floorId}::${entranceId}`;
}

export function floorRoomNodeId(floorId, roomId) {
  return `${floorId}::${roomId}`;
}

export function shortestPath(graph, startId, endId) {
  const { nodes, adj } = graph;
  if (!nodes.has(startId) || !nodes.has(endId)) return null;

  const distMap = new Map();
  const prev = new Map();
  const visited = new Set();
  for (const id of nodes.keys()) distMap.set(id, Infinity);
  distMap.set(startId, 0);

  while (visited.size < nodes.size) {
    let current = null;
    let currentDist = Infinity;
    for (const [id, d] of distMap) {
      if (!visited.has(id) && d < currentDist) {
        current = id;
        currentDist = d;
      }
    }
    if (current === null) break;
    if (current === endId) break;
    visited.add(current);

    for (const { to, w } of adj.get(current) || []) {
      const alt = currentDist + w;
      if (alt < distMap.get(to)) {
        distMap.set(to, alt);
        prev.set(to, current);
      }
    }
  }

  if (distMap.get(endId) === Infinity) return null;

  const path = [endId];
  let cur = endId;
  while (cur !== startId) {
    cur = prev.get(cur);
    if (cur === undefined) return null;
    path.push(cur);
  }
  path.reverse();

  return {
    ids: path,
    points: path.map((id) => nodes.get(id)),
    distance: distMap.get(endId),
  };
}

// 여러 층에 걸친 경로(ids가 "{floorId}::{...}" 형태)를 층별 구간으로 쪼갠다.
export function splitPathByFloor(result) {
  if (!result) return [];
  const segments = [];
  let current = null;
  for (let i = 0; i < result.ids.length; i++) {
    const [floorId] = result.ids[i].split("::");
    const point = result.points[i];
    if (!current || current.floorId !== floorId) {
      if (current) segments.push(current);
      current = { floorId, points: [] };
    }
    current.points.push(point);
  }
  if (current) segments.push(current);
  return segments;
}
