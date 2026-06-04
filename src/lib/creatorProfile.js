import {
  CREATOR_GOALS,
  CREATOR_NICHES,
  CREATOR_PLATFORM_OPTIONS,
  DEFAULT_CREATOR_PROFILE,
  classifyTrendForCreators,
  getTrendNicheScore,
} from '../../shared/creatorTaxonomy.js';

export {
  CREATOR_GOALS,
  CREATOR_NICHES,
  CREATOR_PLATFORM_OPTIONS,
  DEFAULT_CREATOR_PROFILE,
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

function trendCreatorFit(trend) {
  return trend?.creatorFit || classifyTrendForCreators(trend);
}

export function getCreatorNicheMatchScore(trend, profile) {
  const normalized = normalizeCreatorProfile(profile);
  if (!normalized.niche || normalized.niche === 'exploring') return 0;
  return getTrendNicheScore(trend, normalized.niche);
}

export function scoreTrendForCreator(trend, profile) {
  const normalized = normalizeCreatorProfile(profile);
  const fit = trendCreatorFit(trend);
  const opportunity = Number(trend?.opportunityScore) || 0;
  const momentum = Number(trend?.momentum) || 0;
  const velocity = Number(trend?.growthVelocity) || 0;
  const platformBoost = trendMatchesCreatorPlatforms(trend, normalized) ? 18 : 0;
  const nicheScore = normalized.niche === 'exploring' ? 0 : getTrendNicheScore(trend, normalized.niche);
  const primaryBoost = fit.primaryNiche === normalized.niche ? Math.max(10, fit.confidence * 0.35) : 0;
  const nicheBoost = Math.min(nicheScore, 30) * 2.3 + primaryBoost;

  return opportunity * 1.3 + momentum * 0.65 + velocity * 1.6 + platformBoost + nicheBoost;
}

export function tailorTrendsForCreator(trends, profile) {
  const source = Array.isArray(trends) ? trends : [];
  const normalized = normalizeCreatorProfile(profile);
  if (!isCreatorProfileComplete(normalized)) return source;

  const platformMatches = source.filter((trend) => trendMatchesCreatorPlatforms(trend, normalized));
  const platformBase = platformMatches.length ? platformMatches : source;

  if (normalized.niche === 'exploring') {
    return [...platformBase].sort((a, b) => scoreTrendForCreator(b, normalized) - scoreTrendForCreator(a, normalized));
  }

  const nicheMatches = platformBase.filter((trend) => {
    const fit = trendCreatorFit(trend);
    return fit.primaryNiche === normalized.niche || getTrendNicheScore(trend, normalized.niche) > 0;
  });
  const minimumUsefulMatches = Math.min(3, platformBase.length);
  const base = nicheMatches.length >= minimumUsefulMatches ? nicheMatches : platformBase;

  return [...base].sort((a, b) => scoreTrendForCreator(b, normalized) - scoreTrendForCreator(a, normalized));
}

