# 프로젝트 백서: 스마트 여행 환율 계산기

> **버전**: 1.0.0
> **날짜**: 2026-02-05
> **작성자**: Antigravity (AI Agent) & User (Lead Developer)

---

## 1. 프로젝트 개요

### 1.1 목표
단순한 계산을 넘어 여행자에게 꼭 필요한 기능을 제공하는 **모바일 최적화 웹 애플리케이션**을 개발합니다. **OCR(광학 문자 인식)**을 통해 가격표를 스캔하고, 외국인을 위해 **역방향 환율 계산**을 지원하며, 인터넷이 없는 환경에서도 작동하는 **오프라인 모드**를 탑재합니다.

### 1.2 핵심 기능
1.  **실시간 & 오프라인 환율 변환**: 프록시 API 및 캐싱 시스템 활용.
2.  **스마트 국적 감지**: 위치/언어 기반으로 자국 화폐를 자동 감지하되, 사용자 수동 설정을 최우선으로 존중.
3.  **역방향 환율 (외국인 모드)**: '현지 화폐(KRW)'를 입력하면 자동으로 '자국 화폐(Target)'로 변환된 결과를 표시.
4.  **가격표 스캔 (모바일 전용)**: 정규식 기반의 고속 OCR로 즉각적인 가격 확인 지원.
5.  **영수증 관리자 (로그인 필요)**: AI(Gemini)를 활용한 상세 영수증 스캔 및 Google Sheets 연동 저장.
6.  **이중 인터페이스 디자인**:
    -   **일반 계산기**: 빠른 계산용.
    -   **영수증 관리**: 지출 내역 관리용.

---

## 2. 기술 아키텍처

### 2.1 프론트엔드 (Single Page Application)
-   **Core**: Vanilla HTML5, CSS3, JavaScript (ES6+).
-   **Storage**: `localStorage` (옵션, 환율 캐시, 사용자 설정 저장).
-   **Auth**: Google Identity Services (OAuth 2.0).
-   **Styling**: 다크/라이트 모드 대응 CSS 변수, 글래스모피즘(Glassmorphism) UI.

### 2.2 백엔드 (Serverless)
-   **Platform**: Google Apps Script (GAS).
-   **AI Engine**: Google Gemini 2.5 Flash (GAS 내부 REST API 호출).
-   **Database**: Google Sheets (영수증 데이터 저장소).

### 2.3 데이터 흐름
1.  **환율 데이터**:
    -   주 데이터: `ExchangeRate-API` (CORS 우회 프록시 사용).
    -   백업 데이터: 네이버 모바일 환율 API.
    -   오프라인 폴백: 하드코딩된 기본 데이터 사용.
2.  **OCR**:
    -   클라이언트 OCR: `Tesseract.js` (초기 계획) -> 속도를 위해 `정규식(Regex)` 패턴 매칭으로 변경.
    -   서버 OCR: 이미지 -> Base64 -> GAS -> Gemini API -> JSON -> 클라이언트.

---

## 3. 개발 환경 설정 및 배포 가이드

### 3.1 필수 준비 사항
-   Node.js (로컬 테스트용, `http-server` 등).
-   Google Cloud Platform 계정.
-   Google 계정 (Apps Script 용).
-   Git.

### 3.2 설치 단계
1.  **저장소 클론**:
    ```bash
    git clone https://github.com/your-username/currency-calculator.git
    cd currency-calculator
    ```
