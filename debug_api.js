const https = require('https');

const url = 'https://api.stock.naver.com/marketindex/exchanges';

https.get(url, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        try {
            // First parse
            // Naver sometimes returns direct JSON array, or wrapped
            let data = JSON.parse(rawData);

            // Check if wrapped in contents? (Usually simple API returns array directly, but let's see)
            // If data is array
            if (Array.isArray(data)) {
                console.log("Response is Array, length:", data.length);
                const item = data.find(i => i.symbolCode === 'IDR' || (i.name && i.name.includes('인도')));
                console.log("Found Item:", item);
            } else {
                console.log("Response is Object, keys:", Object.keys(data));
                // If it has result or contents
            }

        } catch (e) {
            console.error('Parse Error:', e.message);
            console.log('Raw Data snippet:', rawData.substring(0, 200));
        }
    });
}).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
});
