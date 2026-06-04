import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { STATIC_PREVIEW, apiRequest } from '@/lib/api';
import { resetTrendsStore } from '@/data/trends';
import {
  confirmFirebasePhoneCode,
  continueWithFirebaseEmail,
  continueWithFirebaseGoogle,
  firebaseAuthConfigured,
  firebaseErrorMessage,
  sendFirebasePasswordReset,
  sendFirebasePhoneCode,
} from '@/lib/firebaseAuth';
import {
  DEFAULT_CREATOR_PROFILE,
  isCreatorProfileComplete,
  normalizeCreatorProfile,
} from '@/lib/creatorProfile';

const AppContext = createContext(null);
const DEFAULT_ENVIRONMENT = '/snowy-owl.mp4';
const AUTH_PREVIEW = STATIC_PREVIEW || ['1', 'true', 'yes'].includes(
  `${import.meta.env.VITE_AUTH_PREVIEW || ''}`.toLowerCase(),
);

const DEFAULT_PREFERENCES = {
  environment: DEFAULT_ENVIRONMENT,
  sidebarCollapsed: false,
  creatorProfile: DEFAULT_CREATOR_PROFILE,
};

const INITIAL_NOTIFICATIONS = [];

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

function buildPreviewState() {
  return {
    authStatus: 'guest',
    user: normalizeUser({
      id: 'static-preview',
      name: 'Preview Guest',
      email: 'preview@owlgorithm.local',
      plan: 'Preview',
      isGuest: true,
    }),
    preferences: DEFAULT_PREFERENCES,
  };
}