2.  **`apps-script/Code.gs` 생성**:
    -   [script.google.com](https://script.google.com) 접속 -> 새 프로젝트.
    -   아티팩트 `Code.gs` 내용 복사 및 붙여넣기.
    -   스크립트 속성 설정: `GEMINI_API_KEY` = `[발급받은 API 키]`.
    -   웹 앱 배포 -> 액세스 권한: "모든 사용자(Anyone)".
    -   `웹 앱 URL` 복사.
3.  **프론트엔드 설정**:
    -   `app.js` 열기.
    -   `CONFIG.APPS_SCRIPT_URL` 값을 위에서 복사한 URL로 변경.
    -   `index.html`의 `CLIENT_ID` (Google 로그인용) 업데이트.

### 3.3 Google Cloud 설정
1.  **Google Sheets API** 활성화.
2.  **OAuth 동의 화면** 설정 (External).
3.  **사용자 인증 정보 (OAuth Client ID)** 생성.
    -   승인된 출처: `http://localhost:3000`, `https://your-github-repo.io`.

---

## 4. 기능 명세 및 UX 로직

### 4.1 화폐 선택 로직 (중요)
이 앱은 **현지 화폐(Source, 입력)**와 **내 화폐(Target, 결과/자국)**를 철저히 구분합니다.

-   **자동 감지 (Auto-Detect)**:
    -   앱 실행 시: 타임존(예: Paris)을 감지.
    -   동작: **현지 화폐(Source)**를 EUR로 변경.
    -   **제약 사항**: 사용자가 이미 설정해 둔 **내 화폐(Target)**는 절대 변경하지 않음.

-   **역방향 환율 (Foreigner Mode)**:
    -   조건: 현지 화폐(Source)가 KRW(한국 원)로 설정될 때.
    -   동작: 결과창(Target)이 자동으로 사용자의 **자국 화폐(Home Currency)**(예: USD)로 변경됨.
    -   공식: `입력값 * (1 / 환율)`.

-   **분리된 검색 UI**:
    -   상단 바 클릭 -> 현지 화폐 검색 (입력 화폐 변경).
    -   결과창 클릭 -> 내 화폐 검색 (출력 화폐 변경).
    -   **UX**: 결과창 검색은 카드 내부에 '임베디드(Embedded)' 방식으로 열려 혼란을 방지함.

### 4.2 영수증 관리자
-   **모드**: "영수증 모드" (단순 가격 스캔과 구분).
-   **프로세스**:
    1.  영수증 아이콘 클릭.
    2.  촬영 또는 업로드.
    3.  GAS(Apps Script)로 이미지 전송.
    4.  Gemini가 날짜, 상호명, 카테고리, 총액 추출.
    5.  사용자 확인 후 -> Google Sheet 저장.

---

## 5. 트러블 슈팅 및 버그 해결 (심층 분석)

### 5.1 "파리 문제" (자동 감지 덮어쓰기 오류)
-   **증상**: 파리에 가면(타임존 변경 시) 현지 화폐와 내 화폐가 모두 EUR로 바뀌어버림.
-   **원인**: `detectLocation` 함수가 `selectCurrency`를 호출할 때, 타겟 화폐(Target) 보존 로직 없이 기본값으로 초기화해버림.
-   **해결**: `state.selectedCurrency`(현지)만 변경하도록 로직 수정. `state.targetCurrency`는 값이 없을 때만 변경되도록 보호 조치.

### 5.2 "새로고침 초기화" 버그
-   **증상**: "환율 업데이트" 버튼을 누르면 설정해둔 내 화폐(Target)가 현지 화폐(Source)로 덮어써짐.
-   **원인**:
    1.  내 화폐 검색(`target` 모드) 후 검색창을 닫아도 내부 `state.searchMode`가 `'target'`으로 남아있음.
    2.  새로고침 시 `selectCurrency`가 호출됨.
    3.  `searchMode`가 `'target'`이므로, 업데이트된 현지 화폐 정보를 내 화폐 자리에 덮어씀.
    -   **해결**:
    1.  `closeSearch()` 시 무조건 `state.searchMode = 'source'`로 초기화.
    2.  `fetchExchangeRates()`(새로고침) 실행 전에도 강제로 모드를 `'source'`로 고정.

### 5.3 모바일 터치 인식 불량
-   **증상**: 모바일에서 화폐 텍스트를 누르기가 너무 어려움.
-   **원인**: 클릭 이벤트가 텍스트(`span`)에만 걸려 있어 터치 영역이 너무 작음.
-   **해결**: 이벤트를 부모 컨테이너(`div`)로 옮기고 패딩을 주어 터치 영역 확대. 터치 시 `opacity` 변화로 시각적 피드백 추가.

---

## 6. AI 에이전트를 위한 교훈

**이 프로젝트를 이어받을 AI Agent는 다음 실수를 반복하지 않도록 주의하십시오:**

### 🛠 코드 수정 리스크 관리
1.  **컨텍스트 추측 금지**: 코드를 수정할 때(`replace_file_content`), 반드시 먼저 파일 전체를 읽으십시오(`view_file`). 이전 버전의 기억에 의존하지 마십시오.
    -   *실패 사례*: 라인 번호가 밀려 엉뚱한 곳을 삭제하거나 수정 실패함.
    -   *예방*: 수정 전 `grep_search`로 고유한 앵커(Anchor) 텍스트를 확인하십시오.
2.  **좀비 코드 방지**: 함수 전체를 교체할 때, 기존 함수 블록이 완전히 삭제되었는지 확인하십시오.
    -   *실패 사례*: 기존 `selectCurrency` 함수의 꼬리 부분이 파일 하단에 남아 문법 오류 발생.

### 🧠 로직 및 상태(State) 관리
3.  **상태 오염(State Pollution)**: 전역 상태 변수(`state.searchMode`)는 사용 후 반드시 초기화해야 합니다.
    -   *원칙*: `closeSearch`, `init` 같은 정리 함수에서 상태를 기본값으로 되돌리십시오.
4.  **UI와 로직의 분리**:
    -   *실패 사례*: 하나의 `openSearch` 함수로 두 개의 서로 다른 검색창(입력용/결과용)을 제어하려다 상태가 꼬임.
    -   *수정*: HTML 구조부터 분리(`targetSearchWrapper`)하고, 로직도 명확히 분기 처리함.

### 📱 모바일 퍼스트 마인드셋
5.  **터치 타겟**: 44x44px는 최소 터치 영역입니다. 텍스트 링크는 너무 작습니다.
    -   *원칙*: 텍스트 노드가 아닌, 넓은 컨테이너(div)에 이벤트를 바인딩하십시오.

---

## 7. 향후 로드맵

1.  **PWA 설치 유도**: `beforeinstallprompt` 이벤트를 처리하여 "홈 화면에 추가" 버튼 활성화.
2.  **다국어 지원 (i18n)**: UI 텍스트를 별도 객체로 분리하여 글로벌 지원 강화.
3.  **지출 분석 차트**: 영수증 관리자 모달 내에 간단한 카테고리별 지출 통계 그래프 추가.

---

*본 문서는 프로젝트의 현재 상태와 개발 방법론에 대한 유일한 진실 공급원(Single Source of Truth)입니다.*
