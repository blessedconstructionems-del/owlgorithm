import { useMemo } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../shared/GlassCard';
import PlatformIcon from '../shared/PlatformIcon';
import { trends } from '@/data/trends';

/* ── Opportunity scoring engine ─────────────────────────── */

const SATURATION_WEIGHTS = {
  emerging: 1.0,
  rising: 0.8,
  peak: 0.35,
  declining: 0.1,
};

const COMPETITION_WEIGHTS = {
  low: 1.0,
  medium: 0.6,
  high: 0.25,
};

function computeOpportunityScore(trend) {
  const sat = SATURATION_WEIGHTS[trend.saturation?.toLowerCase()] ?? 0.5;
  const comp = COMPETITION_WEIGHTS[trend.competition?.toLowerCase()] ?? 0.5;
  const momentumNorm = (trend.momentum ?? 0) / 100;
  const velocityNorm = Math.min((trend.growthVelocity ?? 0) / 50, 1);

  // Weighted formula: momentum matters most, then competition gap, then saturation window, then velocity
  const raw =
    momentumNorm * 0.35 +
    comp * 0.25 +
    sat * 0.25 +
    velocityNorm * 0.15;

  return Math.round(Math.min(raw * 100, 100));
}

function estimateWindow(saturation) {
  const key = saturation?.toLowerCase();
  if (key === 'emerging') return '~3-4 weeks';
  if (key === 'rising') return '~1-2 weeks';
  if (key === 'peak') return '~3-5 days';
  return '< 3 days';
}

function buildInsight(trend) {
  const velocity = trend.growthVelocity ?? 0;
  const comp = trend.competition?.toLowerCase() ?? 'medium';
  const sat = trend.saturation?.toLowerCase() ?? 'rising';

  const parts = [];
  if (velocity >= 20) parts.push(`Growing ${velocity}%/mo`);
  else if (velocity >= 10) parts.push(`Steady ${velocity}%/mo growth`);
  else parts.push(`${velocity}%/mo velocity`);

  if (comp === 'low') parts.push('low competition');
  else if (comp === 'medium') parts.push('moderate competition');

  if (sat === 'emerging') parts.push('early mover advantage');
  else if (sat === 'rising') parts.push('still climbing');

  return parts.join(', ');
}

/* ── Score ring SVG ─────────────────────────────────────── */

function ScoreRing({ score, size = 52, strokeWidth = 4 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 75
      ? '#10b981'
      : score >= 50
        ? '#f59e0b'
        : '#ef4444';

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-white font-bold tabular-nums"
        style={{ fontSize: size * 0.28, transform: 'rotate(90deg)', transformOrigin: 'center' }}
      >
        {score}
      </text>
    </svg>
  );
}

/* ── Rank badge ─────────────────────────────────────────── */

function RankBadge({ rank, isTop }) {
  return (
    <div className="relative flex items-center justify-center shrink-0">
      {isTop && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.35) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.6, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <div
        className={`
          relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm tabular-nums
          ${isTop
            ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
            : 'bg-white/5 text-slate-400 ring-1 ring-white/10'
          }
        `}
      >
        {rank}
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────── */

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export default function OpportunityScanner() {
  const topOpportunities = useMemo(() => {
    const scored = trends.map((t) => ({
      ...t,
      _score: computeOpportunityScore(t),
    }));
    scored.sort((a, b) => b._score - a._score);
    return scored.slice(0, 5);
  }, []);

  return (
    <GlassCard accent="emerald" hover={false} className="overflow-visible">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        {/* Radar icon */}
        <div className="relative w-9 h-9 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full border border-emerald-500/30"
            animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="relative z-10"
          >
            <circle cx="12" cy="12" r="2" />
            <path d="M16.24 7.76a6 6 0 0 1 0 8.49" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-semibold text-white leading-tight">Opportunity Scanner</h3>
          <p className="text-xs text-slate-500 leading-tight">Trends your competitors are missing</p>
        </div>
      </div>

      {/* Opportunity list */}
      <motion.div
        className="flex flex-col gap-3 mt-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {topOpportunities.map((trend, i) => {
          const rank = i + 1;
          const isTop = rank === 1;
          const window = estimateWindow(trend.saturation);
          const insight = buildInsight(trend);

          return (
            <motion.div
              key={trend.id ?? trend.name}
              variants={item}
              className={`
                relative flex items-start gap-3 rounded-xl p-3 sm:p-4
                ${isTop
                  ? 'bg-emerald-500/[0.06] ring-1 ring-emerald-500/20'
                  : 'bg-white/[0.02] ring-1 ring-white/[0.04] hover:ring-white/10'
                }
                transition-colors duration-300
              `}
            >
              {/* Pulse background for #1 */}
              {isTop && (
                <motion.div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(16,185,129,0.08) 0%, transparent 70%)' }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              {/* Rank */}
              <RankBadge rank={rank} isTop={isTop} />

              {/* Score ring */}
              <ScoreRing score={trend._score} />

              {/* Content */}
              <div className="flex-1 min-w-0 relative z-10">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-semibold text-sm truncate ${isTop ? 'text-emerald-300' : 'text-white'}`}>
                    {trend.name}
                  </span>
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-full tabular-nums whitespace-nowrap"
                    style={{
                      background: 'rgba(16,185,129,0.12)',
                      color: '#6ee7b7',
                      border: '1px solid rgba(16,185,129,0.2)',
                    }}
                  >
                    {window}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">{insight}</p>

                {/* Platform icons */}
                <div className="flex items-center gap-1.5 mt-2">
                  {(trend.platforms ?? []).map((p) => (
                    <PlatformIcon key={p} platform={p.replace('/X', '')} size={18} />
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Footer stat */}
      <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between">
        <span className="text-[11px] text-slate-500">
          Scanning {trends.length} trends
        </span>
        <span className="text-[11px] text-emerald-500/80 font-medium">
          {topOpportunities.filter((t) => t._score >= 70).length} high-value opportunities
        </span>
      </div>
    </GlassCard>
  );
}
