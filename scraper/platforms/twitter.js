// Twitter/X Trending Scraper — via Bright Data SERP API
// Searches Google for trending Twitter/X topics

import { serpRequest, googleSearchUrl } from '../bright-data.js';
import { humanDelay } from '../anti-detection.js';

function getSearchDateContext() {
  const now = new Date();
  return {
    month: new Intl.DateTimeFormat('en-US', { month: 'long' }).format(now),
    year: now.getFullYear(),
  };
}

export async function scrapeTwitterTrending() {
  console.log('[Twitter/X] Starting scrape...');
  const results = [];
  const seen = new Set();
  const { month, year } = getSearchDateContext();

  const queries = [
    `twitter trending topics today United States ${month} ${year}`,
    'what is trending on X twitter right now',
    'twitter trending hashtags right now',
  ];

  for (const query of queries) {
    try {
      const data = await serpRequest(googleSearchUrl(query, 15));
      for (const r of data.organic || []) {
        const topics = extractTopics(r.title, r.description);
        for (const topic of topics) {
          const key = topic.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (key.length < 3 || seen.has(key)) continue;
          seen.add(key);
          results.push({
            name: topic,
            platform: 'Twitter/X',
            volume: 0,
            source: 'twitter-serp',
            scrapedAt: new Date().toISOString(),
          });
        }
      }
      console.log(`[Twitter/X] "${query}" → results`);
      await humanDelay('action');
    } catch (err) {
      console.warn(`[Twitter/X] Query failed:`, err.message);
    }
  }

  console.log(`[Twitter/X] Total trends: ${results.length}`);
  return results;
}

function extractTopics(title, description) {
  const topics = [];
  const text = `${title || ''} ${description || ''}`;

  // Extract hashtags — most reliable signal for Twitter trends
  const hashPattern = /#([A-Za-z]\w{2,25})/g;
  let match;
  while ((match = hashPattern.exec(text)) !== null) {
    topics.push('#' + match[1]);
  }

  // Extract quoted trending topics
  const quotePattern = /[""]([^"""]{3,40})[""]|"([^"]{3,40})"/g;
  while ((match = quotePattern.exec(text)) !== null) {
    const t = (match[1] || match[2]).trim();
    if (isValidTopic(t)) topics.push(t);
  }

  // Extract from comma-separated lists of trends
  const listPattern = /(?:trending|popular|top).*?[:\-–]\s*(.+?)(?:\.\s|$)/gi;
  while ((match = listPattern.exec(text)) !== null) {
    const items = match[1].split(/[,;]/).map(s => s.replace(/\band\b/gi, '').trim()).filter(s => s.length >= 3 && s.length <= 40);
    for (const item of items) {
      if (isValidTopic(item)) topics.push(item);
    }
  }

  return [...new Set(topics)].slice(0, 5);
}

function isValidTopic(name) {
  if (!name || name.length < 3 || name.length > 50) return false;
  const lower = name.toLowerCase();
  const blocklist = [
    'twitter', 'trending', 'x.com', 'united states', 'sign in', 'hashtags',
    'topics', 'what is', 'right now', 'today', 'read more', 'posts',
    'trending topics', 'top trending', 'see more', 'worldwide',
  ];
  return !blocklist.some(b => lower === b);
}
