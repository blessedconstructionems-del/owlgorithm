import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  setHours,
  setMinutes,
  parseISO,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  List,
  Plus,
  Sparkles,
  X,
  Check,
  Camera,
  Clock,
  Hash,
  MessageSquare,
  Smile,
  Zap,
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import GlassCard from '@/components/shared/GlassCard';
import PageWrapper from '@/components/shared/PageWrapper';
import StatusBadge from '@/components/shared/StatusBadge';
import PlatformIcon from '@/components/shared/PlatformIcon';
import { posts } from '@/data/posts';
import { trends } from '@/data/trends';

// ─── Platform configs ────────────────────────────────────────────
const PLATFORMS = [
  { id: 'tiktok', name: 'TikTok', followers: '24.8K', color: '#00f2ea', charLimit: 2200 },
  { id: 'instagram', name: 'Instagram', followers: '18.2K', color: '#E4405F', charLimit: 2200 },
  { id: 'youtube', name: 'YouTube', followers: '12.4K', color: '#FF0000', charLimit: 5000 },
  { id: 'linkedin', name: 'LinkedIn', followers: '8.6K', color: '#0077B5', charLimit: 3000 },
  { id: 'twitter', name: 'Twitter/X', followers: '6.3K', color: '#1DA1F2', charLimit: 280 },
  { id: 'pinterest', name: 'Pinterest', followers: '4.1K', color: '#BD081C', charLimit: 500 },
  { id: 'reddit', name: 'Reddit', followers: '2.8K', color: '#FF4500', charLimit: 40000 },
  { id: 'facebook', name: 'Facebook', followers: '3.4K', color: '#1877F2', charLimit: 63206 },
];

const PLATFORM_COLORS = {
  tiktok: '#00f2ea',
  instagram: '#E4405F',
  youtube: '#FF0000',
  linkedin: '#0077B5',
  'twitter/x': '#1DA1F2',
  twitter: '#1DA1F2',
  pinterest: '#BD081C',
  reddit: '#FF4500',
  facebook: '#1877F2',
};

const HASHTAG_SUGGESTIONS = [
  '#AITools', '#Productivity', '#ContentCreator', '#MarketingTips', '#SocialMedia',
  '#Owlgorithm', '#GrowthHacking', '#DigitalMarketing', '#CreatorEconomy', '#Viral',
];

const HOOK_SUGGESTIONS = [
  'Stop scrolling — this will change how you think about content forever.',
  'I tested this for 30 days and the results blew my mind.',
  'Nobody talks about this, but it\'s the #1 reason your content flops.',
];

const AI_CAPTIONS = [
  'Just discovered the most underrated productivity hack of 2026. I\'ve been using it for 2 weeks and my output has literally doubled. Here\'s the full breakdown (save this for later)...',
  'POV: You finally found the content strategy that actually works. No gimmicks, no hacks — just pure value that makes the algorithm love you. Thread incoming...',
  'I analyzed 200 viral posts this week and found ONE pattern they all share. Spoiler: it\'s not what the "gurus" tell you. Watch till the end for the framework.',
];

// ─── Helper to get platform color for calendar dots ──────────────
function getPlatformDotColor(platform) {
  return PLATFORM_COLORS[platform?.toLowerCase()] || '#6b7280';
}

