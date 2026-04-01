import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, User, Settings, LogOut, Check, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

const ROUTE_TITLES = {
  '/': 'Dashboard',
  '/trends': 'Trend Radar',
  '/scheduler': 'Content Scheduler',
  '/analytics': 'Analytics',
  '/ab-testing': 'A/B Testing Lab',
  '/leaderboard': 'Leaderboard',
  '/truth-radar': 'Truth Radar',
  '/strategy': 'Content Strategy',
  '/night-watch': 'Night Watch',
  '/platforms': 'Platforms',
  '/wellness': 'Creator Wellness',
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
      className="fixed left-2 right-2 top-[64px] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[380px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f1219] shadow-2xl shadow-black/60 z-[100]"
    >
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <h3 className="text-sm font-semibold text-white">Notifications</h3>
        <span className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          {notifications.filter((n) => !n.read).length} new
        </span>
      </div>
      <div className="max-h-[360px] overflow-y-auto">
        {notifications.map((notif, i) => (
          <motion.button
            key={notif.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onRead(notif.id)}
            className={cn(
              'flex w-full gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.03] border-b border-white/[0.03] last:border-0',
              !notif.read && 'bg-blue-500/[0.03]'
            )}
          >
            <div className={cn(
              'mt-1.5 h-2 w-2 shrink-0 rounded-full transition-colors',
              notif.read ? 'bg-transparent' : 'bg-blue-500'
            )} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-200">{notif.title}</p>
              <p className="mt-1 text-xs text-gray-500 line-clamp-2 leading-relaxed">{notif.message}</p>
              <p className="mt-1.5 text-[10px] text-gray-600">{notif.time}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function UserDropdown({ user, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const items = [
    { icon: User, label: 'Profile', path: '/settings' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: LogOut, label: 'Sign Out', danger: true },
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="absolute right-0 top-full mt-3 w-56 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f1219] shadow-2xl shadow-black/60"
    >
      <div className="border-b border-white/[0.06] px-5 py-4">
        <p className="text-sm font-semibold text-white">{user.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500/15 to-purple-500/15 border border-blue-500/20 px-2.5 py-1 text-[10px] font-semibold text-blue-400">
          <Sparkles size={10} />
          {user.plan}
        </div>
      </div>
      <div className="py-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const inner = (
            <div className={cn(
              'flex w-full items-center gap-3 px-5 py-2.5 text-sm transition-colors hover:bg-white/[0.04]',
              item.danger ? 'text-red-400 hover:text-red-300' : 'text-gray-400 hover:text-gray-200'
            )}>
              <Icon size={15} />
              {item.label}
            </div>
          );
          if (item.path) {
            return <Link key={item.label} to={item.path} onClick={onClose}>{inner}</Link>;
          }
          return <button key={item.label} className="w-full">{inner}</button>;
        })}
      </div>
    </motion.div>
  );
}

export default function TopBar() {
  const location = useLocation();
  const { notifications, markNotificationRead, user } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const pageTitle = getPageTitle(location.pathname);
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  return (
    <header className="sticky top-0 z-30 flex h-[60px] sm:h-[72px] shrink-0 items-center gap-3 sm:gap-4 border-b border-white/[0.08] bg-[#060910]/70 px-3 backdrop-blur-xl sm:px-8">
      {/* Page title */}
      <h1 className="shrink-0 text-base sm:text-lg font-bold text-white tracking-tight truncate">
        {pageTitle}
      </h1>

      {/* Search bar */}
      <div className="mx-auto hidden w-full max-w-lg lg:block">
        <div className="relative group">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 transition-colors group-focus-within:text-blue-400" />
          <input
            type="text"
            placeholder="Search trends, posts, analytics..."
            readOnly
            className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5 pl-10 pr-16 text-sm text-gray-400 placeholder-gray-600 outline-none transition-all focus:border-blue-500/30 focus:bg-white/[0.05] focus:ring-1 focus:ring-blue-500/20"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] text-gray-600 font-mono">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); }}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-all hover:bg-white/[0.05] hover:text-gray-300"
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
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white transition-all hover:shadow-lg hover:shadow-blue-500/20 hover:scale-105"
          >
            {user.avatar}
          </button>
          <AnimatePresence>
            {userOpen && (
              <UserDropdown user={user} onClose={() => setUserOpen(false)} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
