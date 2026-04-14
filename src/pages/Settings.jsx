import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Download,
  KeyRound,
  LogOut,
  Palette,
  RefreshCw,
  Save,
  Trash2,
  User,
} from 'lucide-react';
import GlassCard from '@/components/shared/GlassCard';
import PageWrapper from '@/components/shared/PageWrapper';
import StatusBadge from '@/components/shared/StatusBadge';
import { useApp } from '@/context/AppContext';
import { useTrendsData } from '@/data/trends';
import { useScrapeStatus } from '@/hooks/useScrapeStatus';
import { getFreshnessState } from '@/lib/trendMetrics';

const ENVIRONMENTS = [
  { id: '/fantasy-mountain-landscape.1920x1080.mp4', name: 'Fantasy Mountain', preview: 'linear-gradient(135deg, #1a3a2a, #2d4a3a, #4a6a5a)' },
  { id: '/cosmos-flowers.3840x2160.mp4', name: 'Cosmos Flowers', preview: 'linear-gradient(135deg, #2a1a3a, #4a2d5a, #6a3a7a)' },
  { id: '/circuit-board.3840x2160.mp4', name: 'Circuit Board', preview: 'linear-gradient(135deg, #0a1a2a, #1a3a4a, #0a2a3a)' },
  { id: '/tech-hud.3840x2160.mp4', name: 'Tech HUD', preview: 'linear-gradient(135deg, #0a0a2a, #1a1a4a, #0a1a3a)' },
  { id: 'gradient:aurora', name: 'Aurora', preview: 'linear-gradient(135deg, #081018, #10283c, #123652)' },
  { id: 'gradient:nebula', name: 'Nebula', preview: 'linear-gradient(135deg, #170729, #231349, #0f1128)' },
  { id: 'gradient:midnight', name: 'Midnight', preview: 'linear-gradient(135deg, #060910, #101a2f, #060910)' },
  { id: 'gradient:ember', name: 'Ember', preview: 'linear-gradient(135deg, #1b0c0f, #32161c, #18080a)' },
];

function downloadFile(filename, type, content) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value) {
  const stringValue = `${value ?? ''}`;
  return `"${stringValue.replace(/"/g, '""')}"`;
}

function trendsToCsv(trends) {
  const headers = [
    'id',
    'name',
    'category',
    'type',
    'saturation',
    'momentum',
    'growthVelocity',
    'opportunityScore',
    'competition',
    'audienceInterest',
    'platforms',
    'firstSeen',
  ];

  const rows = trends.map((trend) => [
    trend.id,
    trend.name,
    trend.category,
    trend.type,
    trend.saturation,
    trend.momentum,
    trend.growthVelocity,
    trend.opportunityScore,
    trend.competition,
    trend.audienceInterest,
    (trend.platforms || []).join('|'),
    trend.firstSeen,
  ]);

  return [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
}

function Field({ label, type = 'text', value, onChange, autoComplete, placeholder }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-gray-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500/40"
      />
    </label>
  );
}

