/**
 * 환율 계산기 앱 - Currency Exchange Calculator
 * 대한민국 원화(KRW) 기준 실시간 환율 계산
 */

// ===================================
// Configuration & Constants
// ===================================

const CONFIG = {
    // 환율 데이터 소스 (모두 CORS 허용 → 프록시 불필요). 앞에서부터 순서대로 시도.
    RATE_SOURCES: [
        { name: 'Global Standard API', url: 'https://open.er-api.com/v6/latest/KRW', type: 'erapi' },
        { name: 'Currency API (jsDelivr)', url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/krw.min.json', type: 'fawaz' },
        { name: 'Currency API (Cloudflare)', url: 'https://latest.currency-api.pages.dev/v1/currencies/krw.min.json', type: 'fawaz' }
    ],
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxHQoBuTpCGUVbsqsR7n7i8lGw5SS35eGg1ptJlmPkGI5oXwQ_fyk5sJcdVShct24kA/exec',
    UPDATE_INTERVAL: 0,
    CACHE_KEY: 'exchange_rates_cache_v3',
    CACHE_MAX_AGE: 6 * 60 * 60 * 1000, // ms: 다음 업데이트 시각을 모를 때 캐시 유효 시간 (6시간)
    FETCH_TIMEOUT: 5000,   // ms: 소스별 요청 타임아웃
    ALERT_DELAY: 100       // ms: 모바일 blur 렌더링 후 alert 표시 지연
};

// 앱 정보 — 기능을 바꾸면 버전·날짜·기능 목록을 함께 갱신한다 (메뉴 > 앱 정보에 표시)
const APP_INFO = {
    NAME: '환율 계산기',
    VERSION: '1.6',
    UPDATED: '2026-11-17',
    FEATURES: [
        '실시간 환율 (여러 소스 자동 전환, 오프라인 기본값)',
        '가격표·영수증 AI 판독 (맥북 로컬 AI 우선, Gemini 보조)',
        '영수증 가계부 저장 (Google 로그인)',
        '자동 위치 감지'
    ],
    CREDIT: 'Developed by Antigravity'
};

// 오프라인 기본 환율 (네트워크가 전혀 안 될 때만 사용)
// 형식: 1 KRW = rates[code] 외화. 2026-11-16 기준 ExchangeRate-API 값.
const FALLBACK_DATA = {
    "result": "success",
    "date": "2026-11-16",
    "rates": {
        "USD": 0.000749,
        "EUR": 0.000678,
        "JPY": 0.119563,
        "CNY": 0.005002,
        "HKD": 0.005868,
        "TWD": 0.024642,
        "GBP": 0.000566,
        "CAD": 0.001067,
        "CHF": 0.000627,
        "SEK": 0.007525,
        "AUD": 0.001104,
        "NZD": 0.001354,
        "CZK": 0.016525,
        "TRY": 0.037661,
        "MXN": 0.013872,
        "PLN": 0.002986,
        "AED": 0.00275,
        "SGD": 0.000963,
        "THB": 0.025356,
        "MYR": 0.003057,
        "IDR": 13.640508,
        "VND": 19.23468,
        "PHP": 0.047882,
        "RUB": 0.061754,
        "ZAR": 0.012667,
        "BRL": 0.004237,
        "INR": 0.070668,
        "SAR": 0.002808,
        "KWD": 0.000231,
        "BHD": 0.000282,
        "QAR": 0.002725,
        "EGP": 0.039968,
        "HUF": 0.247492,
        "DKK": 0.00506,
        "NOK": 0.007152,
        "ILS": 0.002404,
        "JOD": 0.000531,
        "PKR": 0.207113,
        "BDT": 0.09348,
        "MNT": 2.70014,
        "KZT": 0.333257,
        "BND": 0.000964
    }
};

const CURRENCY_NAMES = {
    'KRW': { name: '대한민국 원', nation: '한국' },
    'USD': { name: '미국 달러', nation: '미국' },
    'EUR': { name: '유럽 유로', nation: '유럽연합' },
    'JPY': { name: '일본 엔', nation: '일본' },
    'CNY': { name: '중국 위안', nation: '중국' },
    'HKD': { name: '홍콩 달러', nation: '홍콩' },
    'TWD': { name: '대만 달러', nation: '대만' },
    'GBP': { name: '영국 파운드', nation: '영국' },
    'CAD': { name: '캐나다 달러', nation: '캐나다' },
    'CHF': { name: '스위스 프랑', nation: '스위스' },
    'SEK': { name: '스웨덴 크로나', nation: '스웨덴' },
    'AUD': { name: '호주 달러', nation: '호주' },
    'NZD': { name: '뉴질랜드 달러', nation: '뉴질랜드' },
    'CZK': { name: '체코 코루나', nation: '체코' },
    'TRY': { name: '튀르키예 리라', nation: '튀르키예' },
    'MXN': { name: '멕시코 페소', nation: '멕시코' },
    'PLN': { name: '폴란드 즈워티', nation: '폴란드' },
    'AED': { name: 'UAE 디르함', nation: '아랍에미리트' },
    'SGD': { name: '싱가포르 달러', nation: '싱가포르' },
    'THB': { name: '태국 바트', nation: '태국' },
    'MYR': { name: '말레이시아 링깃', nation: '말레이시아' },
    'IDR': { name: '인도네시아 루피아', nation: '인도네시아' },
    'VND': { name: '베트남 동', nation: '베트남' },
    'PHP': { name: '필리핀 페소', nation: '필리핀' },
    'RUB': { name: '러시아 루블', nation: '러시아' },
    'ZAR': { name: '남아공 랜드', nation: '남아프리카공화국' },
    'BRL': { name: '브라질 레알', nation: '브라질' },
    'INR': { name: '인도 루피', nation: '인도' },
    'SAR': { name: '사우디 리얄', nation: '사우디아라비아' },
    'KWD': { name: '쿠웨이트 디나르', nation: '쿠웨이트' },
    'BHD': { name: '바레인 디나르', nation: '바레인' },
    'QAR': { name: '카타르 리얄', nation: '카타르' },
    'EGP': { name: '이집트 파운드', nation: '이집트' },
    'HUF': { name: '헝가리 포린트', nation: '헝가리' },
    'DKK': { name: '덴마크 크로네', nation: '덴마크' },
    'NOK': { name: '노르웨이 크로네', nation: '노르웨이' },
    'ILS': { name: '이스라엘 셰켈', nation: '이스라엘' },
    'JOD': { name: '요르단 디나르', nation: '요르단' },
    'PKR': { name: '파키스탄 루피', nation: '파키스탄' },
    'BDT': { name: '방글라데시 타카', nation: '방글라데시' },
    'MNT': { name: '몽골 투그릭', nation: '몽골' },
    'KZT': { name: '카자흐스탄 텡게', nation: '카자흐스탄' },
    'BND': { name: '브루나이 달러', nation: '브루나이' }
};

// ===================================
// State & Elements
// ===================================

const state = {
    exchangeRates: {},
    currencyList: [],
    lastUpdated: null,
    selectedCurrency: 'USD',
    targetCurrency: 'KRW', // Default Target
    searchMode: 'source', // 'source' (Input) or 'target' (Output)
    serviceChargeType: 'percent',
    isOptionsOpen: false,
    isSearchOpen: false,
    detectedTimeZone: null,
    // Option values are now persistent
    options: {
        serviceCharge: 0,
        taxRate: 0,
        feeRate: 0
    }
};

const elements = {
    currencyDisplay: document.getElementById('currencyDisplay'),
    selectedCurrencyText: document.getElementById('selectedCurrencyText'),
    currencySearchWrapper: document.getElementById('currencySearchWrapper'),
    currencySearchInput: document.getElementById('currencySearchInput'),
    closeSearchBtn: document.getElementById('closeSearchBtn'),
    currencyOptionsList: document.getElementById('currencyOptionsList'),
    currentRateDisplay: document.getElementById('currentRateDisplay'),
    detectLocationBtn: document.getElementById('detectLocationBtn'),
    localAmount: document.getElementById('localAmount'),
    currencySymbol: document.getElementById('currencySymbol'),
    optionsToggle: document.getElementById('optionsToggle'),
    optionsContent: document.getElementById('optionsContent'),
    toggleIcon: document.getElementById('toggleIcon'),
    serviceCharge: document.getElementById('serviceCharge'),
    serviceChargeUnit: document.getElementById('serviceChargeUnit'),
    tipPercentBtn: document.getElementById('tipPercentBtn'),
    tipFixedBtn: document.getElementById('tipFixedBtn'),
    tipTotalBtn: document.getElementById('tipTotalBtn'),
    taxRate: document.getElementById('taxRate'),
    feeRate: document.getElementById('feeRate'),
    resultValue: document.getElementById('resultValue'),
    resultLabel: document.getElementById('resultLabel'),
    resultSymbol: document.getElementById('resultSymbol'),
    resultAmount: document.getElementById('resultAmount'),
    resultSection: document.getElementById('resultSection'),
    resultBreakdown: document.getElementById('resultBreakdown'),
    // Target Search UI
    targetSearchWrapper: document.getElementById('targetSearchWrapper'),
    targetSearchInput: document.getElementById('targetSearchInput'),
    targetCloseBtn: document.getElementById('targetCloseBtn'),
    targetOptionsList: document.getElementById('targetOptionsList'),

    rateUpdateTime: document.getElementById('rateUpdateTime'),

    // Menu Elements
    mainMenuBtn: document.getElementById('mainMenuBtn'),
    mainMenuDropdown: document.getElementById('mainMenuDropdown'),
    menuProfileSection: document.getElementById('menuProfileSection'),
    menuUserAvatar: document.getElementById('menuUserAvatar'),
    menuUserName: document.getElementById('menuUserName'),
    menuUserEmail: document.querySelector('.menu-user-email'),

    // Menu Items
    menuItemReceipt: document.getElementById('menuItemReceipt'),
    menuItemLogin: document.getElementById('menuItemLogin'),
    menuItemRefresh: document.getElementById('menuItemRefresh'),
    menuItemAppInfo: document.getElementById('menuItemAppInfo'),
    menuItemLogout: document.getElementById('menuItemLogout'),

    cameraLockedMsg: document.getElementById('cameraLockedMsg'),

    // OCR & Receipt Elements
    cameraSection: document.getElementById('cameraSection'),
    cameraBtn: document.getElementById('cameraBtn'),
    cameraInput: document.getElementById('cameraInput'),

    // Receipt Manager

    receiptModal: document.getElementById('receiptModal'),
    receiptCameraBtn: document.getElementById('receiptCameraBtn'),
    receiptInput: document.getElementById('receiptInput'),
    receiptUploadBtn: document.getElementById('receiptUploadBtn'),
    receiptUploadInput: document.getElementById('receiptUploadInput'),
    receiptResult: document.getElementById('receiptResult'),
    receiptStatus: document.getElementById('receiptStatus'),
    receiptPreview: document.getElementById('receiptPreview'),
    saveReceiptBtn: document.getElementById('saveReceiptBtn')
};



// ===================================
// Auth Logic
// ===================================

const authState = {
    isLoggedIn: false,
    user: null,
    credential: null
};

// Global function for Google Sign-In callback
window.handleCredentialResponse = function (response) {
    if (response.credential) {
        // Decode JWT (simple decoding for display, verification should be on backend)
        const responsePayload = decodeJwtResponse(response.credential);

        authState.isLoggedIn = true;
        authState.user = responsePayload;
        authState.credential = response.credential;

        updateMenuState(true, responsePayload);
    }
};

function decodeJwtResponse(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

function updateMenuState(isLoggedIn, user = null) {
    if (isLoggedIn && user) {
        // Show Profile Section
        if (elements.menuProfileSection) {
            elements.menuProfileSection.style.display = 'flex';
            elements.menuUserAvatar.src = user.picture;
            elements.menuUserName.textContent = user.given_name || user.name;
            if (elements.menuUserEmail) elements.menuUserEmail.textContent = user.email || 'Logged in via Google';
        }

        // Show Logged In Items
        if (elements.menuItemReceipt) elements.menuItemReceipt.style.display = 'flex';
        if (elements.menuItemLogout) elements.menuItemLogout.style.display = 'flex';

        // Hide Login Item
        if (elements.menuItemLogin) elements.menuItemLogin.style.display = 'none';

        // Show Camera Section (Visible on all devices when logged in)
        if (elements.cameraSection) elements.cameraSection.style.display = 'flex';
        if (elements.cameraLockedMsg) elements.cameraLockedMsg.style.display = 'none';

    } else {
        // Hide Profile Section
        if (elements.menuProfileSection) elements.menuProfileSection.style.display = 'none';

        // Hide Logged In Items
        if (elements.menuItemReceipt) elements.menuItemReceipt.style.display = 'none';
        if (elements.menuItemLogout) elements.menuItemLogout.style.display = 'none';

        // Show Login Item
        // Note: Google Button handles its own display, but we wrap it in an LI
        if (elements.menuItemLogin) elements.menuItemLogin.style.display = 'flex';

        // Hide Camera, Show Lock Msg
        if (elements.cameraSection) elements.cameraSection.style.display = 'none';
        if (elements.cameraLockedMsg) {
            // Only show lock message on mobile or where relevant
            elements.cameraLockedMsg.style.display = 'block';
        }
    }
}

// 메뉴 열기. 로그아웃 상태면 Google 로그인 버튼이 제대로 그려져 있는지 확인한다
function openMainMenu() {
    if (!elements.mainMenuDropdown) return;
    elements.mainMenuDropdown.style.display = 'block';
    if (!authState.isLoggedIn) ensureLoginButton();
}

// Google 로그인 버튼 보장.
// 첫 실행에 One Tap 로그인 창을 닫으면 Google이 한동안 그 창을 다시 띄우지 않는다.
// 그래서 메뉴의 로그인 버튼이 유일한 재로그인 경로다. 이 버튼은 숨겨진 상태(display:none)에서
// 그려지면 크기가 0이 될 수 있으므로, 보이는 상태에서 버튼이 없거나 크기가 0이면 다시 그린다.
function ensureLoginButton() {
    const container = document.querySelector('#menuItemLogin .g_id_signin');
    if (!container || !(window.google && google.accounts && google.accounts.id)) return;
    const button = container.querySelector('[role="button"]');
    if (button && button.offsetWidth > 0) return;
    container.innerHTML = '';
    google.accounts.id.renderButton(container, {
        type: 'standard', shape: 'rectangular', theme: 'outline',
        text: 'signin_with', size: 'large', logo_alignment: 'left'
    });
}

function signOut() {
    authState.isLoggedIn = false;
    authState.user = null;
    authState.credential = null;
    google.accounts.id.disableAutoSelect();
    updateMenuState(false);
}

function detectUserNationality() {
    // 1. Google Locale (if detected during auth - simplistic assumption)
    if (authState.user && authState.user.locale) {
        // Google locales are like 'ko', 'en', 'en-US'
        const locale = authState.user.locale;
        mapLocaleToCurrency(locale);
        return;
    }

    // 2. Browser Locale
    const browserLocale = navigator.language || navigator.userLanguage;
    mapLocaleToCurrency(browserLocale);
}

function mapLocaleToCurrency(locale) {
    if (!locale) return;
    const code = locale.split('-')[0].toLowerCase();
    const region = locale.split('-')[1] ? locale.split('-')[1].toUpperCase() : null;

    // 언어 코드 → 통화 코드 맵 (영어권은 지역 코드로 세분화)
    const LOCALE_CURRENCY_MAP = {
        'ja': 'JPY', 'zh': 'CNY', 'ko': 'KRW',
        'fr': 'EUR', 'de': 'EUR', 'it': 'EUR', 'es': 'EUR',
        'ru': 'RUB', 'th': 'THB', 'vi': 'VND'
    };
    const EN_REGION_MAP = { 'GB': 'GBP', 'AU': 'AUD', 'CA': 'CAD' };

    let target = 'KRW'; // Default fallback

    if (code === 'en') {
        target = EN_REGION_MAP[region] || 'USD';
    } else {
        target = LOCALE_CURRENCY_MAP[code] || 'KRW';
    }

    // Verification
    // We can only set it if it exists in our data
    // But data might not be loaded yet. We set a 'pending' detection
    // which fetchExchangeRates will check.
    state.lastDetectedCode = target; // Reuse this variable

    // But since we want "Target" currency not "Source" currency for this feature
    // Wait, the user asked for "Convert KRW to Their Currency".
    // So if I am American, I want Input=KRW, Target=USD.
    // If I am Korean, I want Input=USD, Target=KRW.

    // Logic:
    // If detected is KRW -> Source=USD (Source default), Target=KRW (Target default).
    // If detected is USD -> Source=KRW, Target=USD.

    if (target === 'KRW') {
        state.targetCurrency = 'KRW';
    } else {
        state.targetCurrency = target;
        state.selectedCurrency = 'KRW'; // Set input to KRW
    }
    state.homeCurrency = target; // Remember home currency
}

// ===================================
// Main Logic
// ===================================

async function fetchJsonWithTimeout(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.FETCH_TIMEOUT);
    try {
        const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } finally {
        clearTimeout(timeoutId);
    }
}

// 소스별 응답을 공통 형식 { result: 'success', rates: { USD: 0.00068, ... } } 으로 변환
function normalizeRates(raw, type) {
    if (type === 'erapi') {
        if (raw && raw.result === 'success' && raw.rates) return raw;
    } else if (type === 'fawaz') {
        if (raw && raw.krw) {
            const rates = {};
            Object.keys(raw.krw).forEach(k => {
                if (/^[a-z]{3}$/.test(k) && raw.krw[k] > 0) rates[k.toUpperCase()] = raw.krw[k];
            });
            return { result: 'success', rates: rates, date: raw.date };
        }
    }
    throw new Error('Invalid data');
}

function readRateCache() {
    try {
        const cached = localStorage.getItem(CONFIG.CACHE_KEY);
        if (!cached) return null;
        const parsed = JSON.parse(cached);
        if (!parsed || !parsed.data || !parsed.data.rates) throw new Error('bad cache');
        return parsed;
    } catch (e) {
        console.warn('Cache invalid', e);
        try { localStorage.removeItem(CONFIG.CACHE_KEY); } catch (_) { /* ignore */ }
        return null;
    }
}

// 환율 데이터가 바뀐 뒤 통화 목록/표시를 갱신.
// keepInput=true 이면 이미 선택된 통화를 유지하고 입력값을 지우지 않는다 (백그라운드 갱신용).
function refreshCurrencyUI(keepInput) {
    if (state.currencyList.length === 0) return;
    renderCurrencyOptions(state.currencyList);

    // Security: Ensure we are in source mode for auto-updates so we don't clobber Target
    state.searchMode = 'source';

    if (state.lastDetectedCode && state.exchangeRates[state.lastDetectedCode]) {
        selectCurrency(state.lastDetectedCode);
        state.lastDetectedCode = null; // Consume
    } else if (!state.exchangeRates[state.selectedCurrency]) {
        selectCurrency('USD');
    } else if (keepInput) {
        calculate();
    } else {
        selectCurrency(state.selectedCurrency);
    }
}

async function fetchExchangeRates(forceUpdate = false) {
    const cache = readRateCache();
    const now = Date.now();
    let cacheShown = false;

    // 1. Smart Cache Check
    if (cache) {
        const expiresAt = cache.nextUpdate || (cache.timestamp + CONFIG.CACHE_MAX_AGE);
        if (now < expiresAt) {
            // 아직 유효한 데이터 → 네트워크 요청 생략
            if (forceUpdate) {
                // Force blur before alert to remove button state on mobile
                if (document.activeElement) document.activeElement.blur();
                setTimeout(() => {
                    alert('현재 데이터가 최신입니다.\n(다음 업데이트: ' + formatTime(new Date(expiresAt)) + ')');
                }, CONFIG.ALERT_DELAY);
            }
            processData(cache.data);
            state.lastUpdated = new Date(cache.timestamp);
            state.nextUpdate = expiresAt;
            updateSourceInfo(cache.source);
            updateRateStatus(`최신 데이터 유지 중 (${cache.source}): ${formatTime(state.lastUpdated)}`);
            refreshCurrencyUI(false);
            return;
        }

        // 만료된 캐시: 일단 화면에 보여주고, 아래에서 최신 데이터를 받아온다
        if (!forceUpdate) {
            processData(cache.data);
            state.lastUpdated = new Date(cache.timestamp);
            updateSourceInfo(cache.source);
            updateRateStatus(`저장된 데이터 (${cache.source}): ${formatTime(state.lastUpdated)} · 최신 환율 확인 중...`);
            refreshCurrencyUI(false);
            cacheShown = true;
        }
    }

    if (!cacheShown) updateRateStatus('환율 정보 연결 중...');

    // 2. Try sources in order
    let fetched = null;
    for (const source of CONFIG.RATE_SOURCES) {
        try {
            const raw = await fetchJsonWithTimeout(source.url);
            fetched = { data: normalizeRates(raw, source.type), raw: raw, source: source.name };
            break;
        } catch (e) {
            console.warn(`Rate source ${source.name} failed:`, e);
        }
    }

    if (fetched) {
        processData(fetched.data);
        state.lastUpdated = new Date();
        const nextUpdate = fetched.raw.time_next_update_unix ? fetched.raw.time_next_update_unix * 1000 : 0;
        state.nextUpdate = nextUpdate;
        updateSourceInfo(fetched.source);
        updateRateStatus(`업데이트 (${fetched.source}): ${formatTime(state.lastUpdated)}`);

        try {
            localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify({
                data: fetched.data,
                timestamp: state.lastUpdated.getTime(),
                source: fetched.source,
                nextUpdate: nextUpdate
            }));
        } catch (e) {
            console.warn('Cache write failed', e);
        }
    } else if (cache) {
        // 3. 네트워크 실패 → 마지막으로 받은 데이터 유지
        processData(cache.data);
        state.lastUpdated = new Date(cache.timestamp);
        updateSourceInfo(cache.source);
        updateRateStatus(`오프라인 · 저장된 데이터 (${cache.source}): ${formatTime(state.lastUpdated)}`);
    } else {
        // 4. Fallback (Offline hardcoded)
        processData(FALLBACK_DATA);
        updateSourceInfo('Global Standard API');
        updateRateStatus(`오프라인 모드 (기본값: ${FALLBACK_DATA.date} 기준)`);
    }

    refreshCurrencyUI(cacheShown);
}

