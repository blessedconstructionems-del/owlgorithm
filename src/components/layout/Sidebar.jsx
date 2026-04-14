import { useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Heart,
  LayoutDashboard,
  Link2,
  Moon,
  Radar,
  Settings,
  ShieldCheck,
  Target,
  Trophy,
  BarChart3,
  Calendar,
  Zap,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { APP_NAV_ITEMS, LIVE_MOBILE_NAV_PATHS } from '@/lib/navigation';
import SignalMark from '@/components/shared/SignalMark';

const ICON_BY_PATH = {
  '/': LayoutDashboard,
  '/revenue-god-mode': Zap,
  '/trends': Radar,
  '/scheduler': Calendar,
  '/analytics': BarChart3,
  '/ab-testing': FlaskConical,
  '/leaderboard': Trophy,
  '/truth-radar': ShieldCheck,
  '/strategy': Target,
  '/night-watch': Moon,
  '/platforms': Link2,
  '/wellness': Heart,
  '/settings': Settings,
};

const NAV_ITEMS = APP_NAV_ITEMS.map((item) => ({
  ...item,
  icon: ICON_BY_PATH[item.path],
}));

const MOBILE_NAV = NAV_ITEMS.filter((item) => LIVE_MOBILE_NAV_PATHS.includes(item.path));

function NavItem({ item, collapsed, isActive }) {
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200',
        isActive ? 'text-white' : 'text-gray-500 hover:bg-white/[0.04] hover:text-gray-300'
      )}
    >
      {isActive && (
        <>
          <motion.div
            layoutId="sidebar-active-bg"
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/[0.12] via-cyan-500/[0.08] to-transparent"
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          />
          <motion.div
            layoutId="sidebar-active-bar"
            className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-blue-400 to-cyan-400"
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          />
        </>
      )}

      <div
        className={cn(
          'relative z-10 flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
          isActive ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20' : 'group-hover:bg-white/[0.04]'
        )}
      >
        <Icon size={18} className={cn(isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300')} />
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            className="relative z-10 flex min-w-0 flex-1 items-center gap-2"
          >
            <span className="min-w-0 truncate">{item.label}</span>
            {item.availability === 'demo' ? (
              <span className="ml-auto rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                Demo
              </span>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  );
}

function DesktopSidebar() {
  const { sidebarCollapsed, toggleSidebar } = useApp();
  const location = useLocation();

  const isActive = useCallback(
    (path) => (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)),
    [location.pathname]
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 76 : 280 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative z-20 hidden h-screen shrink-0 flex-col border-r border-white/[0.08] bg-[#0a0d14]/80 backdrop-blur-xl md:flex"
    >
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />

      <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-white/[0.04] px-5">
        <SignalMark className="h-10 w-10 shrink-0" />
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col"
            >
              <span className="gradient-text text-lg font-bold tracking-tight leading-tight">
                Owlgorithm
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-gray-600">
                Demo Build
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.path}
            item={item}
            collapsed={sidebarCollapsed}
            isActive={isActive(item.path)}
          />
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/[0.04] p-3">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center gap-2 rounded-xl p-2.5 text-gray-600 transition-all hover:bg-white/[0.04] hover:text-gray-400"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs font-medium"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}

function MobileBottomNav() {
  const location = useLocation();

  const isActive = useCallback(
    (path) => (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)),
    [location.pathname]
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-[72px] items-center justify-around border-t border-white/[0.08] bg-[#0a0d14]/80 px-2 backdrop-blur-xl md:hidden">
      {MOBILE_NAV.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);

        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'relative flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all',
              active ? 'text-blue-400' : 'text-gray-600'
            )}
          >
            {active && (
              <motion.div
                layoutId="mobile-active"
                className="absolute inset-0 rounded-xl bg-blue-500/[0.08]"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <Icon size={20} className="relative z-10" />
            <span className="relative z-10 text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar() {
  return (
    <>
      <DesktopSidebar />
      <MobileBottomNav />
    </>
  );
}
