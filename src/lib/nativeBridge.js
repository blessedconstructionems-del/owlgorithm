export function appRedirectUrl(path = '/platforms?social=connected') {
  if (typeof window === 'undefined') return path;
  const base = `${window.location.origin}${import.meta.env.BASE_URL || '/'}`.replace(/\/+$/, '');
  const hashPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}/#${hashPath}`;
}

function postToHandler(handler, payload) {
  try {
    handler.postMessage(payload);
    return true;
  } catch {
    return false;
  }
}

export function openHostedSocialConnect(url) {
  if (!url || typeof window === 'undefined') return 'unavailable';

  const webkitHandlers = window.webkit?.messageHandlers || {};
  const payload = {
    type: 'openSocialConnect',
    url,
    callbackURLScheme: import.meta.env.VITE_IOS_CALLBACK_SCHEME || null,
  };
  const nativeHandlers = [
    webkitHandlers.owlgorithmSocialConnect,
    webkitHandlers.openSocialConnect,
    webkitHandlers.owlgorithm,
  ].filter(Boolean);

  for (const handler of nativeHandlers) {
    if (postToHandler(handler, payload)) return 'native';
  }

  window.open(url, '_blank', 'noopener,noreferrer');
  return 'browser';
}
