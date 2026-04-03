import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Bookmark,
  Bell,
  Link2,
  X,
  Lightbulb,
  Star,
  ChevronDown,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import GlassCard from '@/components/shared/GlassCard';
import PageWrapper from '@/components/shared/PageWrapper';
import StatusBadge from '@/components/shared/StatusBadge';
import PlatformIcon from '@/components/shared/PlatformIcon';
import CircularProgress from '@/components/shared/CircularProgress';

import { useTrendsData } from '@/data/trends';
import TrendDNA from '@/components/trends/TrendDNA';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ALL_PLATFORMS = ['All', 'TikTok', 'Instagram', 'YouTube', 'Twitter/X', 'LinkedIn', 'Reddit', 'Pinterest'];
const ALL_CATEGORIES = ['All', 'Topic', 'Audio', 'Format', 'Hashtag', 'Phrase'];
const ALL_SATURATIONS = ['All', 'Emerging', 'Rising', 'Peak', 'Declining'];
const SORT_OPTIONS = [
  { value: 'momentum', label: 'Momentum' },
  { value: 'growthVelocity', label: 'Growth Velocity' },
  { value: 'opportunityScore', label: 'Opportunity Score' },
];

// ---------------------------------------------------------------------------
// Type badge color map
// ---------------------------------------------------------------------------
const TYPE_STATUS_MAP = {
  topic: 'rising',
  audio: 'emerging',
  format: 'active',
  hashtag: 'peak',
  phrase: 'declining',
};

// ---------------------------------------------------------------------------
// Saturation → CircularProgress color
// ---------------------------------------------------------------------------
function saturationProgressColor(sat) {
  const s = sat?.toLowerCase();
  if (s === 'emerging') return '#10B981';
  if (s === 'rising') return '#3B82F6';
  if (s === 'peak') return '#F59E0B';
  if (s === 'declining') return '#EF4444';
  return '#6B7280';
}

function stableActivity(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return 42 + (Math.abs(hash) % 54);
}

// ---------------------------------------------------------------------------
// Competition bar
// ---------------------------------------------------------------------------
function CompetitionBar({ level }) {
  const l = level?.toLowerCase();
  const segments = l === 'high' ? 3 : l === 'medium' ? 2 : 1;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'h-2 w-5 rounded-sm',
              i <= segments
                ? segments === 3
                  ? 'bg-red-400'
                  : segments === 2
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                : 'bg-white/10',
            )}
          />
        ))}
      </div>
      <span className="text-xs text-gray-400">{level}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Audience interest bar
// ---------------------------------------------------------------------------
function InterestBar({ value }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs text-gray-400 w-7 text-right">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small sparkline (for grid cards)
// ---------------------------------------------------------------------------
function MiniSparkline({ data, color = '#3B82F6' }) {
  const sliced = data.slice(-7);
  return (
    <ResponsiveContainer width="100%" height={32}>
      <LineChart data={sliced}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Filter chip
// ---------------------------------------------------------------------------
function Chip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
        active
          ? 'bg-blue-500 text-white'
          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200',
      )}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Custom chart tooltips
// ---------------------------------------------------------------------------
function HistoryTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-2 rounded-lg text-xs border border-white/10">
      <p className="text-gray-400">Day {label}</p>
      <p className="text-white font-semibold">{payload[0].value}</p>
    </div>
  );
}

function PlatformBarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-2 rounded-lg text-xs border border-white/10">
      <p className="text-white font-semibold">{payload[0].payload.name}: {payload[0].value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trend Detail Modal
// ---------------------------------------------------------------------------
function TrendDetailModal({ trend, allTrends, onClose }) {
  if (!trend) return null;

  // Platform breakdown for bar chart
  const platformBarData = trend.platforms.map((p) => ({
    name: p,
    activity: stableActivity(`${trend.id}:${p}`),
  }));

  // Related trends lookup
  const relatedTrends = allTrends.filter((t) =>
    trend.relatedTrends?.includes(t.id),
  );

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-2xl max-h-[100vh] sm:max-h-[90vh] overflow-y-auto glass-card rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 space-y-5 sm:space-y-6"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Close"
        >
          <X size={18} className="text-gray-300" />
        </button>

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-white">{trend.name}</h2>
            <StatusBadge status={trend.type.toLowerCase() === 'topic' ? 'rising' : trend.type.toLowerCase() === 'audio' ? 'emerging' : trend.type.toLowerCase() === 'format' ? 'active' : trend.type.toLowerCase() === 'hashtag' ? 'peak' : 'draft'} />
          </div>
          <p className="text-sm text-gray-400">{trend.description}</p>
        </div>

        {/* 30-day momentum chart */}
        <GlassCard accent="purple" className="p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">
            30-Day Momentum
          </h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend.history}>
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#6B7280', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={4}
                />
                <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip content={<HistoryTooltip />} cursor={false} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={saturationProgressColor(trend.saturation)}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Platform breakdown */}
        <GlassCard accent="purple" className="p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">
            Platform Activity
          </h3>
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformBarData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip content={<PlatformBarTooltip />} cursor={false} />
                <Bar
                  dataKey="activity"
                  radius={[0, 4, 4, 0]}
                  fill="#3B82F6"
                  barSize={14}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Smart Insight */}
        <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={16} className="text-purple-400" />
            <span className="text-sm font-semibold text-purple-300">Smart Insight</span>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            {trend.aiInsight}
          </p>
        </div>

        {/* Related trends */}
        {relatedTrends.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">
              Related Trends
            </h3>
            <div className="flex flex-wrap gap-2">
              {relatedTrends.map((rt) => (
                <span
                  key={rt.id}
                  className="px-3 py-1.5 rounded-full bg-white/5 text-xs text-gray-300 border border-white/10"
                >
                  {rt.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Trend DNA — Origin Story */}
        <TrendDNA trend={trend} />

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
          <div className="rounded-xl bg-white/5 p-2 sm:p-3">
            <p className="text-[10px] sm:text-xs text-gray-400 mb-1">Momentum</p>
            <p className="text-lg sm:text-xl font-bold text-white">{trend.momentum}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs text-gray-400 mb-1">Growth</p>
            <p className="text-xl font-bold text-white">
              {trend.growthVelocity > 0 ? '+' : ''}
              {trend.growthVelocity}%
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs text-gray-400 mb-1">Opportunity</p>
            <p className="text-xl font-bold text-white">{trend.opportunityScore}</p>
          </div>
        </div>

        {/* CTA */}
        <button className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-sm hover:from-blue-600 hover:to-purple-600 transition-all">
          Schedule Post Using This Trend
        </button>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Stagger animation
// ---------------------------------------------------------------------------
const SATURATION_ACCENT_MAP = {
  emerging: 'emerald',
  rising: 'blue',
  peak: 'amber',
  declining: 'rose',
};

const stagger = {
  container: {
    animate: { transition: { staggerChildren: 0.03 } },
  },
  item: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  },
};

const cardVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function TrendRadar() {
  const { trends: allTrends, status, error, lastUpdated, serverAvailable } = useTrendsData();
  // ---- Filter state ----
  const [selectedPlatforms, setSelectedPlatforms] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSaturation, setSelectedSaturation] = useState('All');
  const [sortBy, setSortBy] = useState('momentum');
  const [selectedTrend, setSelectedTrend] = useState(null);

  // ---- Platform toggle (multi-select) ----
  const togglePlatform = useCallback((p) => {
    if (p === 'All') {
      setSelectedPlatforms(['All']);
      return;
    }
    setSelectedPlatforms((prev) => {
      const without = prev.filter((x) => x !== 'All');
      if (without.includes(p)) {
        const next = without.filter((x) => x !== p);
        return next.length === 0 ? ['All'] : next;
      }
      return [...without, p];
    });
  }, []);

  // ---- Filtered + sorted trends ----
  const filteredTrends = useMemo(() => {
    let result = [...allTrends];

    // Platform filter
    if (!selectedPlatforms.includes('All')) {
      result = result.filter((t) =>
        t.platforms.some((p) =>
          selectedPlatforms.some(
            (sp) => sp.toLowerCase() === p.toLowerCase(),
          ),
        ),
      );
    }

    // Category filter (maps to type)
    if (selectedCategory !== 'All') {
      result = result.filter(
        (t) => t.type.toLowerCase() === selectedCategory.toLowerCase(),
      );
    }

    // Saturation filter
    if (selectedSaturation !== 'All') {
      result = result.filter(
        (t) => t.saturation.toLowerCase() === selectedSaturation.toLowerCase(),
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'momentum') return b.momentum - a.momentum;
      if (sortBy === 'growthVelocity') return b.growthVelocity - a.growthVelocity;
      if (sortBy === 'opportunityScore') return b.opportunityScore - a.opportunityScore;
      return 0;
    });

    return result;
  }, [allTrends, selectedPlatforms, selectedCategory, selectedSaturation, sortBy]);

  return (
    <PageWrapper>
      <motion.div
        variants={stagger.container}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* ============================================================
            a) Header
        ============================================================ */}
        <motion.div variants={stagger.item}>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-1">Trend Radar</h1>
          <p className="text-gray-400 text-sm">
            Track emerging trends before they peak
          </p>
        </motion.div>

        <motion.div variants={stagger.item}>
          <GlassCard hover={false} accent="blue" className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">
                {serverAvailable ? 'Live trend feed connected' : 'Showing cached trend data'}
              </p>
              <p className="text-xs text-gray-500">
                {lastUpdated ? `Last update: ${new Date(lastUpdated).toLocaleString()}` : 'No successful trend sync yet.'}
                {error ? ` Latest error: ${error}.` : ''}
              </p>
            </div>
            <StatusBadge
              status={status === 'ready' ? 'active' : status === 'refreshing' || status === 'loading' ? 'emerging' : 'draft'}
            />
          </GlassCard>
        </motion.div>

        {/* ============================================================
            b) Filter Bar
        ============================================================ */}
        <motion.div
          variants={stagger.item}
        >
          <GlassCard
            accent="blue"
            className="sticky top-0 z-30 -mx-3 px-3 sm:-mx-6 sm:px-6 py-4 rounded-none border-x-0 border-t-0 space-y-3"
          >
          {/* Platform chips */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Platform
            </span>
            <div className="flex flex-wrap gap-2">
              {ALL_PLATFORMS.map((p) => (
                <Chip
                  key={p}
                  label={p}
                  active={
                    p === 'All'
                      ? selectedPlatforms.includes('All')
                      : selectedPlatforms.includes(p)
                  }
                  onClick={() => togglePlatform(p)}
                />
              ))}
            </div>
          </div>

          {/* Category + Saturation + Sort */}
          <div className="flex flex-wrap items-end gap-3 sm:gap-6">
            {/* Category */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </span>
              <div className="flex flex-wrap gap-2">
                {ALL_CATEGORIES.map((c) => (
                  <Chip
                    key={c}
                    label={c}
                    active={selectedCategory === c}
                    onClick={() => setSelectedCategory(c)}
                  />
                ))}
              </div>
            </div>

            {/* Saturation */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Saturation
              </span>
              <div className="flex flex-wrap gap-2">
                {ALL_SATURATIONS.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    active={selectedSaturation === s}
                    onClick={() => setSelectedSaturation(s)}
                  />
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sort by
              </span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 pr-8 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-gray-900">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>
            </div>
          </div>
          </GlassCard>
        </motion.div>

        {/* ============================================================
            c) Trend Grid
        ============================================================ */}
        <motion.div variants={stagger.item}>
          {filteredTrends.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-lg mb-1">No trends match your filters</p>
              <p className="text-sm">Try broadening your search criteria</p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
              layout
            >
              <AnimatePresence mode="popLayout">
                {filteredTrends.map((trend) => (
                  <motion.div
                    key={trend.id}
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    layout
                    transition={{ duration: 0.3 }}
                  >
                    <GlassCard
                      accent={SATURATION_ACCENT_MAP[trend.saturation.toLowerCase()]}
                      className="space-y-4 p-5"
                      onClick={() => setSelectedTrend(trend)}
                    >
                      {/* Name + Type badge */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-bold text-white leading-tight">
                          {trend.name}
                        </h3>
                        <StatusBadge
                          status={
                            TYPE_STATUS_MAP[trend.type.toLowerCase()] || 'draft'
                          }
                        />
                      </div>

                      {/* Type label */}
                      <span className="text-xs text-gray-500">{trend.type}</span>

                      {/* Momentum + Saturation */}
                      <div className="flex items-center gap-4">
                        <CircularProgress
                          value={trend.momentum}
                          max={100}
                          size={52}
                          strokeWidth={4}
                          color={saturationProgressColor(trend.saturation)}
                        />
                        <div>
                          <StatusBadge status={trend.saturation.toLowerCase()} />
                          <p className="text-xs text-gray-500 mt-1">Saturation</p>
                        </div>
                      </div>

                      {/* Growth velocity sparkline */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400">Growth Velocity</span>
                          <span
                            className={cn(
                              'text-xs font-semibold',
                              trend.growthVelocity >= 0
                                ? 'text-emerald-400'
                                : 'text-red-400',
                            )}
                          >
                            {trend.growthVelocity > 0 ? '+' : ''}
                            {trend.growthVelocity}%
                          </span>
                        </div>
                        <MiniSparkline
                          data={trend.history}
                          color={saturationProgressColor(trend.saturation)}
                        />
                      </div>

                      {/* Competition */}
                      <div>
                        <span className="text-xs text-gray-400 block mb-1">
                          Competition
                        </span>
                        <CompetitionBar level={trend.competition} />
                      </div>

                      {/* Audience Interest */}
                      <div>
                        <span className="text-xs text-gray-400 block mb-1">
                          Audience Interest
                        </span>
                        <InterestBar value={trend.audienceInterest} />
                      </div>

                      {/* Opportunity Score */}
                      <div className="flex items-center gap-2">
                        <Star size={16} className="text-amber-400" />
                        <span className="text-lg font-bold text-white">
                          {trend.opportunityScore}
                        </span>
                        <span className="text-xs text-gray-500">Opportunity</span>
                      </div>

                      {/* Platform icons */}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">
                          {trend.platforms.map((p) => (
                            <PlatformIcon key={p} platform={p} size={20} />
                          ))}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-1">
                          {[
                            { icon: Bookmark, label: 'Save' },
                            { icon: Bell, label: 'Alert' },
                            { icon: Link2, label: 'Connect' },
                          ].map(({ icon: Icon, label }) => (
                            <button
                              key={label}
                              onClick={(e) => {
                                e.stopPropagation();
                                // placeholder action
                              }}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 transition-colors"
                              title={label}
                              aria-label={label}
                            >
                              <Icon size={14} className="text-gray-400" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* ============================================================
          d) Trend Detail Modal
      ============================================================ */}
      <AnimatePresence>
        {selectedTrend && (
          <TrendDetailModal
            trend={selectedTrend}
            allTrends={allTrends}
            onClose={() => setSelectedTrend(null)}
          />
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
