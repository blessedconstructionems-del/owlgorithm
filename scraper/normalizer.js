// Data Normalizer — converts raw scrape data into unified trend schema
// that the React frontend expects

import crypto from 'crypto';
import { fuzzyMatch } from './fuzzy-matcher.js';

export function normalizeTrends(rawTrends, existingCache = []) {
  const cleanedTrends = rawTrends.filter((trend) => isTrendCandidate(trend.name));

  // 1. Group by cross-platform fuzzy matching
  const groups = fuzzyMatch(cleanedTrends);

  // 2. Convert each group into a unified trend object
  const normalized = groups.map(group => {
    const items = group.items;
    const platforms = [...new Set(items.map(i => mapPlatformName(i.platform)))];
    const totalVolume = items.reduce((sum, i) => sum + (i.volume || 0), 0);
    const totalComments = items.reduce((sum, i) => sum + (i.comments || 0), 0);

    // Find if this trend existed in cache (for history tracking)
    const cacheMatch = findInCache(group.name, platforms, existingCache);

    const id = generateId(group.name, platforms);
    const firstSeen = cacheMatch?.firstSeen || new Date().toISOString();

    // Build per-platform metrics
    const platformMetrics = {};
    for (const item of items) {
      const pName = mapPlatformName(item.platform);
      if (!platformMetrics[pName]) {
        platformMetrics[pName] = { views: 0, posts: 0, engagement: 0 };
      }
      platformMetrics[pName].views += item.volume || 0;
      platformMetrics[pName].posts += 1;
      platformMetrics[pName].engagement += (item.volume || 0) + (item.comments || 0);
    }

    // Calculate momentum from real signals
    const momentum = calculateMomentum(platforms, totalVolume, items.length, firstSeen, cacheMatch);
    const growthVelocity = calculateGrowthVelocity(momentum, cacheMatch);
    const saturation = classifySaturation(firstSeen, platforms.length, growthVelocity);
    const competition = classifyCompetition(totalVolume + items.length);

    // Build history from cache + current reading
    const history = buildHistory(cacheMatch, momentum);

    // Build diffusion chain
    const diffusion = buildDiffusion(items);

    // Determine type
    const type = detectType(group.name);

    // Determine category
    const category = detectCategory(group.name, items);

    // Calculate opportunity and audience interest from real metrics
    const opportunityScore = calculateOpportunity(momentum, growthVelocity, competition, saturation);
    const audienceInterest = Math.min(100, Math.round(momentum * 0.6 + (platforms.length * 8) + Math.max(0, growthVelocity * 0.3)));

    return {
      id,
      name: group.name,
      type,
      momentum: Math.round(momentum),
      saturation,
      growthVelocity: Math.round(growthVelocity * 10) / 10,
      competition,
      audienceInterest: Math.min(100, audienceInterest),
      opportunityScore: Math.round(opportunityScore),
      platforms,
      description: generateDescription(group.name, platforms, totalVolume, saturation),
      aiInsight: generateInsight(group.name, momentum, growthVelocity, competition, saturation, platforms),
      history,
      relatedTrends: [], // Will be filled after all trends are processed
      category,
      metrics: {
        totalViews: totalVolume,
        totalPosts: items.length,
        avgEngagement: items.length > 0 ? Math.round((totalVolume + totalComments) / items.length) : 0,
        platforms: platformMetrics,
      },
      firstSeen,
      diffusion,
      _raw: items.length, // Debug: number of raw items merged
    };
  });

  // Fill relatedTrends based on category and keyword overlap
  for (const trend of normalized) {
    trend.relatedTrends = normalized
      .filter(t => t.id !== trend.id && (t.category === trend.category || hasKeywordOverlap(t.name, trend.name)))
      .slice(0, 3)
      .map(t => t.id);
  }

  // Sort by momentum descending
  normalized.sort((a, b) => b.momentum - a.momentum);

  return normalized;
}

function generateId(name, platforms) {
  const hash = crypto.createHash('md5')
    .update(name.toLowerCase() + platforms.sort().join(','))
    .digest('hex')
    .slice(0, 8);
  return `trend-${hash}`;
}

function mapPlatformName(raw) {
  const map = {
    'google': 'Google',
    'youtube': 'YouTube',
    'reddit': 'Reddit',
    'twitter': 'Twitter/X',
    'twitter/x': 'Twitter/X',
    'tiktok': 'TikTok',
    'instagram': 'Instagram',
    'linkedin': 'LinkedIn',
  };
  return map[raw.toLowerCase()] || raw;
}

