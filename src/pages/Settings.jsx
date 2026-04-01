import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, FileText, Save, Tag, Bell, BellOff, Crown, Download,
  Palette, Trash2, ExternalLink, Shield, CreditCard, Check, Moon, Sun,
  Monitor, Play, Circle,
} from 'lucide-react';
import GlassCard from '@/components/shared/GlassCard';
import PageWrapper from '@/components/shared/PageWrapper';
import PlatformIcon from '@/components/shared/PlatformIcon';
import { useApp } from '@/context/AppContext';
import { platforms } from '@/data/platforms';

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const ALL_NICHES = [
  'Marketing', 'Social Media', 'Lifestyle', 'Tech', 'Fashion', 'Food',
  'Travel', 'Fitness', 'Education', 'Entertainment', 'Business', 'Photography',
];

const NOTIFICATION_SETTINGS = [
  { key: 'emailAlerts', label: 'Email Alerts', description: 'Get important updates via email', default: true },
  { key: 'pushNotifications', label: 'Push Notifications', description: 'Browser push notifications for real-time alerts', default: true },
  { key: 'trendAlerts', label: 'Trend Alerts', description: 'Notify when new trends are detected', default: true },
  { key: 'weeklyReport', label: 'Weekly Report', description: 'Receive a weekly performance summary', default: true },
  { key: 'nightWatch', label: 'Night Watch Briefing', description: 'Morning briefing of overnight trend activity', default: true },
  { key: 'abTestResults', label: 'A/B Test Results', description: 'Get notified when A/B tests complete', default: false },
];

const ENVIRONMENTS = [
  {
    id: 'snowy-owl',
    name: 'Snowy Owl',
    value: '/snowy-owl.mp4',
    preview: 'linear-gradient(135deg, #1a2332, #2d3a4a, #e8edf2)',
  },
  {
    id: 'fantasy-mountain',
    name: 'Fantasy Mountain',
    value: '/fantasy-mountain-landscape.1920x1080.mp4',
    preview: 'linear-gradient(135deg, #1a3a2a, #2d4a3a, #4a6a5a)',
  },
  {
    id: 'cosmos-flowers',
    name: 'Cosmos Flowers',
    value: '/cosmos-flowers.3840x2160.mp4',
    preview: 'linear-gradient(135deg, #2a1a3a, #4a2d5a, #6a3a7a)',
  },
  {
    id: 'circuit-board',
    name: 'Circuit Board',
    value: '/circuit-board.3840x2160.mp4',
    preview: 'linear-gradient(135deg, #0a1a2a, #1a3a4a, #0a2a3a)',
  },
  {
    id: 'tech-hud',
    name: 'Tech HUD',
    value: '/tech-hud.3840x2160.mp4',
    preview: 'linear-gradient(135deg, #0a0a2a, #1a1a4a, #0a1a3a)',
  },
];

const PLAN_FEATURES = [
  'Unlimited trends',
  'Smart insights',
  'A/B testing',
  'Night Watch',
  'Priority support',
  'Custom alerts',
];