function Feedback({ tone, message }) {
  if (!message) return null;

  const classes = tone === 'error'
    ? 'border-red-500/20 bg-red-500/10 text-red-200'
    : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100';

  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${classes}`}>
      {message}
    </div>
  );
}

export default function Settings() {
  const {
    user,
    isGuest,
    updateProfile,
    changePassword,
    deleteAccount,
    resendVerification,
    logout,
    environment,
    setEnvironment,
  } = useApp();
  const { trends, lastUpdated } = useTrendsData(true);
  const { data: scrapeStatus, loading, refresh } = useScrapeStatus(true);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
  const [profileTone, setProfileTone] = useState('success');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [passwordTone, setPasswordTone] = useState('success');

  const [deletePassword, setDeletePassword] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState(null);
  const [deleteTone, setDeleteTone] = useState('error');
  const [verificationBusy, setVerificationBusy] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState(null);
  const [verificationTone, setVerificationTone] = useState('success');

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
  }, [user?.email, user?.name]);

  const freshness = useMemo(() => getFreshnessState(lastUpdated || scrapeStatus?.lastFullRun), [lastUpdated, scrapeStatus?.lastFullRun]);
  const platformStatuses = useMemo(() => (
    Object.entries(scrapeStatus || {})
      .filter(([key, value]) => !['lastFullRun', 'scrapeInProgress', 'enabled'].includes(key) && value && typeof value === 'object')
      .map(([key, value]) => ({
        key,
        label: key,
        ...value,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  ), [scrapeStatus]);

  async function handleSaveProfile() {
    setProfileBusy(true);
    setProfileMessage(null);

    try {
      const result = await updateProfile({ name, email });
      setProfileTone('success');
      setProfileMessage(result?.verificationRequired
        ? 'Profile saved. Verify your new email address before using it for future sign-ins.'
        : 'Profile saved.');
      setVerificationTone('success');
      setVerificationMessage(result?.previewUrl ? 'A verification link is ready for the updated email address.' : null);
    } catch (error) {
      setProfileTone('error');
      setProfileMessage(error.message);
    } finally {
      setProfileBusy(false);
    }
  }

  async function handleChangePassword() {
    setPasswordBusy(true);
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordTone('error');
      setPasswordMessage('New passwords do not match.');
      setPasswordBusy(false);
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword });
      setPasswordTone('success');
      setPasswordMessage('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordTone('error');
      setPasswordMessage(error.message);
    } finally {
      setPasswordBusy(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteBusy(true);
    setDeleteMessage(null);

    if (!deletePassword) {
      setDeleteTone('error');
      setDeleteMessage('Enter your password to delete the account.');
      setDeleteBusy(false);
      return;
    }

    if (!window.confirm('Delete this account permanently? This cannot be undone.')) {
      setDeleteBusy(false);
      return;
    }

    try {
      await deleteAccount({ password: deletePassword });
    } catch (error) {
      setDeleteTone('error');
      setDeleteMessage(error.message);
      setDeleteBusy(false);
    }
  }

  async function handleResendVerification() {
    if (!user?.email) return;

    setVerificationBusy(true);
    setVerificationMessage(null);

    try {
      const result = await resendVerification({ email: user.email });
      if (!result.ok) {
        throw result.error;
      }

      setVerificationTone('success');
      setVerificationMessage(result.data?.previewUrl
        ? 'A fresh verification link is ready for this email address.'
        : 'A fresh verification link has been sent.');
    } catch (error) {
      setVerificationTone('error');
      setVerificationMessage(error.message);
    } finally {
      setVerificationBusy(false);
    }
  }

  function handleJsonExport() {
    downloadFile('owlgorithm-trends.json', 'application/json', JSON.stringify(trends, null, 2));
  }

  function handleCsvExport() {
    downloadFile('owlgorithm-trends.csv', 'text/csv;charset=utf-8', trendsToCsv(trends));
  }

  return (
    <PageWrapper className="space-y-6">
      <GlassCard hover={false} accent="cyan" className="space-y-2">
        <div className="flex items-center gap-2">
          <StatusBadge status={freshness.status} />
          <StatusBadge status={scrapeStatus?.enabled ? 'active' : 'disabled'} />
        </div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="max-w-2xl text-sm text-gray-400">
          {isGuest
            ? 'Guest mode keeps appearance changes in this browser session while account tools stay locked.'
            : 'Account details, password, appearance, and exports are now tied to your signed-in account.'}
        </p>
      </GlassCard>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <GlassCard hover={false} accent="blue" className="space-y-5">
          {isGuest ? (
            <>
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                  <User size={18} className="text-blue-400" />
                  Guest access
                </h2>
                <p className="mt-1 text-sm text-gray-500">Browse the dashboard and trend feed without creating an account.</p>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-gray-400">
                  <p className="font-medium text-white">No account is attached to this session.</p>
                  <p className="mt-2">
                    Create one when you want synced settings, password management, and account deletion controls.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/auth"
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/[0.07]"
                  >
                    <Save size={16} />
                    Sign in or create account
                  </Link>

                  <button
                    onClick={logout}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-transparent px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/[0.05] hover:text-white"
                  >
                    <LogOut size={16} />
                    Exit guest
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                  <User size={18} className="text-blue-400" />
                  Account profile
                </h2>
                <p className="mt-1 text-sm text-gray-500">Saved to the backend for this account.</p>
              </div>

              <div className="space-y-4">
                <Field
                  label="Name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                />

                <Field
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                />

                <Feedback tone={profileTone} message={profileMessage} />

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleSaveProfile}
                    disabled={profileBusy}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={16} />
                    {profileBusy ? 'Saving...' : 'Save profile'}
                  </button>

                  <button
                    onClick={logout}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-transparent px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/[0.05] hover:text-white"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>

                <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-gray-400">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Account</p>
                  <p className="mt-2 text-white">{user?.email}</p>
                  <div className="mt-2">
                    <StatusBadge status={user?.emailVerified ? 'verified' : 'draft'} />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Created {user?.createdAt ? new Date(user.createdAt).toLocaleString() : 'recently'}</p>
                </div>

                {!user?.emailVerified ? (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-4 text-sm text-amber-100">
                    <p className="font-medium text-white">Email verification is still pending.</p>
                    <p className="mt-2">Verify this address before relying on it for future sign-ins or password recovery.</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <button
                        onClick={handleResendVerification}
                        disabled={verificationBusy}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <RefreshCw size={16} className={verificationBusy ? 'animate-spin' : ''} />
                        {verificationBusy ? 'Sending...' : 'Resend verification'}
                      </button>
                    </div>
                    <div className="mt-3">
                      <Feedback tone={verificationTone} message={verificationMessage} />
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </GlassCard>

        <GlassCard hover={false} accent="purple" className="space-y-5">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Palette size={18} className="text-purple-400" />
              Environment
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {isGuest
                ? 'Saved in this browser session while you browse as a guest.'
                : 'Saved to your account so the workspace follows you across sessions.'}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {ENVIRONMENTS.map((option) => {
              const active = environment === option.id;

              return (
                <button
                  key={option.id}
                  onClick={() => setEnvironment(option.id)}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    active ? 'border-blue-500/40 bg-blue-500/[0.08]' : 'border-white/8 bg-white/[0.03] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="aspect-video rounded-lg" style={{ background: option.preview }} />
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-medium text-white">{option.name}</span>
                    {active ? <StatusBadge status="active" /> : null}
                  </div>
                </button>
              );
            })}
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        {isGuest ? (
          <GlassCard hover={false} accent="amber" className="space-y-5">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <KeyRound size={18} className="text-amber-400" />
                Account tools
              </h2>
              <p className="mt-1 text-sm text-gray-500">Password changes and account management are only available after sign in.</p>
            </div>

            <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-gray-400">
              <p className="font-medium text-white">Guest mode is read-only for account actions.</p>
              <p className="mt-2">Create an account when you want saved identity, password changes, and account deletion controls.</p>
            </div>

            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/[0.07]"
            >
              <User size={16} />
              Sign in or create account
            </Link>
          </GlassCard>
        ) : (
          <GlassCard hover={false} accent="amber" className="space-y-5">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <KeyRound size={18} className="text-amber-400" />
                Password
              </h2>
              <p className="mt-1 text-sm text-gray-500">Update the password tied to this account.</p>
            </div>

            <div className="space-y-4">
              <Field
                label="Current password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
              />

              <Field
                label="New password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="At least 10 characters"
              />

              <Field
                label="Confirm new password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
              />

              <Feedback tone={passwordTone} message={passwordMessage} />

              <button
                onClick={handleChangePassword}
                disabled={passwordBusy}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {passwordTone === 'success' && passwordMessage ? <CheckCircle2 size={16} /> : <KeyRound size={16} />}
                {passwordBusy ? 'Updating...' : 'Update password'}
              </button>
            </div>
          </GlassCard>
        )}

        <GlassCard hover={false} accent="emerald" className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Data source</h2>
              <p className="mt-1 text-sm text-gray-500">Current backend and scraper health.</p>
            </div>

            <button
              onClick={refresh}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <p className="text-xs text-gray-500">Trend cache</p>
              <p className="mt-1 text-2xl font-bold text-white">{trends.length}</p>
              <p className="mt-1 text-sm text-gray-400">Current records available to the app.</p>
            </div>

            <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <p className="text-xs text-gray-500">Freshness</p>
              <div className="mt-2">
                <StatusBadge status={freshness.status} />
              </div>
              <p className="mt-2 text-sm text-gray-400">{freshness.relative}</p>
            </div>

            <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <p className="text-xs text-gray-500">Scraper</p>
              <div className="mt-2">
                <StatusBadge status={scrapeStatus?.enabled ? 'active' : 'disabled'} />
              </div>
              <p className="mt-2 text-sm text-gray-400">
                {scrapeStatus?.enabled ? 'Background refresh is enabled.' : 'Serving cached data only.'}
              </p>
            </div>

            <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <p className="text-xs text-gray-500">Last full run</p>
              <p className="mt-1 text-sm font-medium text-white">{scrapeStatus?.lastFullRun || 'Not available'}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {platformStatuses.map((platformState) => (
              <div key={platformState.key} className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium capitalize text-white">{platformState.label}</p>
                  <StatusBadge status={platformState.status === 'ok' ? 'active' : platformState.status} />
                </div>
                <p className="mt-2 text-sm text-gray-400">{platformState.count || 0} records in the last run</p>
                <p className="mt-1 text-xs text-gray-500">{platformState.error || platformState.lastRun || 'No run recorded'}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <GlassCard hover={false} accent="amber" className="space-y-5">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Download size={18} className="text-amber-400" />
              Export data
            </h2>
            <p className="mt-1 text-sm text-gray-500">Download the currently loaded trend cache.</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleJsonExport}
              disabled={!trends.length}
              className="flex w-full items-start justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left transition-colors hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div>
                <p className="font-medium text-white">JSON export</p>
                <p className="mt-1 text-sm text-gray-400">Full trend payload including metrics and history.</p>
              </div>
              <Download size={18} className="mt-1 text-gray-500" />
            </button>

            <button
              onClick={handleCsvExport}
              disabled={!trends.length}
              className="flex w-full items-start justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left transition-colors hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div>
                <p className="font-medium text-white">CSV export</p>
                <p className="mt-1 text-sm text-gray-400">Flat summary for spreadsheets and external analysis.</p>
              </div>
              <Download size={18} className="mt-1 text-gray-500" />
            </button>
          </div>

          <p className="text-xs text-gray-500">Export includes {trends.length} cached trends.</p>
        </GlassCard>

        {isGuest ? (
          <GlassCard hover={false} accent="rose" className="space-y-5">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <User size={18} className="text-rose-400" />
                Save your setup
              </h2>
              <p className="mt-1 text-sm text-gray-500">Guest mode is good for browsing. Use an account when you want persistence across devices.</p>
            </div>

            <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-gray-400">
              <p className="font-medium text-white">Your current guest session is temporary.</p>
              <p className="mt-2">Account creation unlocks backend-saved settings, password management, and account deletion.</p>
            </div>

            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100 transition-colors hover:bg-rose-500/16"
            >
              <User size={16} />
              Create account
            </Link>
          </GlassCard>
        ) : (
          <GlassCard hover={false} accent="rose" className="space-y-5">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Trash2 size={18} className="text-rose-400" />
                Delete account
              </h2>
              <p className="mt-1 text-sm text-gray-500">Remove this account, saved settings, and active sessions.</p>
            </div>

            <div className="space-y-4">
              <Field
                label="Password confirmation"
                type="password"
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
                autoComplete="current-password"
              />

              <Feedback tone={deleteTone} message={deleteMessage} />

              <button
                onClick={handleDeleteAccount}
                disabled={deleteBusy}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100 transition-colors hover:bg-rose-500/16 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={16} />
                {deleteBusy ? 'Deleting...' : 'Delete account'}
              </button>
            </div>
          </GlassCard>
        )}
      </div>
    </PageWrapper>
  );
}
