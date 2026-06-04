export const CLASSIFIER_VERSION = 1;

export const CREATOR_NICHES = [
  {
    id: 'news',
    label: 'News and culture',
    description: 'Fast commentary, explainers, current events, politics, local stories.',
    audience: 'people who want fast, clear context on what is happening right now',
    defaultPlatforms: ['youtube', 'x', 'tiktok'],
    keywords: ['news', 'politics', 'election', 'war', 'house', 'senate', 'mayor', 'city', 'law', 'court', 'policy', 'breaking', 'culture', 'vote', 'ban', 'datacenter', 'datacenters'],
  },
  {
    id: 'beauty',
    label: 'Beauty',
    description: 'Makeup, hair, skincare, tutorials, routines, product comparisons.',
    audience: 'beauty viewers who want practical routines, product context, and clear before-after ideas',
    defaultPlatforms: ['tiktok', 'instagram', 'youtube'],
    keywords: ['beauty', 'makeup', 'skin', 'skincare', 'hair', 'nails', 'routine', 'tutorial', 'glow', 'style', 'fashion', 'outfit', 'mascara', 'foundation', 'lip', 'lashes'],
  },
  {
    id: 'business',
    label: 'Business and money',
    description: 'Entrepreneurship, sales, marketing, finance, operations, leadership.',
    audience: 'business owners and operators who want practical growth moves without hype',
    defaultPlatforms: ['linkedin', 'youtube', 'x'],
    keywords: ['business', 'startup', 'sales', 'marketing', 'money', 'finance', 'founder', 'career', 'work', 'customer', 'ai', 'productivity', 'entrepreneur', 'leadership', 'revenue'],
  },
  {
    id: 'fitness',
    label: 'Fitness and wellness',
    description: 'Training, habits, health routines, recovery, motivation, transformation.',
    audience: 'people building healthier routines who need realistic, low-pressure guidance',
    defaultPlatforms: ['tiktok', 'instagram', 'youtube'],
    keywords: ['fitness', 'workout', 'gym', 'health', 'wellness', 'diet', 'weight', 'run', 'training', 'recovery', 'habit', 'yoga', 'meditation', 'protein'],
  },
  {
    id: 'food',
    label: 'Food',
    description: 'Recipes, restaurants, grocery finds, cooking, meal prep, taste tests.',
    audience: 'food viewers who want simple ideas they can cook, try, or save today',
    defaultPlatforms: ['tiktok', 'instagram', 'pinterest'],
    keywords: ['food', 'recipe', 'cook', 'cooking', 'restaurant', 'meal', 'grocery', 'kitchen', 'taste', 'dinner', 'breakfast', 'lunch', 'snack', 'drink'],
  },
  {
    id: 'gaming',
    label: 'Gaming',
    description: 'Gameplay, reactions, creators, stream highlights, culture, releases.',
    audience: 'gaming fans who want sharp reactions, clips, and useful context around what is trending',
    defaultPlatforms: ['youtube', 'tiktok', 'reddit'],
    keywords: ['game', 'gaming', 'minecraft', 'stream', 'twitch', 'playstation', 'xbox', 'nintendo', 'roblox', 'fortnite', 'esports', 'gameplay', 'smp'],
  },
  {
    id: 'parenting',
    label: 'Parenting and home',
    description: 'Family life, home systems, mom content, routines, kids, practical tips.',
    audience: 'busy parents and home builders who want useful, relatable, low-friction ideas',
    defaultPlatforms: ['tiktok', 'instagram', 'pinterest'],
    keywords: ['mom', 'dad', 'parent', 'kid', 'kids', 'baby', 'home', 'family', 'school', 'routine', 'cleaning', 'organizing', 'teacher', 'period', 'dog', 'bath'],
  },
  {
    id: 'education',
    label: 'Education',
    description: 'Teaching, explainers, tutorials, study help, niche expertise.',
    audience: 'learners who want clear, useful explanations they can apply quickly',
    defaultPlatforms: ['youtube', 'tiktok', 'linkedin'],
    keywords: ['learn', 'study', 'school', 'teacher', 'explain', 'tutorial', 'lesson', 'science', 'history', 'how to', 'meaning', 'college', 'student'],
  },
  {
    id: 'tech',
    label: 'Tech and AI',
    description: 'AI, software, gadgets, tools, automation, product breakdowns.',
    audience: 'builders and curious users who want useful tech context without jargon',
    defaultPlatforms: ['youtube', 'x', 'linkedin'],
    keywords: ['ai', 'tech', 'software', 'app', 'iphone', 'android', 'robot', 'data', 'startup', 'tool', 'automation', 'code', 'programming', 'crypto', 'datacenter', 'datacenters'],
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    description: 'Music, celebrities, film, TV, pop culture, reactions.',
    audience: 'culture fans who want timely reactions, context, and shareable entertainment takes',
    defaultPlatforms: ['tiktok', 'youtube', 'instagram'],
    keywords: ['music', 'song', 'album', 'movie', 'tv', 'celebrity', 'ariana', 'reaction', 'trailer', 'netflix', 'concert', 'finale', 'video', 'champions', 'world cup'],
  },
  {
    id: 'local_service',
    label: 'Local service business',
    description: 'Contractors, salons, real estate, restaurants, repair, local offers.',
    audience: 'local customers who need practical proof, trust, and a clear next step',
    defaultPlatforms: ['facebook', 'instagram', 'google_business'],
    keywords: ['local', 'service', 'customer', 'home', 'repair', 'construction', 'real estate', 'restaurant', 'salon', 'review', 'business', 'contractor'],
  },
  {
    id: 'exploring',
    label: 'Help me choose',
    description: 'Owlgorithm will keep the feed broad and learn from what you build.',
    audience: 'new creators still finding a lane and looking for low-risk content ideas',
    defaultPlatforms: ['tiktok', 'youtube', 'instagram'],
    keywords: [],
  },
];

