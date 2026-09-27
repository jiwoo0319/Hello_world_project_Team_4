// 층 평면도 데이터(방 좌표)만으로 복도 그래프를 만들고 최단경로(다익스트라)를 구한다.
// 실제 복도 벡터 데이터가 없어서, 같은 관(zone) 안에서는 방 배열 순서를 복도 순서로 보고
// 인접한 방끼리 연결하고, 서로 다른 관은 가장 가까운 방 쌍끼리 이어서 전체를 연결한다.
function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function buildFloorGraph(floor) {
  const nodes = new Map(); // id -> {x, y}
  const adj = new Map(); // id -> [{to, w}]

  const addNode = (id, x, y) => {
    if (!nodes.has(id)) {
      nodes.set(id, { x, y });
      adj.set(id, []);
    }
  };
  const addEdge = (a, b) => {
    if (a === b) return;
    if (adj.get(a).some((e) => e.to === b)) return;
    const w = dist(nodes.get(a), nodes.get(b));
    adj.get(a).push({ to: b, w });
    adj.get(b).push({ to: a, w });
  };

  for (const room of floor.rooms) {
    addNode(room.id, room.x + room.width / 2, room.y + room.height / 2);
  }

  // 같은 관 안에서는 배열 순서가 아니라 "물리적으로 가까운 방"끼리 연결한다.
  // (배열 순서로만 이으면 복도 양쪽 면이 서로 다른 줄로 저장돼 있을 때
  //  건너편으로 바로 못 가고 한 바퀴를 다 돌아야 하는 경로가 나온다.)
  const K_NEAREST = 3;
  const zoneGroups = new Map();
  for (const room of floor.rooms) {
    if (!zoneGroups.has(room.zone)) zoneGroups.set(room.zone, []);
    zoneGroups.get(room.zone).push(room.id);
  }
  for (const ids of zoneGroups.values()) {
    for (const id of ids) {
      const neighbors = ids
        .filter((otherId) => otherId !== id)
        .map((otherId) => ({ otherId, w: dist(nodes.get(id), nodes.get(otherId)) }))
        .sort((a, b) => a.w - b.w)
        .slice(0, K_NEAREST);
      for (const { otherId } of neighbors) {
        addEdge(id, otherId);
      }
    }
  }

  // 서로 다른 관은 가장 가까운 방 쌍끼리 이어서 전체 그래프를 연결
  const zoneNames = [...zoneGroups.keys()];
  for (let i = 0; i < zoneNames.length; i++) {
    for (let j = i + 1; j < zoneNames.length; j++) {
      let best = null;
      for (const a of zoneGroups.get(zoneNames[i])) {
        for (const b of zoneGroups.get(zoneNames[j])) {
          const w = dist(nodes.get(a), nodes.get(b));
          if (!best || w < best.w) best = { a, b, w };
        }
      }
      if (best) addEdge(best.a, best.b);
    }
  }

  // 출입문 노드: 가장 가까운 방과 연결
  for (const entrance of floor.entrances || []) {
    addNode(entrance.id, entrance.x, entrance.y);
    let bestId = null;
    let bestW = Infinity;
    for (const room of floor.rooms) {
      const w = dist(nodes.get(entrance.id), nodes.get(room.id));
      if (w < bestW) {
        bestW = w;
        bestId = room.id;
      }
    }
    if (bestId) addEdge(entrance.id, bestId);
  }

  return { nodes, adj };
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
