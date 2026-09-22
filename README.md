# 인하대 캠퍼스 네비게이션 (5호관 프로토타입)

Expo 기반 React Native 앱. 실외는 실시간 도보 경로 안내, 실내는 층별 목적지 선택 + 텍스트 안내로 구성.

## 실행 방법

```bash
npm install
npx expo start
```

터미널에 뜨는 QR코드를 휴대폰의 Expo Go 앱으로 스캔하면 실행됩니다.

## 구성

- `App.js` — 지도 화면 ↔ 실내 안내 화면 전환
- `src/screens/MapScreen.js` — 캠퍼스 지도, 현재 위치, 5호관까지 도보 경로(OSRM)
- `src/screens/IndoorScreen.js` — 층 선택 → 목적지(방) 선택 → 단계별 텍스트 안내
- `src/data/buildings.js` — 건물/층/방 데이터 (현재는 5호관만, 좌표는 placeholder)
- `src/lib/routing.js` — OSRM 공개 데모 서버로 도보 경로 계산

## 다음에 손볼 것

1. `src/data/buildings.js`의 `coordinate`를 5호관 실제 좌표로 교체 (구글 지도 우클릭으로 확인)
2. 5호관 실제 층별 방 목록/안내 문구로 `floors` 데이터 채우기
3. 필요하면 다른 건물도 `BUILDINGS` 배열에 추가
