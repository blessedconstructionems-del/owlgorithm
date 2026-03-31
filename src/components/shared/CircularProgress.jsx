import { memo } from 'react';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';
import { cn } from '../../lib/utils';

const CircularProgress = memo(function CircularProgress({
  value,
  max = 100,
  size = 64,
  strokeWidth = 5,
  className,
  color,
  showValue = true,
  fontSize,
}) {
  const animated = useAnimatedNumber(value, 1000);
  const percentage = Math.min((animated / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  // Color based on percentage if no explicit color
  const strokeColor =
    color ||
    (percentage >= 75
      ? '#10B981'
      : percentage >= 50
        ? '#3B82F6'
        : percentage >= 25
          ? '#F59E0B'
          : '#EF4444');

  const textSize = fontSize || Math.max(10, Math.round(size * 0.24));

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
      </svg>
      {showValue && (
        <span
          className="absolute font-bold text-white"
          style={{ fontSize: textSize }}
        >
          {Math.round(animated)}
        </span>
      )}
    </div>
  );
});

export default CircularProgress;
