import { formatCompactNumber, normalizePlatformKey } from '@/lib/trendMetrics';

const VIDEO_PLATFORM_PRIORITY = {
  tiktok: 5,
  youtube: 4,
  instagram: 3,
  reddit: 2,
  twitter: 1,
};

const DIRECT_VIDEO_PATTERN = /\.(mp4|webm|mov|m4v)(?:[?#].*)?$/i;

const IMAGE_FIELDS = [
  'imageUrl',
  'thumbnailUrl',
  'posterUrl',
  'pictureUrl',
  'ogImage',
  'image',
  'thumbnail',
  'picture',
];

const VIDEO_FIELDS = [
  'videoUrl',
  'playbackUrl',
  'mediaUrl',
  'assetUrl',
];

const SOURCE_FIELDS = [
  'sourceUrl',
  'url',
  'link',
  'permalink',
];

function isHttpUrl(value) {
  if (!value || typeof value !== 'string') return false;

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function firstHttpUrl(payload, fields) {
  for (const field of fields) {
    const value = payload?.[field];
    if (isHttpUrl(value)) return value;
  }
  return null;
}

function getYouTubeVideoId(urlValue, explicitVideoId) {
  if (explicitVideoId) return explicitVideoId;
  if (!isHttpUrl(urlValue)) return null;

  try {
    const url = new URL(urlValue);
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.replace(/^\/+/, '').split('/')[0] || null;
    }
    if (url.hostname.includes('youtube.com')) {
      return url.searchParams.get('v') || url.pathname.split('/embed/')[1]?.split('/')[0] || null;
    }
  } catch {
    return null;
  }

  return null;
}

function sourceListForTrend(trend) {
  return [
    trend?.media,
    ...(Array.isArray(trend?.sources) ? trend.sources : []),
    ...(Array.isArray(trend?.sourceItems) ? trend.sourceItems : []),
  ].filter(Boolean);
}

function buildCandidate(trend, source = {}) {
  const platform = source.platform || trend?.platforms?.[0] || 'Trend';
  const platformKey = normalizePlatformKey(platform);
  const sourceUrl = firstHttpUrl(source, SOURCE_FIELDS);
  const explicitVideoUrl = firstHttpUrl(source, VIDEO_FIELDS);
  const directVideoUrl = explicitVideoUrl && DIRECT_VIDEO_PATTERN.test(explicitVideoUrl)
    ? explicitVideoUrl
    : null;
  const youtubeVideoId = getYouTubeVideoId(sourceUrl || explicitVideoUrl, source.videoId);
  const embedUrl = firstHttpUrl(source, ['embedUrl'])
    || (youtubeVideoId ? `https://www.youtube.com/embed/${youtubeVideoId}` : null);
  const imageUrl = firstHttpUrl(source, IMAGE_FIELDS)
    || (youtubeVideoId ? `https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg` : null);
  const metrics = trend?.metrics?.platforms?.[platform] || {};
  const views = source.views || metrics.views || trend?.metrics?.totalViews || 0;
  const engagement = source.engagement || metrics.engagement || trend?.metrics?.avgEngagement || 0;
  const playable = Boolean(directVideoUrl || embedUrl);

  return {
    kind: playable ? 'video' : imageUrl ? 'image' : 'headline',
    platform,
    platformKey,
    title: source.title || source.name || trend?.name || 'Untitled trend',
    description: trend?.description || '',
    sourceUrl,
    videoUrl: directVideoUrl,
    embedUrl,
    imageUrl,
    publisher: source.publisher || source.channel || source.subreddit || source.source || platform,
    mediaType: source.mediaType || (playable ? 'video' : imageUrl ? 'image' : 'headline'),
    rank: source.rank || null,
    views,
    engagement,
    metricLabel: views ? `${formatCompactNumber(views)} views` : engagement ? `${formatCompactNumber(engagement)} engagement` : null,
  };
}

function mediaScore(candidate) {
  const playableScore = candidate.kind === 'video' ? 120 : 0;
  const imageScore = candidate.kind === 'image' ? 70 : 0;
  const sourceScore = candidate.sourceUrl ? 20 : 0;
  const platformScore = VIDEO_PLATFORM_PRIORITY[candidate.platformKey] || 0;
  const metricScore = Math.min(60, Math.log10(Math.max(1, candidate.views || candidate.engagement || 0)) * 10);
  const rankScore = candidate.rank ? Math.max(0, 25 - candidate.rank) : 0;
  return playableScore + imageScore + sourceScore + platformScore + metricScore + rankScore;
}

export function getTrendMedia(trend) {
  if (!trend) return null;

  const sources = sourceListForTrend(trend);
  const candidates = sources.length
    ? sources.map((source) => buildCandidate(trend, source))
    : [buildCandidate(trend, {})];

  return candidates.sort((a, b) => mediaScore(b) - mediaScore(a))[0] || null;
}

export function getTopMediaTrend(trends) {
  return [...(trends || [])]
    .map((trend) => ({ trend, media: getTrendMedia(trend) }))
    .sort((a, b) => {
      const aPlatform = VIDEO_PLATFORM_PRIORITY[a.media?.platformKey] || 0;
      const bPlatform = VIDEO_PLATFORM_PRIORITY[b.media?.platformKey] || 0;
      if (bPlatform !== aPlatform) return bPlatform - aPlatform;
      return mediaScore(b.media) - mediaScore(a.media);
    })[0]?.trend || null;
}

export function hasPlayableTrendVideo(trend) {
  return getTrendMedia(trend)?.kind === 'video';
}
