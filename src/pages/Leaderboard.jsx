import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Flame,
  Target,
  Star,
  Sun,
  Moon,
  Eye,
  Rocket,
  Users,
  BarChart3,
  Zap,
  CalendarCheck,
  ChevronUp,
  TrendingUp,
  Check,
  ArrowUp,
  Crosshair,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import GlassCard from '@/components/shared/GlassCard';
import PageWrapper from '@/components/shared/PageWrapper';
import PlatformIcon from '@/components/shared/PlatformIcon';
import AnimatedNumber from '@/components/shared/AnimatedNumber';
import { leaderboard, currentUser } from '@/data/leaderboard';
import { trends } from '@/data/trends';

// ─── Constants ──────────────────────────────────────────────────────
const LEVEL_CONFIG = {
  Nestling: { color: 'text-gray-400', bg: 'bg-gray-500/15', border: 'border-gray-500/30' },
  Scout: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  Hunter: { color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
  Oracle: { color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/30' },
  Sage: { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
};

const RANK_STYLES = {
  1: { medal: '\u{1F947}', bg: 'bg-amber-500/8', border: 'border-amber-500/20' },
  2: { medal: '\u{1F948}', bg: 'bg-gray-300/8', border: 'border-gray-400/20' },
  3: { medal: '\u{1F949}', bg: 'bg-orange-500/8', border: 'border-orange-500/20' },
};

const BADGES = [
  { id: 'first-pred', name: 'First Prediction', icon: Star, earned: true, color: 'from-blue-500 to-cyan-500' },
  { id: '5-streak', name: '5-Streak', icon: Flame, earned: true, color: 'from-orange-500 to-red-500' },
  { id: 'trend-oracle', name: 'Trend Oracle', icon: Eye, earned: true, color: 'from-purple-500 to-pink-500' },
  { id: 'early-bird', name: 'Early Bird', icon: Sun, earned: true, color: 'from-amber-400 to-orange-500' },
  { id: 'night-owl', name: 'Night Owl', icon: Moon, earned: false, color: 'from-indigo-500 to-violet-500' },
  { id: '100-preds', name: '100 Predictions', icon: Target, earned: true, color: 'from-emerald-500 to-teal-500' },
  { id: '80-accuracy', name: '80% Accuracy', icon: Crosshair, earned: false, color: 'from-blue-500 to-indigo-500' },
  { id: 'viral-spotter', name: 'Viral Spotter', icon: Rocket, earned: true, color: 'from-pink-500 to-rose-500' },
  { id: 'community-leader', name: 'Community Leader', icon: Users, earned: false, color: 'from-cyan-500 to-blue-500' },
  { id: 'data-wizard', name: 'Data Wizard', icon: BarChart3, earned: false, color: 'from-violet-500 to-purple-500' },
  { id: 'rising-star', name: 'Rising Star', icon: Zap, earned: false, color: 'from-yellow-400 to-amber-500' },
  { id: 'perfect-week', name: 'Perfect Week', icon: CalendarCheck, earned: false, color: 'from-teal-500 to-emerald-500' },
];

// ─── Confetti System ───────────────────────────────────────────────
const CONFETTI_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

function ConfettiParticle({ delay, x, color }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: Math.random() * 8 + 4,
        height: Math.random() * 8 + 4,
        backgroundColor: color,
        left: `${x}%`,
        top: '50%',
      }}
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{
        opacity: [1, 1, 0],
        y: [0, -100 - Math.random() * 80, -160 - Math.random() * 60],
        x: [0, (Math.random() - 0.5) * 140],
        scale: [1, 1.3, 0.5],
        rotate: [0, Math.random() * 360],
      }}
      transition={{ duration: 1.2, delay, ease: 'easeOut' }}
    />
  );
}