function processBackupData(data) {
    state.exchangeRates = {};
    state.currencyList = [];

    // ExchangeRate-API returns rates relative to base (KRW)
    // "rates": { "USD": 0.00075, ... } -> 1 KRW = 0.00075 USD
    // We need KRW per 1 Unit -> 1 / 0.00075

    const rates = data.rates || {};

    Object.keys(CURRENCY_NAMES).forEach(code => {
        const val = rates[code];
        if (val) {
            const rate = 1 / val;
            let displayRate = rate;

            // JPY, VND, IDR are typically shown per 100 units in UI, but logic uses per 1 unit
            if (['JPY', 'VND', 'IDR'].includes(code)) {
                displayRate = rate * 100;
            }

            const currencyObj = {
                code: code,
                name: CURRENCY_NAMES[code].name,
                nationName: CURRENCY_NAMES[code].nation,
                rate: rate,
                displayRate: formatNumber(displayRate, 2)
            };

            state.exchangeRates[code] = currencyObj;
            state.currencyList.push(currencyObj);
        }
    });

    // Explicitly Add KRW
    addKrwToState();

    const majors = ['USD', 'EUR', 'JPY', 'CNY', 'GBP', 'VND', 'IDR', 'KRW'];
    state.currencyList.sort((a, b) => {
        const idxA = majors.indexOf(a.code);
        const idxB = majors.indexOf(b.code);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.nationName.localeCompare(b.nationName);
    });
}

