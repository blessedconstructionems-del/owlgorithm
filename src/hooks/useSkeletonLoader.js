import { useState, useEffect } from 'react';

/**
 * Returns a loading state that starts true and becomes false after a delay.
 * Resets whenever deps change.
 * @param {number} [delay=800] - Delay in milliseconds before loading completes.
 * @param {Array} [deps=[]] - Dependency array that triggers a reload when changed.
 * @returns {{ isLoading: boolean }}
 */
export function useSkeletonLoader(delay = 800, deps = []) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, ...deps]);

  return { isLoading };
}