function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
        checked ? 'bg-blue-500' : 'bg-white/10'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function Settings() {
  const { user, connectedPlatforms, environment, setEnvironment } = useApp();

  // Profile state
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [bio, setBio] = useState('Marketing strategist & trend hunter \u{1F989}');
  const [profileSaved, setProfileSaved] = useState(false);

  // Niche state
  const [selectedNiches, setSelectedNiches] = useState(['Marketing', 'Social Media', 'Lifestyle']);

  // Notification state
  const [notifications, setNotifications] = useState(() => {
    const initial = {};
    NOTIFICATION_SETTINGS.forEach((s) => { initial[s.key] = s.default; });
    return initial;
  });

  // Theme state
  const [theme, setTheme] = useState('dark');

  const handleSaveProfile = useCallback(() => {
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  }, []);

  const toggleNiche = useCallback((niche) => {
    setSelectedNiches((prev) =>
      prev.includes(niche) ? prev.filter((n) => n !== niche) : [...prev, niche]
    );
  }, []);

  const toggleNotification = useCallback((key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const isConnected = useCallback((id) => {
    const p = platforms.find((pl) => pl.id === id);
    return p?.connected || connectedPlatforms.includes(id);
  }, [connectedPlatforms]);

  const connectedPlatformList = platforms.filter((p) => isConnected(p.id));
  const aiCreditsUsed = 847;
  const aiCreditsTotal = 1000;

  return (
    <PageWrapper>
      <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-8 max-w-4xl">
        {/* Header */}
        <motion.div variants={fadeUp}>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Settings
          </h1>
        </motion.div>

        {/* Profile Section */}
        <motion.div variants={fadeUp}>
          <GlassCard hover={false} accent="blue">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" /> Profile
            </h2>
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-3xl font-bold text-white">
                  {name.charAt(0).toUpperCase()}
                </div>
                <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  Change Avatar
                </button>
              </div>

              {/* Fields */}
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Bio</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSaveProfile}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg shadow-blue-500/20"
                >
                  {profileSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {profileSaved ? 'Saved!' : 'Save Changes'}
                </button>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Niche Preferences */}
        <motion.div variants={fadeUp}>
          <GlassCard hover={false} accent="purple">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-purple-400" /> Niche Preferences
            </h2>
            <p className="text-sm text-gray-400 mb-4">Select your areas of interest to personalize trend recommendations.</p>
            <div className="flex flex-wrap gap-2">
              {ALL_NICHES.map((niche) => {
                const selected = selectedNiches.includes(niche);
                return (
                  <button
                    key={niche}
                    onClick={() => toggleNiche(niche)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      selected
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-sm shadow-blue-500/10'
                        : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20 hover:text-gray-300'
                    }`}
                  >
                    {niche}
                  </button>
                );
              })}
            </div>
          </GlassCard>
        </motion.div>

        {/* Notification Preferences */}
        <motion.div variants={fadeUp}>
          <GlassCard hover={false} accent="amber">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" /> Notification Preferences
            </h2>
            <div className="space-y-4">
              {NOTIFICATION_SETTINGS.map((setting) => (
                <div
                  key={setting.key}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <div className="flex-1 mr-4">
                    <p className="text-sm font-medium text-white">{setting.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{setting.description}</p>
                  </div>
                  <Toggle
                    checked={notifications[setting.key]}
                    onChange={() => toggleNotification(setting.key)}
                  />
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Subscription Panel */}
        <motion.div variants={fadeUp}>
          <GlassCard hover={false} gradient>
            <div className="flex items-center gap-3 mb-6">
              <Crown className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">Subscription</h2>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                {user.plan}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {PLAN_FEATURES.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-sm text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Credits</span>
                <span className="text-sm font-mono text-white">
                  {aiCreditsUsed} / {aiCreditsTotal}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(aiCreditsUsed / aiCreditsTotal) * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                {aiCreditsTotal - aiCreditsUsed} credits remaining this month
              </p>
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-colors">
              <CreditCard className="w-4 h-4" />
              Manage Subscription
            </button>
          </GlassCard>
        </motion.div>

        {/* Theme Toggle */}
        <motion.div variants={fadeUp}>
          <GlassCard hover={false}>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5 text-blue-400" /> Theme
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                  theme === 'dark'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 ring-2 ring-blue-500/20'
                    : 'bg-white/5 text-gray-400 border border-white/10'
                }`}
              >
                <Moon className="w-4 h-4" />
                Dark
              </button>
              <button
                disabled
                className="relative flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed"
              >
                <Sun className="w-4 h-4" />
                Light
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-gray-700 text-gray-500">
                  Coming Soon
                </span>
              </button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Environment Picker */}
        <motion.div variants={fadeUp}>
          <GlassCard hover={false} accent="cyan">
            <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-cyan-400" /> Environment
            </h2>
            <p className="text-sm text-gray-400 mb-5">Choose a background environment for your workspace.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ENVIRONMENTS.map((env) => {
                const active = environment === env.value;
                return (
                  <button
                    key={env.id}
                    onClick={() => setEnvironment(env.value)}
                    className={`group relative flex flex-col items-center gap-2 rounded-xl p-3 transition-all duration-200 ${
                      active
                        ? 'bg-cyan-500/15 border-2 border-cyan-500/50 ring-2 ring-cyan-500/20'
                        : 'bg-white/5 border-2 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div
                      className="w-full aspect-video rounded-lg overflow-hidden relative"
                      style={{ background: env.preview }}
                    >
                      {env.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="w-5 h-5 text-white/60" />
                        </div>
                      )}
                      {active && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <span className={`text-xs font-medium ${active ? 'text-cyan-400' : 'text-gray-400 group-hover:text-gray-300'}`}>
                      {env.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </GlassCard>
        </motion.div>

        {/* Data Export */}
        <motion.div variants={fadeUp}>
          <GlassCard hover={false} accent="emerald">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-400" /> Data Export
            </h2>
            <p className="text-sm text-gray-400 mb-4">Download a copy of your data.</p>
            <div className="flex flex-wrap gap-3 mb-3">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors">
                <Download className="w-4 h-4" />
                Download as CSV
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors">
                <Download className="w-4 h-4" />
                Download as JSON
              </button>
            </div>
            <p className="text-xs text-gray-600">Last export: Never</p>
          </GlassCard>
        </motion.div>

        {/* Connected Platforms Summary */}
        <motion.div variants={fadeUp}>
          <GlassCard hover={false} accent="cyan">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" /> Connected Platforms
            </h2>
            {connectedPlatformList.length === 0 ? (
              <p className="text-sm text-gray-500">No platforms connected yet.</p>
            ) : (
              <div className="space-y-3">
                {connectedPlatformList.map((platform) => (
                  <div
                    key={platform.id}
                    className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <PlatformIcon platform={platform.icon} size={28} />
                      <div>
                        <p className="text-sm font-medium text-white">{platform.name}</p>
                        {platform.accountName && (
                          <p className="text-xs text-gray-500">{platform.accountName}</p>
                        )}
                      </div>
                    </div>
                    <a
                      href="/platforms"
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                    >
                      Manage <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Danger Zone */}
        <motion.div variants={fadeUp}>
          <GlassCard hover={false} accent="rose" className="!border !border-red-500/20">
            <h2 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Danger Zone
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Once you delete your account, all of your data will be permanently removed. This action cannot be undone.
            </p>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors">
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </GlassCard>
        </motion.div>
      </motion.div>
    </PageWrapper>
  );
}
