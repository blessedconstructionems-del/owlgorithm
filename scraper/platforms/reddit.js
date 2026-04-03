// Reddit Trending Scraper — via Bright Data SERP API
// Searches Google for trending Reddit posts

import { serpRequest, googleSearchUrl } from '../bright-data.js';
import { humanDelay } from '../anti-detection.js';

function getSearchDateContext() {
  const now = new Date();
  return { year: now.getFullYear() };
}

export async function scrapeRedditTrending() {
  console.log('[Reddit] Starting scrape...');
  const results = [];
  const seen = new Set();
  const { year } = getSearchDateContext();

  const queries = [
    `site:reddit.com viral post today ${year}`,
    'reddit front page today most popular',
    'reddit trending discussions this week',
    'site:reddit.com popular right now',
  ];

  for (const query of queries) {
    try {
      const data = await serpRequest(googleSearchUrl(query, 15));
      for (const r of data.organic || []) {
        // Only include actual Reddit post results
        if (!r.link || !r.link.includes('reddit.com')) continue;
        // Skip wiki pages, user profiles, about pages
        if (r.link.includes('/wiki/') || r.link.includes('/user/') || r.link.includes('/about/')) continue;

        const title = cleanRedditTitle(r.title);
        if (!title) continue;

        const key = title.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (key.length < 3 || seen.has(key)) continue;
        seen.add(key);

        const subreddit = extractSubreddit(r.link);
        const upvotes = extractUpvotes(r.description);

        results.push({
          name: title,
          platform: 'Reddit',
          volume: upvotes,
          comments: 0,
          subreddit: subreddit || '',
          source: 'reddit-serp',
          scrapedAt: new Date().toISOString(),
        });
      }
      console.log(`[Reddit] "${query}" → results`);
      await humanDelay('action');
    } catch (err) {
      console.warn(`[Reddit] Query failed:`, err.message);
    }
  }

  console.log(`[Reddit] Total trends: ${results.length}`);
  return results;
}

function cleanRedditTitle(title) {
  if (!title) return null;
  let cleaned = title
    .replace(/\s*:\s*r\/\w+\s*$/i, '')
    .replace(/\s*[-–—]\s*Reddit\s*$/i, '')
    .replace(/\s*\|\s*Reddit\s*$/i, '')
    .replace(/\s*-\s*r\/\w+\s*$/i, '')
    .trim();
  if (cleaned.length < 5 || cleaned.length > 100) return null;
  // Filter out meta posts about Reddit features
  if (/\b(subreddit|moderator|reddit (app|mobile|desktop|premium)|upvote system|karma system|redesign)\b/i.test(cleaned)) return null;
  return cleaned;
}

function extractSubreddit(url) {
  if (!url) return null;
  const match = url.match(/reddit\.com\/r\/(\w+)/i);
  return match ? `r/${match[1]}` : null;
}

function extractUpvotes(desc) {
  if (!desc) return 0;
  const match = desc.match(/([\d,.]+)\s*(K|M)?\s*(upvotes|points|votes)/i);
  if (!match) return 0;
  const num = parseFloat(match[1].replace(/,/g, ''));
  const suffix = (match[2] || '').toUpperCase();
  if (suffix === 'K') return Math.round(num * 1000);
  if (suffix === 'M') return Math.round(num * 1000000);
  return Math.round(num);
}
