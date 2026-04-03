// Bright Data SERP API client
// All scrapers share this — only works with Google SERP URLs

import https from 'https';
import { Buffer } from 'buffer';

function getBrightDataConfig() {
  return {
    apiKey: process.env.BRIGHT_DATA_API_KEY || process.env.BRIGHTDATA_SERP_API_KEY || '',
    zone: process.env.BRIGHTDATA_SERP_ZONE || 'serp_api2',
  };
}

export function serpRequest(googleUrl) {
  return new Promise((resolve, reject) => {
    const { apiKey, zone } = getBrightDataConfig();
    if (!apiKey) {
      reject(new Error('Missing Bright Data API key.'));
      return;
    }

    const postData = JSON.stringify({ zone, url: googleUrl, format: 'raw' });
    const req = https.request({
      hostname: 'api.brightdata.com',
      path: '/request',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(postData),
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if ((res.statusCode || 500) >= 400) {
          reject(new Error(`Bright Data request failed with HTTP ${res.statusCode}: ${data.slice(0, 180)}`));
          return;
        }

        try {
          const parsed = JSON.parse(data);
          // SERP API returns { organic: [...] } for format: 'raw'
          if (parsed.organic) {
            resolve(parsed);
          } else if (parsed.body) {
            // Sometimes wraps in envelope
            const inner = typeof parsed.body === 'string' ? JSON.parse(parsed.body) : parsed.body;
            resolve(inner);
          } else {
            resolve(parsed);
          }
        } catch {
          reject(new Error('Failed to parse SERP response'));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('SERP request timeout'));
    });
    req.write(postData);
    req.end();
  });
}

// Build a Google search URL
export function googleSearchUrl(query, num = 15) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${num}&hl=en&gl=us`;
}
