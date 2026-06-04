import crypto from 'crypto';
import {
  createAccountToken,
  createSessionRecord,
  createUserAccount,
  createVerifiedUserAccount,
  deleteExpiredAccountTokens,
  deleteExpiredSessions,
  deleteSessionRecord,
  deleteSessionsByUserId,
  deleteUserAccount,
  getActiveAccountToken,
  getAuthIdentity,
  getAuthStateBySessionId,
  getAuthStateByUserId,
  getUserRecordByEmail,
  getUserRecordById,
  markUserEmailVerified,
  revokeAccountTokensForUser,
  touchSession,
  upsertAuthIdentity,
  updateUserPassword,
  updateUserPreferences,
  updateUserProfile,
  DEFAULT_ENVIRONMENT,
} from './db.js';
import {
  CREATOR_GOALS as CREATOR_GOAL_OPTIONS,
  CREATOR_NICHES as CREATOR_NICHE_OPTIONS,
  CREATOR_PLATFORM_OPTIONS,
  DEFAULT_CREATOR_PROFILE,
} from '../shared/creatorTaxonomy.js';

export const SESSION_COOKIE_NAME = 'owlgorithm_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const PASSWORD_MIN_LENGTH = 10;
const EMAIL_VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24;
const PASSWORD_RESET_TTL_MS = 1000 * 60 * 60;
const ACCOUNT_TOKEN_TYPES = {
  emailVerification: 'email_verification',
  passwordReset: 'password_reset',
};
const ENVIRONMENT_OPTIONS = new Set([
  '/snowy-owl.mp4',
  '/fantasy-mountain-landscape.1920x1080.mp4',
  '/cosmos-flowers.3840x2160.mp4',
  '/circuit-board.3840x2160.mp4',
  '/tech-hud.3840x2160.mp4',
  'gradient:aurora',
  'gradient:nebula',
  'gradient:midnight',
  'gradient:ember',
]);
const CREATOR_NICHES = new Set(CREATOR_NICHE_OPTIONS.map((option) => option.id));
const CREATOR_GOALS = new Set(CREATOR_GOAL_OPTIONS.map((option) => option.id));
const CREATOR_PLATFORMS = new Set(CREATOR_PLATFORM_OPTIONS.map((option) => option.id));

const rateLimitState = new Map();

function normalizeEmail(email) {
  return `${email || ''}`.trim().toLowerCase();
}

function normalizeToken(token) {
  return `${token || ''}`.trim();
}

function hashOpaqueToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createOpaqueToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function issueAccountToken({ userId, type, emailSnapshot, ttlMs }) {
  deleteExpiredAccountTokens();
  revokeAccountTokensForUser({ userId, type });

  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();

  createAccountToken({
    userId,
    type,
    tokenHash: hashOpaqueToken(token),
    emailSnapshot,
    expiresAt,
  });

  return { token, expiresAt };
}

function readActiveTokenOrThrow({ token, type }) {
  deleteExpiredAccountTokens();
  const normalizedToken = normalizeToken(token);
  if (!normalizedToken) {
    const error = new Error('That link is invalid or expired.');
    error.code = 'invalid_token';
    throw error;
  }

  const record = getActiveAccountToken({
    type,
    tokenHash: hashOpaqueToken(normalizedToken),
  });

  if (!record) {
    const error = new Error('That link is invalid or expired.');
    error.code = 'invalid_token';
    throw error;
  }

  const userRecord = getUserRecordById(record.user_id);
  const snapshotMatches = userRecord && normalizeEmail(userRecord.email) === normalizeEmail(record.email_snapshot);

  if (!userRecord || !snapshotMatches) {
    const error = new Error('That link is invalid or expired.');
    error.code = 'invalid_token';
    throw error;
  }

  return { record, userRecord };
}

export function validateEmail(email) {
  const value = normalizeEmail(email);
  if (!value || value.length > 254) {
    return 'Enter a valid email address.';
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(value)) {
    return 'Enter a valid email address.';
  }

  return null;
}

export function validateDisplayName(name) {
  const value = `${name || ''}`.trim();
  if (value.length < 2 || value.length > 60) {
    return 'Use a name between 2 and 60 characters.';
  }

  return null;
}

