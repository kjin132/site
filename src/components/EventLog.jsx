// src/components/EventLog.jsx
export default function EventLog({ events }) {
  return (
    <div className="panel log-panel">
      <div className="log-title">이벤트 로그</div>
      {events.length === 0 ? (
        <div className="log-empty">아직 기록된 변화가 없습니다.</div>
      ) : (
        <ul className="log-list">
          {events.map((e) => (
            <li className="log-item" key={e.id} data-level={e.level}>
              <span className="log-time">{e.time}</span>
              <span className="log-text" data-level={e.level}>
                {e.message}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
