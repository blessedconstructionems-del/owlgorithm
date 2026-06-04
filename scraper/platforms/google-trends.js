import {
  fetchXml,
  isUsefulTopic,
  parseCompactNumber,
  toArray,
  uniqueByName,
  cleanWhitespace,
} from '../source-utils.js';

const GOOGLE_TRENDS_RSS_URL = 'https://trends.google.com/trending/rss?geo=US';

export async function scrapeGoogleTrends() {
  console.log('[Google Trends] Starting scrape...');

  const payload = await fetchXml(GOOGLE_TRENDS_RSS_URL);
  const items = toArray(payload?.rss?.channel?.item);
  const scrapedAt = new Date().toISOString();

  const results = items
    .map((item) => {
      const name = cleanWhitespace(item?.title);
      if (!isUsefulTopic(name)) return null;

      const newsItems = toArray(item?.['ht:news_item']);
      const primaryNewsItem = newsItems.find((newsItem) => newsItemUrl(newsItem) || newsItemImage(newsItem));
      const relatedSources = newsItems
        .map((newsItem) => cleanWhitespace(newsItem?.['ht:news_item_source']))
        .filter(Boolean);

      return {
        name,
        platform: 'Google',
        volume: parseCompactNumber(item?.['ht:approx_traffic']),
        source: 'google-trends-rss',
        sourceUrl: newsItemUrl(primaryNewsItem) || item?.link || null,
        imageUrl: item?.['ht:picture'] || newsItemImage(primaryNewsItem) || null,
        publisher: cleanWhitespace(primaryNewsItem?.['ht:news_item_source'] || item?.['ht:picture_source']),
        mediaType: 'headline',
        scrapedAt,
        publishedAt: item?.pubDate ? new Date(item.pubDate).toISOString() : scrapedAt,
        relatedSources,
      };
    })
    .filter(Boolean);

  const deduped = uniqueByName(results);
  console.log(`[Google Trends] Total trends: ${deduped.length}`);
  return deduped;
}

function newsItemUrl(newsItem) {
  return newsItem?.['ht:news_item_url'] || newsItem?.url || null;
}

function newsItemImage(newsItem) {
  return newsItem?.['ht:news_item_picture'] || newsItem?.image || null;
}