export function validatePassword(password) {
  const value = `${password || ''}`;
  if (value.length < PASSWORD_MIN_LENGTH || value.length > 128) {
    return `Use a password between ${PASSWORD_MIN_LENGTH} and 128 characters.`;
  }

  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return 'Use at least one letter and one number.';
  }

  return null;
}

export function normalizePreferences(input = {}) {
  const environment = ENVIRONMENT_OPTIONS.has(input.environment) ? input.environment : DEFAULT_ENVIRONMENT;
  const sidebarCollapsed = Boolean(input.sidebarCollapsed);
  return {
    environment,
    sidebarCollapsed,
    creatorProfile: normalizeCreatorProfile(input.creatorProfile),
  };
}

function cleanProfileText(value, maxLength = 80) {
  return `${value || ''}`.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function normalizeCreatorProfile(input = {}) {
  const niche = CREATOR_NICHES.has(input?.niche) ? input.niche : '';
  const preferredPlatforms = [];
  for (const platform of Array.isArray(input?.preferredPlatforms) ? input.preferredPlatforms : []) {
    if (CREATOR_PLATFORMS.has(platform) && !preferredPlatforms.includes(platform)) {
      preferredPlatforms.push(platform);
    }
  }

  const hasLane = Boolean(niche || cleanProfileText(input?.customNiche));

  return {
    ...DEFAULT_CREATOR_PROFILE,
    completed: Boolean(input?.completed && hasLane && preferredPlatforms.length),
    creatorType: cleanProfileText(input?.creatorType || DEFAULT_CREATOR_PROFILE.creatorType, 40) || DEFAULT_CREATOR_PROFILE.creatorType,
    niche,
    customNiche: cleanProfileText(input?.customNiche, 64),
    goal: CREATOR_GOALS.has(input?.goal) ? input.goal : DEFAULT_CREATOR_PROFILE.goal,
    preferredPlatforms,
    channelName: cleanProfileText(input?.channelName, 70),
    createdAt: input?.createdAt || null,
    updatedAt: input?.updatedAt || null,
  };
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const hash = crypto.scryptSync(password, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 32 * 1024 * 1024,
  }).toString('base64url');
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  const [scheme, salt, expected] = `${storedHash || ''}`.split(':');
  if (scheme !== 'scrypt' || !salt || !expected) return false;

  const actual = crypto.scryptSync(password, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 32 * 1024 * 1024,
  });

  const expectedBuffer = Buffer.from(expected, 'base64url');
  return expectedBuffer.length === actual.length && crypto.timingSafeEqual(expectedBuffer, actual);
}

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }

  return req.socket.remoteAddress || '';
}

export function shouldUseSecureCookies(req) {
  return process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https';
}

function hashSessionToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
  parts.push(`Path=${options.path || '/'}`);
  parts.push(`SameSite=${options.sameSite || 'Lax'}`);
  if (options.httpOnly !== false) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');

  return parts.join('; ');
}

export function clearSessionCookie(req) {
  return serializeCookie(SESSION_COOKIE_NAME, '', {
    expires: new Date(0),
    maxAge: 0,
    secure: shouldUseSecureCookies(req),
  });
}

export function parseCookies(header = '') {
  return header
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const index = part.indexOf('=');
      if (index === -1) return acc;

      const key = part.slice(0, index).trim();
      const value = decodeURIComponent(part.slice(index + 1).trim());
      acc[key] = value;
      return acc;
    }, {});
}

export function readSessionFromRequest(req) {
  deleteExpiredSessions();
  deleteExpiredAccountTokens();

  const token = parseCookies(req.headers.cookie || '')[SESSION_COOKIE_NAME];
  if (!token) {
    return { auth: null, clearCookie: false };
  }

  const sessionId = hashSessionToken(token);
  const auth = getAuthStateBySessionId(sessionId);

  if (!auth) {
    return { auth: null, clearCookie: true };
  }

  touchSession(sessionId);
  return { auth, clearCookie: false, sessionId };
}

