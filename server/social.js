import { getSocialProfileByUserId, upsertSocialProfile } from './db.js';

const DEFAULT_API_BASE_URL = 'https://api.upload-post.com/api';
const DEFAULT_UPLOAD_ENDPOINT = '/api/upload';
const DEFAULT_PHOTO_ENDPOINT = '/api/upload_photos';
const DEFAULT_TEXT_ENDPOINT = '/api/upload_text';
const DEFAULT_STATUS_ENDPOINT = '/api/uploadposts/status';
const DEFAULT_PROFILE_ENDPOINT = '/api/uploadposts/users';
const DEFAULT_PROFILE_JWT_ENDPOINT = '/api/uploadposts/users/generate-jwt';
const DEFAULT_CONNECT_PLATFORMS = 'tiktok,instagram,linkedin,facebook,x,threads,google_business';

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

const ACCOUNT_ALIASES = {
  x: ['x', 'twitter'],
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

function csv(value, fallback = '') {
  return text(value, fallback)
    .split(',')
    .map((item) => text(item).toLowerCase())
    .filter(Boolean);
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
    apiKey: text(process.env.UPLOAD_POST_API_KEY || process.env.OWLGORITHM_SOCIAL_API_KEY),
    apiBaseUrl: text(process.env.UPLOAD_POST_API_BASE_URL || process.env.OWLGORITHM_SOCIAL_API_BASE_URL, DEFAULT_API_BASE_URL),
    profileUsername: text(process.env.UPLOAD_POST_PROFILE_USERNAME || process.env.UPLOAD_POST_USER || process.env.OWLGORITHM_SOCIAL_PROFILE),
    authScheme: text(process.env.UPLOAD_POST_AUTH_SCHEME || process.env.OWLGORITHM_SOCIAL_AUTH_SCHEME, 'Apikey'),
    timezone: text(process.env.UPLOAD_POST_TIMEZONE || process.env.OWLGORITHM_SOCIAL_TIMEZONE, 'America/New_York'),
    facebookPageId: text(process.env.UPLOAD_POST_FACEBOOK_PAGE_ID || process.env.OWLGORITHM_SOCIAL_FACEBOOK_PAGE_ID),
    linkedinPageId: text(process.env.UPLOAD_POST_LINKEDIN_PAGE_ID || process.env.OWLGORITHM_SOCIAL_LINKEDIN_PAGE_ID),
    pinterestBoardId: text(process.env.UPLOAD_POST_PINTEREST_BOARD_ID || process.env.OWLGORITHM_SOCIAL_PINTEREST_BOARD_ID),
    subreddit: text(process.env.UPLOAD_POST_REDDIT_SUBREDDIT || process.env.OWLGORITHM_SOCIAL_REDDIT_SUBREDDIT),
    googleBusinessLocationId: text(
      process.env.UPLOAD_POST_GOOGLE_BUSINESS_LOCATION_ID || process.env.OWLGORITHM_SOCIAL_GOOGLE_BUSINESS_LOCATION_ID,
    ),
    asyncUpload: bool(process.env.UPLOAD_POST_ASYNC_UPLOAD || process.env.OWLGORITHM_SOCIAL_ASYNC_UPLOAD, true),
    connectPlatforms: csv(
      process.env.UPLOAD_POST_CONNECT_PLATFORMS || process.env.OWLGORITHM_SOCIAL_CONNECT_PLATFORMS,
      DEFAULT_CONNECT_PLATFORMS,
    ),
    connectTitle: text(process.env.UPLOAD_POST_CONNECT_TITLE, 'Connect Owlgorithm Socials'),
    connectDescription: text(
      process.env.UPLOAD_POST_CONNECT_DESCRIPTION,
      'Link the social accounts Owlgorithm can publish to for this profile.',
    ),
    connectLogoUrl: text(process.env.UPLOAD_POST_CONNECT_LOGO_URL),
    connectRedirectButtonText: text(process.env.UPLOAD_POST_CONNECT_REDIRECT_BUTTON_TEXT, 'Return to Owlgorithm'),
    connectShowCalendar: bool(process.env.UPLOAD_POST_CONNECT_SHOW_CALENDAR, false),
    tiktokPrivacyLevel: text(process.env.UPLOAD_POST_TIKTOK_PRIVACY_LEVEL || process.env.OWLGORITHM_SOCIAL_TIKTOK_PRIVACY_LEVEL, 'PUBLIC_TO_EVERYONE'),
    tiktokAutoAddMusic: bool(process.env.UPLOAD_POST_TIKTOK_AUTO_ADD_MUSIC || process.env.OWLGORITHM_SOCIAL_TIKTOK_AUTO_ADD_MUSIC, true),
    instagramVideoMediaType: text(process.env.UPLOAD_POST_INSTAGRAM_VIDEO_MEDIA_TYPE || process.env.OWLGORITHM_SOCIAL_INSTAGRAM_MEDIA_TYPE, 'REELS'),
    instagramPhotoMediaType: text(process.env.UPLOAD_POST_INSTAGRAM_PHOTO_MEDIA_TYPE, 'IMAGE'),
    facebookMediaType: text(process.env.UPLOAD_POST_FACEBOOK_MEDIA_TYPE || process.env.OWLGORITHM_SOCIAL_FACEBOOK_MEDIA_TYPE, 'REELS'),
    youtubePrivacyStatus: text(process.env.UPLOAD_POST_YOUTUBE_PRIVACY_STATUS || process.env.OWLGORITHM_SOCIAL_YOUTUBE_PRIVACY_STATUS, 'public'),
    youtubeCategoryId: text(process.env.UPLOAD_POST_YOUTUBE_CATEGORY_ID || process.env.OWLGORITHM_SOCIAL_YOUTUBE_CATEGORY_ID, '28'),
    youtubeTags: csv(process.env.UPLOAD_POST_YOUTUBE_TAGS || process.env.OWLGORITHM_SOCIAL_YOUTUBE_TAGS, 'AI,productivity,automation,Delphi Labs,Owlgorithm'),
    endpoints: {
      video: text(process.env.UPLOAD_POST_UPLOAD_ENDPOINT || process.env.OWLGORITHM_SOCIAL_UPLOAD_ENDPOINT, DEFAULT_UPLOAD_ENDPOINT),
      image: text(process.env.UPLOAD_POST_PHOTO_ENDPOINT || process.env.OWLGORITHM_SOCIAL_PHOTO_ENDPOINT, DEFAULT_PHOTO_ENDPOINT),
      text: text(process.env.UPLOAD_POST_TEXT_ENDPOINT || process.env.OWLGORITHM_SOCIAL_TEXT_ENDPOINT, DEFAULT_TEXT_ENDPOINT),
      status: text(process.env.UPLOAD_POST_STATUS_ENDPOINT || process.env.OWLGORITHM_SOCIAL_STATUS_ENDPOINT, DEFAULT_STATUS_ENDPOINT),
      profiles: text(process.env.UPLOAD_POST_PROFILES_ENDPOINT, DEFAULT_PROFILE_ENDPOINT),
      profileJwt: text(process.env.UPLOAD_POST_PROFILE_JWT_ENDPOINT, DEFAULT_PROFILE_JWT_ENDPOINT),
    },
  };
  const missing = [];
  if (!config.apiKey) missing.push('UPLOAD_POST_API_KEY');

  return {
    ...config,
    configured: missing.length === 0,
    missing,
  };
}

