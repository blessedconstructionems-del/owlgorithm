// Google Trends Scraper — via Bright Data SERP API
// Searches Google for trending topics, extracts real topics from SERP results

import { serpRequest, googleSearchUrl } from '../bright-data.js';
import { humanDelay } from '../anti-detection.js';

function getSearchDateContext() {
  const now = new Date();
  return {
    month: new Intl.DateTimeFormat('en-US', { month: 'long' }).format(now),
    year: now.getFullYear(),
  };
}

export async function scrapeGoogleTrends() {
  console.log('[Google Trends] Starting scrape...');
  const results = [];
  const seen = new Set();
  const { month, year } = getSearchDateContext();

  // Phase 1: Google Trends page — descriptions list actual trending searches
  try {
    const data = await serpRequest(googleSearchUrl('site:trends.google.com trending', 10));
    for (const r of data.organic || []) {
      // Google Trends descriptions often list actual trending terms
      const topics = extractListedTopics(r.description);
      addTopics(topics, 'google-trends-page', results, seen);
    }
    await humanDelay('action');
  } catch (err) {
    console.warn('[Google Trends] Trends page search failed:', err.message);
  }

  // Phase 2: Targeted trending queries — get SERP results that mention actual trends
  const queries = [
    `trending topics today ${month} ${year}`,
    'what is trending on social media right now',
    `viral trends this week ${year}`,
    'trending news stories today',
    'google trends daily search trends',
  ];

  for (const query of queries) {
    try {
      const data = await serpRequest(googleSearchUrl(query, 10));
      for (const r of data.organic || []) {
        // Only extract from descriptions that list trends (contain commas/semicolons or numbered lists)
        const topics = extractListedTopics(r.description);
        addTopics(topics, 'google-serp', results, seen);

        // Also check if the result title IS a trending topic (from news results)
        const titleTopic = extractNewsTopic(r.title);
        if (titleTopic) addTopics([titleTopic], 'google-news', results, seen);
      }
      console.log(`[Google Trends] "${query}" → found topics`);
      await humanDelay('action');
    } catch (err) {
      console.warn(`[Google Trends] Query failed "${query}":`, err.message);
    }
  }

  // Phase 3: Category-specific trending
  const categories = [
    'trending technology news this week',
    'trending entertainment news today',
    'trending sports today',
    'trending business news today',
    `trending health wellness topics ${year}`,
  ];

  for (const query of categories) {
    try {
      const data = await serpRequest(googleSearchUrl(query, 8));
      for (const r of data.organic || []) {
        const titleTopic = extractNewsTopic(r.title);
        if (titleTopic) addTopics([titleTopic], 'google-category', results, seen);
        const topics = extractListedTopics(r.description);
        addTopics(topics, 'google-category', results, seen);
      }
      await humanDelay('action');
    } catch (err) {
      console.warn(`[Google Trends] Category failed "${query}":`, err.message);
    }
  }

  console.log(`[Google Trends] Total trends: ${results.length}`);
  return results;
}

function addTopics(topics, source, results, seen) {
  for (const topic of topics) {
    const key = topic.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (key.length < 3 || seen.has(key)) continue;
    seen.add(key);
    results.push({
      name: topic,
      platform: 'Google',
      volume: 0,
      source,
      scrapedAt: new Date().toISOString(),
    });
  }
}

