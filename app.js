/**
 * 환율 계산기 앱 - Currency Exchange Calculator
 * 대한민국 원화(KRW) 기준 실시간 환율 계산
 */

// ===================================
// Configuration & Constants
// ===================================

const CONFIG = {
    PROXIES: [
        'https://api.codetabs.com/v1/proxy?quest=',
        'https://corsproxy.io/?',
        'https://api.allorigins.win/raw?url=',
        'https://thingproxy.freeboard.io/fetch/'
    ],
    // Swapped: Global Standard is now TARGET (Primary), Naver is BACKUP
    TARGET_URL: 'https://open.er-api.com/v6/latest/KRW',
    GEO_API: 'https://api.bigdatacloud.net/data/reverse-geocode-client',
    BACKUP_API: 'https://api.stock.naver.com/marketindex/exchanges', // Naver as Backup via Proxy
    UPDATE_INTERVAL: 0,
    CACHE_KEY: 'exchange_rates_cache_v2' // Version bump for new structure
};

const FALLBACK_DATA = [
    { "symbolCode": "USD", "name": "미국 USD", "stockExchangeType": { "nationCode": "USA", "nationName": "미국" }, "calcPrice": "1423.80", "closePrice": "1,423.80", "unit": "KRW" },
    { "symbolCode": "EUR", "name": "유럽 EUR", "stockExchangeType": { "nationCode": "EU", "nationName": "유럽연합" }, "calcPrice": "1708.63", "closePrice": "1,708.63", "unit": "KRW" },
    { "symbolCode": "JPY", "name": "일본 JPY (100엔)", "stockExchangeType": { "nationCode": "JPN", "nationName": "일본" }, "calcPrice": "933.24", "closePrice": "933.24", "unit": "KRW" },
    { "symbolCode": "CNY", "name": "중국 CNY", "stockExchangeType": { "nationCode": "CHN", "nationName": "중국" }, "calcPrice": "205.21", "closePrice": "205.21", "unit": "KRW" },
    { "symbolCode": "HKD", "name": "홍콩 HKD", "stockExchangeType": { "nationCode": "HKG", "nationName": "홍콩" }, "calcPrice": "182.50", "closePrice": "182.50", "unit": "KRW" },
    { "symbolCode": "TWD", "name": "대만 TWD", "stockExchangeType": { "nationCode": "TWN", "nationName": "대만" }, "calcPrice": "44.80", "closePrice": "44.80", "unit": "KRW" },
    { "symbolCode": "GBP", "name": "영국 GBP", "stockExchangeType": { "nationCode": "GBR", "nationName": "영국" }, "calcPrice": "1800.50", "closePrice": "1,800.50", "unit": "KRW" },
    { "symbolCode": "CAD", "name": "캐나다 CAD", "stockExchangeType": { "nationCode": "CAN", "nationName": "캐나다" }, "calcPrice": "1050.20", "closePrice": "1,050.20", "unit": "KRW" },
    { "symbolCode": "CHF", "name": "스위스 CHF", "stockExchangeType": { "nationCode": "CHE", "nationName": "스위스" }, "calcPrice": "1580.40", "closePrice": "1,580.40", "unit": "KRW" },
    { "symbolCode": "AUD", "name": "호주 AUD", "stockExchangeType": { "nationCode": "AUS", "nationName": "호주" }, "calcPrice": "920.30", "closePrice": "920.30", "unit": "KRW" },
    { "symbolCode": "SGD", "name": "싱가포르 SGD", "stockExchangeType": { "nationCode": "SGP", "nationName": "싱가포르" }, "calcPrice": "1050.80", "closePrice": "1,050.80", "unit": "KRW" },
    { "symbolCode": "THB", "name": "태국 THB", "stockExchangeType": { "nationCode": "THA", "nationName": "태국" }, "calcPrice": "41.50", "closePrice": "41.50", "unit": "KRW" },
    { "symbolCode": "IDR", "name": "인도네시아 IDR 100", "stockExchangeType": { "nationCode": "IDN", "nationName": "인도네시아" }, "calcPrice": "9.00", "closePrice": "9.00", "unit": "KRW" },
    { "symbolCode": "VND", "name": "베트남 VND 100", "stockExchangeType": { "nationCode": "VNM", "nationName": "베트남" }, "calcPrice": "6.00", "closePrice": "6.00", "unit": "KRW" },
    { "symbolCode": "MYR", "name": "말레이시아 MYR", "stockExchangeType": { "nationCode": "MYS", "nationName": "말레이시아" }, "calcPrice": "318.50", "closePrice": "318.50", "unit": "KRW" },
    { "symbolCode": "PHP", "name": "필리핀 PHP", "stockExchangeType": { "nationCode": "PHL", "nationName": "필리핀" }, "calcPrice": "25.20", "closePrice": "25.20", "unit": "KRW" },
    { "symbolCode": "ZAR", "name": "남아공 ZAR", "stockExchangeType": { "nationCode": "ZAF", "nationName": "남아프리카공화국" }, "calcPrice": "78.50", "closePrice": "78.50", "unit": "KRW" },
    { "symbolCode": "RUB", "name": "러시아 RUB", "stockExchangeType": { "nationCode": "RUS", "nationName": "러시아" }, "calcPrice": "15.20", "closePrice": "15.20", "unit": "KRW" },
    { "symbolCode": "TRY", "name": "튀르키예 TRY", "stockExchangeType": { "nationCode": "TUR", "nationName": "튀르키예" }, "calcPrice": "40.50", "closePrice": "40.50", "unit": "KRW" },
    { "symbolCode": "BRL", "name": "브라질 BRL", "stockExchangeType": { "nationCode": "BRA", "nationName": "브라질" }, "calcPrice": "245.20", "closePrice": "245.20", "unit": "KRW" },
    { "symbolCode": "MXN", "name": "멕시코 MXN", "stockExchangeType": { "nationCode": "MEX", "nationName": "멕시코" }, "calcPrice": "72.10", "closePrice": "72.10", "unit": "KRW" },
    { "symbolCode": "AED", "name": "UAE AED", "stockExchangeType": { "nationCode": "ARE", "nationName": "아랍에미리트" }, "calcPrice": "387.60", "closePrice": "387.60", "unit": "KRW" },
    { "symbolCode": "INR", "name": "인도 INR", "stockExchangeType": { "nationCode": "IND", "nationName": "인도" }, "calcPrice": "16.80", "closePrice": "16.80", "unit": "KRW" },
    { "symbolCode": "SAR", "name": "사우디 SAR", "stockExchangeType": { "nationCode": "SAU", "nationName": "사우디아라비아" }, "calcPrice": "379.50", "closePrice": "379.50", "unit": "KRW" },
    { "symbolCode": "NZD", "name": "뉴질랜드 NZD", "stockExchangeType": { "nationCode": "NZL", "nationName": "뉴질랜드" }, "calcPrice": "850.20", "closePrice": "850.20", "unit": "KRW" },
    { "symbolCode": "CZK", "name": "체코 CZK", "stockExchangeType": { "nationCode": "CZE", "nationName": "체코" }, "calcPrice": "60.50", "closePrice": "60.50", "unit": "KRW" },
    { "symbolCode": "PLN", "name": "폴란드 PLN", "stockExchangeType": { "nationCode": "POL", "nationName": "폴란드" }, "calcPrice": "355.40", "closePrice": "355.40", "unit": "KRW" },
    { "symbolCode": "HUF", "name": "헝가리 HUF", "stockExchangeType": { "nationCode": "HUN", "nationName": "헝가리" }, "calcPrice": "3.80", "closePrice": "3.80", "unit": "KRW" }
];