function requireSocialConfig(config = getSocialConfig()) {
  if (!config.configured) {
    const error = new Error(`Upload-Post social publishing is not configured. Missing: ${config.missing.join(', ')}.`);
    error.code = 'social_unavailable';
    throw error;
  }
  return config;
}

function platformTargetConfigured(platform) {
  const config = getSocialConfig();
  if (platform === 'pinterest') return Boolean(config.pinterestBoardId);
  if (platform === 'reddit') return Boolean(config.subreddit);
  return true;
}

export function getSocialPlatforms() {
  return Object.entries(SOCIAL_PLATFORMS).map(([id, platform]) => ({
    id,
    label: platform.label,
    supports: platform.supports,
    defaultFor: platform.defaultFor,
    targetConfigured: platformTargetConfigured(id),
    requiredTargetEnv: REQUIRED_TARGETS[id] || null,
    connected: false,
    account: null,
  }));
}

export function getSocialReadiness() {
  const config = getSocialConfig();
  return {
    configured: config.configured,
    missing: config.missing,
    provider: 'upload-post',
    profileConfigured: false,
    platforms: getSocialPlatforms(),
  };
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

function appendIfTrue(form, key, value) {
  if (value) form.append(key, 'true');
}

function profileUsernameForUser(user) {
  const userId = text(user?.id).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 80);
  if (!userId) {
    const error = new Error('Authenticated Owlgorithm user is required for social publishing.');
    error.code = 'invalid_social_request';
    throw error;
  }
  return `owl_${userId}`;
}

function accountKeysForPlatform(platform) {
  return ACCOUNT_ALIASES[platform] || [platform];
}

function rawAccountForPlatform(accounts, platform) {
  const keys = accountKeysForPlatform(platform);
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(accounts || {}, key)) {
      return accounts[key];
    }
  }
  return null;
}

