import { memo } from 'react';
import { cn } from '../../lib/utils';

const STATUS_CONFIG = {
  // Green
  emerging: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400', pulse: true },
  running: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400', pulse: false },
  active: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400', pulse: false },
  scheduled: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400', pulse: false },
  verified: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400', pulse: false },

  // Blue
  rising: { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400', pulse: false },
  published: { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400', pulse: false },

  // Amber
  peak: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400', pulse: false },
  completed: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400', pulse: false },
  review: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400', pulse: false },

  // Red
  declining: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400', pulse: false },
  failed: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400', pulse: false },
  false: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400', pulse: false },
  misleading: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400', pulse: false },

  // Gray
  draft: { bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400', pulse: false },
  unverified: { bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400', pulse: false },
};

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-xs gap-1.5',
  md: 'px-3 py-1 text-sm gap-2',
};

const StatusBadge = memo(function StatusBadge({ status, size = 'sm' }) {
  const key = status?.toLowerCase() ?? '';
  const config = STATUS_CONFIG[key] || STATUS_CONFIG.draft;
  const label = status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        config.bg,
        config.text,
        SIZE_CLASSES[size]
      )}
    >
      <span className="relative flex h-2 w-2">
        {config.pulse && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
              config.dot
            )}
          />
        )}
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', config.dot)} />
      </span>
      {label}
    </span>
  );
});

export default StatusBadge;