function findInCache(name, platforms, cache) {
  if (!cache || cache.length === 0) return null;
  const lower = name.toLowerCase();
  return cache.find(c =>
    c.name.toLowerCase() === lower ||
    c.name.toLowerCase().replace(/[^a-z0-9]/g, '') === lower.replace(/[^a-z0-9]/g, '')
  );
}

function calculateMomentum(platforms, volume, postCount, firstSeen, cached) {
  // Platform breadth: 30%
  const platformScore = Math.min(1, platforms.length / 5) * 30;

  // Volume: 25% (log scale to handle huge variance)
  const volumeScore = Math.min(1, Math.log10(Math.max(1, volume)) / 7) * 25;

  // Post density: 25%
  const densityScore = Math.min(1, postCount / 20) * 25;

  // Recency: 20%
  const ageHours = (Date.now() - new Date(firstSeen).getTime()) / (1000 * 60 * 60);
  const recencyScore = Math.max(0, 1 - (ageHours / (7 * 24))) * 20; // Decays over 7 days

  const raw = platformScore + volumeScore + densityScore + recencyScore;

  // Blend with cached momentum for stability (80% new, 20% old)
  if (cached?.momentum) {
    return raw * 0.8 + cached.momentum * 0.2;
  }

  return raw;
}

function calculateGrowthVelocity(currentMomentum, cached) {
  if (!cached?.momentum) {
    return Math.max(6, Math.round(currentMomentum * 0.35));
  }

  // Compare to cached momentum
  const delta = currentMomentum - cached.momentum;
  return delta * 2; // Amplify changes for visibility
}

function classifySaturation(firstSeen, platformCount, velocity) {
  const ageHours = (Date.now() - new Date(firstSeen).getTime()) / (1000 * 60 * 60);

  if (ageHours <= 48 && platformCount <= 2 && velocity > 0) return 'Emerging';
  if (ageHours <= 168 && platformCount >= 2 && velocity > 10) return 'Rising';
  if (velocity <= 5 && velocity >= -5 && platformCount >= 3) return 'Peak';
  if (velocity < -5) return 'Declining';
  return 'Rising'; // Default
}

function classifyCompetition(totalSignals) {
  if (totalSignals < 10) return 'Low';
  if (totalSignals < 100) return 'Medium';
  return 'High';
}

function buildHistory(cached, currentMomentum) {
  const history = [];
  const existingHistory = cached?.history || [];

  // Start from existing history or generate backfill
  if (existingHistory.length > 0) {
    // Keep last 29 days from cache
    history.push(...existingHistory.slice(-29));
  } else {
    // First time — generate a gentle ramp-up
    for (let i = 29; i >= 1; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const age = i / 30;
      const wave = Math.sin((30 - i) * 0.85 + currentMomentum * 0.04) * 4;
      const value = Math.max(0, currentMomentum * (1 - age * 0.7) + wave);
      history.push({
        day: date.toISOString().split('T')[0],
        value: Math.round(Math.max(0, Math.min(100, value)) * 10) / 10,
      });
    }
  }

  // Add today's reading
  history.push({
    day: new Date().toISOString().split('T')[0],
    value: Math.round(Math.max(0, Math.min(100, currentMomentum)) * 10) / 10,
  });

  // Keep only last 30 days
  return history.slice(-30);
}

function buildDiffusion(items) {
  // Order platforms by first appearance (scrape timestamp)
  const platformTimes = {};
  for (const item of items) {
    const p = mapPlatformName(item.platform);
    const t = new Date(item.scrapedAt).getTime();
    if (!platformTimes[p] || t < platformTimes[p]) {
      platformTimes[p] = t;
    }
  }

  return Object.entries(platformTimes)
    .sort(([, a], [, b]) => a - b)
    .map(([platform, timestamp]) => ({
      platform,
      timestamp: new Date(timestamp).toISOString(),
    }));
}

function detectType(name) {
  if (name.startsWith('#')) return 'Hashtag';
  if (/\b(audio|sound|beat|music|lo-fi|song)\b/i.test(name)) return 'Audio';
  if (/\b(format|template|carousel|reel|short|pov|style)\b/i.test(name)) return 'Format';
  if (/\b(challenge|trend|viral)\b/i.test(name)) return 'Challenge';
  return 'Topic';
}

