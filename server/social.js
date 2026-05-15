const DEFAULT_UPLOAD_ENDPOINT = '/api/upload';
const DEFAULT_PHOTO_ENDPOINT = '/api/upload_photos';
const DEFAULT_TEXT_ENDPOINT = '/api/upload_text';
const DEFAULT_STATUS_ENDPOINT = ['/api/upload', 'posts/status'].join('');

const SOCIAL_PLATFORMS = {
  tiktok: {
    label: 'TikTok',
    supports: ['video', 'image'],
    defaultFor: ['video', 'image'],
  },
  instagram: {
    label: 'Instagram',
    supports: ['video', 'image'],
    defaultFor: ['video', 'image'],
  },
  youtube: {
    label: 'YouTube',
    supports: ['video'],
    defaultFor: ['video'],
  },
  linkedin: {
    label: 'LinkedIn',
    supports: ['video', 'image', 'text'],
    defaultFor: ['video', 'image', 'text'],
  },
  facebook: {
    label: 'Facebook',
    supports: ['video', 'image', 'text'],
    defaultFor: ['video', 'image', 'text'],
  },
  x: {
    label: 'X',
    supports: ['video', 'image', 'text'],
    defaultFor: ['video', 'image', 'text'],
  },
  threads: {
    label: 'Threads',
    supports: ['video', 'image', 'text'],
    defaultFor: ['video', 'image', 'text'],
  },
  pinterest: {
    label: 'Pinterest',
    supports: ['video', 'image'],
    defaultFor: ['video', 'image'],
  },
  reddit: {
    label: 'Reddit',
    supports: ['video', 'image', 'text'],
    defaultFor: ['video', 'image', 'text'],
  },
  bluesky: {
    label: 'Bluesky',
    supports: ['video', 'image', 'text'],
    defaultFor: ['video', 'image', 'text'],
  },
  google_business: {
    label: 'Google Business',
    supports: ['video', 'image', 'text'],
    defaultFor: ['video', 'image', 'text'],
  },
};

const PLATFORM_ALIASES = {
  twitter: 'x',
};

const REQUIRED_TARGETS = {
  pinterest: 'OWLGORITHM_SOCIAL_PINTEREST_BOARD_ID',
  reddit: 'OWLGORITHM_SOCIAL_REDDIT_SUBREDDIT',
};

function text(value, fallback = '') {
  const raw = value === undefined || value === null || value === '' ? fallback : value;
  return `${raw}`.replace(/\s+/g, ' ').trim();
}

function bool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(`${value}`.toLowerCase());
}

