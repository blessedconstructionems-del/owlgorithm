import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  Database,
  Radar,
  RefreshCw,
  TrendingUp,
  Waypoints,
} from 'lucide-react';
import GlassCard from '@/components/shared/GlassCard';
import PageWrapper from '@/components/shared/PageWrapper';
import PlatformIcon from '@/components/shared/PlatformIcon';
import StatusBadge from '@/components/shared/StatusBadge';
import { refreshTrends, useTrendsData } from '@/data/trends';
import { useScrapeStatus } from '@/hooks/useScrapeStatus';
import {
  aggregatePlatforms,
  aggregateTrendHistory,
  formatCompactNumber,
  getEmergingCount,
  getFastestGrowing,
  getFreshnessState,
  getTopOpportunities,
} from '@/lib/trendMetrics';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-[#10151f] px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-500">{label}</p>
      <p className="mt-1 font-semibold text-white">{payload[0].value}</p>
    </div>
  );
}

function StatCard({ icon, label, value, detail }) {
  const Icon = icon;

  return (
    <GlassCard hover={false} accent="blue" className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">{label}</span>
        <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
          <Icon size={16} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className="mt-1 text-xs text-gray-500">{detail}</p>
      </div>
    </GlassCard>
  );
}

export default function Dashboard() {
  const { trends, status, error, lastUpdated, serverAvailable } = useTrendsData();
  const { data: scrapeStatus, loading: scrapeLoading, refresh: refreshScrapeStatus } = useScrapeStatus();
  const [manualRefresh, setManualRefresh] = useState(false);

  const freshness = useMemo(() => getFreshnessState(lastUpdated), [lastUpdated]);
  const platformSummary = useMemo(() => aggregatePlatforms(trends).slice(0, 5), [trends]);
  const topOpportunities = useMemo(() => getTopOpportunities(trends), [trends]);
  const fastestGrowing = useMemo(() => getFastestGrowing(trends), [trends]);
  const history = useMemo(() => aggregateTrendHistory(trends), [trends]);
  const opportunityCount = useMemo(() => getEmergingCount(trends), [trends]);

  const sourceStatuses = useMemo(() => (
    Object.entries(scrapeStatus || {})
      .filter(([key, value]) => !['lastFullRun', 'scrapeInProgress', 'enabled'].includes(key) && value && typeof value === 'object')
      .map(([key, value]) => ({
        id: key,
        label: key,
        ...value,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  ), [scrapeStatus]);

  async function handleRefresh() {
    setManualRefresh(true);
    await Promise.all([refreshTrends(), refreshScrapeStatus()]);
    setManualRefresh(false);
  }

  const isRefreshing = manualRefresh || status === 'loading' || status === 'refreshing' || scrapeLoading;

  return (
    <PageWrapper className="space-y-6">
      <GlassCard hover={false} accent="cyan" className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <StatusBadge status={freshness.status} />
              <StatusBadge status={scrapeStatus?.enabled ? 'active' : 'disabled'} />
            </div>
            <h1 className="text-3xl font-bold text-white">Live trend desk</h1>
            <p className="max-w-2xl text-sm text-gray-400">
              The dashboard below is driven by the current trend cache and scraper status. It is limited to the surfaces backed by live data in this repo.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh data
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            icon={Database}
            label="Tracked trends"
            value={trends.length}
            detail={freshness.relative === 'never' ? 'No successful sync yet' : `Last sync ${freshness.relative}`}
          />
          <StatCard
            icon={TrendingUp}
            label="High opportunity"
            value={opportunityCount}
            detail="Opportunity score 60 or above"
          />
          <StatCard
            icon={Waypoints}
            label="Platforms"
            value={platformSummary.length}
            detail="Platforms represented in the current cache"
          />
          <StatCard
            icon={Radar}
            label="Scraper"
            value={scrapeStatus?.enabled ? 'On' : 'Off'}
            detail={scrapeStatus?.enabled ? 'Background refresh enabled' : 'Serving cached trend data'}
          />
        </div>

        {(!serverAvailable && trends.length === 0) || error ? (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-200">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">The API is not returning trend data.</p>
              <p className="mt-1 text-red-200/80">{error || 'Start the Node server or verify the API endpoint.'}</p>
            </div>
          </div>
        ) : null}

        {freshness.stale && trends.length > 0 ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-sm text-amber-100">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">The current cache is stale.</p>
              <p className="mt-1 text-amber-100/80">
                Data was last refreshed {freshness.relative}. Re-enable scheduled scraping before sending users here.
              </p>
            </div>
          </div>
        ) : null}
      </GlassCard>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassCard hover={false} accent="purple" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Momentum history</h2>
              <p className="text-sm text-gray-500">Average trend momentum across the latest cached history points.</p>
            </div>
            <StatusBadge status={freshness.status} />
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="dashboard-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#dashboard-area)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard hover={false} accent="emerald" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Platform footprint</h2>
            <p className="text-sm text-gray-500">Where the current cache is finding trend activity.</p>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformSummary}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="trendCount" radius={[6, 6, 0, 0]} fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <GlassCard hover={false} accent="blue" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Top opportunities</h2>
            <p className="text-sm text-gray-500">Highest opportunity scores in the current trend feed.</p>
          </div>

          <div className="space-y-3">
            {topOpportunities.map((trend) => (
              <div key={trend.id} className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-white">{trend.name}</p>
                      <StatusBadge status={trend.saturation} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-400">{trend.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Opportunity</p>
                    <p className="text-lg font-bold text-white">{trend.opportunityScore}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {(trend.platforms || []).slice(0, 4).map((platform) => (
                      <PlatformIcon key={`${trend.id}-${platform}`} platform={platform} size={22} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatCompactNumber(trend.metrics?.totalViews || 0)} views
                  </p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard hover={false} accent="amber" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Fastest movers</h2>
            <p className="text-sm text-gray-500">Highest growth velocity in the current trend feed.</p>
          </div>

          <div className="space-y-3">
            {fastestGrowing.map((trend) => (
              <div key={trend.id} className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{trend.name}</p>
                    <p className="mt-1 text-sm text-gray-400">{trend.aiInsight}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Velocity</p>
                    <p className="text-lg font-bold text-white">{trend.growthVelocity}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard hover={false} accent="rose" className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Source health</h2>
          <p className="text-sm text-gray-500">Per-platform scrape status from the backend.</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {sourceStatuses.map((source) => (
            <div key={source.id} className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-white capitalize">{source.label}</p>
                <StatusBadge status={source.status === 'ok' ? 'active' : source.status} />
              </div>
              <p className="mt-3 text-sm text-gray-400">{source.count || 0} results in the last run</p>
              <p className="mt-1 text-xs text-gray-500">{source.error || source.lastRun || 'No run recorded'}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </PageWrapper>
  );
}
