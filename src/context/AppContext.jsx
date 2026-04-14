import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { STATIC_DEMO } from '@/lib/runtime';
import { resetTrendsStore } from '@/data/trends';

const AppContext = createContext(null);
const GUEST_MODE_KEY = 'owlgorithm:guest-mode';
const GUEST_PREFERENCES_KEY = 'owlgorithm:guest-preferences';
const CONNECTED_PLATFORMS_KEY = 'owlgorithm:connected-platforms';
const ONBOARDING_CHECKLIST_KEY = 'owlgorithm:onboarding-checklist';
const DEFAULT_ENVIRONMENT = '/snowy-owl.mp4';

const DEFAULT_PREFERENCES = {
  environment: DEFAULT_ENVIRONMENT,
  sidebarCollapsed: false,
};

const DEFAULT_CHECKLIST = {
  connectPlatform: false,
  discoverTrend: false,
  schedulePost: false,
  setNiche: false,
};

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Revenue God deployed new paths',
    message: 'Three live revenue paths worth $9,400 are deploying under your current guardrails.',
    time: '2 min ago',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Leakage prevented',
    message: 'Revenue God intercepted $2,840 in leakage by pausing a weak cold-traffic segment.',
    time: '1 hour ago',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Bundle engine online',
    message: 'A new high-intent bundle path is converting at 41% and scaling into the next budget tier.',
    time: '3 hours ago',
    read: false,
  },
  {
    id: 'notif-4',
    title: 'Target beat at P75',
    message: 'The simulator now projects $47,820 this month if current winners keep clearing confidence thresholds.',
    time: '5 hours ago',
    read: true,
  },
  {
    id: 'notif-5',
    title: 'Creator surge detected',
    message: 'Creator promo codes are outperforming baseline and the bandit just shifted 18% more budget into the winner.',
    time: '8 hours ago',
    read: true,
  },
];

const GUEST_USER = {
  id: 'guest',
  name: 'Guest',
  email: 'Read-only access',
  avatar: 'G',
  plan: 'Guest',
  isGuest: true,
};

function normalizeEnvironment(environment) {
  const value = `${environment || ''}`.trim();
  if (!value) return DEFAULT_PREFERENCES.environment;
  if (value === '/snowy-owl.3840x2160.mp4') return DEFAULT_ENVIRONMENT;
  return value;
}

function normalizeUser(user, fallback = {}) {
  const name = `${user?.name || fallback.name || 'Owlgorithm User'}`.trim() || 'Owlgorithm User';
  const email = `${user?.email || fallback.email || ''}`.trim();

  return {
    ...fallback,
    ...user,
    name,
    email,
    avatar: name.charAt(0).toUpperCase(),
    plan: `${user?.plan || fallback.plan || 'Founding'}`.trim() || 'Founding',
    isGuest: Boolean(user?.isGuest || fallback.isGuest),
  };
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
    const environment = normalizeEnvironment(parsed.environment);
    return {
      environment: environment === 'gradient:aurora' ? DEFAULT_ENVIRONMENT : environment,
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
    user: normalizeUser(GUEST_USER, GUEST_USER),
    preferences: readGuestPreferences(),
  };
}

export function AppProvider({ children }) {
  const [authStatus, setAuthStatus] = useState('loading');
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [connectedPlatforms, setConnectedPlatforms] = useState(() => readLocalJson(CONNECTED_PLATFORMS_KEY, []));
  const [onboardingChecklist, setOnboardingChecklist] = useState(() => readLocalJson(ONBOARDING_CHECKLIST_KEY, DEFAULT_CHECKLIST));
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState(null);

  const applySession = useCallback((payload) => {
    if (payload?.authenticated && payload.user) {
      setGuestMode(false);
      setAuthStatus('authenticated');
      setUser(normalizeUser(payload.user));
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

  const updateChecklist = useCallback((key, value) => {
    setOnboardingChecklist((prev) => {
      const next = { ...prev, [key]: value };
      writeLocalJson(ONBOARDING_CHECKLIST_KEY, next);
      return next;
    });
  }, []);

  const markNotificationRead = useCallback((id) => {
    setNotifications((prev) => prev.map((notification) => (
      notification.id === id ? { ...notification, read: true } : notification
    )));
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
    onboardingChecklist,
    notifications,
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
    updateChecklist,
    markNotificationRead,
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
    markNotificationRead,
    logout,
    notifications,
    onboardingChecklist,
    requestPasswordReset,
    preferences.environment,
    preferences.sidebarCollapsed,
    refreshSession,
    resendVerification,
    resetPassword,
    setEnvironment,
    signUp,
    toggleSidebar,
    updateChecklist,
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
