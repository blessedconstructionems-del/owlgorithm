import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  BookOpen,
  Camera,
  TrendingUp,
  MessageCircle,
  Heart,
  Brain,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Calendar,
  BarChart3,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  Zap,
  FlaskConical,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import GlassCard from '@/components/shared/GlassCard';
import PageWrapper from '@/components/shared/PageWrapper';
import PlatformIcon from '@/components/shared/PlatformIcon';
import AnimatedNumber from '@/components/shared/AnimatedNumber';
import { strategyPlan as strategy } from '@/data/strategy';

/* ─── Content Pillars Config ─── */

const DEFAULT_PILLARS = [
  { id: 'education', name: 'Education', icon: BookOpen, color: '#3b82f6', bg: 'bg-blue-500/15', text: 'text-blue-400', pct: 30 },
  { id: 'bts', name: 'Behind the Scenes', icon: Camera, color: '#a855f7', bg: 'bg-purple-500/15', text: 'text-purple-400', pct: 20 },
  { id: 'trending', name: 'Trending', icon: TrendingUp, color: '#22c55e', bg: 'bg-emerald-500/15', text: 'text-emerald-400', pct: 25 },
  { id: 'engagement', name: 'Engagement', icon: MessageCircle, color: '#eab308', bg: 'bg-amber-500/15', text: 'text-amber-400', pct: 15 },
  { id: 'personal', name: 'Personal', icon: Heart, color: '#ec4899', bg: 'bg-pink-500/15', text: 'text-pink-400', pct: 10 },
];

/* ─── Smart Recommendations ─── */

const AI_RECS = [
  {
    text: 'Post more Reels -- they\'re getting +34% engagement vs static posts',
    metric: '+34%',
    metricColor: 'text-emerald-400',
    icon: ArrowUpRight,
  },
  {
    text: 'Your Tuesday 10am slot consistently outperforms -- schedule high-priority content there',
    metric: '2.4x reach',
    metricColor: 'text-blue-400',
    icon: Zap,
  },
  {
    text: 'Carousel posts on LinkedIn are trending up +28% this month',
    metric: '+28%',
    metricColor: 'text-emerald-400',
    icon: ArrowUpRight,
  },
  {
    text: 'Consider reducing posting frequency on Facebook -- engagement is declining',
    metric: '-18%',
    metricColor: 'text-red-400',
    icon: ArrowDownRight,
  },
];

/* ─── Helpers ─── */

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function normalizePlatform(p) {
  const lower = p.toLowerCase();
  if (lower.startsWith('twitter')) return 'twitter';
  return lower;
}

const CONTENT_TYPE_COLORS = {
  Reel: 'bg-pink-500/20 text-pink-400',
  Video: 'bg-red-500/20 text-red-400',
  Carousel: 'bg-blue-500/20 text-blue-400',
  Thread: 'bg-cyan-500/20 text-cyan-400',
  Short: 'bg-orange-500/20 text-orange-400',
  Post: 'bg-emerald-500/20 text-emerald-400',
  Article: 'bg-indigo-500/20 text-indigo-400',
  'Story Poll': 'bg-purple-500/20 text-purple-400',
  Duet: 'bg-teal-500/20 text-teal-400',
  Poll: 'bg-yellow-500/20 text-yellow-400',
  Live: 'bg-red-500/20 text-red-400',
  Spaces: 'bg-blue-500/20 text-blue-400',
  'Group Post': 'bg-blue-500/20 text-blue-400',
  Challenge: 'bg-amber-500/20 text-amber-400',
  Tutorial: 'bg-emerald-500/20 text-emerald-400',
  Series: 'bg-violet-500/20 text-violet-400',
  'Case Study': 'bg-indigo-500/20 text-indigo-400',
  Vlog: 'bg-rose-500/20 text-rose-400',
  Tweet: 'bg-sky-500/20 text-sky-400',
  'Collab Post': 'bg-pink-500/20 text-pink-400',
};

