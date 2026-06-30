# 배전반 화재예방 모니터링 — 관리자용 웹 대시보드

`web_dashboard_spec.md` 명세서를 기반으로 구현한 React(Vite) 프로젝트입니다.

## 시작하기

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속.

## 실행 전 꼭 해야 할 일 — Firebase config 입력

`.env.example` 파일을 복사해서 `.env`로 저장한 뒤, 프로젝트 담당자(수빈)에게 받은
Firebase 웹 config 값(`apiKey`, `authDomain`, `projectId`)을 채워 넣으세요.
(`VITE_FIREBASE_DATABASE_URL`은 명세서에 적힌 값으로 이미 채워둠.) `.env`는
`.gitignore`에 포함되어 있어 깃에 올라가지 않습니다.

데이터가 안 들어오면 담당자에게 "가짜 ESP + 판정 두뇌" 더미 데이터 송출을 요청하세요.

## 로그인 설정 — Firebase Authentication (필수)

이 대시보드는 "식별코드"를 입력하는 로그인 화면 뒤에 있습니다. 코드 비교를
브라우저가 아니라 Firebase 서버가 직접 하기 때문에, 코드 값 자체는 어디에도
노출되지 않습니다. 사용하려면 **Firebase 콘솔에서 아래 설정을 한 번 해줘야 합니다.**

1. **로그인 방법 켜기**: Firebase 콘솔 → Authentication → Sign-in method →
   "이메일/비밀번호" 제공업체를 사용 설정.
2. **관리자 계정 만들기**: Authentication → Users → "사용자 추가"
   - 이메일: `.env`의 `VITE_ADMIN_EMAIL`과 똑같은 값 (기본값 `admin@panel-dashboard.local`).
     실제로 받는 메일함일 필요는 없고, 계정을 구분하는 ID로만 쓰입니다.
   - 비밀번호: 실제로 사용할 "식별코드". **Firebase 정책상 최소 6자 이상**이어야
     합니다 (이전에 쓰던 "1234"는 4자라 등록이 안 됩니다 — 6자 이상으로 정해주세요).
3. **데이터베이스 잠그기**: Realtime Database → 규칙(Rules) 탭에서 아래처럼
   "로그인한 사용자만 읽기 가능"으로 바꿔달라고 수빈에게 요청하세요 (현재는 테스트
   모드라 비로그인 상태에서도 누구나 읽을 수 있는 상태입니다).
   ```json
   {
     "rules": {
       "sensors": {
         ".read": "auth != null",
         ".write": false
       }
     }
   }
   ```
   이 규칙이 적용되어야 "로그인 안 하면 데이터도 못 본다"가 진짜로 보장됩니다.
   지금처럼 화면(로그인 폼)만 막아두고 규칙을 안 바꾸면, 주소를 아는 사람이
   Firebase REST API로 직접 데이터를 읽어갈 수 있습니다.

코드를 여러 개 쓰고 싶어지면, Authentication → Users에서 같은 방식으로 계정을
추가로 만들면 됩니다 (계정마다 다른 식별코드/비밀번호 사용 가능).

## 인터넷에 공개된 주소로 배포하기 (Vercel, 무료)

로컬에서 `npm run dev`로 뜨는 `localhost` 주소는 본인 컴퓨터에서만 보입니다.
다른 사람도 접속 가능한 진짜 URL이 필요하면 아래 순서로 Vercel에 배포하세요.

1. 이 프로젝트 폴더를 GitHub 저장소로 올립니다 (GitHub 계정 필요).
   ```bash
   git init
   git add .
   git commit -m "init"
   # GitHub에서 빈 저장소를 만든 뒤
   git remote add origin <저장소 주소>
   git push -u origin main
   ```
