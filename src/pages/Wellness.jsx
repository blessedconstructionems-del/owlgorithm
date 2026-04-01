import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Lightbulb, Coffee, TrendingUp, Calendar, Flame, Clock, Activity } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceArea, Area, AreaChart,
} from 'recharts';
import GlassCard from '@/components/shared/GlassCard';
import PageWrapper from '@/components/shared/PageWrapper';
import CircularProgress from '@/components/shared/CircularProgress';
import AnimatedNumber from '@/components/shared/AnimatedNumber';

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// Generate posting frequency data for last 30 days
function generatePostingData() {
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayOfWeek = d.getDay();
    // Weekends tend to be lighter
    const base = dayOfWeek === 0 || dayOfWeek === 6 ? 1.5 : 3;
    const variance = (Math.sin(i * 1.7) * 0.5 + 0.5) * 3;
    let posts = Math.round(base + variance);
    // A few spike days
    if (i === 12 || i === 5 || i === 22) posts = Math.min(7, posts + 3);
    posts = Math.max(0, Math.min(8, posts));
    data.push({
      day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      posts,
    });
  }
  return data;
}

// Generate screen time data for last 14 days
function generateScreenTimeData() {
  const data = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const base = 2.0;
    const variance = Math.sin(i * 2.3) * 0.8 + (Math.cos(i * 0.7) * 0.4);
    const hours = Math.max(0.5, Math.min(4.5, base + variance));
    data.push({
      day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      hours: Math.round(hours * 10) / 10,
    });
  }
  return data;
}

// Generate sparkline data for wellness trend
function generateWellnessSparkline() {
  const data = [];
  for (let i = 6; i >= 0; i--) {
    data.push({
      day: i,
      score: Math.round(30 + (6 - i) * 1.5 + (Math.sin(i * 1.2) * 4)),
    });
  }
  return data;
}

const TIPS = [
  "Your worth isn't measured in likes.",
  'Comparison is the thief of creativity.',
  'The algorithm rewards consistency, but your health comes first.',
  'Take a deep breath. Your content will still be there in 10 minutes.',
  'Progress over perfection.',
];

const BREAK_RECOMMENDATIONS = [
  {
    icon: Coffee,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    text: "You've posted 4 days straight \u2014 consider taking tomorrow off for fresh ideas.",
  },
  {
    icon: Lightbulb,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    text: 'Your top-performing post last month came after a 2-day break. Rest fuels creativity!',
  },
  {
    icon: Heart,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    text: "Try the 5-2 rule: 5 days on, 2 days off. Your audience won't notice, but your mental health will.",
  },
];

const PostingTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-gray-900 border border-white/10 px-3 py-2 shadow-xl text-sm">
      <p className="text-white font-medium">{payload[0].payload.day}</p>
      <p className="text-gray-400">{payload[0].value} posts</p>
    </div>
  );
};

const ScreenTimeTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-gray-900 border border-white/10 px-3 py-2 shadow-xl text-sm">
      <p className="text-white font-medium">{payload[0].payload.day}</p>
      <p className="text-gray-400">{payload[0].value}h screen time</p>
    </div>
  );
};