// ─── User Profile Card ─────────────────────────────────────────────
function UserProfileCard() {
  const levelCfg = LEVEL_CONFIG[currentUser.level] || LEVEL_CONFIG.Nestling;
  const xpCurrent = 2340;
  const xpNext = 3000;
  const xpPercent = (xpCurrent / xpNext) * 100;

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl p-[1px]">
      {/* Gradient border */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-60" />
      <div className="relative rounded-2xl bg-[#0f1629]/95 p-6 backdrop-blur-xl">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-2xl font-black text-white shadow-lg shadow-blue-500/30">
              A
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#0f1629] ring-2 ring-blue-500/50">
              <span className="text-xs">#{currentUser.rank}</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="mb-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h2 className="text-xl font-extrabold text-white">Amy</h2>
              <span className="text-sm text-gray-400">@AmyTrends</span>
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-bold',
                  levelCfg.bg,
                  levelCfg.color
                )}
              >
                {currentUser.level}
              </span>
            </div>

            {/* XP Progress */}
            <div className="mb-4 mt-2">
              <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
                <span>XP Progress</span>
                <span>
                  <span className="font-mono text-white">{xpCurrent.toLocaleString()}</span>
                  {' / '}
                  {xpNext.toLocaleString()} XP
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercent}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Accuracy</p>
                <AnimatedNumber
                  value={currentUser.accuracy}
                  suffix="%"
                  className="text-lg font-bold text-white"
                />
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Streak</p>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-lg">{'\u{1F525}'}</span>
                  <AnimatedNumber
                    value={currentUser.streak}
                    className="text-lg font-bold text-white"
                  />
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Points</p>
                <AnimatedNumber
                  value={currentUser.points}
                  className="text-lg font-bold text-white"
                />
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Predictions</p>
                <AnimatedNumber
                  value={currentUser.predictions}
                  className="text-lg font-bold text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Leaderboard Table ─────────────────────────────────────────────
