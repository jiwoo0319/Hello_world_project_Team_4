// 층 평면도 데이터(방 좌표)만으로 복도 그래프를 만들고 최단경로(다익스트라)를 구한다.
// 같은 관(zone) 안에서는 "물리적으로 가까운 방"끼리 연결하고(배열 순서로 이으면
// 복도 양쪽 면을 바로 못 건너가고 한 바퀴 돌아야 하는 경로가 나온다), 관과 관 사이는
// 가장 가까운 방 쌍끼리 이어서 층 전체를 연결한다. 여러 층에 걸친 경로는 각 층에
// "계단" 노드를 두고 위아래 층의 계단 노드끼리 이어서 하나의 그래프로 합친다.
export const FLOOR_ORDER = ["b1", "1f", "2f", "3f", "4f"];

// 1층 도면의 EXIT는 건물 밖으로 나가는 실제 출입문(entrance.type === "door")이고,
// 그 외 층의 EXIT는 다른 층으로 이동하는 계단(entrance.type === "stair")이다.
// 1층 자체에는 EXIT로 표시된 계단이 없지만(지상층 표시는 옥외 출입문만 따로 그려짐)
// 실제로는 지하1층·2층과 같은 자리에 계단이 있으므로, 인접 층의 계단 위치를
// 그대로 가져와 1층에도 가상 계단 노드로 심어 위아래 층과 연결한다.
const FLOOR_TRANSITION_COST = 500; // 한 층 오르내리는 데 드는 가상 거리
const STAIR_MERGE_RADIUS = 80; // 이 거리 안이면 위/아래 층에서 온 같은 계단으로 간주

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// 건물은 가운데 안뜰(중정)을 감싸는 ㅁ자 형태라, 북/동/남/서 네 관이 이 순서로
// 고리 모양으로 붙어 있다. 1층은 안뜰이 바깥 지상으로 뚫려 있어 가로질러 갈 수
// 있지만, 다른 층은 안뜰 위에 바닥이 없어(중정) 마주보는 관끼리 직선으로 못 가고
// 옆 관을 거쳐 돌아가야 한다. 그래서 인접한 관끼리만 최단 경로로 잇는다.
const ZONE_RING_ORDER = ["5북관", "5동관", "5남관", "5서관"];

// 각 관은 실제로 복도 하나를 사이에 두고 방이 두 줄(또는 두 열)로 늘어선 형태다.
// 방 중심점끼리 바로 이으면 선이 옆방을 가로질러 지나가 버리므로, 대신 그 관의
// "복도 중심선" 위로 투영한 점(도킹 포인트)끼리 잇는다. 북/남관은 복도가 가로로
// 길어서 y좌표를 중심선에 맞추고, 동/서관은 복도가 세로로 길어서 x좌표를 맞춘다.
const ZONE_ORIENTATION = {
  "5북관": "horizontal",
  "5남관": "horizontal",
  "5동관": "vertical",
  "5서관": "vertical",
};

function guessOrientation(rooms) {
  const xs = rooms.map((r) => r.x + r.width / 2);
  const ys = rooms.map((r) => r.y + r.height / 2);
  const xSpread = Math.max(...xs) - Math.min(...xs);
  const ySpread = Math.max(...ys) - Math.min(...ys);
  return xSpread >= ySpread ? "horizontal" : "vertical";
}

function computeZoneCorridor(rooms) {
  const orientation = ZONE_ORIENTATION[rooms[0]?.zone] || guessOrientation(rooms);
  if (orientation === "horizontal") {
    const centersY = rooms.map((r) => r.y + r.height / 2);
    return { orientation, value: (Math.min(...centersY) + Math.max(...centersY)) / 2 };
  }
  const centersX = rooms.map((r) => r.x + r.width / 2);
  return { orientation, value: (Math.min(...centersX) + Math.max(...centersX)) / 2 };
}

function dockPoint(room, corridor) {
  const cx = room.x + room.width / 2;
  const cy = room.y + room.height / 2;
  if (!corridor) return { x: cx, y: cy };
  return corridor.orientation === "horizontal" ? { x: cx, y: corridor.value } : { x: corridor.value, y: cy };
}

