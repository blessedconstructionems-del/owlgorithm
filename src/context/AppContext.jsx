import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { STATIC_DEMO } from '@/lib/runtime';
import { resetTrendsStore } from '@/data/trends';

const AppContext = createContext(null);
const GUEST_MODE_KEY = 'owlgorithm:guest-mode';
const GUEST_PREFERENCES_KEY = 'owlgorithm:guest-preferences';
const CONNECTED_PLATFORMS_KEY = 'owlgorithm:connected-platforms';

const DEFAULT_PREFERENCES = {
  environment: 'gradient:aurora',
  sidebarCollapsed: false,
};

const GUEST_USER = {
  id: 'guest',
  name: 'Guest',
  email: 'Read-only access',
  avatar: 'G',
  isGuest: true,
};

function normalizeEnvironment(environment) {
  const value = `${environment || ''}`.trim();
  if (!value) return DEFAULT_PREFERENCES.environment;
  return value;
}

function buildAnonymousState() {
  return {
    authStatus: 'anonymous',
    user: null,
    preferences: DEFAULT_PREFERENCES,
  };
}

function readStorage(key) {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(key);
}

function writeStorage(key, value) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(key, value);
}

function removeStorage(key) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(key);
}

function readLocalJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalJson(key, value) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures.
  }
}

function guestModeEnabled() {
  return readStorage(GUEST_MODE_KEY) === '1';
}

function setGuestMode(enabled) {
  if (enabled) {
    writeStorage(GUEST_MODE_KEY, '1');
    return;
  }

  removeStorage(GUEST_MODE_KEY);
}

function readGuestPreferences() {
  const fallback = { ...DEFAULT_PREFERENCES };
  const raw = readStorage(GUEST_PREFERENCES_KEY);
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    return {
      environment: normalizeEnvironment(parsed.environment),
      sidebarCollapsed: Boolean(parsed.sidebarCollapsed),
    };
  } catch {
    return fallback;
  }
}

function writeGuestPreferences(preferences) {
  writeStorage(GUEST_PREFERENCES_KEY, JSON.stringify(preferences));
}

function buildGuestState() {
  return {
    authStatus: 'guest',
    user: GUEST_USER,
    preferences: readGuestPreferences(),
  };
}

