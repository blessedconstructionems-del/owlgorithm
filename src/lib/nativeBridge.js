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

function nativeSocialHandlers() {
  const webkitHandlers = window.webkit?.messageHandlers || {};
  return [
    webkitHandlers.owlgorithmSocialConnect,
    webkitHandlers.openSocialConnect,
    webkitHandlers.owlgorithm,
  ].filter(Boolean);
}

export function reserveHostedSocialConnectWindow() {
  if (typeof window === 'undefined') return null;
  if (nativeSocialHandlers().length) return null;

  const connectWindow = window.open('about:blank', '_blank');
  if (connectWindow) {
    try {
      connectWindow.document.title = 'Opening Upload-Post';
      connectWindow.document.body.style.background = '#060910';
      connectWindow.document.body.style.color = '#e5e7eb';
      connectWindow.document.body.style.fontFamily = 'system-ui, sans-serif';
      connectWindow.document.body.style.padding = '24px';
      connectWindow.document.body.textContent = 'Opening Upload-Post...';
    } catch {
      // The window is still usable even if the placeholder cannot be written.
    }
  }

  return connectWindow;
}

export function openHostedSocialConnect(url, reservedWindow = null) {
  if (!url || typeof window === 'undefined') return 'unavailable';

  const payload = {
    type: 'openSocialConnect',
    url,
    callbackURLScheme: import.meta.env.VITE_IOS_CALLBACK_SCHEME || null,
  };
  const nativeHandlers = nativeSocialHandlers();

  for (const handler of nativeHandlers) {
    if (postToHandler(handler, payload)) return 'native';
  }

  if (reservedWindow && !reservedWindow.closed) {
    reservedWindow.opener = null;
    reservedWindow.location.href = url;
    return 'browser';
  }

  window.open(url, '_blank', 'noopener,noreferrer');
  return 'browser';
}
