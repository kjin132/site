// src/components/Login.jsx
//
// "식별코드" 입력칸이지만 내부적으로는 Firebase Authentication의
// signInWithEmailAndPassword를 사용합니다. 코드(=비밀번호)는 클라이언트에서
// 비교하지 않고 Firebase 서버로 보내 검증하므로, 이전의 "1234 하드코딩" 방식과
// 달리 코드 값 자체가 소스에 노출되지 않습니다.
//
// 사전 준비 (README 참고):
// 1) Firebase 콘솔 → Authentication → 로그인 방법 → 이메일/비밀번호 사용 설정
// 2) Authentication → Users → 사용자 추가
//    - 이메일: ADMIN_EMAIL과 동일한 값 (실제 메일함일 필요 없음, 계정 식별용)
//    - 비밀번호: 실제로 쓸 "식별코드" (Firebase 정책상 최소 6자 이상)
// 3) Realtime Database 규칙에서 로그인한 사용자만 읽을 수 있도록 제한
//    (README의 보안 규칙 섹션 참고)

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

// 식별코드를 Firebase Auth 계정에 매핑하기 위한 고정 이메일.
// 실제 수신 메일함일 필요는 없고, Firebase Authentication에 등록할 계정의 ID로만 쓰입니다.
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "admin@panel-dashboard.local";

export default function Login() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, ADMIN_EMAIL, code.trim());
      // 성공하면 App.jsx의 onAuthStateChanged가 자동으로 화면을 전환합니다.
    } catch (err) {
      if (err.code === "auth/too-many-requests") {
        setError("시도가 너무 많습니다. 잠시 후 다시 시도하세요.");
      } else {
        setError("식별코드가 올바르지 않습니다.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-root">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-title">배전반 화재예방 모니터링</div>
        <div className="login-sub">관리자 식별코드를 입력하세요</div>
        <input
          className="login-input"
          type="password"
          inputMode="numeric"
          autoFocus
          placeholder="식별코드"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError("");
          }}
        />
        {error && <div className="login-error">{error}</div>}
        <button className="login-btn" type="submit" disabled={loading}>
          {loading ? "확인 중..." : "입장"}
        </button>
      </form>
    </div>
  );
}
