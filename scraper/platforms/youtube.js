// YouTube Trending Scraper — via Bright Data SERP API
// Searches Google for trending YouTube content

import { serpRequest, googleSearchUrl } from '../bright-data.js';
import { humanDelay } from '../anti-detection.js';

function getSearchDateContext() {
  const now = new Date();
  return {
    month: new Intl.DateTimeFormat('en-US', { month: 'long' }).format(now),
    year: now.getFullYear(),
  };
}

export async function scrapeYouTubeTrending() {
  console.log('[YouTube] Starting scrape...');
  const results = [];
  const seen = new Set();
  const { month, year } = getSearchDateContext();

  const queries = [
    `site:youtube.com trending videos today ${year}`,
    'youtube trending videos this week',
    'most watched youtube videos right now',
    `youtube viral videos ${month} ${year}`,
  ];

  for (const query of queries) {
    try {
      const data = await serpRequest(googleSearchUrl(query, 12));
      for (const r of data.organic || []) {
        // Only include actual YouTube video results (not channel pages, playlists)
        if (!r.link || !r.link.includes('youtube.com')) continue;
        if (r.link.includes('/channel/') || r.link.includes('/@') || r.link.includes('/playlist')) continue;

        const title = cleanYouTubeTitle(r.title);
        if (!title) continue;

        const key = title.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (key.length < 3 || seen.has(key)) continue;
        seen.add(key);

        const volume = extractViewCount(r.description);

        results.push({
          name: title,
          platform: 'YouTube',
          volume,
          source: 'youtube-serp',
          scrapedAt: new Date().toISOString(),
        });
      }
      console.log(`[YouTube] "${query}" → results`);
      await humanDelay('action');
    } catch (err) {
      console.warn(`[YouTube] Query failed:`, err.message);
    }
  }

  console.log(`[YouTube] Total trends: ${results.length}`);
  return results;
}

function cleanYouTubeTitle(title) {
  if (!title) return null;
  let cleaned = title.replace(/\s*[-–—]\s*YouTube\s*$/i, '').trim();
  if (cleaned.length < 5 || cleaned.length > 100) return null;
  // Filter out meta pages
  if (/^(subscribe|notification|playlist|channel|what's trending)/i.test(cleaned)) return null;
  return cleaned;
}

function extractViewCount(desc) {
  if (!desc) return 0;
  const match = desc.match(/([\d,.]+)\s*(K|M|B)?\s*views/i);
  if (!match) return 0;
  const num = parseFloat(match[1].replace(/,/g, ''));
  const suffix = (match[2] || '').toUpperCase();
  if (suffix === 'K') return Math.round(num * 1000);
  if (suffix === 'M') return Math.round(num * 1000000);
  if (suffix === 'B') return Math.round(num * 1000000000);
  return Math.round(num);
}