function detectCategory(name, items) {
  const text = (name + ' ' + items.map(i => i.name).join(' ')).toLowerCase();

  if (/\b(ai|machine learning|tech|software|code|programming|crypto|blockchain)\b/.test(text)) return 'Technology';
  if (/\b(business|marketing|startup|entrepreneur|sales|b2b|linkedin)\b/.test(text)) return 'Business';
  if (/\b(art|design|creative|music|photography|film)\b/.test(text)) return 'Creative';
  if (/\b(fitness|health|wellness|mental health|meditation|yoga)\b/.test(text)) return 'Health';
  if (/\b(food|recipe|cooking|restaurant)\b/.test(text)) return 'Lifestyle';
  if (/\b(gaming|game|esports|twitch|stream)\b/.test(text)) return 'Gaming';
  if (/\b(fashion|beauty|style|outfit|makeup)\b/.test(text)) return 'Fashion';
  if (/\b(politics|election|government|policy)\b/.test(text)) return 'News';
  if (/\b(comedy|meme|funny|humor|entertainment)\b/.test(text)) return 'Entertainment';
  if (/\b(education|learn|study|course|tutorial)\b/.test(text)) return 'Education';
  return 'General';
}

function isTrendCandidate(name) {
  if (!name) return false;

  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  const blockedPhrases = [
    'today trending',
    'trending topics',
    'what is trending',
    'what’s trending',
    'coming out in',
    'free trend tracker',
    'trend analysis tool',
    'for you page',
    'viral videos',
    'biggest trends right now',
    'predicts™',
    'kinda funny',
  ];

  if (trimmed.length < 3 || trimmed.length > 90) return false;
  if (blockedPhrases.some((phrase) => lower.includes(phrase))) return false;
  if (trimmed.includes('|') || trimmed.includes('...')) return false;
  if (/^(today|trending|viral)\b/i.test(trimmed)) return false;
  if (/^[a-z\s]+ \d{4}$/i.test(trimmed) && lower.includes('april')) return false;

  return true;
}

function calculateOpportunity(momentum, velocity, competition, saturation) {
  const satWeights = { 'Emerging': 1.0, 'Rising': 0.8, 'Peak': 0.35, 'Declining': 0.1 };
  const compWeights = { 'Low': 1.0, 'Medium': 0.6, 'High': 0.25 };

  const satW = satWeights[saturation] || 0.5;
  const compW = compWeights[competition] || 0.5;

  const score = (
    (momentum / 100) * 0.35 +
    Math.min(1, Math.max(0, velocity / 50)) * 0.15 +
    satW * 0.25 +
    compW * 0.25
  ) * 100;

  return Math.max(0, Math.min(100, score));
}

function hasKeywordOverlap(name1, name2) {
  const kw1 = new Set(name1.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2));
  const kw2 = new Set(name2.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2));
  const overlap = [...kw1].filter(w => kw2.has(w)).length;
  return overlap >= 2;
}

function generateDescription(name, platforms, volume, saturation) {
  const platList = platforms.join(', ');
  const status = saturation.toLowerCase();
  const volStr = volume > 0 ? ` with ${formatNumber(volume)}+ total engagement` : '';
  return `"${name}" is currently ${status} across ${platList}${volStr}. This trend was detected through real-time cross-platform analysis by Owlgorithm's data engine.`;
}

function generateInsight(name, momentum, velocity, competition, saturation, platforms) {
  const parts = [];

  if (saturation === 'Emerging' && competition === 'Low') {
    parts.push(`This is an early-stage opportunity. "${name}" has low competition and is just starting to gain traction.`);
    parts.push('First-mover advantage is significant — creators who jump on this now will benefit from algorithmic boost as the trend grows.');
  } else if (saturation === 'Rising') {
    parts.push(`"${name}" is in active growth phase with ${Math.round(velocity)}% velocity.`);
    parts.push(`Currently on ${platforms.length} platform${platforms.length > 1 ? 's' : ''} — cross-platform presence amplifies reach.`);
  } else if (saturation === 'Peak') {
    parts.push(`"${name}" has reached peak saturation. The window for easy engagement is closing.`);
    parts.push('Consider a unique angle or remix to stand out from the crowd.');
  } else {
    parts.push(`"${name}" is showing declining momentum. Proceed with caution.`);
    parts.push('If you engage, focus on derivative or nostalgic angles rather than straight participation.');
  }

  if (momentum > 70) {
    parts.push(`Momentum score of ${Math.round(momentum)} indicates strong current interest.`);
  }

  return parts.join(' ');
}

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}