function processData(data) {
    // Unify processing. Detect type.
    if (Array.isArray(data)) {
        processNaverData(data);
    } else if (data.rates || (data.result === 'success')) {
        processGlobalData(data);
    }
}

function addKrwToState() {
    const krwObj = {
        code: 'KRW',
        name: '대한민국 원',
        nationName: '한국',
        rate: 1.0,
        displayRate: '1.00'
    };
    state.exchangeRates['KRW'] = krwObj;
    // Check if distinct to avoid dupes (though logic clears list first)
    state.currencyList.push(krwObj);
}

function updateSourceInfo(sourceName) {
    const footer = document.getElementById('sourceInfo');
    if (footer) {
        if (sourceName && sourceName.includes('Currency API')) {
            footer.innerHTML = '환율 정보: ' + sourceName;
        } else {
            footer.innerHTML = '환율 정보: Global Standard API (ExchangeRate-API)';
        }
    }
}

function processGlobalData(data) {
    state.exchangeRates = {};
    state.currencyList = [];

    const rates = data.rates || {};
    Object.keys(CURRENCY_NAMES).forEach(code => {
        const val = rates[code];
        if (val) {
            const rate = 1 / val;
            let displayRate = rate;
            if (['JPY', 'VND', 'IDR'].includes(code)) displayRate = rate * 100;

            const currencyObj = {
                code: code,
                name: CURRENCY_NAMES[code].name,
                nationName: CURRENCY_NAMES[code].nation,
                rate: rate,
                displayRate: formatNumber(displayRate, 2)
            };
            state.exchangeRates[code] = currencyObj;
            state.currencyList.push(currencyObj);
        }
    });

    // Explicitly Add KRW
    addKrwToState();

    sortCurrencyList();
}

function processNaverData(rawData) {
    state.exchangeRates = {};
    state.currencyList = [];
    const processedCodes = new Set();

    rawData.forEach(item => {
        if (!item.symbolCode || !item.calcPrice) return;
        const code = item.symbolCode;
        if (processedCodes.has(code)) return;

        let rate = parseFloat(item.calcPrice.replace(/,/g, ''));
        if (isNaN(rate)) return;

        let finalRate = rate;
        if (['JPY', 'VND', 'IDR'].includes(code)) finalRate = rate / 100;

        const mapped = CURRENCY_NAMES[code] || {};
        const nationName = mapped.nation || item.stockExchangeType?.nationName || getCountryFromCode(code);
        const currencyName = mapped.name || item.name || code;

        const currencyObj = {
            code: code,
            name: currencyName,
            nationName: nationName,
            rate: finalRate,
            displayRate: item.closePrice
        };
        state.exchangeRates[code] = currencyObj;
        state.currencyList.push(currencyObj);
        processedCodes.add(code);
    });

    // Explicitly Add KRW
    addKrwToState();

    sortCurrencyList();
}

function sortCurrencyList() {
    const majors = ['USD', 'EUR', 'JPY', 'CNY', 'GBP', 'VND', 'IDR'];
    state.currencyList.sort((a, b) => {
        const idxA = majors.indexOf(a.code);
        const idxB = majors.indexOf(b.code);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.nationName.localeCompare(b.nationName);
    });
}

