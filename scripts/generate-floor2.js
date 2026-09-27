// floor2-data.js의 관별 호실 목록으로 2층 평면도 이미지(SVG->PNG)와 rooms 좌표 JSON을 생성한다.
// 실제 건물 형태를 그대로 재현하는 대신, 각 관을 사진에 적힌 순서대로 나열한 "표"형 도식으로 그린다.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const ZONES = require("./floor2-data");

const COLS = 10;
const CELL_W = 180;
const CELL_H = 78;
const GAP = 8;
const MARGIN = 24;
const HEADER_H = 56;
const ZONE_GAP = 28;

const contentWidth = COLS * (CELL_W + GAP) - GAP;
const viewBoxWidth = contentWidth + MARGIN * 2;

let cursorY = MARGIN;
const rooms = [];
const svgParts = [];

for (const zoneName of Object.keys(ZONES)) {
  const entries = ZONES[zoneName].map((e) =>
    typeof e === "string" ? { number: e, note: null } : e
  );
  const rowCount = Math.ceil(entries.length / COLS);
  const zoneHeight = HEADER_H + rowCount * (CELL_H + GAP) - GAP;

  svgParts.push(
    `<rect x="${MARGIN}" y="${cursorY}" width="${contentWidth}" height="${zoneHeight}" fill="none" stroke="#c9cdd3" stroke-width="2" rx="10"/>`
  );
  svgParts.push(
    `<text x="${MARGIN + 14}" y="${cursorY + 36}" font-size="30" font-weight="700" fill="#0b5fff" font-family="sans-serif">${zoneName}</text>`
  );

  entries.forEach((entry, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = MARGIN + col * (CELL_W + GAP);
    const y = cursorY + HEADER_H + row * (CELL_H + GAP);

    svgParts.push(
      `<rect x="${x}" y="${y}" width="${CELL_W}" height="${CELL_H}" fill="#f8f9fb" stroke="#333" stroke-width="1.5" rx="6"/>`
    );
    svgParts.push(
      `<text x="${x + CELL_W / 2}" y="${y + (entry.note ? 34 : 46)}" font-size="26" font-weight="700" text-anchor="middle" fill="#111" font-family="sans-serif">${entry.number}</text>`
    );
    if (entry.note) {
      svgParts.push(
        `<text x="${x + CELL_W / 2}" y="${y + 58}" font-size="15" text-anchor="middle" fill="#666" font-family="sans-serif">${entry.note}</text>`
      );
    }

    const idBase = `${zoneName} ${entry.number}`;
    let id = idBase;
    let dupeIdx = 2;
    while (rooms.some((r) => r.id === id)) {
      id = `${idBase}-${dupeIdx++}`;
    }

    rooms.push({
      id,
      zone: zoneName,
      number: entry.number,
      label: entry.note ? `${entry.number} (${entry.note})` : entry.number,
      x,
      y,
      width: CELL_W,
      height: CELL_H,
    });
  });

  cursorY += zoneHeight + ZONE_GAP;
}

const viewBoxHeight = cursorY - ZONE_GAP + MARGIN;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}" width="${viewBoxWidth}" height="${viewBoxHeight}">
<rect x="0" y="0" width="${viewBoxWidth}" height="${viewBoxHeight}" fill="#ffffff"/>
${svgParts.join("\n")}
</svg>`;

const outDir = path.join(__dirname, "..", "src", "data", "floorplans");
const assetsDir = path.join(__dirname, "..", "src", "assets", "floorplans");

sharp(Buffer.from(svg))
  .png()
  .toFile(path.join(assetsDir, "5호관_2F.png"))
  .then(() => {
    const floor = {
      id: "2f",
      label: "2층",
      image: "5호관_2F.png",
      viewBoxWidth,
      viewBoxHeight,
      rooms,
    };
    fs.writeFileSync(
      path.join(outDir, "2f.json"),
      JSON.stringify(floor, null, 2) + "\n",
      "utf8"
    );
    console.log(`2F 완료: 방 ${rooms.length}개, 이미지 ${viewBoxWidth}x${viewBoxHeight}`);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
