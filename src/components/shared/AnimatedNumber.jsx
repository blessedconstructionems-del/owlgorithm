import { memo } from 'react';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';
import { cn } from '../../lib/utils';

const AnimatedNumber = memo(function AnimatedNumber({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
  className,
}) {
  const animated = useAnimatedNumber(value, duration);

  // Determine decimal places from the target value
  const decimalPlaces = Number.isInteger(value) ? 0 : 1;
  const display = animated.toFixed(decimalPlaces);

  return (
    <span className={cn('font-mono tabular-nums', className)}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
});

export default AnimatedNumber;
