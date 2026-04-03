import { useEffect, useMemo, useState } from 'react';
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
  Check,
  Type,
  Hash,
  Image,
  Timer,
  Layout,
  Zap,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FlaskConical,
  AlertTriangle,
  Target,
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
} from 'recharts';
import { cn } from '@/lib/utils';
import GlassCard from '@/components/shared/GlassCard';
import PageWrapper from '@/components/shared/PageWrapper';
import StatusBadge from '@/components/shared/StatusBadge';
import PlatformIcon from '@/components/shared/PlatformIcon';
import AnimatedNumber from '@/components/shared/AnimatedNumber';
import { abTests } from '@/data/abTests';
import {
  buildAbTestModels,
  buildAbTestSummary,
  createAbTestRecord,
  getMetricLabel,
  loadAbTests,
  persistAbTests,
} from '@/lib/abTesting';

const TEST_TYPE_OPTIONS = [
  { key: 'Caption', icon: Type, label: 'Caption', desc: 'Test different copy styles' },
  { key: 'Hook', icon: Zap, label: 'Hook', desc: 'Compare opening hooks' },
  { key: 'Hashtags', icon: Hash, label: 'Hashtags', desc: 'Optimize tag strategy' },
  { key: 'Thumbnail', icon: Image, label: 'Thumbnail', desc: 'Visual A/B comparison' },
  { key: 'Posting Time', icon: Timer, label: 'Posting Time', desc: 'Find the best window' },
  { key: 'Format', icon: Layout, label: 'Format', desc: 'Content format testing' },
];

const PLATFORM_OPTIONS = ['Instagram', 'TikTok', 'LinkedIn', 'YouTube', 'Twitter'];
const DURATION_OPTIONS = [3, 7, 14];
const METRIC_OPTIONS = [
  { value: 'engagement', label: 'Engagement Rate' },
  { value: 'clickRate', label: 'Click Rate' },
  { value: 'impressions', label: 'Impressions' },
];
const TABS = ['All Tests', 'Live', 'Review', 'Completed', 'Drafts'];
const CONFETTI_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

const RECOMMENDATION_TONE_CLASSES = {
  amber: 'border-amber-500/20 bg-amber-500/5 text-amber-100',
  blue: 'border-blue-500/20 bg-blue-500/5 text-blue-100',
  emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-100',
  purple: 'border-purple-500/20 bg-purple-500/5 text-purple-100',
};

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

function SummaryCard({ icon: Icon, label, value, helper, accent = 'blue', prefix = '', suffix = '' }) {
  return (
    <GlassCard hover={false} accent={accent}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <Icon size={16} className="text-white/70" />
      </div>
      <div className="text-2xl font-bold text-white">
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-gray-400">{helper}</p>
    </GlassCard>
  );
}