function getContentTypeClass(type) {
  return CONTENT_TYPE_COLORS[type] || 'bg-gray-500/20 text-gray-400';
}

/* ─── Pillar Card ─── */

function PillarCard({ pillar, isEditing, onToggleEdit, onUpdate }) {
  const [editName, setEditName] = useState(pillar.name);
  const [editPct, setEditPct] = useState(pillar.pct);
  const Icon = pillar.icon;

  const handleSave = () => {
    onUpdate({ ...pillar, name: editName, pct: editPct });
    onToggleEdit(null);
  };

  return (
    <GlassCard
      hover={!isEditing}
      accent={pillar.id === 'education' ? 'blue' : pillar.id === 'bts' ? 'purple' : pillar.id === 'trending' ? 'emerald' : pillar.id === 'engagement' ? 'amber' : 'rose'}
      className="relative overflow-hidden"
      onClick={isEditing ? undefined : () => onToggleEdit(pillar.id)}
    >
      {/* color accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ backgroundColor: pillar.color }} />

      {isEditing ? (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <div className={cn('p-2 rounded-lg', pillar.bg)}>
              <Icon className="w-4 h-4" style={{ color: pillar.color }} />
            </div>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
            />
          </div>
          <div>
            <div className="flex items-center justify-between text-xs text-white/50 mb-1">
              <span>Percentage</span>
              <span className="font-mono">{editPct}%</span>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              value={editPct}
              onChange={(e) => setEditPct(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-purple-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-medium text-white transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => onToggleEdit(null)}
              className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-white/60 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center gap-2 pt-2">
          <div className={cn('p-3 rounded-xl', pillar.bg)}>
            <Icon className="w-5 h-5" style={{ color: pillar.color }} />
          </div>
          <span className="text-sm font-medium text-white">{pillar.name}</span>
          <span className="text-2xl font-bold font-mono" style={{ color: pillar.color }}>
            {pillar.pct}%
          </span>
        </div>
      )}
    </GlassCard>
  );
}

/* ─── Stacked Percentage Bar ─── */

function StackedBar({ pillars }) {
  return (
    <div className="h-3 rounded-full overflow-hidden flex bg-white/5">
      {pillars.map((p) => (
        <motion.div
          key={p.id}
          className="h-full first:rounded-l-full last:rounded-r-full"
          style={{ backgroundColor: p.color }}
          initial={{ width: 0 }}
          animate={{ width: `${p.pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          title={`${p.name}: ${p.pct}%`}
        />
      ))}
    </div>
  );
}

/* ─── Day Detail Modal ─── */

function DayDetail({ post, onClose }) {
  if (!post) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="mt-4 rounded-xl bg-white/5 border border-white/10 p-5 space-y-4"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <PlatformIcon platform={normalizePlatform(post.platform)} size={28} />
          <div>
            <h4 className="text-sm font-semibold text-white">{post.topic}</h4>
            <span className={cn('inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium', getContentTypeClass(post.contentType))}>
              {post.contentType}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/60 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Caption draft */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Copy className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Caption Draft</span>
        </div>
        <p className="text-sm text-white/70 leading-relaxed bg-white/5 rounded-lg p-3 italic">
          &ldquo;{post.captionDraft}&rdquo;
        </p>
      </div>

      {/* Recommended trend */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Recommended Trend</span>
        </div>
        <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-sm font-medium">
          {post.recommendedTrend}
        </span>
      </div>

      {/* A/B test */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">A/B Test Suggestion</span>
        </div>
        <p className="text-sm text-white/60">{post.abTestSuggestion}</p>
      </div>
    </motion.div>
  );
}

/* ─── Week Card (in scrollable timeline) ─── */

function WeekCard({ week, isSelected, isCurrent, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'flex-shrink-0 w-40 rounded-xl border p-4 text-left transition-colors snap-start',
        isSelected
          ? 'bg-purple-500/15 border-purple-500/50'
          : isCurrent
            ? 'bg-blue-500/10 border-blue-500/50'
            : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
      )}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Calendar className={cn('w-4 h-4', isCurrent ? 'text-blue-400' : 'text-white/40')} />
        <span className={cn('text-xs font-bold uppercase tracking-wider', isCurrent ? 'text-blue-400' : 'text-white/50')}>
          Week {week.week}
        </span>
      </div>
      <h4 className="text-sm font-semibold text-white mb-1 line-clamp-2">{week.theme}</h4>
      <span className="text-xs text-white/40">{week.posts.length} posts</span>
    </motion.button>
  );
}

/* ─── Week Detail View ─── */

function WeekDetail({ week }) {
  const [selectedDay, setSelectedDay] = useState(null);

  const postsByDay = useMemo(() => {
    const map = {};
    for (const d of DAYS) map[d] = null;
    for (const post of week.posts) map[post.day] = post;
    return map;
  }, [week]);

  const selectedPost = selectedDay ? postsByDay[selectedDay] : null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      <GlassCard hover={false} className="mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">
            Week {week.week}: {week.theme}
          </h3>
        </div>

        {/* 7-day grid */}
        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((day) => {
            const post = postsByDay[day];
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => post && setSelectedDay(isSelected ? null : day)}
                disabled={!post}
                className={cn(
                  'rounded-lg p-3 text-center transition-all border',
                  post
                    ? isSelected
                      ? 'bg-purple-500/15 border-purple-500/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20 cursor-pointer'
                    : 'bg-white/[0.02] border-white/5 cursor-default opacity-40'
                )}
              >
                <span className="block text-xs font-bold text-white/50 mb-2">{day}</span>
                {post ? (
                  <>
                    <div className="flex justify-center mb-1.5">
                      <PlatformIcon platform={normalizePlatform(post.platform)} size={20} />
                    </div>
                    <span className={cn('inline-block px-1.5 py-0.5 rounded text-[10px] font-medium leading-tight', getContentTypeClass(post.contentType))}>
                      {post.contentType}
                    </span>
                    <p className="text-[10px] text-white/40 mt-1 line-clamp-2">{post.topic}</p>
                  </>
                ) : (
                  <span className="block text-xs text-white/20 mt-4">--</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Day detail expand */}
        <AnimatePresence>
          {selectedPost && <DayDetail post={selectedPost} onClose={() => setSelectedDay(null)} />}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}

/* ─── Weekly Overview Stats ─── */

function WeeklyOverview({ week }) {
  const platforms = useMemo(() => {
    const set = new Set();
    week.posts.forEach((p) => set.add(normalizePlatform(p.platform)));
    return [...set];
  }, [week]);

  const contentMix = useMemo(() => {
    const map = {};
    week.posts.forEach((p) => {
      map[p.contentType] = (map[p.contentType] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [week]);

  return (
    <GlassCard hover={false} accent="cyan">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-white">This Week</h3>
        <span className="ml-auto text-xs text-white/40">Week {week.week}</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <AnimatedNumber value={week.posts.length} className="text-2xl font-bold text-white" />
          <p className="text-xs text-white/40 mt-0.5">Posts</p>
        </div>
        <div className="text-center">
          <AnimatedNumber value={platforms.length} className="text-2xl font-bold text-white" />
          <p className="text-xs text-white/40 mt-0.5">Platforms</p>
        </div>
        <div className="text-center">
          <AnimatedNumber value={contentMix.length} className="text-2xl font-bold text-white" />
          <p className="text-xs text-white/40 mt-0.5">Content Types</p>
        </div>
      </div>

      {/* Content mix bars */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Content Mix</span>
        {contentMix.map(([type, count]) => (
          <div key={type} className="flex items-center gap-3">
            <span className={cn('px-2 py-0.5 rounded text-xs font-medium w-24 text-center', getContentTypeClass(type))}>
              {type}
            </span>
            <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${(count / week.posts.length) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs text-white/40 font-mono w-4 text-right">{count}</span>
          </div>
        ))}
      </div>

      {/* Platforms covered */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <span className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-2">Platforms</span>
        <div className="flex gap-2">
          {platforms.map((p) => (
            <PlatformIcon key={p} platform={p} size={24} />
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

/* ─── Main Page ─── */

export default function Strategy() {
  const [pillars, setPillars] = useState(DEFAULT_PILLARS);
  const [editingPillar, setEditingPillar] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);

  // Current active week
  const currentWeekNum = 1;

  const activeWeek = useMemo(() => {
    if (selectedWeek !== null) return strategy.find((w) => w.week === selectedWeek);
    return strategy.find((w) => w.week === currentWeekNum);
  }, [selectedWeek]);

  const handlePillarUpdate = useCallback((updated) => {
    setPillars((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  const scrollLeft = useCallback(() => {
    const el = document.getElementById('week-timeline');
    if (el) el.scrollBy({ left: -340, behavior: 'smooth' });
  }, []);

  const scrollRight = useCallback(() => {
    const el = document.getElementById('week-timeline');
    if (el) el.scrollBy({ left: 340, behavior: 'smooth' });
  }, []);

  return (
    <PageWrapper>
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Target className="w-8 h-8 text-purple-400" />
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
            Content Strategy
          </h1>
        </div>
        <p className="text-white/50 text-sm ml-11">Plan your content empire</p>
      </div>

      {/* ── Content Pillars ── */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Content Pillars</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <PillarCard
                pillar={pillar}
                isEditing={editingPillar === pillar.id}
                onToggleEdit={setEditingPillar}
                onUpdate={handlePillarUpdate}
              />
            </motion.div>
          ))}
        </div>
        <StackedBar pillars={pillars} />
        <div className="flex justify-center gap-4 mt-2">
          {pillars.map((p) => (
            <div key={p.id} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-xs text-white/40">{p.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Smart Recommendations ── */}
      <section className="mb-8">
        <GlassCard hover={false} gradient accent="purple">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-purple-400" />
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-semibold text-white">Smart Recommendations</h3>
          </div>
          <div className="space-y-3">
            {AI_RECS.map((rec, i) => {
              const Icon = rec.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-3 rounded-lg bg-white/5 p-3"
                >
                  <div className="p-1.5 rounded-lg bg-white/5 shrink-0 mt-0.5">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-sm text-white/70 flex-1 leading-relaxed">{rec.text}</p>
                  <span className={cn('flex items-center gap-1 text-sm font-bold shrink-0', rec.metricColor)}>
                    <Icon className="w-3.5 h-3.5" />
                    {rec.metric}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </GlassCard>
      </section>

      {/* ── 12-Week Calendar + Weekly Overview ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">12-Week Calendar</h2>
          <div className="flex gap-2">
            <button
              onClick={scrollLeft}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={scrollRight}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal scrollable timeline */}
        <div
          id="week-timeline"
          className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
        >
          {strategy.map((week) => (
            <WeekCard
              key={week.week}
              week={week}
              isSelected={selectedWeek === week.week}
              isCurrent={week.week === currentWeekNum && selectedWeek === null}
              onClick={() => setSelectedWeek((prev) => (prev === week.week ? null : week.week))}
            />
          ))}
        </div>

        {/* Expanded week detail */}
        <AnimatePresence mode="wait">
          {(selectedWeek !== null || true) && activeWeek && (
            <WeekDetail key={activeWeek.week} week={activeWeek} />
          )}
        </AnimatePresence>
      </section>

      {/* ── Weekly Overview ── */}
      {activeWeek && (
        <section>
          <WeeklyOverview week={activeWeek} />
        </section>
      )}
    </PageWrapper>
  );
}
