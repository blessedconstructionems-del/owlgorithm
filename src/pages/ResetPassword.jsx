import { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import AuthShell from '@/components/auth/AuthShell';
import { useApp } from '@/context/AppContext';

function PasswordField({ label, value, onChange, autoComplete, placeholder }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-gray-300">{label}</span>
      <input
        type="password"
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-cyan-400/50"
      />
    </label>
  );
}

export default function ResetPasswordPage() {
  const { authBusy, isAuthenticated, resetPassword } = useApp();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  if (isAuthenticated) {
    return <Navigate replace to="/" />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!token) {
      setError('That reset link is missing its token.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const result = await resetPassword({ token, password });
    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    setMessage('Password updated. Opening your account now.');
  }

  return (
    <AuthShell
      title="Reset your password."
      description="Use the reset link from your email to set a new password and reopen your account."
    >
      <div>
        <h2 className="text-2xl font-semibold text-white">Choose a new password</h2>
        <p className="mt-2 text-sm text-gray-400">Use at least 10 characters with one letter and one number.</p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <PasswordField
          label="New password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          placeholder="At least 10 characters"
        />
        <PasswordField
          label="Confirm password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          placeholder="Repeat your password"
        />

        {error ? (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={authBusy}
          className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#071019] transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {authBusy ? 'Working...' : 'Reset password'}
        </button>
      </form>

      <div className="mt-6 text-xs text-gray-500">
        Back to{' '}
        <Link to="/auth" className="text-cyan-300 hover:text-cyan-200">
          sign in
        </Link>
        .
      </div>
    </AuthShell>
  );
}
