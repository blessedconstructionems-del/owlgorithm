#!/usr/bin/env node
// Owlgorithm Scrape Orchestrator
// Runs all platform scrapers, normalizes data, saves to cache

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadProjectEnv } from '../config/env.js';
import { scrapeGoogleTrends } from './platforms/google-trends.js';
import { scrapeYouTubeTrending } from './platforms/youtube.js';
import { scrapeRedditTrending } from './platforms/reddit.js';
import { scrapeTwitterTrending } from './platforms/twitter.js';
import { normalizeTrends } from './normalizer.js';
import { humanDelay } from './anti-detection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, 'cache');
const CACHE_FILE = path.join(CACHE_DIR, 'trends.json');
const STATUS_FILE = path.join(CACHE_DIR, 'status.json');

loadProjectEnv();

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Load cached trends for history continuity
function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    }
  } catch (err) {
    console.warn('[Cache] Failed to load:', err.message);
  }
  return [];
}

function saveCache(trends) {
  try {
    writeJsonAtomic(CACHE_FILE, trends);
    console.log(`[Cache] Saved ${trends.length} trends`);
  } catch (err) {
    console.error('[Cache] Failed to save:', err.message);
  }
}

function writeJsonAtomic(filePath, payload) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2));
  fs.renameSync(tempPath, filePath);
}

function updateStatus(platform, status, count = 0, error = null) {
  let statusData = {};
  try {
    if (fs.existsSync(STATUS_FILE)) {
      statusData = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'));
    }
  } catch {
    statusData = {};
  }

  statusData[platform] = {
    status,
    count,
    error: error?.message || null,
    lastRun: new Date().toISOString(),
  };

  writeJsonAtomic(STATUS_FILE, statusData);
}

function markFullRunComplete() {
  let statusData = {};
  try {
    if (fs.existsSync(STATUS_FILE)) {
      statusData = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'));
    }
  } catch {
    statusData = {};
  }

  statusData.lastFullRun = new Date().toISOString();
  writeJsonAtomic(STATUS_FILE, statusData);
}

// Main scrape function
export async function runScrape(platforms = 'all') {
  console.log('\n=== OWLGORITHM SCRAPE ===');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Platforms: ${platforms}\n`);

  const existingCache = loadCache();
  const allRawTrends = [];

  const scrapers = [
    { name: 'Google', fn: scrapeGoogleTrends, enabled: platforms === 'all' || platforms.includes('google') },
    { name: 'YouTube', fn: scrapeYouTubeTrending, enabled: platforms === 'all' || platforms.includes('youtube') },
    { name: 'Reddit', fn: scrapeRedditTrending, enabled: platforms === 'all' || platforms.includes('reddit') },
    { name: 'Twitter/X', fn: scrapeTwitterTrending, enabled: platforms === 'all' || platforms.includes('twitter') },
  ];

  for (const scraper of scrapers) {
    if (!scraper.enabled) continue;

    try {
      console.log(`\n--- ${scraper.name} ---`);
      const results = await scraper.fn();
      allRawTrends.push(...results);
      const status = results.length > 0 ? 'ok' : 'empty';
      updateStatus(scraper.name.toLowerCase(), status, results.length);
      console.log(`[${scraper.name}] ${status === 'ok' ? 'Success' : 'No results'}: ${results.length} items`);
    } catch (err) {
      console.error(`[${scraper.name}] FAILED:`, err.message);
      updateStatus(scraper.name.toLowerCase(), 'error', 0, err);
      // Continue with other platforms — never let one failure kill the cycle
    }

    // Stagger between platforms
    if (scrapers.indexOf(scraper) < scrapers.length - 1) {
      console.log('[Orchestrator] Waiting between platforms...');
      await humanDelay('between_platforms');
    }
  }

  console.log(`\n--- Normalizing ${allRawTrends.length} raw trends ---`);

  // Normalize all raw data into unified schema
  const normalized = normalizeTrends(allRawTrends, existingCache);

  // Save to cache
  saveCache(normalized);
  markFullRunComplete();

  console.log(`\n=== SCRAPE COMPLETE ===`);
  console.log(`Total normalized trends: ${normalized.length}`);
  console.log(`Cache saved to: ${CACHE_FILE}\n`);

  // Print top 5
  console.log('Top 5 trends:');
  normalized.slice(0, 5).forEach((t, i) => {
    console.log(`  ${i + 1}. "${t.name}" — momentum: ${t.momentum}, platforms: [${t.platforms.join(', ')}], saturation: ${t.saturation}`);
  });

  return normalized;
}

// Run directly
if (process.argv[1] && process.argv[1].includes('scraper/index.js')) {
  runScrape('all').catch(err => {
    console.error('Scrape failed:', err);
    process.exit(1);
  });
}
