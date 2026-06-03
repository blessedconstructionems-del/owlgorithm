export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
export const STATIC_PREVIEW = ['1', 'true', 'yes'].includes(
  `${import.meta.env.VITE_STATIC_PREVIEW || import.meta.env.VITE_STATIC_DEMO || ''}`.toLowerCase(),
);

const SOCIAL_PLATFORMS = [
  { id: 'tiktok', label: 'TikTok', supports: ['video', 'image'], defaultFor: ['video', 'image'], targetConfigured: true, requiredTargetEnv: null, connected: false },
  { id: 'instagram', label: 'Instagram', supports: ['video', 'image'], defaultFor: ['video', 'image'], targetConfigured: true, requiredTargetEnv: null, connected: false },
  { id: 'youtube', label: 'YouTube', supports: ['video'], defaultFor: ['video'], targetConfigured: true, requiredTargetEnv: null, connected: false },
  { id: 'linkedin', label: 'LinkedIn', supports: ['video', 'image', 'text'], defaultFor: ['video', 'image', 'text'], targetConfigured: true, requiredTargetEnv: null, connected: false },
  { id: 'facebook', label: 'Facebook', supports: ['video', 'image', 'text'], defaultFor: ['video', 'image', 'text'], targetConfigured: true, requiredTargetEnv: null, connected: false },
  { id: 'x', label: 'X', supports: ['video', 'image', 'text'], defaultFor: ['video', 'image', 'text'], targetConfigured: true, requiredTargetEnv: null, connected: false },
  { id: 'threads', label: 'Threads', supports: ['video', 'image', 'text'], defaultFor: ['video', 'image', 'text'], targetConfigured: true, requiredTargetEnv: null, connected: false },
  { id: 'pinterest', label: 'Pinterest', supports: ['video', 'image'], defaultFor: ['video', 'image'], targetConfigured: false, requiredTargetEnv: 'OWLGORITHM_SOCIAL_PINTEREST_BOARD_ID', connected: false },
  { id: 'reddit', label: 'Reddit', supports: ['video', 'image', 'text'], defaultFor: ['video', 'image', 'text'], targetConfigured: false, requiredTargetEnv: 'OWLGORITHM_SOCIAL_REDDIT_SUBREDDIT', connected: false },
  { id: 'bluesky', label: 'Bluesky', supports: ['video', 'image', 'text'], defaultFor: ['video', 'image', 'text'], targetConfigured: true, requiredTargetEnv: null, connected: false },
  { id: 'google_business', label: 'Google Business', supports: ['video', 'image', 'text'], defaultFor: ['video', 'image', 'text'], targetConfigured: true, requiredTargetEnv: null, connected: false },
];

const MEDIA_PLATFORMS = [
  { id: 'tiktok', label: 'TikTok', mobileLabel: 'TikTok', aspectRatio: '9:16', duration: 8 },
  { id: 'instagram_reels', label: 'Instagram Reels', mobileLabel: 'Reels', aspectRatio: '9:16', duration: 8 },
  { id: 'youtube_shorts', label: 'YouTube Shorts', mobileLabel: 'Shorts', aspectRatio: '9:16', duration: 8 },
  { id: 'instagram_feed', label: 'Instagram Feed', mobileLabel: 'Feed', aspectRatio: '1:1', duration: 6 },
  { id: 'linkedin', label: 'LinkedIn', mobileLabel: 'LinkedIn', aspectRatio: '4:3', duration: 6 },
  { id: 'x', label: 'X', mobileLabel: 'X', aspectRatio: '16:9', duration: 6 },
  { id: 'pinterest', label: 'Pinterest', mobileLabel: 'Pins', aspectRatio: '2:3', duration: 6 },
];

const MEDIA_STYLES = [
  { id: 'ugc', label: 'authentic phone-shot UGC, natural light, clear subject, creator-led' },
  { id: 'clean', label: 'clean editorial social creative, crisp contrast, strong visual hierarchy' },
  { id: 'cinematic', label: 'cinematic lighting, premium campaign look, atmospheric but readable' },
  { id: 'product', label: 'product-focused composition, practical demonstration, commerce-ready' },
  { id: 'explainer', label: 'simple explainer visual, clear sequence, beginner-friendly framing' },
];

