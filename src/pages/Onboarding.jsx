import { createElement, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, Compass, Sparkles, Target } from 'lucide-react';

import PageWrapper from '@/components/shared/PageWrapper';
import SignalMark from '@/components/shared/SignalMark';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import {
  CREATOR_GOALS,
  CREATOR_NICHES,
  CREATOR_PLATFORM_OPTIONS,
  getCreatorNiche,
  normalizeCreatorProfile,
} from '@/lib/creatorProfile';

const CREATOR_TYPES = [
  {
    id: 'creator',
    label: 'Creator',
    detail: 'I am building a personal audience.',
  },
  {
    id: 'business_owner',
    label: 'Business owner',
    detail: 'I need posts that bring customers or authority.',
  },
  {
    id: 'student',
    label: 'Student',
    detail: 'I am learning, testing, or starting from scratch.',
  },
  {
    id: 'operator',
    label: 'Team operator',
    detail: 'I am running content for a brand or client.',
  },
];

function ButtonCard({ active, title, detail, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative min-h-[112px] rounded-2xl border p-4 text-left transition-colors',
        active
          ? 'border-cyan-300/40 bg-cyan-300/10 text-white shadow-[0_0_36px_rgba(45,212,191,0.12)]'
          : 'border-white/[0.08] bg-white/[0.035] text-gray-300 hover:border-white/15 hover:bg-white/[0.06]',
      )}
    >
      <span className={cn(
        'absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border',
        active ? 'border-cyan-300/50 bg-cyan-300/15 text-cyan-100' : 'border-white/10 text-gray-600',
      )}>
        {active ? <Check size={14} /> : null}
      </span>
      <strong className="block pr-8 text-base font-semibold">{title}</strong>
      <span className="mt-2 block text-sm leading-relaxed text-gray-500 group-hover:text-gray-400">{detail}</span>
      {children}
    </button>
  );
}

function SectionTitle({ icon: Icon, eyebrow, title, detail }) {
  return (
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
        {createElement(Icon, { size: 18 })}
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-semibold text-white">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">{detail}</p>
      </div>
    </div>
  );
}

