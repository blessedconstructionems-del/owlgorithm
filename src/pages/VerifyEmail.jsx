import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import AuthShell from '@/components/auth/AuthShell';
import { useApp } from '@/context/AppContext';

export default function VerifyEmailPage() {
  const { authBusy, isAuthenticated, verifyEmail } = useApp();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState(token ? 'working' : 'error');
  const [message, setMessage] = useState(token ? 'Verifying your email address.' : 'That verification link is missing its token.');

  useEffect(() => {
    let active = true;

    async function runVerification() {
      if (!token) return;

      const result = await verifyEmail({ token });
      if (!active) return;

      if (!result.ok) {
        setStatus('error');
        setMessage(result.error.message);
        return;
      }

      setStatus('success');
      setMessage('Email verified. Opening your account now.');
    }

    runVerification();
    return () => {
      active = false;
    };
  }, [token, verifyEmail]);

  if (isAuthenticated && status === 'success') {
    return <Navigate replace to="/" />;
  }

  return (
    <AuthShell
      title="Verify your email."
      description="This confirms account ownership before the app allows a full sign-in."
    >
      <div>
        <h2 className="text-2xl font-semibold text-white">Email verification</h2>
        <p className="mt-2 text-sm text-gray-400">Verification links are one-time use and expire after 24 hours.</p>
      </div>

      <div className={`mt-6 rounded-lg border px-3 py-3 text-sm ${
        status === 'error'
          ? 'border-red-500/20 bg-red-500/10 text-red-200'
          : status === 'success'
            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'
            : 'border-white/10 bg-white/[0.03] text-gray-300'
      }`}
      >
        {message}
      </div>

      {status === 'error' ? (
        <div className="mt-6 text-sm text-gray-400">
          Request a fresh link from{' '}
          <Link to="/auth" className="text-cyan-300 hover:text-cyan-200">
            the sign-in page
          </Link>
          .
        </div>
      ) : null}

      {status === 'working' || authBusy ? (
        <div className="mt-6 text-sm text-gray-500">Working...</div>
      ) : null}
    </AuthShell>
  );
}