export function createAuthenticatedSession(req, authState) {
  const rawToken = crypto.randomBytes(32).toString('base64url');
  const sessionId = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  createSessionRecord({
    id: sessionId,
    userId: authState.user.id,
    expiresAt: expiresAt.toISOString(),
    ipAddress: getClientIp(req),
    userAgent: `${req.headers['user-agent'] || ''}`.slice(0, 512),
  });

  return {
    cookie: serializeCookie(SESSION_COOKIE_NAME, rawToken, {
      expires: expiresAt,
      maxAge: SESSION_TTL_MS / 1000,
      secure: shouldUseSecureCookies(req),
    }),
    expiresAt: expiresAt.toISOString(),
  };
}

export function destroySession(req) {
  const token = parseCookies(req.headers.cookie || '')[SESSION_COOKIE_NAME];
  if (!token) return;
  deleteSessionRecord(hashSessionToken(token));
}

export function createAccount({ email, name, password }) {
  const emailError = validateEmail(email);
  if (emailError) throw new Error(emailError);

  const nameError = validateDisplayName(name);
  if (nameError) throw new Error(nameError);

  const passwordError = validatePassword(password);
  if (passwordError) throw new Error(passwordError);

  if (getUserRecordByEmail(email)) {
    const error = new Error('An account with that email already exists.');
    error.code = 'duplicate_email';
    throw error;
  }

  return createUserAccount({
    email,
    name,
    passwordHash: hashPassword(password),
  });
}

export function createEmailVerificationChallengeForUser(userId) {
  const userRecord = getUserRecordById(userId);
  if (!userRecord) {
    const error = new Error('Account not found.');
    error.code = 'account_not_found';
    throw error;
  }

  if (userRecord.email_verified_at) {
    return {
      email: userRecord.email,
      name: userRecord.name,
      token: null,
      expiresAt: null,
      alreadyVerified: true,
    };
  }

  const issued = issueAccountToken({
    userId,
    type: ACCOUNT_TOKEN_TYPES.emailVerification,
    emailSnapshot: userRecord.email,
    ttlMs: EMAIL_VERIFICATION_TTL_MS,
  });

  return {
    email: userRecord.email,
    name: userRecord.name,
    alreadyVerified: false,
    ...issued,
  };
}

export function createEmailVerificationChallenge({ email }) {
  const emailError = validateEmail(email);
  if (emailError) throw new Error(emailError);

  const userRecord = getUserRecordByEmail(email);
  if (!userRecord) {
    return null;
  }

  return createEmailVerificationChallengeForUser(userRecord.id);
}

export function authenticateCredentials({ email, password }) {
  const emailError = validateEmail(email);
  if (emailError) throw new Error(emailError);

  const record = getUserRecordByEmail(email);
  if (!record || !verifyPassword(password, record.password_hash)) {
    const error = new Error('Incorrect email or password.');
    error.code = 'invalid_credentials';
    throw error;
  }

  if (!record.email_verified_at) {
    const error = new Error('Verify your email before signing in.');
    error.code = 'email_unverified';
    throw error;
  }

  return getAuthStateByUserId(record.id);
}

function firebaseEmailForClaims(claims) {
  const normalizedEmail = normalizeEmail(claims.email);
  if (normalizedEmail) return normalizedEmail;
  return `${claims.uid}@phone.firebase.local`.toLowerCase();
}

function firebaseNameForClaims(claims, email) {
  const rawName = `${claims.name || claims.phoneNumber || email.split('@')[0] || 'Owlgorithm User'}`.trim();
  if (rawName.length >= 2) return rawName.slice(0, 60);
  return 'Owlgorithm User';
}

export function authenticateFirebaseIdentity(claims) {
  const uid = `${claims?.uid || ''}`.trim();
  if (!uid) {
    const error = new Error('Firebase identity is missing a user ID.');
    error.code = 'invalid_token';
    throw error;
  }

  const linked = getAuthIdentity({ provider: 'firebase', subject: uid });
  if (linked) {
    return getAuthStateByUserId(linked.user_id);
  }

  const email = firebaseEmailForClaims(claims);
  const name = firebaseNameForClaims(claims, email);
  const existing = getUserRecordByEmail(email);
  let userId = existing?.id || null;

  if (!userId) {
    const auth = createVerifiedUserAccount({
      email,
      name,
      passwordHash: hashPassword(crypto.randomBytes(32).toString('base64url')),
    });
    userId = auth.user.id;
  } else if (!existing.email_verified_at) {
    markUserEmailVerified(userId);
  }

  upsertAuthIdentity({
    provider: 'firebase',
    subject: uid,
    userId,
    emailSnapshot: email,
  });

  return getAuthStateByUserId(userId);
}