function firstName(name) {
  return `${name || 'Creator'}`.trim().split(/\s+/)[0] || 'Creator';
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, creatorProfile, updateCreatorProfile } = useApp();
  const initialProfile = useMemo(() => normalizeCreatorProfile(creatorProfile), [creatorProfile]);
  const initialNiche = initialProfile.niche || 'exploring';
  const initialPlatforms = initialProfile.preferredPlatforms.length
    ? initialProfile.preferredPlatforms
    : getCreatorNiche(initialNiche)?.defaultPlatforms || ['tiktok', 'youtube', 'instagram'];

  const [creatorType, setCreatorType] = useState(initialProfile.creatorType);
  const [niche, setNiche] = useState(initialNiche);
  const [customNiche, setCustomNiche] = useState(initialProfile.customNiche);
  const [goal, setGoal] = useState(initialProfile.goal);
  const [preferredPlatforms, setPreferredPlatforms] = useState(initialPlatforms);
  const [channelName, setChannelName] = useState(initialProfile.channelName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const selectedNiche = getCreatorNiche(niche) || getCreatorNiche('exploring');
  const effectivePlatforms = preferredPlatforms.length
    ? preferredPlatforms
    : selectedNiche?.defaultPlatforms || ['tiktok', 'youtube', 'instagram'];
  const generatedChannelName = channelName.trim()
    || `${firstName(user?.name)} ${selectedNiche?.label || 'Creator'} Channel`;

  function chooseNiche(nextNiche) {
    const config = getCreatorNiche(nextNiche);
    setNiche(nextNiche);
    if (config?.defaultPlatforms?.length) {
      setPreferredPlatforms(config.defaultPlatforms);
    }
  }

  function togglePlatform(platformId) {
    setPreferredPlatforms((current) => {
      if (current.includes(platformId)) {
        const next = current.filter((id) => id !== platformId);
        return next.length ? next : current;
      }
      return [...current, platformId];
    });
  }

  async function handleSave(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await updateCreatorProfile({
        creatorType,
        niche,
        customNiche,
        goal,
        preferredPlatforms: effectivePlatforms,
        channelName: generatedChannelName,
      });
      navigate(searchParams.get('next') || '/', { replace: true });
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageWrapper className="space-y-6">
      <form onSubmit={handleSave} className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#071018]/90 shadow-2xl shadow-black/40">
          <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,0.95fr)_minmax(340px,0.55fr)] lg:p-9">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <SignalMark className="h-12 w-12" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Creator setup</p>
                  <h1 className="mt-1 text-3xl font-semibold tracking-[-0.01em] text-white sm:text-4xl">
                    Tune Owlgorithm to your channel.
                  </h1>
                </div>
              </div>
              <p className="mt-5 max-w-3xl text-base leading-7 text-gray-400">
                Pick the lane and platforms you actually care about. Dashboard, Trend Radar, and Creator Studio will use this profile instead of throwing every niche and every platform at you.
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Channel profile</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">{generatedChannelName}</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-400">{selectedNiche?.audience}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {effectivePlatforms.map((platformId) => {
                  const platform = CREATOR_PLATFORM_OPTIONS.find((item) => item.id === platformId);
                  return platform ? (
                    <span key={platform.id} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-gray-200">
                      {platform.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-white/[0.08] bg-[#0b111b]/88 p-5 sm:p-7">
          <SectionTitle
            icon={Compass}
            eyebrow="Step 1"
            title="What kind of user are you?"
            detail="This changes the angle Owlgorithm uses when it turns a trend into a plan."
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {CREATOR_TYPES.map((type) => (
              <ButtonCard
                key={type.id}
                title={type.label}
                detail={type.detail}
                active={creatorType === type.id}
                onClick={() => setCreatorType(type.id)}
              />
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-white/[0.08] bg-[#0b111b]/88 p-5 sm:p-7">
          <SectionTitle
            icon={Target}
            eyebrow="Step 2"
            title="Choose your niche."
            detail="If you do not have one yet, pick Help me choose and Owlgorithm will keep the feed broader while still building a channel profile."
          />
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {CREATOR_NICHES.map((item) => (
              <ButtonCard
                key={item.id}
                title={item.label}
                detail={item.description}
                active={niche === item.id}
                onClick={() => chooseNiche(item.id)}
              />
            ))}
          </div>

          <label className="mt-5 block">
            <span className="text-sm font-semibold text-gray-300">Custom niche or channel idea</span>
            <input
              value={customNiche}
              onChange={(event) => setCustomNiche(event.target.value)}
              placeholder="Example: Idaho home services, faith fitness, college sports clips"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-cyan-300/35"
            />
          </label>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(320px,0.45fr)]">
          <div className="rounded-[24px] border border-white/[0.08] bg-[#0b111b]/88 p-5 sm:p-7">
            <SectionTitle
              icon={Sparkles}
              eyebrow="Step 3"
              title="Pick the platforms you want."
              detail="Owlgorithm will narrow Studio and publishing choices to these platforms."
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {CREATOR_PLATFORM_OPTIONS.map((platform) => (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => togglePlatform(platform.id)}
                  className={cn(
                    'flex items-center justify-between rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition-colors',
                    effectivePlatforms.includes(platform.id)
                      ? 'border-cyan-300/40 bg-cyan-300/10 text-white'
                      : 'border-white/[0.08] bg-white/[0.035] text-gray-400 hover:border-white/15 hover:bg-white/[0.06]',
                  )}
                >
                  {platform.label}
                  <span className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full border',
                    effectivePlatforms.includes(platform.id) ? 'border-cyan-300/50 text-cyan-100' : 'border-white/10',
                  )}>
                    {effectivePlatforms.includes(platform.id) ? <Check size={14} /> : null}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/[0.08] bg-[#0b111b]/88 p-5 sm:p-7">
            <SectionTitle
              icon={Target}
              eyebrow="Step 4"
              title="Choose the job."
              detail="This keeps recommendations from sounding generic."
            />
            <div className="mt-5 space-y-3">
              {CREATOR_GOALS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setGoal(item.id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors',
                    goal === item.id
                      ? 'border-cyan-300/40 bg-cyan-300/10 text-white'
                      : 'border-white/[0.08] bg-white/[0.035] text-gray-400 hover:border-white/15 hover:bg-white/[0.06]',
                  )}
                >
                  {item.label}
                  {goal === item.id ? <Check size={15} /> : null}
                </button>
              ))}
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-gray-300">Channel name</span>
              <input
                value={channelName}
                onChange={(event) => setChannelName(event.target.value)}
                placeholder={generatedChannelName}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-cyan-300/35"
              />
            </label>
          </div>
        </section>

        {error ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="sticky bottom-4 z-10 flex justify-end">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/40 bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-950/30 transition-colors hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Saving channel...' : 'Create channel profile'}
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </PageWrapper>
  );
}
