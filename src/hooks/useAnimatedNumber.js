import { useState, useEffect, useRef } from 'react';

/**
 * Animates a number from 0 to target value using requestAnimationFrame.
 * @param {number} target - The target value to animate toward.
 * @param {number} [duration=1000] - Animation duration in milliseconds.
 * @returns {number} The current animated value.
 */
export function useAnimatedNumber(target, duration = 1000) {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);
  const startValueRef = useRef(0);

  useEffect(() => {
    startValueRef.current = current;
    startTimeRef.current = null;

    // Handle edge case: zero duration means instant
    if (duration <= 0) {
      setCurrent(target);
      return;
    }

    function animate(timestamp) {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);

      const value = startValueRef.current + (target - startValueRef.current) * eased;
      setCurrent(value);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return current;
}
