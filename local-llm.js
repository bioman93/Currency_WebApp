/**
 * 로컬 LLM(맥북 Ollama) OCR 서비스
 *
 * 가격표·영수증 판독을 맥북의 Ollama(qwen3.8:27b, 비전 지원)로 먼저 시도한다.
 * 브라우저가 Tailscale 망을 통해 맥북에 직접 HTTPS로 접속한다
 * (Apps Script는 클라우드에서 돌아 tailnet에 닿지 못한다).
 * 맥북이 꺼져 있거나 폰의 Tailscale이 꺼져 있으면 빠르게 실패하고,
 * 호출부(app.js의 callOCR)가 Gemini(Apps Script)로 넘어간다.
 *
 * 맥북 쪽 준비: tailscale serve(https /ollama) → 127.0.0.1:11435 Host 재작성 프록시 → Ollama,
 * OLLAMA_ORIGINS=https://bioman93.github.io
 */

const LOCAL_LLM = {
    ENABLED: true,
    BASE_URL: 'https://macbookpro.tailfbbdb4.ts.net/ollama',
    MODEL: 'qwen3.8:27b',
    PROBE_TIMEOUT: 3000,     // ms: 맥북에 닿는지 확인. 안 닿으면 곧바로 Gemini로 넘어간다
    GENERATE_TIMEOUT: 90000  // ms: 판독 응답 대기 상한
};

// 프롬프트는 backend/Code.gs(Gemini)와 같은 문구를 쓴다. 결과 형식을 두 경로에서 맞추기 위해서다.
const LOCAL_OCR_PROMPTS = {
    receipt: "Analyze this receipt image. Return a JSON object with these fields: store (string), date (YYYY-MM-DD), total (number), currency (string - extract symbol like $, ¥, € or code), paymentMethod (string), items (array of {name, price}). Rule: Translate item names to Korean.",
    price_tag: "Analyze this price tag image. Return a JSON object with fields: 'total' (number) and 'currency' (string). Rules: 1. Extract the currency symbol EXACTLY as seen (e.g. ¥, $, €, ฿, ₩). 2. If no symbol is visible, try to infer ISO code. 3. Return only the numeric value for total. 4. Ignore other text."
};

// Ollama 구조화 출력(JSON 스키마)으로 형식을 강제한다.
const LOCAL_OCR_SCHEMAS = {
    receipt: {
        type: 'object',
        properties: {
            store: { type: 'string' },
            date: { type: 'string' },
            total: { type: 'number' },
            currency: { type: 'string' },
            paymentMethod: { type: 'string' },
            items: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: { name: { type: 'string' }, price: { type: 'number' } },
                    required: ['name', 'price']
                }
            }
        },
        required: ['store', 'date', 'total', 'currency', 'paymentMethod', 'items']
    },
    price_tag: {
        type: 'object',
        properties: {
            total: { type: 'number' },
            currency: { type: 'string' }
        },
        required: ['total', 'currency']
    }
};

async function fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal, cache: 'no-store' });
    } catch (e) {
        if (e.name === 'AbortError') throw new Error(`${Math.round(timeoutMs / 1000)}초 안에 응답이 없습니다`);
        throw e;
    } finally {
        clearTimeout(timer);
    }
}

// 반환 형식은 Apps Script 응답과 같다: { success, data, usedModel } / { success: false, error }
async function callLocalOCR(base64Image, mode) {
    const kind = mode === 'receipt' ? 'receipt' : 'price_tag';

    // 1) 도달 확인: 맥북·Tailscale이 꺼져 있으면 여기서 몇 초 안에 끝난다
    const probe = await fetchWithTimeout(`${LOCAL_LLM.BASE_URL}/api/version`, {}, LOCAL_LLM.PROBE_TIMEOUT);
    if (!probe.ok) throw new Error(`맥북 응답 오류 (HTTP ${probe.status})`);

    // 2) 판독
    const response = await fetchWithTimeout(`${LOCAL_LLM.BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: LOCAL_LLM.MODEL,
            messages: [{ role: 'user', content: LOCAL_OCR_PROMPTS[kind], images: [base64Image] }],
            format: LOCAL_OCR_SCHEMAS[kind],
            think: false,
            stream: false,
            options: { temperature: 0 }
        })
    }, LOCAL_LLM.GENERATE_TIMEOUT);

    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`맥북 판독 실패 (HTTP ${response.status}) ${detail.slice(0, 200)}`);
    }

    const result = await response.json();
    const text = (result.message && result.message.content) || '';
    const data = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
    return { success: true, data, usedModel: `local:${LOCAL_LLM.MODEL}` };
}
