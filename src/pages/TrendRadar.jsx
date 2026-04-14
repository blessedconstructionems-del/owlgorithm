import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { RefreshCw, Search } from 'lucide-react';
import GlassCard from '@/components/shared/GlassCard';
import PageWrapper from '@/components/shared/PageWrapper';
import PlatformIcon from '@/components/shared/PlatformIcon';
import StatusBadge from '@/components/shared/StatusBadge';
import { refreshTrends, useTrendsData } from '@/data/trends';
import {
  buildPlatformMetrics,
  formatCompactNumber,
  getFreshnessState,
} from '@/lib/trendMetrics';

const SATURATION_OPTIONS = ['All', 'Emerging', 'Rising', 'Peak', 'Declining'];
const SORT_OPTIONS = [
  { value: 'opportunityScore', label: 'Opportunity' },
  { value: 'momentum', label: 'Momentum' },
  { value: 'growthVelocity', label: 'Growth velocity' },
];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-[#10151f] px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-500">{label}</p>
      <p className="mt-1 font-semibold text-white">{payload[0].value}</p>
    </div>
  );
}

export default function TrendRadar() {
  const { trends, status, error, lastUpdated } = useTrendsData();
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('All');
  const [saturation, setSaturation] = useState('All');
  const [sortBy, setSortBy] = useState('opportunityScore');
  const [selectedTrendId, setSelectedTrendId] = useState(null);

  const freshness = useMemo(() => getFreshnessState(lastUpdated), [lastUpdated]);

  const platformOptions = useMemo(() => (
    ['All', ...new Set(trends.flatMap((trend) => trend.platforms || []))]
  ), [trends]);

  const filteredTrends = useMemo(() => {
    const search = query.trim().toLowerCase();

    return [...trends]
      .filter((trend) => {
        if (platform !== 'All' && !(trend.platforms || []).includes(platform)) return false;
        if (saturation !== 'All' && trend.saturation !== saturation) return false;
        if (!search) return true;

        return [
          trend.name,
          trend.description,
          trend.category,
          ...(trend.platforms || []),
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(search));
      })
      .sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
  }, [platform, query, saturation, sortBy, trends]);

  const selectedTrend = filteredTrends.find((trend) => trend.id === selectedTrendId) || filteredTrends[0] || null;
  const platformMetrics = useMemo(
    () => (selectedTrend ? buildPlatformMetrics(selectedTrend) : []),
    [selectedTrend]
  );

  return (
    <PageWrapper className="space-y-6">
      <GlassCard hover={false} accent="cyan" className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <StatusBadge status={freshness.status} />
              <StatusBadge status={status === 'loading' || status === 'refreshing' ? 'running' : 'verified'} />
            </div>
            <h1 className="text-3xl font-bold text-white">Trend radar</h1>
            <p className="max-w-2xl text-sm text-gray-400">
              Filter the live trend cache, inspect individual items, and review their history and platform breakdown.
            </p>
          </div>

          <button
            onClick={refreshTrends}
            disabled={status === 'loading' || status === 'refreshing'}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={status === 'loading' || status === 'refreshing' ? 'animate-spin' : ''} />
            Refresh trends
          </button>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_220px_220px_220px]">
          <label className="relative block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search trends, platforms, or categories"
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-colors focus:border-blue-500/40"
            />
          </label>

          <select
            value={platform}
            onChange={(event) => setPlatform(event.target.value)}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none"
          >
            {platformOptions.map((option) => (
              <option key={option} value={option} className="bg-[#0f1219]">
                {option}
              </option>
            ))}
          </select>

          <select
            value={saturation}
            onChange={(event) => setSaturation(event.target.value)}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none"
          >
            {SATURATION_OPTIONS.map((option) => (
              <option key={option} value={option} className="bg-[#0f1219]">
                {option}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-[#0f1219]">
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <p className="text-xs text-gray-500">
          {filteredTrends.length} trends in view. Last update {freshness.relative}.
        </p>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}
      </GlassCard>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <GlassCard hover={false} accent="blue" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Trend list</h2>
            <p className="text-xs text-gray-500">{filteredTrends.length} results</p>
          </div>

          <div className="space-y-3">
            {filteredTrends.map((trend) => (
              <button
                key={trend.id}
                onClick={() => setSelectedTrendId(trend.id)}
                className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                  trend.id === selectedTrendId
                    ? 'border-blue-500/40 bg-blue-500/[0.08]'
                    : 'border-white/8 bg-white/[0.03] hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-white">{trend.name}</p>
                      <StatusBadge status={trend.saturation} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-400">{trend.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Score</p>
                    <p className="text-lg font-bold text-white">{trend.opportunityScore}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {(trend.platforms || []).slice(0, 4).map((item) => (
                      <PlatformIcon key={`${trend.id}-${item}`} platform={item} size={22} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">Momentum {trend.momentum}</p>
                </div>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard hover={false} accent="purple" className="space-y-5">
          {!selectedTrend ? (
            <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-8 text-center text-sm text-gray-400">
              Select a trend to inspect its detail.
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={selectedTrend.saturation} />
                    <span className="text-xs uppercase tracking-[0.18em] text-gray-500">{selectedTrend.category || selectedTrend.type}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">{selectedTrend.name}</h2>
                  <p className="text-sm text-gray-400">{selectedTrend.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-right">
                  <div>
                    <p className="text-xs text-gray-500">Opportunity</p>
                    <p className="text-xl font-bold text-white">{selectedTrend.opportunityScore}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Velocity</p>
                    <p className="text-xl font-bold text-white">{selectedTrend.growthVelocity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Momentum</p>
                    <p className="text-xl font-bold text-white">{selectedTrend.momentum}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Interest</p>
                    <p className="text-xl font-bold text-white">{selectedTrend.audienceInterest}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                  <h3 className="text-sm font-semibold text-white">Momentum history</h3>
                  <div className="mt-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedTrend.history || []}>
                        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Line type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                  <h3 className="text-sm font-semibold text-white">Platform breakdown</h3>
                  <div className="mt-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={platformMetrics}>
                        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="platform" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="engagement" radius={[6, 6, 0, 0]} fill="#06B6D4" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                  <h3 className="text-sm font-semibold text-white">AI read</h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-300">{selectedTrend.aiInsight}</p>
                </div>

                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                  <h3 className="text-sm font-semibold text-white">Signals</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-gray-500">Competition</p>
                      <p className="mt-1 text-sm font-medium text-white">{selectedTrend.competition}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Platforms</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {(selectedTrend.platforms || []).map((item) => (
                          <div key={`${selectedTrend.id}-detail-${item}`} className="flex items-center gap-2 rounded-full bg-white/[0.05] px-2.5 py-1 text-xs text-gray-300">
                            <PlatformIcon platform={item} size={16} />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">First seen</p>
                      <p className="mt-1 text-sm font-medium text-white">{selectedTrend.firstSeen || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Reach</p>
                      <p className="mt-1 text-sm font-medium text-white">
                        {formatCompactNumber(selectedTrend.metrics?.totalViews || 0)} views
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
