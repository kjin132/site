// src/components/TopBar.jsx
import { STATUS_LABEL, formatTime } from "../utils/status";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function TopBar({ overall, worstInfo, timestamp, offline }) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <span className="status-chip" data-status={offline ? "offline" : overall}>
          {offline ? "대기" : STATUS_LABEL[overall]}
        </span>
        <div>
          <div className="topbar-title">배전반 종합 상태</div>
          <div className="topbar-sub">
            {offline
              ? "센서 연결을 기다리는 중입니다"
              : `최고 위험 부위 · ${worstInfo.part.label} (${STATUS_LABEL[worstInfo.status]})`}
          </div>
        </div>
      </div>
      <div className="topbar-right">
        <div className="updated-group">
          <div className="sim-label">마지막 갱신</div>
          <div className="updated-time">{timestamp ? formatTime(timestamp) : "--:--:--"}</div>
        </div>
        <button className="logout-btn" type="button" onClick={() => signOut(auth)}>
          로그아웃
        </button>
      </div>
    </div>
  );
}
