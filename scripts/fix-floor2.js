// 2층 도면(5호관_2F.png)을 손대지 않는 선에서:
// 1) 사진과 다른 것으로 확인된 호실번호를 기존 박스 자리에 다시 그려 넣어 고치고
// 2) 사진에는 있지만 도면에는 아예 없던 호실들을 도면 아래쪽에 캔버스를 늘려 추가한다.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const DATA_DIR = path.join(__dirname, "..", "src", "data", "floorplans");
const ASSET_PATH = path.join(__dirname, "..", "src", "assets", "floorplans", "5호관_2F.png");
const floor = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "2f.json"), "utf8"));

const FILL = "#fdfdf6";
const FONT = "sans-serif";

// ---------- 1) 잘못된 호실번호 자리 고치기 ----------
const RENAMES = [
  ["5동 213A", "213"],
  ["5동 210B", "210"],
  ["5동 210A", "210"],
  ["5동 207A", "207"],
  ["5동 207B", "207"],
  ["5동 209B", "209"],
  ["5동 209A", "209"],
  ["5동 208A", "208"],
  ["5남 237B", "235"],
  ["5남 237A", "233"],
];

const patchSvgParts = [];
for (const [id, newNumber] of RENAMES) {
  const room = floor.rooms.find((r) => r.id === id);
  if (!room) {
    console.warn(`! ${id} 을(를) 찾을 수 없음`);
    continue;
  }
  const pad = 4;
  patchSvgParts.push(
    `<rect x="${room.x + pad}" y="${room.y + pad}" width="${room.width - pad * 2}" height="${room.height - pad * 2}" fill="${FILL}"/>`
  );
  patchSvgParts.push(
    `<text x="${room.x + room.width / 2}" y="${room.y + room.height / 2 + 9}" font-size="26" text-anchor="middle" fill="#111" font-family="${FONT}">${newNumber}</text>`
  );
  room.number = newNumber;
  room.label = newNumber;
}

// ---------- 2) 빠진 호실들을 하단에 추가 ----------
const ADD_GROUPS = [
  { zone: "5북관", label: "진입부 코너 (도면 밖 별도 확인)", rooms: ["253", "251A", "251B", "250", "252"] },
  {
    zone: "5북관",
    label: "계단실 옆 로비 (도면 밖 별도 확인)",
    rooms: ["219", "218", "213", "217", "216", "215A", "215B"].map((number) => ({
      number,
      note: "계단실 옆",
    })),
  },
  { zone: "5서관", label: "북쪽 진입부 (도면 밖 별도 확인)", rooms: ["245", "247", "248", "241", "243", "244", "246B", "246A"] },
  {
    zone: "5동관",
    label: "서쪽 진입부 (도면 밖 별도 확인)",
    rooms: ["209", "208", "207", "206", "205", "204", "203", "202", "201", "254", "251"],
  },
  {
    zone: "5동관",
    label: "서쪽 계단실 (도면 밖 별도 확인)",
    rooms: ["201D", "201A", "201E", "201B"].map((number) => ({ number, note: "계단실 옆" })),
  },
  {
    zone: "5남관",
    label: "동쪽 계단실·동관 접속부 (도면 밖 별도 확인)",
    rooms: ["205A", "204", "203", "202", "201C", "201B", "201D", "201E", "201A"].map((number) => ({
      number,
      note: "동관 접속부",
    })),
  },
];

const CELL_W = 100;
const CELL_H = 60;
const GAP = 6;
const GROUP_LABEL_H = 24;
const GROUP_GAP = 16;
const MARGIN = 24;
const HEADING_H = 46;

async function main() {
const { width: origW, height: origH } = await sharp(ASSET_PATH).metadata();

let cursorY = origH + HEADING_H;
const addSvgParts = [];
addSvgParts.push(
  `<line x1="0" y1="${origH + 8}" x2="${origW}" y2="${origH + 8}" stroke="#c9cdd3" stroke-width="2" stroke-dasharray="10,8"/>`
);
addSvgParts.push(
  `<text x="${MARGIN}" y="${origH + 34}" font-size="24" font-weight="700" fill="#0b5fff" font-family="${FONT}">사진으로 추가 확인된 호실 (도면에는 없어 별도 표시)</text>`
);

const RING_COLS = 16;
for (const group of ADD_GROUPS) {
  const rooms = group.rooms.map((r) => (typeof r === "string" ? { number: r, note: null } : r));
  addSvgParts.push(
    `<text x="${MARGIN}" y="${cursorY + 14}" font-size="14" fill="#888" font-family="${FONT}">[${group.zone}] ${group.label}</text>`
  );
  const gy = cursorY + GROUP_LABEL_H;
  rooms.forEach((entry, i) => {
    const col = i % RING_COLS;
    const row = Math.floor(i / RING_COLS);
    const x = MARGIN + col * (CELL_W + GAP);
    const y = gy + row * (CELL_H + GAP);
    addSvgParts.push(
      `<rect x="${x}" y="${y}" width="${CELL_W}" height="${CELL_H}" fill="${FILL}" stroke="#333" stroke-width="1.3" rx="5"/>`
    );
    addSvgParts.push(
      `<text x="${x + CELL_W / 2}" y="${y + (entry.note ? CELL_H / 2 - 2 : CELL_H / 2 + 8)}" font-size="20" font-weight="700" text-anchor="middle" fill="#111" font-family="${FONT}">${entry.number}</text>`
    );
    if (entry.note) {
      addSvgParts.push(
        `<text x="${x + CELL_W / 2}" y="${y + CELL_H / 2 + 16}" font-size="11" text-anchor="middle" fill="#666" font-family="${FONT}">${entry.note}</text>`
      );
    }

    const idBase = `${group.zone} ${entry.number}`;
    let id = idBase;
    let dupeIdx = 2;
    while (floor.rooms.some((r) => r.id === id)) id = `${idBase}-${dupeIdx++}`;
    floor.rooms.push({
      id,
      zone: group.zone,
      number: entry.number,
      label: entry.note ? `${entry.number} (${entry.note})` : entry.number,
      x,
      y,
      width: CELL_W,
      height: CELL_H,
    });
  });
  const rows = Math.ceil(rooms.length / RING_COLS);
  cursorY = gy + rows * (CELL_H + GAP) - GAP + GROUP_GAP;
}

const newHeight = cursorY + MARGIN;

const overlaySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${origW}" height="${newHeight}">
${patchSvgParts.join("\n")}
${addSvgParts.join("\n")}
</svg>`;

await sharp(ASSET_PATH)
  .extend({ bottom: newHeight - origH, background: "#ffffff" })
  .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
  .png()
  .toFile(ASSET_PATH + ".tmp");
fs.renameSync(ASSET_PATH + ".tmp", ASSET_PATH);
floor.viewBoxHeight = newHeight;
fs.writeFileSync(
  path.join(DATA_DIR, "2f.json"),
  JSON.stringify(floor, null, 2) + "\n",
  "utf8"
);
console.log(`완료: 이미지 ${origW}x${newHeight}, 방 ${floor.rooms.length}개`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
