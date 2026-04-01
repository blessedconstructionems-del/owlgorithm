import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trends } from '@/data/trends';

const COLORS = {
  Emerging: '#06b6d4',
  Rising: '#3b82f6',
  Peak: '#f59e0b',
  Declining: '#ef4444',
};

const RING_LABELS = ['Hot', 'Rising', 'Emerging'];

// Map momentum to a ring radius fraction (0 = center, 1 = outer edge)
// High momentum = inner ring (Hot), low = outer ring (Emerging)
function momentumToRadius(momentum, innerR, outerR) {
  const t = 1 - momentum / 100; // invert: high momentum = small radius
  return innerR + t * (outerR - innerR);
}

// Deterministic pseudo-random angle from trend name so dots don't overlap badly
function hashAngle(name, index) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Golden angle distribution for even spacing
  return ((index * 137.508 + (hash % 360)) % 360) * (Math.PI / 180);
}

function dotSize(growthVelocity) {
  const abs = Math.abs(growthVelocity);
  const clamped = Math.max(4, Math.min(14, 4 + abs * 0.2));
  return clamped;
}

export default function TrendPulseRadar() {
  const [hoveredTrend, setHoveredTrend] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);

  // Responsive: viewBox is fixed, we scale via CSS
  const viewSize = 500;
  const cx = viewSize / 2;
  const cy = viewSize / 2;
  const maxR = 210;
  const rings = [0.38, 0.65, 0.92]; // fraction of maxR for the 3 rings
  const innerR = maxR * 0.2;
  const outerR = maxR * 0.95;

  const trendDots = useMemo(() => {
    return trends.map((trend, i) => {
      const angle = hashAngle(trend.name, i);
      const r = momentumToRadius(trend.momentum, innerR, outerR);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      const size = dotSize(trend.growthVelocity);
      const color = COLORS[trend.saturation] || '#3b82f6';
      return { ...trend, x, y, size, color, angle, r };
    });
  }, [cx, cy, innerR, outerR]);

  function handleDotHover(trend, e) {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const scaleX = rect.width / viewSize;
    const scaleY = rect.height / viewSize;
    setTooltipPos({
      x: trend.x * scaleX + rect.left,
      y: trend.y * scaleY + rect.top,
    });
    setHoveredTrend(trend);
  }

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6 relative w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
            Trend Pulse Radar
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Real-time momentum across {trends.length} tracked trends
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-emerald-400">Live</span>
        </div>
      </div>

      {/* Radar SVG */}
      <div className="relative w-full" style={{ maxWidth: 560, margin: '0 auto' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewSize} ${viewSize}`}
          className="w-full h-auto"
          style={{ filter: 'drop-shadow(0 0 40px rgba(59,130,246,0.08))' }}
        >
          <defs>
            {/* Sweep gradient */}
            <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(59,130,246,0)" />
              <stop offset="60%" stopColor="rgba(59,130,246,0.04)" />
              <stop offset="100%" stopColor="rgba(59,130,246,0.25)" />
            </linearGradient>

            {/* Radial background glow */}
            <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(59,130,246,0.06)" />
              <stop offset="50%" stopColor="rgba(59,130,246,0.02)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>

            {/* Dot glow filters per color */}
            {Object.entries(COLORS).map(([key, color]) => (
              <filter key={key} id={`glow-${key}`} x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feFlood floodColor={color} floodOpacity="0.6" result="color" />
                <feComposite in="color" in2="blur" operator="in" result="colorBlur" />
                <feMerge>
                  <feMergeNode in="colorBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ))}
          </defs>

          {/* Background glow */}
          <circle cx={cx} cy={cy} r={maxR} fill="url(#bgGlow)" />

          {/* Grid lines (radial) - 12 spokes */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            const x2 = cx + Math.cos(angle) * maxR;
            const y2 = cy + Math.sin(angle) * maxR;
            return (
              <line
                key={`spoke-${i}`}
                x1={cx}
                y1={cy}
                x2={x2}
                y2={y2}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="0.5"
              />
            );
          })}

          {/* Concentric rings */}
          {rings.map((frac, i) => {
            const r = maxR * frac;
            return (
              <g key={`ring-${i}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                  strokeDasharray={i === 0 ? 'none' : '4 4'}
                />
                {/* Ring labels */}
                <text
                  x={cx + r - 4}
                  y={cy - 6}
                  fill="rgba(255,255,255,0.2)"
                  fontSize="9"
                  fontFamily="Inter, system-ui, sans-serif"
                  textAnchor="end"
                  fontWeight="500"
                >
                  {RING_LABELS[i]}
                </text>
              </g>
            );
          })}

          {/* Outer boundary ring */}
          <circle
            cx={cx}
            cy={cy}
            r={maxR}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1.5"
          />

          {/* Center dot */}
          <circle cx={cx} cy={cy} r="3" fill="rgba(59,130,246,0.4)" />
          <circle cx={cx} cy={cy} r="1.5" fill="rgba(59,130,246,0.8)" />

          {/* Animated sweep line — uses Framer Motion foreignObject workaround via CSS */}
          <g style={{ transformOrigin: `${cx}px ${cy}px` }}>
            <AnimatedSweep cx={cx} cy={cy} maxR={maxR} />
          </g>

          {/* Trend dots */}
          {trendDots.map((dot, i) => (
            <motion.g
              key={dot.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.4 + i * 0.06,
                duration: 0.5,
                type: 'spring',
                stiffness: 200,
                damping: 15,
              }}
              style={{ transformOrigin: `${dot.x}px ${dot.y}px` }}
              onMouseEnter={(e) => handleDotHover(dot, e)}
              onMouseLeave={() => setHoveredTrend(null)}
              className="cursor-pointer"
            >
              {/* Pulse ring */}
              <motion.circle
                cx={dot.x}
                cy={dot.y}
                r={dot.size + 4}
                fill="none"
                stroke={dot.color}
                strokeWidth="1"
                initial={{ opacity: 0.6, r: dot.size }}
                animate={{
                  opacity: [0.5, 0, 0.5],
                  r: [dot.size, dot.size + 10, dot.size],
                }}
                transition={{
                  duration: 2 + (i % 3) * 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: (i % 5) * 0.4,
                }}
              />
              {/* Outer glow circle */}
              <circle
                cx={dot.x}
                cy={dot.y}
                r={dot.size + 2}
                fill={dot.color}
                opacity="0.1"
              />
              {/* Main dot */}
              <circle
                cx={dot.x}
                cy={dot.y}
                r={dot.size}
                fill={dot.color}
                opacity="0.85"
                filter={`url(#glow-${dot.saturation})`}
              />
              {/* Inner bright core */}
              <circle
                cx={dot.x}
                cy={dot.y}
                r={dot.size * 0.45}
                fill="white"
                opacity="0.4"
              />
            </motion.g>
          ))}
        </svg>

        {/* Tooltip (rendered outside SVG for rich HTML) */}
        <AnimatePresence>
          {hoveredTrend && (
            <Tooltip trend={hoveredTrend} pos={tooltipPos} svgRef={svgRef} viewSize={viewSize} />
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-5 pt-4 border-t border-white/5">
        {Object.entries(COLORS).map(([label, color]) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className="block w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: color,
                boxShadow: `0 0 8px ${color}60`,
              }}
            />
            <span className="text-xs text-slate-400 font-medium">{label}</span>
          </div>
        ))}
        <div className="hidden sm:flex items-center gap-2 ml-3 pl-3 border-l border-white/5">
          <span className="text-[10px] text-slate-500">Dot size = growth velocity</span>
          <span className="text-[10px] text-slate-500 mx-1">&middot;</span>
          <span className="text-[10px] text-slate-500">Inner ring = higher momentum</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Animated Sweep ─────────────────────────── */
