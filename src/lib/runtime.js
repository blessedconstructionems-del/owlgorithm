export const STATIC_DEMO = import.meta.env.VITE_STATIC_DEMO === '1'
  || (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io'));

export function staticAssetUrl(path) {
  const normalized = `${path || ''}`.replace(/^\/+/, '');
  return `${import.meta.env.BASE_URL}${normalized}`;
}
