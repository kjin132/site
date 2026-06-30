// src/utils/status.js
//
// 명세서 2-4 (4단계 상태), 2-5 (부위별 임계값), 4-5/4-6 (색상·게이지 계산식)을
// 그대로 구현한 공용 유틸입니다. (디자인 확정본 기준으로 PARTS에 표시용 필드 추가)

export const STATUS_COLOR = {
  normal: "#1f8a5f", // 초록 — 정상
  warning: "#c98e00", // 노랑 — 주의
  danger: "#c75a14", // 주황 — 위험
  critical: "#d7263d", // 빨강 — 심각
};

export const STATUS_LABEL = {
  normal: "정상",
  warning: "주의",
  danger: "위험",
  critical: "심각",
};

export const RANK = { normal: 0, warning: 1, danger: 2, critical: 3 };

// status / predict 값을 안전하게 정규화 (대소문자 혼입 대비, 명세서 2-6)
export function normalizeStatus(s) {
  const v = (s || "").toString().trim().toLowerCase();
  return RANK[v] !== undefined ? v : "normal";
}

// 부위 메타 정보.
// idLabel은 표시용 고정 텍스트일 뿐 Firebase 데이터에서 오는 값이 아닙니다.
// (실제 데이터는 부위당 센서가 1개씩이라 "#1/B-1/L-1"은 장식용입니다.)
export const PARTS = [
  {
    key: "mccb",
    label: "MCCB",
    enLabel: "MCCB",
    idLabel: "#1",
    dotColor: "#3b6fd6",
    warningTemp: 45,
    dangerTemp: 50,
    criticalTemp: 60,
  },
  {
    key: "busbar",
    label: "BUSBAR",
    enLabel: "Busbar",
    idLabel: "B-1",
    dotColor: "#a23fc4",
    warningTemp: 45,
    dangerTemp: 60,
    criticalTemp: 80,
  },
  {
    key: "wire",
    label: "Electric Wire",
    enLabel: "Electric Wire",
    idLabel: "L-1",
    dotColor: "#16a37a",
    warningTemp: 45,
    dangerTemp: 65,
    criticalTemp: 90,
  },
];

const GAUGE_BASE = 40; // 명세서 2-5: 기준 온도(주변온도)

// 게이지 퍼센트: (현재온도 - 40) / (critical기준 - 40), 0~100으로 클램프
export function gaugePercent(partKey, temp) {
  const part = PARTS.find((p) => p.key === partKey);
  if (!part || typeof temp !== "number" || Number.isNaN(temp)) return 0;
  return Math.max(0, Math.min(100, ((temp - GAUGE_BASE) / (part.criticalTemp - GAUGE_BASE)) * 100));
}

// 게이지 위에 주의/위험/심각 경계 눈금을 찍기 위한 위치(%) 계산
export function tickPercent(part, temp) {
  return Math.max(0, Math.min(100, ((temp - GAUGE_BASE) / (part.criticalTemp - GAUGE_BASE)) * 100));
}

// 센서 데이터 객체(d) 안의 모든 status/predict 중 가장 심각한 단계 반환
export function worstStatus(d) {
  if (!d) return "normal";
  const all = [
    d.mccb_status,
    d.busbar_status,
    d.wire_status,
    d.mccb_predict,
    d.busbar_predict,
    d.wire_predict,
  ];
  return all.reduce((worst, s) => {
    const n = normalizeStatus(s);
    return RANK[n] > RANK[worst] ? n : worst;
  }, "normal");
}

// 가장 심각한 부위 1개 반환 (종합 상태 바의 "최고 위험 부위" 표시용)
export function worstPart(d) {
  if (!d) return { part: PARTS[0], status: "normal" };
  let worst = PARTS[0];
  let worstRank = -1;
  PARTS.forEach((p) => {
    const r = Math.max(
      RANK[normalizeStatus(d[`${p.key}_status`])],
      RANK[normalizeStatus(d[`${p.key}_predict`])]
    );
    if (r > worstRank) {
      worstRank = r;
      worst = p;
    }
  });
  return { part: worst, status: normalizeStatus(d[`${worst.key}_status`]) };
}

// timestamp가 일정 시간(기본 10초) 이상 갱신되지 않았으면 오프라인 의심 (명세서 2-6)
export function isStale(timestamp, thresholdMs = 10000) {
  if (!timestamp) return true;
  return Date.now() - timestamp > thresholdMs;
}

export function formatTime(timestamp) {
  if (!timestamp) return "--:--:--";
  return new Date(timestamp).toLocaleTimeString("ko-KR", { hour12: false });
}
