import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../shared/GlassCard';
import PlatformIcon from '../shared/PlatformIcon';

// ── Platform metadata ────────────────────────────────────────────────
const PLATFORM_COLORS = {
  tiktok:    '#00f2ea',
  instagram: '#E4405F',
  youtube:   '#FF0000',
  twitter:   '#1DA1F2',
  'twitter/x': '#1DA1F2',
  reddit:    '#FF4500',
  linkedin:  '#0A66C2',
  facebook:  '#1877F2',
  pinterest: '#BD081C',
};

const PLATFORM_NAMES = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  twitter: 'Twitter/X',
  'twitter/x': 'Twitter/X',
  reddit: 'Reddit',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  pinterest: 'Pinterest',
};

// ── Origin-story event templates ─────────────────────────────────────
// Keyed by platform — each returns an array of stage descriptors.
const ORIGIN_TEMPLATES = {
  tiktok: [
    { stage: 'origin',    label: 'First spotted on TikTok', icon: 'tiktok' },
    { stage: 'creator',   label: 'Creator @trendspotter posted a viral take' },
    { stage: 'viral',     label: 'Reached 1M views on TikTok', icon: 'tiktok' },
  ],
  instagram: [
    { stage: 'origin',    label: 'Emerged in Instagram Reels', icon: 'instagram' },
    { stage: 'creator',   label: 'Influencer @visualcraft amplified it' },
    { stage: 'viral',     label: 'Hit Explore page on Instagram', icon: 'instagram' },
  ],
  youtube: [
    { stage: 'origin',    label: 'Originated in a YouTube deep-dive', icon: 'youtube' },
    { stage: 'creator',   label: 'Top creator featured the concept' },
    { stage: 'viral',     label: 'Crossed 500K views on YouTube', icon: 'youtube' },
  ],
  twitter: [
    { stage: 'origin',    label: 'Sparked by a viral Twitter/X thread', icon: 'twitter' },
    { stage: 'creator',   label: 'Tech influencer quote-tweeted it' },
    { stage: 'viral',     label: 'Trended on Twitter/X for 12 hrs', icon: 'twitter' },
  ],
  'twitter/x': [
    { stage: 'origin',    label: 'Sparked by a viral Twitter/X thread', icon: 'twitter' },
    { stage: 'creator',   label: 'Tech influencer quote-tweeted it' },
    { stage: 'viral',     label: 'Trended on Twitter/X for 12 hrs', icon: 'twitter' },
  ],
  reddit: [
    { stage: 'origin',    label: 'First discussed on Reddit', icon: 'reddit' },
    { stage: 'creator',   label: 'Hit front page of r/all' },
    { stage: 'viral',     label: 'Spawned 50+ subreddit threads', icon: 'reddit' },
  ],
  linkedin: [
    { stage: 'origin',    label: 'Introduced in a LinkedIn thought-piece', icon: 'linkedin' },
    { stage: 'creator',   label: 'Industry leader shared a case study' },
    { stage: 'viral',     label: 'Reached 100K impressions on LinkedIn', icon: 'linkedin' },
  ],
};

const CROSS_PLATFORM_EVENTS = [
  { stage: 'crossplatform', label: 'Picked up by creators on {platform}' },
  { stage: 'mainstream',    label: 'Featured in mainstream news coverage' },
];

// ── Deterministic pseudo-random from trend id ───────────────────────
function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ── Generate origin story events ─────────────────────────────────────
function generateOriginStory(trend) {
  const seed = hashCode(trend.id || trend.name);
  const platforms = (trend.platforms || []).map((p) => p.toLowerCase());

  // Pick the origin platform (first in list or fallback)
  const originKey = platforms[0] || 'tiktok';
  const base = ORIGIN_TEMPLATES[originKey] || ORIGIN_TEMPLATES.tiktok;

  const events = [...base];

  // Add cross-platform spread for each additional platform
  platforms.slice(1).forEach((p) => {
    const name = PLATFORM_NAMES[p] || p;
    events.push({
      stage: 'crossplatform',
      label: `Picked up by ${name} creators`,
      icon: p,
    });
  });

  // Mainstream event if momentum is high enough
  if ((trend.momentum || 0) >= 60) {
    events.push({
      stage: 'mainstream',
      label: 'Featured in mainstream news coverage',
      icon: null,
    });
  }

  // Assign deterministic day numbers
  return events.map((evt, i) => {
    const dayGap = i === 0 ? 0 : 1 + ((seed + i * 7) % 4);
    const dayNum = events
      .slice(0, i)
      .reduce((sum, _, j) => sum + (j === 0 ? 0 : 1 + ((seed + j * 7) % 4)), 0) + dayGap;
    return { ...evt, day: i === 0 ? 1 : dayNum };
  });
}

