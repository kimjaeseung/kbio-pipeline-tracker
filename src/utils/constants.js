export const PHASE_ORDER = {
  "FDA 승인": 8, "허가": 7, "Phase 3": 6, "Phase 3 (미국)": 6, "Phase 3 (중국)": 6,
  "Phase 2/3": 5.5, "Phase 2": 5, "Phase 1b": 4.5, "Phase 1a": 4,
  "Phase 1": 4, "Phase 1 완료": 4, "IND 승인": 3, "임상 진행중": 3.5,
  "전임상→IND": 2.5, "전임상": 2, "계약 체결": 3.5, "옵션 계약": 2.5, "연구단계": 1,
};

export const PHASE_COLOR = (phase) => {
  const o = PHASE_ORDER[phase] || 0;
  if (o >= 7) return "#10b981";
  if (o >= 5.5) return "#3b82f6";
  if (o >= 4) return "#8b5cf6";
  if (o >= 3) return "#f59e0b";
  return "#94a3b8";
};

export const CATEGORY_COLORS = {
  "이중항체": "#8b5cf6",
  "플랫폼(SC전환)": "#10b981",
  "ADC": "#3b82f6",
  "저분자 표적치료제": "#f97316",
  "서방형 제제": "#ec4899",
  "항체": "#06b6d4",
  "항체 신약": "#06b6d4",
  "비만/GLP-1": "#84cc16",
  "면역항암": "#ef4444",
  "심혈관/비뇨기": "#f59e0b",
  "유전자치료제": "#14b8a6",
  "펩타이드 신약": "#a855f7",
  "RNA 치료제": "#6366f1",
  "방사성의약품": "#0ea5e9",
  "세포치료제": "#e11d48",
};

export const TAG_COLORS = {
  "game-changer": { border: "#f59e0b", bg: "rgba(245,158,11,0.08)", text: "#fbbf24" },
  "best-in-class": { border: "#f59e0b", bg: "rgba(245,158,11,0.06)", text: "#fbbf24" },
  "first-in-class": { border: "#10b981", bg: "rgba(16,185,129,0.08)", text: "#34d399" },
  "first-mover": { border: "#10b981", bg: "rgba(16,185,129,0.06)", text: "#34d399" },
  "platform-expansion": { border: "#3b82f6", bg: "rgba(59,130,246,0.08)", text: "#60a5fa" },
  "unmet-need": { border: "#ef4444", bg: "rgba(239,68,68,0.08)", text: "#f87171" },
  "big-pharma-validated": { border: "#8b5cf6", bg: "rgba(139,92,246,0.08)", text: "#a78bfa" },
  "watch": { border: "#64748b", bg: "rgba(100,116,139,0.08)", text: "#94a3b8" },
};

export const CONFIDENCE_COLORS = {
  high: "#10b981",
  medium: "#f59e0b",
  low: "#94a3b8",
};