export class ApiError extends Error {
  constructor(message, status, payload = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export function apiUrl(endpoint) {
  const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE}${normalized}`;
}

function staticPlan(body = {}) {
  const concept = `${body.customConcept || 'beginner posting confidence'}`.trim();
  const platform = MEDIA_PLATFORMS.find((item) => item.id === body.platform) || MEDIA_PLATFORMS[0];
  const trendName = concept.replace(/\b\w/g, (letter) => letter.toUpperCase());
  const hashtags = ['#contentideas', '#socialmedia', '#creatortips'];

  return {
    trendName,
    platform: platform.label,
    aspectRatio: platform.aspectRatio,
    duration: Number(body.duration || platform.duration || 8),
    caption: `I wasn't going to post this, but this is exactly how ${concept} starts getting easier.`,
    hashtags,
    prompt: [
      `${body.type === 'image' ? 'Create an image' : 'Create a short vertical video'} about ${concept}.`,
      `Use a ${platform.aspectRatio} composition for ${platform.label}.`,
      'Keep it beginner-friendly, practical, and low pressure.',
      body.truthNote ? `Avoid unsupported claims: ${body.truthNote}` : '',
    ].filter(Boolean).join(' '),
    storyboard: [
      "Say: I wasn't gonna post this but...",
      "Show what you're doing.",
      'React and end it.',
    ],
  };
}

function staticResponse(endpoint, options = {}) {
  const method = `${options.method || 'GET'}`.toUpperCase();

  if (endpoint === '/api/auth/session') {
    return {
      authenticated: true,
      user: {
        id: 'static-preview',
        name: 'Preview Guest',
        email: 'preview@owlgorithm.local',
        plan: 'Preview',
        isGuest: true,
      },
      preferences: {
        environment: '/snowy-owl.mp4',
        sidebarCollapsed: false,
      },
    };
  }

  if (endpoint === '/api/trends') {
    return { trends: [], count: 0, lastUpdated: null, scraperEnabled: false };
  }

  if (endpoint === '/api/opportunities') {
    return { opportunities: [], count: 0 };
  }

  if (endpoint === '/api/scrape/status') {
    return {
      enabled: false,
      lastFullRun: null,
      sources: [],
      message: 'Static preview mode is not connected to the live scraper.',
    };
  }

  if (endpoint === '/api/media/readiness') {
    return {
      configured: false,
      missing: ['OWLGORITHM_MEDIA_API_KEY or XAI_API_KEY or GROK_API_KEY'],
      platforms: MEDIA_PLATFORMS,
      styles: MEDIA_STYLES,
    };
  }

  if (endpoint === '/api/support/readiness') {
    return {
      configured: false,
      missing: ['XAI_API_KEY or GROK_API_KEY'],
      provider: 'xai',
      model: null,
    };
  }

  if (endpoint === '/api/support/chat' && method === 'POST') {
    return {
      reply: 'Static preview is not connected to Support Owl. Open the live Owlgorithm backend to chat.',
      provider: 'static-preview',
      model: null,
    };
  }

  if (endpoint === '/api/social/readiness' || endpoint === '/api/social/accounts') {
    return {
      configured: false,
      missing: ['UPLOAD_POST_API_KEY'],
      provider: 'upload-post',
      profileConfigured: false,
      platforms: SOCIAL_PLATFORMS,
    };
  }

  if (endpoint === '/api/media/plan' && method === 'POST') {
    const request = options.json || {};
    return { request, plan: staticPlan(request), trend: null };
  }

  if (endpoint === '/api/account/preferences' && method === 'PATCH') {
    return {
      authenticated: true,
      user: {
        id: 'static-preview',
        name: 'Preview Guest',
        email: 'preview@owlgorithm.local',
        plan: 'Preview',
        isGuest: true,
      },
      preferences: options.json || {},
    };
  }

  if (endpoint.startsWith('/api/')) {
    throw new ApiError('This action needs the live Owlgorithm backend.', 503, { code: 'static_preview' });
  }

  return null;
}

export async function apiRequest(endpoint, options = {}) {
  const { json, headers, ...rest } = options;

  if (STATIC_PREVIEW) {
    const response = staticResponse(endpoint, options);
    if (response !== null) return response;
  }

  const response = await fetch(apiUrl(endpoint), {
    credentials: 'include',
    ...rest,
    headers: {
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      ...(headers || {}),
    },
    body: json ? JSON.stringify(json) : rest.body,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'object' && payload?.error
      ? payload.error
      : `HTTP ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  return payload;
}
