import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Search,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Link2,
  ExternalLink,
  Sparkles,
  Clock,
  BarChart3,
  Eye,
  ShieldAlert,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import GlassCard from '@/components/shared/GlassCard';
import PageWrapper from '@/components/shared/PageWrapper';
import StatusBadge from '@/components/shared/StatusBadge';
import PlatformIcon from '@/components/shared/PlatformIcon';
import CircularProgress from '@/components/shared/CircularProgress';
import AnimatedNumber from '@/components/shared/AnimatedNumber';
import { claims } from '@/data/truthRadar';

/* ─── helpers ─── */

/** Normalize platform names from data (e.g. 'Twitter/X' → 'twitter') */
function normalizePlatform(p) {
  const lower = p.toLowerCase();
  if (lower.startsWith('twitter')) return 'twitter';
  return lower;
}

const STATUS_ICON = {
  Verified: CheckCircle,
  Unverified: HelpCircle,
  Misleading: AlertTriangle,
  False: XCircle,
};

function credibilityColor(score) {
  if (score <= 30) return '#ef4444';
  if (score <= 70) return '#eab308';
  return '#22c55e';
}

function credibilityLabel(score) {
  if (score <= 30) return 'Low Credibility';
  if (score <= 70) return 'Mixed Credibility';
  return 'High Credibility';
}

function credibilityTextClass(score) {
  if (score <= 30) return 'text-red-400';
  if (score <= 70) return 'text-yellow-400';
  return 'text-emerald-400';
}

/* evidence for expanded view */
function getEvidence(claim) {
  const pool = [
    'Cross-referenced with primary source documentation and official press releases',
    'Verified against peer-reviewed publications in relevant domain',
    'Checked social media origin — first appearance traced to unverified account',
    'Multiple independent fact-checking organizations reached same conclusion',
    'Original source has a documented history of inaccurate reporting',
    'Claim language matches known misinformation patterns flagged by ML models',
    'Corroborated by at least 3 reputable international news agencies',
    'Timeline analysis shows claim predates the event it references',
  ];
  const start = (claim.id * 3) % pool.length;
  return [pool[start % pool.length], pool[(start + 1) % pool.length], pool[(start + 2) % pool.length], pool[(start + 3) % pool.length]];
}

function getSourcesChecked(claim) {
  const allSources = [
    { name: 'Reuters', score: 95 },
    { name: 'AP News', score: 94 },
    { name: 'BBC News', score: 91 },
    { name: 'Snopes', score: 88 },
    { name: 'PolitiFact', score: 86 },
    { name: 'FactCheck.org', score: 84 },
  ];
  const start = claim.id % allSources.length;
  return [allSources[start], allSources[(start + 1) % allSources.length], allSources[(start + 2) % allSources.length]];
}

const PENDING_SEARCH_RESULT = {
  id: 99,
  claim: 'Searched claim: analysis in progress',
  source: 'User Submission',
  credibilityScore: 52,
  status: 'Unverified',
  platforms: ['twitter', 'facebook'],
  analysis:
    'This claim is currently being analyzed by our fact-checking pipeline. Preliminary signals suggest mixed credibility. We are cross-referencing against 847 known sources and checking for linguistic patterns associated with misinformation. A full report will be available within 24 hours.',
  date: new Date().toISOString().split('T')[0],
};

/* ─── Source rankings ─── */

const SOURCE_RANKINGS = [
  { name: 'Reuters', score: 95, articles: 12840 },
  { name: 'AP News', score: 94, articles: 11320 },
  { name: 'BBC News', score: 91, articles: 9870 },
  { name: 'NPR', score: 89, articles: 6420 },
  { name: 'Snopes', score: 88, articles: 4210 },
  { name: 'The Guardian', score: 84, articles: 8930 },
  { name: 'CNN', score: 78, articles: 10250 },
  { name: 'Fox News', score: 62, articles: 9180 },
  { name: 'BuzzFeed News', score: 55, articles: 3470 },
  { name: 'Daily Mail', score: 42, articles: 14320 },
];

/* ─── Stats ─── */

const stats = [
  { label: 'Claims verified today', value: 847, icon: CheckCircle, color: 'text-emerald-400' },
  { label: 'Misleading claims detected', value: 124, icon: ShieldAlert, color: 'text-amber-400' },
  { label: 'Sources monitored', value: 2463, icon: Globe, color: 'text-blue-400' },
];

/* ─── Claim Card ─── */

