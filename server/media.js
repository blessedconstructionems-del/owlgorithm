const MEDIA_IMAGE_ENDPOINT = '/images/generations';
const MEDIA_VIDEO_ENDPOINT = '/videos/generations';
const MEDIA_VIDEO_STATUS_ENDPOINT = '/videos';
const XAI_API_BASE_URL = 'https://api.x.ai/v1';
const XAI_IMAGE_MODEL = 'grok-imagine-image-quality';
const XAI_VIDEO_MODEL = 'grok-imagine-video';

const PLATFORM_PRESETS = {
  tiktok: { label: 'TikTok', mobileLabel: 'TikTok', aspectRatio: '9:16', duration: 8 },
  instagram_reels: { label: 'Instagram Reels', mobileLabel: 'Reels', aspectRatio: '9:16', duration: 8 },
  youtube_shorts: { label: 'YouTube Shorts', mobileLabel: 'Shorts', aspectRatio: '9:16', duration: 8 },
  instagram_feed: { label: 'Instagram Feed', mobileLabel: 'Feed', aspectRatio: '1:1', duration: 6 },
  linkedin: { label: 'LinkedIn', mobileLabel: 'LinkedIn', aspectRatio: '4:3', duration: 6 },
  x: { label: 'X', mobileLabel: 'X', aspectRatio: '16:9', duration: 6 },
  pinterest: { label: 'Pinterest', mobileLabel: 'Pins', aspectRatio: '2:3', duration: 6 },
};

const STYLE_PRESETS = {
  ugc: 'authentic phone-shot UGC, natural light, clear subject, creator-led',
  clean: 'clean editorial social creative, crisp contrast, strong visual hierarchy',
  cinematic: 'cinematic lighting, premium campaign look, atmospheric but readable',
  product: 'product-focused composition, practical demonstration, commerce-ready',
  explainer: 'simple explainer visual, clear sequence, beginner-friendly framing',
};

