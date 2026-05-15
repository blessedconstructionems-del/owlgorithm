import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../shared/GlassCard';
import PlatformIcon from '../shared/PlatformIcon';

function formatTimestamp(value) {
  if (!value) return 'Unknown';
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

function getPlatformMetrics(trend, platform) {
  return trend.metrics?.platforms?.[platform] || {};
}

const TrendDNA = memo(function TrendDNA({ trend }) {
  const diffusion = useMemo(() => {
    const source = Array.isArray(trend.diffusion) ? trend.diffusion : [];
    return source
      .filter((item) => item?.platform)
      .map((item) => ({
        platform: item.platform,
        timestamp: item.timestamp || trend.firstSeen || null,
        metrics: getPlatformMetrics(trend, item.platform),
      }));
  }, [trend]);

  if (diffusion.length === 0) {
    return null;
  }

  return (
    <GlassCard hover={false} className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-white tracking-wide">
          Source Path
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Ordered by the scraper timestamps and platform metrics returned by the backend.
        </p>
      </div>

      <div className="space-y-3">
        {diffusion.map((item, index) => {
          const engagement = item.metrics.engagement || item.metrics.views || item.metrics.posts || 0;
          return (
            <motion.div
              key={`${item.platform}-${item.timestamp || index}`}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.25, delay: index * 0.04 }}
              className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3"
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04]">
                <PlatformIcon platform={item.platform} size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-sm font-semibold text-white">{item.platform}</p>
                  <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-slate-500">
                    #{index + 1}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  First detected {formatTimestamp(item.timestamp)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums text-slate-200">
                  {engagement.toLocaleString()}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-slate-600">Signal</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
});

export default TrendDNA;
