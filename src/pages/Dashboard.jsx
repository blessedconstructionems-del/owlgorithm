import { createElement, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Clock,
  Database,
  Link2,
  Moon,
  RefreshCw,
  Send,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import PageWrapper from '@/components/shared/PageWrapper';
import PlatformIcon from '@/components/shared/PlatformIcon';
import SignalMark from '@/components/shared/SignalMark';
import { refreshTrends, useTrendsData } from '@/data/trends';
import TrendPulseRadar from '@/components/dashboard/TrendPulseRadar';
import TrendMediaPreview from '@/components/trends/TrendMediaPreview';
import {
  aggregatePlatforms,
  aggregateTrendHistory,
  formatCompactNumber,
  getFastestGrowing,
  getFreshnessState,
  getTopOpportunities,
} from '@/lib/trendMetrics';
import {
  getCreatorNicheLabel,
  getCreatorPlatformSummary,
  tailorTrendsForCreator,
} from '@/lib/creatorProfile';

const DASHBOARD_MOTION = {
  container: { animate: { transition: { staggerChildren: 0.07 } } },
  item: {
    initial: { opacity: 0, y: 18 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  },
};

const DASHBOARD_LIMITS = {
  primaryOpportunityScore: 70,
  visiblePlatforms: 4,
  opportunityListSize: 3,
  chartPoints: 14,
};

const CHART_STYLE = {
  areaStrokeWidth: 2.5,
  activeDotRadius: 5,
  activeDotStrokeWidth: 3,
};

const SATURATION_ORDER = ['emerging', 'rising', 'peak', 'declining'];

const SATURATION_LABELS = {
  emerging: 'Emerging',
  rising: 'Rising',
  peak: 'Peak',
  declining: 'Declining',
};

const WINDOW_BY_SATURATION = {
  emerging: 'Early window',
  rising: 'Move this week',
  peak: 'Act today',
  declining: 'Avoid unless owned',
};

const NEXT_ACTIONS = [
  {
    icon: Send,
    title: 'Build a post',
    detail: 'Use the strongest trend and publish path.',
    to: '/post-now',
  },
  {
    icon: Link2,
    title: 'Connect channels',
    detail: 'Verify Upload-Post accounts before publishing.',
    to: '/platforms',
  },
  {
    icon: Moon,
    title: 'Queue overnight',
    detail: 'Send the best signals into Night Watch.',
    to: '/night-watch',
  },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatUpdatedLabel(lastUpdated) {
  if (!lastUpdated) return 'Not refreshed yet';

  try {
    return format(parseISO(lastUpdated), 'MMM d, h:mm a');
  } catch {
    return lastUpdated;
  }
}

function formatSignedPercent(value) {
  const numeric = Number(value) || 0;
  const sign = numeric > 0 ? '+' : '';
  return `${sign}${numeric}%`;
}

function countSaturation(trends) {
  return trends.reduce((counts, trend) => {
    const key = trend.saturation?.toLowerCase();
    if (SATURATION_ORDER.includes(key)) {
      counts[key] += 1;
    }
    return counts;
  }, {
    emerging: 0,
    rising: 0,
    peak: 0,
    declining: 0,
  });
}

function averageBy(trends, key) {
  if (!trends.length) return 0;
  const total = trends.reduce((sum, trend) => sum + (Number(trend[key]) || 0), 0);
  return Math.round(total / trends.length);
}

function getMarketLabel(avgMomentum, avgVelocity) {
  if (avgVelocity >= 10 || avgMomentum >= 70) return 'Accelerating';
  if (avgVelocity >= 3) return 'Building';
  if (avgVelocity <= -3) return 'Cooling';
  return 'Stable';
}

function getStatusTone({ serverAvailable, hasTrends, isLoading, freshness }) {
  if (isLoading) return 'info';
  if (!serverAvailable && !hasTrends) return 'danger';
  if (freshness?.stale) return 'warning';
  return 'success';
}

function buildOpportunityReason(trend) {
  if (!trend) return 'Waiting for live trend records from the backend.';

  const reasons = [];
  const saturation = trend.saturation?.toLowerCase();
  const competition = trend.competition?.toLowerCase();

  if ((trend.opportunityScore || 0) >= DASHBOARD_LIMITS.primaryOpportunityScore) {
    reasons.push('strong opportunity score');
  }
  if (saturation === 'emerging' || saturation === 'rising') {
    reasons.push(WINDOW_BY_SATURATION[saturation].toLowerCase());
  }
  if ((trend.growthVelocity || 0) > 0) {
    reasons.push(`${formatSignedPercent(trend.growthVelocity)} velocity`);
  }
  if (competition === 'low') {
    reasons.push('low competition');
  }

  return reasons.length
    ? reasons.slice(0, 3).join(' / ')
    : 'Best available score from the current live feed.';
}

function getPrimaryPlatformLabel(platforms) {
  if (!platforms.length) return 'No source yet';
  if (platforms.length === 1) return platforms[0].label;
  return `${platforms[0].label} + ${platforms.length - 1}`;
}

function DashboardSurface({ className, children, ...props }) {
  return (
    <section className={cn('dashboard-surface', className)} {...props}>
      {children}
    </section>
  );
}

function DashboardChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="dashboard-chart-tooltip">
      <p className="dashboard-chart-tooltip-label">{label}</p>
      <p className="dashboard-chart-tooltip-value">
        {Math.round(payload[0].value).toLocaleString()}
      </p>
    </div>
  );
}

function EmptyDataPanel({ title, message, actionTo, actionLabel }) {
  return (
    <div className="dashboard-empty-state">
      <Database size={20} />
      <h3>{title}</h3>
      <p>{message}</p>
      {actionTo ? (
        <Link to={actionTo} className="dashboard-text-link">
          {actionLabel}
          <ArrowRight size={14} />
        </Link>
      ) : null}
    </div>
  );
}

function HeaderStatus({ tone, label, detail }) {
  return (
    <div className={cn('dashboard-status-pill', `dashboard-tone-${tone}`)}>
      <span className="dashboard-status-dot" />
      <span>{label}</span>
      <span className="dashboard-status-detail">{detail}</span>
    </div>
  );
}

function PlatformStack({ platforms }) {
  const visiblePlatforms = platforms.slice(0, DASHBOARD_LIMITS.visiblePlatforms);
  const remaining = platforms.length - visiblePlatforms.length;

  if (!visiblePlatforms.length) {
    return <span className="dashboard-muted-text">No source platforms</span>;
  }

  return (
    <div className="dashboard-platform-stack">
      {visiblePlatforms.map((platform) => (
        <PlatformIcon key={platform} platform={platform} size={20} />
      ))}
      {remaining > 0 ? (
        <span className="dashboard-platform-overflow">+{remaining}</span>
      ) : null}
    </div>
  );
}

function IntelligenceRail({ stats, freshness, bestTrend }) {
  const freshnessDetail = freshness.relative === 'never' ? 'No cache' : freshness.relative;
  const bestWindow = WINDOW_BY_SATURATION[bestTrend?.saturation?.toLowerCase()] || 'Awaiting signal';
  const crowding = stats.peak + stats.declining;

  return (
    <DashboardSurface className="dashboard-intelligence-rail">
      <div className="dashboard-section-heading">
        <div>
          <p className="dashboard-eyebrow">Decision Signal</p>
          <h2>Intelligence Rail</h2>
        </div>
        <Sparkles size={18} />
      </div>

      <div className="dashboard-rail-list">
        <RailRow
          icon={Activity}
          label="Live signal"
          value={formatCompactNumber(stats.count)}
          detail={`${stats.activePlatforms} public sources`}
          tone="info"
        />
        <RailRow
          icon={Clock}
          label="Best window"
          value={bestWindow}
          detail={bestTrend?.name || 'No trend selected yet'}
          tone="success"
        />
        <RailRow
          icon={Zap}
          label="Opportunity"
          value={bestTrend ? `${bestTrend.opportunityScore || 0}` : '0'}
          detail={bestTrend ? buildOpportunityReason(bestTrend) : 'Waiting for scraper results'}
          tone="warning"
        />
        <RailRow
          icon={BarChart3}
          label="Crowding risk"
          value={formatCompactNumber(crowding)}
          detail={`${stats.peak} peak / ${stats.declining} declining`}
          tone={crowding > stats.count / 2 ? 'danger' : 'success'}
        />
      </div>

      <div className="dashboard-freshness-line">
        <span>Feed freshness</span>
        <strong>{freshnessDetail}</strong>
      </div>
    </DashboardSurface>
  );
}

function RailRow({ icon: Icon, label, value, detail, tone }) {
  const isNumeric = /^[0-9+-]/.test(`${value}`);

  return (
    <div className="dashboard-rail-row">
      <div className={cn('dashboard-rail-icon', `dashboard-tone-${tone}`)}>
        {createElement(Icon, { size: 16 })}
      </div>
      <div className="dashboard-rail-copy">
        <span>{label}</span>
        <strong className={cn(isNumeric && 'dashboard-mono dashboard-number')}>{value}</strong>
        <p>{detail}</p>
      </div>
    </div>
  );
}

function OpportunityBrief({ bestTrend, opportunities }) {
  if (!bestTrend) {
    return (
      <DashboardSurface className="dashboard-opportunity-brief">
        <div className="dashboard-section-heading">
          <div>
            <p className="dashboard-eyebrow">Next Move</p>
            <h2>Opportunity Brief</h2>
          </div>
          <TrendingUp size={18} />
        </div>
        <EmptyDataPanel
          title="No opportunity ranked yet"
          message="The brief appears when the backend trend feed includes live opportunity scores."
          actionTo="/trends"
          actionLabel="Open Trend Radar"
        />
      </DashboardSurface>
    );
  }

  return (
    <DashboardSurface className="dashboard-opportunity-brief">
      <div className="dashboard-section-heading">
        <div>
          <p className="dashboard-eyebrow">Next Move</p>
          <h2>Opportunity Brief</h2>
        </div>
        <TrendingUp size={18} />
      </div>

      <div className="dashboard-opportunity-main">
        <span className="dashboard-opportunity-score dashboard-mono">
          {bestTrend.opportunityScore || 0}
        </span>
        <div>
          <h3>{bestTrend.name}</h3>
          <p>{buildOpportunityReason(bestTrend)}</p>
        </div>
      </div>

      <div className="dashboard-opportunity-meta">
        <div>
          <span>Saturation</span>
          <strong>{bestTrend.saturation || 'Unknown'}</strong>
        </div>
        <div>
          <span>Momentum</span>
          <strong>{bestTrend.momentum || 0}</strong>
        </div>
        <div>
          <span>Velocity</span>
          <strong>{formatSignedPercent(bestTrend.growthVelocity)}</strong>
        </div>
      </div>

      <div className="dashboard-opportunity-sources">
        <PlatformStack platforms={bestTrend.platforms || []} />
      </div>

      <TrendMediaPreview
        trend={bestTrend}
        eyebrow="Source Media"
        compact
        className="dashboard-media-slot"
      />

      <div className="dashboard-ranked-list">
        {opportunities.slice(1, DASHBOARD_LIMITS.opportunityListSize).map((trend, index) => (
          <Link key={trend.id || trend.name} to="/trends" className="dashboard-ranked-row">
            <span className="dashboard-mono">0{index + 2}</span>
            <strong>{trend.name}</strong>
            <em>{trend.opportunityScore || 0}</em>
          </Link>
        ))}
      </div>

      <div className="dashboard-action-row">
        <Link to="/post-now" className="dashboard-button dashboard-button-primary">
          Build from this
          <ArrowRight size={16} />
        </Link>
        <Link to="/trends" className="dashboard-button dashboard-button-secondary">
          Inspect
          <ArrowUpRight size={15} />
        </Link>
      </div>
    </DashboardSurface>
  );
}

function MarketDirection({ stats, history, fastestTrend }) {
  return (
    <DashboardSurface className="dashboard-market-direction">
      <div className="dashboard-section-heading">
        <div>
          <p className="dashboard-eyebrow">Market Direction</p>
          <h2>{stats.marketLabel}</h2>
        </div>
        <BarChart3 size={18} />
      </div>

      <div className="dashboard-market-metrics">
        <div>
          <span>Avg momentum</span>
          <strong className="dashboard-mono">{stats.avgMomentum}</strong>
        </div>
        <div>
          <span>Avg velocity</span>
          <strong className="dashboard-mono">{formatSignedPercent(stats.avgVelocity)}</strong>
        </div>
      </div>

      {history.length > 1 ? (
        <div className="dashboard-chart-frame">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ className: 'dashboard-chart-axis' }}
              />
              <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip
                content={<DashboardChartTooltip />}
                cursor={{ stroke: 'var(--dash-border-strong)' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--dash-accent-primary)"
                strokeWidth={CHART_STYLE.areaStrokeWidth}
                fill="url(#dashboardMomentumFill)"
                activeDot={{
                  r: CHART_STYLE.activeDotRadius,
                  fill: 'var(--dash-accent-primary)',
                  stroke: 'var(--dash-bg-canvas)',
                  strokeWidth: CHART_STYLE.activeDotStrokeWidth,
                }}
              />
              <defs>
                <linearGradient id="dashboardMomentumFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--dash-accent-primary)" stopOpacity="0.24" />
                  <stop offset="100%" stopColor="var(--dash-accent-primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyDataPanel
          title="No momentum history"
          message="History appears once live trend records include two or more dated readings."
        />
      )}

      <div className="dashboard-saturation-grid">
        {SATURATION_ORDER.map((key) => (
          <SaturationBar
            key={key}
            label={SATURATION_LABELS[key]}
            value={stats[key]}
            total={Math.max(stats.count, 1)}
            tone={key}
          />
        ))}
      </div>

      <div className="dashboard-freshness-line">
        <span>Fastest riser</span>
        <strong>{fastestTrend?.name || 'Awaiting signal'}</strong>
      </div>
    </DashboardSurface>
  );
}

