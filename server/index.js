#!/usr/bin/env node
// Owlgorithm Data Server
// Serves the frontend, account APIs, trend data, and scheduled scrapes.

import http from 'http';
import fs from 'fs';
import path from 'path';
import { getScraperCacheDir, loadProjectEnv, projectRoot } from '../config/env.js';
import {
  authenticateCredentials,
  clearSessionCookie,
  consumeRateLimit,
  createAccount,
  createEmailVerificationChallenge,
  createEmailVerificationChallengeForUser,
  createAuthenticatedSession,
  createPasswordResetChallenge,
  deleteAccount,
  destroySession,
  getClientIp,
  readSessionFromRequest,
  resetPasswordWithToken,
  updateAccountPassword,
  updateAccountPreferences,
  updateAccountProfile,
  verifyEmailAddress,
} from './auth.js';
import {
  emailDeliveryConfigured,
  getEmailReadiness,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from './email.js';

const CACHE_DIR = getScraperCacheDir();
const TRENDS_FILE = path.join(CACHE_DIR, 'trends.json');
const STATUS_FILE = path.join(CACHE_DIR, 'status.json');
const DIST_DIR = path.join(projectRoot, 'dist');

loadProjectEnv();

const PORT = parseInt(process.env.OWLGORITHM_PORT || '3847', 10);
const HOST = process.env.OWLGORITHM_HOST || '127.0.0.1';
const BASE_PATH = normalizeBasePath(process.env.OWLGORITHM_BASE_PATH || '/');
const SCRAPE_INTERVAL = parseInt(process.env.SCRAPE_INTERVAL_MS || String(2 * 60 * 60 * 1000), 10);
const ENABLE_SCRAPER = (process.env.ENABLE_SCRAPER || 'true') !== 'false';
const SCRAPER_ENABLED = ENABLE_SCRAPER;
const MAX_JSON_BODY_BYTES = 64 * 1024;

function normalizeBasePath(basePath) {
  const trimmed = `${basePath || '/'}`.trim();
  if (!trimmed || trimmed === '/') return '/';
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}/`;
}

function stripBasePath(pathname) {
  if (BASE_PATH === '/') return pathname;
  const bareBasePath = BASE_PATH.slice(0, -1);

  if (pathname === bareBasePath || pathname === BASE_PATH) {
    return '/';
  }

  if (pathname.startsWith(BASE_PATH)) {
    const stripped = pathname.slice(bareBasePath.length);
    return stripped || '/';
  }

  return pathname;
}

function safeReadJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    console.error(`[Server] Failed to read ${path.basename(filePath)}:`, err.message);
    return fallback;
  }
}

function loadTrends() {
  return safeReadJson(TRENDS_FILE, []);
}

function loadStatus() {
  return safeReadJson(STATUS_FILE, {});
}

function isLoopbackRequest(req) {
  const remote = req.socket.remoteAddress;
  return remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1';
}

function isAuthorizedAdminRequest(req) {
  const expectedToken = process.env.OWLGORITHM_ADMIN_TOKEN;
  if (expectedToken) {
    return req.headers['x-owlgorithm-admin-token'] === expectedToken;
  }

  return isLoopbackRequest(req);
}

function securityHeaders(contentType, extra = {}) {
  return {
    'Content-Type': contentType,
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    ...extra,
  };
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  };

  return types[ext] || 'application/octet-stream';
}

function cacheControlFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'no-store';
  if (['.js', '.css', '.svg', '.png', '.woff', '.woff2'].includes(ext)) {
    return 'public, max-age=31536000, immutable';
  }

  return 'public, max-age=3600';
}

function serveFile(res, filePath, status = 200, method = 'GET') {
  try {
    const body = fs.readFileSync(filePath);
    res.writeHead(status, securityHeaders(contentTypeFor(filePath), {
      'Cache-Control': cacheControlFor(filePath),
    }));

    if (method === 'HEAD') {
      res.end();
      return;
    }

    res.end(body);
  } catch (err) {
    jsonResponse(res, { error: err.message }, 500);
  }
}

function serveFrontend(res, pathname, method = 'GET') {
  if (!fs.existsSync(DIST_DIR)) {
    jsonResponse(
      res,
      { error: 'Frontend build not found. Run `npm run build` before starting the production server.' },
      503,
    );
    return;
  }

  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const candidate = path.resolve(DIST_DIR, relativePath);

  if (!candidate.startsWith(DIST_DIR)) {
    jsonResponse(res, { error: 'Invalid path' }, 400);
    return;
  }

  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    serveFile(res, candidate, 200, method);
    return;
  }

  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    serveFile(res, indexPath, 200, method);
    return;
  }

  jsonResponse(res, { error: 'Frontend build not found' }, 404);
}

function jsonResponse(res, data, status = 200, extraHeaders = {}) {
  res.writeHead(status, securityHeaders('application/json; charset=utf-8', {
    'Cache-Control': 'no-store',
    ...extraHeaders,
  }));
  res.end(JSON.stringify(data));
}

async function readJsonBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return {};

  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_JSON_BODY_BYTES) {
        reject(new Error('Request body too large.'));
        req.destroy();
        return;
      }

      body += chunk;
    });

    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON body.'));
      }
    });

    req.on('error', reject);
  });
}

function authPayload(auth) {
  return {
    authenticated: true,
    user: auth.user,
    preferences: auth.preferences,
  };
}

function resolveAuth(req) {
  const session = readSessionFromRequest(req);
  const clearHeaders = session.clearCookie ? { 'Set-Cookie': clearSessionCookie(req) } : {};
  return { ...session, clearHeaders };
}

function requireAuth(res, req, authState) {
  if (authState.auth) return authState.auth;
  jsonResponse(res, { error: 'Authentication required.' }, 401, authState.clearHeaders);
  return null;
}

let scrapeInProgress = false;
let lastScrapeRequest = 0;

async function triggerScrape() {
  if (!SCRAPER_ENABLED) {
    return { status: 'disabled', error: 'Scraper is disabled by configuration.' };
  }

  if (scrapeInProgress) return { status: 'already_running' };

  const now = Date.now();
  if (now - lastScrapeRequest < 60000) {
    return { status: 'debounced', wait: 60 - Math.floor((now - lastScrapeRequest) / 1000) };
  }

  scrapeInProgress = true;
  lastScrapeRequest = now;

  try {
    const { runScrape } = await import('../scraper/index.js');
    const results = await runScrape('all');
    scrapeInProgress = false;
    return { status: 'complete', count: results.length };
  } catch (err) {
    scrapeInProgress = false;
    return { status: 'error', error: err.message };
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  try {
    if ((req.method === 'GET' || req.method === 'HEAD') && !pathname.startsWith('/api/')) {
      serveFrontend(res, stripBasePath(pathname), req.method);
      return;
    }

    if (pathname === '/api/health' && req.method === 'GET') {
      return jsonResponse(res, { ok: true, timestamp: new Date().toISOString() });
    }

    const authState = resolveAuth(req);

    if (pathname === '/api/auth/session' && req.method === 'GET') {
      if (!authState.auth) {
        return jsonResponse(res, { authenticated: false }, 200, authState.clearHeaders);
      }

      return jsonResponse(res, authPayload(authState.auth), 200, authState.clearHeaders);
    }

    if (pathname === '/api/auth/signup' && req.method === 'POST') {
      const limit = consumeRateLimit(`signup:${getClientIp(req)}`, { limit: 5, windowMs: 60 * 60 * 1000 });
      if (!limit.allowed) {
        return jsonResponse(res, { error: 'Too many signup attempts. Try again later.' }, 429, {
          'Retry-After': String(limit.retryAfter),
        });
      }

      if (process.env.NODE_ENV === 'production' && !emailDeliveryConfigured()) {
        return jsonResponse(res, { error: 'Email delivery is not configured.', code: 'email_unavailable' }, 503);
      }

      const body = await readJsonBody(req);
      const auth = createAccount({
        name: body.name,
        email: body.email,
        password: body.password,
      });
      const verification = createEmailVerificationChallengeForUser(auth.user.id);
      const delivery = await sendVerificationEmail({
        req,
        email: verification.email,
        name: verification.name,
        token: verification.token,
      });

      return jsonResponse(res, {
        created: true,
        verificationRequired: true,
        email: verification.email,
        previewUrl: delivery.previewUrl || undefined,
      }, 201);
    }

    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const limit = consumeRateLimit(`login:${getClientIp(req)}`, { limit: 10, windowMs: 15 * 60 * 1000 });
      if (!limit.allowed) {
        return jsonResponse(res, { error: 'Too many login attempts. Try again later.' }, 429, {
          'Retry-After': String(limit.retryAfter),
        });
      }

      const body = await readJsonBody(req);
      const auth = authenticateCredentials({
        email: body.email,
        password: body.password,
      });
      const session = createAuthenticatedSession(req, auth);
      return jsonResponse(res, authPayload(auth), 200, { 'Set-Cookie': session.cookie });
    }

    if (pathname === '/api/auth/verification/resend' && req.method === 'POST') {
      const limit = consumeRateLimit(`verify-resend:${getClientIp(req)}`, { limit: 5, windowMs: 60 * 60 * 1000 });
      if (!limit.allowed) {
        return jsonResponse(res, { error: 'Too many verification requests. Try again later.' }, 429, {
          'Retry-After': String(limit.retryAfter),
        });
      }

      if (process.env.NODE_ENV === 'production' && !emailDeliveryConfigured()) {
        return jsonResponse(res, { error: 'Email delivery is not configured.', code: 'email_unavailable' }, 503);
      }

      const body = await readJsonBody(req);
      const verification = createEmailVerificationChallenge({ email: body.email });
      let previewUrl = null;

      if (verification?.token) {
        const delivery = await sendVerificationEmail({
          req,
          email: verification.email,
          name: verification.name,
          token: verification.token,
        });
        previewUrl = delivery.previewUrl;
      }

      return jsonResponse(res, {
        ok: true,
        message: 'If an account matches that email, a verification link has been sent.',
        previewUrl: previewUrl || undefined,
      });
    }

    if (pathname === '/api/auth/verify-email' && req.method === 'POST') {
      const limit = consumeRateLimit(`verify-email:${getClientIp(req)}`, { limit: 20, windowMs: 15 * 60 * 1000 });
      if (!limit.allowed) {
        return jsonResponse(res, { error: 'Too many verification attempts. Try again later.' }, 429, {
          'Retry-After': String(limit.retryAfter),
        });
      }

      const body = await readJsonBody(req);
      const auth = verifyEmailAddress({ token: body.token });
      const session = createAuthenticatedSession(req, auth);
      return jsonResponse(res, authPayload(auth), 200, { 'Set-Cookie': session.cookie });
    }

    if (pathname === '/api/auth/password-reset/request' && req.method === 'POST') {
      const limit = consumeRateLimit(`password-reset:${getClientIp(req)}`, { limit: 6, windowMs: 60 * 60 * 1000 });
      if (!limit.allowed) {
        return jsonResponse(res, { error: 'Too many reset requests. Try again later.' }, 429, {
          'Retry-After': String(limit.retryAfter),
        });
      }

      if (process.env.NODE_ENV === 'production' && !emailDeliveryConfigured()) {
        return jsonResponse(res, { error: 'Email delivery is not configured.', code: 'email_unavailable' }, 503);
      }

      const body = await readJsonBody(req);
      const reset = createPasswordResetChallenge({ email: body.email });
      let previewUrl = null;

      if (reset?.token) {
        const delivery = await sendPasswordResetEmail({
          req,
          email: reset.email,
          name: reset.name,
          token: reset.token,
        });
        previewUrl = delivery.previewUrl;
      }

      return jsonResponse(res, {
        ok: true,
        message: 'If an account matches that email, a reset link has been sent.',
        previewUrl: previewUrl || undefined,
      });
    }

    if (pathname === '/api/auth/password-reset/confirm' && req.method === 'POST') {
      const limit = consumeRateLimit(`password-reset-confirm:${getClientIp(req)}`, { limit: 12, windowMs: 60 * 60 * 1000 });
      if (!limit.allowed) {
        return jsonResponse(res, { error: 'Too many reset attempts. Try again later.' }, 429, {
          'Retry-After': String(limit.retryAfter),
        });
      }

      const body = await readJsonBody(req);
      const auth = resetPasswordWithToken({
        token: body.token,
        newPassword: body.password,
      });
      const session = createAuthenticatedSession(req, auth);
      return jsonResponse(res, authPayload(auth), 200, { 'Set-Cookie': session.cookie });
    }

    if (pathname === '/api/auth/logout' && req.method === 'POST') {
      destroySession(req);
      return jsonResponse(res, { authenticated: false }, 200, { 'Set-Cookie': clearSessionCookie(req) });
    }

    if (pathname === '/api/trends' && req.method === 'GET') {
      const status = loadStatus();
      const trends = loadTrends();
      return jsonResponse(res, {
        trends,
        count: trends.length,
        lastUpdated: status.lastFullRun || null,
        scraperEnabled: SCRAPER_ENABLED,
      });
    }

    if (pathname.startsWith('/api/trends/') && req.method === 'GET') {
      const id = pathname.split('/').pop();
      const trends = loadTrends();
      const trend = trends.find((item) => item.id === id);
      if (!trend) return jsonResponse(res, { error: 'Trend not found' }, 404);
      return jsonResponse(res, trend);
    }

    if (pathname === '/api/opportunities' && req.method === 'GET') {
      const trends = loadTrends();
      const opportunities = trends
        .filter((trend) => trend.opportunityScore >= 50)
        .sort((a, b) => b.opportunityScore - a.opportunityScore)
        .slice(0, 20);
      return jsonResponse(res, { opportunities, count: opportunities.length });
    }

    if (pathname === '/api/scrape/status' && req.method === 'GET') {
      const status = loadStatus();
      return jsonResponse(res, { ...status, scrapeInProgress, enabled: SCRAPER_ENABLED });
    }

    if (pathname === '/api/scrape/run' && req.method === 'POST') {
      if (!isAuthorizedAdminRequest(req)) {
        return jsonResponse(res, { error: 'Forbidden' }, 403);
      }

      const result = await triggerScrape();
      return jsonResponse(res, result);
    }

    const auth = requireAuth(res, req, authState);
    if (!auth) return;

    if (pathname === '/api/account/profile' && req.method === 'PATCH') {
      const body = await readJsonBody(req);
      const updated = updateAccountProfile({
        userId: auth.user.id,
        name: body.name,
        email: body.email,
      });

      let previewUrl = null;
      if (updated.emailChanged) {
        const verification = createEmailVerificationChallengeForUser(auth.user.id);
        if (verification.token) {
          const delivery = await sendVerificationEmail({
            req,
            email: verification.email,
            name: verification.name,
            token: verification.token,
          });
          previewUrl = delivery.previewUrl;
        }
      }

      return jsonResponse(res, {
        ...authPayload(updated.auth),
        verificationRequired: updated.emailChanged,
        previewUrl: previewUrl || undefined,
      });
    }

    if (pathname === '/api/account/preferences' && req.method === 'PATCH') {
      const body = await readJsonBody(req);
      const updated = updateAccountPreferences({
        userId: auth.user.id,
        preferences: body,
      });
      return jsonResponse(res, authPayload(updated));
    }

    if (pathname === '/api/account/password' && req.method === 'POST') {
      const limit = consumeRateLimit(`password:${auth.user.id}`, { limit: 8, windowMs: 15 * 60 * 1000 });
      if (!limit.allowed) {
        return jsonResponse(res, { error: 'Too many password attempts. Try again later.' }, 429, {
          'Retry-After': String(limit.retryAfter),
        });
      }

      const body = await readJsonBody(req);
      updateAccountPassword({
        userId: auth.user.id,
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      });
      return jsonResponse(res, { ok: true });
    }

    if (pathname === '/api/account' && req.method === 'DELETE') {
      const body = await readJsonBody(req);
      deleteAccount({
        userId: auth.user.id,
        password: body.password,
      });
      destroySession(req);
      return jsonResponse(res, { deleted: true }, 200, { 'Set-Cookie': clearSessionCookie(req) });
    }

    jsonResponse(res, { error: 'Not found' }, 404);
  } catch (err) {
    const status = err.code === 'duplicate_email'
      ? 409
      : err.code === 'email_unverified'
        ? 403
      : err.code === 'invalid_credentials' || err.code === 'invalid_password'
        ? 400
        : err.code === 'invalid_token'
          ? 400
          : err.code === 'email_unavailable'
            ? 503
          : err.message === 'Request body too large.'
            ? 413
            : err.message === 'Invalid JSON body.'
              ? 400
              : 500;

    if (status >= 500) {
      console.error('[Server] Error:', err);
    } else {
      console.warn(`[Server] ${status}: ${err.message}`);
    }

    jsonResponse(res, {
      error: err.message || 'Internal server error.',
      code: err.code || undefined,
    }, status);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[Owlgorithm Server] Running on http://${HOST}:${PORT}`);
  console.log(`  Base path: ${BASE_PATH}`);
  console.log('  GET  /api/health');
  console.log('  GET  /api/auth/session');
  console.log('  POST /api/auth/signup');
  console.log('  POST /api/auth/login');
  console.log('  POST /api/auth/verification/resend');
  console.log('  POST /api/auth/verify-email');
  console.log('  POST /api/auth/password-reset/request');
  console.log('  POST /api/auth/password-reset/confirm');
  console.log('  POST /api/auth/logout');
  console.log('  PATCH /api/account/profile');
  console.log('  PATCH /api/account/preferences');
  console.log('  POST /api/account/password');
  console.log('  DELETE /api/account');
  console.log('  GET  /api/trends');
  console.log('  GET  /api/trends/:id');
  console.log('  GET  /api/opportunities');
  console.log('  GET  /api/scrape/status');
  if (SCRAPER_ENABLED) {
    console.log('  POST /api/scrape/run');
  } else {
    console.log('  Scraper disabled: ENABLE_SCRAPER=false');
  }

  const emailReadiness = getEmailReadiness();
  if (!emailReadiness.deliveryConfigured) {
    const missing = [];
    if (!emailReadiness.publicUrlConfigured) missing.push('OWLGORITHM_PUBLIC_URL');
    if (!emailReadiness.emailFromConfigured) missing.push('OWLGORITHM_EMAIL_FROM');
    if (!emailReadiness.smtpConfigured) missing.push('OWLGORITHM_SMTP_HOST');
    console.warn(`[Owlgorithm Server] Email delivery is not fully configured. Missing: ${missing.join(', ')}`);
    if (process.env.NODE_ENV === 'production') {
      console.warn('[Owlgorithm Server] Signup verification and password recovery will return 503 until email delivery is configured.');
    }
  }

  if (!process.env.OWLGORITHM_ADMIN_TOKEN) {
    console.warn('[Owlgorithm Server] OWLGORITHM_ADMIN_TOKEN is not set. Manual scrape runs fall back to loopback-only access.');
  }
});

if (SCRAPER_ENABLED) {
  setTimeout(() => {
    console.log('[Scheduler] Running initial scrape...');
    triggerScrape().then((result) => console.log('[Scheduler] Initial scrape:', result.status));
  }, 10000);

  setInterval(() => {
    console.log('[Scheduler] Running scheduled scrape...');
    triggerScrape().then((result) => console.log('[Scheduler] Scheduled scrape:', result.status));
  }, SCRAPE_INTERVAL);
}
