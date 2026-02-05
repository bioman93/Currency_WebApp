# 환율 계산기 앱 개발 태스크

## 프로젝트 개요
모바일 최적화된 환율 계산기 웹앱 개발 (Android/iOS 호환)

## 태스크 목록

### 설계 및 계획
- [x] 요구사항 분석 및 기술 스택 결정
- [x] 구현 계획서 작성 및 사용자 승인

### 검증
- [x] 개발 서버 실행 (http://localhost:3000)
- [x] 브라우저 테스트 (수동 검증 완료)

### UI/UX 구현
- [x] 반응형 레이아웃 설계 (화면 회전/폴더블 대응)
- [x] 메인 계산기 UI 컴포넌트 개발 (천단위 자동 콤마 적용)
- [x] 국가/화폐 선택 UI 개선 (하단 배치, 클릭 시 검색창 전환, 심플한 리스트 뷰)
- [x] 옵션 입력 UI UX 개선 (초기값 제거, 자동 콤마 포맷팅)
- [x] 모바일 입력창 오버플로우 수정 (최소 너비 설정)

### 핵심 기능 구현
- [x] 위치 기반 국가 자동 감지 기능
    - [x] Fix: Prevent overwriting "Home Currency" when location changes.
    - [x] Fix: Prevent "Refresh Rate" from overwriting Home Currency with Source Currency.
- [x] **Add Reverse Exchange (KRW Input)**
    - [x] Add 'KRW' to `CURRENCY_NAMES` & `targetCurrency` state.
    - [x] Implement Manual Selection for "My Currency" (User can click result to change).
    - [x] Foreigner Mode: Input KRW -> Result in Home Currency.
    - [x] Fix Mobile Touch Unresponsiveness (attached listeners to container divs).
    - [x] **Implement Separate Target Currency Search UI (Result overlay)**
        - [x] Clone search wrapper HTML into `#resultSection`.
        - [x] Separate logic in `app.js` (no side effects on Source Currency).
        - [x] Add absolute overlay styling in `styles.css`.
        - [x] Refine UI: "Embedded" look (class `target-search-overlay`).
- [x] Restore Exchange Rate Display (1 Source = X Target).
- [x] Separate UI for "Price Scan" vs "Receipt Manager"
    - [x] Create Receipt Manager Modal in `index.html`
    - [x] Add Receipt Icon to Header (Fixed layout/click functionality)
    - [x] Split `scanPriceTag` (fast, no save) and `scanReceipt` (detailed, save) logic in `app.js`
- [x] Connect Receipt Manager to Apps Script 'receipt' mode
    - [x] Differentiate modes in `callGeminiOCR`
    - [x] Handle detailed result display (Korean translation, category, etc.)
    - [x] Fix: Receipt Icon Layout (Reverted to Flexbox/Centered) & Click Unresponsiveness.
    - [x] UI Refactor: Consolidated Header Icons into "Hamburger Menu" (Login/Receipt/Refresh/Info).
- [/] Finalize and Test
    - [x] Rebuild `standalone.html`
    - [x] User Verification of Receipt Save functionality
    - [x] Fix: Receipt Button responsiveness, Currency Auto-Switch, Clear Button visibility
    - [x] Enhancement: Map Currency Symbols (e.g. ¥, €, ฿) to ISO Codes for auto-switch(README, LICENSE)
- [x] 네이버 환율 API 연동 (다중 프록시, 백업 API, 오프라인 폴백 적용)
- [x] 오프라인 지원 화폐 목록 확장 (남아공, 러시아, 브라질 등 추가)
- [x] 환율 계산 로직 구현
- [x] 실시간 계산 결과 표시
- [x] 동적 화폐 목록 및 검색 기능 구현
- [x] 로컬 캐싱 구현 (로밍 데이터 절약)
- [x] 앱 실행 시 위치 자동 감지 적용
- [x] API 연결 안정성 강화 (백업 전환 조건 완화)

### 배포 및 전달
- [x] PWA 설정 (아이콘, manifest.json)
- [x] 단독 실행 파일 변환 (standalone.html)
- [x] GitHub 저장소 문서화 (README, LICENSE)

### 추가 기능 개발 (Refinements)
- [x] 입력 필드 'Clear' (C) 버튼 추가 및 스타일 개선
- [x] 추가 옵션(팁/세금) 설정값 영구 저장 (localStorage)
- [x] 서비스차지 '합산(Total)' 모드 추가 및 자동 역산 로직 구현
- [x] 합산 모드 입력 검증 로직 (Alert & Focus 유지)
- [x] 서비스차지 요율 상세 표기 (%, 정액, 합산)

### 추가 개선 (Refinements Phase 2)
- [x] Eurozone 국가(프랑스 등) 위치 감지 시 'EUR' 자동 선택 (EUROZONE_COUNTRIES 매핑)
- [x] 앱 초기 실행 시 감지된 위치 화폐 자동 선택 (Race Condition 해결)
- [x] 화폐 변경 시 '정액/합산' 옵션 값 자동 초기화 (Reset Logic)
- [x] 화폐 변경 시 '정액/합산' 옵션의 화폐 단위 표기 즉시 갱신
- [x] 모바일 화폐 검색창 배경 비침 현상 수정 (CSS z-index)
- [x] 캐시 사용 시 위치 기반 화폐 자동 선택 로직 누락 수정 (Cache Logic Fix)
- [x] 화면 하단 정보(Footer) 위치 고정 및 스크롤 안정화 (App Shell Layout)

## 1단계: 가격표 사진 인식 (OCR)
- [x] 모바일 디바이스 감지 로직 구현
- [x] 카메라 촬영 UI 추가 (모바일 전용)
- [x] Tesseract.js CDN 동적 로드
- [x] 가격 패턴 추출 로직 구현
- [x] OCR 결과 → 입력란 자동 적용
- [ ] 브라우저 테스트 (PC/모바일)
- [x] 타임존 기반 위치 감지로 변경 (GPS 제거, 프라이버시 향상)

## 2단계: 고급 기능 (로그인 필요)
- [x] Google Cloud 프로젝트 및 OAuth 설정
- [x] Google Sign-In UI 추가 (헤더)
- [x] 로그인 상태 관리 및 UI 토글
- [x] 카메라 버튼 로그인 게이팅
- [x] Apps Script 백엔드 생성 (Gemini 2.5 Flash 적용)
- [x] Gemini API OCR 연동 (다중 모델 폴백 구현)
- [x] 한국어 출력 최적화
- [x] Google Sheets 저장 기능
- [x] 테스트 및 배포 (완료)
