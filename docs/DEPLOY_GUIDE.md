# 배포 가이드 (Deployment Guide)

이 문서는 환율 계산기 웹앱과 백엔드(OCR)를 처음부터 끝까지 배포하는 과정을 설명합니다.

## 📋 사전 준비
배포를 시작하기 전에 다음 항목들이 준비되어 있어야 합니다.
1.  **Google 계정**: Cloud Console 및 Apps Script 사용을 위해 필요
2.  **GitHub 계정**: 웹앱 호스팅을 위해 필요

---

## 1️⃣ 단계: Google Cloud 설정 (API Key 발급)
Gemini API를 사용하기 위해 Google Cloud 프로젝트를 설정하고 키를 발급받아야 합니다.
*상세 내용은 별도 문서인 [`GOOGLE_CLOUD_SETUP.md`](./GOOGLE_CLOUD_SETUP.md)를 참고하세요.*

1.  Google Cloud Console에서 새 프로젝트 생성 (`Currency-OCR`)
2.  OAuth 동의 화면 설정 (User Type: 외부, 테스트 사용자 추가)
3.  **Generative Language API** (Gemini) 활성화
4.  API Key 생성 및 복사 (나중에 Apps Script에 입력해야 함)

---

## 2️⃣ 단계: 백엔드 배포 (Google Apps Script)
OCR 처리를 담당하는 서버리스 백엔드를 배포합니다.

### Step 1: 프로젝트 생성
1.  👉 [Google Apps Script 홈](https://script.google.com/home) 접속
2.  좌측 상단 **[+ 새 프로젝트]** 클릭
3.  프로젝트 제목을 `Currency OCR Backend`로 변경

### Step 2: 코드 입력
1.  편집기에서 `코드.gs` 파일의 기존 내용을 모두 지웁니다.
2.  로컬 프로젝트의 `backend/Code.gs` 내용을 복사하여 붙여넣습니다.
    *   (Tip: `backend/Code.gs` 파일을 열어 전체 복사하세요)

### Step 3: API 키 설정
1.  좌측 메뉴의 ⚙️ **프로젝트 설정** 아이콘 클릭
2.  아래로 스크롤하여 **스크립트 속성** 섹션 찾기
3.  **[스크립트 속성 추가]** 클릭
    *   **속성**: `GEMINI_API_KEY`
    *   **값**: (1단계에서 발급받은 API Key 붙여넣기)
4.  **[스크립트 속성 저장]** 클릭

### Step 4: 웹 앱으로 배포
1.  우측 상단 **[배포]** 버튼 → **[새 배포]** 선택
2.  좌측 톱니바퀴(⚙️) → **웹 앱** 선택
3.  설정 확인:
    *   **설명**: `v1.0 Initial Deploy`
    *   **다음 사용자 인증정보로 실행**: **나(Me)** (필수!)
    *   **액세스 권한이 있는 사용자**: **모든 사용자** (필수!)
4.  **[배포]** 클릭
5.  🔐 **권한 승인**: 팝업이 뜨면 '권한 검토' → 계정 선택 → '고급' → '...로 이동(안전하지 않음)' → '허용' 클릭
6.  🚀 **웹 앱 URL**이 생성되면 복사해 둡니다. (`https://script.google.com/.../exec`)

---

## 3️⃣ 단계: 프론트엔드 배포 (GitHub Pages)
사용자가 접속할 웹페이지를 배포합니다.

### Step 1: 백엔드 URL 연결
1.  로컬 프로젝트의 `app.js` 파일을 엽니다.
2.  상단 `CONFIG` 객체 내 `APPS_SCRIPT_URL` 값을 방금 복사한 URL로 교체합니다.
    ```javascript
    const CONFIG = {
        APPS_SCRIPT_URL: 'https://script.google.com/macros/s/..../exec', // 여기 교체
        // ...
    };
    ```

### Step 2: GitHub 업로드 (Push)
터미널에서 다음 명령어를 실행하여 변경 사항을 저장소에 올립니다.

```bash
# 1. 변경된 파일 스테이징
git add .

# 2. 커밋 (규칙 준수: 영문+한글)
git commit -m "chore: Update backend URL (백엔드 URL 업데이트)"

# 3. GitHub로 푸시
git push
```

### Step 3: GitHub Pages 활성화
1.  GitHub 리포지토리 페이지로 이동
2.  상단 **Settings** 탭 클릭
3.  좌측 메뉴 **Pages** 클릭
4.  **Build and deployment** > **Branch**를 `main`으로 설정하고 **Save** 클릭
5.  약 1~2분 후 상단에 생성된 **사이트 URL**을 확인합니다. (예: `https://username.github.io/Currency_WebApp`)

---

## 🎉 배포 완료!
이제 생성된 **GitHub Pages URL**로 접속하면, 앱이 정상적으로 동작합니다.
스마트폰 브라우저(Chrome/Safari)로 접속하여 '홈 화면에 추가'를 하면 앱처럼 사용할 수 있습니다.