function isConnectedAccount(account) {
  if (!account) return false;
  if (typeof account === 'string') return account.trim().length > 0;
  if (typeof account === 'object') {
    if (typeof account.connected === 'boolean') return account.connected;
    return Object.keys(account).length > 0;
  }
  return Boolean(account);
}

function publicAccountSummary(account) {
  if (!isConnectedAccount(account)) return null;
  if (typeof account === 'string') {
    return {
      connected: true,
      displayName: account,
      username: account,
      imageUrl: null,
    };
  }

  if (typeof account !== 'object') {
    return {
      connected: true,
      displayName: null,
      username: null,
      imageUrl: null,
    };
  }

  return {
    connected: true,
    displayName: text(account.display_name || account.displayName || account.name || account.page_name || account.pageName) || null,
    username: text(account.username || account.handle || account.profile || account.id) || null,
    imageUrl: text(account.social_images || account.social_image || account.image || account.avatar || account.picture) || null,
    pageId: text(account.page_id || account.pageId) || null,
    pageName: text(account.page_name || account.pageName) || null,
  };
}

function sanitizeSocialAccounts(accounts) {
  return Object.fromEntries(
    Object.entries(accounts || {}).map(([platform, account]) => [
      PLATFORM_ALIASES[text(platform).toLowerCase()] || text(platform).toLowerCase(),
      publicAccountSummary(account),
    ]),
  );
}

function normalizeProfileResponse(payload, fallbackUsername) {
  const profile = payload?.profile || payload?.data?.profile || payload?.data || payload;
  if (!profile || typeof profile !== 'object') {
    return {
      username: fallbackUsername,
      social_accounts: {},
    };
  }

  return {
    username: text(profile.username, fallbackUsername),
    created_at: profile.created_at || profile.createdAt || null,
    social_accounts: sanitizeSocialAccounts(profile.social_accounts || profile.socialAccounts || {}),
  };
}

function socialPlatformsFromProfile(profile) {
  const accounts = profile?.social_accounts || {};
  return Object.entries(SOCIAL_PLATFORMS).map(([id, platform]) => {
    const account = rawAccountForPlatform(accounts, id);
    const connected = isConnectedAccount(account);
    return {
      id,
      label: platform.label,
      supports: platform.supports,
      defaultFor: platform.defaultFor,
      targetConfigured: platformTargetConfigured(id),
      requiredTargetEnv: REQUIRED_TARGETS[id] || null,
      connected,
      account: connected ? publicAccountSummary(account) : null,
    };
  });
}

