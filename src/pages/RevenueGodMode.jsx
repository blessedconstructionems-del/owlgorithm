import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  CirclePause,
  Crown,
  Play,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import GlassCard from '@/components/shared/GlassCard';
import PageWrapper from '@/components/shared/PageWrapper';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import {
  AUTONOMY_OPTIONS,
  DEFAULT_GOD_MODE_CONFIG,
  GOD_MODE_CHANNELS,
  GOD_MODE_PROMPTS,
  RISK_OPTIONS,
  buildRevenueReply,
  buildRevenueSnapshot,
  formatCompactCurrency,
  formatCurrency,
} from '@/data/revenueGodMode';

const STORAGE_KEY = 'owlgorithm:revenue-god-mode';

const INITIAL_MESSAGES = [
  {
    id: 'system-1',
    role: 'assistant',
    text: 'Revenue God is standing by. Activate the blueprint, set your guardrails, and I will route the highest-ROI money path first.',
  },
];

function loadRevenueState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveRevenueState(value) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Local storage unavailable.
  }
}

function StatusPill({ active, paused }) {
  if (!active) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
        Standby
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]',
        paused
          ? 'border border-amber-500/30 bg-amber-500/10 text-amber-300'
          : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', paused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse')} />
      {paused ? 'Paused' : 'Active'}
    </span>
  );
}