export function AppProvider({ children }) {
  const [authStatus, setAuthStatus] = useState('loading');
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState(null);

  const applySession = useCallback((payload) => {
    if (payload?.authenticated && payload.user) {
      setAuthStatus(payload.user.isGuest ? 'guest' : 'authenticated');
      setUser(normalizeUser(payload.user));
      const creatorProfile = normalizeCreatorProfile(payload.preferences?.creatorProfile);
      setPreferences({
        environment: normalizeEnvironment(payload.preferences?.environment),
        sidebarCollapsed: Boolean(payload.preferences?.sidebarCollapsed),
        creatorProfile,
      });
      return;
    }

    const anonymous = buildAnonymousState();
    setAuthStatus(anonymous.authStatus);
    setUser(anonymous.user);
    setPreferences(anonymous.preferences);
  }, []);

  const refreshSession = useCallback(async () => {
    if (AUTH_PREVIEW) {
      const preview = buildPreviewState();
      setAuthStatus(preview.authStatus);
      setUser(preview.user);
      setPreferences(preview.preferences);
      setAuthError(null);
      return {
        authenticated: true,
        user: preview.user,
        preferences: preview.preferences,
      };
    }

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

  const continueWithEmail = useCallback(async (payload) => {
    setAuthBusy(true);
    setAuthError(null);

    try {
      const data = await continueWithFirebaseEmail(payload);
      applySession(data);
      return { ok: true, data };
    } catch (error) {
      const message = firebaseErrorMessage(error);
      setAuthError(message);
      return { ok: false, error: { ...error, message } };
    } finally {
      setAuthBusy(false);
    }
  }, [applySession]);

  const continueWithGoogle = useCallback(async () => {
    setAuthBusy(true);
    setAuthError(null);

    try {
      const data = await continueWithFirebaseGoogle();
      applySession(data);
      return { ok: true, data };
    } catch (error) {
      const message = firebaseErrorMessage(error);
      setAuthError(message);
      return { ok: false, error: { ...error, message } };
    } finally {
      setAuthBusy(false);
    }
  }, [applySession]);

  const sendPhoneCode = useCallback(async (phoneNumber) => {
    setAuthBusy(true);
    setAuthError(null);

    try {
      await sendFirebasePhoneCode(phoneNumber);
      return { ok: true };
    } catch (error) {
      const message = firebaseErrorMessage(error);
      setAuthError(message);
      return { ok: false, error: { ...error, message } };
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const confirmPhoneCode = useCallback(async (code) => {
    setAuthBusy(true);
    setAuthError(null);

    try {
      const data = await confirmFirebasePhoneCode(code);
      applySession(data);
      return { ok: true, data };
    } catch (error) {
      const message = firebaseErrorMessage(error);
      setAuthError(message);
      return { ok: false, error: { ...error, message } };
    } finally {
      setAuthBusy(false);
    }
  }, [applySession]);

  const requestFirebasePasswordReset = useCallback(async ({ email }) => {
    setAuthBusy(true);
    setAuthError(null);

    try {
      await sendFirebasePasswordReset(email);
      return { ok: true };
    } catch (error) {
      const message = firebaseErrorMessage(error);
      setAuthError(message);
      return { ok: false, error: { ...error, message } };
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const logout = useCallback(async () => {
    if (AUTH_PREVIEW) {
      const preview = buildPreviewState();
      setAuthStatus(preview.authStatus);
      setUser(preview.user);
      setPreferences(preview.preferences);
      setAuthError(null);
      return;
    }

    if (authStatus === 'authenticated') {
      try {
        await apiRequest('/api/auth/logout', { method: 'POST' });
      } catch {
        // Best effort logout.
      }
    }

    resetTrendsStore();
    applySession(null);
    setAuthError(null);
  }, [applySession, authStatus]);

  const updateProfile = useCallback(async ({ name, email }) => {
    if (AUTH_PREVIEW) {
      const nextUser = normalizeUser({ ...user, name, email, isGuest: true });
      setUser(nextUser);
      return {
        authenticated: true,
        user: nextUser,
        preferences,
        verificationRequired: false,
      };
    }

    const data = await apiRequest('/api/account/profile', {
      method: 'PATCH',
      json: { name, email },
    });

    applySession(data);
    return data;
  }, [applySession, preferences, user]);

  const updatePreferences = useCallback(async (partial) => {
    const nextCreatorProfile = partial.creatorProfile
      ? normalizeCreatorProfile(partial.creatorProfile)
      : preferences.creatorProfile;
    const next = {
      environment: partial.environment ? normalizeEnvironment(partial.environment) : preferences.environment,
      sidebarCollapsed: partial.sidebarCollapsed ?? preferences.sidebarCollapsed,
      creatorProfile: nextCreatorProfile,
    };

    setPreferences(next);

    if (AUTH_PREVIEW) {
      return {
        authenticated: true,
        user,
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
  }, [applySession, preferences, user]);

  const updateCreatorProfile = useCallback(async (profile) => {
    const now = new Date().toISOString();
    const current = normalizeCreatorProfile(preferences.creatorProfile);
    return updatePreferences({
      creatorProfile: normalizeCreatorProfile({
        ...current,
        ...profile,
        completed: true,
        createdAt: current.createdAt || now,
        updatedAt: now,
      }),
    });
  }, [preferences.creatorProfile, updatePreferences]);

  const changePassword = useCallback(async ({ currentPassword, newPassword }) => {
    if (AUTH_PREVIEW) {
      throw new Error('Password changes need the live Owlgorithm backend.');
    }

    return apiRequest('/api/account/password', {
      method: 'POST',
      json: { currentPassword, newPassword },
    });
  }, []);

  const deleteAccount = useCallback(async ({ password }) => {
    if (AUTH_PREVIEW) {
      throw new Error('Account deletion needs the live Owlgorithm backend.');
    }

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
    creatorProfile: normalizeCreatorProfile(preferences.creatorProfile),
    creatorProfileComplete: isCreatorProfileComplete(preferences.creatorProfile),
    sidebarCollapsed: preferences.sidebarCollapsed,
    environment: preferences.environment,
    notifications,
    refreshSession,
    firebaseAuthEnabled: firebaseAuthConfigured(),
    signUp,
    login,
    continueWithEmail,
    continueWithGoogle,
    sendPhoneCode,
    confirmPhoneCode,
    resendVerification,
    requestPasswordReset,
    requestFirebasePasswordReset,
    verifyEmail,
    resetPassword,
    logout,
    updateProfile,
    updateCreatorProfile,
    changePassword,
    deleteAccount,
    toggleSidebar,
    setEnvironment,
    markNotificationRead,
  }), [
    authBusy,
    authError,
    authStatus,
    confirmPhoneCode,
    continueWithEmail,
    continueWithGoogle,
    deleteAccount,
    login,
    markNotificationRead,
    logout,
    notifications,
    requestFirebasePasswordReset,
    requestPasswordReset,
    preferences.environment,
    preferences.creatorProfile,
    preferences.sidebarCollapsed,
    refreshSession,
    resendVerification,
    resetPassword,
    setEnvironment,
    sendPhoneCode,
    signUp,
    toggleSidebar,
    updateProfile,
    updateCreatorProfile,
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
