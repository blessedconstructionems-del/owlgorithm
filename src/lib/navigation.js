export const APP_NAV_ITEMS = [
  { path: '/', label: 'Dashboard', availability: 'live' },
  { path: '/trends', label: 'Trend Radar', availability: 'live' },
  { path: '/night-watch', label: 'Night Watch', availability: 'live' },
  { path: '/media', label: 'Creator Studio', availability: 'live' },
  { path: '/settings', label: 'Settings', availability: 'live' },
];

export const LIVE_MOBILE_NAV_PATHS = ['/', '/trends', '/night-watch', '/media', '/settings'];

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
