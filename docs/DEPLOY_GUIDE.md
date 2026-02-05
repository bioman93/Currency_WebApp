# 2단계 배포 가이드

## 📦 배포할 것들

| 구분 | 무엇을 | 어디에 |
| :--- | :--- | :--- |
| **웹 앱** | 환율 계산기 (index.html 등) | GitHub Pages |
| **백엔드** | Gemini OCR + Sheets 저장 | Google Apps Script |

---

## 1️⃣ 웹 앱 배포 (GitHub)

기존과 동일합니다. 수정된 파일들을 GitHub에 push하면 됩니다.

```bash
cd C:\Users\김용석\.gemini\antigravity\playground\obsidian-feynman
git add .
git commit -m "feat: Add Google Sign-In and OCR UI"
git push
```

배포 URL: `https://bioman93.github.io/Currency_WebApp`

---

## 2️⃣ Apps Script 배포 (백엔드)

### Step 1: Apps Script 프로젝트 만들기

1. 👉 [Apps Script 바로가기](https://script.google.com/home) 클릭
2. **[+ 새 프로젝트]** 버튼 클릭
3. 좌측 상단 "제목 없는 프로젝트" 클릭 → `Currency OCR Backend` 로 이름 변경

### Step 2: 코드 붙여넣기

1. 기본으로 열린 `코드.gs` 파일의 내용을 전부 삭제
2. 아래 코드를 복사해서 붙여넣기:

[Code.gs 파일 내용](file:///C:/Users/김용석/.gemini/antigravity/brain/e021b23a-b7e4-468b-9011-e83fd971a1a3/Code.gs)

### Step 3: API 키 설정

1. 좌측 메뉴에서 ⚙️ **프로젝트 설정** 클릭
2. 아래로 스크롤 → **스크립트 속성** 섹션
3. **[스크립트 속성 추가]** 클릭
   - **속성**: `GEMINI_API_KEY`
   - **값**: `AIzaSyBdAhL4HQUS2RegNLLvfSsEjaqHyE6prfM` (본인 키)
4. **[스크립트 속성 저장]** 클릭

### Step 4: 웹 앱으로 배포

1. 상단 메뉴에서 **[배포]** → **[새 배포]** 클릭
2. ⚙️ 톱니바퀴 아이콘 클릭 → **웹 앱** 선택
3. 설정:
   - **설명**: `Currency OCR v1`
   - **다음 사용자 인증정보로 실행**: **나** 선택
   - **액세스 권한이 있는 사용자**: **모든 사용자** 선택
4. **[배포]** 클릭
5. ⚠️ 권한 승인 팝업이 뜨면:
   - "고급" 클릭 → "Currency OCR Backend (안전하지 않음)으로 이동" 클릭
   - 권한 허용
6. **웹 앱 URL 복사** (예: `https://script.google.com/macros/s/XXXXX.../exec`)

---

## 3️⃣ 연결하기

URL을 복사해서 저(AI)에게 알려주시면, `app.js`에 연동하는 코드를 추가해 드리겠습니다!

---

## ✅ 체크리스트

- [ ] GitHub에 코드 push 완료
- [ ] Apps Script 프로젝트 생성
- [ ] Code.gs 붙여넣기 완료
- [ ] GEMINI_API_KEY 스크립트 속성에 추가
- [ ] 웹 앱으로 배포 완료
- [ ] 웹 앱 URL 복사해서 전달
