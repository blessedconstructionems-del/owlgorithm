import { useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Calendar,
  FlaskConical,
  Heart,
  LayoutDashboard,
  Link2,
  Moon,
  Palette,
  Radar,
  Send,
  Settings,
  ShieldCheck,
  Target,
  Trophy,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import SignalMark from '@/components/shared/SignalMark';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', mobileLabel: 'Home', icon: LayoutDashboard },
  { path: '/post-now', label: 'Post Now', mobileLabel: 'Post', icon: Send },
  { path: '/revenue-god-mode', label: 'Revenue God Mode', mobileLabel: 'Revenue', icon: Zap },
  { path: '/trends', label: 'Trend Radar', mobileLabel: 'Trends', icon: Radar },
  { path: '/scheduler', label: 'Scheduler', mobileLabel: 'Schedule', icon: Calendar },
  { path: '/analytics', label: 'Analytics', mobileLabel: 'Analytics', icon: BarChart3 },
  { path: '/ab-testing', label: 'A/B Testing', mobileLabel: 'A/B', icon: FlaskConical },
  { path: '/leaderboard', label: 'Leaderboard', mobileLabel: 'Winners', icon: Trophy },
  { path: '/truth-radar', label: 'Truth Radar', mobileLabel: 'Truth', icon: ShieldCheck },
  { path: '/strategy', label: 'Strategy', mobileLabel: 'Strategy', icon: Target },
  { path: '/night-watch', label: 'Night Watch', mobileLabel: 'Night', icon: Moon },
  { path: '/platforms', label: 'Connect Socials', mobileLabel: 'Socials', icon: Link2 },
  { path: '/media', label: 'Creator Studio Pro', mobileLabel: 'Studio', icon: Palette },
  { path: '/wellness', label: 'Wellness', mobileLabel: 'Wellness', icon: Heart },
  { path: '/settings', label: 'Settings', mobileLabel: 'Settings', icon: Settings },
];

const MOBILE_NAV = NAV_ITEMS;

function NavItem({ item, collapsed, isActive }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      className={cn('app-nav-item group', isActive && 'app-nav-item-active')}
    >
      {/* Active background */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active-bg"
          className="app-nav-active-bg"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}

      {/* Active left bar */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active-bar"
          className="app-nav-active-bar"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}

      <div className={cn(
        'app-nav-icon',
        isActive && 'app-nav-icon-active'
      )}>
        <Icon
          size={18}
          className={cn(
            'transition-colors',
            isActive ? 'text-[var(--app-accent)]' : 'text-[var(--app-text-muted)] group-hover:text-[var(--app-text-tertiary)]'
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
        <div className="app-nav-tooltip">
          {item.label}
          <div />
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
      className="app-sidebar hidden md:flex"
    >
      <div className="app-sidebar-edge" />

      <div className="app-sidebar-brand">
        <SignalMark className="app-sidebar-mark" />
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="app-sidebar-brand-copy"
            >
              <span>
                Owlgorithm
              </span>
              <small>
                Signal Command
              </small>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="app-sidebar-nav scrollbar-none">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.path}
            item={item}
            collapsed={sidebarCollapsed}
            isActive={isActive(item.path)}
          />
        ))}
      </nav>

      <div className="app-sidebar-footer">
        <button
          onClick={toggleSidebar}
          className="app-sidebar-collapse"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs font-semibold"
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
    <nav className="app-mobile-nav scrollbar-none md:hidden">
      {MOBILE_NAV.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'app-mobile-nav-item',
              active && 'app-mobile-nav-item-active'
            )}
          >
            {active && (
              <motion.div
                layoutId="mobile-active"
                className="app-mobile-nav-active-bg"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <Icon size={20} className="relative z-10" />
            <span className="relative z-10 max-w-full truncate text-[9px] font-medium">{item.mobileLabel || item.label}</span>
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