const EUROZONE_COUNTRIES = [
    'AT', 'BE', 'HR', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES', 'AD', 'MC', 'SM', 'VA'
];

function openSearch(mode = 'source') {
    state.searchMode = mode;
    state.isSearchOpen = true;

    // UI Separation: Show correct wrapper
    if (mode === 'target') {
        elements.targetSearchWrapper.style.display = 'block';
        elements.currencySearchWrapper.style.display = 'none'; // Ensure source closed

        elements.targetSearchInput.value = '';
        elements.targetSearchInput.focus();
        renderCurrencyOptions(state.currencyList); // Renders to targetOptionsList
    } else {
        // Source Mode
        elements.currencyDisplay.style.display = 'none';
        elements.currencySearchWrapper.style.display = 'block';
        elements.targetSearchWrapper.style.display = 'none'; // Ensure target closed

        elements.currencySearchInput.value = '';
        elements.currencySearchInput.focus();
        renderCurrencyOptions(state.currencyList); // Renders to currencyOptionsList
    }
}

function closeSearch() {
    state.isSearchOpen = false;
    state.searchMode = 'source'; // Fix: Always reset to source mode when closed
    elements.currencyDisplay.style.display = 'flex';
    elements.currencySearchWrapper.style.display = 'none';
    elements.targetSearchWrapper.style.display = 'none';
}

function filterCurrencyList(keyword) {
    if (!keyword) {
        renderCurrencyOptions(state.currencyList);
        return;
    }
    const lower = keyword.toLowerCase();
    const filtered = state.currencyList.filter(item =>
        item.code.toLowerCase().includes(lower) ||
        item.name.toLowerCase().includes(lower) ||
        item.nationName.toLowerCase().includes(lower)
    );
    renderCurrencyOptions(filtered);
}

// Renders the list of currencies
// Uses state.searchMode to decide WHICH list to populate
function renderCurrencyOptions(list) {
    const listContainer = (state.searchMode === 'target') ?
        elements.targetOptionsList :
        elements.currencyOptionsList;

    if (!listContainer) return;

    listContainer.innerHTML = '';
    if (list.length === 0) {
        listContainer.innerHTML = '<div class="no-results">검색 결과가 없습니다</div>';
        return;
    }

    list.forEach(item => {
        const option = document.createElement('div');
        option.className = 'option-item';

        let isSelected = false;
        if (state.searchMode === 'target') {
            isSelected = (item.code === state.targetCurrency);
        } else {
            isSelected = (item.code === state.selectedCurrency);
        }

        if (isSelected) option.classList.add('selected');

        option.innerHTML = `
            <div class="option-info">
                <span class="option-name">${item.nationName}</span>
                <span class="option-code">(${item.code})</span>
            </div>
            ${isSelected ? '<span style="color:var(--accent-primary)">✔</span>' : ''}
        `;
        option.addEventListener('click', () => selectCurrency(item.code));
        listContainer.appendChild(option);
    });
}

function selectCurrency(code) {
    if (!state.exchangeRates[code]) return;

    if (state.searchMode === 'target') {
        // Mode: Setting Target (Home) Currency
        // STRICT SEPARATION: Only change Target & Home. Never Source.
        state.targetCurrency = code;
        state.homeCurrency = code; // Remember preference

        // No checks on source logic.

    } else {
        // Mode: Setting Source (Input) Currency
        state.selectedCurrency = code;

        // Auto-Swap Logic (Foreigner Mode)
        if (code === 'KRW') {
            state.targetCurrency = state.homeCurrency || 'USD';
            // User Feedback: Don't force USD. If homeCurrency is KRW (or unassigned), let it be.
            // if (state.targetCurrency === 'KRW') state.targetCurrency = 'USD';
        } else {
            // Fix: If I select a foreign currency, my Target (Home) should remain my Home Currency.
            // Only set to KRW if homeCurrency is not set.
            state.targetCurrency = state.homeCurrency || 'KRW';
        }
    }

    // Reset UI Logic
    if (state.searchMode === 'source') {
        // If Source changed, reset input amount
        elements.localAmount.value = '';
        toggleClearBtn('localAmount', '');

        // Reset Service Charge
        if (state.serviceChargeType !== 'percent') {
            elements.serviceCharge.value = '';
            toggleClearBtn('serviceCharge', '');
        }
    }

    closeSearch();

    // Update Display Text (Source only)
    if (state.searchMode === 'source') {
        const rate = state.exchangeRates[state.selectedCurrency];
        elements.selectedCurrencyText.textContent = `${rate.nationName} (${rate.code})`;
        elements.currencySymbol.textContent = getCurrencySymbol(state.selectedCurrency);
    }

    calculate();
}



// ===================================
// Helper: Input Handling (Commas)
// ===================================

function handleNumberInput(e) {
    let value = e.target.value.replace(/[^0-9.]/g, '');

    // Ensure only one dot
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }

    // Add commas to integer part
    if (parts[0]) {
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    const formatted = parts.join('.');
    if (e.target.value !== formatted) {
        e.target.value = formatted;
    }

    calculate();
}

// ===================================
// Calculations & Helpers
// ===================================

function calculate() {
    const localAmount = parseFloat(elements.localAmount.value.replace(/,/g, '')) || 0;
    const serviceChargeInput = parseFloat(elements.serviceCharge.value.replace(/,/g, '')) || 0;
    const taxRate = parseFloat(elements.taxRate.value.replace(/,/g, '')) || 0;
    const feeRate = parseFloat(elements.feeRate.value.replace(/,/g, '')) || 0;

    if (!state.exchangeRates[state.selectedCurrency]) return;
    const sourceRate = state.exchangeRates[state.selectedCurrency].rate;

    // Safety check for target currency (default to KRW if missing)
    if (!state.exchangeRates[state.targetCurrency]) {
        state.targetCurrency = 'KRW';
    }
    const targetRate = state.exchangeRates[state.targetCurrency]?.rate || 1;

    let serviceCharge = 0;
    if (state.serviceChargeType === 'percent') {
        serviceCharge = localAmount * (serviceChargeInput / 100);
    } else if (state.serviceChargeType === 'fixed') {
        serviceCharge = serviceChargeInput;
    } else if (state.serviceChargeType === 'total') {
        if (serviceChargeInput > localAmount) {
            serviceCharge = serviceChargeInput - localAmount;
        } else {
            serviceCharge = 0;
        }
    }

    const withService = localAmount + serviceCharge;
    const withTax = withService * (1 + taxRate / 100);
    const withFee = withTax * (1 + feeRate / 100);

    // Core Calculation: Input * (Source / Target)
    const resultValue = withFee * (sourceRate / targetRate);

    // Dynamic Decimal Places
    // If target is KRW/JPY/VND etc, 0 decimals. Else 2.
    const targetCode = state.targetCurrency;
    const decimals = ['KRW', 'JPY', 'VND', 'IDR'].includes(targetCode) ? 0 : 2;



    elements.resultValue.textContent = formatNumber(resultValue, decimals);

    // Update Result UI (Label & Symbol)
    const targetSymbol = getCurrencySymbol(targetCode);
    const targetName = state.exchangeRates[targetCode]?.name || targetCode;

    if (elements.resultLabel) elements.resultLabel.textContent = `${targetName} (${targetCode})`;
    if (elements.resultSymbol) elements.resultSymbol.textContent = targetSymbol;

    // Restore Exchange Rate Display
    if (elements.currentRateDisplay) {
        const rateRel = sourceRate / targetRate;
        const srcCode = state.selectedCurrency;
        const tgtCode = state.targetCurrency;
        let rateText = '';

        if (['JPY', 'VND', 'IDR'].includes(srcCode)) {
            // 100 Source = X Target
            const val = rateRel * 100;
            rateText = `100 ${srcCode} = ${formatNumber(val, 2)} ${tgtCode}`;
        } else {
            // 1 Source = X Target
            rateText = `1 ${srcCode} = ${formatNumber(rateRel, 2)} ${tgtCode}`;
        }
        elements.currentRateDisplay.textContent = rateText;
    }

    updateBreakdown({
        localAmount, serviceCharge, withService, taxRate,
        withTax, feeRate, withFee, sourceRate, targetRate, resultValue, targetCode
    });
}

function updateBreakdown(data) {
    const symbol = getCurrencySymbol(state.selectedCurrency);
    let html = '';
    if (data.localAmount > 0) {
        html = `
            <div class="breakdown-item"><span>기본 금액</span><span>${symbol}${formatNumber(data.localAmount, 2)}</span></div>
        `;
        if (data.serviceCharge > 0) {
            let scLabel = '+ 서비스차지';
            if (state.serviceChargeType === 'percent') {
                scLabel += ` (${elements.serviceCharge.value}%)`;
            } else if (state.serviceChargeType === 'fixed') {
                scLabel += ` (정액)`;
            } else if (state.serviceChargeType === 'total') {
                scLabel += ` (합산)`;
            }
            html += itemRow(scLabel, data.serviceCharge, symbol);
        }
        if (data.taxRate > 0) html += itemRow(`+ 세금 (${data.taxRate}%)`, data.withService * (data.taxRate / 100), symbol);
        if (data.feeRate > 0) html += itemRow(`+ 수수료 (${data.feeRate}%)`, data.withTax * (data.feeRate / 100), symbol);

        const targetSymbol = getCurrencySymbol(data.targetCode);
        html += `
            <div class="breakdown-item"><span>변환 금액 (${data.targetCode})</span><span>${targetSymbol}${formatNumber(data.resultValue, 2)}</span></div>
        `;
    }
    elements.resultBreakdown.innerHTML = html;
}