export function AppProvider({ children }) {
  const [authStatus, setAuthStatus] = useState('loading');
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [connectedPlatforms, setConnectedPlatforms] = useState(() => readLocalJson(CONNECTED_PLATFORMS_KEY, []));
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState(null);

  const applySession = useCallback((payload) => {
    if (payload?.authenticated && payload.user) {
      setGuestMode(false);
      setAuthStatus('authenticated');
      setUser(payload.user);
      setPreferences({
        environment: normalizeEnvironment(payload.preferences?.environment),
        sidebarCollapsed: Boolean(payload.preferences?.sidebarCollapsed),
      });
      return;
    }

    if (guestModeEnabled()) {
      const guest = buildGuestState();
      setAuthStatus(guest.authStatus);
      setUser(guest.user);
      setPreferences(guest.preferences);
      return;
    }

    if (STATIC_DEMO) {
      setGuestMode(true);
      const guest = buildGuestState();
      setAuthStatus(guest.authStatus);
      setUser(guest.user);
      setPreferences(guest.preferences);
      return;
    }

    const anonymous = buildAnonymousState();
    setAuthStatus(anonymous.authStatus);
    setUser(anonymous.user);
    setPreferences(anonymous.preferences);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const data = await apiRequest('/api/auth/session');
      applySession(data);
      setAuthError(null);
      return data;
    } catch (error) {
      applySession(null);
      setAuthError(error.message);
      return null;
    }
  }, [applySession]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const runAuthMutation = useCallback(async (endpoint, payload, options = {}) => {
    const { applySessionResult = false } = options;
    setAuthBusy(true);
    setAuthError(null);

    try {
      const data = await apiRequest(endpoint, {
        method: 'POST',
        json: payload,
      });

      if (applySessionResult) {
        applySession(data);
      }

      return { ok: true, data };
    } catch (error) {
      setAuthError(error.message);
      return { ok: false, error };
    } finally {
      setAuthBusy(false);
    }
  }, [applySession]);

  const signUp = useCallback((payload) => {
    return runAuthMutation('/api/auth/signup', payload);
  }, [runAuthMutation]);

  const login = useCallback((payload) => {
    return runAuthMutation('/api/auth/login', payload, { applySessionResult: true });
  }, [runAuthMutation]);

  const resendVerification = useCallback((payload) => {
    return runAuthMutation('/api/auth/verification/resend', payload);
  }, [runAuthMutation]);

  const requestPasswordReset = useCallback((payload) => {
    return runAuthMutation('/api/auth/password-reset/request', payload);
  }, [runAuthMutation]);

  const verifyEmail = useCallback((payload) => {
    return runAuthMutation('/api/auth/verify-email', payload, { applySessionResult: true });
  }, [runAuthMutation]);

  const resetPassword = useCallback((payload) => {
    return runAuthMutation('/api/auth/password-reset/confirm', payload, { applySessionResult: true });
  }, [runAuthMutation]);

  const continueAsGuest = useCallback(() => {
    setGuestMode(true);
    setAuthError(null);
    resetTrendsStore();
    applySession(null);
  }, [applySession]);

  const logout = useCallback(async () => {
    if (authStatus === 'authenticated') {
      try {
        await apiRequest('/api/auth/logout', { method: 'POST' });
      } catch {
        // Best effort logout.
      }
    }

    setGuestMode(false);
    resetTrendsStore();
    applySession(null);
    setAuthError(null);
  }, [applySession, authStatus]);

  const updateProfile = useCallback(async ({ name, email }) => {
    const data = await apiRequest('/api/account/profile', {
      method: 'PATCH',
      json: { name, email },
    });

    applySession(data);
    return data;
  }, [applySession]);

  const updatePreferences = useCallback(async (partial) => {
    const next = {
      environment: partial.environment ? normalizeEnvironment(partial.environment) : preferences.environment,
      sidebarCollapsed: partial.sidebarCollapsed ?? preferences.sidebarCollapsed,
    };

    setPreferences(next);

    if (authStatus === 'guest') {
      writeGuestPreferences(next);
      return {
        authenticated: false,
        guest: true,
        preferences: next,
      };
    }

    try {
      const data = await apiRequest('/api/account/preferences', {
        method: 'PATCH',
        json: next,
      });
      applySession(data);
      return data;
    } catch (error) {
      setPreferences(preferences);
      throw error;
    }
  }, [applySession, authStatus, preferences]);

  const changePassword = useCallback(async ({ currentPassword, newPassword }) => {
    return apiRequest('/api/account/password', {
      method: 'POST',
      json: { currentPassword, newPassword },
    });
  }, []);

  const deleteAccount = useCallback(async ({ password }) => {
    await apiRequest('/api/account', {
      method: 'DELETE',
      json: { password },
    });

    resetTrendsStore();
    applySession(null);
  }, [applySession]);

  const toggleSidebar = useCallback(() => {
    updatePreferences({ sidebarCollapsed: !preferences.sidebarCollapsed }).catch(() => {
      // Restore happens inside updatePreferences.
    });
  }, [preferences.sidebarCollapsed, updatePreferences]);

  const setEnvironment = useCallback((value) => {
    updatePreferences({ environment: value }).catch(() => {
      // Restore happens inside updatePreferences.
    });
  }, [updatePreferences]);

  const connectPlatform = useCallback((platformId) => {
    setConnectedPlatforms((prev) => {
      if (prev.includes(platformId)) return prev;
      const next = [...prev, platformId];
      writeLocalJson(CONNECTED_PLATFORMS_KEY, next);
      return next;
    });
  }, []);

  const disconnectPlatform = useCallback((platformId) => {
    setConnectedPlatforms((prev) => {
      const next = prev.filter((item) => item !== platformId);
      writeLocalJson(CONNECTED_PLATFORMS_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({
    authStatus,
    isAuthenticated: authStatus === 'authenticated',
    isGuest: authStatus === 'guest',
    authBusy,
    authError,
    user,
    sidebarCollapsed: preferences.sidebarCollapsed,
    environment: preferences.environment,
    connectedPlatforms,
    refreshSession,
    signUp,
    login,
    resendVerification,
    requestPasswordReset,
    verifyEmail,
    resetPassword,
    continueAsGuest,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
    toggleSidebar,
    setEnvironment,
    connectPlatform,
    disconnectPlatform,
  }), [
    authBusy,
    authError,
    authStatus,
    connectPlatform,
    connectedPlatforms,
    continueAsGuest,
    deleteAccount,
    disconnectPlatform,
    login,
    logout,
    requestPasswordReset,
    preferences.environment,
    preferences.sidebarCollapsed,
    refreshSession,
    resendVerification,
    resetPassword,
    setEnvironment,
    signUp,
    toggleSidebar,
    updateProfile,
    changePassword,
    user,
    verifyEmail,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
