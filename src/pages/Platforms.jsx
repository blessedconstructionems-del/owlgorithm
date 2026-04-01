import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, RefreshCw, Link2, Unlink, Loader2, Wifi } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import GlassCard from '@/components/shared/GlassCard';
import PageWrapper from '@/components/shared/PageWrapper';
import PlatformIcon from '@/components/shared/PlatformIcon';
import AnimatedNumber from '@/components/shared/AnimatedNumber';
import { useApp } from '@/context/AppContext';
import { platforms } from '@/data/platforms';

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg bg-gray-900 border border-white/10 px-3 py-2 shadow-xl text-sm">
      <p className="font-semibold text-white">{data.name}</p>
      <p className="text-gray-400">{data.followers.toLocaleString()} followers</p>
    </div>
  );
};

export default function Platforms() {
  const { connectedPlatforms, connectPlatform, disconnectPlatform } = useApp();
  const [syncing, setSyncing] = useState({});
  const [connecting, setConnecting] = useState({});
  const [justConnected, setJustConnected] = useState({});

  const isConnected = useCallback((id) => {
    const platform = platforms.find((p) => p.id === id);
    return platform?.connected || connectedPlatforms.includes(id);
  }, [connectedPlatforms]);

  const connectedList = useMemo(() =>
    platforms.filter((p) => isConnected(p.id)),
    [isConnected]
  );

  const totalPlatforms = platforms.length;
  const connectedCount = connectedList.length;

  const chartData = useMemo(() =>
    connectedList
      .filter((p) => p.followers > 0)
      .sort((a, b) => b.followers - a.followers)
      .map((p) => ({ name: p.name, followers: p.followers, color: p.color })),
    [connectedList]
  );

  const handleSync = useCallback((id) => {
    setSyncing((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => setSyncing((prev) => ({ ...prev, [id]: false })), 2000);
  }, []);

  const handleConnect = useCallback((id) => {
    setConnecting((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      connectPlatform(id);
      setConnecting((prev) => ({ ...prev, [id]: false }));
      setJustConnected((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => setJustConnected((prev) => ({ ...prev, [id]: false })), 2000);
    }, 2000);
  }, [connectPlatform]);

  const handleDisconnect = useCallback((id) => {
    disconnectPlatform(id);
  }, [disconnectPlatform]);

  return (
    <PageWrapper>
      <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-8">
        {/* Header */}
        <motion.div variants={fadeUp}>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Connected Platforms
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage your social presence</p>
        </motion.div>

        {/* Integration Status Bar */}
        <motion.div variants={fadeUp}>
          <GlassCard hover={false} accent="cyan" className="!py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-300">
                  {connectedCount} of {totalPlatforms} platforms connected
                </span>
              </div>
              <span className="text-sm font-mono text-blue-400">
                {Math.round((connectedCount / totalPlatforms) * 100)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${(connectedCount / totalPlatforms) * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </GlassCard>
        </motion.div>

        {/* Follower Comparison Chart */}
        {chartData.length > 0 && (
          <motion.div variants={fadeUp}>
            <GlassCard hover={false} accent="blue">
              <h2 className="text-lg font-semibold text-white mb-4">Followers by Platform</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="followers" radius={[6, 6, 0, 0]} maxBarSize={60}>
                      {chartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Platform Grid */}
        <motion.div variants={fadeUp}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {platforms.map((platform, i) => {
              const connected = isConnected(platform.id);
              const isSyncing = syncing[platform.id];
              const isConnecting = connecting[platform.id];
              const wasJustConnected = justConnected[platform.id];

              return (
                <motion.div
                  key={platform.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.4 }}
                >
                  <GlassCard hover={false} className="h-full flex flex-col">
                    {/* Platform Icon + Connection Status */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="relative">
                        <PlatformIcon
                          platform={platform.icon}
                          size={48}
                        />
                        {connected && !isConnecting && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-gray-900"
                          >
                            <Check className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                      </div>
                      {!connected && !isConnecting && (
                        <span className="text-xs text-gray-500">Not connected</span>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-1">{platform.name}</h3>

                    <AnimatePresence mode="wait">
                      {connected && !isConnecting ? (
                        <motion.div
                          key="connected"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex-1 flex flex-col"
                        >
                          {platform.accountName && (
                            <p className="text-sm text-gray-400 mb-3">{platform.accountName}</p>
                          )}
                          {platform.followers > 0 && (
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Followers</span>
                                <AnimatedNumber
                                  value={platform.followers}
                                  className="text-sm font-semibold text-white"
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Avg. Engagement</span>
                                <span className="text-sm font-semibold text-blue-400">
                                  {platform.avgEngagement}%
                                </span>
                              </div>
                              {platform.lastSync && (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">Last Sync</span>
                                  <span className="text-xs text-gray-400">{platform.lastSync}</span>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="mt-auto flex gap-2">
                            <button
                              onClick={() => handleSync(platform.id)}
                              disabled={isSyncing}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-medium hover:bg-blue-500/25 transition-colors disabled:opacity-50"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                              {isSyncing ? 'Syncing...' : 'Sync Now'}
                            </button>
                            <button
                              onClick={() => handleDisconnect(platform.id)}
                              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/10 transition-colors"
                            >
                              <Unlink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      ) : isConnecting ? (
                        <motion.div
                          key="connecting"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex-1 flex flex-col items-center justify-center gap-3 py-6"
                        >
                          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                          <span className="text-sm text-gray-400">Connecting...</span>
                        </motion.div>
                      ) : wasJustConnected ? (
                        <motion.div
                          key="just-connected"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex-1 flex flex-col items-center justify-center gap-3 py-6"
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center"
                          >
                            <Check className="w-6 h-6 text-white" />
                          </motion.div>
                          <span className="text-sm font-medium text-emerald-400">Connected!</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="not-connected"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex-1 flex flex-col justify-end"
                        >
                          <p className="text-sm text-gray-500 mb-4">
                            Connect your {platform.name} account to track trends and schedule posts.
                          </p>
                          <button
                            onClick={() => handleConnect(platform.id)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg shadow-blue-500/20"
                          >
                            <Link2 className="w-4 h-4" />
                            Connect
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </PageWrapper>
  );
}
