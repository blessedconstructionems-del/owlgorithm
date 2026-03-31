import { memo } from 'react';
import { cn } from '../../lib/utils';

const SkeletonCard = memo(function SkeletonCard({ height = 200, className }) {
  return (
    <div
      className={cn('skeleton rounded-2xl w-full', className)}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
      aria-hidden="true"
    >
      <div className="p-6 space-y-4 h-full">
        <div className="skeleton h-4 w-3/4 rounded-lg" />
        <div className="skeleton h-3 w-1/2 rounded-lg" />
        <div className="skeleton h-3 w-5/6 rounded-lg" />
        <div className="flex-1" />
        <div className="skeleton h-8 w-1/3 rounded-lg" />
      </div>
    </div>
  );
});

export default SkeletonCard;