function AnimatedSweep({ cx, cy, maxR }) {
  // 30-degree cone sweep
  const coneAngle = 30 * (Math.PI / 180);

  return (
    <motion.g
      animate={{ rotate: 360 }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: 'linear',
      }}
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    >
      {/* Sweep cone (gradient trail) */}
      <path
        d={describeArc(cx, cy, maxR, -coneAngle, 0)}
        fill="url(#sweepCone)"
      />
      {/* We draw the cone with layered opacity for a smooth fade */}
      {[0.02, 0.04, 0.06, 0.09, 0.13, 0.18].map((opacity, i) => {
        const startAngle = -coneAngle + (i / 6) * coneAngle;
        const endAngle = -coneAngle + ((i + 1) / 6) * coneAngle;
        return (
          <path
            key={i}
            d={describeArc(cx, cy, maxR, startAngle, endAngle)}
            fill={`rgba(59,130,246,${opacity})`}
          />
        );
      })}
      {/* Leading edge line */}
      <line
        x1={cx}
        y1={cy}
        x2={cx + maxR}
        y2={cy}
        stroke="rgba(59,130,246,0.5)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Bright tip */}
      <circle
        cx={cx + maxR}
        cy={cy}
        r="2.5"
        fill="rgba(59,130,246,0.8)"
      />
    </motion.g>
  );
}

/* Describe an arc path for the sweep cone */
function describeArc(cx, cy, r, startAngle, endAngle) {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

/* ─── Tooltip ────────────────────────────────── */
function Tooltip({ trend, pos, svgRef, viewSize }) {
  const svgEl = svgRef.current;
  if (!svgEl) return null;

  const rect = svgEl.getBoundingClientRect();
  const scaleX = rect.width / viewSize;
  const scaleY = rect.height / viewSize;

  // Position relative to the radar container (parent of SVG)
  const left = trend.x * scaleX;
  const top = trend.y * scaleY;

  // Determine if tooltip should go left or right of dot
  const goLeft = trend.x > viewSize / 2;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 6 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="absolute z-50 pointer-events-none"
      style={{
        left: goLeft ? left - 8 : left + 8,
        top: top - 8,
        transform: goLeft ? 'translate(-100%, -100%)' : 'translate(0, -100%)',
      }}
    >
      <div
        className="rounded-xl px-4 py-3 border border-white/10 backdrop-blur-xl"
        style={{
          background: 'linear-gradient(145deg, rgba(10,13,20,0.95), rgba(15,18,25,0.92))',
          boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${trend.color}15`,
          minWidth: 200,
        }}
      >
        {/* Name + badge */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              backgroundColor: trend.color,
              boxShadow: `0 0 6px ${trend.color}80`,
            }}
          />
          <span className="text-sm font-semibold text-white truncate">{trend.name}</span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <TooltipStat label="Momentum" value={`${trend.momentum}%`} color={trend.color} />
          <TooltipStat label="Status" value={trend.saturation} color={trend.color} />
          <TooltipStat
            label="Growth"
            value={`${trend.growthVelocity > 0 ? '+' : ''}${trend.growthVelocity}%`}
            color={trend.growthVelocity >= 0 ? '#10b981' : '#ef4444'}
          />
          <TooltipStat
            label="Platforms"
            value={trend.platforms.length}
            color="rgba(255,255,255,0.6)"
          />
        </div>

        {/* Platform tags */}
        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-white/5">
          {trend.platforms.slice(0, 3).map((p) => (
            <span
              key={p}
              className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-medium"
            >
              {p}
            </span>
          ))}
          {trend.platforms.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 text-slate-500">
              +{trend.platforms.length - 3}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function TooltipStat({ label, value, color }) {
  return (
    <div>
      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
      <div className="text-xs font-semibold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