function itemRow(label, value, symbol) {
    return `<div class="breakdown-item"><span>${label}</span><span>${symbol}${formatNumber(value, 2)}</span></div>`;
}

function getCountryFromCode(currencyCode) {
    const map = { 'USD': '미국', 'KRW': '한국', 'EUR': '유럽', 'JPY': '일본', 'CNY': '중국' };
    return map[currencyCode] || currencyCode;
}

function getCurrencySymbol(code) {
    const symbols = {
        'USD': '$', 'EUR': '€', 'JPY': '¥', 'CNY': '¥', 'GBP': '£',
        'KRW': '₩', 'THB': '฿', 'VND': '₫', 'PHP': '₱', 'INR': '₹'
    };
    return symbols[code] || code;
}

function formatTime(date) {
    const options = {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    if (state.detectedTimeZone) {
        try {
            options.timeZone = state.detectedTimeZone;
        } catch (e) {
            console.warn('Invalid TimeZone:', state.detectedTimeZone);
        }
    }
    return date.toLocaleTimeString('ko-KR', options);
}

function formatNumber(num, decimals = 0) {
    return num.toLocaleString('ko-KR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function updateRateStatus(message) {
    elements.rateUpdateTime.textContent = message;
}

// ===================================
// Initialization
// ===================================

function initEventListeners() {
    // Auto Detect on Init
    detectUserNationality();

    elements.currencyDisplay.addEventListener('click', () => openSearch('source'));

    // Result Label Click -> Search 'target'
    const openTargetSearch = (e) => {
        // Prevent triggering if clicking something interactive inside (if any)
        // But here everything is just text/display.
        e.stopPropagation();
        openSearch('target');
    };

    if (elements.resultLabel) elements.resultLabel.addEventListener('click', openTargetSearch);
    // Attach to the container (resultAmount) instead of individual spans for better touch area
    if (elements.resultAmount) elements.resultAmount.addEventListener('click', openTargetSearch);

    // Also attach to the whole section just in case? 
    // Maybe too aggressive, users might click by accident. Result Amount and Label is enough.
    // Let's stick to Amount and Label.

    elements.closeSearchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeSearch();
    });
    elements.currencySearchInput.addEventListener('input', (e) => filterCurrencyList(e.target.value));

    // Target Search Listeners
    if (elements.targetCloseBtn) {
        elements.targetCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeSearch();
        });
    }
    if (elements.targetSearchInput) {
        elements.targetSearchInput.addEventListener('input', (e) => filterCurrencyList(e.target.value));
    }

    document.addEventListener('click', (e) => {
        // If search is open, check which one and close if active out
        if (!state.isSearchOpen) return;

        if (state.searchMode === 'target') {
            if (!elements.targetSearchWrapper.contains(e.target) &&
                !elements.resultSection.contains(e.target)) {
                closeSearch();
            }
        } else {
            if (!elements.currencySearchWrapper.contains(e.target) &&
                !elements.currencyDisplay.contains(e.target)) {
                closeSearch();
            }
        }
    });

    // Unified number input handler with Persistence
    elements.localAmount.addEventListener('input', (e) => {
        handleNumberInput(e);
        toggleClearBtn('localAmount', e.target.value);
    });

    ['serviceCharge', 'taxRate', 'feeRate'].forEach(id => {
        elements[id].addEventListener('input', (e) => {
            handleNumberInput(e);
            toggleClearBtn(id, e.target.value);
            saveOptions(); // Save on change
        });
    });

    // Validation for Total Mode
    elements.serviceCharge.addEventListener('blur', (e) => {
        // Skip validation if clicking Clear Button or Type Button
        if (e.relatedTarget && (
            e.relatedTarget.classList.contains('clear-btn') ||
            e.relatedTarget.classList.contains('type-btn')
        )) {
            return;
        }

        if (state.serviceChargeType === 'total') {
            const localAmount = parseFloat(elements.localAmount.value.replace(/,/g, '')) || 0;
            const inputVal = parseFloat(elements.serviceCharge.value.replace(/,/g, '')) || 0;



            // If input exists and is less than base amount, warn user
            if (inputVal > 0 && inputVal < localAmount) {
                alert('합산 금액은 기본 금액보다 커야 합니다.\n(팁을 포함한 총액을 입력해주세요)');
                setTimeout(() => {
                    elements.serviceCharge.focus();
                }, 10);
            }
        }
    });

    // Clear Buttons
    document.querySelectorAll('.clear-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            if (input) {
                input.value = '';
                toggleClearBtn(targetId, '');
                input.focus();
                calculate(); // Recalculate
                if (['serviceCharge', 'taxRate', 'feeRate'].includes(targetId)) {
                    saveOptions(); // Save clear state
                }
            }
        });
    });

    elements.optionsToggle.addEventListener('click', () => {
        state.isOptionsOpen = !state.isOptionsOpen;
        elements.optionsContent.classList.toggle('open', state.isOptionsOpen);
        elements.toggleIcon.classList.toggle('open', state.isOptionsOpen);
    });

    elements.tipPercentBtn.addEventListener('click', () => {
        state.serviceChargeType = 'percent';
        elements.tipPercentBtn.classList.add('active');
        elements.tipFixedBtn.classList.remove('active');
        elements.tipTotalBtn.classList.remove('active');
        elements.serviceChargeUnit.textContent = '%';
        calculate();
    });
    elements.tipFixedBtn.addEventListener('click', () => {
        state.serviceChargeType = 'fixed';
        elements.tipFixedBtn.classList.add('active');
        elements.tipPercentBtn.classList.remove('active');
        elements.tipTotalBtn.classList.remove('active');
        elements.serviceChargeUnit.textContent = getCurrencySymbol(state.selectedCurrency);
        calculate();
    });
    elements.tipTotalBtn.addEventListener('click', () => {
        state.serviceChargeType = 'total';
        elements.tipTotalBtn.classList.add('active');
        elements.tipPercentBtn.classList.remove('active');
        elements.tipFixedBtn.classList.remove('active');
        elements.serviceChargeUnit.textContent = getCurrencySymbol(state.selectedCurrency);
        calculate();
    });

    // Menu Toggle Logic
    if (elements.mainMenuBtn) {
        elements.mainMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = elements.mainMenuDropdown.style.display === 'block';
            if (isVisible) elements.mainMenuDropdown.style.display = 'none';
            else openMainMenu();
        });
    }

    // Close Menu when clicking outside
    window.addEventListener('click', (e) => {
        if (elements.mainMenuDropdown && elements.mainMenuDropdown.style.display === 'block') {
            if (!elements.mainMenuDropdown.contains(e.target) && !elements.mainMenuBtn.contains(e.target)) {
                elements.mainMenuDropdown.style.display = 'none';
            }
        }
    });

    // Menu Actions
    if (elements.menuItemRefresh) {
        elements.menuItemRefresh.addEventListener('click', async () => {
            await fetchExchangeRates(true);
            if (elements.mainMenuDropdown) elements.mainMenuDropdown.style.display = 'none';
        });
    }

    if (elements.menuItemAppInfo) {
        elements.menuItemAppInfo.addEventListener('click', () => {
            alert(`💱 ${APP_INFO.NAME} v${APP_INFO.VERSION} (${APP_INFO.UPDATED})\n\n`
                + APP_INFO.FEATURES.map(f => `- ${f}`).join('\n')
                + `\n\n${APP_INFO.CREDIT}`);
            if (elements.mainMenuDropdown) elements.mainMenuDropdown.style.display = 'none';
        });
    }

    if (elements.menuItemLogout) {
        elements.menuItemLogout.addEventListener('click', () => {
            signOut();
            if (elements.mainMenuDropdown) elements.mainMenuDropdown.style.display = 'none';
        });
    }

    if (elements.menuItemReceipt) {
        elements.menuItemReceipt.addEventListener('click', () => {
            openReceiptModal();
            if (elements.mainMenuDropdown) elements.mainMenuDropdown.style.display = 'none';
        });
    }

    if (elements.detectLocationBtn) elements.detectLocationBtn.addEventListener('click', () => detectLocation(true));

    // Modal Close Logic (Global for simplicity or specific)
    const receiptModal = document.getElementById('receiptModal');
    if (receiptModal) {
        const closeSpan = receiptModal.querySelector('.close-modal');
        if (closeSpan) {
            closeSpan.onclick = () => receiptModal.style.display = 'none';
        }
        window.onclick = (event) => {
            if (event.target == receiptModal) {
                receiptModal.style.display = 'none';
            }
        };
    }
}

