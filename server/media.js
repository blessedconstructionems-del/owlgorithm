const MEDIA_IMAGE_ENDPOINT = '/images/generations';
const MEDIA_VIDEO_ENDPOINT = '/videos/generations';
const MEDIA_VIDEO_STATUS_ENDPOINT = '/videos';

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

function mediaConfig() {
  const config = {
    apiKey: process.env.OWLGORITHM_MEDIA_API_KEY,
    baseUrl: process.env.OWLGORITHM_MEDIA_API_BASE_URL,
    imageModel: process.env.OWLGORITHM_MEDIA_IMAGE_MODEL,
    videoModel: process.env.OWLGORITHM_MEDIA_VIDEO_MODEL,
  };
  const missing = [];
  if (!config.apiKey) missing.push('OWLGORITHM_MEDIA_API_KEY');
  if (!config.baseUrl) missing.push('OWLGORITHM_MEDIA_API_BASE_URL');
  if (!config.imageModel) missing.push('OWLGORITHM_MEDIA_IMAGE_MODEL');
  if (!config.videoModel) missing.push('OWLGORITHM_MEDIA_VIDEO_MODEL');

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

  const hashtags = ['#trending', '#contentideas', '#socialmediatips'];
  if (request.platform === 'linkedin') hashtags.push('#marketing');
  if (request.platform === 'pinterest') hashtags.push('#ideas');

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
