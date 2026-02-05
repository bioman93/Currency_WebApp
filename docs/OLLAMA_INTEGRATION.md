# Ollama 로컬 LLM 통합 가이드

현재 네이버/구글 API를 경유하는 방식과 달리, 로컬 LLM(Ollama)을 사용할 때는 **브라우저(앱)가 직접 사용자의 PC에 설치된 Ollama 서버와 통신**하는 방식(Direct Connection)을 사용해야 합니다. 
Googla Apps Script는 클라우드 서버이므로 사용자의 `localhost`에 접근할 수 없기 때문입니다.

## 1. 아키텍처 변화
- **기존**: 웹앱 -> Google Apps Script (최신 Gemini API 호출) -> 결과
- **로컬**: 웹앱 -> 공유기/내부망 (http://192.168.x.x:11434) -> PC의 Ollama -> 결과

## 2. 필수 준비 사항 (서버 설정)
Ollama는 기본적으로 외부(웹 브라우저 포함)에서의 접속을 차단하므로, 두 가지 설정이 필수입니다.

### A. CORS 설정 (가장 중요)
웹앱이 Ollama 서버에 접속할 수 있도록 허용해야 합니다.

**Windows (PowerShell)**:
```powershell
[Environment]::SetEnvironmentVariable("OLLAMA_ORIGINS", "*", "User")
# 설정 후 Ollama 트레이 아이콘 우클릭 -> Quit 후 다시 실행
```

**Mac/Linux**:
```bash
launchctl setenv OLLAMA_ORIGINS "*"
# 또는
export OLLAMA_ORIGINS="*"
```

### B. 멀티모달(Vision) 모델 설치
일반 텍스트 모델(Gemma, Llama3)은 이미지를 볼 수 없습니다. 반드시 **Vision 기능이 있는 모델**을 받아야 합니다.
- **추천**: `llama3.2-vision` (최신, 성능 좋음) 또는 `llava` (전통적인 Vision 모델)

```bash
ollama pull llama3.2-vision
```

## 3. 앱 (app.js) 수정 가이드
앱에 "로컬 모드"를 추가하려면 다음과 같은 기능을 구현해야 합니다.

### UI 변경
1. **설정 화면**에 'AI 공급자' 선택지 추가 (Google Gemini / Local Ollama)
2. **Ollama 서버 주소** 입력 필드 추가 (기본값: `http://localhost:11434`)
3. **모델 이름** 입력 필드 추가 (기본값: `llama3.2-vision`)

### 코드 로직 (`callOllamaOCR` 함수 예시)
Ollama API 포맷에 맞춰 전송해야 합니다.

```javascript
async function callOllamaOCR(base64Image) {
    const url = localStorage.getItem('ollama_url') || 'http://localhost:11434';
    const model = localStorage.getItem('ollama_model') || 'llama3.2-vision';
    
    // 프롬프트 구성 (영어 권장)
    const prompt = "Analyze this receipt/price tag. Return JSON with total and currency.";

    const response = await fetch(`${url}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: model,
            prompt: prompt,
            images: [base64Image], // Base64 그대로 전송
            stream: false,         // 한번에 받기
            format: "json"         // JSON 모드 (지원 모델만)
        })
    });

    return await response.json();
}
```

## 4. 장단점 비교
| 구분 | Gemini (현재) | Ollama (로컬) |
| :--- | :--- | :--- |
| **비용** | 무료 (하루 제한 있음) | **완전 무료 (무제한)** |
| **속도** | 빠름 (2.5 Flash 기준) | PC 성능에 따라 다름 (GPU 필수) |
| **접근성** | 어디서나 접속 가능 | **같은 와이파이 내에서만 가능** (외부 접속 시 복잡) |
| **설정** | 배포만 하면 끝 | 각 PC마다 CORS 설정 필요 |

---
**💡 제안**: 
앱 설정을 복잡하게 만들지 않으려면, 현재의 `Code.gs` 방식은 그대로 두고(외부용), **"집에서 쓸 때"를 위한 [고급 설정]** 메뉴를 만들어 Ollama 주소를 입력받게 하는 것이 좋습니다.
원하신다면 이 기능을 `app.js`에 바로 추가해 드릴 수 있습니다.
