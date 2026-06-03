export const APP_NAV_ITEMS = [
  { path: '/', label: 'Dashboard', availability: 'live' },
  { path: '/post-now', label: 'Post Now', availability: 'live' },
  { path: '/revenue-god-mode', label: 'Revenue God Mode', availability: 'live' },
  { path: '/trends', label: 'Trend Radar', availability: 'live' },
  { path: '/scheduler', label: 'Scheduler', availability: 'live' },
  { path: '/analytics', label: 'Analytics', availability: 'live' },
  { path: '/ab-testing', label: 'A/B Testing', availability: 'live' },
  { path: '/leaderboard', label: 'Leaderboard', availability: 'live' },
  { path: '/truth-radar', label: 'Truth Radar', availability: 'live' },
  { path: '/strategy', label: 'Strategy', availability: 'live' },
  { path: '/night-watch', label: 'Night Watch', availability: 'live' },
  { path: '/platforms', label: 'Connect Socials', availability: 'live' },
  { path: '/media', label: 'Creator Studio Pro', availability: 'live' },
  { path: '/wellness', label: 'Wellness', availability: 'live' },
  { path: '/settings', label: 'Settings', availability: 'live' },
];

export const LIVE_MOBILE_NAV_PATHS = APP_NAV_ITEMS.map((item) => item.path);

export const ROUTE_TITLES = APP_NAV_ITEMS.reduce((acc, item) => {
  acc[item.path] = item.label;
  return acc;
}, {});

export function getRouteTitle(pathname) {
  return ROUTE_TITLES[pathname] || 'Owlgorithm';
}

export function isDemoRoute(pathname) {
  return !APP_NAV_ITEMS.some((item) => item.path === pathname);
}
