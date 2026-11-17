# Ollama 로컬 LLM 통합 가이드

가격표·영수증 AI 판독은 **맥북의 Ollama를 먼저 쓰고, 안 되면 Gemini로 넘어갑니다.**
판독 엔진은 `local-llm.js`가, 엔진 선택과 폴백은 `app.js`의 `callOCR`이 담당합니다.

## 1. 구조

```
폰 앱 (https://bioman93.github.io/Currency_WebApp)
  ├─ ① 맥북 시도: Tailscale 망 → https://macbookpro.tailfbbdb4.ts.net/ollama
  │               → tailscale serve → Host 재작성 프록시(127.0.0.1:11435) → Ollama(127.0.0.1:11434)
  └─ ② 실패 시:  Google Apps Script(backend/Code.gs) → Gemini 2.5 Flash
```

- **브라우저가 맥북을 직접 호출합니다.** Apps Script는 구글 클라우드에서 돌기 때문에 Tailscale 망에 있는 맥북에 닿지 못합니다.
- **HTTPS로 호출합니다.** 앱이 HTTPS 페이지라서 `http://` 주소를 부르면 브라우저가 차단합니다(혼합 콘텐츠). 그래서 Tailscale이 발급한 인증서로 HTTPS를 씁니다.
- **같은 Wi-Fi(LAN)에는 열지 않습니다.** Ollama는 127.0.0.1에만 열려 있고, 외부 접근은 Tailscale 망 안으로 제한됩니다.

## 2. 동작 규칙 (`callOCR`)

1. **도달 확인** (`/api/version`, 3초 제한): 맥북이 꺼져 있거나 폰의 Tailscale이 꺼져 있으면 여기서 실패하고, 곧바로 Gemini로 넘어갑니다.
2. **판독** (`/api/chat`, 90초 제한):
   - 모델은 `qwen3.8:27b`(비전 지원)입니다.
   - JSON 스키마로 출력 형식을 강제하고, thinking은 끄고, temperature는 0으로 둡니다.
   - 프롬프트는 `backend/Code.gs`와 같은 문구라서 두 엔진의 결과 형식이 같습니다.
3. **실패하면 Gemini로 넘어갑니다.** 어느 단계든 실패하면 기존 `callGeminiOCR`을 호출합니다. 콘솔에 `[OCR] 맥북 로컬 LLM 실패 → Gemini로 전환` 경고가 남습니다.
4. **사용한 엔진을 표시합니다.** 영수증 결과 화면에 `✅ 분석 완료 (맥북 AI)` 또는 `(Gemini)`로 나옵니다.

맥북 경로를 끄려면 `local-llm.js`에서 `LOCAL_LLM.ENABLED`를 `false`로 바꿉니다.

## 3. 맥북 쪽 설정 (2026-11-17 적용됨)

| 항목 | 내용 |
|---|---|
| HTTPS 경로 | `tailscale serve --bg --https=443 --set-path=/ollama http://127.0.0.1:11435` |
| Host 재작성 프록시 | `~/Works/LocalLLM/ollama_host_proxy.py`, LaunchAgent `com.foxibear.ollama-proxy` |
| CORS 허용 | `OLLAMA_ORIGINS=https://bioman93.github.io` (LaunchAgent `com.ollama.origins`) |
| 모델 상주 | `OLLAMA_KEEP_ALIVE=-1` |

**프록시가 필요한 이유:** Ollama는 127.0.0.1에만 열려 있을 때 낯선 호스트 이름(`*.ts.net`)이 붙은 요청을 403으로 거부합니다. DNS 리바인딩 공격을 막기 위한 동작입니다. 그래서 프록시가 Host 헤더만 `localhost`로 바꿔 Ollama에 넘깁니다.

**프록시의 접근 제한 (2026-11-17 보안 검토):** 프록시가 Host를 바꾸면 Ollama 자체의 방어가 무력화되므로, 프록시가 아래 세 가지를 직접 검사합니다.
- **Host**: `macbookpro.tailfbbdb4.ts.net`만 받습니다. DNS 리바인딩 공격을 막습니다.
- **사용자**: `tailscale serve`가 붙이는 `Tailscale-User-Login`이 본인 계정이어야 합니다. 이 값은 Tailscale이 직접 채우므로 위조할 수 없습니다.
- **경로**: `GET /api/version`, `POST /api/chat`과 각각의 프리플라이트(OPTIONS)만 통과시킵니다. 모델 목록 조회·삭제·다운로드는 차단합니다.

## 4. 사용 조건과 제약

- **폰에서 Tailscale 앱이 켜져 있어야 합니다.** 꺼져 있으면 3초 안에 Gemini로 넘어갑니다.
- **맥북이 켜져 있고 잠자기가 아니어야 합니다.** 전원을 연결하고 뚜껑을 열어 둡니다.
- **`standalone.html`을 파일로 열면 항상 Gemini를 씁니다.** 파일로 열면 페이지 출처가 `null`이라 CORS가 허용되지 않기 때문입니다.
- **Chrome에서 처음 호출할 때 권한 확인 창이 뜰 수 있습니다.** 공개 사이트가 사설망 주소(100.x)를 호출하는 것이라서 "로컬 네트워크 접근" 허용을 물을 수 있습니다. 이때 허용해야 맥북 경로가 동작합니다.

## 5. 시험 결과 (2026-11-17, M5 Pro 48GB, qwen3.8:27b)

| 입력 | 결과 | 소요 |
|---|---|---|
| 유로 가격표 `€ 2,90` | total 2.9, currency € | 7.8초 (HTTPS 경유, 이미지 원본) |
| 일본 편의점 영수증 (4품목, 합계 ¥968) | 상호·날짜·합계·결제수단 정확, 품목 한국어 번역 | 8.6초 |
| 태국 가격표 `฿ 120` (앱 경로, 브라우저) | THB 120 | 1.8초 |
| 맥북 도달 불가 (호스트 없음 / 무응답) | Gemini로 전환 | 0.0초 / 3.0초 |

## 6. 비교

| 구분 | 맥북 Ollama | Gemini |
|---|---|---|
| 비용·한도 | 무료, 한도 없음 | 무료, 하루 한도 있음 |
| 사진 데이터 | 내 맥북에만 감 | 구글로 전송 |
| 속도 | 2~9초 (시험 기준) | 빠름 |
| 해외에서 | 집 맥북과 폰 Tailscale 상태에 좌우됨 | 항상 동작 |