function SaturationBar({ label, value, total, tone }) {
  const width = `${Math.round((value / total) * 100)}%`;

  return (
    <div className="dashboard-saturation-row">
      <div>
        <span>{label}</span>
        <strong className="dashboard-mono">{value}</strong>
      </div>
      <div className="dashboard-saturation-track">
        <span
          className={cn('dashboard-saturation-fill', `dashboard-saturation-${tone}`)}
          style={{ '--dash-bar-width': width }}
        />
      </div>
    </div>
  );
}

function NextActionBar({ bestTrend, platformLabel }) {
  return (
    <DashboardSurface className="dashboard-next-actions">
      <div className="dashboard-section-heading">
        <div>
          <p className="dashboard-eyebrow">Action Path</p>
          <h2>Next Action</h2>
        </div>
        <Zap size={18} />
      </div>

      <p className="dashboard-next-summary">
        {bestTrend
          ? `Best current path: turn "${bestTrend.name}" into a post for ${platformLabel}.`
          : 'Connect the feed and channels, then Owlgorithm will recommend a publishing path.'}
      </p>

      <div className="dashboard-action-list">
        {NEXT_ACTIONS.map((action) => {
          return (
            <Link key={action.title} to={action.to} className="dashboard-action-link">
              <span>
                {createElement(action.icon, { size: 17 })}
              </span>
              <div>
                <strong>{action.title}</strong>
                <p>{action.detail}</p>
              </div>
              <ArrowRight size={15} />
            </Link>
          );
        })}
      </div>
    </DashboardSurface>
  );
}