// Timezone to Currency Mapping
const TIMEZONE_CURRENCY_MAP = {
    // Asia
    'Asia/Seoul': 'KRW',
    'Asia/Tokyo': 'JPY',
    'Asia/Shanghai': 'CNY',
    'Asia/Chongqing': 'CNY',
    'Asia/Hong_Kong': 'HKD',
    'Asia/Taipei': 'TWD',
    'Asia/Singapore': 'SGD',
    'Asia/Bangkok': 'THB',
    'Asia/Ho_Chi_Minh': 'VND',
    'Asia/Saigon': 'VND',
    'Asia/Jakarta': 'IDR',
    'Asia/Kuala_Lumpur': 'MYR',
    'Asia/Manila': 'PHP',
    'Asia/Kolkata': 'INR',
    'Asia/Dubai': 'AED',
    'Asia/Riyadh': 'SAR',
    'Asia/Ulaanbaatar': 'MNT',
    'Asia/Almaty': 'KZT',
    'Asia/Brunei': 'BND',

    // Europe (Eurozone)
    'Europe/Paris': 'EUR',
    'Europe/Berlin': 'EUR',
    'Europe/Rome': 'EUR',
    'Europe/Madrid': 'EUR',
    'Europe/Amsterdam': 'EUR',
    'Europe/Brussels': 'EUR',
    'Europe/Vienna': 'EUR',
    'Europe/Athens': 'EUR',
    'Europe/Dublin': 'EUR',
    'Europe/Lisbon': 'EUR',
    'Europe/Helsinki': 'EUR',
    'Europe/Luxembourg': 'EUR',

    // Europe (Non-Eurozone)
    'Europe/London': 'GBP',
    'Europe/Zurich': 'CHF',
    'Europe/Stockholm': 'SEK',
    'Europe/Oslo': 'NOK',
    'Europe/Copenhagen': 'DKK',
    'Europe/Warsaw': 'PLN',
    'Europe/Prague': 'CZK',
    'Europe/Budapest': 'HUF',
    'Europe/Moscow': 'RUB',
    'Europe/Istanbul': 'TRY',

    // Americas
    'America/New_York': 'USD',
    'America/Chicago': 'USD',
    'America/Denver': 'USD',
    'America/Los_Angeles': 'USD',
    'America/Anchorage': 'USD',
    'America/Phoenix': 'USD',
    'Pacific/Honolulu': 'USD',
    'Pacific/Guam': 'USD',
    'America/Toronto': 'CAD',
    'America/Vancouver': 'CAD',
    'America/Montreal': 'CAD',
    'America/Mexico_City': 'MXN',
    'America/Sao_Paulo': 'BRL',
    'America/Buenos_Aires': 'ARS',

    // Oceania
    'Australia/Sydney': 'AUD',
    'Australia/Melbourne': 'AUD',
    'Australia/Brisbane': 'AUD',
    'Australia/Perth': 'AUD',
    'Pacific/Auckland': 'NZD',

    // Africa & Middle East
    'Africa/Johannesburg': 'ZAR',
    'Africa/Cairo': 'EGP',
    'Asia/Jerusalem': 'ILS',
    'Asia/Amman': 'JOD'
};

function detectLocation(interactive = false) {
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        state.detectedTimeZone = timezone;

        let targetCode = TIMEZONE_CURRENCY_MAP[timezone];

        // Fallback: try to match by region prefix
        if (!targetCode) {
            const region = timezone.split('/')[0];
            if (region === 'Europe') targetCode = 'EUR';
            else if (region === 'America') targetCode = 'USD';
            else if (region === 'Asia') targetCode = 'USD'; // Default for unknown Asian timezones
            else targetCode = 'USD';
        }

        state.lastDetectedCode = targetCode;
        state.localCurrency = targetCode; // 통화 기호 판단 힌트용 (소비되지 않음)

        // Find matching currency
        const found = state.currencyList.find(c => c.code === targetCode);

        if (found) {
            selectCurrency(found.code);
            if (interactive) {
                alert(`🌍 타임존: ${timezone}\n💰 화폐: ${found.code} 선택됨`);
            }
        } else if (state.exchangeRates[targetCode]) {
            selectCurrency(targetCode);
            if (interactive) {
                alert(`🌍 타임존: ${timezone}\n💰 화폐: ${targetCode} 선택됨`);
            }
        } else {
            if (interactive) {
                alert(`🌍 타임존: ${timezone}\n⚠️ 해당 화폐 정보 없음 (기본: USD)`);
            }
        }

        console.log(`Timezone detected: ${timezone} → ${targetCode}`);
    } catch (e) {
        console.error('Timezone detection failed:', e);
        if (interactive) alert('타임존 감지 실패');
    }
}

function init() {
    initEventListeners();

    // 시작 시 로그인 상태에 맞게 메뉴를 그린다 (로그아웃 상태면 로그인 메뉴 항목을 보여준다)
    updateMenuState(authState.isLoggedIn, authState.user);

    // Load saved options first (restores selectedCurrency)
    loadOptions();

    updateRateStatus('환율 정보 로딩 중...');

    // Timezone-based detection (synchronous, no permission needed)
    detectLocation(false);

    // Fetch exchange rates
    fetchExchangeRates(false);

    if (CONFIG.UPDATE_INTERVAL > 0) {
        setInterval(() => fetchExchangeRates(true), CONFIG.UPDATE_INTERVAL);
    }
    // Initial calculate call might be empty if no rates yet, but UI structure initializes.
    calculate();

    // Initial Toggle check
    toggleClearBtn('localAmount', elements.localAmount.value);
    toggleClearBtn('serviceCharge', elements.serviceCharge.value);
    toggleClearBtn('taxRate', elements.taxRate.value);
    toggleClearBtn('feeRate', elements.feeRate.value);
}

function saveOptions() {
    let scVal = elements.serviceCharge.value;
    // Only save value if type is percent
    if (state.serviceChargeType !== 'percent') {
        scVal = '';
    }

    const options = {
        serviceCharge: scVal,
        taxRate: elements.taxRate.value,
        feeRate: elements.feeRate.value,
        serviceChargeType: state.serviceChargeType,
        selectedCurrency: state.selectedCurrency // Persist currency
    };
    localStorage.setItem('currency_calculator_options', JSON.stringify(options));
}

function loadOptions() {
    const saved = localStorage.getItem('currency_calculator_options');
    if (saved) {
        try {
            const options = JSON.parse(saved);
            if (options.serviceCharge !== undefined) elements.serviceCharge.value = options.serviceCharge;
            if (options.taxRate !== undefined) elements.taxRate.value = options.taxRate;
            if (options.feeRate !== undefined) elements.feeRate.value = options.feeRate;
            if (options.serviceChargeType) {
                state.serviceChargeType = options.serviceChargeType;
                if (state.serviceChargeType === 'fixed') {
                    elements.tipFixedBtn.click();
                } else if (state.serviceChargeType === 'total') {
                    elements.tipTotalBtn.click();
                } else {
                    elements.tipPercentBtn.click();
                }
            }
            if (options.selectedCurrency) {
                state.selectedCurrency = options.selectedCurrency;
            }
        } catch (e) {
            console.warn('Options load failed', e);
        }
    }
}

function toggleClearBtn(id, value) {
    const btn = document.querySelector(`.clear-btn[data-target="${id}"]`);
    if (btn) {
        if (value && value.length > 0) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    }
}

// ===================================
// OCR (Optical Character Recognition)
// ===================================

let tesseractLoaded = false;
let tesseractWorker = null;

// Load Tesseract.js from CDN
async function loadTesseract() {
    if (tesseractLoaded) return true;

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
        script.onload = () => {
            tesseractLoaded = true;
            console.log('Tesseract.js loaded');
            resolve(true);
        };
        script.onerror = () => reject(new Error('Failed to load Tesseract.js'));
        document.head.appendChild(script);
    });
}

// Initialize OCR Worker
async function initOCRWorker() {
    if (tesseractWorker) return tesseractWorker;

    await loadTesseract();

    tesseractWorker = await Tesseract.createWorker(['eng', 'chi_sim'], 1, {
        logger: m => {
            if (m.status === 'recognizing text') {
                const progress = Math.round(m.progress * 100);
                if (elements.ocrStatus) {
                    elements.ocrStatus.textContent = `인식 중... ${progress}%`;
                }
            }
        }
    });

    return tesseractWorker;
}

// Extract prices from OCR text
function extractPrices(text) {
    const prices = [];

    // Currency symbol patterns (before or after number)
    // ¥ (U+00A5), ￥ (U+FFE5), 元, 円, ₩ for Asian currencies
    const patterns = [
        /[$€£¥￥₩₹฿₽元円]\s*([\d,\.]+)/g,                    // ¥120.00, $12.50
        /([\d,\.]+)\s*[$€£¥￥₩₹฿₽元円]/g,                    // 120.00¥, 12.50$
        /(\d+(?:[,.]\d{1,2})?)/g                             // Plain numbers: 120, 12.50
    ];

    const seen = new Set();

    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            // Extract the numeric part
            let numStr = match[1] || match[0];
            numStr = numStr.replace(/[$€£¥\s]/g, '').replace(/,/g, '');

            const num = parseFloat(numStr);
            if (!isNaN(num) && num > 0 && num < 1000000 && !seen.has(num)) {
                seen.add(num);
                prices.push({
                    value: num,
                    original: match[0].trim()
                });
            }
        }
    }

    // Sort by value descending
    prices.sort((a, b) => b.value - a.value);

    return prices.slice(0, 10); // Return top 10 prices
}

