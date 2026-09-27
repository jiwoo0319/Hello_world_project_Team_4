// SVG 평면도 파일에서 호실(class="rm") 정보를 뽑아 JSON으로 변환하는 1회성 스크립트.
// 사용법: node scripts/parse-floorplans.js
const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "..", "5호관_평면도_전체");
const OUT_DIR = path.join(__dirname, "..", "src", "data", "floorplans");

const FLOORS = [
  { file: "5호관_B1.svg", id: "b1", label: "지하1층", image: "5호관_B1.png" },
  { file: "5호관_1F.svg", id: "1f", label: "1층", image: "5호관_1F.png" },
  { file: "5호관_2F.svg", id: "2f", label: "2층", image: "5호관_2F.png" },
  { file: "5호관_3F.svg", id: "3f", label: "3층", image: "5호관_3F.png" },
  { file: "5호관_4F.svg", id: "4f", label: "4층", image: "5호관_4F.png" },
];

function parsePolygonBBox(pointsStr) {
  const pts = pointsStr
    .trim()
    .split(/\s+/)
    .map((p) => p.split(",").map(Number));
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}

function parseZoneAndNumber(title) {
  // e.g. "5북관 148" / "5동관 120A — 화재수신기실 측"
  const [mainPart, ...descParts] = title.split(" — ");
  const desc = descParts.join(" — ").trim() || null;
  const match = mainPart.trim().match(/^(\S+)\s+(.+)$/);
  if (!match) return { zone: null, number: mainPart.trim(), desc };
  return { zone: match[1], number: match[2], desc };
}

function parseFile(floor) {
  const svgPath = path.join(SRC_DIR, floor.file);
  const svg = fs.readFileSync(svgPath, "utf8");

  const viewBoxMatch = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  const viewBoxWidth = Number(viewBoxMatch[1]);
  const viewBoxHeight = Number(viewBoxMatch[2]);

  const rooms = [];
  const roomBlockRe = /<g class="rm[^"]*"[^>]*>([\s\S]*?)<\/g>/g;
  let blockMatch;

  while ((blockMatch = roomBlockRe.exec(svg))) {
    const block = blockMatch[0];

    const titleMatch = block.match(/<title>([^<]*)<\/title>/);
    if (!titleMatch) continue;
    const title = titleMatch[1];

    const dataKMatch = block.match(/data-k="([^"]*)"/);

    let bbox = null;
    const rectMatch = block.match(
      /<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/
    );
    if (rectMatch) {
      bbox = {
        x: Number(rectMatch[1]),
        y: Number(rectMatch[2]),
        width: Number(rectMatch[3]),
        height: Number(rectMatch[4]),
      };
    } else {
      const polygonMatch = block.match(/<polygon points="([^"]+)"/);
      if (polygonMatch) {
        bbox = parsePolygonBBox(polygonMatch[1]);
      }
    }
    if (!bbox) continue;

    const { zone, number, desc } = parseZoneAndNumber(title);
    const id = dataKMatch ? dataKMatch[1] : title;

    rooms.push({
      id,
      zone,
      number,
      label: desc ? `${number} (${desc})` : number,
      x: bbox.x,
      y: bbox.y,
      width: bbox.width,
      height: bbox.height,
    });
  }

  return {
    id: floor.id,
    label: floor.label,
    image: floor.image,
    viewBoxWidth,
    viewBoxHeight,
    rooms,
  };
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function dedupeIds(rooms, floorLabel) {
  const seen = new Map();
  for (const room of rooms) {
    const count = (seen.get(room.id) || 0) + 1;
    seen.set(room.id, count);
    if (count > 1) {
      console.warn(
        `  ! ${floorLabel}: 중복된 호실 ID "${room.id}" 발견 (원본 SVG 오타 가능성) -> "${room.id}-${count}"로 구분`
      );
      room.id = `${room.id}-${count}`;
    }
  }
  return rooms;
}

const index = [];
for (const floor of FLOORS) {
  const data = parseFile(floor);
  data.rooms = dedupeIds(data.rooms, floor.label);
  const outPath = path.join(OUT_DIR, `${floor.id}.json`);
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf8");
  console.log(`${floor.file}: ${data.rooms.length}개 호실 -> ${outPath}`);
  index.push({ id: floor.id, label: floor.label, image: floor.image });
}

fs.writeFileSync(
  path.join(OUT_DIR, "index.json"),
  JSON.stringify(index, null, 2),
  "utf8"
);
console.log("index.json 생성 완료");
