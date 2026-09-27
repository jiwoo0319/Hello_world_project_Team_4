// floor2-data.js의 관별 호실 목록으로 2층 평면도 이미지(SVG->PNG)와 rooms 좌표 JSON을 생성한다.
// 실제 건물이 가운데 중정을 둘러싼 ㅁ자(고리) 형태이므로, 북/동/서/남 4개 관을
// 사각형 테두리를 따라 배치해 실제 도면처럼 보이게 그린다 (사진 속 개요도와 같은 형태).
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const ZONES = require("./floor2-data");

const CELL_W = 100;
const CELL_H = 64;
const GAP = 6;
const MARGIN = 20;
const LABEL_H = 22;

function normalize(list) {
  return list.map((e) => (typeof e === "string" ? { number: e, note: null } : e));
}

const north = normalize(ZONES["5북관"]);
const east = normalize(ZONES["5동관"]);
const south = normalize(ZONES["5남관"]);
const west = normalize(ZONES["5서관"]);

// 위/아래 띠: 전체 너비를 채우는 여러 줄. 좌/우 띠: 위아래 띠 사이 구간을 채우는 여러 열.
const RING_COLS = 16; // 위/아래 띠 한 줄에 들어가는 방 개수
const SIDE_COLS = 3; // 좌/우 띠 한 줄(가로)에 들어가는 방 개수

const topRows = Math.ceil(north.length / RING_COLS);
const bottomRows = Math.ceil(south.length / RING_COLS);
const topBandH = LABEL_H + topRows * (CELL_H + GAP) - GAP + MARGIN;
const bottomBandH = LABEL_H + bottomRows * (CELL_H + GAP) - GAP + MARGIN;

const eastRows = Math.ceil(east.length / SIDE_COLS);
const westRows = Math.ceil(west.length / SIDE_COLS);
const sideBandRows = Math.max(eastRows, westRows);
const sideBandH = LABEL_H + sideBandRows * (CELL_H + GAP) - GAP;

const ringWidth = RING_COLS * (CELL_W + GAP) - GAP;
const sideBandW = SIDE_COLS * (CELL_W + GAP) - GAP;

const viewBoxWidth = MARGIN * 2 + sideBandW * 2 + ringWidth;
const viewBoxHeight = topBandH + sideBandH + bottomBandH;

const rooms = [];
const svgParts = [];

function addRoom(zone, entry, x, y, w, h) {
  svgParts.push(
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f8f9fb" stroke="#333" stroke-width="1.3" rx="5"/>`
  );
  svgParts.push(
    `<text x="${x + w / 2}" y="${y + (entry.note ? h / 2 - 2 : h / 2 + 8)}" font-size="20" font-weight="700" text-anchor="middle" fill="#111" font-family="sans-serif">${entry.number}</text>`
  );
  if (entry.note) {
    svgParts.push(
      `<text x="${x + w / 2}" y="${y + h / 2 + 16}" font-size="11" text-anchor="middle" fill="#666" font-family="sans-serif">${entry.note}</text>`
    );
  }
  const idBase = `${zone} ${entry.number}`;
  let id = idBase;
  let dupeIdx = 2;
  while (rooms.some((r) => r.id === id)) id = `${idBase}-${dupeIdx++}`;
  rooms.push({
    id,
    zone,
    number: entry.number,
    label: entry.note ? `${entry.number} (${entry.note})` : entry.number,
    x,
    y,
    width: w,
    height: h,
  });
}

// courtyard(가운데 빈 공간) 표시
svgParts.push(
  `<rect x="${MARGIN + sideBandW}" y="${topBandH}" width="${ringWidth}" height="${sideBandH}" fill="#eef2ee" stroke="#c9cdd3" stroke-width="2"/>`
);
svgParts.push(
  `<text x="${MARGIN + sideBandW + ringWidth / 2}" y="${topBandH + sideBandH / 2}" font-size="22" text-anchor="middle" fill="#9aa39a" font-family="sans-serif">중정</text>`
);

// 북관: 위쪽 띠, 왼쪽부터 오른쪽으로 채움
svgParts.push(
  `<text x="${MARGIN}" y="16" font-size="20" font-weight="700" fill="#0b5fff" font-family="sans-serif">5북관</text>`
);
north.forEach((entry, i) => {
  const col = i % RING_COLS;
  const row = Math.floor(i / RING_COLS);
  const x = MARGIN + sideBandW + col * (CELL_W + GAP);
  const y = MARGIN + LABEL_H + row * (CELL_H + GAP);
  addRoom("5북관", entry, x, y, CELL_W, CELL_H);
});

// 남관: 아래쪽 띠
svgParts.push(
  `<text x="${MARGIN}" y="${viewBoxHeight - MARGIN + 4}" font-size="20" font-weight="700" fill="#0b5fff" font-family="sans-serif">5남관</text>`
);
south.forEach((entry, i) => {
  const col = i % RING_COLS;
  const row = Math.floor(i / RING_COLS);
  const x = MARGIN + sideBandW + col * (CELL_W + GAP);
  const y = topBandH + sideBandH + LABEL_H + row * (CELL_H + GAP);
  addRoom("5남관", entry, x, y, CELL_W, CELL_H);
});

// 서관: 왼쪽 띠, 위에서 아래로
svgParts.push(
  `<text x="${MARGIN}" y="${topBandH + 16}" font-size="20" font-weight="700" fill="#0b5fff" font-family="sans-serif">5서관</text>`
);
west.forEach((entry, i) => {
  const col = i % SIDE_COLS;
  const row = Math.floor(i / SIDE_COLS);
  const x = MARGIN + col * (CELL_W + GAP);
  const y = topBandH + LABEL_H + row * (CELL_H + GAP);
  addRoom("5서관", entry, x, y, CELL_W, CELL_H);
});

// 동관: 오른쪽 띠, 위에서 아래로
const eastBandX = MARGIN + sideBandW + ringWidth;
svgParts.push(
  `<text x="${eastBandX}" y="${topBandH + 16}" font-size="20" font-weight="700" fill="#0b5fff" font-family="sans-serif">5동관</text>`
);
east.forEach((entry, i) => {
  const col = i % SIDE_COLS;
  const row = Math.floor(i / SIDE_COLS);
  const x = eastBandX + col * (CELL_W + GAP);
  const y = topBandH + LABEL_H + row * (CELL_H + GAP);
  addRoom("5동관", entry, x, y, CELL_W, CELL_H);
});

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
