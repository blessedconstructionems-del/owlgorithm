import { createElement, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Activity, AlertCircle, ArrowUpRight, ChevronRight, Clock, Database, Link2,
  Moon, Palette, Radar, Send, Settings, TrendingUp,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import GlassCard from '@/components/shared/GlassCard';
import PageWrapper from '@/components/shared/PageWrapper';
import StatusBadge from '@/components/shared/StatusBadge';
import PlatformIcon from '@/components/shared/PlatformIcon';
import CircularProgress from '@/components/shared/CircularProgress';
import AnimatedNumber from '@/components/shared/AnimatedNumber';
import SignalMark from '@/components/shared/SignalMark';

import { useTrendsData } from '@/data/trends';
import TrendPulseRadar from '@/components/dashboard/TrendPulseRadar';
import OpportunityScanner from '@/components/dashboard/OpportunityScanner';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.08 } } },
  item: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
  },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function satColor(s) {
  const v = s?.toLowerCase();
  if (v === 'emerging') return 'text-emerald-400 bg-emerald-500/15';
  if (v === 'rising') return 'text-blue-400 bg-blue-500/15';
  if (v === 'peak') return 'text-amber-400 bg-amber-500/15';
  if (v === 'declining') return 'text-red-400 bg-red-500/15';
  return 'text-gray-400 bg-gray-500/15';
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card !p-3 rounded-xl border border-white/10 shadow-xl">
      <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">{label}</p>
      <p className="text-white font-bold text-sm tabular-nums">
        {typeof payload[0].value === 'number' ? Math.round(payload[0].value).toLocaleString() : payload[0].value}
      </p>
    </div>
  );
}

function buildMomentumSeries(trends) {
  const points = new Map();

  for (const trend of trends.slice(0, 12)) {
    for (const point of trend.history || []) {
      if (!point?.day || typeof point.value !== 'number') continue;
      const bucket = points.get(point.day) || { day: point.day, total: 0, count: 0 };
      bucket.total += point.value;
      bucket.count += 1;
      points.set(point.day, bucket);
    }
  }

  return [...points.values()]
    .sort((a, b) => a.day.localeCompare(b.day))
    .slice(-14)
    .map((point) => ({
      day: point.day,
      value: point.count ? point.total / point.count : 0,
    }));
}

