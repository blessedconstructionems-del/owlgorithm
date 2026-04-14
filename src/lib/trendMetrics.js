import { formatDistanceToNowStrict, parseISO } from 'date-fns';

const PLATFORM_ALIASES = {
  google: 'google',
  'google trends': 'google',
  youtube: 'youtube',
  reddit: 'reddit',
  tiktok: 'tiktok',
  instagram: 'instagram',
  linkedin: 'linkedin',
  pinterest: 'pinterest',
  facebook: 'facebook',
  'twitter/x': 'twitter',
  twitter: 'twitter',
  x: 'twitter',
};

export function normalizePlatformKey(platform) {
  const key = platform?.toLowerCase().trim() ?? '';
  return PLATFORM_ALIASES[key] || key.replace(/[^a-z0-9]+/g, '-');
}

export function getTopOpportunities(trends, limit = 6) {
  return [...trends]
    .sort((a, b) => (b.opportunityScore || 0) - (a.opportunityScore || 0))
    .slice(0, limit);
}

export function getFastestGrowing(trends, limit = 6) {
  return [...trends]
    .sort((a, b) => (b.growthVelocity || 0) - (a.growthVelocity || 0))
    .slice(0, limit);
}

export function getEmergingCount(trends, minOpportunityScore = 60) {
  return trends.filter((trend) => (trend.opportunityScore || 0) >= minOpportunityScore).length;
}

export function aggregatePlatforms(trends) {
  const map = new Map();

  for (const trend of trends) {
    const metrics = trend.metrics?.platforms || {};

    for (const platform of trend.platforms || []) {
      const key = normalizePlatformKey(platform);
      const current = map.get(key) || {
        key,
        label: platform,
        trendCount: 0,
        totalViews: 0,
        totalPosts: 0,
        totalEngagement: 0,
        avgOpportunityScore: 0,
      };

      const platformMetrics = metrics[platform] || metrics[current.label] || {};

      current.label = platform;
      current.trendCount += 1;
      current.totalViews += platformMetrics.views || 0;
      current.totalPosts += platformMetrics.posts || 0;
      current.totalEngagement += platformMetrics.engagement || 0;
      current.avgOpportunityScore += trend.opportunityScore || 0;

      map.set(key, current);
    }
  }

  return [...map.values()]
    .map((entry) => ({
      ...entry,
      avgOpportunityScore: entry.trendCount
        ? Math.round(entry.avgOpportunityScore / entry.trendCount)
        : 0,
    }))
    .sort((a, b) => {
      if (b.trendCount !== a.trendCount) return b.trendCount - a.trendCount;
      return b.totalEngagement - a.totalEngagement;
    });
}

export function aggregateTrendHistory(trends, points = 14) {
  const daily = new Map();

  for (const trend of trends) {
    const history = Array.isArray(trend.history) ? trend.history.slice(-points) : [];

    for (const item of history) {
      const current = daily.get(item.day) || { day: item.day, total: 0, count: 0 };
      current.total += Number(item.value) || 0;
      current.count += 1;
      daily.set(item.day, current);
    }
  }

  return [...daily.values()]
    .sort((a, b) => a.day.localeCompare(b.day))
    .slice(-points)
    .map((entry) => ({
      day: entry.day,
      label: entry.day.slice(5),
      value: Number((entry.total / Math.max(entry.count, 1)).toFixed(1)),
    }));
}

export function getFreshnessState(lastUpdated) {
  if (!lastUpdated) {
    return {
      label: 'No data',
      status: 'offline',
      stale: true,
      ageHours: null,
      relative: 'never',
    };
  }

  const updatedAt = parseISO(lastUpdated);
  const ageMs = Date.now() - updatedAt.getTime();
  const ageHours = ageMs / (1000 * 60 * 60);

  let status = 'active';
  let label = 'Live';

  if (ageHours >= 24) {
    status = 'failed';
    label = 'Outdated';
  } else if (ageHours >= 6) {
    status = 'stale';
    label = 'Stale';
  }

  return {
    label,
    status,
    stale: ageHours >= 6,
    ageHours,
    relative: formatDistanceToNowStrict(updatedAt, { addSuffix: true }),
  };
}

export function buildPlatformMetrics(trend) {
  const platformMetrics = trend.metrics?.platforms || {};

  return (trend.platforms || []).map((platform) => {
    const metrics = platformMetrics[platform] || {};
    return {
      platform,
      views: metrics.views || 0,
      posts: metrics.posts || 0,
      engagement: metrics.engagement || 0,
    };
  });
}

export function formatCompactNumber(value) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value || 0);
}
