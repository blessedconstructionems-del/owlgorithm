import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Download,
  Moon,
  Radar,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import GlassCard from '@/components/shared/GlassCard';
import PageWrapper from '@/components/shared/PageWrapper';
import StatusBadge from '@/components/shared/StatusBadge';
import PlatformIcon from '@/components/shared/PlatformIcon';
import { refreshTrends, useTrendsData } from '@/data/trends';
import { useScrapeStatus } from '@/hooks/useScrapeStatus';
import { cn } from '@/lib/utils';

function valueOf(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatTimestamp(value) {
  if (!value) return 'Not available';

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function classifyTrend(trend) {
  const velocity = valueOf(trend.growthVelocity);
  const opportunity = valueOf(trend.opportunityScore);
  const momentum = valueOf(trend.momentum);
  const saturation = `${trend.saturation || ''}`.toLowerCase();
  const competition = `${trend.competition || ''}`.toLowerCase();

  if (velocity < 0 || saturation === 'declining') {
    return {
      label: 'Cooling',
      tone: 'rose',
      action: 'Do not build new evergreen content from this until it reverses.',
    };
  }

  if (competition === 'high' && saturation === 'peak') {
    return {
      label: 'Crowded',
      tone: 'amber',
      action: 'Use only if you have a sharper angle than the current feed.',
    };
  }

  if (opportunity >= 70 && velocity >= 10) {
    return {
      label: 'Build',
      tone: 'emerald',
      action: 'Create a short post or media asset before the next refresh.',
    };
  }

  if (momentum >= 75 || velocity >= 8) {
    return {
      label: 'Watch',
      tone: 'blue',
      action: 'Keep this on the board and prepare a draft angle.',
    };
  }

  return {
    label: 'Hold',
    tone: 'slate',
    action: 'Track it, but do not spend production time yet.',
  };
}

function buildWatchReport(trends, lastUpdated, scrapeStatus) {
  const enriched = trends.map((trend) => ({
    ...trend,
    nightScore: Math.round(
      valueOf(trend.opportunityScore) * 0.42
      + Math.max(valueOf(trend.growthVelocity), 0) * 0.26
      + valueOf(trend.momentum) * 0.24
      + (trend.platforms?.length || 0) * 2,
    ),
    signal: classifyTrend(trend),
  })).sort((a, b) => b.nightScore - a.nightScore);

  const buildQueue = enriched.filter((trend) => trend.signal.label === 'Build').slice(0, 5);
  const watchQueue = enriched.filter((trend) => ['Watch', 'Hold'].includes(trend.signal.label)).slice(0, 6);
  const riskQueue = enriched.filter((trend) => ['Cooling', 'Crowded'].includes(trend.signal.label)).slice(0, 5);

  return {
    generatedAt: new Date().toISOString(),
    lastUpdated,
    scraper: {
      enabled: Boolean(scrapeStatus?.enabled),
      running: Boolean(scrapeStatus?.scrapeInProgress),
      lastFullRun: scrapeStatus?.lastFullRun || null,
    },
    buildQueue,
    watchQueue,
    riskQueue,
  };
}

function toneClasses(tone) {
  if (tone === 'emerald') return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200';
  if (tone === 'blue') return 'border-blue-500/20 bg-blue-500/10 text-blue-200';
  if (tone === 'amber') return 'border-amber-500/20 bg-amber-500/10 text-amber-200';
  if (tone === 'rose') return 'border-rose-500/20 bg-rose-500/10 text-rose-200';
  return 'border-white/10 bg-white/[0.04] text-gray-300';
}

function TrendRow({ trend, rank }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-xs font-bold text-gray-300">
              {rank}
            </span>
            <h3 className="truncate text-sm font-semibold text-white">{trend.name}</h3>
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-400">
            {trend.aiInsight || trend.description || trend.signal.action}
          </p>
        </div>

        <div className={cn('inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-semibold', toneClasses(trend.signal.tone))}>
          {trend.signal.label}
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-xs sm:grid-cols-4">
        <div className="rounded-lg bg-white/[0.03] px-3 py-2">
          <p className="text-gray-500">Night score</p>
          <p className="mt-1 font-semibold text-white">{trend.nightScore}</p>
        </div>
        <div className="rounded-lg bg-white/[0.03] px-3 py-2">
          <p className="text-gray-500">Momentum</p>
          <p className="mt-1 font-semibold text-white">{valueOf(trend.momentum)}</p>
        </div>
        <div className="rounded-lg bg-white/[0.03] px-3 py-2">
          <p className="text-gray-500">Growth</p>
          <p className="mt-1 font-semibold text-white">
            {valueOf(trend.growthVelocity) > 0 ? '+' : ''}
            {valueOf(trend.growthVelocity)}%
          </p>
        </div>
        <div className="rounded-lg bg-white/[0.03] px-3 py-2">
          <p className="text-gray-500">Opportunity</p>
          <p className="mt-1 font-semibold text-white">{valueOf(trend.opportunityScore)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {(trend.platforms || []).slice(0, 5).map((platform) => (
            <PlatformIcon key={platform} platform={platform} size={20} />
          ))}
          {(trend.platforms || []).length > 5 ? (
            <span className="text-xs text-gray-500">+{trend.platforms.length - 5}</span>
          ) : null}
        </div>

        <Link
          to={`/media?trend=${encodeURIComponent(trend.id)}`}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-200 transition-colors hover:bg-blue-500/15"
        >
          Build media
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

export default function NightWatch() {
  const { trends, status, error, lastUpdated, serverAvailable } = useTrendsData(true);
  const { data: scrapeStatus, refresh: refreshScrapeStatus } = useScrapeStatus(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState(null);

  const report = useMemo(
    () => buildWatchReport(trends, lastUpdated, scrapeStatus),
    [lastUpdated, scrapeStatus, trends],
  );

  const topTrend = report.buildQueue[0] || report.watchQueue[0] || null;
  const hasTrends = trends.length > 0;

  async function handleRefresh() {
    setRefreshing(true);
    setMessage(null);

    try {
      await Promise.all([refreshTrends(), refreshScrapeStatus()]);
      setMessage('Night Watch refreshed from the backend cache.');
    } catch (refreshError) {
      setMessage(refreshError.message);
    } finally {
      setRefreshing(false);
    }
  }

  function handleExport() {
    downloadJson('owlgorithm-night-watch.json', report);
    setMessage('Night Watch report exported.');
  }

  return (
    <PageWrapper className="space-y-6">
      <GlassCard hover={false} accent="blue" className="overflow-visible">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={serverAvailable ? 'active' : 'disabled'} />
              <StatusBadge status={scrapeStatus?.scrapeInProgress ? 'pending' : scrapeStatus?.enabled ? 'active' : 'disabled'} />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-blue-300">
                <Moon size={20} />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-white sm:text-3xl">Night Watch</h1>
                <p className="mt-1 text-sm leading-relaxed text-gray-400">
                  Overnight watchlist built from the live trend cache, not seeded demo data.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              disabled={!hasTrends}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={16} />
              Export report
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Live cache</p>
            <p className="mt-2 text-2xl font-bold text-white">{trends.length}</p>
            <p className="mt-1 text-xs text-gray-500">tracked trend records</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Last refresh</p>
            <p className="mt-2 text-sm font-semibold text-white">{formatTimestamp(lastUpdated || scrapeStatus?.lastFullRun)}</p>
            <p className="mt-1 text-xs text-gray-500">backend cache timestamp</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Build queue</p>
            <p className="mt-2 text-2xl font-bold text-white">{report.buildQueue.length}</p>
            <p className="mt-1 text-xs text-gray-500">items ready for media work</p>
          </div>
        </div>

        {message || error ? (
          <div className={cn(
            'mt-5 rounded-xl border px-4 py-3 text-sm',
            error ? 'border-red-500/20 bg-red-500/10 text-red-100' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
          )}>
            {error || message}
          </div>
        ) : null}
      </GlassCard>

      {!hasTrends && status !== 'loading' ? (
        <GlassCard hover={false} accent="amber" className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04] text-amber-300">
            <Radar size={22} />
          </div>
          <h2 className="text-lg font-semibold text-white">No live trend records yet</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-gray-400">
            Night Watch will populate after the scraper writes trend records to the backend cache.
          </p>
          <Link
            to="/trends"
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/[0.07]"
          >
            Open Trend Radar
            <ArrowRight size={15} />
          </Link>
        </GlassCard>
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <GlassCard hover={false} accent="emerald" className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                    <Sparkles size={18} className="text-emerald-300" />
                    Build Before Morning
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">Trends with enough momentum and opportunity to act on now.</p>
                </div>
                {topTrend ? (
                  <Link
                    to={`/media?trend=${encodeURIComponent(topTrend.id)}`}
                    className="hidden items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition-colors hover:bg-emerald-500/15 sm:inline-flex"
                  >
                    Open builder
                    <ArrowRight size={14} />
                  </Link>
                ) : null}
              </div>

              {report.buildQueue.length ? (
                <div className="space-y-3">
                  {report.buildQueue.map((trend, index) => (
                    <TrendRow key={trend.id} trend={trend} rank={index + 1} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-8 text-center">
                  <ShieldCheck size={22} className="mx-auto text-gray-500" />
                  <p className="mt-3 text-sm font-semibold text-white">No urgent builds right now</p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                    The current trend cache does not have a high-confidence build signal.
                  </p>
                </div>
              )}
            </GlassCard>

            <GlassCard hover={false} accent="blue" className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Watchlist</h2>
              <div className="space-y-3">
                {report.watchQueue.slice(0, 5).map((trend, index) => (
                  <div key={trend.id} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{index + 1}. {trend.name}</p>
                        <p className="mt-1 text-xs leading-relaxed text-gray-500">{trend.signal.action}</p>
                      </div>
                      <span className={cn('shrink-0 rounded-full border px-2 py-1 text-[11px] font-semibold', toneClasses(trend.signal.tone))}>
                        {trend.signal.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          <GlassCard hover={false} accent="rose" className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <AlertTriangle size={18} className="text-rose-300" />
              Risk Board
            </h2>
            {report.riskQueue.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {report.riskQueue.map((trend) => (
                  <div key={trend.id} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 text-sm font-semibold text-white">{trend.name}</p>
                      <span className={cn('shrink-0 rounded-full border px-2 py-1 text-[11px] font-semibold', toneClasses(trend.signal.tone))}>
                        {trend.signal.label}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-gray-400">{trend.signal.action}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-5 text-sm text-gray-400">
                No cooling or crowded signals are present in the current cache.
              </p>
            )}
          </GlassCard>
        </>
      )}
    </PageWrapper>
  );
}
