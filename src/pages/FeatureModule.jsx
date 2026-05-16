import { Link } from 'react-router-dom';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  FlaskConical,
  Heart,
  Link2,
  ShieldCheck,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';

import GlassCard from '@/components/shared/GlassCard';
import PageWrapper from '@/components/shared/PageWrapper';
import StatusBadge from '@/components/shared/StatusBadge';
import { useTrendsData } from '@/data/trends';
import { useScrapeStatus } from '@/hooks/useScrapeStatus';

const MODULES = {
  revenue: {
    title: 'Revenue God Mode',
    icon: Zap,
    accent: 'purple',
    summary: 'Offer paths, recovery loops, and monetization signals generated from live trend opportunities.',
    signals: ['High-opportunity trends', 'Offer fit', 'Recovery queue', 'Platform readiness'],
    empty: 'Revenue actions populate after live trends and connected publishing data are available.',
    primary: 'Open Creator Studio',
    primaryTo: '/media',
  },
  scheduler: {
    title: 'Scheduler',
    icon: Calendar,
    accent: 'blue',
    summary: 'Publishing windows, post queues, and best-time decisions driven by current trend momentum.',
    signals: ['Best-time windows', 'Draft readiness', 'Queued posts', 'Channel coverage'],
    empty: 'Scheduled posts appear after generated assets are connected to the publishing backend.',
    primary: 'Create a post',
    primaryTo: '/media',
  },
  analytics: {
    title: 'Analytics',
    icon: BarChart3,
    accent: 'cyan',
    summary: 'Performance views for content, platforms, and trend-backed decisions.',
    signals: ['Trend momentum', 'Content outcomes', 'Source health', 'Opportunity quality'],
    empty: 'Analytics populate after connected accounts send live post performance back to Owlgorithm.',
    primary: 'Review trends',
    primaryTo: '/trends',
  },
  abTesting: {
    title: 'A/B Testing',
    icon: FlaskConical,
    accent: 'amber',
    summary: 'Controlled hook, caption, creative, and timing tests for active social content.',
    signals: ['Hook variants', 'Caption variants', 'Creative tests', 'Timing tests'],
    empty: 'Tests appear after two or more live variants are scheduled or published.',
    primary: 'Build variants',
    primaryTo: '/media',
  },
  leaderboard: {
    title: 'Leaderboard',
    icon: Trophy,
    accent: 'emerald',
    summary: 'Ranked winners across trends, posts, channels, and content patterns.',
    signals: ['Top trends', 'Top channels', 'Top posts', 'Repeatable wins'],
    empty: 'Leaderboard rankings populate after live performance data is connected.',
    primary: 'Find opportunities',
    primaryTo: '/trends',
  },
  truthRadar: {
    title: 'Truth Radar',
    icon: ShieldCheck,
    accent: 'emerald',
    summary: 'Claim checks and guardrails before scripts, captions, and posts go live.',
    signals: ['Unsafe claims', 'Missing proof', 'Compliance notes', 'Caption guardrails'],
    empty: 'Truth Radar checks activate when scripts or captions are generated from Creator Studio.',
    primary: 'Create guarded content',
    primaryTo: '/media',
  },
  strategy: {
    title: 'Strategy',
    icon: Target,
    accent: 'blue',
    summary: 'A live strategy board that turns radar signals into channel moves and content sequences.',
    signals: ['Audience fit', 'Trend timing', 'Channel mix', 'Next moves'],
    empty: 'Strategy recommendations populate after live trend records are available.',
    primary: 'Open Trend Radar',
    primaryTo: '/trends',
  },
  platforms: {
    title: 'Platforms',
    icon: Link2,
    accent: 'purple',
    summary: 'Connected social channels, publishing readiness, and target configuration.',
    signals: ['Publishing credentials', 'Account profile', 'Channel targets', 'Delivery status'],
    empty: 'Platform connection status appears when backend social credentials are configured.',
    primary: 'Open Creator Studio',
    primaryTo: '/media',
  },
  wellness: {
    title: 'Wellness',
    icon: Heart,
    accent: 'rose',
    summary: 'Cadence, workload, and creator sustainability checks tied to the posting system.',
    signals: ['Posting load', 'Recovery windows', 'Consistency', 'Burnout risk'],
    empty: 'Wellness signals populate after scheduled and published post activity is available.',
    primary: 'Review schedule',
    primaryTo: '/scheduler',
  },
};

function topTrend(trends) {
  return [...trends].sort((a, b) => (b.opportunityScore || 0) - (a.opportunityScore || 0))[0] || null;
}

export default function FeatureModule({ moduleId }) {
  const module = MODULES[moduleId] || MODULES.strategy;
  const Icon = module.icon;
  const { trends, status, lastUpdated, serverAvailable } = useTrendsData(true);
  const scrapeStatus = useScrapeStatus(true);
  const bestTrend = topTrend(trends);
  const activeSources = Array.isArray(scrapeStatus.data?.sources)
    ? scrapeStatus.data.sources.filter((source) => source.status !== 'disabled').length
    : 0;

  return (
    <PageWrapper className="space-y-6">
      <GlassCard hover={false} accent={module.accent}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-blue-300">
              <Icon size={22} />
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap gap-2">
                <StatusBadge status={serverAvailable ? 'active' : 'idle'} />
                <StatusBadge status={status === 'ready' ? 'verified' : status} />
              </div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">{module.title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-400">{module.summary}</p>
            </div>
          </div>
          <Link
            to={module.primaryTo}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/[0.07]"
          >
            {module.primary}
          </Link>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Live trends', value: trends.length },
          { label: 'Active sources', value: activeSources },
          { label: 'High opportunity', value: trends.filter((trend) => (trend.opportunityScore || 0) >= 70).length },
          { label: 'Last refresh', value: lastUpdated ? new Date(lastUpdated).toLocaleDateString() : 'Waiting' },
        ].map((item) => (
          <GlassCard key={item.label} hover={false} className="!p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-gray-500">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-white">{item.value}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <GlassCard hover={false} accent={module.accent} className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Signal Inputs</h2>
          <div className="grid gap-3">
            {module.signals.map((signal) => (
              <div key={signal} className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                <CheckCircle2 size={16} className="shrink-0 text-blue-300" />
                <span className="text-sm text-gray-300">{signal}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard hover={false} accent="blue" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Live Board</h2>
            <p className="mt-1 text-sm text-gray-500">{module.empty}</p>
          </div>

          {bestTrend ? (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-gray-500">Radar pick</p>
              <p className="mt-2 text-base font-semibold text-white">{bestTrend.name}</p>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-400">
                {bestTrend.description || bestTrend.aiInsight || 'Live trend selected from the current radar cache.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-xs font-semibold text-gray-300">
                  Opportunity {bestTrend.opportunityScore || 0}
                </span>
                <StatusBadge status={bestTrend.saturation || 'draft'} />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-8 text-center">
              <p className="text-sm font-semibold text-white">Waiting for live data</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">
                This section is restored, but it will not invent fake posts, fake revenue, or fake analytics. Connect the backend inputs and it fills itself.
              </p>
            </div>
          )}
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
