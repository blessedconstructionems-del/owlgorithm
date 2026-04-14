/* eslint-disable react-hooks/purity */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  X,
  ChevronRight,
  ChevronLeft,
  Rocket,
  Trophy,
  Crown,
  Brain,
  BarChart3,
  Clock,
  ArrowRight,
  Check,
  Type,
  Hash,
  Image,
  Timer,
  Layout,
  Zap,
  TrendingUp,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';
import GlassCard from '@/components/shared/GlassCard';
import PageWrapper from '@/components/shared/PageWrapper';
import StatusBadge from '@/components/shared/StatusBadge';
import PlatformIcon from '@/components/shared/PlatformIcon';
import AnimatedNumber from '@/components/shared/AnimatedNumber';
import { abTests } from '@/data/abTests';

// ─── Wizard Modal ──────────────────────────────────────────────────
const TEST_TYPE_OPTIONS = [
  { key: 'Caption', icon: Type, label: 'Caption', desc: 'Test different copy styles' },
  { key: 'Hook', icon: Zap, label: 'Hook', desc: 'Compare opening hooks' },
  { key: 'Hashtags', icon: Hash, label: 'Hashtags', desc: 'Optimize tag strategy' },
  { key: 'Thumbnail', icon: Image, label: 'Thumbnail', desc: 'Visual A/B comparison' },
  { key: 'Posting Time', icon: Timer, label: 'Posting Time', desc: 'Find the best window' },
  { key: 'Format', icon: Layout, label: 'Format', desc: 'Content format testing' },
];

const DURATION_OPTIONS = [3, 7, 14];
const METRIC_OPTIONS = ['Engagement Rate', 'Click Rate', 'Reach', 'Impressions'];

function ConfettiParticle({ delay, x, color }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: Math.random() * 8 + 4,
        height: Math.random() * 8 + 4,
        backgroundColor: color,
        left: `${x}%`,
        top: '50%',
      }}
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{
        opacity: [1, 1, 0],
        y: [0, -120 - Math.random() * 80, -180 - Math.random() * 60],
        x: [0, (Math.random() - 0.5) * 160],
        scale: [1, 1.2, 0.6],
        rotate: [0, Math.random() * 360],
      }}
      transition={{ duration: 1.2, delay, ease: 'easeOut' }}
    />
  );
}

const CONFETTI_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