// ===================================
// Image & Currency Helpers (가격표/영수증 AI 인식)
// ===================================

const OCR_MAX_EDGE = 1600;      // px: 업로드 전 긴 변 최대 길이 (속도·용량·iOS 캔버스 한도 대응)
const OCR_JPEG_QUALITY = 0.85;

// 사진을 긴 변 OCR_MAX_EDGE 이하로 줄여 컬러 JPEG base64 로 반환.
// 흑백/이진화는 AI 비전 모델의 인식률을 떨어뜨리므로 하지 않는다.
function prepareImageForAI(imageFile) {
    return new Promise((resolve, reject) => {
        if (!imageFile || (imageFile.type && !imageFile.type.startsWith('image/'))) {
            reject(new Error('이미지 파일이 아닙니다.'));
            return;
        }

        const url = URL.createObjectURL(imageFile);
        const img = new Image();

        img.onload = () => {
            try {
                const srcW = img.naturalWidth || img.width;
                const srcH = img.naturalHeight || img.height;
                if (!srcW || !srcH) throw new Error('사진 크기를 읽을 수 없습니다.');

                const scale = Math.min(1, OCR_MAX_EDGE / Math.max(srcW, srcH));
                const width = Math.max(1, Math.round(srcW * scale));
                const height = Math.max(1, Math.round(srcH * scale));

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff'; // 투명 PNG 대비
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                const base64 = canvas.toDataURL('image/jpeg', OCR_JPEG_QUALITY).split(',')[1];
                if (!base64) throw new Error('사진 변환에 실패했습니다.');
                resolve(base64);
            } catch (e) {
                reject(e);
            } finally {
                URL.revokeObjectURL(url);
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('사진을 읽을 수 없습니다. 지원하지 않는 형식일 수 있어요 (JPG/PNG로 다시 시도해 주세요).'));
        };

        img.src = url;
    });
}

// 통화 기호/표기 → 후보 통화 (앞쪽이 기본값). 키는 대문자·공백 제거 기준.
const CURRENCY_SYMBOL_CANDIDATES = {
    '$': ['USD', 'HKD', 'TWD', 'SGD', 'AUD', 'CAD', 'NZD', 'MXN', 'BND'],
    'US$': ['USD'], 'HK$': ['HKD'], 'NT$': ['TWD'], 'NT': ['TWD'], 'S$': ['SGD'], 'SG$': ['SGD'],
    'A$': ['AUD'], 'AU$': ['AUD'], 'C$': ['CAD'], 'CA$': ['CAD'], 'NZ$': ['NZD'], 'MX$': ['MXN'],
    'B$': ['BND'], 'R$': ['BRL'],
    '¥': ['JPY', 'CNY'], '￥': ['JPY', 'CNY'], '円': ['JPY'], 'YEN': ['JPY'], 'JP¥': ['JPY'],
    '元': ['CNY'], 'CN¥': ['CNY'], 'RMB': ['CNY'], '人民币': ['CNY'],
    '€': ['EUR'], '£': ['GBP', 'EGP'], 'E£': ['EGP'],
    '₩': ['KRW'], '원': ['KRW'], 'WON': ['KRW'],
    '฿': ['THB'], 'BAHT': ['THB'], '₫': ['VND'], 'DONG': ['VND'],
    '₱': ['PHP'], 'RP': ['IDR'], 'RM': ['MYR'],
    '₹': ['INR'], 'RS': ['INR', 'PKR'], '₨': ['PKR', 'INR'],
    '₽': ['RUB'], '₺': ['TRY'], 'TL': ['TRY'], '₪': ['ILS'],
    'KR': ['SEK', 'NOK', 'DKK'], 'KČ': ['CZK'], 'ZŁ': ['PLN'], 'FT': ['HUF'],
    'R': ['ZAR'], 'FR': ['CHF'], 'SFR': ['CHF'],
    'DH': ['AED'], 'د.إ': ['AED'], '﷼': ['SAR', 'QAR'], 'SR': ['SAR'], 'QR': ['QAR'],
    'KD': ['KWD'], 'BD': ['BHD'], 'JD': ['JOD'],
    '৳': ['BDT'], 'TK': ['BDT'], '₮': ['MNT'], '₸': ['KZT']
};

// 소수점 없이 쓰는 통화 ("15.000" = 15000 으로 해석)
const ZERO_DECIMAL_CURRENCIES = ['KRW', 'JPY', 'VND', 'IDR', 'HUF', 'MNT', 'KZT', 'PKR', 'BDT'];

// AI 가 돌려준 통화 표기(기호 또는 코드)를 앱이 지원하는 ISO 코드로 변환. 못 찾으면 null.
// 여러 통화가 같은 기호를 쓰면 (예: $, ¥) 현재 선택된 통화 → 타임존 감지 통화 → 기본값 순으로 고른다.
function resolveCurrencyCode(raw) {
    if (raw === null || raw === undefined) return null;
    const text = String(raw).trim();
    if (!text) return null;
    const upper = text.toUpperCase().replace(/\s+/g, '');
    const has = code => !!state.exchangeRates[code];

    if (/^[A-Z]{3}$/.test(upper) && has(upper)) return upper;

    const candidates = CURRENCY_SYMBOL_CANDIDATES[upper]
        || CURRENCY_SYMBOL_CANDIDATES[upper.replace(/\.+$/, '')]
        || CURRENCY_SYMBOL_CANDIDATES[text];

    if (candidates) {
        const available = candidates.filter(has);
        if (available.length > 0) {
            for (const hint of [state.selectedCurrency, state.localCurrency]) {
                if (hint && available.includes(hint)) return hint;
            }
            return available[0];
        }
    }

    // "USD $", "$ (HKD)" 처럼 코드가 섞여 있는 경우
    const codeMatch = upper.match(/[A-Z]{3}/g);
    if (codeMatch) {
        const found = codeMatch.find(has);
        if (found) return found;
    }
    return null;
}

// 숫자 또는 "1,234.50" / "1.234,50" / "12,50" / "15.000" 같은 문자열을 숫자로 변환. 실패 시 null.
function parseAmount(value, currencyCode) {
    if (typeof value === 'number') return (isFinite(value) && value > 0) ? value : null;
    if (typeof value !== 'string') return null;

    let s = value.replace(/[^\d.,]/g, '');
    if (!s) return null;

    const lastDot = s.lastIndexOf('.');
    const lastComma = s.lastIndexOf(',');

    if (lastDot !== -1 && lastComma !== -1) {
        // 둘 다 있으면 뒤에 오는 기호가 소수점
        const decimalSep = lastDot > lastComma ? '.' : ',';
        const thousandSep = decimalSep === '.' ? ',' : '.';
        s = s.split(thousandSep).join('').replace(decimalSep, '.');
    } else if (lastComma !== -1) {
        const parts = s.split(',');
        s = (parts.length === 2 && parts[1].length !== 3) ? parts[0] + '.' + parts[1] : parts.join('');
    } else if (lastDot !== -1) {
        const parts = s.split('.');
        const zeroDecimal = ZERO_DECIMAL_CURRENCIES.includes(currencyCode);
        if (parts.length > 2 || (zeroDecimal && parts[1].length === 3)) s = parts.join('');
    }

    const num = parseFloat(s);
    return (isFinite(num) && num > 0) ? num : null;
}