function adjacentZonePairs(zoneNames) {
  const present = ZONE_RING_ORDER.filter((z) => zoneNames.includes(z));
  const pairs = new Set();
  const isClosedRing = present.length === ZONE_RING_ORDER.length; // 네 관이 다 있어야 고리가 닫힌다
  for (let i = 0; i < present.length; i++) {
    const j = i + 1;
    if (j >= present.length) {
      if (!isClosedRing) continue; // 관이 하나라도 빠지면(B1처럼) 끝과 끝은 안 이어짐
      pairs.add(`${present[i]}|${present[0]}`);
      pairs.add(`${present[0]}|${present[i]}`);
    } else {
      pairs.add(`${present[i]}|${present[j]}`);
      pairs.add(`${present[j]}|${present[i]}`);
    }
  }
  return pairs;
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

  // 관별로 복도 중심선을 먼저 계산해서, 방 중심이 아니라 그 중심선 위의
  // 도킹 포인트를 그래프 좌표로 쓴다.
  const zoneRoomLists = new Map();
  for (const room of floor.rooms) {
    if (!zoneRoomLists.has(room.zone)) zoneRoomLists.set(room.zone, []);
    zoneRoomLists.get(room.zone).push(room);
  }
  const zoneCorridors = new Map();
  for (const [zone, rooms] of zoneRoomLists) zoneCorridors.set(zone, computeZoneCorridor(rooms));

  const roomNodeId = new Map(); // room.id -> graph id
  for (const room of floor.rooms) {
    const p = dockPoint(room, zoneCorridors.get(room.zone));
    roomNodeId.set(room.id, addNode(room.id, p.x, p.y));
  }

  const K_NEAREST = 3;
  const zoneGroups = new Map();
  for (const [zone, rooms] of zoneRoomLists) {
    zoneGroups.set(zone, rooms.map((r) => r.id));
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

  // 관과 관 사이는 가장 가까운 방 쌍끼리 이어서 연결한다. 1층은 안뜰을 가로질러
  // 갈 수 있으니 모든 관 쌍을 잇고, 그 외 층은 실제로 붙어 있는(인접한) 관끼리만 잇는다.
  const zoneNames = [...zoneGroups.keys()];
  const allowedPairs = floor.id === "1f" ? null : adjacentZonePairs(zoneNames);
  for (let i = 0; i < zoneNames.length; i++) {
    for (let j = i + 1; j < zoneNames.length; j++) {
      if (allowedPairs && !allowedPairs.has(`${zoneNames[i]}|${zoneNames[j]}`)) continue;
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

  return { roomNodeId, addNode, addEdge };
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
  const floorSub = {};
  const floorStairs = {}; // floorId -> [{id, x, y}]

  for (const floor of floors) {
    const prefix = `${floor.id}::`;
    floorSub[floor.id] = addFloorSubgraph(nodes, adj, floor, prefix);
    floorStairs[floor.id] = (floor.entrances || [])
      .filter((e) => e.type === "stair")
      .map((e) => ({ id: prefix + e.id, x: e.x, y: e.y }));
  }

  // 1층에는 EXIT로 표시된 계단이 없으므로, 위아래 층(지하1층·2층)의 계단 위치를
  // 그대로 가져와 1층 그래프에도 가상 계단 노드로 추가한다.
  const groundFloor = floors.find((f) => f.id === "1f");
  if (groundFloor && (floorStairs["1f"] || []).length === 0) {
    const prefix = "1f::";
    const { addNode, addEdge, roomNodeId } = floorSub["1f"];
    const neighborStairs = [...(floorStairs["b1"] || []), ...(floorStairs["2f"] || [])];
    const merged = [];
    for (const s of neighborStairs) {
      if (!merged.some((m) => dist(m, s) < STAIR_MERGE_RADIUS)) merged.push(s);
    }
    const virtualStairs = merged.map((s, i) => {
      const id = addNode(`virtual-stair-${i}`, s.x, s.y);
      let bestGid = null;
      let bestW = Infinity;
      for (const room of groundFloor.rooms) {
        const gid = roomNodeId.get(room.id);
        const w = dist(nodes.get(id), nodes.get(gid));
        if (w < bestW) {
          bestW = w;
          bestGid = gid;
        }
      }
      if (bestGid) addEdge(id, bestGid);
      return { id, x: s.x, y: s.y };
    });
    floorStairs["1f"] = virtualStairs;
  }

  // 인접한 두 층의 계단끼리, 가장 가까운 위치를 찾아 연결한다.
  for (let i = 0; i < floors.length - 1; i++) {
    const upperStairs = floorStairs[floors[i].id] || [];
    const lowerStairs = floorStairs[floors[i + 1].id] || [];
    for (const a of upperStairs) {
      let best = null;
      let bestW = Infinity;
      for (const b of lowerStairs) {
        const w = dist(a, b);
        if (w < bestW) {
          bestW = w;
          best = b;
        }
      }
      if (best) {
        adj.get(a.id).push({ to: best.id, w: bestW + FLOOR_TRANSITION_COST });
        adj.get(best.id).push({ to: a.id, w: bestW + FLOOR_TRANSITION_COST });
      }
    }
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
    const [floorId, ...rest] = result.ids[i].split("::");
    const localId = rest.join("::");
    const point = result.points[i];
    if (!current || current.floorId !== floorId) {
      if (current) segments.push(current);
      current = { floorId, points: [], ids: [] };
    }
    current.ids.push(localId);
    current.points.push(point);
  }
  if (current) segments.push(current);
  return segments;
}