const CURRENCY_NAMES = {
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
    serviceChargeType: 'percent',
    isOptionsOpen: false,
    isOptionsOpen: false,
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
    resultBreakdown: document.getElementById('resultBreakdown'),
    refreshRateBtn: document.getElementById('refreshRateBtn'),
    rateUpdateTime: document.getElementById('rateUpdateTime')
};

// ===================================
// Main Logic
// ===================================

async function fetchExchangeRates(forceUpdate = false) {
    // 1. Smart Cache Check
    const cached = localStorage.getItem(CONFIG.CACHE_KEY);
    let nextUpdateUnix = 0;

    if (cached) {
        try {
            const { data, timestamp, source, nextUpdate } = JSON.parse(cached);

            // "If data to bring is same... don't bring."
            // Check nextUpdate time if available
            const now = new Date().getTime();
            if (nextUpdate && now < nextUpdate) {
                // Data is still valid according to API promise
                if (forceUpdate) {
                    // Force blur before alert to remove button state on mobile
                    if (document.activeElement) document.activeElement.blur();
                    setTimeout(() => {
                        alert('현재 데이터가 최신입니다.\n(다음 업데이트: ' + formatTime(new Date(nextUpdate)) + ')');
                    }, 100); // Slight increase in delay to ensure blur renders
                }
                processData(data); // Use cached
                state.lastUpdated = new Date(timestamp);
                state.nextUpdate = nextUpdate; // Restore state
                updateSourceInfo(source);
                updateRateStatus(`최신 데이터 유지 중 (${source}): ${formatTime(state.lastUpdated)}`);

                if (state.currencyList.length > 0) {
                    renderCurrencyOptions(state.currencyList);
                    selectCurrency(state.selectedCurrency);
                }
                return;
            }

            // If cache exists but might be old, use it initially if !forceUpdate
            if (!forceUpdate) {
                processData(data);
                state.lastUpdated = new Date(timestamp);
                updateSourceInfo(source);
                updateRateStatus(`저장된 데이터 (${source}): ${formatTime(state.lastUpdated)}`);
                if (state.currencyList.length > 0) {
                    renderCurrencyOptions(state.currencyList);
                    selectCurrency(state.selectedCurrency);
                }
                return;
            }
        } catch (e) {
            console.warn('Cache invalid', e);
            localStorage.removeItem(CONFIG.CACHE_KEY);
        }
    }

    updateRateStatus('환율 정보 연결 중...');
    let success = false;
    let fetchedData = null;

    // Check if we are running in file:// mode
    const isLocalFile = window.location.protocol === 'file:';

    // 2. Try Proxies
    for (const proxy of CONFIG.PROXIES) {
        try {
            const url = proxy + encodeURIComponent(CONFIG.TARGET_URL);
            // Add timeout signal to fail fast
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout per proxy

            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            let ratesData;
            // Handle different proxy response formats
            if (proxy.includes('allorigins') || proxy.includes('thingproxy')) {
                // Some proxies might return wrapped JSON or just raw. 
                // Thingproxy returns raw usually. Allorigins with 'raw' returns raw.
                // We kept 'raw' param in config for allorigins.
                ratesData = await response.json();
                // If wrapped in contents (standard allorigins without raw), handle it.
                if (ratesData.contents) ratesData = JSON.parse(ratesData.contents);
            } else {
                ratesData = await response.json();
            }

            if (!ratesData || (!Array.isArray(ratesData) && !ratesData.rates && ratesData.result !== 'success')) throw new Error('Invalid data');

            fetchedData = ratesData;
            processData(ratesData); // Changed from processExchangeData
            success = true;
            break;
        } catch (e) {
            console.warn(`Proxy ${proxy} failed:`, e);
        }
    }

    // 3. Backup API (Naver)
    if (!success) {
        try {
            const res = await fetch(CONFIG.BACKUP_API);
            if (res.ok) {
                const data = await res.json();
                fetchedData = data; // Store for caching
                processData(data); // Changed from processBackupData
                state.lastUpdated = new Date();
                // updateRateStatus(`업데이트 (Naver/Hana Bank): ${formatTime(state.lastUpdated)}`); // This will be handled by the common caching block
                success = true;
            }
        } catch (e) {
            console.warn('Backup failed:', e);
        }
    }

    // 4. Fallback (Offline hardcoded)
    if (!success) {
        processData(FALLBACK_DATA); // Changed from processExchangeData
        updateRateStatus('오프라인 모드 (기본값 사용)');
    } else if (fetchedData) {
        state.lastUpdated = new Date();

        let finalSource = 'Unknown';
        let nextUpdate = 0;

        // determine source type
        if (Array.isArray(fetchedData)) {
            finalSource = 'Naver/Hana Bank';
            // Naver doesn't give next update, assume 1 hour? Or just 0.
        } else if (fetchedData.result === 'success' || fetchedData.rates) {
            finalSource = 'Global Standard API';
            if (fetchedData.time_next_update_unix) {
                nextUpdate = fetchedData.time_next_update_unix * 1000;
            }
        }

        updateSourceInfo(finalSource);
        updateRateStatus(`업데이트 (${finalSource}): ${formatTime(state.lastUpdated)}`);

        try {
            const cachePayload = {
                data: fetchedData,
                timestamp: state.lastUpdated.getTime(),
                source: finalSource,
                nextUpdate: nextUpdate
            };
            localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(cachePayload));
        } catch (e) {
            console.warn('Cache write failed', e);
        }
    }

    if (state.currencyList.length > 0) {
        renderCurrencyOptions(state.currencyList);
        // Do not reset selection if it exists and valid
        if (!state.exchangeRates[state.selectedCurrency]) {
            selectCurrency('USD');
        } else {
            selectCurrency(state.selectedCurrency);
        }
    }
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