// ── Compute platform diffusion strengths ─────────────────────────────
function computeDiffusion(trend) {
  const platforms = (trend.platforms || []).map((p) => p.toLowerCase());
  const seed = hashCode(trend.id || trend.name);
  const momentum = trend.momentum || 50;

  return platforms.map((p, i) => {
    // Origin platform gets highest strength, others decay
    const base = i === 0 ? momentum : momentum * (0.4 + ((seed + i * 13) % 40) / 100);
    return {
      platform: p,
      name: PLATFORM_NAMES[p] || p,
      color: PLATFORM_COLORS[p] || '#6b7280',
      strength: Math.round(Math.min(100, Math.max(10, base))),
    };
  });
}

// ── Stage colors & icons ─────────────────────────────────────────────
const STAGE_META = {
  origin:         { color: '#3B82F6', emoji: '\uD83D\uDD2D' }, // magnifying glass
  creator:        { color: '#8B5CF6', emoji: '\uD83C\uDFA4' }, // microphone
  viral:          { color: '#F59E0B', emoji: '\uD83D\uDD25' }, // fire
  crossplatform:  { color: '#10B981', emoji: '\uD83C\uDF10' }, // globe
  mainstream:     { color: '#EF4444', emoji: '\uD83D\uDCF0' }, // newspaper
};

// ── Framer Motion variants ───────────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.18, delayChildren: 0.1 },
  },
};

const nodeVariants = {
  hidden: { opacity: 0, x: -32, scale: 0.85 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 22 },
  },
};

const lineVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeInOut' },
  },
};

const barVariants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: (strength) => ({
    scaleX: 1,
    opacity: 1,
    transition: { duration: 0.5, delay: strength * 0.003, ease: 'easeOut' },
  }),
};

// ── Sub-components ───────────────────────────────────────────────────

