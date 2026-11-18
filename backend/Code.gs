// Google Apps Script Code - PRODUCTION VERSION

const PROPERTIES = PropertiesService.getScriptProperties();
const GEMINI_API_KEY_NAME = 'GEMINI_API_KEY';

// 2026-11-17: gemini-2.5-pro("no longer available to new users")와 gemma-3-*(404)는 더 이상 호출할 수 없어 뺐다.
// gemini-2.5-pro 대신 API가 안내한 gemini-3.1-pro-preview를 넣었다.
const MODELS_TO_TRY = [
  'gemini-2.5-flash',       // [1순위] 기본
  'gemini-2.5-flash-lite',  // [2순위] 경량 백업
  'gemini-3.1-pro-preview'  // [3순위] 고성능 백업 (preview — 이름이 바뀌면 교체)
];

// 응답을 JSON으로 강제한다. 가격을 못 읽으면 모델이 영어 문장("I am unable...")으로 답해
// JSON 파싱이 깨지고 다음 모델로 넘어가던 문제를 막는다.
const OCR_SCHEMAS = {
  receipt: {
    type: 'OBJECT',
    properties: {
      store: { type: 'STRING' },
      date: { type: 'STRING' },
      total: { type: 'NUMBER' },
      currency: { type: 'STRING' },
      paymentMethod: { type: 'STRING' },
      items: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: { name: { type: 'STRING' }, price: { type: 'NUMBER' } },
          required: ['name', 'price']
        }
      }
    },
    required: ['store', 'date', 'total', 'currency', 'paymentMethod', 'items']
  },
  price_tag: {
    type: 'OBJECT',
    properties: {
      total: { type: 'NUMBER' },
      currency: { type: 'STRING' }
    },
    required: ['total', 'currency']
  }
};

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'ocr') {
      return handleOCR(data);
    } else if (action === 'save') {
      return handleSave(data);
    }
    
    return createResponse({ error: 'Invalid action' });
  } catch (err) {
    return createResponse({ error: err.toString() });
  }
}

function handleOCR(data) {
  const imageBase64 = data.image;
  const mimeType = data.mimeType || 'image/jpeg';
  const mode = data.mode || 'price_tag'; 
  
  const apiKey = PROPERTIES.getProperty(GEMINI_API_KEY_NAME);
  
  if (!apiKey) {
    return createResponse({ error: 'Server API Key not configured' });
  }

  // Define Prompts
  let promptText = "";
  if (mode === 'receipt') {
    promptText = "Analyze this receipt image. Return a JSON object with these fields: store (string), date (YYYY-MM-DD), total (number), currency (string - extract symbol like $, ¥, € or code), paymentMethod (string), items (array of {name, price}). Rule: Translate item names to Korean. If the image is not a readable receipt, return total 0, empty strings and an empty items array.";
  } else {
    promptText = "Analyze this price tag image. Return a JSON object with fields: 'total' (number) and 'currency' (string). Rules: 1. Extract the currency symbol EXACTLY as seen (e.g. ¥, $, €, ฿, ₩). 2. If no symbol is visible, try to infer ISO code. 3. Return only the numeric value for total. 4. Ignore other text. 5. If no price is readable, return total 0 and currency \"\".";
  }
  const schema = OCR_SCHEMAS[mode === 'receipt' ? 'receipt' : 'price_tag'];

  let logs = [];

  // Robust Fallback Loop
  for (const model of MODELS_TO_TRY) {
    try {
      console.log(`Trying model: ${model}...`); // Internal log
      const result = callGeminiAPI(model, apiKey, imageBase64, mimeType, promptText, schema);
      
      // Success!
      result.mode = mode; 
      return createResponse({ success: true, data: result, usedModel: model });
      
    } catch (e) {
      const isQuota = e.message.includes('429') || e.message.includes('Quota');
      const failMsg = `⚠️ [${model}] ${isQuota ? '사용량 초과(Quota Exceeded)' : '오류'}: ${e.message}`;
      
      console.warn(failMsg);
      logs.push(failMsg);
      // Auto-continue to next model in list
    }
  }

  // All failed
  return createResponse({ 
    error: 'All models failed', 
    details: logs.join('\n')
  });
}

function callGeminiAPI(model, apiKey, imageBase64, mimeType, promptText, schema) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{
      parts: [
        { text: promptText },
        { inline_data: { mime_type: mimeType, data: imageBase64 } }
      ]
    }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: 0
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();
  
  if (responseCode !== 200) {
    throw new Error(`HTTP ${responseCode}: ${responseText}`);
  }

  const result = JSON.parse(responseText);
  
  if (!result.candidates || result.candidates.length === 0) {
     throw new Error('No content from model');
  }
  
  const text = result.candidates[0].content.parts[0].text;
  const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleanText);
}

function handleSave(data) {
  const receiptData = data.receiptData;
  const userEmail = data.userEmail;
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Receipts');
  if (!sheet) {
    sheet = ss.insertSheet('Receipts');
    sheet.appendRow(['Timestamp', 'User Email', 'Store', 'Date', 'Total', 'Currency', 'Payment', 'Items JSON']);
  }
  
  sheet.appendRow([
    new Date(),
    userEmail,
    receiptData.store || 'Unknown',
    receiptData.date || '',
    receiptData.total,
    receiptData.currency,
    receiptData.paymentMethod || 'Unknown',
    JSON.stringify(receiptData.items || [])
  ]);
  
  return createResponse({ success: true, message: 'Saved to Sheets' });
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// [진단용] 모델 연결 테스트 함수
// 이 함수를 선택하고 [실행]하여 로그를 확인하세요.
function testModelConnection() {
  const apiKey = PROPERTIES.getProperty(GEMINI_API_KEY_NAME);
  Logger.log("Testing models: " + MODELS_TO_TRY.join(", "));

  for (const model of MODELS_TO_TRY) {
    Logger.log(`👉 Testing [${model}]...`);
    try {
      // 1. Simple Text Test
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = { contents: [{ parts: [{ text: "Hello" }] }] };
      const options = {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };
      
      const response = UrlFetchApp.fetch(url, options);
      if (response.getResponseCode() === 200) {
        Logger.log(`   ✅ Success (Text): Reachable`);
      } else {
        Logger.log(`   ❌ Failed (Text): ${response.getContentText()}`);
      }
    } catch (e) {
      Logger.log(`   ❌ Error: ${e.message}`);
    }
  }
}
