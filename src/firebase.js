// src/firebase.js
//
// ⚠️ 이 파일은 "읽기 전용" 연결만 만듭니다. set()/push()/update() 등 쓰기 함수는
//    프로젝트 어디에서도 import하지 않습니다. (명세서 1-4, 체크리스트 마지막 항목)
//
// apiKey 등 나머지 config 값은 프로젝트 담당자(수빈)에게 요청하세요.
// Firebase 콘솔 → 프로젝트 설정 → "웹 앱 추가"에서 발급되는 config 객체를
// 받아서, 코드에 직접 쓰지 말고 .env 파일(.env.example 참고)에 넣으세요.
// → 로컬 개발: 프로젝트 루트에 .env 파일 생성
// → Vercel/Netlify 배포: 해당 서비스의 "Environment Variables" 설정에 동일하게 등록

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL ||
    "https://temperature-monitoring-test-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

if (!firebaseConfig.apiKey) {
  // 값이 비어 있으면 화면은 뜨지만 데이터는 못 받아옵니다 — 콘솔에서 바로 알아챌 수 있도록 경고.
  console.warn(
    "[firebase.js] VITE_FIREBASE_API_KEY가 비어 있습니다. .env 파일(로컬) 또는 " +
      "배포 환경의 Environment Variables 설정을 확인하세요."
  );
}

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