export const CREATOR_GOALS = [
  { id: 'grow_audience', label: 'Grow an audience' },
  { id: 'post_consistently', label: 'Post consistently' },
  { id: 'sell_offer', label: 'Sell a product or service' },
  { id: 'build_authority', label: 'Build authority' },
  { id: 'find_channel', label: 'Find my channel' },
];

export const CREATOR_PLATFORM_OPTIONS = [
  {
    id: 'tiktok',
    label: 'TikTok',
    trendLabels: ['TikTok'],
    mediaIds: ['tiktok'],
    socialIds: ['tiktok'],
  },
  {
    id: 'instagram',
    label: 'Instagram',
    trendLabels: ['Instagram'],
    mediaIds: ['instagram_reels', 'instagram_feed'],
    socialIds: ['instagram'],
  },
  {
    id: 'youtube',
    label: 'YouTube',
    trendLabels: ['YouTube'],
    mediaIds: ['youtube_shorts'],
    socialIds: ['youtube'],
  },
  {
    id: 'x',
    label: 'X',
    trendLabels: ['Twitter/X', 'Twitter', 'X'],
    mediaIds: ['x'],
    socialIds: ['x'],
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    trendLabels: ['LinkedIn'],
    mediaIds: ['linkedin'],
    socialIds: ['linkedin'],
  },
  {
    id: 'facebook',
    label: 'Facebook',
    trendLabels: ['Facebook'],
    mediaIds: ['instagram_feed'],
    socialIds: ['facebook'],
  },
  {
    id: 'pinterest',
    label: 'Pinterest',
    trendLabels: ['Pinterest'],
    mediaIds: ['pinterest'],
    socialIds: ['pinterest'],
  },
  {
    id: 'reddit',
    label: 'Reddit',
    trendLabels: ['Reddit'],
    mediaIds: ['youtube_shorts'],
    socialIds: ['reddit'],
  },
  {
    id: 'google_business',
    label: 'Google Business',
    trendLabels: ['Google', 'Google Trends'],
    mediaIds: ['instagram_feed'],
    socialIds: ['google_business'],
  },
];

export const DEFAULT_CREATOR_PROFILE = {
  completed: false,
  creatorType: 'creator',
  niche: '',
  customNiche: '',
  goal: 'grow_audience',
  preferredPlatforms: [],
  channelName: '',
  createdAt: null,
  updatedAt: null,
};

const CATEGORY_NICHE_MAP = {
  Technology: 'tech',
  Business: 'business',
  Creative: 'entertainment',
  Health: 'fitness',
  Lifestyle: 'food',
  Gaming: 'gaming',
  Fashion: 'beauty',
  News: 'news',
  Entertainment: 'entertainment',
  Education: 'education',
  General: 'exploring',
};

