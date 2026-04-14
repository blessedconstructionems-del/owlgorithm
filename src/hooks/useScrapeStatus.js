import { useCallback, useEffect, useState } from 'react';
import { ApiError, apiRequest } from '@/lib/api';
import { STATIC_DEMO, staticAssetUrl } from '@/lib/runtime';

const POLL_INTERVAL_MS = 5 * 60 * 1000;

const INITIAL_STATE = {
  data: null,
  loading: true,
  error: null,
};

export function useScrapeStatus(enabled = true) {
  const [state, setState] = useState(INITIAL_STATE);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setState(INITIAL_STATE);
      return null;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await apiRequest('/api/scrape/status');
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      let requestError = error;

      if (STATIC_DEMO) {
        try {
          const response = await fetch(staticAssetUrl('demo/scrape-status.json'));
          if (!response.ok) {
            throw new Error('Static demo status is unavailable.');
          }

          const data = await response.json();
          setState({ data, loading: false, error: null });
          return data;
        } catch (demoError) {
          requestError = demoError;
        }
      }

      const nextError = requestError instanceof ApiError && requestError.status === 401 ? null : requestError.message;
      setState((prev) => ({ ...prev, loading: false, error: nextError, data: nextError ? prev.data : null }));
      return null;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    const kickoff = window.setTimeout(() => {
      refresh();
    }, 0);
    const timer = window.setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      window.clearTimeout(kickoff);
      window.clearInterval(timer);
    };
  }, [enabled, refresh]);

  return {
    ...state,
    refresh,
  };
}
