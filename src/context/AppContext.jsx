import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const AppContext = createContext(null);

const STORAGE_KEYS = {
  sidebar: 'trendowl:sidebar-collapsed',
  checklist: 'trendowl:onboarding-checklist',
  platforms: 'trendowl:connected-platforms',
  environment: 'trendowl:environment',
};

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
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
    title: 'New trend detected',
    message: '#AIArt is surging across TikTok and Instagram with 240% growth in 24h.',
    time: '2 min ago',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Post published',
    message: 'Your scheduled post "5 Tools You Need" was published to Instagram.',
    time: '1 hour ago',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Weekly report ready',
    message: 'Your weekly trend performance report for Mar 24–31 is ready to view.',
    time: '3 hours ago',
    read: false,
  },
  {
    id: 'notif-4',
    title: 'A/B test completed',
    message: 'Variant B outperformed A by 34% on engagement rate. Auto-applied.',
    time: '5 hours ago',
    read: true,
  },
  {
    id: 'notif-5',
    title: 'Night Watch alert',
    message: '3 new trends detected overnight: #VibeCode, #MCPServers, #AIAgents.',
    time: '8 hours ago',
    read: true,
  },
];

const STATIC_USER = {
  name: 'Amy',
  email: 'amy@trendowl.com',
  avatar: 'A',
  plan: 'Oracle (Pro)',
};

export function AppProvider({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => loadFromStorage(STORAGE_KEYS.sidebar, false)
  );

  const [onboardingChecklist, setOnboardingChecklist] = useState(
    () => loadFromStorage(STORAGE_KEYS.checklist, DEFAULT_CHECKLIST)
  );

  const [connectedPlatforms, setConnectedPlatforms] = useState(
    () => loadFromStorage(STORAGE_KEYS.platforms, [])
  );

  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const [environment, setEnvironmentState] = useState(
    () => loadFromStorage(STORAGE_KEYS.environment, '/snowy-owl.mp4')
  );

  const setEnvironment = useCallback((env) => {
    setEnvironmentState(env);
    saveToStorage(STORAGE_KEYS.environment, env);
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
      user: STATIC_USER,
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
