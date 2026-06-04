export const CREATOR_NICHES = [
  {
    id: 'news',
    label: 'News and culture',
    description: 'Fast commentary, explainers, current events, politics, local stories.',
    audience: 'people who want fast, clear context on what is happening right now',
    defaultPlatforms: ['youtube', 'x', 'tiktok'],
    keywords: ['news', 'politics', 'election', 'war', 'house', 'senate', 'mayor', 'city', 'law', 'court', 'policy', 'breaking', 'culture'],
  },
  {
    id: 'beauty',
    label: 'Beauty',
    description: 'Makeup, hair, skincare, tutorials, routines, product comparisons.',
    audience: 'beauty viewers who want practical routines, product context, and clear before-after ideas',
    defaultPlatforms: ['tiktok', 'instagram', 'youtube'],
    keywords: ['beauty', 'makeup', 'skin', 'skincare', 'hair', 'nails', 'routine', 'tutorial', 'glow', 'style', 'fashion'],
  },
  {
    id: 'business',
    label: 'Business and money',
    description: 'Entrepreneurship, sales, marketing, finance, operations, leadership.',
    audience: 'business owners and operators who want practical growth moves without hype',
    defaultPlatforms: ['linkedin', 'youtube', 'x'],
    keywords: ['business', 'startup', 'sales', 'marketing', 'money', 'finance', 'founder', 'career', 'work', 'customer', 'ai', 'productivity'],
  },
  {
    id: 'fitness',
    label: 'Fitness and wellness',
    description: 'Training, habits, health routines, recovery, motivation, transformation.',
    audience: 'people building healthier routines who need realistic, low-pressure guidance',
    defaultPlatforms: ['tiktok', 'instagram', 'youtube'],
    keywords: ['fitness', 'workout', 'gym', 'health', 'wellness', 'diet', 'weight', 'run', 'training', 'recovery', 'habit'],
  },
  {
    id: 'food',
    label: 'Food',
    description: 'Recipes, restaurants, grocery finds, cooking, meal prep, taste tests.',
    audience: 'food viewers who want simple ideas they can cook, try, or save today',
    defaultPlatforms: ['tiktok', 'instagram', 'pinterest'],
    keywords: ['food', 'recipe', 'cook', 'restaurant', 'meal', 'grocery', 'kitchen', 'taste', 'dinner', 'breakfast'],
  },
  {
    id: 'gaming',
    label: 'Gaming',
    description: 'Gameplay, reactions, creators, stream highlights, culture, releases.',
    audience: 'gaming fans who want sharp reactions, clips, and useful context around what is trending',
    defaultPlatforms: ['youtube', 'tiktok', 'reddit'],
    keywords: ['game', 'gaming', 'minecraft', 'stream', 'twitch', 'playstation', 'xbox', 'nintendo', 'roblox', 'fortnite'],
  },
  {
    id: 'parenting',
    label: 'Parenting and home',
    description: 'Family life, home systems, mom content, routines, kids, practical tips.',
    audience: 'busy parents and home builders who want useful, relatable, low-friction ideas',
    defaultPlatforms: ['tiktok', 'instagram', 'pinterest'],
    keywords: ['mom', 'dad', 'parent', 'kid', 'baby', 'home', 'family', 'school', 'routine', 'cleaning', 'organizing'],
  },
  {
    id: 'education',
    label: 'Education',
    description: 'Teaching, explainers, tutorials, study help, niche expertise.',
    audience: 'learners who want clear, useful explanations they can apply quickly',
    defaultPlatforms: ['youtube', 'tiktok', 'linkedin'],
    keywords: ['learn', 'study', 'school', 'teacher', 'explain', 'tutorial', 'lesson', 'science', 'history', 'how to'],
  },
  {
    id: 'tech',
    label: 'Tech and AI',
    description: 'AI, software, gadgets, tools, automation, product breakdowns.',
    audience: 'builders and curious users who want useful tech context without jargon',
    defaultPlatforms: ['youtube', 'x', 'linkedin'],
    keywords: ['ai', 'tech', 'software', 'app', 'iphone', 'android', 'robot', 'data', 'startup', 'tool', 'automation'],
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    description: 'Music, celebrities, film, TV, pop culture, reactions.',
    audience: 'culture fans who want timely reactions, context, and shareable entertainment takes',
    defaultPlatforms: ['tiktok', 'youtube', 'instagram'],
    keywords: ['music', 'song', 'album', 'movie', 'tv', 'celebrity', 'ariana', 'reaction', 'trailer', 'netflix', 'concert'],
  },
  {
    id: 'local_service',
    label: 'Local service business',
    description: 'Contractors, salons, real estate, restaurants, repair, local offers.',
    audience: 'local customers who need practical proof, trust, and a clear next step',
    defaultPlatforms: ['facebook', 'instagram', 'google_business'],
    keywords: ['local', 'service', 'customer', 'home', 'repair', 'construction', 'real estate', 'restaurant', 'salon', 'review'],
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

const VALID_NICHES = new Set(CREATOR_NICHES.map((item) => item.id));
const VALID_GOALS = new Set(CREATOR_GOALS.map((item) => item.id));
const VALID_PLATFORMS = new Set(CREATOR_PLATFORM_OPTIONS.map((item) => item.id));
const DEFAULT_AUDIENCE = 'creators who want practical, low-pressure social content ideas';

function cleanText(value, maxLength = 80) {
  return `${value || ''}`.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function uniqueValidPlatforms(values = []) {
  const next = [];
  for (const value of Array.isArray(values) ? values : []) {
    const id = `${value || ''}`.trim();
    if (VALID_PLATFORMS.has(id) && !next.includes(id)) next.push(id);
  }
  return next;
}

export function getCreatorNiche(nicheId) {
  return CREATOR_NICHES.find((item) => item.id === nicheId) || null;
}

export function getCreatorGoal(goalId) {
  return CREATOR_GOALS.find((item) => item.id === goalId) || CREATOR_GOALS[0];
}

export function normalizeCreatorProfile(input = {}) {
  const niche = VALID_NICHES.has(input?.niche) ? input.niche : '';
  const nicheConfig = getCreatorNiche(niche);
  const preferredPlatforms = uniqueValidPlatforms(input?.preferredPlatforms);
  const fallbackPlatforms = nicheConfig?.defaultPlatforms || [];
  const completed = Boolean(input?.completed && (niche || cleanText(input?.customNiche)) && preferredPlatforms.length);

  return {
    ...DEFAULT_CREATOR_PROFILE,
    creatorType: cleanText(input?.creatorType || DEFAULT_CREATOR_PROFILE.creatorType, 40) || DEFAULT_CREATOR_PROFILE.creatorType,
    niche,
    customNiche: cleanText(input?.customNiche, 64),
    goal: VALID_GOALS.has(input?.goal) ? input.goal : DEFAULT_CREATOR_PROFILE.goal,
    preferredPlatforms: preferredPlatforms.length ? preferredPlatforms : fallbackPlatforms,
    channelName: cleanText(input?.channelName, 70),
    completed,
    createdAt: input?.createdAt || null,
    updatedAt: input?.updatedAt || null,
  };
}

export function isCreatorProfileComplete(profile) {
  return normalizeCreatorProfile(profile).completed;
}

export function getCreatorNicheLabel(profile) {
  const normalized = normalizeCreatorProfile(profile);
  const niche = getCreatorNiche(normalized.niche);
  return normalized.customNiche || niche?.label || 'General creator';
}

export function getCreatorAudience(profile) {
  const normalized = normalizeCreatorProfile(profile);
  const niche = getCreatorNiche(normalized.niche);
  return niche?.audience || DEFAULT_AUDIENCE;
}

export function getCreatorPlatformConfigs(profile) {
  const normalized = normalizeCreatorProfile(profile);
  return normalized.preferredPlatforms
    .map((id) => CREATOR_PLATFORM_OPTIONS.find((platform) => platform.id === id))
    .filter(Boolean);
}

export function getCreatorPlatformSummary(profile) {
  const platforms = getCreatorPlatformConfigs(profile);
  if (!platforms.length) return 'all platforms';
  if (platforms.length === 1) return platforms[0].label;
  return `${platforms.slice(0, 2).map((platform) => platform.label).join(' + ')}${platforms.length > 2 ? ` + ${platforms.length - 2}` : ''}`;
}

export function getCreatorTrendPlatformLabels(profile) {
  return getCreatorPlatformConfigs(profile).flatMap((platform) => platform.trendLabels);
}

export function getCreatorMediaPlatformOptions(profile, platformOptions) {
  const configs = getCreatorPlatformConfigs(profile);
  if (!isCreatorProfileComplete(profile) || !configs.length) return platformOptions;

  const mediaIds = new Set(configs.flatMap((platform) => platform.mediaIds));
  const filtered = platformOptions.filter((platform) => mediaIds.has(platform.id));
  return filtered.length ? filtered : platformOptions;
}

export function getCreatorSocialPlatformOptions(profile, platformOptions) {
  const configs = getCreatorPlatformConfigs(profile);
  if (!isCreatorProfileComplete(profile) || !configs.length) return platformOptions;

  const socialIds = new Set(configs.flatMap((platform) => platform.socialIds));
  const filtered = platformOptions.filter((platform) => socialIds.has(platform.id));
  return filtered.length ? filtered : platformOptions;
}

export function trendMatchesCreatorPlatforms(trend, profile) {
  const labels = getCreatorTrendPlatformLabels(profile).map((label) => label.toLowerCase());
  if (!labels.length) return true;

  return (trend?.platforms || []).some((platform) => labels.includes(`${platform}`.toLowerCase()));
}

function trendText(trend) {
  return [
    trend?.name,
    trend?.description,
    trend?.aiInsight,
    trend?.category,
    trend?.type,
    ...(trend?.platforms || []),
  ].filter(Boolean).join(' ').toLowerCase();
}

export function getCreatorNicheMatchScore(trend, profile) {
  const normalized = normalizeCreatorProfile(profile);
  const niche = getCreatorNiche(normalized.niche);
  const keywords = niche?.keywords || [];
  if (!keywords.length) return 0;

  const haystack = trendText(trend);
  return keywords.reduce((score, keyword) => (
    haystack.includes(keyword.toLowerCase()) ? score + 1 : score
  ), 0);
}

export function scoreTrendForCreator(trend, profile) {
  const opportunity = Number(trend?.opportunityScore) || 0;
  const momentum = Number(trend?.momentum) || 0;
  const velocity = Number(trend?.growthVelocity) || 0;
  const platformBoost = trendMatchesCreatorPlatforms(trend, profile) ? 14 : 0;
  const nicheBoost = Math.min(getCreatorNicheMatchScore(trend, profile), 4) * 12;
  return opportunity * 1.4 + momentum * 0.7 + velocity * 1.8 + platformBoost + nicheBoost;
}

export function tailorTrendsForCreator(trends, profile) {
  const source = Array.isArray(trends) ? trends : [];
  if (!isCreatorProfileComplete(profile)) return source;

  const platformMatches = source.filter((trend) => trendMatchesCreatorPlatforms(trend, profile));
  const base = platformMatches.length ? platformMatches : source;

  return [...base].sort((a, b) => scoreTrendForCreator(b, profile) - scoreTrendForCreator(a, profile));
}