function WizardModal({ onClose }) {
  const [step, setStep] = useState(1);
  const [testType, setTestType] = useState(null);
  const [varA, setVarA] = useState('');
  const [varB, setVarB] = useState('');
  const [split, setSplit] = useState(50);
  const [duration, setDuration] = useState(7);
  const [metric, setMetric] = useState('Engagement Rate');
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);

  const canNext =
    (step === 1 && testType) ||
    (step === 2 && varA.trim() && varB.trim()) ||
    step === 3;

  const handleLaunch = () => {
    setLaunching(true);
    setTimeout(() => {
      setLaunching(false);
      setLaunched(true);
      setTimeout(() => onClose(), 2000);
    }, 1200);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative w-full max-h-[95vh] overflow-y-auto sm:max-w-2xl rounded-t-2xl sm:rounded-2xl border border-white/10 bg-[#0f1629]/95 p-4 sm:p-6 shadow-2xl backdrop-blur-xl"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        {/* Step indicator */}
        <div className="mb-6 flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all',
                  s < step
                    ? 'bg-blue-500 text-white'
                    : s === step
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'bg-white/10 text-gray-500'
                )}
              >
                {s < step ? <Check size={14} /> : s}
              </div>
              {s < 4 && (
                <div
                  className={cn(
                    'h-0.5 w-8 rounded-full transition-all',
                    s < step ? 'bg-blue-500' : 'bg-white/10'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1 — Select Test Type */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="mb-1 text-lg font-bold text-white">What do you want to test?</h3>
              <p className="mb-4 text-sm text-gray-400">Select one element to A/B test</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {TEST_TYPE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const selected = testType === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setTestType(opt.key)}
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all',
                        selected
                          ? 'border-blue-500/50 bg-blue-500/10 text-white shadow-lg shadow-blue-500/10'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <Icon size={24} className={selected ? 'text-blue-400' : ''} />
                      <span className="text-sm font-semibold">{opt.label}</span>
                      <span className="text-xs text-gray-500">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 2 — Variant Content */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="mb-1 text-lg font-bold text-white">Enter your variants</h3>
              <p className="mb-4 text-sm text-gray-400">
                Write content for each variant of your {testType?.toLowerCase()} test
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Variant A */}
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-400">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/20 text-xs font-bold">
                      A
                    </span>
                    Variant A
                  </label>
                  <textarea
                    value={varA}
                    onChange={(e) => setVarA(e.target.value)}
                    placeholder="Enter Variant A content..."
                    className="h-32 w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                  />
                </div>
                {/* Variant B */}
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-purple-400">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-500/20 text-xs font-bold">
                      B
                    </span>
                    Variant B
                  </label>
                  <textarea
                    value={varB}
                    onChange={(e) => setVarB(e.target.value)}
                    placeholder="Enter Variant B content..."
                    className="h-32 w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3 — Configuration */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="mb-1 text-lg font-bold text-white">Configure your test</h3>
              <p className="mb-5 text-sm text-gray-400">Set traffic split, duration, and success metric</p>

              {/* Traffic Split */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-semibold text-gray-300">
                  Traffic Split
                </label>
                <div className="flex items-center gap-3">
                  <span className="w-12 text-right text-sm font-mono text-blue-400">{split}% A</span>
                  <input
                    type="range"
                    min={10}
                    max={90}
                    value={split}
                    onChange={(e) => setSplit(Number(e.target.value))}
                    className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-blue-500 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-blue-500 [&::-webkit-slider-thumb]:to-purple-500"
                  />
                  <span className="w-12 text-sm font-mono text-purple-400">{100 - split}% B</span>
                </div>
                {/* Visual bar */}
                <div className="mt-2 flex h-3 overflow-hidden rounded-full">
                  <div
                    className="bg-blue-500/60 transition-all"
                    style={{ width: `${split}%` }}
                  />
                  <div
                    className="bg-purple-500/60 transition-all"
                    style={{ width: `${100 - split}%` }}
                  />
                </div>
              </div>

              {/* Duration */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-semibold text-gray-300">Duration</label>
                <div className="flex gap-3">
                  {DURATION_OPTIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={cn(
                        'flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all',
                        duration === d
                          ? 'border-blue-500/50 bg-blue-500/10 text-white'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-white'
                      )}
                    >
                      {d} days
                    </button>
                  ))}
                </div>
              </div>

              {/* Success Metric */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-300">
                  Success Metric
                </label>
                <select
                  value={metric}
                  onChange={(e) => setMetric(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 transition-all"
                >
                  {METRIC_OPTIONS.map((m) => (
                    <option key={m} value={m} className="bg-[#0f1629] text-white">
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}

          {/* Step 4 — Review & Launch */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="relative"
            >
              <h3 className="mb-1 text-lg font-bold text-white">Review & Launch</h3>
              <p className="mb-4 text-sm text-gray-400">Everything look good? Let&apos;s run it.</p>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Test Type</span>
                  <span className="text-sm font-semibold text-white">{testType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Traffic Split</span>
                  <span className="text-sm font-semibold text-white">
                    {split}% A / {100 - split}% B
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Duration</span>
                  <span className="text-sm font-semibold text-white">{duration} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Success Metric</span>
                  <span className="text-sm font-semibold text-white">{metric}</span>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <p className="text-xs text-gray-500 mb-1">Variant A</p>
                  <p className="text-sm text-gray-300 line-clamp-2">{varA}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Variant B</p>
                  <p className="text-sm text-gray-300 line-clamp-2">{varB}</p>
                </div>
              </div>

              {/* Launch button */}
              <div className="relative mt-5 flex justify-center">
                {launched ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
                      <Check size={28} className="text-emerald-400" />
                    </div>
                    <span className="text-sm font-semibold text-emerald-400">
                      Test Launched Successfully!
                    </span>
                    {/* Confetti */}
                    <div className="pointer-events-none absolute inset-0">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <ConfettiParticle
                          key={i}
                          delay={i * 0.04}
                          x={20 + Math.random() * 60}
                          color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
                        />
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    onClick={handleLaunch}
                    disabled={launching}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-70"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <motion.span
                      animate={launching ? { y: [0, -4, 0], rotate: [0, -10, 10, 0] } : {}}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                    >
                      <Rocket size={18} />
                    </motion.span>
                    {launching ? 'Launching...' : 'Launch Test'}
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        {!launched && (
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:hover:text-gray-400"
            >
              <ChevronLeft size={16} /> Back
            </button>
            {step < 4 && (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext}
                className="flex items-center gap-1 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15 transition-colors disabled:opacity-30"
              >
                Next <ChevronRight size={16} />
              </button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Expanded Detail Section ───────────────────────────────────────
function TestDetail({ test }) {
  const chartData = [
    { metric: 'Impressions', A: test.variantA.impressions, B: test.variantB.impressions },
    { metric: 'Engagement %', A: test.variantA.engagement, B: test.variantB.engagement },
    { metric: 'Click Rate %', A: test.variantA.clickRate, B: test.variantB.clickRate },
  ];

  const revenueImpact = Math.round(
    Math.abs(test.variantA.clickRate - test.variantB.clickRate) * 120 + 80
  );

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="metric"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1f3a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  color: '#fff',
                }}
              />
              <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
              <Bar dataKey="A" name="Variant A" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="B" name="Variant B" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Significance Gauge */}
        {test.significance > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Statistical Significance
              </p>
              <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className={cn(
                    'h-full rounded-full',
                    test.significance >= 95
                      ? 'bg-emerald-500'
                      : test.significance >= 80
                      ? 'bg-amber-500'
                      : 'bg-red-400'
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${test.significance}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
            <span
              className={cn(
                'rounded-full px-3 py-1 text-xs font-bold',
                test.significance >= 95
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : test.significance >= 80
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-red-500/15 text-red-400'
              )}
            >
              {test.significance}% confidence
            </span>
          </div>
        )}

        {/* Smart Insight */}
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Brain size={16} className="text-purple-400" />
            <span className="text-sm font-semibold text-purple-300">Smart Insight</span>
          </div>
          <p className="text-sm leading-relaxed text-gray-300">{test.aiInsight}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {test.winner && (
            <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/20">
              <Sparkles size={14} /> Apply Winner to Future Posts
            </button>
          )}
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2">
            <DollarSign size={14} className="text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-400">
              +${revenueImpact} estimated monthly impact
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Test Card ────────────────────────────────────────────────────
function TestCard({ test, index }) {
  const [expanded, setExpanded] = useState(false);
  const isCompleted = test.status === 'Completed';
  const isRunning = test.status === 'Running';
  const isDraft = test.status === 'Draft';

  const daysLeft = useMemo(() => {
    if (!test.endDate) return null;
    const end = new Date(test.endDate);
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [test.endDate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <GlassCard
        hover={false}
        accent={isCompleted && test.winner ? 'emerald' : 'purple'}
        className={cn(
          'relative overflow-hidden',
          isCompleted && 'cursor-pointer'
        )}
        onClick={isCompleted ? () => setExpanded((e) => !e) : undefined}
      >
        {/* Header row */}
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <PlatformIcon platform={test.platform} size={28} />
            <div>
              <h3 className="text-base font-bold text-white">{test.name}</h3>
              <span className="text-xs text-gray-500">{test.testType} test</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={test.status.toLowerCase()} />
            {isRunning && (
              <motion.div
                className="h-2 w-2 rounded-full bg-emerald-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
            {isCompleted && (
              <button className="text-gray-500 hover:text-white transition-colors">
                {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            )}
          </div>
        </div>

        {/* Variant comparison */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Variant A */}
          <div
            className={cn(
              'rounded-xl border p-3 transition-all',
              isCompleted && test.winner === 'A'
                ? 'border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                : 'border-white/10 bg-white/[0.02]'
            )}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold text-blue-400">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-500/20 text-[10px]">
                  A
                </span>
                Variant A
              </span>
              {isCompleted && test.winner === 'A' && (
                <Crown size={14} className="text-amber-400" />
              )}
            </div>
            <p className="mb-3 text-sm leading-relaxed text-gray-300 line-clamp-3">
              {test.variantA.content}
            </p>
            {!isDraft && (
              <div className="flex gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">Impr.</p>
                  <AnimatedNumber
                    value={test.variantA.impressions}
                    className="text-sm font-bold text-white"
                  />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">Eng. %</p>
                  <AnimatedNumber
                    value={test.variantA.engagement}
                    suffix="%"
                    className="text-sm font-bold text-white"
                  />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">CTR</p>
                  <AnimatedNumber
                    value={test.variantA.clickRate}
                    suffix="%"
                    className="text-sm font-bold text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Variant B */}
          <div
            className={cn(
              'rounded-xl border p-3 transition-all',
              isCompleted && test.winner === 'B'
                ? 'border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                : 'border-white/10 bg-white/[0.02]'
            )}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold text-purple-400">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-purple-500/20 text-[10px]">
                  B
                </span>
                Variant B
              </span>
              {isCompleted && test.winner === 'B' && (
                <Crown size={14} className="text-amber-400" />
              )}
            </div>
            <p className="mb-3 text-sm leading-relaxed text-gray-300 line-clamp-3">
              {test.variantB.content}
            </p>
            {!isDraft && (
              <div className="flex gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">Impr.</p>
                  <AnimatedNumber
                    value={test.variantB.impressions}
                    className="text-sm font-bold text-white"
                  />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">Eng. %</p>
                  <AnimatedNumber
                    value={test.variantB.engagement}
                    suffix="%"
                    className="text-sm font-bold text-white"
                  />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">CTR</p>
                  <AnimatedNumber
                    value={test.variantB.clickRate}
                    suffix="%"
                    className="text-sm font-bold text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Traffic Split Bar */}
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-[10px] text-gray-500">
            <span>A: {test.trafficSplit}%</span>
            <span>B: {100 - test.trafficSplit}%</span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full">
            <div
              className="bg-blue-500/50 transition-all"
              style={{ width: `${test.trafficSplit}%` }}
            />
            <div
              className="bg-purple-500/50 transition-all"
              style={{ width: `${100 - test.trafficSplit}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {isRunning && daysLeft !== null && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock size={12} />
              <span>{daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining</span>
              <motion.div
                className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-400"
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            </div>
          )}
          {isCompleted && test.winner && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400">
                <Trophy size={12} />
                Winner: Variant {test.winner}
              </div>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold',
                  test.significance >= 95
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-amber-500/15 text-amber-400'
                )}
              >
                {test.significance}% confidence
              </span>
            </div>
          )}
          {isDraft && (
            <span className="text-xs text-gray-500 italic">Not yet launched</span>
          )}
          {test.endDate && isCompleted && (
            <span className="text-xs text-gray-500">
              Completed {new Date(test.endDate).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Expanded detail */}
        <AnimatePresence>
          {expanded && isCompleted && <TestDetail test={test} />}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────
const TABS = ['All Tests', 'Running', 'Completed', 'Drafts'];

export default function ABTesting() {
  const [activeTab, setActiveTab] = useState('All Tests');
  const [showWizard, setShowWizard] = useState(false);

  const filteredTests = useMemo(() => {
    if (activeTab === 'All Tests') return abTests;
    if (activeTab === 'Running') return abTests.filter((t) => t.status === 'Running');
    if (activeTab === 'Completed') return abTests.filter((t) => t.status === 'Completed');
    if (activeTab === 'Drafts') return abTests.filter((t) => t.status === 'Draft');
    return abTests;
  }, [activeTab]);

  return (
    <PageWrapper>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              A/B Testing Lab
            </span>
          </h1>
          <p className="mt-1 text-sm text-gray-400">Test, learn, optimize</p>
        </div>
        <motion.button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus size={16} /> Create New Test
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-white/5 p-1 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'relative flex-1 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap',
              activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-gray-200'
            )}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="ab-tab-indicator"
                className="absolute inset-0 rounded-lg bg-white/10"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative">{tab}</span>
          </button>
        ))}
      </div>

      {/* Test List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {filteredTests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BarChart3 size={48} className="mb-3 text-gray-600" />
              <p className="text-gray-400">No tests in this category yet.</p>
              <p className="text-sm text-gray-500">Create a new test to get started.</p>
            </div>
          ) : (
            filteredTests.map((test, i) => (
              <TestCard key={test.id} test={test} index={i} />
            ))
          )}
        </motion.div>
      </AnimatePresence>

      {/* Wizard Modal */}
      <AnimatePresence>
        {showWizard && <WizardModal onClose={() => setShowWizard(false)} />}
      </AnimatePresence>
    </PageWrapper>
  );
}