async function uploadPostRequest(endpoint, {
  method = 'GET',
  query = null,
  json = null,
  form = null,
} = {}) {
  const config = requireSocialConfig();
  const url = new URL(cleanUrl(config.apiBaseUrl, endpoint));
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
    });
  }

  const headers = {
    Authorization: `${config.authScheme} ${config.apiKey}`,
  };
  if (json) headers['Content-Type'] = 'application/json';

  const response = await fetch(url, {
    method,
    headers,
    body: json ? JSON.stringify(json) : form || undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof data === 'object' && (data?.message || data?.error)
      ? data.message || data.error
      : `Upload-Post request failed with HTTP ${response.status}`;
    const error = new Error(message);
    error.code = response.status === 404 ? 'social_not_found' : 'social_provider_error';
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

async function fetchRemoteProfile(username) {
  const config = getSocialConfig();
  try {
    const payload = await uploadPostRequest(`${config.endpoints.profiles}/${encodeURIComponent(username)}`);
    return normalizeProfileResponse(payload, username);
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

async function createRemoteProfile(username) {
  const config = getSocialConfig();
  try {
    const payload = await uploadPostRequest(config.endpoints.profiles, {
      method: 'POST',
      json: { username },
    });
    return normalizeProfileResponse(payload, username);
  } catch (error) {
    if (error.status === 409) {
      const profile = await fetchRemoteProfile(username);
      if (profile) return profile;
    }
    throw error;
  }
}

async function syncUploadPostProfile(user) {
  const config = requireSocialConfig();
  const existing = getSocialProfileByUserId(user.id);
  const profileUsername = config.profileUsername || existing?.profileUsername || profileUsernameForUser(user);
  let remoteProfile = await fetchRemoteProfile(profileUsername);
  if (!remoteProfile) {
    remoteProfile = await createRemoteProfile(profileUsername);
  }

  const lastSyncedAt = new Date().toISOString();
  const localProfile = upsertSocialProfile({
    userId: user.id,
    provider: 'upload-post',
    profileUsername,
    connectionSnapshot: remoteProfile,
    lastSyncedAt,
  });

  return {
    localProfile,
    profile: remoteProfile,
    profileUsername,
    lastSyncedAt,
  };
}

function disconnectedPlatformsFor(request, platforms) {
  return request.platforms.filter((id) => {
    const platform = platforms.find((item) => item.id === id);
    return platform?.connected !== true;
  });
}

async function buildSocialForm(request, config, profileUsername) {
  const form = new FormData();
  form.append('user', profileUsername);
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

  if (request.platforms.includes('tiktok')) {
    appendIfValue(form, 'privacy_level', config.tiktokPrivacyLevel);
    appendIfTrue(form, 'auto_add_music', config.tiktokAutoAddMusic && request.assetType === 'image');
  }
  if (request.platforms.includes('instagram')) {
    appendIfValue(form, 'media_type', request.assetType === 'image' ? config.instagramPhotoMediaType : config.instagramVideoMediaType);
  }
  if (request.platforms.includes('facebook') && request.assetType === 'video') {
    appendIfValue(form, 'facebook_media_type', config.facebookMediaType);
  }
  if (request.platforms.includes('youtube')) {
    appendIfValue(form, 'privacyStatus', config.youtubePrivacyStatus);
    appendIfValue(form, 'categoryId', config.youtubeCategoryId);
    if (config.youtubeTags.length) appendIfValue(form, 'tags', JSON.stringify(config.youtubeTags));
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

export async function getSocialAccountsForUser(user) {
  const config = getSocialConfig();
  if (!config.configured) {
    return {
      ...getSocialReadiness(),
      profileUsername: null,
      lastSyncedAt: null,
    };
  }

  const synced = await syncUploadPostProfile(user);
  return {
    configured: true,
    missing: [],
    provider: 'upload-post',
    profileConfigured: true,
    profileUsername: synced.profileUsername,
    lastSyncedAt: synced.lastSyncedAt,
    platforms: socialPlatformsFromProfile(synced.profile),
  };
}

export async function createSocialConnectSession({ user, redirectUrl }) {
  const config = requireSocialConfig();
  const synced = await syncUploadPostProfile(user);
  const payload = {
    username: synced.profileUsername,
    redirect_url: text(redirectUrl) || undefined,
    logo_image: config.connectLogoUrl || undefined,
    redirect_button_text: config.connectRedirectButtonText,
    connect_title: config.connectTitle,
    connect_description: config.connectDescription,
    platforms: config.connectPlatforms,
    show_calendar: config.connectShowCalendar,
    readonly_calendar: false,
    language: 'en',
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined || payload[key] === '') delete payload[key];
  });

  const response = await uploadPostRequest(config.endpoints.profileJwt, {
    method: 'POST',
    json: payload,
  });
  const accessUrl = text(response?.access_url || response?.accessUrl || response?.url || response?.connect_url);

  if (!accessUrl) {
    const error = new Error('Upload-Post did not return a hosted connection URL.');
    error.code = 'social_provider_error';
    error.payload = response;
    throw error;
  }

  return {
    provider: 'upload-post',
    profileUsername: synced.profileUsername,
    accessUrl,
    expiresIn: response?.duration || null,
    platforms: config.connectPlatforms,
  };
}

export async function publishSocialPost({ user, request }) {
  const config = requireSocialConfig();
  validateRequiredTargets(request, config);

  const accounts = await getSocialAccountsForUser(user);
  const disconnected = disconnectedPlatformsFor(request, accounts.platforms);
  if (disconnected.length) {
    const labels = disconnected
      .map((id) => SOCIAL_PLATFORMS[id]?.label || id)
      .join(', ');
    const error = new Error(`Connect these social accounts before publishing: ${labels}.`);
    error.code = 'invalid_social_request';
    error.disconnected = disconnected;
    throw error;
  }

  const form = await buildSocialForm(request, config, accounts.profileUsername);
  const endpoint = config.endpoints[request.assetType];
  const response = await uploadPostRequest(endpoint, { method: 'POST', form });

  return {
    status: request.scheduledDate ? 'scheduled' : 'submitted',
    requestId: response?.request_id || response?.id || request.requestId || null,
    jobId: response?.job_id || null,
    scheduledDate: response?.scheduled_date || request.scheduledDate || null,
    platforms: request.platforms,
    profileUsername: accounts.profileUsername,
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
  const response = await uploadPostRequest(config.endpoints.status, { method: 'GET', query: { [statusKey]: id } });
  return {
    requestId: id,
    status: response?.status || response?.state || 'unknown',
    results: response?.results || response?.data || null,
    raw: response,
  };
}
