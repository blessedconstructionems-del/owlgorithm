import { load } from 'cheerio';
import { fetchText, isUsefulTopic, uniqueByName, cleanWhitespace } from '../source-utils.js';

const TWITTER_TRENDS_URL = 'https://trends24.in/united-states/';

export async function scrapeTwitterTrending() {
  console.log('[Twitter/X] Starting scrape...');

  const html = await fetchText(TWITTER_TRENDS_URL);
  const $ = load(html);
  const scrapedAt = new Date().toISOString();
  const results = [];

  $('.list-container').first().find('ol.trend-card__list a.trend-link').each((index, element) => {
    const link = $(element);
    const name = cleanWhitespace(link.text());
    if (!isUsefulTopic(name)) return;

    results.push({
      name,
      platform: 'Twitter/X',
      volume: 0,
      source: 'trends24-twitter',
      sourceUrl: absoluteUrl(link.attr('href'), TWITTER_TRENDS_URL),
      mediaType: 'headline',
      scrapedAt,
      rank: index + 1,
    });
  });

  const deduped = uniqueByName(results).slice(0, 50);
  console.log(`[Twitter/X] Total trends: ${deduped.length}`);
  return deduped;
}

function absoluteUrl(value, baseUrl) {
  if (!value) return null;

  try {
    return new URL(value, baseUrl).href;
  } catch {
    return null;
  }
}
