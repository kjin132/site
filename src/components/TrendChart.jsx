// src/components/TrendChart.jsx
//
// 주의: 실데이터에는 예측 "온도"가 없고 예측 "상태"만 있습니다 (명세서 2-3).
// 아래 점선 구간은 마지막 추세를 단순 연장한 시각적 근사치이며, 실제 LSTM
// 예측값이 아닙니다.

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";
import { PARTS } from "../utils/status";

function buildChartData(history) {
  if (history.length === 0) return [];
  const last = history[history.length - 1];
  const prevPoint = history[history.length - 2] || last;

  const data = history.map((h, i) =>
    i === history.length - 1
      ? { ...h, mccb_pred: h.mccb, busbar_pred: h.busbar, wire_pred: h.wire }
      : { ...h }
  );

  const steps = 5;
  for (let i = 1; i <= steps; i++) {
    const futureEntry = { time: `+${i * 5}초` };
    PARTS.forEach((p) => {
      const slope = last[p.key] - prevPoint[p.key];
      futureEntry[`${p.key}_pred`] = last[p.key] + slope * i * 0.6;
    });
    data.push(futureEntry);
  }
  return data;
}

export default function TrendChart({ history }) {
  const chartData = buildChartData(history);
  const lowestCritical = Math.min(...PARTS.map((p) => p.criticalTemp));
  const lastActualTime = history.length ? history[history.length - 1].time : null;

  return (
    <div className="panel chart-panel">
      <div className="chart-head">
        <div className="chart-title">실시간 온도 추이</div>
        <div className="chart-title-sub">최근 약 2분 · 단위 °C</div>
      </div>

      {history.length === 0 ? (
        <div className="chart-empty">데이터 수신 대기 중...</div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#eef1f4" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#5c6b7a" }} interval="preserveStartEnd" minTickGap={36} />
            <YAxis
              domain={[30, 100]}
              ticks={[30, 50, 70, 100]}
              tick={{ fontSize: 11, fill: "#5c6b7a" }}
              width={44}
            />
            <Tooltip
              formatter={(value, name) => [`${value?.toFixed?.(1) ?? value}°C`, name]}
              labelFormatter={(l) => `시각 ${l}`}
            />

            <ReferenceArea y1={lowestCritical} y2={100} fill="#d7263d" fillOpacity={0.05} strokeOpacity={0} />

            {lastActualTime && (
              <ReferenceLine
                x={lastActualTime}
                stroke="#c8ccd2"
                strokeDasharray="4 4"
                label={{ value: "예측 →", position: "top", fontSize: 10, fill: "#9aa5b1" }}
              />
            )}

            {PARTS.map((p) => (
              <ReferenceLine
                key={`ref-${p.key}`}
                y={p.criticalTemp}
                stroke={p.dotColor}
                strokeDasharray="4 4"
                strokeOpacity={0.5}
                label={{ value: `${p.label} ${p.criticalTemp}°`, position: "insideTopRight", fontSize: 10, fill: p.dotColor }}
              />
            ))}

            {PARTS.map((p) => (
              <Line
                key={p.key}
                type="monotone"
                dataKey={p.key}
                name={p.label}
                stroke={p.dotColor}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
            {PARTS.map((p) => (
              <Line
                key={`${p.key}-pred`}
                type="monotone"
                dataKey={`${p.key}_pred`}
                name={`${p.label} 예측`}
                stroke={p.dotColor}
                strokeWidth={1.6}
                strokeDasharray="3 3"
                isAnimationActive={false}
                dot={(props) => {
                  const isLast = props.index === chartData.length - 1;
                  if (!isLast) return null;
                  return (
                    <circle
                      key={props.key}
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill="#fff"
                      stroke={p.dotColor}
                      strokeWidth={2}
                    />
                  );
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}

      <div className="chart-legend">
        {PARTS.map((p) => (
          <span className="chart-legend-item" key={p.key}>
            <span className="chart-legend-swatch" style={{ background: p.dotColor }} />
            {p.label}
          </span>
        ))}
        <span className="chart-legend-item muted">점선 = 20초 예측 구간(추세 연장 근사치)</span>
      </div>
    </div>
  );
}
