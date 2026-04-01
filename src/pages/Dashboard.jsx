import { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  ArrowUpRight, CalendarDays, TrendingUp, Radar, Sparkles, BarChart3,
  CheckCircle2, Circle, Clock, Zap, Eye, ChevronRight,
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

import { trends } from '@/data/trends';
import { posts } from '@/data/posts';
import { dailyData } from '@/data/analytics';

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

function MiniSparkline({ data, color = '#3B82F6' }) {
  const sliced = data?.slice(-12) || [];
  if (sliced.length < 2) return null;
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={sliced}>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card !p-3 rounded-xl border border-white/10 shadow-xl">
      <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">{label}</p>
      <p className="text-white font-bold text-sm tabular-nums">
        {typeof payload[0].value === 'number' ? payload[0].value.toLocaleString() : payload[0].value}
      </p>
    </div>
  );
}

const STAT_CARDS = [
  { label: 'Active Ripples', value: 47, change: '+12%', changeUp: true, icon: Zap, iconAccent: 'from-blue-500 to-cyan-400', cardAccent: 'blue' },
  { label: 'Scheduled Posts', value: 12, icon: CalendarDays, iconAccent: 'from-purple-500 to-pink-400', cardAccent: 'purple' },
  { label: 'Avg Engagement', value: 4.8, suffix: '%', change: '+0.6%', changeUp: true, icon: TrendingUp, iconAccent: 'from-emerald-500 to-teal-400', cardAccent: 'emerald' },
  { label: 'Trend Score', value: 82, isCircular: true, icon: Eye, iconAccent: 'from-amber-500 to-orange-400', cardAccent: 'amber' },
];

const QUICK_ACTIONS = [
  { icon: Radar, title: 'Find trending topics', desc: 'Discover emerging opportunities tailored to your niche', link: '/trends' },
  { icon: Sparkles, title: 'Generate post ideas', desc: 'Smart content suggestions based on live trends', link: '/scheduler' },
  { icon: BarChart3, title: 'Analyze best content', desc: 'See what drives engagement and why', link: '/analytics' },
];