export function verifyEmailAddress({ token }) {
  const { record } = readActiveTokenOrThrow({
    token,
    type: ACCOUNT_TOKEN_TYPES.emailVerification,
  });

  const auth = markUserEmailVerified(record.user_id);
  revokeAccountTokensForUser({
    userId: record.user_id,
    type: ACCOUNT_TOKEN_TYPES.emailVerification,
  });
  return auth;
}

export function createPasswordResetChallenge({ email }) {
  const emailError = validateEmail(email);
  if (emailError) throw new Error(emailError);

  const userRecord = getUserRecordByEmail(email);
  if (!userRecord || !userRecord.email_verified_at) {
    return null;
  }

  const issued = issueAccountToken({
    userId: userRecord.id,
    type: ACCOUNT_TOKEN_TYPES.passwordReset,
    emailSnapshot: userRecord.email,
    ttlMs: PASSWORD_RESET_TTL_MS,
  });

  return {
    email: userRecord.email,
    name: userRecord.name,
    ...issued,
  };
}

export function resetPasswordWithToken({ token, newPassword }) {
  const passwordError = validatePassword(newPassword);
  if (passwordError) throw new Error(passwordError);

  const { record } = readActiveTokenOrThrow({
    token,
    type: ACCOUNT_TOKEN_TYPES.passwordReset,
  });

  updateUserPassword({
    userId: record.user_id,
    passwordHash: hashPassword(newPassword),
  });
  deleteSessionsByUserId(record.user_id);
  revokeAccountTokensForUser({
    userId: record.user_id,
    type: ACCOUNT_TOKEN_TYPES.passwordReset,
  });

  return getAuthStateByUserId(record.user_id);
}

export function updateAccountProfile({ userId, name, email }) {
  const emailError = validateEmail(email);
  if (emailError) throw new Error(emailError);

  const nameError = validateDisplayName(name);
  if (nameError) throw new Error(nameError);

  const nextEmail = normalizeEmail(email);
  const current = getUserRecordById(userId);
  const existing = getUserRecordByEmail(email);
  if (existing && existing.id !== userId) {
    const error = new Error('That email is already in use.');
    error.code = 'duplicate_email';
    throw error;
  }

  const auth = updateUserProfile({ userId, name, email: nextEmail });
  return {
    auth,
    emailChanged: normalizeEmail(current?.email) !== nextEmail,
  };
}

export function updateAccountPreferences({ userId, preferences }) {
  const current = getAuthStateByUserId(userId);
  const next = normalizePreferences({
    environment: preferences?.environment ?? current?.preferences.environment,
    sidebarCollapsed: preferences?.sidebarCollapsed ?? current?.preferences.sidebarCollapsed,
    creatorProfile: preferences?.creatorProfile ?? current?.preferences.creatorProfile,
  });
  return updateUserPreferences({ userId, ...next });
}

export function updateAccountPassword({ userId, currentPassword, newPassword }) {
  const passwordError = validatePassword(newPassword);
  if (passwordError) throw new Error(passwordError);

  const userRecord = getUserRecordById(userId);
  if (!userRecord || !verifyPassword(currentPassword, userRecord.password_hash)) {
    const error = new Error('Current password is incorrect.');
    error.code = 'invalid_password';
    throw error;
  }

  updateUserPassword({
    userId,
    passwordHash: hashPassword(newPassword),
  });
}

export function deleteAccount({ userId, password }) {
  const userRecord = getUserRecordById(userId);
  if (!userRecord || !verifyPassword(password, userRecord.password_hash)) {
    const error = new Error('Password confirmation failed.');
    error.code = 'invalid_password';
    throw error;
  }

  deleteUserAccount(userId);
}

export function consumeRateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  const current = rateLimitState.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitState.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  rateLimitState.set(key, current);
  return { allowed: true };
}
