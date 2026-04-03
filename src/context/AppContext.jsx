import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const AppContext = createContext(null);

const STORAGE_KEYS = {
  sidebar: 'owlgorithm:sidebar-collapsed',
  checklist: 'owlgorithm:onboarding-checklist',
  platforms: 'owlgorithm:connected-platforms',
  environment: 'owlgorithm:environment',
  user: 'owlgorithm:user',
};

const LEGACY_STORAGE_KEYS = {
  sidebar: 'trendowl:sidebar-collapsed',
  checklist: 'trendowl:onboarding-checklist',
  platforms: 'trendowl:connected-platforms',
  environment: 'trendowl:environment',
  user: 'trendowl:user',
};

function loadFromStorage(key, fallback, legacyKey) {
  try {
    const raw = localStorage.getItem(key) ?? (legacyKey ? localStorage.getItem(legacyKey) : null);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — silently degrade
  }
}

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

const STATIC_USER = {
  name: 'Amy',
  email: 'amy@owlgorithm.com',
  avatar: 'A',
  plan: 'Founding',
};

function normalizeEnvironment(env) {
  if (env === '/snowy-owl.mp4') return '/tech-hud.3840x2160.mp4';
  return env;
}

export function AppProvider({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => loadFromStorage(STORAGE_KEYS.sidebar, false, LEGACY_STORAGE_KEYS.sidebar)
  );

  const [onboardingChecklist, setOnboardingChecklist] = useState(
    () => loadFromStorage(STORAGE_KEYS.checklist, DEFAULT_CHECKLIST, LEGACY_STORAGE_KEYS.checklist)
  );

  const [connectedPlatforms, setConnectedPlatforms] = useState(
    () => loadFromStorage(STORAGE_KEYS.platforms, [], LEGACY_STORAGE_KEYS.platforms)
  );

  const [user, setUserState] = useState(
    () => loadFromStorage(STORAGE_KEYS.user, STATIC_USER, LEGACY_STORAGE_KEYS.user)
  );

  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const [environment, setEnvironmentState] = useState(
    () => normalizeEnvironment(loadFromStorage(STORAGE_KEYS.environment, '/tech-hud.3840x2160.mp4', LEGACY_STORAGE_KEYS.environment))
  );

  const setEnvironment = useCallback((env) => {
    const next = normalizeEnvironment(env);
    setEnvironmentState(next);
    saveToStorage(STORAGE_KEYS.environment, next);
  }, []);

  const updateUser = useCallback((partial) => {
    setUserState((prev) => {
      const nextName = partial.name?.trim() || prev.name;
      const next = {
        ...prev,
        ...partial,
        name: nextName,
        avatar: nextName.charAt(0).toUpperCase(),
      };
      saveToStorage(STORAGE_KEYS.user, next);
      return next;
    });
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      saveToStorage(STORAGE_KEYS.sidebar, next);
      return next;
    });
  }, []);

  const updateChecklist = useCallback((key, value) => {
    setOnboardingChecklist((prev) => {
      const next = { ...prev, [key]: value };
      saveToStorage(STORAGE_KEYS.checklist, next);
      return next;
    });
  }, []);

  const connectPlatform = useCallback((id) => {
    setConnectedPlatforms((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      saveToStorage(STORAGE_KEYS.platforms, next);
      return next;
    });
  }, []);

  const disconnectPlatform = useCallback((id) => {
    setConnectedPlatforms((prev) => {
      const next = prev.filter((p) => p !== id);
      saveToStorage(STORAGE_KEYS.platforms, next);
      return next;
    });
  }, []);

  const markNotificationRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const value = useMemo(
    () => ({
      sidebarCollapsed,
      toggleSidebar,
      onboardingChecklist,
      updateChecklist,
      connectedPlatforms,
      connectPlatform,
      disconnectPlatform,
      user,
      updateUser,
      notifications,
      markNotificationRead,
      environment,
      setEnvironment,
    }),
    [
      sidebarCollapsed,
      toggleSidebar,
      onboardingChecklist,
      updateChecklist,
      connectedPlatforms,
      connectPlatform,
      disconnectPlatform,
      user,
      updateUser,
      notifications,
      markNotificationRead,
      environment,
      setEnvironment,
    ]
  );

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
