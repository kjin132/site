// src/App.jsx
import { useEffect, useRef, useState } from "react";
import { ref, onValue } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "./firebase";
import Login from "./components/Login";
import TopBar from "./components/TopBar";
import PartCardRow from "./components/PartCardRow";
import TrendChart from "./components/TrendChart";
import EventLog from "./components/EventLog";
import {
  PARTS,
  STATUS_LABEL,
  normalizeStatus,
  worstStatus,
  worstPart,
  isStale,
} from "./utils/status";
import { formatTime } from "./utils/status";

const HISTORY_LIMIT = 120; // 약 2분치 (1초 간격 기준), 명세서 2-7
const EVENT_LOG_LIMIT = 50;
const STALE_MS = 10000; // 10초 이상 갱신 없으면 오프라인 의심, 명세서 2-6

let eventIdSeq = 0;

function Dashboard() {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [events, setEvents] = useState([]);
  const [peaks, setPeaks] = useState({ mccb: 0, busbar: 0, wire: 0 });
  const [, setNow] = useState(Date.now()); // 오프라인 판정 재계산용 1초 틱
  const [lastReceivedAt, setLastReceivedAt] = useState(null); // 브라우저가 실제로 값을 받은 시각

  const prevRef = useRef({});
  const peaksRef = useRef({ mccb: 0, busbar: 0, wire: 0 });
  const prevPointRef = useRef(null);
  const [prevPoint, setPrevPoint] = useState(null);

  function pushEvent(message, level) {
    setEvents((prev) => {
      const next = [{ id: ++eventIdSeq, time: formatTime(Date.now()), message, level }, ...prev];
      return next.slice(0, EVENT_LOG_LIMIT);
    });
  }

  // ── Firebase 실시간 구독 (읽기 전용: onValue만 사용, set/push 없음) ──
  useEffect(() => {
    const latestRef = ref(db, "sensors/latest");
    const unsubscribe = onValue(latestRef, (snapshot) => {
      const v = snapshot.val();
      if (!v) return; // 명세서 2-6: 비어 있으면 "데이터 없음" 처리는 렌더 쪽에서

      // 게이지 카드의 "최근 피크" 값 갱신
      peaksRef.current = {
        mccb: Math.max(peaksRef.current.mccb, v.mccb ?? 0),
        busbar: Math.max(peaksRef.current.busbar, v.busbar ?? 0),
        wire: Math.max(peaksRef.current.wire, v.wire ?? 0),
      };
      setPeaks({ ...peaksRef.current });

      // 추세 화살표(↗/→/↘)용 직전 값 저장
      setPrevPoint(prevPointRef.current);
      prevPointRef.current = { mccb: v.mccb, busbar: v.busbar, wire: v.wire };

      setData(v);
      setLastReceivedAt(Date.now()); // ⚠️ 백엔드 timestamp가 비정상(예: millis() 경과시간)일 때를 대비한 우회 기준
      setHistory((prev) =>
        [...prev, { time: formatTime(Date.now()), mccb: v.mccb, busbar: v.busbar, wire: v.wire }].slice(
          -HISTORY_LIMIT
        )
      );

      // ── 상태 변화 감지 → 이벤트 로그 ──
      const prev = prevRef.current;

      PARTS.forEach((part) => {
        const curStatus = normalizeStatus(v[`${part.key}_status`]);
        const curPredict = normalizeStatus(v[`${part.key}_predict`]);

        if (prev[`${part.key}_status`] && prev[`${part.key}_status`] !== curStatus) {
          pushEvent(`${part.label} · '${STATUS_LABEL[curStatus]}' 진입`, curStatus);
        }
        if (prev[`${part.key}_predict`] && prev[`${part.key}_predict`] !== curPredict) {
          pushEvent(`${part.label} · 20초 뒤 '${STATUS_LABEL[curPredict]}' 예측됨`, curPredict);
        }

        prev[`${part.key}_status`] = curStatus;
        prev[`${part.key}_predict`] = curPredict;
      });

      const prevOverall = prev.overall;
      const curOverall = worstStatus(v);
      if (prevOverall && prevOverall !== curOverall) {
        pushEvent(
          curOverall === "normal" ? "시스템 정상" : `시스템 종합 상태 · '${STATUS_LABEL[curOverall]}'(으)로 변경`,
          curOverall
        );
      }
      prev.overall = curOverall;
    });

    return () => unsubscribe();
  }, []);

  // 초기 안내 이벤트
  useEffect(() => {
    pushEvent("시스템 모니터링 시작", "normal");
  }, []);

  // 오프라인 의심 판단용 1초 틱 (timestamp가 멈춰 있는지 확인하려면 현재 시각이 흘러야 함)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const hasData = !!data;
  const offline = !hasData || isStale(lastReceivedAt, STALE_MS);
  const overall = hasData ? worstStatus(data) : "normal";
  const worstInfo = hasData ? worstPart(data) : { part: PARTS[0], status: "normal" };

  return (
    <div className="dashboard">
      <TopBar overall={overall} worstInfo={worstInfo} timestamp={lastReceivedAt} offline={offline} />

      {offline && (
        <div className="offline-banner">
          <span className="offline-dot" />
          {hasData
            ? "마지막 수신 이후 10초 이상 갱신이 없습니다 — 센서 오프라인 의심"
            : "센서 데이터를 기다리는 중입니다. 하드웨어/판정 두뇌가 켜져 있는지 확인하세요."}
        </div>
      )}

      <PartCardRow data={data} peaks={peaks} prevPoint={prevPoint} />
      <TrendChart history={history} />
      <EventLog events={events} />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = 확인 중, null = 비로그인

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  if (user === undefined) {
    return null; // 로그인 상태 확인 중 (깜빡임 방지용 빈 화면)
  }

  return user ? <Dashboard /> : <Login />;
}