export const APP_NAV_ITEMS = [
  { path: '/', label: 'Dashboard', availability: 'live' },
  { path: '/revenue-god-mode', label: 'Revenue God Mode', availability: 'demo' },
  { path: '/trends', label: 'Trend Radar', availability: 'live' },
  { path: '/scheduler', label: 'Scheduler', availability: 'demo' },
  { path: '/analytics', label: 'Analytics', availability: 'demo' },
  { path: '/ab-testing', label: 'A/B Testing', availability: 'demo' },
  { path: '/leaderboard', label: 'Leaderboard', availability: 'demo' },
  { path: '/truth-radar', label: 'Truth Radar', availability: 'demo' },
  { path: '/strategy', label: 'Strategy', availability: 'demo' },
  { path: '/night-watch', label: 'Night Watch', availability: 'demo' },
  { path: '/platforms', label: 'Platforms', availability: 'demo' },
  { path: '/wellness', label: 'Wellness', availability: 'demo' },
  { path: '/settings', label: 'Settings', availability: 'live' },
];

export const LIVE_MOBILE_NAV_PATHS = ['/', '/trends', '/settings'];

const DEMO_ROUTE_PATHS = new Set(APP_NAV_ITEMS.filter((item) => item.availability === 'demo').map((item) => item.path));

export const ROUTE_TITLES = APP_NAV_ITEMS.reduce((acc, item) => {
  acc[item.path] = item.label;
  return acc;
}, {});

export function getRouteTitle(pathname) {
  return ROUTE_TITLES[pathname] || 'Owlgorithm';
}

export function isDemoRoute(pathname) {
  return DEMO_ROUTE_PATHS.has(pathname);
}
