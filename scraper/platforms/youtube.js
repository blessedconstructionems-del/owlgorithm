import { load } from 'cheerio';
import {
  fetchText,
  isUsefulTopic,
  parseCompactNumber,
  uniqueByName,
  cleanWhitespace,
} from '../source-utils.js';

const YOUTUBE_TRENDS_URL = 'https://youtube.trends24.in/united-states';

export async function scrapeYouTubeTrending() {
  console.log('[YouTube] Starting scrape...');

  const html = await fetchText(YOUTUBE_TRENDS_URL);
  const $ = load(html);
  const scrapedAt = new Date().toISOString();
  const results = [];

  $('li.video-item').each((index, element) => {
    const card = $(element);
    const title = cleanVideoTitle(card.find('.vc-title').first().text());
    if (!isUsefulTopic(title)) return;

    const stats = card.find('.stat-line span').map((_, stat) => cleanWhitespace($(stat).text())).get();
    const metadata = parseVideoMetadata(card.find('script').html() || '');

    results.push({
      name: title,
      platform: 'YouTube',
      volume: parseCompactNumber(stats[0]),
      comments: parseCompactNumber(stats[2]),
      source: 'trends24-youtube',
      scrapedAt,
      rank: index + 1,
      publishedAt: metadata?.publishedAt || scrapedAt,
      channel: metadata?.channelTitle || cleanWhitespace(card.find('p.text-sm .font-medium').last().text()),
    });
  });

  const deduped = uniqueByName(results).slice(0, 40);
  console.log(`[YouTube] Total trends: ${deduped.length}`);
  return deduped;
}

function parseVideoMetadata(scriptText) {
  const match = scriptText.match(/JSON\.parse\('([\s\S]+)'\)/);
  if (!match) return null;

  try {
    return JSON.parse(match[1].replace(/\\'/g, '\''));
  } catch {
    return null;
  }
}

function cleanVideoTitle(value) {
  return cleanWhitespace(value)
    .replace(/(?:\s*#\w[\w-]*)+$/g, '')
    .replace(/[?"'#\s]+$/g, '')
    .trim();
}