function PriorityQueue({ items }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <GlassCard hover={false} accent="purple" className="h-full">
      <div className="mb-4 flex items-center gap-2">
        <Target size={16} className="text-purple-300" />
        <div>
          <h2 className="text-sm font-semibold text-white">Priority Queue</h2>
          <p className="text-xs text-gray-500">The next moves with the biggest upside</p>
        </div>
      </div>
      <div className="space-y-3">
        {items.map((test) => (
          <div key={test.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{test.name}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {test.platform} · {test.primaryMetricLabel}
                </p>
              </div>
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                  test.recommendation.tone === 'amber' && 'bg-amber-500/15 text-amber-300',
                  test.recommendation.tone === 'blue' && 'bg-blue-500/15 text-blue-300',
                  test.recommendation.tone === 'emerald' && 'bg-emerald-500/15 text-emerald-300',
                  test.recommendation.tone === 'purple' && 'bg-purple-500/15 text-purple-300'
                )}
              >
                {test.recommendation.label}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-300">{test.recommendation.body}</p>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-gray-500">{test.healthLabel}</span>
              <span className="font-semibold text-white">{test.recommendation.action}</span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function WizardModal({ onClose, onLaunch }) {
  const [step, setStep] = useState(1);
  const [testType, setTestType] = useState(null);
  const [platform, setPlatform] = useState('Instagram');
  const [testName, setTestName] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [varA, setVarA] = useState('');
  const [varB, setVarB] = useState('');
  const [split, setSplit] = useState(50);
  const [duration, setDuration] = useState(7);
  const [metric, setMetric] = useState('engagement');
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);

  const canNext =
    (step === 1 && testType && platform) ||
    (step === 2 && testName.trim() && hypothesis.trim() && varA.trim() && varB.trim()) ||
    step === 3;

  const handleLaunch = () => {
    if (launching) return;

    setLaunching(true);
    setTimeout(() => {
      onLaunch(
        createAbTestRecord({
          name: testName,
          platform,
          testType,
          hypothesis,
          variantA: varA,
          variantB: varB,
          split,
          duration,
          metric,
        })
      );
      setLaunching(false);
      setLaunched(true);
      setTimeout(() => onClose(), 1800);
    }, 900);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative w-full max-h-[95vh] overflow-y-auto rounded-t-2xl border border-white/10 bg-[#0f1629]/95 p-4 shadow-2xl backdrop-blur-xl sm:max-w-2xl sm:rounded-2xl sm:p-6"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>

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
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="mb-1 text-lg font-bold text-white">Scope the experiment</h3>
              <p className="mb-5 text-sm text-gray-400">
                Pick the platform and the one variable you want to isolate.
              </p>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-semibold text-gray-300">Platform</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORM_OPTIONS.map((option) => {
                    const selected = option === platform;
                    return (
                      <button
                        key={option}
                        onClick={() => setPlatform(option)}
                        className={cn(
                          'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all',
                          selected
                            ? 'border-blue-500/50 bg-blue-500/10 text-white'
                            : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-white'
                        )}
                      >
                        <PlatformIcon platform={option} size={18} />
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>

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

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="mb-1 text-lg font-bold text-white">Frame the test</h3>
              <p className="mb-4 text-sm text-gray-400">
                Name the experiment, write the hypothesis, and define both variants.
              </p>

              <div className="mb-4 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-300">Test Name</label>
                  <input
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="Example: Hook Comparison - AI Newsletter Promo"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-300">Hypothesis</label>
                  <textarea
                    value={hypothesis}
                    onChange={(e) => setHypothesis(e.target.value)}
                    placeholder="What do you expect to happen, and why?"
                    className="h-24 w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    className="h-36 w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
                  />
                </div>
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
                    className="h-36 w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="mb-1 text-lg font-bold text-white">Configure the test</h3>
              <p className="mb-5 text-sm text-gray-400">
                Set the audience split, run length, and the metric that decides the winner.
              </p>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-semibold text-gray-300">Traffic Split</label>
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
                <div className="mt-2 flex h-3 overflow-hidden rounded-full">
                  <div className="bg-blue-500/60 transition-all" style={{ width: `${split}%` }} />
                  <div
                    className="bg-purple-500/60 transition-all"
                    style={{ width: `${100 - split}%` }}
                  />
                </div>
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-semibold text-gray-300">Duration</label>
                <div className="flex gap-3">
                  {DURATION_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => setDuration(option)}
                      className={cn(
                        'flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all',
                        duration === option
                          ? 'border-blue-500/50 bg-blue-500/10 text-white'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-white'
                      )}
                    >
                      {option} days
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-300">Success Metric</label>
                <select
                  value={metric}
                  onChange={(e) => setMetric(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-all focus:border-blue-500/50"
                >
                  {METRIC_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-[#0f1629] text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="relative"
            >
              <h3 className="mb-1 text-lg font-bold text-white">Review and launch</h3>
              <p className="mb-4 text-sm text-gray-400">One last check before the experiment goes live.</p>

              <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-400">Test Name</span>
                  <span className="text-right text-sm font-semibold text-white">{testName}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-400">Platform</span>
                  <span className="text-sm font-semibold text-white">{platform}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-400">Test Type</span>
                  <span className="text-sm font-semibold text-white">{testType}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-400">Traffic Split</span>
                  <span className="text-sm font-semibold text-white">
                    {split}% A / {100 - split}% B
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-400">Duration</span>
                  <span className="text-sm font-semibold text-white">{duration} days</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-400">Success Metric</span>
                  <span className="text-sm font-semibold text-white">{getMetricLabel(metric)}</span>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <p className="mb-1 text-xs text-gray-500">Hypothesis</p>
                  <p className="text-sm text-gray-300">{hypothesis}</p>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <p className="mb-1 text-xs text-gray-500">Variant A</p>
                  <p className="text-sm text-gray-300 line-clamp-2">{varA}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-500">Variant B</p>
                  <p className="text-sm text-gray-300 line-clamp-2">{varB}</p>
                </div>
              </div>

              <div className="relative mt-5 flex justify-center">
                {launched ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-2">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
                      <Check size={28} className="text-emerald-400" />
                    </div>
                    <span className="text-sm font-semibold text-emerald-400">
                      Test launched into the lab.
                    </span>
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

        {!launched && (
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setStep((current) => Math.max(1, current - 1))}
              disabled={step === 1}
              className="flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-white disabled:opacity-30 disabled:hover:text-gray-400"
            >
              <ChevronLeft size={16} /> Back
            </button>
            {step < 4 && (
              <button
                onClick={() => setStep((current) => current + 1)}
                disabled={!canNext}
                className="flex items-center gap-1 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/15 disabled:opacity-30"
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

function TestDetail({ test }) {
  const chartData = [
    { metric: 'Impressions', A: test.variantA.impressions, B: test.variantB.impressions },
    { metric: 'Engagement %', A: test.variantA.engagement, B: test.variantB.engagement },
    { metric: 'Click Rate %', A: test.variantA.clickRate, B: test.variantB.clickRate },
  ];

  const hasPerformanceData = test.variantA.impressions > 0 || test.variantB.impressions > 0;
  const recommendationTone =
    RECOMMENDATION_TONE_CLASSES[test.recommendation.tone] || RECOMMENDATION_TONE_CLASSES.blue;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Primary Metric</p>
            <p className="mt-2 text-lg font-bold text-white">{test.primaryMetricLabel}</p>
            <p className="mt-1 text-sm text-gray-400">
              {test.leadingVariant
                ? `Variant ${test.leadingVariant} leads by ${test.metricLift}%`
                : 'Both variants are still neck and neck.'}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Test Window</p>
            <p className="mt-2 text-lg font-bold text-white">
              {test.displayStartDate} to {test.displayEndDate}
            </p>
            <p className="mt-1 text-sm text-gray-400">
              {test.derivedStatus === 'Running' && test.daysRemaining !== null
                ? `${test.daysRemaining} day${test.daysRemaining !== 1 ? 's' : ''} remaining`
                : `${test.timelineProgress}% of the planned window consumed`}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Experiment Health</p>
            <p className="mt-2 text-lg font-bold text-white">{test.healthLabel}</p>
            <p className="mt-1 text-sm text-gray-400">{test.recommendation.action}</p>
          </div>
        </div>

        {hasPerformanceData ? (
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
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-gray-400">
            This experiment has no live observations yet. Once traffic starts flowing, the lab will compare impressions, engagement, and click rate here.
          </div>
        )}

        {test.significance > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
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

        {test.hypothesis && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Hypothesis</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-300">{test.hypothesis}</p>
          </div>
        )}

        <div className={cn('rounded-xl border p-4', recommendationTone)}>
          <div className="mb-2 flex items-center gap-2">
            <Target size={16} className="text-current" />
            <span className="text-sm font-semibold">{test.recommendation.title}</span>
          </div>
          <p className="text-sm leading-relaxed text-current/80">{test.recommendation.body}</p>
        </div>

        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Brain size={16} className="text-purple-400" />
            <span className="text-sm font-semibold text-purple-300">Smart Insight</span>
          </div>
          <p className="text-sm leading-relaxed text-gray-300">{test.aiInsight}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Recommended Next Move</p>
            <p className="mt-2 text-sm font-semibold text-white">{test.recommendation.action}</p>
            <p className="mt-1 text-sm text-gray-400">
              {test.winningVariant
                ? `Bake Variant ${test.winningVariant} into the next creative cycle.`
                : 'Keep the audience split clean until the signal is decisive.'}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2 text-emerald-300">
              <DollarSign size={14} />
              <span className="text-xs font-semibold uppercase tracking-wider">Estimated Monthly Upside</span>
            </div>
            <p className="mt-2 text-xl font-bold text-emerald-300">+${test.estimatedImpact}</p>
            <p className="mt-1 text-sm text-emerald-100/80">
              Based on current lift, confidence, and the urgency of this experiment.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TestCard({ test, index }) {
  const [expanded, setExpanded] = useState(test.derivedStatus === 'Review');
  const isCompleted = test.derivedStatus === 'Completed';
  const isRunning = test.derivedStatus === 'Running';
  const isDraft = test.derivedStatus === 'Draft';
  const isScheduled = test.derivedStatus === 'Scheduled';
  const isReview = test.derivedStatus === 'Review';
  const leaderVariant = isCompleted ? test.winningVariant : test.leadingVariant;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <GlassCard hover={false} accent={isCompleted ? 'emerald' : isReview ? 'amber' : 'purple'}>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <PlatformIcon platform={test.platform} size={28} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-white">{test.name}</h3>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  {test.healthLabel}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {test.testType} test · {test.primaryMetricLabel}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={test.derivedStatus.toLowerCase()} />
            <button
              onClick={() => setExpanded((value) => !value)}
              className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={expanded ? 'Collapse details' : 'Expand details'}
            >
              {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div
            className={cn(
              'rounded-xl border p-3 transition-all',
              leaderVariant === 'A'
                ? isCompleted
                  ? 'border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'border-blue-500/30 bg-blue-500/[0.06]'
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
              {leaderVariant === 'A' &&
                (isCompleted ? (
                  <Crown size={14} className="text-amber-400" />
                ) : (
                  <Sparkles size={14} className="text-blue-300" />
                ))}
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

          <div
            className={cn(
              'rounded-xl border p-3 transition-all',
              leaderVariant === 'B'
                ? isCompleted
                  ? 'border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'border-purple-500/30 bg-purple-500/[0.06]'
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
              {leaderVariant === 'B' &&
                (isCompleted ? (
                  <Crown size={14} className="text-amber-400" />
                ) : (
                  <Sparkles size={14} className="text-purple-300" />
                ))}
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

        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between text-[10px] text-gray-500">
            <span>A: {test.trafficSplit}%</span>
            <span>B: {100 - test.trafficSplit}%</span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full">
            <div className="bg-blue-500/50 transition-all" style={{ width: `${test.trafficSplit}%` }} />
            <div
              className="bg-purple-500/50 transition-all"
              style={{ width: `${100 - test.trafficSplit}%` }}
            />
          </div>
          {test.endDate && (
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-[10px] text-gray-500">
                <span>{test.displayStartDate}</span>
                <span>{test.timelineProgress}% through window</span>
                <span>{test.displayEndDate}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={cn(
                    'h-full rounded-full',
                    isReview ? 'bg-amber-400' : isCompleted ? 'bg-emerald-400' : 'bg-blue-400'
                  )}
                  style={{ width: `${test.timelineProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {isRunning && test.daysRemaining !== null && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock size={12} />
                <span>{test.daysRemaining} day{test.daysRemaining !== 1 ? 's' : ''} remaining</span>
                <motion.div
                  className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-400"
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              </div>
            )}
            {isReview && (
              <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-400">
                Ended {test.displayEndDate}. Decision overdue.
              </span>
            )}
            {isCompleted && test.winningVariant && (
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400">
                <Trophy size={12} />
                Winner: Variant {test.winningVariant}
              </div>
            )}
            {isDraft && <span className="text-xs italic text-gray-500">No traffic yet. Launch when ready.</span>}
            {isScheduled && <span className="text-xs text-gray-500">Starts {test.displayStartDate}</span>}
          </div>
          <span className="text-xs text-gray-400">
            {test.leadingVariant
              ? `${test.primaryMetricLabel}: ${test.leadingVariant} +${test.metricLift}%`
              : `${test.primaryMetricLabel}: too close to call`}
          </span>
        </div>

        <AnimatePresence>{expanded && <TestDetail test={test} />}</AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}

export default function ABTesting() {
  const [activeTab, setActiveTab] = useState('All Tests');
  const [showWizard, setShowWizard] = useState(false);
  const [tests, setTests] = useState(() => loadAbTests(abTests));

  useEffect(() => {
    persistAbTests(tests);
  }, [tests]);

  const testModels = useMemo(() => buildAbTestModels(tests), [tests]);
  const summary = useMemo(() => buildAbTestSummary(testModels), [testModels]);
  const priorityQueue = useMemo(() => testModels.slice(0, 3), [testModels]);

  const filteredTests = useMemo(() => {
    if (activeTab === 'All Tests') return testModels;
    if (activeTab === 'Live') return testModels.filter((test) => test.derivedStatus === 'Running');
    if (activeTab === 'Review') return testModels.filter((test) => test.derivedStatus === 'Review');
    if (activeTab === 'Completed') {
      return testModels.filter((test) => test.derivedStatus === 'Completed');
    }
    if (activeTab === 'Drafts') return testModels.filter((test) => test.derivedStatus === 'Draft');
    return testModels;
  }, [activeTab, testModels]);

  const tabCounts = {
    'All Tests': testModels.length,
    Live: summary.live,
    Review: summary.review,
    Completed: summary.completed,
    Drafts: summary.drafts,
  };

  const handleLaunch = (test) => {
    setTests((current) => [test, ...current]);
  };

  return (
    <PageWrapper>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              A/B Testing Lab
            </span>
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-400">
            Run cleaner experiments, spot stale tests faster, and turn winners into repeatable playbooks.
          </p>
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

      <div className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-[1.8fr_1fr]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={FlaskConical}
            label="Live Tests"
            value={summary.live}
            helper="Experiments currently collecting signal."
            accent="blue"
          />
          <SummaryCard
            icon={AlertTriangle}
            label="Decision Queue"
            value={summary.review}
            helper="Tests whose end date passed without a clean decision."
            accent="amber"
          />
          <SummaryCard
            icon={Sparkles}
            label="Avg Winner Lift"
            value={summary.averageWinnerLift}
            helper="Average primary-metric gain from completed winners."
            accent="emerald"
            suffix="%"
          />
          <SummaryCard
            icon={DollarSign}
            label="Projected Impact"
            value={summary.projectedMonthlyImpact}
            helper="Modeled upside if the strongest signals are shipped."
            accent="purple"
            prefix="$"
          />
        </div>
        <PriorityQueue items={priorityQueue} />
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-white/5 p-1 scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'relative flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all sm:px-4 sm:text-sm',
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
            <span className="relative rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-gray-300">
              {tabCounts[tab]}
            </span>
          </button>
        ))}
      </div>

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
            filteredTests.map((test, index) => <TestCard key={test.id} test={test} index={index} />)
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showWizard && (
          <WizardModal onClose={() => setShowWizard(false)} onLaunch={handleLaunch} />
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
