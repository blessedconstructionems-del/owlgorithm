import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, ShieldCheck } from 'lucide-react';
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

function Notice({ tone = 'success', message }) {
  if (!message) return null;

  const toneClasses = tone === 'warning'
    ? 'border-amber-500/20 bg-amber-500/10 text-amber-100'
    : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100';

  return (
    <div className={`rounded-lg border px-3 py-3 text-sm ${toneClasses}`}>
      {message}
    </div>
  );
}

export default function AuthPage() {
  const {
    authBusy,
    firebaseAuthEnabled,
    continueWithEmail,
    continueWithGoogle,
    sendPhoneCode,
    confirmPhoneCode,
    requestFirebasePasswordReset,
  } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [notice, setNotice] = useState(null);

  function clearMessages() {
    setLocalError(null);
    setNotice(null);
  }

  async function handleEmailContinue(event) {
    event.preventDefault();
    clearMessages();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setLocalError('Enter your email and password.');
      return;
    }

    const result = await continueWithEmail({
      name,
      email: normalizedEmail,
      password,
    });
    if (!result.ok) setLocalError(result.error.message);
  }

  async function handleGoogleContinue() {
    clearMessages();
    const result = await continueWithGoogle();
    if (!result.ok) setLocalError(result.error.message);
  }

  async function handleSendPhoneCode() {
    clearMessages();
    const normalizedPhone = phone.trim();
    if (!normalizedPhone.startsWith('+')) {
      setLocalError('Enter a phone number with country code, like +12085551234.');
      return;
    }

    const result = await sendPhoneCode(normalizedPhone);
    if (!result.ok) {
      setLocalError(result.error.message);
      return;
    }

    setPhoneCodeSent(true);
    setNotice('Verification code sent.');
  }

  async function handleConfirmPhoneCode() {
    clearMessages();
    if (!phoneCode.trim()) {
      setLocalError('Enter the phone verification code.');
      return;
    }

    const result = await confirmPhoneCode(phoneCode.trim());
    if (!result.ok) setLocalError(result.error.message);
  }

  async function handlePasswordReset() {
    clearMessages();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setLocalError('Enter your email address first.');
      return;
    }

    const result = await requestFirebasePasswordReset({ email: normalizedEmail });
    if (!result.ok) {
      setLocalError(result.error.message);
      return;
    }

    setNotice('Password reset email sent if that account exists.');
  }

  return (
    <AuthShell
      title="Continue to Owlgorithm."
      description="New users are created automatically the first time they continue. Returning users land in the same workspace."
    >
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold text-white">Sign in or create account</h2>
          <p className="mt-2 text-sm text-gray-400">
            Use email, Google, or phone. Owlgorithm creates your workspace on first sign-in.
          </p>
        </div>

        {!firebaseAuthEnabled ? (
          <Notice tone="warning" message="Firebase auth is not configured for this build." />
        ) : null}

        <button
          type="button"
          onClick={handleGoogleContinue}
          disabled={authBusy || !firebaseAuthEnabled}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ShieldCheck size={16} />
          Continue with Google
        </button>

        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-gray-600">
          <span className="h-px flex-1 bg-white/10" />
          Email
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form className="space-y-4" onSubmit={handleEmailContinue}>
          <InputField
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            placeholder="Avery Johnson"
          />
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
          />
          <InputField
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="Your Firebase password"
          />

          <button
            type="submit"
            disabled={authBusy || !firebaseAuthEnabled}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#071019] transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Mail size={16} />
            {authBusy ? 'Working...' : 'Continue with email'}
          </button>

          <button
            type="button"
            onClick={handlePasswordReset}
            disabled={authBusy || !firebaseAuthEnabled}
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Send password reset
          </button>
        </form>

        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-gray-600">
          <span className="h-px flex-1 bg-white/10" />
          Phone
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <div className="space-y-4">
          <InputField
            label="Phone number"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            autoComplete="tel"
            placeholder="+12085551234"
          />

          <button
            type="button"
            onClick={handleSendPhoneCode}
            disabled={authBusy || !firebaseAuthEnabled}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Phone size={16} />
            {phoneCodeSent ? 'Send another code' : 'Send phone code'}
          </button>

          {phoneCodeSent ? (
            <>
              <InputField
                label="Verification code"
                value={phoneCode}
                onChange={(event) => setPhoneCode(event.target.value)}
                autoComplete="one-time-code"
                placeholder="123456"
              />
              <button
                type="button"
                onClick={handleConfirmPhoneCode}
                disabled={authBusy || !firebaseAuthEnabled}
                className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#071019] transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continue with phone
              </button>
            </>
          ) : null}
        </div>

        <div id="firebase-recaptcha-container" />

        {localError ? (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {localError}
          </div>
        ) : null}

        {notice ? <Notice message={notice} /> : null}
      </div>

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