function processData(data) {
    // Unify processing. Detect type.
    if (Array.isArray(data)) {
        processNaverData(data);
    } else if (data.rates || (data.result === 'success')) {
        processGlobalData(data);
    }
}

function updateSourceInfo(sourceName) {
    const footer = document.getElementById('sourceInfo');
    if (footer) {
        if (sourceName.includes('Naver')) {
            footer.innerHTML = '환율 정보: 하나은행 (Naver)';
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

function renderCurrencyOptions(list) {
    elements.currencyOptionsList.innerHTML = '';
    if (list.length === 0) {
        elements.currencyOptionsList.innerHTML = '<div class="no-results">검색 결과가 없습니다</div>';
        return;
    }
    list.forEach(item => {
        const option = document.createElement('div');
        option.className = 'option-item';
        if (item.code === state.selectedCurrency) option.classList.add('selected');

        option.innerHTML = `
            <div class="option-info">
                <span class="option-name">${item.nationName}</span>
                <span class="option-code">(${item.code})</span>
            </div>
            ${item.code === state.selectedCurrency ? '<span style="color:var(--accent-primary)">✔</span>' : ''}
        `;
        option.addEventListener('click', () => selectCurrency(item.code));
        elements.currencyOptionsList.appendChild(option);
    });
}

function selectCurrency(code) {
    if (!state.exchangeRates[code]) return;
    state.selectedCurrency = code;
    const data = state.exchangeRates[code];

    elements.selectedCurrencyText.textContent = `${data.nationName} (${data.code})`;

    let rateText = formatNumber(data.rate, 2);
    if (['JPY', 'VND', 'IDR'].includes(code)) {
        elements.currentRateDisplay.textContent = `${data.displayRate} (100${code})`;
    } else {
        elements.currentRateDisplay.textContent = rateText;
    }

    elements.currencySymbol.textContent = getCurrencySymbol(code);

    // Update unit for Fixed Tip if active
    if (state.serviceChargeType === 'fixed') {
        elements.serviceChargeUnit.textContent = getCurrencySymbol(code);
    }

    closeSearch();
    calculate();
}

// ===================================
// UI Interaction Logic
// ===================================

function openSearch() {
    state.isSearchOpen = true;
    elements.currencyDisplay.style.display = 'none';
    elements.currencySearchWrapper.style.display = 'block';
    elements.currencySearchInput.value = '';
    renderCurrencyOptions(state.currencyList);
    elements.currencySearchInput.focus();
}

function closeSearch() {
    state.isSearchOpen = false;
    elements.currencySearchWrapper.style.display = 'none';
    elements.currencyDisplay.style.display = 'flex';
}

function filterCurrencyList(query) {
    const lowerQuery = query.toLowerCase();
    const filtered = state.currencyList.filter(item =>
        item.code.toLowerCase().includes(lowerQuery) ||
        item.name.toLowerCase().includes(lowerQuery) ||
        item.nationName.toLowerCase().includes(lowerQuery)
    );
    renderCurrencyOptions(filtered);
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
    const exchangeRate = state.exchangeRates[state.selectedCurrency].rate;

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
    const resultKRW = withFee * exchangeRate;

    elements.resultValue.textContent = formatNumber(Math.round(resultKRW));

    updateBreakdown({
        localAmount, serviceCharge, withService, taxRate,
        withTax, feeRate, withFee, exchangeRate, resultKRW
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

        html += `
            <div class="breakdown-item"><span>현지 총액</span><span>${symbol}${formatNumber(data.withFee, 2)}</span></div>
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
    elements.currencyDisplay.addEventListener('click', openSearch);
    elements.closeSearchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeSearch();
    });
    elements.currencySearchInput.addEventListener('input', (e) => filterCurrencyList(e.target.value));

    document.addEventListener('click', (e) => {
        if (state.isSearchOpen &&
            !elements.currencySearchWrapper.contains(e.target) &&
            !elements.currencyDisplay.contains(e.target)) {
            closeSearch();
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

    elements.refreshRateBtn.addEventListener('click', async () => {
        await fetchExchangeRates(true);
        elements.refreshRateBtn.blur();
    });
    elements.detectLocationBtn.addEventListener('click', () => detectLocation(true));
}

async function detectLocation(interactive = false) {
    if (!navigator.geolocation) {
        if (interactive) alert('미지원 브라우저입니다.');
        return;
    }

    if (interactive) elements.detectLocationBtn.innerHTML = '<span>⏳ 감지 중...</span>';

    try {
        const position = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 }));
        const { latitude, longitude } = position.coords;
        const res = await fetch(`${CONFIG.GEO_API}?latitude=${latitude}&longitude=${longitude}&localityLanguage=ko`);
        const data = await res.json();

        // Extract TimeZone from informative block (look for "Area/City" pattern)
        if (data.localityInfo && data.localityInfo.informative) {
            const tzEntry = data.localityInfo.informative.find(i => i.name && i.name.includes('/') && !i.name.includes(' '));
            if (tzEntry) {
                state.detectedTimeZone = tzEntry.name;
            }
        }

        const countryCode = data.countryCode;
        const found = state.currencyList.find(c => c.code.startsWith(countryCode) || c.nationName === data.countryName);

        if (found) {
            selectCurrency(found.code);
            if (interactive) alert(`📍 ${data.countryName} 감지 완료`);
        } else {
            if (interactive) alert(`📍 ${data.countryName} 감지됨 (화폐 정보 없음)`);
        }
    } catch (e) {
        console.error(e);
        if (interactive) alert('위치 감지 실패');
    } finally {
        elements.detectLocationBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
            </svg><span>현재 위치로 찾기</span>
        `;
    }
}

function init() {
    initEventListeners();

    // User requested "Location First" flow to reduce perceived data usage (even if packet is same)
    // and to set context before fetching.
    updateRateStatus('위치 정보 확인 중...');

    // We try detectLocation first. If it fails or times out, we proceed.
    detectLocation(false).then(() => {
        // After location check, fetch data.
        // If location found, `selectedCurrency` might be updated.
        // Then fetchExchangeRates will use that selection.
        fetchExchangeRates(false);
    });

    // Load saved options
    loadOptions();

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
    const options = {
        serviceCharge: elements.serviceCharge.value,
        taxRate: elements.taxRate.value,
        feeRate: elements.feeRate.value,
        serviceChargeType: state.serviceChargeType
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

document.addEventListener('DOMContentLoaded', init);
