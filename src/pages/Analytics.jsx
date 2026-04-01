import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  BarChart3,
  Users,
  FileText,
  ArrowUpRight,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import GlassCard from '@/components/shared/GlassCard';
import PageWrapper from '@/components/shared/PageWrapper';
import PlatformIcon from '@/components/shared/PlatformIcon';
import AnimatedNumber from '@/components/shared/AnimatedNumber';
import {
  dailyData,
  platformData,
  topPosts,
  demographics,
  contentTypePerformance,
  heatmapData,
} from '@/data/analytics';

// ─── Constants ───────────────────────────────────────────────────
const DATE_RANGES = ['7 Days', '30 Days', '90 Days', 'Custom'];

const PLATFORM_COLORS = {
  TikTok: '#00f2ea',
  Instagram: '#E4405F',
  YouTube: '#FF0000',
  LinkedIn: '#0077B5',
  'Twitter/X': '#1DA1F2',
  Pinterest: '#BD081C',
  Reddit: '#FF4500',
};

const GENDER_COLORS = ['#E4405F', '#3B82F6', '#A78BFA'];

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Custom Tooltip ──────────────────────────────────────────────
function GlassTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900/90 border border-white/10 rounded-lg px-3 py-2 backdrop-blur-sm shadow-xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color || entry.stroke }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
}