export default function Dashboard() {
  const { user, onboardingChecklist, updateChecklist } = useApp();

  const checklistItems = useMemo(() => [
    { key: 'connectPlatform', label: 'Connect a platform' },
    { key: 'discoverTrend', label: 'Discover your first trend' },
    { key: 'schedulePost', label: 'Schedule a post' },
    { key: 'setNiche', label: 'Set your niche preferences' },
  ], []);

  const completedCount = useMemo(
    () => checklistItems.filter((i) => onboardingChecklist[i.key]).length,
    [checklistItems, onboardingChecklist],
  );
  const allComplete = completedCount === checklistItems.length;
  const progressPct = Math.round((completedCount / checklistItems.length) * 100);

  const toggleItem = useCallback(
    (key) => updateChecklist(key, !onboardingChecklist[key]),
    [onboardingChecklist, updateChecklist],
  );

  const trendingNow = useMemo(() => trends.slice(0, 8), []);

  const upcomingPosts = useMemo(() => {
    const now = new Date().toISOString();
    return [...posts]
      .filter((p) => p.scheduledAt >= now || p.status === 'Scheduled' || p.status === 'scheduled')
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
      .slice(0, 5);
  }, []);

  const last7 = useMemo(() => dailyData.slice(-7), []);

  return (
    <PageWrapper>
      <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-8">

        {/* ── Welcome Banner ── */}
        <motion.div variants={stagger.item}>
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06]">
            {/* Multi-layer gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-purple-600/80 to-indigo-700/90" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cdefs%3E%3Cpattern%20id%3D%22g%22%20width%3D%2240%22%20height%3D%2240%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%2220%22%20r%3D%221%22%20fill%3D%22rgba(255%2C255%2C255%2C0.08)%22%2F%3E%3C%2Fpattern%3E%3C%2Fdefs%3E%3Crect%20fill%3D%22url(%23g)%22%20width%3D%22100%25%22%20height%3D%22100%25%22%2F%3E%3C%2Fsvg%3E')] opacity-50" />
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/[0.06] blur-3xl" />
            <div className="absolute -bottom-24 -left-12 w-72 h-72 rounded-full bg-purple-400/[0.08] blur-3xl" />
            <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full bg-cyan-400/[0.06] blur-2xl" />

            <div className="relative px-4 py-8 sm:px-8 md:py-12 flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-200/70 text-sm font-medium">
                  <Sparkles size={14} />
                  <span>Powered Insights</span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                  {getGreeting()}, {user.name}
                </h1>
                <p className="text-blue-100/60 text-base max-w-md">
                  Here's what's trending in your world today. You have <span className="text-white font-semibold">3 emerging opportunities</span> waiting.
                </p>
              </div>
              <div className="hidden lg:flex items-center gap-4">
                <div className="animate-float">
                  <div className="w-24 h-24 rounded-2xl bg-white/[0.08] backdrop-blur border border-white/[0.12] flex items-center justify-center text-5xl shadow-2xl">
                    🦉
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Getting Started ── */}
        {!allComplete && (
          <motion.div variants={stagger.item}>
            <GlassCard hover={false} accent="blue" className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Getting Started</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Complete these steps to unlock full power</p>
                </div>
                <span className="text-sm font-bold tabular-nums text-blue-400">
                  {progressPct}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {checklistItems.map((item) => {
                  const done = onboardingChecklist[item.key];
                  return (
                    <button
                      key={item.key}
                      onClick={() => toggleItem(item.key)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                        done
                          ? 'bg-emerald-500/[0.08] text-emerald-400 border border-emerald-500/20'
                          : 'bg-white/[0.03] text-gray-400 border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1]',
                      )}
                    >
                      {done ? <CheckCircle2 size={18} /> : <Circle size={18} className="text-gray-600" />}
                      <span className={done ? 'line-through opacity-60' : ''}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* ── Quick Stats ── */}
        <motion.div variants={stagger.item} className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {STAT_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <GlassCard key={card.label} hover={false} accent={card.cardAccent} className="!p-3 sm:!p-5 space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
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
                  <div className="flex items-end gap-2">
                    <AnimatedNumber value={card.value} suffix={card.suffix || ''} className="text-3xl font-extrabold text-white" />
                    {card.change && (
                      <span className={cn(
                        'inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full mb-1',
                        card.changeUp ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                      )}>
                        <ArrowUpRight size={11} />
                        {card.change}
                      </span>
                    )}
                  </div>
                )}
              </GlassCard>
            );
          })}
        </motion.div>

        {/* ── Trending Now ── */}
        <motion.div variants={stagger.item}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-white">Trending Now</h2>
              <p className="text-xs text-gray-600 mt-0.5">Real-time trend intelligence across platforms</p>
            </div>
            <Link to="/trends" className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">
              View all <ChevronRight size={14} />
            </Link>
          </div>
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
                  <div className="h-[36px]">
                    <MiniSparkline data={trend.history} color={
                      trend.saturation === 'Emerging' ? '#10B981' :
                      trend.saturation === 'Rising' ? '#3B82F6' :
                      trend.saturation === 'Peak' ? '#F59E0B' : '#EF4444'
                    } />
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
        </motion.div>

        {/* ── Two-Column: Posts Timeline + Performance ── */}
        <motion.div variants={stagger.item} className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Upcoming Posts */}
          <div className="xl:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Upcoming Posts</h2>
              <Link to="/scheduler" className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                Schedule <ChevronRight size={14} />
              </Link>
            </div>
            <GlassCard hover={false} accent="purple" className="!p-0 divide-y divide-white/[0.04]">
              {upcomingPosts.length === 0 && (
                <p className="text-gray-600 text-sm py-8 text-center">No upcoming posts</p>
              )}
              {upcomingPosts.map((post, idx) => {
                let formattedTime;
                try { formattedTime = format(parseISO(post.scheduledAt), 'MMM d, h:mm a'); }
                catch { formattedTime = post.scheduledAt; }
                return (
                  <div key={post.id} className="flex items-start gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex flex-col items-center pt-1 shrink-0">
                      <div className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        idx === 0 ? 'bg-blue-500 ring-[3px] ring-blue-500/20' : 'bg-gray-700'
                      )} />
                      {idx < upcomingPosts.length - 1 && <div className="w-px flex-1 bg-white/[0.06] mt-1.5 min-h-[20px]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <PlatformIcon platform={post.platform} size={18} />
                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                          <Clock size={10} />{formattedTime}
                        </span>
                        <StatusBadge status={post.status} size="sm" />
                      </div>
                      <p className="text-[13px] text-gray-300 line-clamp-2 leading-relaxed">
                        {post.caption}
                      </p>
                    </div>
                  </div>
                );
              })}
            </GlassCard>
          </div>

          {/* Performance Snapshot */}
          <div className="xl:col-span-3">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Performance Snapshot</h2>
              <Link to="/analytics" className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                Full analytics <ChevronRight size={14} />
              </Link>
            </div>
            <GlassCard hover={false} accent="blue" className="!p-5">
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={last7}>
                    <defs>
                      <linearGradient id="dashEngGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.35} />
                        <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="dashReachGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#4B5563', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => { try { return format(new Date(v), 'EEE'); } catch { return v; }}}
                    />
                    <YAxis hide />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)' }} />
                    <Area
                      type="monotone"
                      dataKey="reach"
                      stroke="#8B5CF6"
                      strokeWidth={1.5}
                      fill="url(#dashReachGrad)"
                      dot={false}
                      activeDot={{ r: 4, fill: '#8B5CF6', stroke: '#0A0E14', strokeWidth: 2 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="engagement"
                      stroke="#3B82F6"
                      strokeWidth={2.5}
                      fill="url(#dashEngGrad)"
                      dot={false}
                      activeDot={{ r: 5, fill: '#3B82F6', stroke: '#0A0E14', strokeWidth: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>
        </motion.div>

        {/* ── Quick Actions ── */}
        <motion.div variants={stagger.item}>
          <h2 className="text-lg font-bold text-white mb-5">Owlgorithm</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {QUICK_ACTIONS.map(({ icon: Icon, title, desc, link }) => (
              <Link key={title} to={link}>
                <GlassCard gradient className="group !p-5 transition-all hover:glow-purple h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/[0.08] flex items-center justify-center transition-transform group-hover:scale-110">
                      <Icon size={18} className="text-blue-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white">{title}</h3>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-blue-400/60 group-hover:text-blue-400 transition-colors">
                    Get started <ChevronRight size={12} />
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </PageWrapper>
  );
}
