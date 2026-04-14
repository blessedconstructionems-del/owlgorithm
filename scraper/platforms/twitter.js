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
    const name = cleanWhitespace($(element).text());
    if (!isUsefulTopic(name)) return;

    results.push({
      name,
      platform: 'Twitter/X',
      volume: 0,
      source: 'trends24-twitter',
      scrapedAt,
      rank: index + 1,
    });
  });

  const deduped = uniqueByName(results).slice(0, 50);
  console.log(`[Twitter/X] Total trends: ${deduped.length}`);
  return deduped;
}