function LeaderboardTable() {
  return (
    <GlassCard hover={false} accent="blue" className="mb-6 overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Level
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Accuracy
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Points
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Streak
              </th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((user, i) => {
              const rankStyle = RANK_STYLES[user.rank];
              const levelCfg = LEVEL_CONFIG[user.level] || LEVEL_CONFIG.Nestling;
              const isCurrentUser = user.username === 'AmyTrends';

              return (
                <motion.tr
                  key={user.username}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i, 19) * 0.05, duration: 0.3 }}
                  className={cn(
                    'border-b border-white/5 transition-colors hover:bg-white/5',
                    isCurrentUser && 'border-l-2 border-l-blue-500 bg-blue-500/5',
                    rankStyle?.bg
                  )}
                >
                  {/* Rank */}
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-white">
                      {rankStyle ? (
                        <span className="text-lg">{rankStyle.medal}</span>
                      ) : (
                        <span className="w-7 text-center text-gray-400">#{user.rank}</span>
                      )}
                    </span>
                  </td>

                  {/* User */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
                          isCurrentUser
                            ? 'bg-gradient-to-br from-blue-500 to-purple-500'
                            : 'bg-white/10'
                        )}
                      >
                        {user.avatar}
                      </div>
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          isCurrentUser ? 'text-blue-300' : 'text-white'
                        )}
                      >
                        {user.username}
                        {isCurrentUser && (
                          <span className="ml-1.5 text-xs text-blue-400">(You)</span>
                        )}
                      </span>
                    </div>
                  </td>

                  {/* Level */}
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-bold',
                        levelCfg.bg,
                        levelCfg.color
                      )}
                    >
                      {user.level}
                    </span>
                  </td>

                  {/* Accuracy */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-mono tabular-nums text-white">
                      {user.accuracy}%
                    </span>
                  </td>

                  {/* Points */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-mono tabular-nums text-white">
                      {user.points.toLocaleString()}
                    </span>
                  </td>

                  {/* Streak */}
                  <td className="px-4 py-3 text-right">
                    <span className="flex items-center justify-end gap-1 text-sm">
                      {user.streak > 0 && <span>{'\u{1F525}'}</span>}
                      <span
                        className={cn(
                          'font-mono tabular-nums',
                          user.streak >= 10 ? 'text-orange-400 font-bold' : 'text-white'
                        )}
                      >
                        {user.streak}
                      </span>
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

// ─── Prediction Card ───────────────────────────────────────────────
function PredictionCard({ trend, onSubmit }) {
  const [prediction, setPrediction] = useState(null); // 'viral' | 'fade'
  const [confidence, setConfidence] = useState(75);
  const [submitted, setSubmitted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleSubmit = () => {
    if (!prediction) return;
    setSubmitted(true);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1500);
    if (onSubmit) onSubmit(trend.id, prediction, confidence);
  };

  return (
    <div className="relative rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:bg-white/[0.05]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-white">{trend.name}</h4>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <TrendingUp size={12} className="text-emerald-400" />
              Momentum: {trend.momentum}
            </div>
            <div className="flex gap-1">
              {trend.platforms.slice(0, 3).map((p) => (
                <PlatformIcon key={p} platform={p} size={16} />
              ))}
            </div>
          </div>
        </div>
        {submitted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20"
          >
            <Check size={14} className="text-emerald-400" />
          </motion.div>
        )}
      </div>

      {!submitted ? (
        <>
          {/* Prediction buttons */}
          <div className="mb-3 flex gap-2">
            <button
              onClick={() => setPrediction('viral')}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all',
                prediction === 'viral'
                  ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400'
                  : 'border-white/10 text-gray-400 hover:border-emerald-500/30 hover:text-emerald-400'
              )}
            >
              {'\u{1F680}'} Will Go Viral
            </button>
            <button
              onClick={() => setPrediction('fade')}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all',
                prediction === 'fade'
                  ? 'border-red-500/50 bg-red-500/15 text-red-400'
                  : 'border-white/10 text-gray-400 hover:border-red-500/30 hover:text-red-400'
              )}
            >
              {'\u{1F4C9}'} Will Fade
            </button>
          </div>

          {/* Confidence slider */}
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
              <span>Confidence</span>
              <span className="font-mono text-white">{confidence}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={100}
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-blue-500 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-blue-500 [&::-webkit-slider-thumb]:to-purple-500"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!prediction}
            className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-xs font-bold text-white transition-all hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-30 disabled:hover:shadow-none"
          >
            Submit Prediction
          </button>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-emerald-500/10 px-3 py-2 text-center text-xs font-semibold text-emerald-400"
        >
          Prediction recorded! +50 XP
        </motion.div>
      )}

      {/* Confetti overlay */}
      <AnimatePresence>
        {showConfetti && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
            {Array.from({ length: 16 }).map((_, i) => (
              <ConfettiParticle
                key={i}
                delay={i * 0.03}
                x={15 + Math.random() * 70}
                color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Badge Showcase ────────────────────────────────────────────────
function BadgeShowcase() {
  return (
    <GlassCard hover={false} accent="amber">
      <h3 className="mb-4 text-lg font-bold text-white">Badge Showcase</h3>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-6 lg:grid-cols-4 xl:grid-cols-6">
        {BADGES.map((badge) => {
          const Icon = badge.icon;
          return (
            <motion.div
              key={badge.id}
              className="group relative flex flex-col items-center gap-2"
              whileHover={badge.earned ? { scale: 1.08 } : {}}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <div
                className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-2xl transition-all',
                  badge.earned
                    ? `bg-gradient-to-br ${badge.color} shadow-lg`
                    : 'bg-white/5 opacity-40 grayscale'
                )}
              >
                {badge.earned ? (
                  <Icon size={24} className="text-white" />
                ) : (
                  <span className="text-xl font-bold text-gray-500">?</span>
                )}
              </div>
              <span
                className={cn(
                  'text-center text-[10px] font-semibold leading-tight',
                  badge.earned ? 'text-gray-300' : 'text-gray-600'
                )}
              >
                {badge.earned ? badge.name : (
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {badge.name}
                  </span>
                )}
                {!badge.earned && (
                  <span className="group-hover:opacity-0 transition-opacity">Locked</span>
                )}
              </span>
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────
export default function Leaderboard() {
  const emergingTrends = useMemo(
    () => trends.filter((t) => t.saturation === 'Emerging').slice(0, 5),
    []
  );

  const handlePredictionSubmit = useCallback((trendId, prediction, confidence) => {
    // Prediction submission handler
  }, []);

  return (
    <PageWrapper>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold">
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Trend Hunter Leaderboard
          </span>
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Predict trends, earn points, climb the ranks
        </p>
      </div>

      {/* User Profile Card */}
      <UserProfileCard />

      {/* Leaderboard Table */}
      <LeaderboardTable />

      {/* Bottom sections: Predictions + Badges */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Make a Prediction */}
        <GlassCard hover={false} accent="purple">
          <h3 className="mb-4 text-lg font-bold text-white">
            Make a Prediction
          </h3>
          <p className="mb-4 text-xs text-gray-400">
            Spot emerging trends and predict their trajectory. Correct predictions earn XP.
          </p>
          <div className="space-y-3">
            {emergingTrends.map((trend) => (
              <PredictionCard
                key={trend.id}
                trend={trend}
                onSubmit={handlePredictionSubmit}
              />
            ))}
          </div>
        </GlassCard>

        {/* Badge Showcase */}
        <BadgeShowcase />
      </div>
    </PageWrapper>
  );
}
