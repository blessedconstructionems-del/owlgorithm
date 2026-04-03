// Owlgorithm — Live Trend Data (fetched from data server)
// Loads cached data synchronously on import, then refreshes from the API via a small external store.

import { useSyncExternalStore } from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

// Synchronously load cached trends from localStorage on import
function loadInitialTrends() {
  try {
    const cached = localStorage.getItem('owlgorithm_trends');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`[Owlgorithm] Loaded ${parsed.length} cached trends`);
        return parsed;
      }
    }
  } catch {
    return [];
  }
  return [];
}

export const trends = loadInitialTrends();
const listeners = new Set();
let pollingStarted = false;

let state = {
  trends,
  status: trends.length > 0 ? 'stale' : 'idle',
  error: null,
  lastUpdated: null,
  serverAvailable: false,
};

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(patch) {
  state = { ...state, ...patch, trends };
  emit();
}

function getApiUrl(endpoint) {
  return `${API_BASE}${endpoint}`;
}

export function subscribeToTrends(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTrendsSnapshot() {
  return state;
}

export function useTrendsData() {
  return useSyncExternalStore(subscribeToTrends, getTrendsSnapshot, getTrendsSnapshot);
}

export async function refreshTrends() {
  setState({
    status: trends.length > 0 ? 'refreshing' : 'loading',
    error: null,
  });

  try {
    const res = await fetch(getApiUrl('/api/trends'));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (!Array.isArray(data.trends)) {
      throw new Error('Invalid trends payload');
    }

    trends.length = 0;
    trends.push(...data.trends);
    console.log(`[Owlgorithm] Refreshed with ${trends.length} live trends`);

    try {
      localStorage.setItem('owlgorithm_trends', JSON.stringify(data.trends));
      localStorage.setItem('owlgorithm_trends_ts', Date.now().toString());
    } catch {
      // Ignore local cache failures in private browsing or storage-restricted environments.
    }

    setState({
      status: 'ready',
      error: null,
      lastUpdated: data.lastUpdated || new Date().toISOString(),
      serverAvailable: true,
    });

    return true;
  } catch (err) {
    console.warn('[Owlgorithm] Data server unavailable:', err.message);
    setState({
      status: trends.length > 0 ? 'stale' : 'error',
      error: err.message,
      serverAvailable: false,
    });
  }

  return false;
}

// Trigger manual scrape
export async function triggerScrape() {
  try {
    const res = await fetch(getApiUrl('/api/scrape/run'), { method: 'POST' });
    const data = await res.json();
    if (data.status === 'complete') {
      await refreshTrends();
    }
    return data;
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

// Get scraper status
export async function getScrapeStatus() {
  try {
    const res = await fetch(getApiUrl('/api/scrape/status'));
    return await res.json();
  } catch {
    return { error: 'Server unavailable' };
  }
}

function startPolling() {
  if (pollingStarted || typeof window === 'undefined') return;
  pollingStarted = true;

  refreshTrends().catch(() => {});
  window.setInterval(() => {
    refreshTrends().catch(() => {});
  }, REFRESH_INTERVAL_MS);
}

startPolling();

export default trends;