function cleanUrl(baseUrl, endpoint) {
  const base = `${baseUrl || ''}`.replace(/\/+$/, '');
  let path = `${endpoint || ''}`.startsWith('/') ? endpoint : `/${endpoint || ''}`;
  if (base.endsWith('/api') && path.startsWith('/api/')) {
    path = path.replace(/^\/api/, '');
  }
  return `${base}${path}`;
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function inferExtension(contentType, urlValue) {
  const type = `${contentType || ''}`.split(';')[0].trim().toLowerCase();
  const mapped = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  if (mapped[type]) return mapped[type];

  try {
    const pathname = new URL(urlValue).pathname;
    const extension = pathname.split('.').pop();
    if (/^[a-z0-9]{2,5}$/i.test(extension)) return extension.toLowerCase();
  } catch {
    // fall through to default
  }

  return 'jpg';
}

async function remoteImageBlob(mediaUrl) {
  const response = await fetch(mediaUrl);
  if (!response.ok) {
    const error = new Error(`Could not fetch generated image for publishing. HTTP ${response.status}`);
    error.code = 'invalid_social_request';
    throw error;
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg';
  if (!contentType.startsWith('image/')) {
    const error = new Error('Generated image URL did not return an image file.');
    error.code = 'invalid_social_request';
    throw error;
  }

  const blob = await response.blob();
  const extension = inferExtension(contentType, mediaUrl);
  return {
    blob,
    filename: `owlgorithm-image.${extension}`,
  };
}

function getSocialConfig() {
  const config = {
    apiKey: text(process.env.OWLGORITHM_SOCIAL_API_KEY),
    apiBaseUrl: text(process.env.OWLGORITHM_SOCIAL_API_BASE_URL),
    profile: text(process.env.OWLGORITHM_SOCIAL_PROFILE),
    authScheme: text(process.env.OWLGORITHM_SOCIAL_AUTH_SCHEME, 'Apikey'),
    timezone: text(process.env.OWLGORITHM_SOCIAL_TIMEZONE, 'America/New_York'),
    facebookPageId: text(process.env.OWLGORITHM_SOCIAL_FACEBOOK_PAGE_ID),
    linkedinPageId: text(process.env.OWLGORITHM_SOCIAL_LINKEDIN_PAGE_ID),
    pinterestBoardId: text(process.env.OWLGORITHM_SOCIAL_PINTEREST_BOARD_ID),
    subreddit: text(process.env.OWLGORITHM_SOCIAL_REDDIT_SUBREDDIT),
    googleBusinessLocationId: text(process.env.OWLGORITHM_SOCIAL_GOOGLE_BUSINESS_LOCATION_ID),
    asyncUpload: bool(process.env.OWLGORITHM_SOCIAL_ASYNC_UPLOAD, true),
    endpoints: {
      video: text(process.env.OWLGORITHM_SOCIAL_UPLOAD_ENDPOINT, DEFAULT_UPLOAD_ENDPOINT),
      image: text(process.env.OWLGORITHM_SOCIAL_PHOTO_ENDPOINT, DEFAULT_PHOTO_ENDPOINT),
      text: text(process.env.OWLGORITHM_SOCIAL_TEXT_ENDPOINT, DEFAULT_TEXT_ENDPOINT),
      status: text(process.env.OWLGORITHM_SOCIAL_STATUS_ENDPOINT, DEFAULT_STATUS_ENDPOINT),
    },
  };
  const missing = [];
  if (!config.apiKey) missing.push('OWLGORITHM_SOCIAL_API_KEY');
  if (!config.apiBaseUrl) missing.push('OWLGORITHM_SOCIAL_API_BASE_URL');
  if (!config.profile) missing.push('OWLGORITHM_SOCIAL_PROFILE');

  return {
    ...config,
    configured: missing.length === 0,
    missing,
  };
}

export function getSocialPlatforms() {
  return Object.entries(SOCIAL_PLATFORMS).map(([id, platform]) => ({
    id,
    label: platform.label,
    supports: platform.supports,
    defaultFor: platform.defaultFor,
    targetConfigured: platformTargetConfigured(id),
    requiredTargetEnv: REQUIRED_TARGETS[id] || null,
  }));
}

export function getSocialReadiness() {
  const config = getSocialConfig();
  return {
    configured: config.configured,
    missing: config.missing,
    profileConfigured: Boolean(config.profile),
    platforms: getSocialPlatforms(),
  };
}

function platformTargetConfigured(platform) {
  const config = getSocialConfig();
  if (platform === 'facebook') return Boolean(config.facebookPageId);
  if (platform === 'linkedin') return Boolean(config.linkedinPageId);
  if (platform === 'pinterest') return Boolean(config.pinterestBoardId);
  if (platform === 'reddit') return Boolean(config.subreddit);
  if (platform === 'google_business') return Boolean(config.googleBusinessLocationId);
  return true;
}

function normalizePlatforms(platforms, assetType) {
  const requested = Array.isArray(platforms) ? platforms : [];
  const cleaned = requested
    .map((platform) => PLATFORM_ALIASES[text(platform).toLowerCase()] || text(platform).toLowerCase())
    .filter(Boolean);
  const defaults = Object.entries(SOCIAL_PLATFORMS)
    .filter(([, platform]) => platform.defaultFor.includes(assetType))
    .map(([id]) => id);

  const unique = [...new Set(cleaned.length ? cleaned : defaults)];
  const unsupported = unique.filter((platform) => !SOCIAL_PLATFORMS[platform]);
  if (unsupported.length) {
    const error = new Error(`Unsupported social platform: ${unsupported.join(', ')}.`);
    error.code = 'invalid_social_request';
    throw error;
  }

  const notAllowed = unique.filter((platform) => !SOCIAL_PLATFORMS[platform].supports.includes(assetType));
  if (notAllowed.length) {
    const error = new Error(`${assetType} publishing is not supported on: ${notAllowed.join(', ')}.`);
    error.code = 'invalid_social_request';
    throw error;
  }

  return unique;
}

export function normalizeSocialRequest(body = {}) {
  const assetType = ['video', 'image', 'text'].includes(body.assetType) ? body.assetType : 'text';
  const mediaUrl = text(body.mediaUrl);
  const title = text(body.title || body.caption, 'Owlgorithm post');
  const caption = text(body.caption || body.title);
  const description = text(body.description || body.caption);
  const scheduledDate = text(body.scheduledDate);
  const firstComment = text(body.firstComment);
  const requestId = text(body.requestId);
  const linkUrl = text(body.linkUrl);

  if (assetType !== 'text' && !isHttpUrl(mediaUrl)) {
    const error = new Error('A public media URL is required before this post can be published.');
    error.code = 'invalid_social_request';
    throw error;
  }

  if (!caption && assetType === 'text') {
    const error = new Error('Text publishing requires a caption.');
    error.code = 'invalid_social_request';
    throw error;
  }

  if (scheduledDate) {
    const parsed = Date.parse(scheduledDate);
    if (!Number.isFinite(parsed) || parsed <= Date.now()) {
      const error = new Error('Scheduled date must be a future ISO timestamp.');
      error.code = 'invalid_social_request';
      throw error;
    }
  }

  return {
    assetType,
    mediaUrl,
    title,
    caption,
    description,
    scheduledDate,
    firstComment,
    requestId,
    platforms: normalizePlatforms(body.platforms, assetType),
    facebookPageId: text(body.facebookPageId),
    linkedinPageId: text(body.linkedinPageId),
    pinterestBoardId: text(body.pinterestBoardId),
    subreddit: text(body.subreddit),
    googleBusinessLocationId: text(body.googleBusinessLocationId),
    googleBusinessTopicType: text(body.googleBusinessTopicType),
    googleBusinessCtaType: text(body.googleBusinessCtaType),
    googleBusinessCtaUrl: text(body.googleBusinessCtaUrl),
    linkUrl,
  };
}

function validateRequiredTargets(request, config) {
  const missing = [];
  if (request.platforms.includes('pinterest') && !(request.pinterestBoardId || config.pinterestBoardId)) {
    missing.push('OWLGORITHM_SOCIAL_PINTEREST_BOARD_ID');
  }
  if (request.platforms.includes('reddit') && !(request.subreddit || config.subreddit)) {
    missing.push('OWLGORITHM_SOCIAL_REDDIT_SUBREDDIT');
  }

  if (missing.length) {
    const error = new Error(`Social publishing target is missing: ${missing.join(', ')}.`);
    error.code = 'invalid_social_request';
    throw error;
  }
}

function appendIfValue(form, key, value) {
  const cleaned = text(value);
  if (cleaned) form.append(key, cleaned);
}

async function buildSocialForm(request, config) {
  const form = new FormData();
  form.append('user', config.profile);
  form.append('title', request.title);
  appendIfValue(form, 'description', request.description);
  appendIfValue(form, 'scheduled_date', request.scheduledDate);
  appendIfValue(form, 'timezone', config.timezone);
  appendIfValue(form, 'request_id', request.requestId);
  appendIfValue(form, 'first_comment', request.firstComment);
  appendIfValue(form, 'link_url', request.linkUrl);
  form.append('async_upload', String(config.asyncUpload));

  for (const platform of request.platforms) {
    form.append('platform[]', platform);
  }

  if (request.assetType === 'video') {
    form.append('video', request.mediaUrl);
  } else if (request.assetType === 'image') {
    const remoteImage = await remoteImageBlob(request.mediaUrl);
    form.append('photos[]', remoteImage.blob, remoteImage.filename);
  }

  const facebookPageId = request.facebookPageId || config.facebookPageId;
  const linkedinPageId = request.linkedinPageId || config.linkedinPageId;
  const pinterestBoardId = request.pinterestBoardId || config.pinterestBoardId;
  const subreddit = request.subreddit || config.subreddit;
  const googleBusinessLocationId = request.googleBusinessLocationId || config.googleBusinessLocationId;

  if (request.platforms.includes('facebook')) appendIfValue(form, 'facebook_page_id', facebookPageId);
  if (request.platforms.includes('linkedin')) appendIfValue(form, 'target_linkedin_page_id', linkedinPageId);
  if (request.platforms.includes('pinterest')) appendIfValue(form, 'pinterest_board_id', pinterestBoardId);
  if (request.platforms.includes('reddit')) appendIfValue(form, 'subreddit', subreddit);
  if (request.platforms.includes('google_business')) appendIfValue(form, 'gbp_location_id', googleBusinessLocationId);
  if (request.platforms.includes('google_business')) appendIfValue(form, 'gbp_topic_type', request.googleBusinessTopicType);
  if (request.platforms.includes('google_business')) appendIfValue(form, 'gbp_cta_type', request.googleBusinessCtaType);
  if (request.platforms.includes('google_business')) appendIfValue(form, 'gbp_cta_url', request.googleBusinessCtaUrl);

  return form;
}

async function socialRequest(endpoint, formOrNull, method = 'POST', query = null) {
  const config = getSocialConfig();
  if (!config.configured) {
    const error = new Error(`Social publishing is not configured. Missing: ${config.missing.join(', ')}.`);
    error.code = 'social_unavailable';
    throw error;
  }

  const url = new URL(cleanUrl(config.apiBaseUrl, endpoint));
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `${config.authScheme} ${config.apiKey}`,
    },
    body: formOrNull || undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof data === 'object' && (data?.message || data?.error)
      ? data.message || data.error
      : `Social publishing request failed with HTTP ${response.status}`;
    const error = new Error(message);
    error.code = 'social_provider_error';
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

export async function publishSocialPost(request) {
  const config = getSocialConfig();
  validateRequiredTargets(request, config);
  const form = await buildSocialForm(request, config);
  const endpoint = config.endpoints[request.assetType];
  const response = await socialRequest(endpoint, form);

  return {
    status: request.scheduledDate ? 'scheduled' : 'submitted',
    requestId: response?.request_id || response?.id || request.requestId || null,
    jobId: response?.job_id || null,
    scheduledDate: response?.scheduled_date || request.scheduledDate || null,
    platforms: request.platforms,
    results: response?.results || null,
    usage: response?.usage || null,
    raw: response,
  };
}

export async function getSocialPostStatus(requestId) {
  const id = text(requestId);
  if (!id) {
    const error = new Error('Social request ID is required.');
    error.code = 'invalid_social_request';
    throw error;
  }

  const config = getSocialConfig();
  const statusKey = id.startsWith('scheduler_job_') ? 'job_id' : 'request_id';
  const response = await socialRequest(config.endpoints.status, null, 'GET', { [statusKey]: id });
  return {
    requestId: id,
    status: response?.status || response?.state || 'unknown',
    results: response?.results || response?.data || null,
    raw: response,
  };
}
