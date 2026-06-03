import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Link2,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

import GlassCard from '@/components/shared/GlassCard';
import PageWrapper from '@/components/shared/PageWrapper';
import PlatformIcon from '@/components/shared/PlatformIcon';
import StatusBadge from '@/components/shared/StatusBadge';
import { apiRequest } from '@/lib/api';
import { appRedirectUrl, openHostedSocialConnect } from '@/lib/nativeBridge';
import { cn } from '@/lib/utils';

function accountLabel(account) {
  if (!account) return null;
  return account.displayName || account.username || account.pageName || account.pageId || 'Connected';
}

export default function SocialConnect() {
  const [accounts, setAccounts] = useState(null);
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);

  const connectedCount = useMemo(
    () => accounts?.platforms?.filter((platform) => platform.connected).length || 0,
    [accounts],
  );
  const totalCount = accounts?.platforms?.length || 0;

  const refreshAccounts = useCallback(async () => {
    setBusy((current) => current || 'refresh');
    setError(null);
    try {
      const data = await apiRequest('/api/social/accounts');
      setAccounts(data);
      setNotice(null);
    } catch (refreshError) {
      setError(refreshError.message);
    } finally {
      setBusy(null);
    }
  }, []);

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible') refreshAccounts();
    }
    function handleConnectComplete() {
      refreshAccounts();
    }
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', refreshAccounts);
    window.addEventListener('owlgorithm:social-connect-complete', handleConnectComplete);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', refreshAccounts);
      window.removeEventListener('owlgorithm:social-connect-complete', handleConnectComplete);
    };
  }, [refreshAccounts]);

  async function connectSocials() {
    setBusy('connect');
    setError(null);
    setNotice(null);

    try {
      const session = await apiRequest('/api/social/connect', {
        method: 'POST',
        json: {
          redirectUrl: appRedirectUrl('/platforms?social=connected'),
        },
      });
      const opened = openHostedSocialConnect(session.accessUrl);
      setNotice(opened === 'native' ? 'Upload-Post connect opened in the secure iOS session.' : 'Upload-Post connect opened.');
    } catch (connectError) {
      setError(connectError.message);
    } finally {
      setBusy(null);
    }
  }

  const configured = accounts?.configured;

  return (
    <PageWrapper className="space-y-6">
      <GlassCard hover={false} accent="blue">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap gap-2">
              <StatusBadge status={configured ? 'active' : 'disabled'} />
              {accounts?.profileConfigured ? <StatusBadge status="verified" /> : null}
            </div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Connect Socials</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-400">
              Upload-Post profile {accounts?.profileUsername ? <span className="font-mono text-gray-200">{accounts.profileUsername}</span> : <span className="text-gray-500">not created</span>}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={refreshAccounts}
              disabled={busy === 'refresh'}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={16} className={busy === 'refresh' ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={connectSocials}
              disabled={!configured || busy === 'connect'}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/15 px-4 py-2.5 text-sm font-semibold text-blue-100 transition-colors hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ExternalLink size={16} />
              {busy === 'connect' ? 'Opening...' : 'Connect Accounts'}
            </button>
          </div>
        </div>
      </GlassCard>

      {error || notice ? (
        <div
          className={cn(
            'flex gap-3 rounded-xl border px-4 py-3 text-sm',
            error
              ? 'border-red-500/20 bg-red-500/10 text-red-100'
              : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
          )}
        >
          {error ? <AlertCircle size={17} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={17} className="mt-0.5 shrink-0" />}
          <span>{error || notice}</span>
        </div>
      ) : null}

      {!configured ? (
        <GlassCard hover={false} accent="amber">
          <div className="flex gap-3">
            <LockKeyhole size={18} className="mt-0.5 shrink-0 text-amber-300" />
            <div>
              <p className="text-sm font-semibold text-white">Upload-Post master key missing</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-400">
                Set {accounts?.missing?.join(', ') || 'UPLOAD_POST_API_KEY'} on the backend before connecting accounts.
              </p>
            </div>
          </div>
        </GlassCard>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Connected', value: `${connectedCount}/${totalCount || '-'}`, icon: CheckCircle2 },
          { label: 'Profile', value: accounts?.profileConfigured ? 'Ready' : 'Pending', icon: Link2 },
          { label: 'Provider', value: accounts?.provider === 'upload-post' ? 'Upload-Post' : 'Waiting', icon: ShieldCheck },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <GlassCard key={item.label} hover={false} className="!p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-gray-500">{item.label}</p>
                  <p className="mt-2 text-2xl font-bold text-white">{item.value}</p>
                </div>
                <Icon size={22} className="text-blue-300" />
              </div>
            </GlassCard>
          );
        })}
      </div>

      <GlassCard hover={false} accent="purple" className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Platform Status</h2>
            <p className="mt-1 text-sm text-gray-500">
              Last synced {accounts?.lastSyncedAt ? new Date(accounts.lastSyncedAt).toLocaleString() : 'waiting'}
            </p>
          </div>
          <StatusBadge status={connectedCount ? 'active' : 'idle'} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(accounts?.platforms || []).map((platform) => {
            const targetReady = !platform.requiredTargetEnv || platform.targetConfigured;
            const blocked = !targetReady || !platform.connected;
            return (
              <div
                key={platform.id}
                className={cn(
                  'flex min-h-[86px] items-center justify-between gap-3 rounded-xl border px-4 py-3',
                  platform.connected
                    ? 'border-emerald-500/20 bg-emerald-500/10'
                    : 'border-white/[0.08] bg-white/[0.03]',
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <PlatformIcon platform={platform.id === 'x' ? 'twitter' : platform.id} size={34} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{platform.label}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {platform.connected ? accountLabel(platform.account) : 'Connect first'}
                    </p>
                    {!targetReady ? (
                      <p className="mt-0.5 truncate text-[11px] text-amber-300">Needs {platform.requiredTargetEnv}</p>
                    ) : null}
                  </div>
                </div>
                {blocked ? (
                  <span className="shrink-0 rounded-full border border-white/10 px-2 py-1 text-[11px] font-semibold text-gray-400">
                    Waiting
                  </span>
                ) : (
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-300" />
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>
    </PageWrapper>
  );
}
