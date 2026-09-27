// 각 층 도면 이미지에서 EXIT 배지(초록색 [31,122,63])를 색상으로 자동 검출해
// 그 위치들을 모두 출입구(entrances)로 등록한다. 라벨은 가장 가까운 방의 관(zone)
// 이름을 따서 붙인다. 범례에 있는 "비상구 계단" 아이콘(작은 덩어리)은 제외한다.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const DATA_DIR = path.join(__dirname, "..", "src", "data", "floorplans");
const ASSETS_DIR = path.join(__dirname, "..", "src", "assets", "floorplans");
const FLOORS = [
  { id: "b1", image: "5호관_B1.png" },
  { id: "1f", image: "5호관_1F.png" },
  { id: "2f", image: "5호관_2F.png" },
  { id: "3f", image: "5호관_3F.png" },
  { id: "4f", image: "5호관_4F.png" },
];

const TARGET = [31, 122, 63];
const TOLERANCE = 20;
const MIN_PIXELS = 400; // 이보다 작은 덩어리(범례 아이콘 등)는 무시

async function findExitClusters(file) {
  const { data, info } = await sharp(file).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const isMatch = (x, y) => {
    const idx = (y * width + x) * channels;
    return (
      Math.abs(data[idx] - TARGET[0]) < TOLERANCE &&
      Math.abs(data[idx + 1] - TARGET[1]) < TOLERANCE &&
      Math.abs(data[idx + 2] - TARGET[2]) < TOLERANCE
    );
  };

  const visited = new Uint8Array(width * height);
  const clusters = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = y * width + x;
      if (visited[key] || !isMatch(x, y)) continue;
      const stack = [[x, y]];
      visited[key] = 1;
      let minX = x, maxX = x, minY = y, maxY = y, count = 0;
      while (stack.length) {
        const [cx, cy] = stack.pop();
        count++;
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const nk = ny * width + nx;
          if (visited[nk] || !isMatch(nx, ny)) continue;
          visited[nk] = 1;
          stack.push([nx, ny]);
        }
      }
      if (count >= MIN_PIXELS) {
        clusters.push({ x: Math.round((minX + maxX) / 2), y: Math.round((minY + maxY) / 2) });
      }
    }
  }
  return clusters;
}

function nearestZone(rooms, x, y) {
  let best = null;
  let bestDist = Infinity;
  for (const room of rooms) {
    const rx = room.x + room.width / 2;
    const ry = room.y + room.height / 2;
    const d = Math.hypot(rx - x, ry - y);
    if (d < bestDist) {
      bestDist = d;
      best = room.zone;
    }
  }
  return best;
}

(async () => {
  for (const { id, image } of FLOORS) {
    const filePath = path.join(DATA_DIR, `${id}.json`);
    const floor = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const clusters = await findExitClusters(path.join(ASSETS_DIR, image));

    const zoneCounts = new Map();
    const entrances = clusters
      .sort((a, b) => a.y - b.y || a.x - b.x)
      .map((c) => {
        const zone = nearestZone(floor.rooms, c.x, c.y);
        const n = (zoneCounts.get(zone) || 0) + 1;
        zoneCounts.set(zone, n);
        return { zone, n, x: c.x, y: c.y };
      });
    // 관별로 출입구가 여러 개면 번호를 붙인다
    const totalPerZone = new Map();
    for (const e of entrances) totalPerZone.set(e.zone, (totalPerZone.get(e.zone) || 0) + 1);

    floor.entrances = entrances.map((e, i) => ({
      id: `entrance-${id}-${i}`,
      label: totalPerZone.get(e.zone) > 1 ? `${e.zone} 출입구 ${e.n}` : `${e.zone} 출입구`,
      x: e.x,
      y: e.y,
    }));

    fs.writeFileSync(filePath, JSON.stringify(floor, null, 2) + "\n", "utf8");
    console.log(`${id}: 출입구 ${floor.entrances.length}개`);
    floor.entrances.forEach((e) => console.log(`   - ${e.label} (${e.x}, ${e.y})`));
  }
})();
