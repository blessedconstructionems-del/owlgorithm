import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from '@/components/auth/AuthShell';
import { useApp } from '@/context/AppContext';

function InputField({ label, type = 'text', value, onChange, autoComplete, placeholder }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-gray-300">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-cyan-400/50"
      />
    </label>
  );
}

function Notice({ tone = 'success', message, previewUrl }) {
  if (!message) return null;

  const toneClasses = tone === 'warning'
    ? 'border-amber-500/20 bg-amber-500/10 text-amber-100'
    : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100';

  return (
    <div className={`rounded-lg border px-3 py-3 text-sm ${toneClasses}`}>
      <p>{message}</p>
      {previewUrl ? (
        <a
          href={previewUrl}
          className="mt-2 inline-flex text-xs font-semibold text-cyan-200 hover:text-cyan-100"
        >
          Open email link
        </a>
      ) : null}
    </div>
  );
}

export default function AuthPage() {
  const {
    signUp,
    login,
    continueAsGuest,
    resendVerification,
    requestPasswordReset,
    authBusy,
  } = useApp();
  const [mode, setMode] = useState('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [verificationEmail, setVerificationEmail] = useState('');

  const heading = useMemo(() => (
    mode === 'signup'
      ? 'Create your account'
      : mode === 'forgot'
        ? 'Reset your password'
        : 'Sign in to Owlgorithm'
  ), [mode]);

  function switchMode(nextMode) {
    setMode(nextMode);
    setLocalError(null);
    setNotice(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLocalError(null);
    setNotice(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (mode === 'signup' && password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    if (mode === 'forgot') {
      const result = await requestPasswordReset({ email: normalizedEmail });
      if (!result.ok) {
        setLocalError(result.error.message);
        return;
      }

      setNotice({
        tone: 'success',
        message: 'If an account matches that email, a reset link has been sent.',
        previewUrl: result.data.previewUrl,
      });
      return;
    }

    const action = mode === 'signup' ? signUp : login;
    const payload = mode === 'signup'
      ? { name, email: normalizedEmail, password }
      : { email: normalizedEmail, password };

    const result = await action(payload);
    if (result.ok) {
      if (mode === 'signup') {
        setVerificationEmail(normalizedEmail);
        setNotice({
          tone: 'success',
          message: `Verify ${normalizedEmail} to finish setting up your account.`,
          previewUrl: result.data.previewUrl,
        });
        setMode('login');
        setName('');
        setPassword('');
        setConfirmPassword('');
      }
      return;
    }

    if (result.error.payload?.code === 'email_unverified') {
      setVerificationEmail(normalizedEmail);
      setNotice({
        tone: 'warning',
        message: 'Verify your email before signing in.',
        previewUrl: result.error.payload?.previewUrl,
      });
      return;
    }

    setLocalError(result.error.message);
  }

  async function handleResendVerification() {
    const targetEmail = (verificationEmail || email).trim().toLowerCase();
    if (!targetEmail) {
      setLocalError('Enter your email address first.');
      return;
    }

    setLocalError(null);
    const result = await resendVerification({ email: targetEmail });
    if (!result.ok) {
      setLocalError(result.error.message);
      return;
    }

    setVerificationEmail(targetEmail);
    setNotice({
      tone: 'success',
      message: `A fresh verification link was sent to ${targetEmail}.`,
      previewUrl: result.data.previewUrl,
    });
  }

  return (
    <AuthShell
      title="Track live signals with a verified account."
      description="Create an account to save your workspace settings, verify ownership of your email, and recover access without support intervention."
    >
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/25 p-1">
        <button
          type="button"
          onClick={() => switchMode('signup')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mode === 'signup' ? 'bg-cyan-500/15 text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Sign up
        </button>
        <button
          type="button"
          onClick={() => switchMode('login')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mode === 'login' ? 'bg-cyan-500/15 text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Sign in
        </button>
      </div>

      <div className="mt-6">
        <h2 className="text-2xl font-semibold text-white">{heading}</h2>
        <p className="mt-2 text-sm text-gray-400">
          {mode === 'signup'
            ? 'Use your email and a password with at least one letter and one number.'
            : mode === 'forgot'
              ? 'Enter the verified email address tied to your account.'
              : 'Use the email and password you signed up with.'}
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {mode === 'signup' ? (
          <InputField
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            placeholder="Avery Johnson"
          />
        ) : null}

        <InputField
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
        />

        {mode !== 'forgot' ? (
          <>
            <InputField
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              placeholder="At least 10 characters"
            />

            {mode === 'signup' ? (
              <InputField
                label="Confirm password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="Repeat your password"
              />
            ) : null}
          </>
        ) : null}

        {localError ? (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {localError}
          </div>
        ) : null}

        {notice ? (
          <Notice tone={notice.tone} message={notice.message} previewUrl={notice.previewUrl} />
        ) : null}

        <button
          type="submit"
          disabled={authBusy}
          className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#071019] transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {authBusy
            ? 'Working...'
            : mode === 'signup'
              ? 'Create account'
              : mode === 'forgot'
                ? 'Send reset link'
                : 'Sign in'}
        </button>

        {mode === 'login' ? (
          <button
            type="button"
            onClick={() => switchMode('forgot')}
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.06]"
          >
            Forgot password
          </button>
        ) : null}

        {verificationEmail ? (
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={authBusy}
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Resend verification email
          </button>
        ) : null}

        {mode !== 'forgot' ? (
          <button
            type="button"
            onClick={() => {
              setLocalError(null);
              setNotice(null);
              continueAsGuest();
            }}
            disabled={authBusy}
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Continue as guest
          </button>
        ) : (
          <button
            type="button"
            onClick={() => switchMode('login')}
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.06]"
          >
            Back to sign in
          </button>
        )}
      </form>

      <div className="mt-6 text-xs text-gray-500">
        By continuing, you agree to the{' '}
        <Link to="/legal/terms" className="text-cyan-300 hover:text-cyan-200">
          Terms
        </Link>{' '}
        and{' '}
        <Link to="/legal/privacy" className="text-cyan-300 hover:text-cyan-200">
          Privacy Policy
        </Link>
        .
      </div>
    </AuthShell>
  );
}
