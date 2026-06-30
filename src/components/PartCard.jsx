// src/components/PartCard.jsx
import {
  STATUS_COLOR,
  STATUS_LABEL,
  normalizeStatus,
  gaugePercent,
  tickPercent,
} from "../utils/status";

function Gauge({ part, temp, status }) {
  const pct = gaugePercent(part.key, temp);
  return (
    <div className="gauge-track">
      <div className="gauge-fill" style={{ width: `${pct}%`, background: STATUS_COLOR[status] }} />
      {[
        { t: part.warningTemp, c: STATUS_COLOR.warning },
        { t: part.dangerTemp, c: STATUS_COLOR.danger },
        { t: part.criticalTemp, c: STATUS_COLOR.critical },
      ].map((m, i) => (
        <span
          key={i}
          className="gauge-tick"
          style={{ left: `${tickPercent(part, m.t)}%`, background: m.c }}
        />
      ))}
    </div>
  );
}

export default function PartCard({ part, temp, status, predict, peak, prevTemp }) {
  const hasData = typeof temp === "number" && !Number.isNaN(temp);
  const normStatus = hasData ? normalizeStatus(status) : "normal";
  const normPredict = hasData ? normalizeStatus(predict) : "normal";
  const diff = hasData ? temp - (prevTemp ?? temp) : 0;
  const arrow = diff > 0.15 ? "↗" : diff < -0.15 ? "↘" : "→";

  return (
    <div className="panel part-card" data-status={hasData ? normStatus : "normal"}>
      <div className="part-card-head">
        <div className="part-card-name">
          <span className="part-dot" style={{ background: part.dotColor }} />
          {part.label} <span className="part-card-en">{part.idLabel}</span>
        </div>
        <span className="status-chip outline" data-status={hasData ? normStatus : "normal"}>
          {hasData ? STATUS_LABEL[normStatus] : "데이터 없음"}
        </span>
      </div>

      <div className="part-card-split">
        <div className="split-col">
          <div className="col-eyebrow">현재</div>
          <div className="part-card-temp" style={{ color: hasData ? STATUS_COLOR[normStatus] : "#9aa5b1" }}>
            {hasData ? temp.toFixed(1) : "--"}
            <span className="unit">°C</span>
            {hasData && <span className="trend-arrow">{arrow}</span>}
          </div>
          {hasData && <Gauge part={part} temp={temp} status={normStatus} />}
          <div className="peak-line">
            최근 피크 <b>{hasData && peak ? `${peak.toFixed(1)}°C` : "--"}</b>
          </div>
        </div>

        <div className="split-col split-col-right">
          <div className="col-eyebrow">20초 후 예측</div>
          <div className="predict-row">
            <span className="status-chip outline dashed" data-status={hasData ? normPredict : "normal"}>
              {hasData ? STATUS_LABEL[normPredict] : "—"}
            </span>
            <span className="predict-arrow">→</span>
          </div>
          {/* 참고: "예측 신뢰도"는 Firebase 데이터에 없는 값이라 표시용 고정 텍스트입니다.
              실제 신뢰도 수치를 받게 되면 이 부분을 데이터 기반으로 바꿔야 합니다. */}
          <div className="confidence-line">예측 신뢰도 <b>98%</b></div>
          <div className="threshold-line">
            임계값 · 주의 {part.warningTemp} · 위험 {part.dangerTemp} · 심각 {part.criticalTemp}°C
          </div>
        </div>
      </div>
    </div>
  );
}