// 계산기 입력칸 형식 (천단위 콤마, 소수 2자리까지)
function formatAmountForInput(num) {
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function escapeHtml(value) {
    return String(value === null || value === undefined ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// 인식 결과를 계산기에 적용 (통화 전환 후 금액 입력)
function applyScannedAmount(code, amount) {
    if (code && code !== state.selectedCurrency && state.exchangeRates[code]) {
        state.searchMode = 'source'; // 입력(현지) 통화만 바꾼다
        selectCurrency(code);

        elements.selectedCurrencyText.style.color = '#38dec8';
        setTimeout(() => elements.selectedCurrencyText.style.color = '', 800);
    }
    setInput(formatAmountForInput(amount));

    elements.localAmount.style.backgroundColor = '#e8f5e9';
    setTimeout(() => elements.localAmount.style.backgroundColor = '', 500);
}

// ===================================
// Receipt Modal Logic
// ===================================

function openReceiptModal() {
    if (elements.receiptModal) elements.receiptModal.style.display = 'block';
    resetReceiptModal();
}

function closeReceiptModal() {
    if (elements.receiptModal) elements.receiptModal.style.display = 'none';
}

function resetReceiptModal() {
    if (elements.receiptResult) elements.receiptResult.style.display = 'none';
    if (elements.saveReceiptBtn) {
        elements.saveReceiptBtn.style.display = 'none';
        elements.saveReceiptBtn.onclick = null;
        elements.saveReceiptBtn.disabled = false;
        elements.saveReceiptBtn.textContent = '💾 가계부에 저장';
    }
    if (elements.receiptStatus) elements.receiptStatus.textContent = "영수증을 촬영하거나 업로드하세요.";
    if (elements.receiptPreview) elements.receiptPreview.innerHTML = "";
}

// ===================================
// AI Logic (Dual Mode)
// ===================================

// Mode 1: Fast Price Tag Scan (Main Screen)
async function scanPriceTag(file) {
    if (!authState.isLoggedIn) {
        alert("로그인이 필요한 기능입니다.");
        return;
    }

    const originalText = elements.cameraBtn.innerHTML;
    elements.cameraBtn.innerHTML = '<span>⏳ 분석 중...</span>';
    elements.cameraBtn.disabled = true;

    try {
        const base64Image = await prepareImageForAI(file);
        const result = await callOCR(base64Image, 'price_tag');

        if (!result.success || !result.data) {
            console.error("OCR Failed:", result);
            throw new Error((result.error || '분석 실패') + (result.details ? "\nDetails:\n" + result.details : ""));
        }

        const data = result.data;
        const code = resolveCurrencyCode(data.currency);
        console.log(`[OCR] currency raw=${data.currency} → ${code}, total raw=${data.total}`);
        if (data.currency && !code) {
            console.warn(`Detected currency '${data.currency}' not supported.`);
        }

        const amount = parseAmount(data.total, code || state.selectedCurrency);
        if (amount) {
            applyScannedAmount(code, amount);
        } else {
            alert("가격 정보를 찾을 수 없습니다.");
        }
    } catch (e) {
        alert("오류: " + e.message);
    } finally {
        elements.cameraBtn.innerHTML = originalText;
        elements.cameraBtn.disabled = false;
        elements.cameraInput.value = '';
    }
}

// Mode 2: Detailed Receipt Scan (Modal)
async function scanReceipt(file, inputEl) {
    if (elements.receiptResult) elements.receiptResult.style.display = 'block';
    if (elements.receiptStatus) elements.receiptStatus.textContent = "AI가 영수증을 상세 분석 중입니다... (약 5-30초)";
    if (elements.receiptPreview) elements.receiptPreview.innerHTML = "";
    if (elements.saveReceiptBtn) elements.saveReceiptBtn.style.display = 'none';

    try {
        const base64Image = await prepareImageForAI(file);
        const result = await callOCR(base64Image, 'receipt');

        if (!result.success || !result.data) {
            throw new Error((result.error || '분석 실패') + (result.details ? "\n" + result.details : ""));
        }

        const data = result.data;
        const code = resolveCurrencyCode(data.currency);
        const total = parseAmount(data.total, code);
        const currencyLabel = code || data.currency || '';

        if (elements.receiptStatus) elements.receiptStatus.textContent = `✅ 분석 완료 (${describeOCREngine(result)})`;

        let html = `<strong>📅 날짜:</strong> ${escapeHtml(data.date || '미상')}<br>`;
        html += `<strong>🏪 상호:</strong> ${escapeHtml(data.store || '미상')}<br>`;
        html += `<strong>💰 총액:</strong> ${escapeHtml(total !== null ? formatAmountForInput(total) : (data.total ?? '미상'))} ${escapeHtml(currencyLabel)}<br>`;

        // 원화(또는 내 화폐) 환산
        if (code && total && state.exchangeRates[code]) {
            const home = (state.homeCurrency && state.exchangeRates[state.homeCurrency]) ? state.homeCurrency : 'KRW';
            if (home !== code) {
                const converted = total * state.exchangeRates[code].rate / state.exchangeRates[home].rate;
                const decimals = ZERO_DECIMAL_CURRENCIES.includes(home) ? 0 : 2;
                html += `<strong>💱 환산:</strong> 약 ${escapeHtml(getCurrencySymbol(home))}${escapeHtml(formatNumber(converted, decimals))} (${escapeHtml(home)})<br>`;
            }
        }

        html += `<strong>💳 결제:</strong> ${escapeHtml(data.paymentMethod || '미상')}<br>`;
        html += `<hr><strong>📝 품목 (한국어 번역됨):</strong><br>`;

        if (Array.isArray(data.items) && data.items.length > 0) {
            data.items.forEach(item => {
                html += `- ${escapeHtml(item && item.name)}: ${escapeHtml(item && item.price)}<br>`;
            });
        } else {
            html += `(세부 품목 없음)<br>`;
        }

        if (elements.receiptPreview) {
            elements.receiptPreview.innerHTML = html;

            if (code && total) {
                const applyBtn = document.createElement('button');
                applyBtn.type = 'button';
                applyBtn.className = 'action-btn btn-primary receipt-apply-btn';
                applyBtn.textContent = '🧮 계산기에 적용';
                applyBtn.onclick = () => {
                    applyScannedAmount(code, total);
                    closeReceiptModal();
                };
                elements.receiptPreview.appendChild(applyBtn);
            }
        }

        if (elements.saveReceiptBtn && authState.isLoggedIn) {
            const newBtn = elements.saveReceiptBtn.cloneNode(true);
            elements.saveReceiptBtn.parentNode.replaceChild(newBtn, elements.saveReceiptBtn);
            elements.saveReceiptBtn = newBtn;
            elements.saveReceiptBtn.style.display = 'block';
            elements.saveReceiptBtn.textContent = '💾 가계부에 저장';
            elements.saveReceiptBtn.disabled = false;
            elements.saveReceiptBtn.onclick = () => saveReceiptToSheet({
                ...data,
                total: total !== null ? total : data.total,
                currency: currencyLabel
            });
        }
    } catch (e) {
        if (elements.receiptStatus) elements.receiptStatus.textContent = "❌ 오류: " + e.message;
    } finally {
        if (inputEl) inputEl.value = '';
    }
}

// Helper: OCR 진입점 — 맥북 로컬 LLM을 먼저 시도하고, 실패하면 Gemini(Apps Script)로 넘어간다
async function callOCR(base64Image, mode) {
    if (typeof callLocalOCR === 'function' && typeof LOCAL_LLM !== 'undefined' && LOCAL_LLM.ENABLED) {
        const started = Date.now();
        try {
            const result = await callLocalOCR(base64Image, mode);
            console.log(`[OCR] 맥북 로컬 LLM 사용 (${((Date.now() - started) / 1000).toFixed(1)}초)`);
            return result;
        } catch (e) {
            console.warn(`[OCR] 맥북 로컬 LLM 실패 → Gemini로 전환: ${e.message}`);
        }
    }
    return callGeminiOCR(base64Image, mode);
}

// 판독에 쓴 엔진을 사람이 읽는 이름으로
function describeOCREngine(result) {
    return result && typeof result.usedModel === 'string' && result.usedModel.startsWith('local:')
        ? '맥북 AI' : 'Gemini';
}

// Helper: Call Gemini Backend
async function callGeminiOCR(base64Image, mode) {
    try {
        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'ocr',
                image: base64Image,
                mode: mode || 'price_tag', // Pass mode to backend
                mimeType: 'image/jpeg'
            })
        });

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        return await response.json();
    } catch (e) {
        console.error(e);
        throw new Error("네트워크 오류: " + e.message);
    }
}

// Helper: Save Receipt
async function saveReceiptToSheet(receiptData) {
    const btn = elements.saveReceiptBtn;
    if (!btn) return;

    btn.disabled = true;
    btn.textContent = "저장 중...";

    try {
        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'save',
                userEmail: authState.user.email,
                receiptData: receiptData
            })
        });

        const res = await response.json();
        if (res.success) {
            alert("✅ 가계부에 저장되었습니다!");
            closeReceiptModal();
        } else {
            throw new Error(res.error);
        }
    } catch (e) {
        alert("저장 실패: " + e.message);
        btn.disabled = false;
        btn.textContent = "💾 가계부에 저장";
    }
}

// setInput - Fixed Clear Button Visibility
function setInput(val) {
    if (elements.localAmount) {
        elements.localAmount.value = val;
        calculate();

        // Manual toggle of clear button
        const btn = document.querySelector(`.clear-btn[data-target="localAmount"]`);
        if (btn) {
            if (val && val.toString().length > 0) btn.classList.add('visible');
            else btn.classList.remove('visible');
        }
    }
}

// initOCRListeners - Robust Event Binding
function initOCRListeners() {
    // 1. Fast Price Tag Scan
    if (elements.cameraBtn && elements.cameraInput) {
        elements.cameraBtn.onclick = () => elements.cameraInput.click();
        elements.cameraInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) scanPriceTag(file);
        };
    }

    // 2. Receipt Modal: 촬영 / 업로드
    const bindReceiptInput = (btn, input) => {
        if (!btn || !input) return;
        btn.onclick = () => input.click();
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) scanReceipt(file, input);
        };
    };
    bindReceiptInput(elements.receiptCameraBtn, elements.receiptInput);
    bindReceiptInput(elements.receiptUploadBtn, elements.receiptUploadInput);
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    // Delay initialization slightly to ensure DOM is ready
    setTimeout(initOCRListeners, 200);
});