function EmptyState({ title, message, actionLabel, actionTo }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-8 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-gray-500">
        <Database size={18} />
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">{message}</p>
      {actionTo ? (
        <Link
          to={actionTo}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-500/15"
        >
          {actionLabel}
          <ChevronRight size={14} />
        </Link>
      ) : null}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useApp();
  const {
    trends: trendFeed,
    status: trendsStatus,
    error: trendsError,
    lastUpdated,
    serverAvailable,
  } = useTrendsData(true);

  const stats = useMemo(() => {
    const count = trendFeed.length;
    const emerging = trendFeed.filter((trend) => trend.saturation?.toLowerCase() === 'emerging').length;
    const highOpportunity = trendFeed.filter((trend) => (trend.opportunityScore || 0) >= 70).length;
    const avgMomentum = count
      ? Math.round(trendFeed.reduce((sum, trend) => sum + (trend.momentum || 0), 0) / count)
      : 0;
    const activePlatforms = new Set(trendFeed.flatMap((trend) => trend.platforms || [])).size;

    return { count, emerging, highOpportunity, avgMomentum, activePlatforms };
  }, [trendFeed]);

  const statCards = useMemo(() => [
    {
      label: 'Live Trends',
      value: stats.count,
      icon: Activity,
      iconAccent: 'from-blue-500 to-cyan-400',
      cardAccent: 'blue',
    },
    {
      label: 'Emerging',
      value: stats.emerging,
      icon: TrendingUp,
      iconAccent: 'from-emerald-500 to-teal-400',
      cardAccent: 'emerald',
    },
    {
      label: 'High Opportunity',
      value: stats.highOpportunity,
      icon: Radar,
      iconAccent: 'from-purple-500 to-pink-400',
      cardAccent: 'purple',
    },
    {
      label: 'Avg Momentum',
      value: stats.avgMomentum,
      isCircular: true,
      icon: Activity,
      iconAccent: 'from-amber-500 to-orange-400',
      cardAccent: 'amber',
    },
  ], [stats]);

  const trendingNow = useMemo(() => trendFeed.slice(0, 8), [trendFeed]);
  const momentumSeries = useMemo(() => buildMomentumSeries(trendFeed), [trendFeed]);
  const isLoading = trendsStatus === 'loading' || trendsStatus === 'idle';
  const hasTrends = trendFeed.length > 0;

  const updatedLabel = useMemo(() => {
    if (!lastUpdated) return 'Not refreshed yet';
    try {
      return format(parseISO(lastUpdated), 'MMM d, h:mm a');
    } catch {
      return lastUpdated;
    }
  }, [lastUpdated]);

  const heroCopy = hasTrends
    ? `Tracking ${stats.count} live signals across ${stats.activePlatforms} connected public sources.`
    : 'No live trend data is loaded yet. Start the scraper or wait for the next scheduled refresh.';

  const quickActions = [
    { icon: Send, title: 'Post Now', desc: 'Open the beginner flow with radar pick, camera prompts, filled caption, and posting choices.', link: '/post-now' },
    { icon: Radar, title: 'Open Trend Radar', desc: 'Inspect live trend signals, momentum, and source platforms.', link: '/trends' },
    { icon: Moon, title: 'Open Night Watch', desc: 'Review the overnight build queue and risk board from live trend data.', link: '/night-watch' },
    { icon: Link2, title: 'Connect Socials', desc: 'Link Upload-Post profiles and verify connected publishing accounts.', link: '/platforms' },
    { icon: Palette, title: 'Open Creator Studio Pro', desc: 'Create social images, videos, captions, and advanced assets from trend signals.', link: '/media' },
    { icon: Settings, title: 'Review Account Settings', desc: 'Manage profile, password, and workspace display preferences.', link: '/settings' },
  ];

  return (
    <PageWrapper>
      <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-8">
        <motion.div variants={stagger.item} className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.9fr)]">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.04] shadow-[0_24px_64px_-24px_rgba(0,0,0,0.72)] backdrop-blur-xl">
            <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(64,96,255,0.24),rgba(14,24,38,0.16),rgba(16,185,129,0.12))]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.1),transparent_34%),radial-gradient(circle_at_80%_30%,rgba(34,211,238,0.10),transparent_28%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,8,14,0.28),rgba(4,8,14,0.08)_48%,rgba(4,8,14,0.1))]" />

            <div className="relative flex h-full items-center justify-between px-4 py-8 sm:px-8 md:min-h-[320px] md:py-12">
              <div className="space-y-4 drop-shadow-[0_4px_22px_rgba(0,0,0,0.72)]">
                <div className="flex flex-wrap items-center gap-2 text-white/80 text-sm font-medium">
                  <span className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs',
                    serverAvailable
                      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                      : 'border-amber-500/25 bg-amber-500/10 text-amber-300',
                  )}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', serverAvailable ? 'bg-emerald-400' : 'bg-amber-400')} />
                    {serverAvailable ? 'API connected' : 'API unavailable'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-white/60">
                    <Clock size={13} />
                    {updatedLabel}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                  {getGreeting()}, {user?.name || 'there'}
                </h1>
                <p className="max-w-md text-base leading-relaxed text-white/78">
                  {heroCopy}
                </p>
                {trendsError ? (
                  <div className="inline-flex max-w-xl items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{trendsError}</span>
                  </div>
                ) : null}
              </div>
              <div className="hidden lg:flex items-center gap-4">
                <div className="animate-float">
                  <SignalMark className="h-24 w-24 rounded-2xl border-white/[0.16] bg-[linear-gradient(160deg,rgba(8,15,28,0.42),rgba(14,86,122,0.34))] shadow-[0_22px_48px_-18px_rgba(0,0,0,0.8)] backdrop-blur-xl" />
                </div>
              </div>
            </div>
          </div>

          <TrendPulseRadar />
        </motion.div>

        <motion.div variants={stagger.item} className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <GlassCard key={card.label} hover={false} accent={card.cardAccent} className="!p-3 sm:!p-5 space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.label}</span>
                  <div className={cn('w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg', card.iconAccent)}>
                    <Icon size={15} className="text-white" />
                  </div>
                </div>
                {card.isCircular ? (
                  <div className="flex items-center gap-3">
                    <CircularProgress value={card.value} max={100} size={52} strokeWidth={4} />
                    <div>
                      <span className="text-2xl font-extrabold text-white tabular-nums">{card.value}</span>
                      <span className="text-gray-500 text-sm">/100</span>
                    </div>
                  </div>
                ) : (
                  <AnimatedNumber value={card.value} className="text-2xl sm:text-3xl font-extrabold text-white" />
                )}
              </GlassCard>
            );
          })}
        </motion.div>

        <motion.div variants={stagger.item}>
          <OpportunityScanner />
        </motion.div>

        <motion.div variants={stagger.item}>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Trending Now</h2>
              <p className="text-xs text-gray-600 mt-0.5">Live trend intelligence from the backend scraper</p>
            </div>
            <Link to="/trends" className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          {!hasTrends && !isLoading ? (
            <EmptyState
              title="No live trends yet"
              message="The dashboard will populate after the scraper writes trend records to the backend cache."
              actionLabel="Open Trend Radar"
              actionTo="/trends"
            />
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none -mx-2 px-2">
              {trendingNow.map((trend, i) => (
                <motion.div
                  key={trend.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                >
                  <GlassCard className="min-w-[230px] max-w-[250px] shrink-0 !p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-white leading-tight line-clamp-2">{trend.name}</p>
                      <span className={cn('shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full', satColor(trend.saturation))}>
                        {trend.momentum}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={trend.saturation} size="sm" />
                      <span className="text-[10px] text-gray-600">{trend.type}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {trend.platforms?.slice(0, 4).map((p) => (
                        <PlatformIcon key={p} platform={p} size={18} />
                      ))}
                      {trend.platforms?.length > 4 && (
                        <span className="text-[10px] text-gray-600">+{trend.platforms.length - 4}</span>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div variants={stagger.item} className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Momentum Snapshot</h2>
              <span className="text-xs text-gray-600">Average of top live trend history</span>
            </div>
            <GlassCard hover={false} accent="blue" className="!p-5">
              {momentumSeries.length > 1 ? (
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={momentumSeries}>
                      <XAxis
                        dataKey="day"
                        tick={{ fill: '#4B5563', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => { try { return format(new Date(v), 'MMM d'); } catch { return v; }}}
                      />
                      <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)' }} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#3B82F6"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5, fill: '#3B82F6', stroke: '#0A0E14', strokeWidth: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  title="No momentum history"
                  message="Live scraper history will appear here after trend records include two or more dated readings."
                />
              )}
            </GlassCard>
          </div>

          <div className="xl:col-span-2">
            <h2 className="mb-5 text-lg font-bold text-white">Command Actions</h2>
            <div className="grid grid-cols-1 gap-4">
              {quickActions.map((action) => (
                <Link key={action.title} to={action.link} className="block h-full no-underline hover:no-underline">
                  <GlassCard gradient className="group h-full min-h-[164px] !p-0 transition-all hover:glow-purple">
                    <div className="relative z-10 flex h-full min-h-[164px] flex-col p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-br from-blue-500/20 to-purple-500/20 transition-transform group-hover:scale-105">
                          {createElement(action.icon, { size: 18, className: 'text-blue-400' })}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold leading-snug text-white">{action.title}</h3>
                          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500 group-hover:text-gray-400">{action.desc}</p>
                        </div>
                      </div>
                      <div className="mt-auto flex items-center gap-1 pt-4 text-[11px] font-medium text-blue-400/70 transition-colors group-hover:text-blue-300">
                        Open <ArrowUpRight size={12} />
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </PageWrapper>
  );
}