export default function Wellness() {
  const [tipIndex, setTipIndex] = useState(0);
  const burnoutScore = 35;

  const postingData = useMemo(() => generatePostingData(), []);
  const screenTimeData = useMemo(() => generateScreenTimeData(), []);
  const sparklineData = useMemo(() => generateWellnessSparkline(), []);

  // Auto-rotate tips
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const burnoutLabel = burnoutScore <= 30 ? 'Thriving' : burnoutScore <= 60 ? 'Balanced' : burnoutScore <= 80 ? 'Caution' : 'Burnout Risk';
  const burnoutColor = burnoutScore <= 30 ? '#10B981' : burnoutScore <= 60 ? '#3B82F6' : burnoutScore <= 80 ? '#F59E0B' : '#EF4444';

  return (
    <PageWrapper>
      <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-8">
        {/* Header */}
        <motion.div variants={fadeUp} className="flex items-center gap-3">
          <Heart className="w-8 h-8 text-emerald-400" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
              Creator Wellness
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">Take care of yourself while building your empire</p>
          </div>
        </motion.div>

        {/* Burnout Score */}
        <motion.div variants={fadeUp}>
          <GlassCard hover={false} gradient accent="emerald" className="flex flex-col items-center py-8">
            <h2 className="text-lg font-semibold text-white mb-6">Burnout Score</h2>
            <CircularProgress
              value={burnoutScore}
              max={100}
              size={120}
              strokeWidth={8}
              color={burnoutColor}
              fontSize={28}
            />
            <div className="mt-4 flex flex-col items-center gap-1">
              <span className="text-lg font-bold" style={{ color: burnoutColor }}>
                {burnoutLabel}
              </span>
              <span className="text-xs text-gray-500">Score: {burnoutScore}/100</span>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-gray-400">0-30 Thriving</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-gray-400">30-60 Balanced</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-gray-400">60-80 Caution</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-gray-400">80-100 Burnout</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Posting Frequency Chart */}
          <motion.div variants={fadeUp}>
            <GlassCard hover={false} accent="blue">
              <h2 className="text-lg font-semibold text-white mb-4">Posting Frequency</h2>
              <p className="text-xs text-gray-500 mb-4">Posts per day over last 30 days. Green band = healthy zone (2-4/day).</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={postingData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: '#6b7280', fontSize: 10 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                      interval={4}
                    />
                    <YAxis
                      tick={{ fill: '#6b7280', fontSize: 10 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                      domain={[0, 8]}
                    />
                    <Tooltip content={<PostingTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <ReferenceArea y1={2} y2={4} fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.2)" strokeDasharray="3 3" />
                    <Bar dataKey="posts" radius={[3, 3, 0, 0]} maxBarSize={14}>
                      {postingData.map((entry, index) => (
                        <motion.rect
                          key={index}
                          fill={
                            entry.posts >= 2 && entry.posts <= 4
                              ? '#10B981'
                              : entry.posts > 5
                                ? '#EF4444'
                                : '#F59E0B'
                          }
                          fillOpacity={0.7}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </motion.div>

          {/* Screen Time Chart */}
          <motion.div variants={fadeUp}>
            <GlassCard hover={false} accent="purple">
              <h2 className="text-lg font-semibold text-white mb-4">Screen Time</h2>
              <p className="text-xs text-gray-500 mb-4">Hours per day in-app over last 14 days</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={screenTimeData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: '#6b7280', fontSize: 10 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                      interval={2}
                    />
                    <YAxis
                      tick={{ fill: '#6b7280', fontSize: 10 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                      domain={[0, 5]}
                      tickFormatter={(v) => `${v}h`}
                    />
                    <Tooltip content={<ScreenTimeTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="hours"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      dot={{ fill: '#8B5CF6', r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: '#8B5CF6', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Recommended Breaks */}
        <motion.div variants={fadeUp}>
          <h2 className="text-xl font-semibold text-white mb-4">Recommended Breaks</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {BREAK_RECOMMENDATIONS.map((rec, i) => {
              const Icon = rec.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i, duration: 0.4 }}
                >
                  <GlassCard hover={false} className="h-full">
                    <div className={`w-10 h-10 rounded-xl ${rec.bg} flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 ${rec.color}`} />
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{rec.text}</p>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Mindful Creator Tips - Carousel */}
        <motion.div variants={fadeUp}>
          <GlassCard hover={false} className="text-center py-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-purple-500/5 pointer-events-none" />
            <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-6 relative z-10">
              Mindful Creator Tips
            </h2>
            <div className="relative z-10 h-16 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={tipIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className="text-base sm:text-xl font-medium text-white/90 italic max-w-lg mx-auto px-4"
                >
                  &ldquo;{TIPS[tipIndex]}&rdquo;
                </motion.p>
              </AnimatePresence>
            </div>
            <div className="flex items-center justify-center gap-2 mt-6 relative z-10">
              {TIPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTipIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === tipIndex ? 'bg-emerald-400 w-6' : 'bg-white/20 hover:bg-white/30'
                  }`}
                  aria-label={`Show tip ${i + 1}`}
                />
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Weekly Wellness Summary */}
        <motion.div variants={fadeUp}>
          <h2 className="text-xl font-semibold text-white mb-4">Weekly Wellness Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <GlassCard hover={false} accent="blue" className="text-center">
              <Calendar className="w-5 h-5 text-blue-400 mx-auto mb-2" />
              <AnimatedNumber value={14} className="text-2xl font-bold text-white" />
              <p className="text-xs text-gray-500 mt-1">Posts This Week</p>
            </GlassCard>
            <GlassCard hover={false} accent="amber" className="text-center">
              <Coffee className="w-5 h-5 text-amber-400 mx-auto mb-2" />
              <AnimatedNumber value={2} className="text-2xl font-bold text-white" />
              <p className="text-xs text-gray-500 mt-1">Breaks Taken</p>
            </GlassCard>
            <GlassCard hover={false} accent="emerald" className="text-center">
              <Flame className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
              <AnimatedNumber value={18} className="text-2xl font-bold text-white" />
              <p className="text-xs text-gray-500 mt-1">Days Without Burnout</p>
            </GlassCard>
            <GlassCard hover={false} accent="purple" className="text-center">
              <Activity className="w-5 h-5 text-purple-400 mx-auto mb-2" />
              <div className="h-10 mt-1 mb-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparklineData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                    <defs>
                      <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      fill="url(#sparkGrad)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-500">Wellness Trend</p>
              <span className="text-xs text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                <TrendingUp className="w-3 h-3" /> Improving
              </span>
            </GlassCard>
          </div>
        </motion.div>
      </motion.div>
    </PageWrapper>
  );
}
