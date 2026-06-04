import { load } from 'cheerio';
import { fetchText, isUsefulTopic, uniqueByName, cleanWhitespace } from '../source-utils.js';

const REDDIT_POPULAR_RSS_URL = 'https://www.reddit.com/r/popular/.rss';

export async function scrapeRedditTrending() {
  console.log('[Reddit] Starting scrape...');

  const xml = await fetchText(REDDIT_POPULAR_RSS_URL);
  const $ = load(xml, { xmlMode: true });
  const scrapedAt = new Date().toISOString();
  const results = [];

  $('feed > entry').each((_, entry) => {
    const row = $(entry);
    const name = cleanWhitespace(row.find('title').first().text());
    if (!isUsefulTopic(name)) return;

    const category = row.find('category').first();
    const subreddit = cleanWhitespace(category.attr('label') || category.attr('term'));
    const contentHtml = row.find('content').first().html() || '';

    results.push({
      name,
      platform: 'Reddit',
      volume: 0,
      comments: 0,
      subreddit: subreddit ? `r/${subreddit.replace(/^r\//i, '')}` : '',
      source: 'reddit-rss',
      sourceUrl: row.find('link[rel="alternate"]').attr('href') || row.find('link').first().attr('href') || null,
      imageUrl: row.find('media\\:thumbnail').first().attr('url') || extractFirstImage(contentHtml),
      mediaType: 'headline',
      scrapedAt,
      publishedAt: cleanWhitespace(row.find('published').first().text() || row.find('updated').first().text()) || scrapedAt,
    });
  });

  const deduped = uniqueByName(results).slice(0, 40);
  console.log(`[Reddit] Total trends: ${deduped.length}`);
  return deduped;
}

function extractFirstImage(contentHtml) {
  const match = `${contentHtml || ''}`.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] || null;
}