export default function RevenueGodMode() {
  const { user } = useApp();
  const [state, setState] = useState(() => {
    const saved = loadRevenueState();
    return saved || {
      active: false,
      paused: false,
      activatedAt: null,
      config: DEFAULT_GOD_MODE_CONFIG,
      messages: INITIAL_MESSAGES,
    };
  });
  const [prompt, setPrompt] = useState('');

  const snapshot = useMemo(() => buildRevenueSnapshot(state.config), [state.config]);

  useEffect(() => {
    saveRevenueState(state);
  }, [state]);

  const updateConfig = useCallback((partial) => {
    setState((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        ...partial,
      },
    }));
  }, []);

  const toggleChannel = useCallback((channelId) => {
    setState((prev) => {
      const nextChannels = prev.config.preferredChannels.includes(channelId)
        ? prev.config.preferredChannels.filter((item) => item !== channelId)
        : [...prev.config.preferredChannels, channelId];

      return {
        ...prev,
        config: {
          ...prev.config,
          preferredChannels: nextChannels.length ? nextChannels : [channelId],
        },
      };
    });
  }, []);

  const activateGodMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      active: true,
      paused: false,
      activatedAt: new Date().toISOString(),
      messages: [
        ...prev.messages,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: `Revenue God Mode is live. I am routing ${snapshot.livePathCount} money paths now and staging ${snapshot.queuedDeployments} more under your current guardrails.`,
        },
      ],
    }));
  }, [snapshot.livePathCount, snapshot.queuedDeployments]);

  const pauseGodMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      paused: !prev.paused,
      active: prev.active || !prev.paused,
    }));
  }, []);

  const submitPrompt = useCallback((text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const reply = buildRevenueReply(trimmed, snapshot);
    setState((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        { id: `user-${Date.now()}`, role: 'user', text: trimmed },
        { id: `assistant-${Date.now() + 1}`, role: 'assistant', text: reply },
      ],
    }));
    setPrompt('');
  }, [snapshot]);

  return (
    <PageWrapper className="space-y-8">
      <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#08101d] p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.24),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.18),transparent_38%),linear-gradient(135deg,rgba(7,13,25,0.98),rgba(8,41,64,0.9))]" />
        <div className="relative space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <StatusPill active={state.active} paused={state.paused} />
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                  Monetize Everything
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70">Revenue God Mode™</p>
                <h1 className="mt-2 max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                  One tap. God Mode. Money forever.
                </h1>
                <p className="mt-3 max-w-3xl text-sm text-blue-100/65 sm:text-base">
                  Activate your AI Chief Revenue Officer and let it scan assets, predict ROI, build offers, and deploy the highest-yield revenue path across your ecosystem.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {!state.active ? (
                <button
                  onClick={activateGodMode}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition-opacity hover:opacity-90"
                >
                  <Crown size={16} />
                  Enter Revenue God Mode
                </button>
              ) : (
                <button
                  onClick={pauseGodMode}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
                >
                  {state.paused ? <Play size={16} /> : <CirclePause size={16} />}
                  {state.paused ? 'Resume God Mode' : 'Pause God Mode'}
                </button>
              )}
              <button
                onClick={() => submitPrompt('Make me $15k from TikTok this week')}
                className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-400/16"
              >
                <Bot size={16} />
                Talk to Your Revenue God
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <GlassCard hover={false} accent="emerald" className="space-y-2 !bg-[#0c1527]/80">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Projected 30-Day Lift</p>
              <p className="text-3xl font-extrabold text-white">{formatCompactCurrency(snapshot.projectedLiftMid)}</p>
              <p className="text-xs text-emerald-200/80">
                {formatCompactCurrency(snapshot.projectedLiftLow)} to {formatCompactCurrency(snapshot.projectedLiftHigh)}
              </p>
            </GlassCard>

            <GlassCard hover={false} accent="blue" className="space-y-2 !bg-[#0c1527]/80">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Live Revenue Paths</p>
              <p className="text-3xl font-extrabold text-white">{snapshot.livePathCount}</p>
              <p className="text-xs text-blue-200/80">{snapshot.queuedDeployments} more deploying in the background</p>
            </GlassCard>

            <GlassCard hover={false} accent="amber" className="space-y-2 !bg-[#0c1527]/80">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Leakage Prevented</p>
              <p className="text-3xl font-extrabold text-white">{formatCompactCurrency(snapshot.preventedLeakage)}</p>
              <p className="text-xs text-amber-100/80">Abandoned carts, weak paths, and waste intercepted before bleedout</p>
            </GlassCard>

            <GlassCard hover={false} accent="purple" className="space-y-2 !bg-[#0c1527]/80">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Compounding State</p>
              <p className="text-3xl font-extrabold text-white">{state.active && !state.paused ? 'Online' : 'Standby'}</p>
              <p className="text-xs text-purple-100/80">{snapshot.compoundingNote}</p>
            </GlassCard>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <GlassCard hover={false} accent="cyan" className="space-y-5">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-cyan-300" />
            <h2 className="text-lg font-semibold text-white">Guardrails</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="text-gray-400">Daily spend cap</span>
              <input
                type="number"
                min="500"
                step="100"
                value={state.config.dailySpendCap}
                onChange={(event) => updateConfig({ dailySpendCap: event.target.value })}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-white outline-none transition-colors focus:border-cyan-400/40"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="text-gray-400">Target ROAS</span>
              <input
                type="number"
                min="1.5"
                step="0.1"
                value={state.config.targetRoas}
                onChange={(event) => updateConfig({ targetRoas: event.target.value })}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-white outline-none transition-colors focus:border-cyan-400/40"
              />
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-400">Risk tolerance</p>
            <div className="flex flex-wrap gap-2">
              {RISK_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => updateConfig({ riskTolerance: option.id })}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                    state.config.riskTolerance === option.id
                      ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100'
                      : 'border-white/[0.08] bg-white/[0.03] text-gray-400 hover:bg-white/[0.05]',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-400">Autonomy</p>
            <div className="flex flex-wrap gap-2">
              {AUTONOMY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => updateConfig({ autonomy: option.id })}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                    state.config.autonomy === option.id
                      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
                      : 'border-white/[0.08] bg-white/[0.03] text-gray-400 hover:bg-white/[0.05]',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-400">Preferred channels</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {GOD_MODE_CHANNELS.map((channel) => {
                const selected = state.config.preferredChannels.includes(channel.id);
                return (
                  <button
                    key={channel.id}
                    onClick={() => toggleChannel(channel.id)}
                    className={cn(
                      'rounded-2xl border p-4 text-left transition-colors',
                      selected
                        ? 'border-cyan-400/30 bg-cyan-400/10'
                        : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05]',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{channel.label}</span>
                      <span className={cn('h-3 w-3 rounded-full', selected ? 'bg-cyan-300' : 'bg-white/[0.12]')} />
                    </div>
                    <p className="mt-2 text-xs text-gray-400">{channel.focus}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </GlassCard>

        <GlassCard hover={false} accent="emerald" className="space-y-5">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-300" />
            <h2 className="text-lg font-semibold text-white">Live God Dashboard</h2>
          </div>

          <div className="rounded-[24px] border border-emerald-400/14 bg-[linear-gradient(135deg,rgba(12,23,19,0.9),rgba(6,41,58,0.66))] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/70">Money Printer</p>
                <p className="mt-2 text-2xl font-extrabold text-white">{formatCurrency(snapshot.projectedLiftMid)}</p>
                <p className="text-sm text-emerald-100/70">Projected this month under current guardrails</p>
              </div>
              <div className="flex items-end gap-2">
                {[52, 76, 68, 88, 94, 81, 96, 110].map((height, index) => (
                  <span
                    key={`${height}-${index}`}
                    className="w-3 rounded-full bg-gradient-to-t from-emerald-500 via-cyan-400 to-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.28)]"
                    style={{ height }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {snapshot.deploymentQueue.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-gray-300">
                <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <GlassCard hover={false} accent="blue" className="space-y-5">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-blue-300" />
            <h2 className="text-lg font-semibold text-white">Revenue God Blueprint</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {snapshot.blueprint.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{item.label}</p>
                <p className="mt-3 text-lg font-bold text-white">{item.metric}</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{item.detail}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard hover={false} accent="amber" className="space-y-5">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-amber-300" />
            <h2 className="text-lg font-semibold text-white">Revenue Path Simulator™</h2>
          </div>

          <div className="space-y-4">
            {snapshot.simulations.map((simulation) => (
              <div key={simulation.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-white">{simulation.label}</span>
                  <span className="text-gray-400">{formatCompactCurrency(simulation.value)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-300"
                    style={{ width: `${simulation.confidence}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-sm leading-relaxed text-gray-300">
            The simulator runs the bandit allocation, guardrails, and revenue-path mix before deployment. Under your current settings, the policy expects to compound toward {formatCurrency(snapshot.projectedLiftHigh)} if early winners keep outperforming.
          </p>
        </GlassCard>
      </div>

      <GlassCard hover={false} accent="purple" className="space-y-5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-purple-300" />
            <h2 className="text-lg font-semibold text-white">Talk to Your Revenue God</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {GOD_MODE_PROMPTS.map((item) => (
              <button
                key={item}
                onClick={() => submitPrompt(item)}
                className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-gray-300 transition-colors hover:bg-white/[0.06]"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3 rounded-[24px] border border-white/[0.08] bg-[#0b111f] p-4">
            <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
              {state.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    message.role === 'assistant'
                      ? 'bg-white/[0.04] text-gray-200'
                      : 'ml-auto bg-gradient-to-r from-blue-600 to-cyan-500 text-white',
                  )}
                >
                  {message.text}
                </div>
              ))}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                submitPrompt(prompt);
              }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <input
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Make me $15k from TikTok this week"
                className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-cyan-400/40"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 transition-opacity hover:opacity-90"
              >
                Run Command
                <ArrowRight size={15} />
              </button>
            </form>
          </div>

          <div className="space-y-3">
            {snapshot.livePaths.map((path) => (
              <div key={path.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{path.title}</h3>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]',
                          path.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-300'
                            : path.status === 'deploying'
                              ? 'bg-cyan-500/10 text-cyan-200'
                              : 'bg-amber-500/10 text-amber-200',
                        )}
                      >
                        {path.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-400">{path.detail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{formatCompactCurrency(path.projectedRevenue)}</p>
                    <p className="text-xs text-gray-500">{path.channel} • {path.roas}x ROAS • {path.eta}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      <GlassCard hover={false} accent="rose" className="space-y-4">
        <div className="flex items-center gap-2">
          <Crown size={16} className="text-rose-300" />
          <h2 className="text-lg font-semibold text-white">Monetize Everything™ Launch Slice</h2>
        </div>
        <p className="text-sm leading-relaxed text-gray-300">
          This launch build centers the product around the autonomous revenue loop. Trend discovery, channel control, and settings remain in the shell. Everything else should stay staged until real backend integrations, attribution, and policy enforcement are online.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/trends"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.06]"
          >
            Open Trend Radar
          </Link>
          <Link
            to="/platforms"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.06]"
          >
            Review Channels
          </Link>
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.06]"
          >
            Tune Guardrails
          </Link>
        </div>
      </GlassCard>
    </PageWrapper>
  );
}
