import { useEffect, useSyncExternalStore } from 'react';
import { ApiError, apiRequest } from '@/lib/api';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const CACHE_KEY = 'owlgorithm:trends';
const CACHE_META_KEY = 'owlgorithm:trends-meta';

function loadCachedState() {
  if (typeof window === 'undefined') {
    return { trends: [], lastUpdated: null };
  }

  try {
    const rawTrends = localStorage.getItem(CACHE_KEY);
    const rawMeta = localStorage.getItem(CACHE_META_KEY);
    const trends = rawTrends ? JSON.parse(rawTrends) : [];
    const meta = rawMeta ? JSON.parse(rawMeta) : {};

    return {
      trends: Array.isArray(trends) ? trends : [],
      lastUpdated: meta.lastUpdated || null,
    };
  } catch {
    return { trends: [], lastUpdated: null };
  }
}

const cached = loadCachedState();
const listeners = new Set();

export let trends = cached.trends;

let pollTimer = null;
let consumerCount = 0;
let state = {
  trends: cached.trends,
  status: cached.trends.length ? 'stale' : 'idle',
  error: null,
  lastUpdated: cached.lastUpdated,
  serverAvailable: false,
};

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(patch) {
  state = { ...state, ...patch };
  trends = state.trends;
  emit();
}

function persistState(trends, lastUpdated) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(trends));
    localStorage.setItem(CACHE_META_KEY, JSON.stringify({ lastUpdated }));
  } catch {
    // Ignore storage failures.
  }
}

function clearPersistedState() {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_META_KEY);
  } catch {
    // Ignore storage failures.
  }
}

function startPolling() {
  if (pollTimer || typeof window === 'undefined') return;

  refreshTrends();
  pollTimer = window.setInterval(refreshTrends, REFRESH_INTERVAL_MS);
}

function stopPolling() {
  if (!pollTimer || typeof window === 'undefined') return;
  window.clearInterval(pollTimer);
  pollTimer = null;
}

export function subscribeToTrends(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTrendsSnapshot() {
  return state;
}

export function useTrendsData(enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;

    consumerCount += 1;
    startPolling();

    return () => {
      consumerCount -= 1;
      if (consumerCount <= 0) {
        consumerCount = 0;
        stopPolling();
      }
    };
  }, [enabled]);

  return useSyncExternalStore(subscribeToTrends, getTrendsSnapshot, getTrendsSnapshot);
}

export async function refreshTrends() {
  setState({
    status: state.trends.length ? 'refreshing' : 'loading',
    error: null,
  });

  try {
    const data = await apiRequest('/api/trends');
    if (!Array.isArray(data.trends)) {
      throw new Error('Invalid trends payload');
    }

    persistState(data.trends, data.lastUpdated || null);

    setState({
      trends: data.trends,
      status: 'ready',
      error: null,
      lastUpdated: data.lastUpdated || null,
      serverAvailable: true,
    });

    return data;
  } catch (error) {
    const authFailure = error instanceof ApiError && error.status === 401;

    setState({
      trends: authFailure ? [] : state.trends,
      status: authFailure ? 'idle' : state.trends.length ? 'stale' : 'error',
      error: authFailure ? null : error.message,
      serverAvailable: false,
      lastUpdated: authFailure ? null : state.lastUpdated,
    });

    if (authFailure) {
      stopPolling();
      clearPersistedState();
    }

    return null;
  }
}

export async function triggerScrape(headers = {}) {
  try {
    const data = await apiRequest('/api/scrape/run', {
      method: 'POST',
      headers,
    });

    if (data.status === 'complete') {
      await refreshTrends();
    }

    return data;
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
    };
  }
}

export function resetTrendsStore() {
  stopPolling();
  clearPersistedState();
  state = {
    trends: [],
    status: 'idle',
    error: null,
    lastUpdated: null,
    serverAvailable: false,
  };
  trends = state.trends;
  emit();
}
