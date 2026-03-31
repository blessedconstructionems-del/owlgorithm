import { useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Radar,
  Calendar,
  BarChart3,
  FlaskConical,
  Trophy,
  ShieldCheck,
  Target,
  Moon,
  Link2,
  Heart,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/trends', label: 'Trend Radar', icon: Radar },
  { path: '/scheduler', label: 'Scheduler', icon: Calendar },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/ab-testing', label: 'A/B Testing', icon: FlaskConical },
  { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { path: '/truth-radar', label: 'Truth Radar', icon: ShieldCheck },
  { path: '/strategy', label: 'Strategy', icon: Target },
  { path: '/night-watch', label: 'Night Watch', icon: Moon },
  { path: '/platforms', label: 'Platforms', icon: Link2 },
  { path: '/wellness', label: 'Wellness', icon: Heart },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const MOBILE_NAV = NAV_ITEMS.slice(0, 5).concat(NAV_ITEMS[11]); // first 5 + Settings

function NavItem({ item, collapsed, isActive }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200',
        isActive
          ? 'text-white'
          : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
      )}
    >
      {/* Active background */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active-bg"
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/[0.12] via-purple-500/[0.08] to-transparent"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}

      {/* Active left bar */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active-bar"
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-blue-400 to-purple-500"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}

      <div className={cn(
        'relative z-10 flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
        isActive
          ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20'
          : 'group-hover:bg-white/[0.04]'
      )}>
        <Icon
          size={18}
          className={cn(
            'transition-colors',
            isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-400'
          )}
        />
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            className="relative z-10 truncate"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Tooltip when collapsed */}
      {collapsed && (
        <div className="pointer-events-none absolute left-full ml-3 hidden rounded-lg bg-gray-900 border border-white/10 px-3 py-1.5 text-xs font-medium text-white shadow-xl group-hover:block whitespace-nowrap z-50">
          {item.label}
          <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 border-l border-b border-white/10 rotate-45" />
        </div>
      )}
    </Link>
  );
}

function DesktopSidebar() {
  const { sidebarCollapsed, toggleSidebar } = useApp();
  const location = useLocation();

  const isActive = useCallback(
    (path) => {
      if (path === '/') return location.pathname === '/';
      return location.pathname.startsWith(path);
    },
    [location.pathname]
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 76 : 280 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="hidden md:flex h-screen flex-col border-r border-white/[0.08] bg-[#0a0d14]/80 backdrop-blur-xl relative z-20 shrink-0"
    >
      {/* Subtle gradient on sidebar edge */}
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />

      {/* Logo */}
      <div className="flex h-[72px] shrink-0 items-center gap-3 px-5 border-b border-white/[0.04]">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-white/[0.08]">
          <span className="text-xl" role="img" aria-label="Owlgorithm">🦉</span>
        </div>
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
              <span className="text-[10px] text-gray-600 font-medium tracking-wider uppercase">
                Intelligence Platform
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 scrollbar-none">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.path}
            item={item}
            collapsed={sidebarCollapsed}
            isActive={isActive(item.path)}
          />
        ))}
      </nav>

      {/* Collapse toggle */}
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
    (path) => {
      if (path === '/') return location.pathname === '/';
      return location.pathname.startsWith(path);
    },
    [location.pathname]
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-[72px] items-center justify-around border-t border-white/[0.08] bg-[#0a0d14]/80 backdrop-blur-xl md:hidden px-2">
      {MOBILE_NAV.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all',
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