// ─── Wizard Step Indicator ───────────────────────────────────────
function StepIndicator({ currentStep, totalSteps }) {
  const labels = ['Platforms', 'Content', 'Media', 'Schedule', 'Enchantments', 'Review'];
  return (
    <div className="flex items-center justify-center gap-1 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <motion.div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                  isActive && 'border-blue-500 bg-blue-500/20 text-blue-400',
                  isCompleted && 'border-emerald-500 bg-emerald-500/20 text-emerald-400',
                  !isActive && !isCompleted && 'border-white/20 text-gray-500'
                )}
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {isCompleted ? <Check size={14} /> : step}
              </motion.div>
              <span className={cn(
                'text-[10px] hidden sm:block',
                isActive ? 'text-blue-400' : isCompleted ? 'text-emerald-400' : 'text-gray-600'
              )}>
                {labels[i]}
              </span>
            </div>
            {i < totalSteps - 1 && (
              <div className={cn(
                'w-8 h-0.5 mx-1 mb-4',
                step < currentStep ? 'bg-emerald-500' : 'bg-white/10'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Create Post Wizard ──────────────────────────────────────────
function CreatePostWizard({ onClose }) {
  const [step, setStep] = useState(1);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [caption, setCaption] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedHashtags, setSelectedHashtags] = useState([]);
  const [selectedHook, setSelectedHook] = useState(null);
  const [mediaUploaded, setMediaUploaded] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [scheduledHour, setScheduledHour] = useState(10);
  const [scheduledMinute, setScheduledMinute] = useState(0);
  const [aiTimeSelected, setAiTimeSelected] = useState(false);
  const [enchantments, setEnchantments] = useState({
    optimizeHashtags: true,
    addHook: false,
    emojiOptimization: false,
    trendAlignment: true,
  });
  const [success, setSuccess] = useState(false);

  const togglePlatform = useCallback((id) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }, []);

  const toggleHashtag = useCallback((tag) => {
    setSelectedHashtags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleAIGenerate = useCallback(() => {
    setIsGenerating(true);
    setTimeout(() => {
      setCaption(AI_CAPTIONS[Math.floor(Math.random() * AI_CAPTIONS.length)]);
      setIsGenerating(false);
    }, 1000);
  }, []);

  const handleAIOptimalTime = useCallback(() => {
    setScheduledHour(10);
    setScheduledMinute(0);
    // Set to next Tuesday
    const now = new Date();
    let target = new Date(now);
    const dayOfWeek = now.getDay();
    const daysUntilTuesday = (2 - dayOfWeek + 7) % 7 || 7;
    target.setDate(target.getDate() + daysUntilTuesday);
    setScheduledDate(target);
    setAiTimeSelected(true);
    setTimeout(() => setAiTimeSelected(false), 2000);
  }, []);

  const handleSchedule = useCallback((isDraft) => {
    setSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  }, [onClose]);

  const minCharLimit = useMemo(() => {
    if (selectedPlatforms.length === 0) return 5000;
    return Math.min(
      ...selectedPlatforms.map((id) => PLATFORMS.find((p) => p.id === id)?.charLimit || 5000)
    );
  }, [selectedPlatforms]);

  const charCount = caption.length;
  const charWarning = charCount > minCharLimit * 0.9;
  const charOver = charCount > minCharLimit;

  // Mini calendar for step 4
  const miniCalDays = useMemo(() => {
    const monthStart = startOfMonth(scheduledDate);
    const monthEnd = endOfMonth(scheduledDate);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [scheduledDate]);

  if (success) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center justify-center py-16"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        >
          <CheckCircle2 size={64} className="text-emerald-400 mb-4" />
        </motion.div>
        <h3 className="text-2xl font-bold text-white mb-2">Post Scheduled!</h3>
        <p className="text-gray-400">Your content is queued and ready to go.</p>
      </motion.div>
    );
  }

  return (
    <div>
      <StepIndicator currentStep={step} totalSteps={6} />

      <AnimatePresence mode="wait">
        {/* Step 1: Platform Selection */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">Select Platforms</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PLATFORMS.map((p) => {
                const isSelected = selectedPlatforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={cn(
                      'glass-card rounded-xl p-4 text-left transition-all border-2',
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-transparent hover:border-white/20'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <PlatformIcon platform={p.id} size={28} />
                      {isSelected && <Check size={14} className="text-blue-400 ml-auto" />}
                    </div>
                    <div className="text-sm font-medium text-white">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.followers} followers</div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Step 2: Content Creation */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">Create Content</h3>
            <div className="relative mb-3">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write your caption..."
                rows={6}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500/50 transition-colors"
              />
              <div className={cn(
                'absolute bottom-3 right-3 text-xs font-mono',
                charOver ? 'text-red-400' : charWarning ? 'text-amber-400' : 'text-gray-500'
              )}>
                {charCount} / {minCharLimit}
              </div>
            </div>

            <button
              onClick={handleAIGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 mb-6"
            >
              <Sparkles size={14} className={isGenerating ? 'animate-spin' : ''} />
              {isGenerating ? 'Generating...' : 'Auto Generate'}
            </button>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-1.5">
                <Hash size={14} /> Hashtag Suggestions
              </h4>
              <div className="flex flex-wrap gap-2">
                {HASHTAG_SUGGESTIONS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      toggleHashtag(tag);
                      if (!caption.includes(tag)) {
                        setCaption((prev) => prev + (prev ? ' ' : '') + tag);
                      }
                    }}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                      selectedHashtags.includes(tag)
                        ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                        : 'border-white/10 text-gray-400 hover:border-white/20'
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-1.5">
                <MessageSquare size={14} /> Hook Suggestions
              </h4>
              <div className="space-y-2">
                {HOOK_SUGGESTIONS.map((hook, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedHook(i);
                      setCaption(hook + '\n\n' + caption);
                    }}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border text-sm transition-all',
                      selectedHook === i
                        ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                        : 'border-white/10 text-gray-400 hover:border-white/20'
                    )}
                  >
                    {hook}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Media */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">Add Media</h3>
            {!mediaUploaded ? (
              <button
                onClick={() => setMediaUploaded(true)}
                className="w-full border-2 border-dashed border-white/20 rounded-2xl p-12 flex flex-col items-center gap-3 hover:border-blue-500/50 transition-colors group"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                  <Upload size={28} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
                </div>
                <p className="text-gray-400 text-sm">Drop media here or click to upload</p>
                <p className="text-gray-600 text-xs">PNG, JPG, MP4, MOV up to 100MB</p>
              </button>
            ) : (
              <div className="relative rounded-2xl overflow-hidden">
                <div
                  className="w-full h-64 rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/50 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                    <ImageIcon size={16} className="text-white" />
                    <span className="text-white text-sm font-medium">media_001.jpg</span>
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  </div>
                </div>
                <button
                  onClick={() => setMediaUploaded(false)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-red-500/50 transition-colors"
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 4: Scheduling */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">Schedule</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mini calendar */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setScheduledDate((d) => subMonths(d, 1))}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    <ChevronLeft size={16} className="text-gray-400" />
                  </button>
                  <span className="text-sm font-medium text-white">
                    {format(scheduledDate, 'MMMM yyyy')}
                  </span>
                  <button
                    onClick={() => setScheduledDate((d) => addMonths(d, 1))}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    <ChevronRight size={16} className="text-gray-400" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <div key={d} className="text-gray-500 py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {miniCalDays.map((day, i) => {
                    const isSelected = isSameDay(day, scheduledDate);
                    const inMonth = isSameMonth(day, scheduledDate);
                    const today = isToday(day);
                    return (
                      <button
                        key={i}
                        onClick={() => setScheduledDate(day)}
                        className={cn(
                          'w-8 h-8 rounded-lg text-xs flex items-center justify-center transition-all mx-auto',
                          !inMonth && 'text-gray-700',
                          inMonth && !isSelected && 'text-gray-300 hover:bg-white/10',
                          isSelected && 'bg-blue-500 text-white font-bold',
                          today && !isSelected && 'ring-1 ring-blue-500/50 text-blue-400'
                        )}
                      >
                        {format(day, 'd')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time picker + AI Optimal */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Time</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={scheduledHour}
                      onChange={(e) => setScheduledHour(Number(e.target.value))}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50 appearance-none"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i} className="bg-gray-900">
                          {String(i).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    <span className="text-gray-400 font-bold">:</span>
                    <select
                      value={scheduledMinute}
                      onChange={(e) => setScheduledMinute(Number(e.target.value))}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50 appearance-none"
                    >
                      {[0, 15, 30, 45].map((m) => (
                        <option key={m} value={m} className="bg-gray-900">
                          {String(m).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <motion.button
                  onClick={handleAIOptimalTime}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
                  animate={aiTimeSelected ? { scale: [1, 1.15, 1] } : {}}
                >
                  <Sparkles size={14} className={aiTimeSelected ? 'animate-spin' : ''} />
                  Optimal Time
                  {aiTimeSelected && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-xs bg-white/20 px-2 py-0.5 rounded-full"
                    >
                      Tue 10:00 AM
                    </motion.span>
                  )}
                </motion.button>

                {/* Prime posting window */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Prime Posting Window</label>
                  <div className="relative h-10 bg-white/5 rounded-lg overflow-hidden border border-white/10">
                    {/* 24-hour bar */}
                    <div className="absolute inset-0 flex">
                      {Array.from({ length: 24 }, (_, h) => {
                        const isPrime = (h >= 9 && h <= 11) || (h >= 19 && h <= 21);
                        return (
                          <div
                            key={h}
                            className="flex-1 relative group"
                          >
                            {isPrime && (
                              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/40 to-blue-600/20" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* Labels */}
                    <div className="absolute inset-0 flex items-end px-1 pb-0.5">
                      <span className="text-[8px] text-gray-500 absolute left-0">12am</span>
                      <span className="text-[8px] text-blue-400 absolute" style={{ left: '37.5%' }}>9am</span>
                      <span className="text-[8px] text-blue-400 absolute" style={{ left: '45.8%' }}>11am</span>
                      <span className="text-[8px] text-blue-400 absolute" style={{ left: '79.2%' }}>7pm</span>
                      <span className="text-[8px] text-blue-400 absolute" style={{ left: '87.5%' }}>9pm</span>
                      <span className="text-[8px] text-gray-500 absolute right-0">12am</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Best hours highlighted in blue (9-11 AM, 7-9 PM)</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 5: Enchantments */}
        {step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">Enchantments</h3>
            <div className="space-y-4">
              {[
                { key: 'optimizeHashtags', icon: Hash, title: 'Optimize Hashtags', desc: 'Selects trending hashtags for maximum reach' },
                { key: 'addHook', icon: MessageSquare, title: 'Add Hook', desc: 'Writes an attention-grabbing first line' },
                { key: 'emojiOptimization', icon: Smile, title: 'Emoji Optimization', desc: 'Add strategic emojis to boost engagement' },
                { key: 'trendAlignment', icon: Zap, title: 'Trend Alignment', desc: 'Align your post with current Ripples for discovery' },
              ].map(({ key, icon: Icon, title, desc }) => (
                <div
                  key={key}
                  className="glass-card rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      enchantments[key] ? 'bg-blue-500/20' : 'bg-white/5'
                    )}>
                      <Icon size={18} className={enchantments[key] ? 'text-blue-400' : 'text-gray-500'} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{title}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setEnchantments((prev) => ({ ...prev, [key]: !prev[key] }))}
                    className={cn(
                      'w-12 h-6 rounded-full transition-all relative',
                      enchantments[key] ? 'bg-blue-500' : 'bg-white/10'
                    )}
                  >
                    <motion.div
                      className="w-5 h-5 rounded-full bg-white absolute top-0.5"
                      animate={{ left: enchantments[key] ? 26 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 6: Review */}
        {step === 6 && (
          <motion.div
            key="step6"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">Review & Schedule</h3>
            <div className="glass-card rounded-xl p-6 space-y-4">
              {/* Platforms */}
              <div>
                <div className="text-xs text-gray-500 mb-1">Platforms</div>
                <div className="flex gap-2">
                  {selectedPlatforms.length > 0 ? selectedPlatforms.map((id) => {
                    const p = PLATFORMS.find((pl) => pl.id === id);
                    return (
                      <div key={id} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 text-xs text-gray-300">
                        <PlatformIcon platform={id} size={16} />
                        {p?.name}
                      </div>
                    );
                  }) : <span className="text-gray-600 text-sm">No platforms selected</span>}
                </div>
              </div>

              {/* Date / Time */}
              <div>
                <div className="text-xs text-gray-500 mb-1">Scheduled For</div>
                <div className="text-sm text-white">
                  {format(scheduledDate, 'EEEE, MMMM d, yyyy')} at {String(scheduledHour).padStart(2, '0')}:{String(scheduledMinute).padStart(2, '0')}
                </div>
              </div>

              {/* Caption */}
              <div>
                <div className="text-xs text-gray-500 mb-1">Caption</div>
                <p className="text-sm text-gray-300 whitespace-pre-wrap line-clamp-4">
                  {caption || <span className="text-gray-600 italic">No caption written</span>}
                </p>
              </div>

              {/* Enchantments */}
              <div>
                <div className="text-xs text-gray-500 mb-1">Enchantments</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(enchantments).map(([key, enabled]) => (
                    <span
                      key={key}
                      className={cn(
                        'px-2 py-0.5 rounded-full text-xs',
                        enabled ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-600 line-through'
                      )}
                    >
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>

              {/* Media */}
              <div>
                <div className="text-xs text-gray-500 mb-1">Media</div>
                <span className="text-sm text-gray-300">{mediaUploaded ? '1 file attached' : 'No media'}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleSchedule(false)}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Schedule
              </button>
              <button
                onClick={() => handleSchedule(true)}
                className="flex-1 py-3 rounded-xl border border-white/20 text-gray-300 font-semibold hover:bg-white/5 transition-colors"
              >
                Save Draft
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      {!success && (
        <div className="flex justify-between mt-8 pt-4 border-t border-white/10">
          <button
            onClick={() => step > 1 && setStep((s) => s - 1)}
            disabled={step === 1}
            className="flex items-center gap-1 px-4 py-2 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </button>
          {step < 6 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-1 px-4 py-2 text-sm bg-white/10 hover:bg-white/15 text-white rounded-lg transition-colors"
            >
              Next <ArrowRight size={14} />
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ─── Main Scheduler Page ─────────────────────────────────────────
export default function Scheduler() {
  const [viewMode, setViewMode] = useState('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showWizard, setShowWizard] = useState(false);

  // Build calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  // Map posts to dates
  const postsByDate = useMemo(() => {
    const map = {};
    posts.forEach((post) => {
      const dateKey = new Date(post.scheduledAt).toISOString().split('T')[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(post);
    });
    return map;
  }, []);

  // Get posts for selected day
  const selectedDayPosts = useMemo(() => {
    if (!selectedDay) return [];
    const key = selectedDay.toISOString().split('T')[0];
    return postsByDate[key] || [];
  }, [selectedDay, postsByDate]);

  // List view: group all posts by date
  const groupedPosts = useMemo(() => {
    const sorted = [...posts].sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    const groups = {};
    sorted.forEach((post) => {
      const dateKey = format(new Date(post.scheduledAt), 'yyyy-MM-dd');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(post);
    });
    return Object.entries(groups).map(([date, posts]) => ({ date, posts }));
  }, []);

  // Resolve trend name from ID
  const getTrendName = useCallback((trendId) => {
    if (!trendId) return null;
    const trend = trends.find((t) => t.id === trendId);
    return trend?.name || trendId;
  }, []);

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Content Scheduler</h1>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex bg-white/5 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                viewMode === 'calendar'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              <CalendarDays size={14} /> Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                viewMode === 'list'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              <List size={14} /> List
            </button>
          </div>

          {/* Create Post button */}
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20"
          >
            <Plus size={16} /> Create Post
          </button>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="flex flex-col lg:flex-row gap-6">
          <GlassCard hover={false} accent="blue" className="flex-1">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} className="text-gray-400" />
              </button>
              <h2 className="text-lg font-semibold text-white">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <button
                onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronRight size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-center text-[10px] sm:text-xs font-medium text-gray-500 py-1 sm:py-2">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                const dateKey = day.toISOString().split('T')[0];
                const dayPosts = postsByDate[dateKey] || [];
                const inMonth = isSameMonth(day, currentMonth);
                const today = isToday(day);
                const isSelected = selectedDay && isSameDay(day, selectedDay);

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      'relative min-h-[48px] sm:min-h-[72px] p-1 sm:p-2 rounded-lg text-left transition-all border',
                      inMonth ? 'text-gray-200' : 'text-gray-700',
                      isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-transparent hover:bg-white/5',
                      today && !isSelected && 'ring-2 ring-blue-500/40'
                    )}
                  >
                    <span className={cn(
                      'text-xs font-medium',
                      today && 'text-blue-400 font-bold'
                    )}>
                      {format(day, 'd')}
                    </span>
                    {dayPosts.length > 0 && (
                      <div className="flex gap-0.5 mt-1 flex-wrap">
                        {dayPosts.slice(0, 3).map((post, j) => (
                          <div
                            key={j}
                            className="w-2 h-2 rounded-full ring-1 ring-white/20"
                            style={{
                              backgroundColor: getPlatformDotColor(post.platform),
                              filter: 'brightness(1.3) saturate(1.2)',
                              boxShadow: `0 0 4px ${getPlatformDotColor(post.platform)}80`,
                            }}
                            title={`${post.platform}: ${post.caption.slice(0, 40)}...`}
                          />
                        ))}
                        {dayPosts.length > 3 && (
                          <span className="text-[8px] text-gray-500 ml-0.5">+{dayPosts.length - 3}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* Side panel: selected day's posts */}
          <div className="w-full lg:w-80 shrink-0">
            <GlassCard hover={false} accent="purple" className="sticky top-6">
              <h3 className="text-sm font-semibold text-white mb-4">
                {selectedDay ? format(selectedDay, 'EEEE, MMMM d') : 'Select a day'}
              </h3>
              {selectedDay && selectedDayPosts.length === 0 && (
                <p className="text-sm text-gray-500">No posts scheduled for this day.</p>
              )}
              <div className="space-y-3">
                {selectedDayPosts.map((post) => (
                  <div key={post.id} className="p-3 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <PlatformIcon platform={post.platform} size={20} />
                      <span className="text-xs text-gray-400">
                        {format(new Date(post.scheduledAt), 'h:mm a')}
                      </span>
                      <div className="ml-auto">
                        <StatusBadge status={post.status} />
                      </div>
                    </div>
                    <p className="text-xs text-gray-300 line-clamp-2">{post.caption}</p>
                    {post.connectedTrend && (
                      <div className="mt-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                          {getTrendName(post.connectedTrend)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {groupedPosts.map(({ date, posts }) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-gray-400 mb-3 sticky top-0 bg-[#0A0E14]/80 backdrop-blur py-2 z-10">
                {format(new Date(date + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}
              </h3>
              <div className="space-y-2">
                {posts.map((post) => (
                  <GlassCard key={post.id} hover={true} className="!p-4">
                    <div className="flex items-center gap-3">
                      <PlatformIcon platform={post.platform} size={32} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={10} />
                            {format(new Date(post.scheduledAt), 'h:mm a')}
                          </span>
                          <StatusBadge status={post.status} />
                          {post.connectedTrend && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 hidden sm:inline">
                              {getTrendName(post.connectedTrend)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-200 truncate">{post.caption}</p>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Post Wizard Modal */}
      <AnimatePresence>
        {showWizard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowWizard(false)}
            />
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[85vh] overflow-y-auto"
            >
              <GlassCard hover={false} accent="cyan" className="!rounded-t-2xl sm:!rounded-2xl p-4 sm:p-6">
                <button
                  onClick={() => setShowWizard(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors z-10"
                >
                  <X size={18} className="text-gray-400" />
                </button>
                <h2 className="text-xl font-bold gradient-text mb-2">Create Post</h2>
                <CreatePostWizard onClose={() => setShowWizard(false)} />
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
