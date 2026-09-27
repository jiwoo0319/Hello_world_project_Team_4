// 각 층 JSON에 "출입문(entrances)"을 추가한다.
// 정확한 출입문 좌표 데이터가 없어서, 각 관(zone)의 배열상 첫 방 위치를 그 관의
// 출입구 근처로 보고 근사치로 사용한다 (해당 방 옆 계단/통로에서 들어온다고 가정).
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "src", "data", "floorplans");
const FLOORS = ["b1", "1f", "2f", "3f", "4f"];

for (const id of FLOORS) {
  const filePath = path.join(DATA_DIR, `${id}.json`);
  const floor = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const seenZones = new Set();
  const entrances = [];
  for (const room of floor.rooms) {
    if (seenZones.has(room.zone)) continue;
    seenZones.add(room.zone);
    entrances.push({
      id: `entrance-${room.zone}`,
      label: `${room.zone} 출입구`,
      x: room.x + room.width / 2,
      y: room.y + room.height / 2,
    });
  }

  floor.entrances = entrances;
  fs.writeFileSync(filePath, JSON.stringify(floor, null, 2) + "\n", "utf8");
  console.log(`${id}: 출입구 ${entrances.length}개 추가 (${entrances.map((e) => e.label).join(", ")})`);
}