// ─── Sparkline Component ─────────────────────────────────────────
function Sparkline({ data, dataKey, color = '#3B82F6', height = 32 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`spark-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${dataKey})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Format numbers ──────────────────────────────────────────────
function fmtNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

// ─── Main Analytics Page ─────────────────────────────────────────
export default function Analytics() {
  const [dateRange, setDateRange] = useState('30 Days');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [hoveredHeatCell, setHoveredHeatCell] = useState(null);

  // Filter daily data by date range
  const filteredData = useMemo(() => {
    const daysMap = { '7 Days': 7, '30 Days': 30, '90 Days': 90 };
    const days = daysMap[dateRange] || 30;
    return dailyData.slice(-days);
  }, [dateRange]);

  // Compute overview stats
  const stats = useMemo(() => {
    const totalReach = filteredData.reduce((s, d) => s + d.reach, 0);
    const totalEngagement = filteredData.reduce((s, d) => s + d.engagement, 0);
    const totalPosts = filteredData.reduce((s, d) => s + d.posts, 0);
    const totalFollowers = filteredData.reduce((s, d) => s + d.followers, 0);
    const avgRate = totalReach > 0 ? ((totalEngagement / totalReach) * 100) : 0;

    // Compare to previous period
    const prevData = dailyData.slice(-(filteredData.length * 2), -filteredData.length);
    const prevReach = prevData.reduce((s, d) => s + d.reach, 0);
    const prevEngagement = prevData.reduce((s, d) => s + d.engagement, 0);
    const prevPosts = prevData.reduce((s, d) => s + d.posts, 0);
    const prevFollowers = prevData.reduce((s, d) => s + d.followers, 0);

    const pctChange = (curr, prev) => (prev > 0 ? ((curr - prev) / prev * 100).toFixed(1) : '+0');

    return {
      totalReach,
      totalEngagement,
      avgRate: Math.round(avgRate * 10) / 10,
      totalPosts,
      totalFollowers,
      reachChange: pctChange(totalReach, prevReach),
      engagementChange: pctChange(totalEngagement, prevEngagement),
      postsChange: pctChange(totalPosts, prevPosts),
      followersChange: pctChange(totalFollowers, prevFollowers),
    };
  }, [filteredData]);

  // Chart data for engagement over time (with optional platform filter)
  const engagementChartData = useMemo(() => {
    return filteredData.map((d) => ({
      date: d.date.slice(5), // MM-DD
      reach: d.reach,
      engagement: d.engagement,
    }));
  }, [filteredData]);

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Analytics</h1>

        {/* Date range tabs */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 overflow-x-auto scrollbar-none">
          {DATE_RANGES.map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                dateRange === range
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Custom date range inputs */}
      {dateRange === 'Custom' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">From</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">To</label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>
      )}

      {/* ── Overview Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
        {[
          {
            label: 'Total Reach',
            value: stats.totalReach,
            change: stats.reachChange,
            icon: Eye,
            color: '#3B82F6',
            dataKey: 'reach',
            accent: 'blue',
          },
          {
            label: 'Total Engagement',
            value: stats.totalEngagement,
            change: stats.engagementChange,
            icon: Heart,
            color: '#E4405F',
            dataKey: 'engagement',
            accent: 'rose',
          },
          {
            label: 'Avg Engagement Rate',
            value: stats.avgRate,
            change: null,
            icon: BarChart3,
            color: '#A78BFA',
            dataKey: 'engagement',
            suffix: '%',
            accent: 'emerald',
          },
          {
            label: 'Total Posts',
            value: stats.totalPosts,
            change: stats.postsChange,
            icon: FileText,
            color: '#10B981',
            dataKey: 'posts',
            accent: 'purple',
          },
          {
            label: 'Follower Growth',
            value: stats.totalFollowers,
            change: stats.followersChange,
            icon: Users,
            color: '#F59E0B',
            dataKey: 'followers',
            prefix: '+',
            accent: 'cyan',
          },
        ].map((card) => {
          const isPositive = card.change && parseFloat(card.change) >= 0;
          return (
            <GlassCard key={card.label} hover={false} accent={card.accent}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{card.label}</span>
                <card.icon size={16} style={{ color: card.color }} />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                <AnimatedNumber
                  value={card.value}
                  prefix={card.prefix || ''}
                  suffix={card.suffix || ''}
                />
              </div>
              {card.change !== null && (
                <div className="flex items-center gap-1 text-xs">
                  {isPositive ? (
                    <ArrowUpRight size={12} className="text-emerald-400" />
                  ) : (
                    <TrendingDown size={12} className="text-red-400" />
                  )}
                  <span className={isPositive ? 'text-emerald-400' : 'text-red-400'}>
                    {isPositive ? '+' : ''}{card.change}%
                  </span>
                  <span className="text-gray-600">vs prev period</span>
                </div>
              )}
              <div className="mt-2">
                <Sparkline data={filteredData.slice(-14)} dataKey={card.dataKey} color={card.color} />
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* ── Platform Comparison Bar Chart ── */}
      <GlassCard hover={false} accent="blue" className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Platform Comparison</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={platformData} barGap={4}>
              <XAxis
                dataKey="platform"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#6B7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={fmtNum}
              />
              <Tooltip content={<GlassTooltip />} />
              <Bar dataKey="reach" name="Reach" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="engagement" name="Engagement" fill="#A78BFA" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* ── Engagement Over Time ── */}
      <GlassCard hover={false} accent="purple" className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Engagement Over Time</h2>
          <div className="flex gap-1 bg-white/5 rounded-lg p-0.5 overflow-x-auto scrollbar-none">
            {['All', ...platformData.map((p) => p.platform)].map((p) => (
              <button
                key={p}
                onClick={() => setPlatformFilter(p)}
                className={cn(
                  'px-2 py-1 rounded-md text-xs font-medium transition-all',
                  platformFilter === p
                    ? 'bg-white/10 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                )}
              >
                {p === 'All' ? 'All' : p.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={engagementChartData}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.35} />
                  <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: '#6B7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={Math.max(0, Math.floor(engagementChartData.length / 10))}
              />
              <YAxis
                tick={{ fill: '#6B7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={fmtNum}
              />
              <Tooltip content={<GlassTooltip />} />
              <Area
                type="monotone"
                dataKey="engagement"
                name="Engagement"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#areaGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* ── Top Performing Posts ── */}
      <GlassCard hover={false} className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Top Performing Posts</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs border-b border-white/5">
                <th className="text-left py-3 px-2 font-medium">#</th>
                <th className="text-left py-3 px-2 font-medium">Platform</th>
                <th className="text-left py-3 px-2 font-medium">Caption</th>
                <th className="text-right py-3 px-2 font-medium">Reach</th>
                <th className="text-right py-3 px-2 font-medium">Engagement</th>
                <th className="text-right py-3 px-2 font-medium">Rate</th>
                <th className="text-left py-3 px-2 font-medium">Trend</th>
              </tr>
            </thead>
            <tbody>
              {topPosts.map((post, i) => (
                <tr
                  key={post.id}
                  className={cn(
                    'border-b border-white/5 hover:bg-white/5 transition-colors',
                    i % 2 === 0 ? 'bg-white/[0.02]' : ''
                  )}
                >
                  <td className="py-3 px-2 text-gray-500 font-mono">{i + 1}</td>
                  <td className="py-3 px-2">
                    <PlatformIcon platform={post.platform} size={22} />
                  </td>
                  <td className="py-3 px-2 text-gray-300 max-w-[240px] truncate">{post.caption}</td>
                  <td className="py-3 px-2 text-right text-gray-300 font-mono">{fmtNum(post.reach)}</td>
                  <td className="py-3 px-2 text-right text-gray-300 font-mono">{fmtNum(post.engagement)}</td>
                  <td className="py-3 px-2 text-right text-emerald-400 font-mono">{post.engagementRate}%</td>
                  <td className="py-3 px-2">
                    {post.trend && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 whitespace-nowrap">
                        {post.trend}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* ── Audience Demographics ── */}
      <h2 className="text-lg font-semibold text-white mb-4">Audience Demographics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
        {/* Age Groups */}
        <GlassCard hover={false}>
          <h3 className="text-sm font-medium text-gray-400 mb-4">Age Groups</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demographics.ageGroups} layout="vertical" barSize={14}>
                <XAxis
                  type="number"
                  tick={{ fill: '#6B7280', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  dataKey="range"
                  type="category"
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={42}
                />
                <Tooltip content={<GlassTooltip />} />
                <Bar dataKey="percentage" name="Percentage" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Top Countries */}
        <GlassCard hover={false}>
          <h3 className="text-sm font-medium text-gray-400 mb-4">Top Countries</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demographics.countries} layout="vertical" barSize={14}>
                <XAxis
                  type="number"
                  tick={{ fill: '#6B7280', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip content={<GlassTooltip />} />
                <Bar dataKey="percentage" name="Percentage" fill="#A78BFA" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Gender */}
        <GlassCard hover={false}>
          <h3 className="text-sm font-medium text-gray-400 mb-4">Gender</h3>
          <div className="h-52 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={demographics.gender}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="percentage"
                  nameKey="type"
                  strokeWidth={0}
                >
                  {demographics.gender.map((_, i) => (
                    <Cell key={i} fill={GENDER_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip content={<GlassTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-gray-400 text-xs">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* ── Best Posting Times Heatmap ── */}
      <GlassCard hover={false} accent="purple" className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Best Posting Times</h2>
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Hour labels */}
            <div className="flex ml-10 mb-1">
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="flex-1 text-center text-[9px] text-gray-600 font-mono">
                  {h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`}
                </div>
              ))}
            </div>

            {/* Rows */}
            {heatmapData.map((row, dayIdx) => (
              <div key={dayIdx} className="flex items-center mb-0.5">
                <span className="w-10 text-xs text-gray-500 text-right pr-2 shrink-0">
                  {DAY_LABELS[dayIdx]}
                </span>
                <div className="flex flex-1 gap-0.5">
                  {row.map((value, hourIdx) => {
                    const isHovered =
                      hoveredHeatCell?.day === dayIdx && hoveredHeatCell?.hour === hourIdx;
                    // Color intensity: low = dark, high = bright blue/green
                    const opacity = Math.max(0.08, value / 100);
                    const hue = value > 60 ? 142 : 217; // green for high, blue for medium
                    const sat = value > 30 ? '70%' : '50%';
                    const light = value > 60 ? '50%' : value > 30 ? '45%' : '20%';

                    return (
                      <div
                        key={hourIdx}
                        className={cn(
                          'flex-1 h-7 rounded-[3px] cursor-pointer transition-all relative',
                          isHovered && 'ring-1 ring-white/50 scale-110 z-10'
                        )}
                        style={{
                          backgroundColor: `hsla(${hue}, ${sat}, ${light}, ${opacity})`,
                        }}
                        onMouseEnter={() => setHoveredHeatCell({ day: dayIdx, hour: hourIdx })}
                        onMouseLeave={() => setHoveredHeatCell(null)}
                      >
                        {isHovered && (
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900/90 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white whitespace-nowrap z-20 shadow-xl">
                            {DAY_LABELS[dayIdx]}{' '}
                            {hourIdx === 0 ? '12am' : hourIdx < 12 ? `${hourIdx}am` : hourIdx === 12 ? '12pm' : `${hourIdx - 12}pm`}
                            {' — '}
                            <span className="font-bold">{value}</span>/100
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-3">
              <span className="text-[10px] text-gray-500">Low</span>
              <div className="flex gap-0.5">
                {[10, 25, 40, 55, 70, 85, 100].map((v) => {
                  const hue = v > 60 ? 142 : 217;
                  const opacity = Math.max(0.08, v / 100);
                  const light = v > 60 ? '50%' : v > 30 ? '45%' : '20%';
                  return (
                    <div
                      key={v}
                      className="w-5 h-3 rounded-sm"
                      style={{
                        backgroundColor: `hsla(${hue}, 70%, ${light}, ${opacity})`,
                      }}
                    />
                  );
                })}
              </div>
              <span className="text-[10px] text-gray-500">High</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ── Content Type Performance ── */}
      <GlassCard hover={false} accent="purple" className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Content Type Performance</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={contentTypePerformance} barGap={4}>
              <XAxis
                dataKey="type"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#6B7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={fmtNum}
              />
              <Tooltip content={<GlassTooltip />} />
              <Bar dataKey="avgReach" name="Avg Reach" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="avgEngagement" name="Avg Engagement" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </PageWrapper>
  );
}