2. https://vercel.com 에서 GitHub 계정으로 가입/로그인 후 "Add New → Project"로 방금 올린 저장소를 선택합니다.
3. Framework는 Vite로 자동 인식됩니다. Build Command(`npm run build`), Output Directory(`dist`)는 기본값 그대로 두면 됩니다.
4. "Environment Variables" 항목에 `.env.example`에 있는 4개 키(`VITE_FIREBASE_API_KEY` 등)와 그 값을 그대로 등록합니다.
5. "Deploy" 클릭 → 1~2분 후 `https://프로젝트이름.vercel.app` 형태의 공개 주소가 발급됩니다.

이후 GitHub에 코드를 푸시할 때마다 Vercel이 자동으로 재배포합니다.

## 폴더 구조

```
src/
├─ firebase.js          # Firebase 초기화 (DB는 읽기 전용, Auth는 로그인용)
├─ utils/status.js       # 상태색/라벨/임계값/게이지 계산 공용 유틸
├─ components/
│   ├─ Login.jsx         # 식별코드 로그인 화면 (Firebase Authentication)
│   ├─ TopBar.jsx        # ① 종합 상태 바 (+ 로그아웃 버튼)
│   ├─ PartCardRow.jsx   # ② 부위별 카드 묶음
│   ├─ PartCard.jsx      # ②   카드 1개 (현재/예측 분할, 게이지, 최근 피크)
│   ├─ TrendChart.jsx    # ③ 실시간 온도 추이 그래프 (Recharts, 전체 너비)
│   └─ EventLog.jsx      # ④ 이벤트 로그
└─ App.jsx               # 로그인 상태 분기 + Firebase 구독 + 히스토리/이벤트 로그 상태 관리
```

## 명세서 체크리스트 대비 구현 내역

- [x] `sensors/latest` 실시간 구독(`onValue`) — `App.jsx`. 센서 측은 약 1초마다 갱신, 화면은 값이 바뀔 때마다 즉시 반영.
- [x] 부위별 카드에 현재 온도 / 현재 상태 / 20초 뒤 예측 모두 표시. 좌(현재)·우(예측, 옅은 블루그레이 박스) 분할로 구분.
- [x] 종합 상태 바 — `worstStatus()`/`worstPart()`로 가장 심각한 단계와 최고 위험 부위 산출.
- [x] 실시간 추이 그래프 — 3부위 라인 + 부위별 critical 임계 기준선(라벨 포함), 위험구간 음영, 최근 120개 값(약 2분) 유지, 전체 너비.
- [x] 이벤트 로그 — 부위별 status/predict 변화 및 종합 상태 변화를 감지해 기록 (최근 50개), 그래프 아래 전체 너비 배치.
- [x] 데이터 없음 / 10초 이상 갱신 정지 시 "센서 오프라인 의심" 배너 표시.
- [x] critical일 때 카드 배경색 + 테두리 강조로 시각 경고 강화.
- [x] 데스크톱 우선 레이아웃, 640px 이하에서만 카드 세로 배치.
- [x] 읽기 전용 — 프로젝트 전체에서 `set`/`push`/`update` 등 Firebase 쓰기 함수를 import하지 않음 (`firebase.js`에 주석으로 명시).
- [x] 로그인 게이트 — Firebase Authentication으로 서버 측 검증, 로그아웃 버튼 포함.

## 참고

- status/predict 문자열은 `normalizeStatus()`에서 `.toLowerCase()`로 정규화해 대소문자 혼입에 대비했습니다.
- 그래프 히스토리는 브라우저 메모리에만 쌓이므로 새로고침하면 초기화됩니다 (명세서 2-7, 의도된 동작).
- 카드의 "예측 신뢰도 98%"는 Firebase 데이터에 없는 고정 표시 텍스트입니다. 실제 신뢰도 수치가
  생기면 `PartCard.jsx`에서 데이터 기반 값으로 바꿔야 합니다.
- 그래프의 예측 점선 구간은 실제 예측 온도가 아니라 직전 추세를 단순 연장한 시각적 근사치입니다
  (Firebase에는 예측 *상태*만 있고 예측 *온도*는 없음).