function TimelineNode({ event, index, isLast }) {
  const meta = STAGE_META[event.stage] || STAGE_META.origin;
  const platformKey = event.icon || null;

  return (
    <motion.div
      variants={nodeVariants}
      className="flex flex-col items-center gap-2 min-w-[140px] sm:min-w-[160px] relative"
    >
      {/* Glow ring */}
      <motion.div
        className="absolute top-2 rounded-full"
        style={{
          width: 52,
          height: 52,
          background: `radial-gradient(circle, ${meta.color}22 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.3 }}
      />

      {/* Node circle */}
      <div
        className="relative z-10 flex items-center justify-center rounded-full border-2"
        style={{
          width: 48,
          height: 48,
          borderColor: meta.color,
          background: `linear-gradient(135deg, ${meta.color}18, ${meta.color}08)`,
          backdropFilter: 'blur(8px)',
        }}
      >
        {platformKey ? (
          <PlatformIcon platform={platformKey} size={26} />
        ) : (
          <span className="text-lg leading-none">{meta.emoji}</span>
        )}
      </div>

      {/* Day label */}
      <span
        className="text-[11px] font-bold uppercase tracking-wider"
        style={{ color: meta.color }}
      >
        Day {event.day}
      </span>

      {/* Description */}
      <p className="text-xs text-center text-slate-400 leading-snug max-w-[150px]">
        {event.label}
      </p>
    </motion.div>
  );
}

function ConnectingLine({ fromColor, toColor }) {
  return (
    <motion.svg
      className="shrink-0 hidden sm:block"
      width="60"
      height="4"
      viewBox="0 0 60 4"
      style={{ marginTop: 22, marginLeft: -8, marginRight: -8 }}
      variants={nodeVariants}
    >
      <defs>
        <linearGradient id={`lg-${fromColor}-${toColor}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={fromColor} stopOpacity="0.8" />
          <stop offset="100%" stopColor={toColor} stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <motion.line
        x1="0"
        y1="2"
        x2="60"
        y2="2"
        stroke={`url(#lg-${fromColor}-${toColor})`}
        strokeWidth="2"
        strokeLinecap="round"
        variants={lineVariants}
      />
    </motion.svg>
  );
}

function MobileConnector({ color }) {
  return (
    <motion.div
      className="sm:hidden flex justify-center"
      variants={nodeVariants}
    >
      <motion.div
        style={{
          width: 2,
          height: 28,
          background: `linear-gradient(to bottom, ${color}88, ${color}22)`,
          borderRadius: 1,
        }}
        variants={{
          hidden: { scaleY: 0, opacity: 0 },
          visible: { scaleY: 1, opacity: 1, transition: { duration: 0.4 } },
        }}
      />
    </motion.div>
  );
}

function DiffusionBar({ item, maxStrength }) {
  const widthPct = Math.max(8, (item.strength / maxStrength) * 100);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 w-24 shrink-0">
        <PlatformIcon platform={item.platform} size={18} />
        <span className="text-xs text-slate-400 truncate">{item.name}</span>
      </div>

      <div className="flex-1 h-3 rounded-full bg-white/[0.04] overflow-hidden relative">
        <motion.div
          className="h-full rounded-full relative"
          style={{
            width: `${widthPct}%`,
            background: `linear-gradient(90deg, ${item.color}cc, ${item.color}66)`,
            transformOrigin: 'left',
            boxShadow: `0 0 12px ${item.color}33`,
          }}
          custom={item.strength}
          variants={barVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        />
      </div>

      <span
        className="text-xs font-semibold tabular-nums w-10 text-right"
        style={{ color: item.color }}
      >
        {item.strength}%
      </span>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

const TrendDNA = memo(function TrendDNA({ trend }) {
  const events = useMemo(() => generateOriginStory(trend), [trend]);
  const diffusion = useMemo(() => computeDiffusion(trend), [trend]);
  const maxStrength = useMemo(
    () => Math.max(...diffusion.map((d) => d.strength), 1),
    [diffusion]
  );

  return (
    <GlassCard hover={false} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/[0.06]">
          <span className="text-base">{'\uD83E\uDDEC'}</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Trend DNA
          </h3>
          <p className="text-[11px] text-slate-500">
            Origin story &amp; cross-platform diffusion
          </p>
        </div>
      </div>

      {/* ── Horizontal Timeline (desktop) / Vertical (mobile) ───── */}
      <motion.div
        className="
          flex flex-col sm:flex-row sm:items-start sm:overflow-x-auto
          items-center
          scrollbar-none py-2 sm:gap-0 gap-0
        "
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
      >
        {events.map((evt, i) => {
          const meta = STAGE_META[evt.stage] || STAGE_META.origin;
          const nextMeta =
            i < events.length - 1
              ? STAGE_META[events[i + 1].stage] || STAGE_META.origin
              : null;

          return (
            <div key={`${evt.stage}-${i}`} className="contents">
              <TimelineNode event={evt} index={i} isLast={i === events.length - 1} />
              {i < events.length - 1 && (
                <>
                  <ConnectingLine fromColor={meta.color} toColor={nextMeta.color} />
                  <MobileConnector color={meta.color} />
                </>
              )}
            </div>
          );
        })}
      </motion.div>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* ── Platform Diffusion ───────────────────────────────────── */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Platform Diffusion
        </h4>
        <div className="space-y-2.5">
          {diffusion.map((item) => (
            <DiffusionBar
              key={item.platform}
              item={item}
              maxStrength={maxStrength}
            />
          ))}
        </div>
      </div>
    </GlassCard>
  );
});

export default TrendDNA;
