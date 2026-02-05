// Google Apps Script Code - PRODUCTION VERSION

const PROPERTIES = PropertiesService.getScriptProperties();
const GEMINI_API_KEY_NAME = 'GEMINI_API_KEY';

const MODELS_TO_TRY = [
  'gemini-2.5-flash',      // [1순위] 최신 2.5 버전 (Standard)
  'gemini-2.5-flash-lite', // [2순위] 경량화 버전 (Backup)
  'gemini-2.5-pro',        // [3순위] 고성능 버전 (High Quality Fallback)
  'gemma-3-12b-it',        // [4순위] Gemma 3 12B (User Request)
  'gemma-3-27b-it'         // [5순위] Gemma 3 27B (User Request)
];

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
    promptText = "Analyze this receipt image. Return a JSON object with these fields: store (string), date (YYYY-MM-DD), total (number), currency (string - extract symbol like $, ¥, € or code), paymentMethod (string), items (array of {name, price}). Rule: Translate item names to Korean.";
  } else {
    promptText = "Analyze this price tag image. Return a JSON object with fields: 'total' (number) and 'currency' (string). Rules: 1. Extract the currency symbol EXACTLY as seen (e.g. ¥, $, €, ฿, ₩). 2. If no symbol is visible, try to infer ISO code. 3. Return only the numeric value for total. 4. Ignore other text.";
  }

  let logs = [];

  // Robust Fallback Loop
  for (const model of MODELS_TO_TRY) {
    try {
      console.log(`Trying model: ${model}...`); // Internal log
      const result = callGeminiAPI(model, apiKey, imageBase64, mimeType, promptText);
      
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

function callGeminiAPI(model, apiKey, imageBase64, mimeType, promptText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{
      parts: [
        { text: promptText },
        { inline_data: { mime_type: mimeType, data: imageBase64 } }
      ]
    }]
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