export default function Dashboard() {
  const { user, creatorProfile, creatorProfileComplete } = useApp();
  const {
    trends: trendFeed,
    status: trendsStatus,
    error: trendsError,
    lastUpdated,
    serverAvailable,
  } = useTrendsData(true);
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const hasTrends = trendFeed.length > 0;
  const isLoading = trendsStatus === 'loading' || trendsStatus === 'idle';
  const isRefreshing = trendsStatus === 'refreshing' || manualRefreshing;
  const tailoredTrendFeed = useMemo(
    () => tailorTrendsForCreator(trendFeed, creatorProfile),
    [creatorProfile, trendFeed],
  );
  const channelFocus = creatorProfileComplete
    ? `${getCreatorNicheLabel(creatorProfile)} on ${getCreatorPlatformSummary(creatorProfile)}`
    : null;

  const opportunities = useMemo(
    () => getTopOpportunities(tailoredTrendFeed, DASHBOARD_LIMITS.opportunityListSize),
    [tailoredTrendFeed],
  );
  const fastestTrends = useMemo(() => getFastestGrowing(tailoredTrendFeed, 1), [tailoredTrendFeed]);
  const history = useMemo(
    () => aggregateTrendHistory(tailoredTrendFeed, DASHBOARD_LIMITS.chartPoints),
    [tailoredTrendFeed],
  );
  const platforms = useMemo(() => aggregatePlatforms(tailoredTrendFeed), [tailoredTrendFeed]);
  const freshness = useMemo(() => getFreshnessState(lastUpdated), [lastUpdated]);

  const stats = useMemo(() => {
    const saturationCounts = countSaturation(tailoredTrendFeed);
    const avgMomentum = averageBy(tailoredTrendFeed, 'momentum');
    const avgVelocity = averageBy(tailoredTrendFeed, 'growthVelocity');

    return {
      ...saturationCounts,
      count: tailoredTrendFeed.length,
      activePlatforms: platforms.length,
      avgMomentum,
      avgVelocity,
      marketLabel: getMarketLabel(avgMomentum, avgVelocity),
    };
  }, [platforms.length, tailoredTrendFeed]);

  const bestTrend = opportunities[0] || null;
  const fastestTrend = fastestTrends[0] || null;
  const platformLabel = getPrimaryPlatformLabel(platforms);
  const statusTone = getStatusTone({ serverAvailable, hasTrends, isLoading, freshness });
  const updatedLabel = formatUpdatedLabel(lastUpdated);

  async function handleRefresh() {
    setManualRefreshing(true);
    try {
      await refreshTrends();
    } finally {
      setManualRefreshing(false);
    }
  }

  return (
    <PageWrapper className="dashboard-page">
      <motion.div
        variants={DASHBOARD_MOTION.container}
        initial="initial"
        animate="animate"
        className="dashboard-stack"
      >
        <motion.header variants={DASHBOARD_MOTION.item} className="dashboard-header">
          <div className="dashboard-title-block">
            <SignalMark className="dashboard-product-mark" />
            <div>
              <p className="dashboard-eyebrow">Owlgorithm Dashboard</p>
              <h1>Signal Command</h1>
              <p>
                {hasTrends
                  ? `${getGreeting()}, ${user?.name || 'there'}. Tracking ${formatCompactNumber(stats.count)} tailored signals${channelFocus ? ` for ${channelFocus}` : ` across ${platformLabel}`}.`
                  : `${getGreeting()}, ${user?.name || 'there'}. Live trend intelligence appears here as soon as the backend feed returns data.`}
              </p>
            </div>
          </div>

          <div className="dashboard-header-actions">
            <HeaderStatus
              tone={statusTone}
              label={freshness.label}
              detail={updatedLabel}
            />
            <button
              type="button"
              className="dashboard-button dashboard-button-secondary"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw size={16} className={cn(isRefreshing && 'dashboard-spin')} />
              Refresh
            </button>
            <Link to="/post-now" className="dashboard-button dashboard-button-primary">
              Create
              <ArrowRight size={16} />
            </Link>
          </div>
        </motion.header>

        {trendsError ? (
          <motion.div
            variants={DASHBOARD_MOTION.item}
            className="dashboard-alert"
            role="status"
            aria-live="polite"
          >
            <AlertCircle size={18} />
            <span>{trendsError}</span>
          </motion.div>
        ) : null}

        <motion.div variants={DASHBOARD_MOTION.item} className="dashboard-primary-grid">
          <TrendPulseRadar trendItems={tailoredTrendFeed} />
          <IntelligenceRail stats={stats} freshness={freshness} bestTrend={bestTrend} />
        </motion.div>

        <motion.div variants={DASHBOARD_MOTION.item} className="dashboard-decision-grid">
          <OpportunityBrief bestTrend={bestTrend} opportunities={opportunities} />
          <MarketDirection stats={stats} history={history} fastestTrend={fastestTrend} />
          <NextActionBar bestTrend={bestTrend} platformLabel={platformLabel} />
        </motion.div>
      </motion.div>
    </PageWrapper>
  );
}
