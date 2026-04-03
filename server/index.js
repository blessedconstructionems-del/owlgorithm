#!/usr/bin/env node
// Owlgorithm Data Server
// Serves the built frontend, normalized trend data, and scheduled scrapes

import http from 'http';
import fs from 'fs';
import path from 'path';
import { loadProjectEnv, projectRoot } from '../config/env.js';

const CACHE_DIR = path.join(projectRoot, 'scraper', 'cache');
const TRENDS_FILE = path.join(CACHE_DIR, 'trends.json');
const STATUS_FILE = path.join(CACHE_DIR, 'status.json');
const DIST_DIR = path.join(projectRoot, 'dist');

loadProjectEnv();

const PORT = parseInt(process.env.OWLGORITHM_PORT || '3847', 10);
const HOST = process.env.OWLGORITHM_HOST || '127.0.0.1';
const SCRAPE_INTERVAL = parseInt(process.env.SCRAPE_INTERVAL_MS || String(2 * 60 * 60 * 1000), 10);
const ENABLE_SCRAPER = (process.env.ENABLE_SCRAPER || 'true') !== 'false';
const HAS_SCRAPER_CREDENTIALS = Boolean(process.env.BRIGHT_DATA_API_KEY || process.env.BRIGHTDATA_SERP_API_KEY);
const SCRAPER_ENABLED = ENABLE_SCRAPER && HAS_SCRAPER_CREDENTIALS;

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

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.mp4': 'video/mp4',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webm': 'video/webm',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  };

  return types[ext] || 'application/octet-stream';
}

function serveFile(res, filePath, status = 200) {
  try {
    const body = fs.readFileSync(filePath);
    res.writeHead(status, { 'Content-Type': contentTypeFor(filePath) });
    res.end(body);
  } catch (err) {
    jsonResponse(res, { error: err.message }, 500);
  }
}

function serveFrontend(res, pathname) {
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
    serveFile(res, candidate);
    return;
  }

  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    serveFile(res, indexPath);
    return;
  }

  jsonResponse(res, { error: 'Frontend build not found' }, 404);
}

let scrapeInProgress = false;
let lastScrapeRequest = 0;

async function triggerScrape() {
  if (!SCRAPER_ENABLED) {
    return { status: 'disabled', error: 'Scraper is disabled or missing Bright Data credentials.' };
  }

  if (scrapeInProgress) return { status: 'already_running' };

  const now = Date.now();
  if (now - lastScrapeRequest < 60000) return { status: 'debounced', wait: 60 - Math.floor((now - lastScrapeRequest) / 1000) };

  scrapeInProgress = true;
  lastScrapeRequest = now;

  try {
    // Dynamic import to avoid loading scraper at startup
    const { runScrape } = await import('../scraper/index.js');
    const results = await runScrape('all');
    scrapeInProgress = false;
    return { status: 'complete', count: results.length };
  } catch (err) {
    scrapeInProgress = false;
    return { status: 'error', error: err.message };
  }
}

function jsonResponse(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  try {
    if (req.method === 'GET' && !pathname.startsWith('/api/')) {
      serveFrontend(res, pathname);
      return;
    }

    // GET /api/trends — all normalized trends
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

    // GET /api/trends/:id — single trend with full data
    if (pathname.startsWith('/api/trends/') && req.method === 'GET') {
      const id = pathname.split('/').pop();
      const trends = loadTrends();
      const trend = trends.find(t => t.id === id);
      if (!trend) return jsonResponse(res, { error: 'Trend not found' }, 404);
      return jsonResponse(res, trend);
    }

    // GET /api/opportunities — top opportunities sorted by score
    if (pathname === '/api/opportunities' && req.method === 'GET') {
      const trends = loadTrends();
      const opportunities = trends
        .filter(t => t.opportunityScore >= 50)
        .sort((a, b) => b.opportunityScore - a.opportunityScore)
        .slice(0, 20);
      return jsonResponse(res, { opportunities, count: opportunities.length });
    }

    // GET /api/scrape/status — scraper health
    if (pathname === '/api/scrape/status' && req.method === 'GET') {
      const status = loadStatus();
      return jsonResponse(res, { ...status, scrapeInProgress, enabled: SCRAPER_ENABLED });
    }

    // POST /api/scrape/run — trigger manual scrape
    if (pathname === '/api/scrape/run' && req.method === 'POST') {
      if (!isAuthorizedAdminRequest(req)) {
        return jsonResponse(res, { error: 'Forbidden' }, 403);
      }
      const result = await triggerScrape();
      return jsonResponse(res, result);
    }

    // 404
    jsonResponse(res, { error: 'Not found' }, 404);
  } catch (err) {
    console.error('[Server] Error:', err);
    jsonResponse(res, { error: err.message }, 500);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[Owlgorithm Server] Running on http://${HOST}:${PORT}`);
  console.log(`  GET  /api/trends`);
  console.log(`  GET  /api/trends/:id`);
  console.log(`  GET  /api/opportunities`);
  console.log(`  GET  /api/scrape/status`);
  if (SCRAPER_ENABLED) {
    console.log(`  POST /api/scrape/run`);
  } else {
    console.log('  Scraper disabled: missing credentials or ENABLE_SCRAPER=false');
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