// Extract real topics from SERP description text
// Looks for comma-separated lists, proper nouns, and specific patterns
function extractListedTopics(desc) {
  if (!desc) return [];
  const topics = [];

  // Extract topics from comma/semicolon lists (common in trend articles)
  // e.g. "Taylor Swift, Jaden Ivey, April Fools, and more trending today"
  const listPattern = /(?:trending|popular|viral|top|rising).*?[:\-–]\s*(.+?)(?:\.\s|$)/gi;
  let match;
  while ((match = listPattern.exec(desc)) !== null) {
    const items = match[1].split(/[,;]/).map(s => s.replace(/\band\b/gi, '').trim()).filter(s => s.length >= 3 && s.length <= 50);
    for (const item of items) {
      if (isRealTopic(item)) topics.push(item);
    }
  }

  // Extract proper noun phrases (2+ words, to avoid single-word garbage)
  const contextPattern = /\b([A-Z][a-zA-Z']+(?:\s+[A-Z][a-zA-Z']+)+)\b/g;
  while ((match = contextPattern.exec(desc)) !== null) {
    const t = match[1].trim();
    if (t.length >= 5 && t.split(' ').length >= 2 && isRealTopic(t)) topics.push(t);
  }

  // Extract hashtags
  const hashPattern = /#([A-Za-z]\w{2,25})/g;
  while ((match = hashPattern.exec(desc)) !== null) {
    topics.push('#' + match[1]);
  }

  // Extract quoted items
  const quotePattern = /[""]([^"""]{3,40})[""]|"([^"]{3,40})"/g;
  while ((match = quotePattern.exec(desc)) !== null) {
    const t = (match[1] || match[2]).trim();
    if (isRealTopic(t)) topics.push(t);
  }

  return [...new Set(topics)];
}

// Extract a news topic from a SERP result title
function extractNewsTopic(title) {
  if (!title) return null;
  // Remove site names and meta text
  let cleaned = title
    .replace(/\s*[-–—|]\s*(CNN|BBC|Reuters|AP|Fox|NBC|CBS|ABC|Forbes|Bloomberg|CNBC|ESPN|USA Today|The Hill|Politico|TechCrunch|The Verge|Mashable|Wired|Engadget|Deadline|Variety|TMZ|People|E! News|Entertainment Weekly|Rolling Stone|BuzzFeed|HuffPost|Vox|Axios|Business Insider|Inc\.?|Fast Company|NYT|Washington Post|LA Times|NY Post|Daily Mail|The Guardian|NPR|PBS|CNET|ZDNet|Tom's Guide|PCMag|Digital Trends|What's Trending|Google Trends?|YouTube|Reddit|Twitter|X).*$/i, '')
    .replace(/\s*\|\s*.+$/, '')
    .replace(/\s*[-–—]\s*.{0,30}$/, '')
    .trim();

  if (cleaned.length < 5 || cleaned.length > 80) return null;
  // Must not be generic SERP meta text
  if (!isRealTopic(cleaned)) return null;
  // Must have at least one capitalized word (proper noun = real topic)
  if (!/[A-Z][a-z]/.test(cleaned)) return null;
  return cleaned;
}

function isRealTopic(name) {
  if (!name || name.length < 3 || name.length > 80) return false;
  // Hashtags bypass most filters — they're always valid if they pass length check
  if (name.startsWith('#') && name.length >= 4) return true;
  const lower = name.toLowerCase();

  // Single-word blocklist — common SERP garbage
  const singleWordBlock = new Set([
    'what', 'explore', 'discover', 'get', 'one', 'here', 'hop', 'buzz', 'mar',
    'feb', 'jan', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
    'january', 'february', 'march', 'april', 'june', 'july', 'august', 'september',
    'october', 'november', 'december', 'monday', 'tuesday', 'wednesday', 'thursday',
    'friday', 'saturday', 'sunday', 'pickle', 'trends', 'trend', 'with',
    'what\'s', 'here\'s', 'there\'s', 'that\'s', 'it\'s',
  ]);
  const words = lower.split(/\s+/);
  if (words.length === 1 && singleWordBlock.has(lower)) return false;

  // Phrase blocklist
  const blocklist = [
    'trending', 'viral', 'popular', 'top', 'best', 'latest', 'new', 'today',
    'now', 'this week', 'right now', 'all categories', 'read more', 'more stories',
    'sign in', 'log in', 'click here', 'subscribe', 'advertisement', 'sponsored',
    'google', 'search results', 'united states', 'trending now', 'trending today',
    'top trends', 'most popular', 'trending topics', 'latest news', 'breaking news',
    'see more', 'learn more', 'all rights reserved', 'privacy policy', 'terms of service',
    'social media', 'what is', 'how to', 'why is', 'top trending',
    'with sociality', 'ap news', 'posts x', 'what\'s trending',
    // Category fragments from Google Trends sidebar
    'autos and vehicles', 'beauty and fashion', 'business and finance',
    'climate entertainment', 'food and drink', 'games health', 'hobbies and leisure',
    'jobs and education', 'vehicles beauty', 'fashion business',
    'finance climate', 'drink games', 'entertainment food',
  ];
  if (blocklist.some(b => lower === b || lower.startsWith(b + ' ') || lower.endsWith(' ' + b))) return false;
  if (/^\d+$/.test(name)) return false;
  if (words.length > 7) return false;

  // Reject if it looks like a social handle
  if (/^@\w+$/.test(name) || /\(@\w+\)/.test(name)) return false;

  // Must not be just common English words
  const commonWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'but', 'not', 'with', 'by', 'from', 'that', 'this', 'it', 'we', 'you', 'they', 'your', 'our', 'see', 'their', 'has', 'had', 'have', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'must', 'need', 'get', 'got', 'its', 'all', 'every', 'each', 'some', 'any', 'no', 'just', 'also', 'here', 'there', 'then', 'than', 'so', 'if', 'when', 'how', 'what', 'which', 'who', 'where', 'why']);
  const nonCommon = words.filter(w => !commonWords.has(w) && w.length > 2);
  if (nonCommon.length === 0) return false;

  // Non-hashtag single words must be at least 4 chars and look like a real topic
  if (words.length === 1 && lower.length < 4) return false;

  return true;
}