function text(value, fallback = '') {
  return `${value || fallback}`.replace(/\s+/g, ' ').trim();
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function intInRange(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function hashtagToken(value) {
  return text(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toLowerCase();
}

function buildHashtags(request, trendName, trend = null) {
  const tags = new Set();
  const words = text(trendName)
    .split(/\s+/)
    .map(hashtagToken)
    .filter((word) => word.length >= 3 && !/^\d+$/.test(word));

  const compactName = words.slice(0, 3).join('');
  if (compactName.length >= 4 && compactName.length <= 32) tags.add(`#${compactName}`);

  for (const word of words.slice(0, 3)) {
    if (word.length <= 24) tags.add(`#${word}`);
  }

  const category = hashtagToken(trend?.category);
  if (category && category !== 'general') tags.add(`#${category}`);

  const platformTags = {
    tiktok: '#tiktokideas',
    instagram_reels: '#reelsideas',
    youtube_shorts: '#shortsideas',
    instagram_feed: '#instagramtips',
    linkedin: '#marketing',
    x: '#socialmedia',
    pinterest: '#pinterestideas',
  };

  tags.add('#trending');
  tags.add(platformTags[request.platform] || '#contentideas');
  tags.add('#contentideas');
  tags.add('#socialmediatips');

  return [...tags].slice(0, 8);
}

function envValue(...keys) {
  for (const key of keys) {
    const value = `${process.env[key] || ''}`.trim();
    if (value) return value;
  }
  return '';
}

function mediaConfig() {
  const mediaApiKey = envValue('OWLGORITHM_MEDIA_API_KEY');
  const xaiApiKey = envValue('XAI_API_KEY', 'GROK_API_KEY');
  const hasXaiAlias = Boolean(xaiApiKey);
  const explicitMediaBaseUrl = envValue('OWLGORITHM_MEDIA_API_BASE_URL');
  const baseUrl = envValue('OWLGORITHM_MEDIA_API_BASE_URL', 'XAI_API_BASE_URL', 'GROK_API_BASE_URL')
    || (hasXaiAlias ? XAI_API_BASE_URL : '');
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
  const usesXai = normalizedBaseUrl.includes('api.x.ai') || Boolean(hasXaiAlias && !explicitMediaBaseUrl);
  const apiKey = usesXai ? (xaiApiKey || mediaApiKey) : (mediaApiKey || xaiApiKey);
  const imageModel = envValue('OWLGORITHM_MEDIA_IMAGE_MODEL', 'XAI_IMAGE_MODEL', 'GROK_IMAGE_MODEL')
    || (hasXaiAlias ? XAI_IMAGE_MODEL : '');
  const videoModel = envValue('OWLGORITHM_MEDIA_VIDEO_MODEL', 'XAI_VIDEO_MODEL', 'GROK_VIDEO_MODEL')
    || (hasXaiAlias ? XAI_VIDEO_MODEL : '');
  const config = {
    apiKey,
    baseUrl: normalizedBaseUrl,
    imageModel,
    videoModel,
  };
  const missing = [];
  if (!config.apiKey) missing.push('OWLGORITHM_MEDIA_API_KEY or XAI_API_KEY or GROK_API_KEY');
  if (!config.baseUrl) missing.push('OWLGORITHM_MEDIA_API_BASE_URL or XAI_API_BASE_URL');
  if (!config.imageModel) missing.push('OWLGORITHM_MEDIA_IMAGE_MODEL or XAI_IMAGE_MODEL');
  if (!config.videoModel) missing.push('OWLGORITHM_MEDIA_VIDEO_MODEL or XAI_VIDEO_MODEL');

  return {
    ...config,
    configured: missing.length === 0,
    missing,
  };
}

export function getMediaReadiness() {
  const config = mediaConfig();
  return {
    configured: config.configured,
    missing: config.missing,
    platforms: Object.entries(PLATFORM_PRESETS).map(([id, preset]) => ({ id, ...preset })),
    styles: Object.entries(STYLE_PRESETS).map(([id, label]) => ({ id, label })),
  };
}

export function normalizeMediaRequest(body = {}) {
  const platform = PLATFORM_PRESETS[body.platform] ? body.platform : 'tiktok';
  const preset = PLATFORM_PRESETS[platform];
  const type = body.type === 'video' ? 'video' : 'image';
  const style = STYLE_PRESETS[body.style] ? body.style : 'ugc';
  const sourceImageUrl = text(body.sourceImageUrl);

  if (sourceImageUrl && !isHttpUrl(sourceImageUrl)) {
    const error = new Error('Source image must be a public http(s) URL.');
    error.code = 'invalid_media_request';
    throw error;
  }

  return {
    type,
    platform,
    platformLabel: preset.label,
    aspectRatio: text(body.aspectRatio, preset.aspectRatio),
    duration: intInRange(body.duration, 1, 15, preset.duration),
    resolution: body.resolution === '720p' ? '720p' : '480p',
    style,
    styleLabel: STYLE_PRESETS[style],
    sourceImageUrl,
    customConcept: text(body.customConcept),
    audience: text(body.audience, 'beginners who want practical, low-pressure social media ideas'),
    creatorNiche: text(body.creatorNiche),
    creatorGoal: text(body.creatorGoal),
    truthNote: text(body.truthNote),
    callToAction: text(body.callToAction, 'follow for the next update'),
  };
}

export function buildMediaPlan(request, trend = null) {
  const trendName = text(trend?.name || request.customConcept);
  if (!trendName) {
    const error = new Error('Choose a live trend or enter a custom concept.');
    error.code = 'invalid_media_request';
    throw error;
  }

  const trendPhase = text(trend?.saturation);
  const trendPlatforms = Array.isArray(trend?.platforms) ? trend.platforms.join(', ') : '';
  const description = text(trend?.description);
  const context = [
    trend ? `Live trend: ${trendName}.` : `Concept: ${trendName}.`,
    trendPhase ? `Trend phase: ${trendPhase}.` : '',
    trendPlatforms ? `Detected on: ${trendPlatforms}.` : '',
    description ? `Source context: ${description}.` : '',
    request.creatorNiche ? `Creator niche: ${request.creatorNiche}.` : '',
    request.creatorGoal ? `Creator goal: ${request.creatorGoal.replace(/_/g, ' ')}.` : '',
    request.truthNote ? `Truth guardrail: ${request.truthNote}.` : 'Truth guardrail: avoid unsupported claims and present this as a practical observation.',
  ].filter(Boolean).join(' ');

  const hook = `I wasn't going to post this, but ${trendName} is worth watching.`;
  const caption = [
    hook,
    '',
    'Quick read: this is gaining attention right now, so keep the post simple, useful, and easy to save.',
    '',
    request.callToAction,
  ].join('\n');

  const hashtags = buildHashtags(request, trendName, trend);

  const prompt = [
    `Create a ${request.type === 'video' ? `${request.duration}-second` : 'single'} ${request.aspectRatio} ${request.platformLabel} ${request.type}.`,
    context,
    `Audience: ${request.audience}.`,
    `Visual style: ${request.styleLabel}.`,
    'Use a strong first frame, readable composition on a phone, and no tiny text.',
    'Do not include platform logos, watermarks, celebrity likenesses, medical/legal/financial promises, or claims not supported by the provided trend context.',
    `Use this creator hook as the creative spine: "${hook}"`,
  ].join(' ');

  return {
    trendName,
    prompt,
    caption,
    hashtags,
    platform: request.platform,
    platformLabel: request.platformLabel,
    aspectRatio: request.aspectRatio,
    duration: request.type === 'video' ? request.duration : null,
    type: request.type,
  };
}

async function mediaRequest(path, payload, method = 'POST') {
  const config = mediaConfig();
  if (!config.configured) {
    const error = new Error(`Media generation is not configured. Missing: ${config.missing.join(', ')}.`);
    error.code = 'media_unavailable';
    throw error;
  }

  const response = await fetch(`${config.baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      ...(payload ? { 'Content-Type': 'application/json' } : {}),
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof data === 'object' && data?.error?.message
      ? data.error.message
      : typeof data === 'object' && data?.error
        ? data.error
        : `Media provider request failed with HTTP ${response.status}`;
    const error = new Error(message);
    error.code = 'media_provider_error';
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

export async function generateMediaAsset({ request, plan }) {
  const config = mediaConfig();

  if (request.type === 'image') {
    const payload = {
      model: config.imageModel,
      prompt: plan.prompt,
      n: 1,
      response_format: 'url',
      aspect_ratio: request.aspectRatio,
      resolution: '1k',
    };
    const data = await mediaRequest(MEDIA_IMAGE_ENDPOINT, payload);
    const url = data?.data?.[0]?.url || data?.url || null;
    if (!url) {
      const error = new Error('Image provider response did not include a URL.');
      error.code = 'media_provider_error';
      error.payload = data;
      throw error;
    }
    return { status: 'complete', type: 'image', url };
  }

  const payload = {
    model: config.videoModel,
    prompt: plan.prompt,
    duration: request.duration,
    aspect_ratio: request.aspectRatio,
    resolution: request.resolution,
  };

  if (request.sourceImageUrl) {
    payload.image = { url: request.sourceImageUrl };
  }

  const data = await mediaRequest(MEDIA_VIDEO_ENDPOINT, payload);
  const requestId = data?.request_id || data?.id || null;
  const url = data?.video?.url || data?.url || null;
  if (url) return { status: 'complete', type: 'video', url };
  if (!requestId) {
    const error = new Error('Video provider response did not include a request ID.');
    error.code = 'media_provider_error';
    error.payload = data;
    throw error;
  }
  return { status: 'queued', type: 'video', requestId };
}

export async function getVideoStatus(requestId) {
  const id = text(requestId);
  if (!id) {
    const error = new Error('Video request ID is required.');
    error.code = 'invalid_media_request';
    throw error;
  }

  const data = await mediaRequest(`${MEDIA_VIDEO_STATUS_ENDPOINT}/${encodeURIComponent(id)}`, null, 'GET');
  return {
    requestId: id,
    status: data?.status || 'unknown',
    url: data?.video?.url || data?.url || null,
  };
}