function ClaimCard({ claim, index }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = STATUS_ICON[claim.status] || HelpCircle;
  const evidence = useMemo(() => getEvidence(claim), [claim]);
  const sources = useMemo(() => getSourcesChecked(claim), [claim]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: 'easeOut' }}
    >
      <GlassCard hover={false} accent={claim.status === 'Verified' ? 'emerald' : claim.status === 'False' ? 'rose' : claim.status === 'Misleading' ? 'amber' : 'blue'} className="relative overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-5">
          {/* Credibility gauge */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <CircularProgress
              value={claim.credibilityScore}
              size={72}
              strokeWidth={5}
              color={credibilityColor(claim.credibilityScore)}
            />
            <span className={cn('text-xs font-medium', credibilityTextClass(claim.credibilityScore))}>
              {credibilityLabel(claim.credibilityScore)}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* headline row */}
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold text-white leading-snug">{claim.claim}</h3>
              <StatusBadge status={claim.status} size="md" />
            </div>

            {/* source */}
            <div className="flex items-center gap-1.5 text-sm text-white/50">
              <Link2 className="w-3.5 h-3.5" />
              <span>{claim.source}</span>
              <span className="mx-1">|</span>
              <Clock className="w-3.5 h-3.5" />
              <span>{claim.date}</span>
            </div>

            {/* platforms + expand button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {claim.platforms.map((p) => (
                  <PlatformIcon key={p} platform={normalizePlatform(p)} size={22} />
                ))}
              </div>
              <button
                onClick={() => setExpanded((prev) => !prev)}
                className="flex items-center gap-1.5 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
              >
                {expanded ? 'Hide' : 'Full'} Analysis
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Expandable analysis */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              key="analysis"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="mt-5 pt-5 border-t border-white/10 space-y-5">
                {/* AI analysis */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <h4 className="text-sm font-semibold text-white/80">Deep Analysis</h4>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">{claim.analysis}</p>
                </div>

                {/* Evidence */}
                <div>
                  <h4 className="text-sm font-semibold text-white/80 mb-2">Evidence Points</h4>
                  <ul className="space-y-1.5">
                    {evidence.map((e, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/50">
                        <CheckCircle className="w-3.5 h-3.5 mt-0.5 text-emerald-400 shrink-0" />
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Sources checked */}
                <div>
                  <h4 className="text-sm font-semibold text-white/80 mb-2">Sources Checked</h4>
                  <div className="flex flex-wrap gap-3">
                    {sources.map((s) => (
                      <div
                        key={s.name}
                        className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-sm text-white/70">{s.name}</span>
                        <span
                          className={cn(
                            'text-xs font-bold',
                            s.score >= 80 ? 'text-emerald-400' : s.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                          )}
                        >
                          {s.score}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* First detected */}
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <Clock className="w-3.5 h-3.5" />
                  First detected: {claim.date}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}

/* ─── Source Rankings Panel ─── */

function SourceRankings() {
  return (
    <GlassCard hover={false} accent="purple" className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-blue-400" />
        <h3 className="text-base font-semibold text-white">Source Credibility Rankings</h3>
      </div>
      <div className="space-y-3">
        {SOURCE_RANKINGS.map((src, i) => (
          <motion.div
            key={src.name}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.06 }}
            className="space-y-1"
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-white/40 font-mono text-xs w-5 text-right">{i + 1}.</span>
                <span className="text-white/80 font-medium">{src.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white/40 text-xs">{src.articles.toLocaleString()} articles</span>
                <span
                  className={cn(
                    'font-bold text-xs w-8 text-right',
                    src.score >= 80 ? 'text-emerald-400' : src.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                  )}
                >
                  {src.score}
                </span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background:
                    src.score >= 80
                      ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                      : src.score >= 60
                        ? 'linear-gradient(90deg, #eab308, #facc15)'
                        : 'linear-gradient(90deg, #ef4444, #f87171)',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${src.score}%` }}
                transition={{ delay: 0.5 + i * 0.06, duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}

/* ─── Main Page ─── */

export default function TruthRadar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);

  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      if (!searchQuery.trim()) return;
      setIsSearching(true);
      setSearchResult(null);
      const timeout = setTimeout(() => {
        setSearchResult({
          ...PENDING_SEARCH_RESULT,
          claim: searchQuery.trim(),
        });
        setIsSearching(false);
      }, 1500);
      return () => clearTimeout(timeout);
    },
    [searchQuery]
  );

  /* combine search result with feed */
  const displayClaims = useMemo(() => {
    if (searchResult) return [searchResult, ...claims];
    return claims;
  }, [searchResult]);

  return (
    <PageWrapper>
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="w-8 h-8 text-purple-400" />
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Truth Radar
          </h1>
        </div>
        <p className="text-white/50 text-sm ml-11">Verify viral claims before you share</p>
      </div>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassCard hover={false} accent="blue" className="flex items-center gap-4 py-4">
                <div className={cn('p-2.5 rounded-xl bg-white/5', s.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <AnimatedNumber value={s.value} className="text-2xl font-bold text-white" />
                  <p className="text-xs text-white/50 mt-0.5">{s.label}</p>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* ── Search bar ── */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Check a claim..."
            className="w-full pl-12 pr-28 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
          />
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors"
          >
            {isSearching ? (
              <span className="flex items-center gap-2">
                <motion.span
                  className="block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                />
                Checking
              </span>
            ) : (
              'Verify'
            )}
          </button>
        </div>
      </form>

      {/* ── Loading shimmer for search ── */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-6"
          >
            <GlassCard hover={false} className="flex items-center gap-4 py-8 justify-center">
              <motion.div
                className="w-6 h-6 border-2 border-purple-400/30 border-t-purple-400 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
              />
              <span className="text-white/50 text-sm">Analyzing claim across 847 sources...</span>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main layout: feed + sidebar ── */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Claims feed */}
        <div className="flex-1 space-y-4 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-white/40" />
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Trending Claims</h2>
          </div>
          {displayClaims.map((claim, i) => (
            <ClaimCard key={claim.id} claim={claim} index={i} />
          ))}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 shrink-0">
          <SourceRankings />
        </div>
      </div>
    </PageWrapper>
  );
}