const PLATFORM_NICHE_HINTS = {
  LinkedIn: 'business',
  Reddit: 'gaming',
  'Google Business': 'local_service',
};

function normalizeSearchText(value) {
  return `${value || ''}`
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasKeyword(text, keyword) {
  const normalizedKeyword = normalizeSearchText(keyword);
  if (!normalizedKeyword) return false;

  if (normalizedKeyword.includes(' ')) {
    return text.includes(normalizedKeyword);
  }

  return new RegExp(`(^|\\s)${escapeRegex(normalizedKeyword)}(\\s|$)`).test(text);
}

function trendClassificationText(trend) {
  const sources = Array.isArray(trend?.sources) ? trend.sources : [];
  const sourceText = sources.flatMap((source) => [
    source.title,
    source.publisher,
    source.source,
    source.platform,
  ]);

  return normalizeSearchText([
    trend?.name,
    trend?.description,
    trend?.aiInsight,
    trend?.category,
    trend?.type,
    trend?.media?.title,
    trend?.media?.publisher,
    ...(trend?.platforms || []),
    ...sourceText,
  ].filter(Boolean).join(' '));
}

function scoreNiche(trend, niche, text) {
  const matchedKeywords = [];
  let score = 0;

  for (const keyword of niche.keywords || []) {
    if (!hasKeyword(text, keyword)) continue;
    matchedKeywords.push(keyword);
    score += normalizeSearchText(keyword).includes(' ') ? 7 : 4;
  }

  const categoryHint = CATEGORY_NICHE_MAP[trend?.category];
  if (categoryHint === niche.id) score += 8;

  for (const platform of trend?.platforms || []) {
    if (PLATFORM_NICHE_HINTS[platform] === niche.id) score += 2;
  }

  if (trend?.type === 'Audio' && niche.id === 'entertainment') score += 2;
  if (trend?.type === 'Format' && niche.id === 'education') score += 1;

  return { id: niche.id, label: niche.label, score, matchedKeywords };
}

export function classifyTrendForCreators(trend = {}) {
  const text = trendClassificationText(trend);
  const scored = CREATOR_NICHES
    .filter((niche) => niche.id !== 'exploring')
    .map((niche) => scoreNiche(trend, niche, text))
    .sort((a, b) => b.score - a.score);

  const nonZero = scored.filter((item) => item.score > 0);
  const categoryFallback = CATEGORY_NICHE_MAP[trend?.category] || 'exploring';
  const fallbackNiche = CREATOR_NICHES.find((niche) => niche.id === categoryFallback) || CREATOR_NICHES.find((niche) => niche.id === 'exploring');
  const ranked = nonZero.length
    ? nonZero
    : [{ id: fallbackNiche.id, label: fallbackNiche.label, score: 1, matchedKeywords: [] }];

  const [primary, secondary] = ranked;
  const denominator = primary.score + (secondary?.score || 0) + 6;
  const confidence = Math.max(35, Math.min(96, Math.round((primary.score / denominator) * 100)));

  return {
    version: CLASSIFIER_VERSION,
    primaryNiche: primary.id,
    primaryNicheLabel: primary.label,
    confidence,
    matchedKeywords: primary.matchedKeywords.slice(0, 8),
    rankedNiches: ranked.slice(0, 4).map((item) => ({
      id: item.id,
      label: item.label,
      score: item.score,
      matchedKeywords: item.matchedKeywords.slice(0, 8),
    })),
    scores: Object.fromEntries(scored.map((item) => [item.id, item.score])),
  };
}

export function ensureTrendClassification(trend = {}) {
  const creatorFit = trend.creatorFit?.version === CLASSIFIER_VERSION
    ? trend.creatorFit
    : classifyTrendForCreators(trend);

  return {
    ...trend,
    creatorFit,
    creatorNiche: creatorFit.primaryNiche,
    creatorNicheLabel: creatorFit.primaryNicheLabel,
    creatorNicheConfidence: creatorFit.confidence,
  };
}

export function getTrendNicheScore(trend = {}, nicheId) {
  if (!nicheId) return 0;
  const fit = trend.creatorFit?.version === CLASSIFIER_VERSION
    ? trend.creatorFit
    : classifyTrendForCreators(trend);
  return Number(fit.scores?.[nicheId] || 0);
}
