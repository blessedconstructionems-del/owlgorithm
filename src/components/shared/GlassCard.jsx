import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const GlassCard = memo(function GlassCard({
  children,
  className,
  hover = true,
  gradient = false,
  onClick,
  glow,
  accent,
}) {
  const Component = hover ? motion.div : 'div';

  const hoverProps = hover
    ? {
        whileHover: {
          scale: 1.015,
          transition: { type: 'spring', stiffness: 400, damping: 25 },
        },
      }
    : {};

  return (
    <Component
      className={cn(
        'glass-card rounded-2xl p-4 sm:p-6 relative',
        hover && 'glass-card-hover cursor-pointer',
        gradient && 'gradient-border',
        glow === 'blue' && 'glow-blue',
        glow === 'purple' && 'glow-purple',
        glow === 'emerald' && 'glow-emerald',
        accent === 'blue' && 'glass-card-blue',
        accent === 'purple' && 'glass-card-purple',
        accent === 'emerald' && 'glass-card-emerald',
        accent === 'amber' && 'glass-card-amber',
        accent === 'rose' && 'glass-card-rose',
        accent === 'cyan' && 'glass-card-cyan',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e);
              }
            }
          : undefined
      }
      {...hoverProps}
    >
      {children}
    </Component>
  );
});

export default GlassCard;
