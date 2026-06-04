import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, User, Settings, LogOut, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

const ROUTE_TITLES = {
  '/': 'Dashboard',
  '/post-now': 'Post Now',
  '/revenue-god-mode': 'Revenue God Mode',
  '/trends': 'Trend Radar',
  '/scheduler': 'Scheduler',
  '/analytics': 'Analytics',
  '/ab-testing': 'A/B Testing',
  '/leaderboard': 'Leaderboard',
  '/truth-radar': 'Truth Radar',
  '/strategy': 'Strategy',
  '/night-watch': 'Night Watch',
  '/platforms': 'Connect Socials',
  '/media': 'Creator Studio Pro',
  '/wellness': 'Wellness',
  '/onboarding': 'Creator Setup',
  '/settings': 'Settings',
};

function getPageTitle(pathname) {
  return ROUTE_TITLES[pathname] || 'Owlgorithm';
}

function NotificationDropdown({ notifications, onRead, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="app-dropdown fixed left-2 right-2 top-[64px] z-[100] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[380px]"
    >
      <div className="app-dropdown-header">
        <h3>Notifications</h3>
        <span className="app-dropdown-badge">
          <span />
          {notifications.filter((n) => !n.read).length} new
        </span>
      </div>
      <div className="max-h-[360px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm font-medium text-gray-300">No notifications</p>
            <p className="mt-1 text-xs text-gray-500">Live account alerts will appear here when the backend sends them.</p>
          </div>
        ) : (
          notifications.map((notif, i) => (
            <motion.button
              key={notif.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onRead(notif.id)}
              className={cn(
                'app-dropdown-row',
                !notif.read && 'app-dropdown-row-unread'
              )}
            >
              <div className={cn(
                'app-dropdown-dot',
                notif.read ? 'bg-transparent' : 'bg-[var(--app-accent)]'
              )} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-200">{notif.title}</p>
                <p className="mt-1 text-xs text-gray-500 line-clamp-2 leading-relaxed">{notif.message}</p>
                <p className="mt-1.5 text-[10px] text-gray-600">{notif.time}</p>
              </div>
            </motion.button>
          ))
        )}
      </div>
    </motion.div>
  );
}

function UserDropdown({ user, isGuest, onClose, onLogout }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const items = [
    { icon: Sparkles, label: 'Creator Setup', path: '/onboarding' },
    { icon: User, label: 'Profile', path: '/settings' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    ...(isGuest ? [{ icon: LogOut, label: 'Sign In', path: '/auth' }] : []),
    { icon: LogOut, label: isGuest ? 'Exit Guest' : 'Sign Out', danger: true },
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="app-dropdown absolute right-0 top-full mt-3 w-64"
    >
      <div className="app-profile-panel">
        <div className="app-profile-mark" aria-hidden="true">{user?.avatar || (isGuest ? 'G' : 'O')}</div>
        <div className="min-w-0">
          <p>{user?.name || 'Guest'}</p>
          <span>{isGuest ? 'Guest mode' : user?.email}</span>
        </div>
        <div className="app-profile-plan">
          <Sparkles size={10} />
          {user?.plan || (isGuest ? 'Guest' : 'Founding')}
        </div>
      </div>
      <div className="py-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const inner = (
            <div className={cn(
              'app-profile-menu-item',
              item.danger && 'app-profile-menu-danger'
            )}>
              <Icon size={15} />
              {item.label}
            </div>
          );
          if (item.path) {
            return <Link key={item.label} to={item.path} onClick={onClose}>{inner}</Link>;
          }
          return <button key={item.label} onClick={onLogout} className="w-full">{inner}</button>;
        })}
      </div>
    </motion.div>
  );
}

export default function TopBar() {
  const location = useLocation();
  const { notifications, markNotificationRead, user, isGuest, logout } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const pageTitle = getPageTitle(location.pathname);
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  async function handleLogout() {
    setUserOpen(false);
    await logout();
  }

  return (
    <header className="app-topbar">
      {/* Page title */}
      <h1 className="app-topbar-title">
        {pageTitle}
      </h1>

      <div className="min-w-0 flex-1" />

      {/* Right actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); }}
            className="app-icon-button"
            aria-label="Open notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-lg shadow-red-500/30">
                {unreadCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <NotificationDropdown
                notifications={notifications}
                onRead={markNotificationRead}
                onClose={() => setNotifOpen(false)}
              />
            )}
          </AnimatePresence>
        </div>

        {/* User avatar */}
        <div className="relative">
          <button
            onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }}
            className="app-user-button"
            aria-label="Open profile menu"
          >
            <span>{user?.avatar || (isGuest ? 'G' : 'O')}</span>
            <strong>{user?.name?.split(' ')[0] || (isGuest ? 'Guest' : 'User')}</strong>
          </button>
          <AnimatePresence>
            {userOpen && (
              <UserDropdown
                user={user}
                isGuest={isGuest}
                onClose={() => setUserOpen(false)}
                onLogout={handleLogout}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
