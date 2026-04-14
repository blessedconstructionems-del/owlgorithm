import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut, RefreshCw, Settings } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useTrendsData } from '@/data/trends';
import StatusBadge from '@/components/shared/StatusBadge';
import { getFreshnessState } from '@/lib/trendMetrics';
import { getRouteTitle, isDemoRoute } from '@/lib/navigation';

function UserDropdown({ user, isGuest, onClose, onLogout }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(event) {
      if (ref.current && !ref.current.contains(event.target)) onClose();
    }

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-40 mt-3 w-56 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f1219] shadow-2xl shadow-black/60"
    >
      <div className="border-b border-white/[0.06] px-5 py-4">
        <p className="text-sm font-semibold text-white">{user?.name || 'Guest'}</p>
        <p className="mt-0.5 text-xs text-gray-500">{isGuest ? 'Guest mode' : user?.email}</p>
      </div>
      <div className="py-1.5">
        <Link to="/settings" onClick={onClose}>
          <div className="flex w-full items-center gap-3 px-5 py-2.5 text-sm text-gray-400 transition-colors hover:bg-white/[0.04] hover:text-gray-200">
            <Settings size={15} />
            Settings
          </div>
        </Link>
        {isGuest && (
          <Link to="/auth" onClick={onClose}>
            <div className="flex w-full items-center gap-3 px-5 py-2.5 text-sm text-gray-400 transition-colors hover:bg-white/[0.04] hover:text-gray-200">
              <LogOut size={15} />
              Sign in or create account
            </div>
          </Link>
        )}
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 px-5 py-2.5 text-sm text-gray-400 transition-colors hover:bg-white/[0.04] hover:text-gray-200"
        >
          <LogOut size={15} />
          {isGuest ? 'Exit guest' : 'Sign out'}
        </button>
      </div>
    </div>
  );
}

export default function TopBar() {
  const location = useLocation();
  const { user, isGuest, logout } = useApp();
  const { status, lastUpdated } = useTrendsData(true);
  const [userOpen, setUserOpen] = useState(false);

  const demoPage = isDemoRoute(location.pathname);
  const pageTitle = getRouteTitle(location.pathname);
  const freshness = useMemo(() => getFreshnessState(lastUpdated), [lastUpdated]);
  const statusTone = demoPage
    ? 'active'
    : status === 'loading' || status === 'refreshing'
      ? 'running'
      : freshness.status;
  const statusCopy = demoPage
    ? 'Demo module loaded with seeded workspace data.'
    : status === 'loading' || status === 'refreshing'
      ? 'Syncing live trend data'
      : `Updated ${freshness.relative}`;

  async function handleLogout() {
    setUserOpen(false);
    await logout();
  }

  return (
    <header className="sticky top-0 z-30 flex h-[60px] shrink-0 items-center gap-3 border-b border-white/[0.08] bg-[#060910]/70 px-3 backdrop-blur-xl sm:h-[72px] sm:px-8">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-bold tracking-tight text-white sm:text-lg">
          {pageTitle}
        </h1>
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
          <StatusBadge status={statusTone} />
          <span className="truncate">{statusCopy}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {!demoPage && (status === 'loading' || status === 'refreshing') && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl text-blue-400">
            <RefreshCw size={18} className="animate-spin" />
          </div>
        )}

        <div className="relative">
          <button
            onClick={() => setUserOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/[0.05]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 font-bold text-white">
              {user?.avatar || (isGuest ? 'G' : 'O')}
            </span>
            <ChevronDown size={14} className="text-gray-500" />
          </button>
          {userOpen && (
            <UserDropdown
              user={user}
              isGuest={isGuest}
              onClose={() => setUserOpen(false)}
              onLogout={handleLogout}
            />
          )}
        </div>
      </div>
    </header>
  );
}
