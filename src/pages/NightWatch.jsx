import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sunrise, Sparkles, Flame, TrendingDown, Lightbulb, ChevronDown, ChevronRight, CalendarDays, Rocket, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import GlassCard from '@/components/shared/GlassCard';
import PageWrapper from '@/components/shared/PageWrapper';
import PlatformIcon from '@/components/shared/PlatformIcon';
import AnimatedNumber from '@/components/shared/AnimatedNumber';
import StatusBadge from '@/components/shared/StatusBadge';
import { nightWatchReports } from '@/data/nightWatch';

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function NightWatch() {
  const [expandedDay, setExpandedDay] = useState(null);
  const today = nightWatchReports[0];
  const pastReports = nightWatchReports.slice(1);

  const stats = useMemo(() => ({
    emerging: today.emergingTrends.length,
    viral: today.viralTrends.length,
    declining: today.decliningTrends.length,
  }), [today]);

  return (
    <PageWrapper>
      <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-8">
        {/* Header */}
        <motion.div variants={fadeUp} className="flex items-center gap-4">
          <div className="relative">
            <Moon className="w-10 h-10 text-blue-400 opacity-40 absolute -left-1 -top-1" />
            <Sunrise className="w-10 h-10 text-amber-400 relative z-10" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-amber-400 bg-clip-text text-transparent">
              Night Watch
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">While you were sleeping...</p>
          </div>
        </motion.div>

        {/* Today's Briefing Card */}
        <motion.div variants={fadeUp}>
          <GlassCard hover={false} gradient accent="amber" className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-amber-500/5 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="w-5 h-5 text-purple-400" />
                <span className="text-lg font-semibold text-white">
                  {format(parseISO(today.date), 'EEEE, MMMM do, yyyy')}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex flex-col items-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Sparkles className="w-6 h-6 text-emerald-400 mb-2" />
                  <AnimatedNumber value={stats.emerging} className="text-3xl font-bold text-emerald-400" />
                  <span className="text-sm text-gray-400 mt-1">New Trends Detected</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <Flame className="w-6 h-6 text-orange-400 mb-2" />
                  <AnimatedNumber value={stats.viral} className="text-3xl font-bold text-orange-400" />
                  <span className="text-sm text-gray-400 mt-1">Trends Went Viral</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <TrendingDown className="w-6 h-6 text-red-400 mb-2" />
                  <AnimatedNumber value={stats.declining} className="text-3xl font-bold text-red-400" />
                  <span className="text-sm text-gray-400 mt-1">Trends Declining</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* New Emerging Trends */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg sm:text-xl font-semibold text-white">New Emerging Trends</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {today.emergingTrends.map((trend, i) => (
              <motion.div
                key={trend.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.4 }}
              >
                <GlassCard accent="emerald" className="h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-white">{trend.name}</span>
                        <motion.span
                          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="text-yellow-400 text-xs"
                        >
                          NEW
                        </motion.span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <StatusBadge status="emerging" />
                      <PlatformIcon platform={trend.platform} size={22} />
                      <span className="text-xs text-gray-400">{trend.platform}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs text-gray-500">Momentum</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-emerald-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${trend.momentum}%` }}
                          transition={{ duration: 1, delay: 0.2 * i }}
                        />
                      </div>
                      <span className="text-xs font-mono text-emerald-400">{trend.momentum}</span>
                    </div>
                  </div>
                  <button className="w-full py-2 px-4 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-500/25 transition-colors">
                    Track This Trend
                  </button>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Trends Entering Viral */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg sm:text-xl font-semibold text-white">Trends Entering Viral</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {today.viralTrends.map((trend, i) => (
              <motion.div
                key={trend.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.12 * i, duration: 0.4 }}
              >
                <GlassCard className="relative overflow-hidden border border-orange-500/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-white">{trend.name}</span>
                      <span className="text-lg">🔥</span>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <PlatformIcon platform={trend.platform} size={22} />
                      <span className="text-sm text-gray-400">{trend.platform}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs text-gray-500">Momentum</span>
                      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${trend.momentum}%` }}
                          transition={{ duration: 1.2, delay: 0.2 * i }}
                        />
                      </div>
                      <span className="text-sm font-mono font-bold text-orange-400">{trend.momentum}</span>
                    </div>
                    <button className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-semibold hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-500/20">
                      Ride This Wave
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Declining Trends */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <h2 className="text-lg sm:text-xl font-semibold text-white">Declining Trends</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {today.decliningTrends.map((trend, i) => (
              <motion.div
                key={trend.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.4 }}
              >
                <GlassCard hover={false} accent="rose" className="border border-red-500/15">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 rounded-lg bg-red-500/10">
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-white mb-1">{trend.name}</h3>
                      <p className="text-sm text-amber-300/80 leading-relaxed">{trend.recommendation}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Top Opportunities */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg sm:text-xl font-semibold text-white">Top Opportunities</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {today.opportunities.map((opp, i) => (
              <motion.div
                key={opp.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.5 }}
              >
                <GlassCard
                  hover={false}
                  gradient={i === 0}
                  className={`h-full flex flex-col justify-between ${i === 0 ? 'ring-1 ring-purple-500/30' : ''}`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {i === 0 && (
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                          #1
                        </span>
                      )}
                      <Rocket className="w-4 h-4 text-purple-400" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2">{opp.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed mb-4">{opp.description}</p>
                  </div>
                  <button className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg shadow-blue-500/20">
                    {opp.actionLabel}
                  </button>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Historical Reports */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg sm:text-xl font-semibold text-white">Past 7 Days</h2>
          </div>
          <div className="space-y-2">
            {pastReports.map((report) => {
              const isExpanded = expandedDay === report.date;
              return (
                <GlassCard
                  key={report.date}
                  hover={false}
                  className="!p-0 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedDay(isExpanded ? null : report.date)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm font-semibold text-white">
                        {format(parseISO(report.date), 'EEEE, MMM do')}
                      </span>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500">
                      <span className="text-emerald-400">{report.emergingTrends.length} emerging</span>
                      <span className="text-orange-400">{report.viralTrends.length} viral</span>
                      <span className="text-red-400">{report.decliningTrends.length} declining</span>
                    </div>
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-4">
                          {report.emergingTrends.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Emerging</h4>
                              <div className="flex flex-wrap gap-2">
                                {report.emergingTrends.map((t) => (
                                  <span key={t.name} className="px-3 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    {t.name} ({t.momentum})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {report.viralTrends.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">Viral</h4>
                              <div className="flex flex-wrap gap-2">
                                {report.viralTrends.map((t) => (
                                  <span key={t.name} className="px-3 py-1 text-xs rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                    {t.name} ({t.momentum})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {report.decliningTrends.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Declining</h4>
                              {report.decliningTrends.map((t) => (
                                <div key={t.name} className="mb-2 last:mb-0">
                                  <span className="text-sm text-white">{t.name}</span>
                                  <p className="text-xs text-gray-500 mt-0.5">{t.recommendation}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {report.opportunities.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">Opportunities</h4>
                              {report.opportunities.map((o) => (
                                <div key={o.title} className="mb-2 last:mb-0">
                                  <span className="text-sm text-white font-medium">{o.title}</span>
                                  <p className="text-xs text-gray-500 mt-0.5">{o.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </PageWrapper>
  );
}
