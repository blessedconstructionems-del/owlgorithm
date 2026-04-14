import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { useApp } from './context/AppContext';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const RevenueGodMode = lazy(() => import('./pages/RevenueGodMode'));
const TrendRadar = lazy(() => import('./pages/TrendRadar'));
const Scheduler = lazy(() => import('./pages/Scheduler'));
const Analytics = lazy(() => import('./pages/Analytics'));
const ABTesting = lazy(() => import('./pages/ABTesting'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const TruthRadar = lazy(() => import('./pages/TruthRadar'));
const Strategy = lazy(() => import('./pages/Strategy'));
const NightWatch = lazy(() => import('./pages/NightWatch'));
const Platforms = lazy(() => import('./pages/Platforms'));
const Wellness = lazy(() => import('./pages/Wellness'));
const Settings = lazy(() => import('./pages/Settings'));
const AuthPage = lazy(() => import('./pages/Auth'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPassword'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmail'));
const PrivacyPage = lazy(() => import('./pages/Privacy'));
const TermsPage = lazy(() => import('./pages/Terms'));

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#060910] px-6 text-gray-300">
      <div className="w-full max-w-sm rounded-2xl border border-white/8 bg-[#0f1219]/90 px-6 py-8 text-center shadow-2xl shadow-black/60">
        <p className="text-sm uppercase tracking-[0.22em] text-gray-500">Owlgorithm</p>
        <h1 className="mt-3 text-2xl font-semibold text-white">Checking your session</h1>
        <p className="mt-2 text-sm text-gray-400">Hold on while your workspace loads.</p>
      </div>
    </div>
  );
}

function RouteLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6 text-gray-300">
      <div className="w-full max-w-sm rounded-2xl border border-white/8 bg-[#0f1219]/90 px-6 py-8 text-center shadow-2xl shadow-black/40">
        <p className="text-sm uppercase tracking-[0.22em] text-gray-500">Owlgorithm</p>
        <p className="mt-3 text-sm text-gray-300">Loading module</p>
      </div>
    </div>
  );
}

function RoutedPage({ component }) {
  const Component = component;

  return (
    <Suspense fallback={<RouteLoading />}>
      <Component />
    </Suspense>
  );
}

function ProtectedLayout() {
  const { authStatus } = useApp();

  if (authStatus === 'loading') {
    return <LoadingScreen />;
  }

  if (authStatus === 'anonymous') {
    return <Navigate replace to="/auth" />;
  }

  return <AppLayout />;
}

function PublicOnly({ children }) {
  const { authStatus } = useApp();

  if (authStatus === 'loading') {
    return <LoadingScreen />;
  }

  if (authStatus !== 'anonymous') {
    return <Navigate replace to="/" />;
  }

  return children;
}

function LegalLayout() {
  return <Outlet />;
}

function App() {
  return (
    <Routes>
      <Route path="/auth" element={<PublicOnly><RoutedPage component={AuthPage} /></PublicOnly>} />
      <Route path="/auth/reset-password" element={<RoutedPage component={ResetPasswordPage} />} />
      <Route path="/auth/verify-email" element={<RoutedPage component={VerifyEmailPage} />} />
      <Route element={<LegalLayout />}>
        <Route path="/legal/privacy" element={<RoutedPage component={PrivacyPage} />} />
        <Route path="/legal/terms" element={<RoutedPage component={TermsPage} />} />
      </Route>
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<RoutedPage component={Dashboard} />} />
        <Route path="/revenue-god-mode" element={<RoutedPage component={RevenueGodMode} />} />
        <Route path="/trends" element={<RoutedPage component={TrendRadar} />} />
        <Route path="/scheduler" element={<RoutedPage component={Scheduler} />} />
        <Route path="/analytics" element={<RoutedPage component={Analytics} />} />
        <Route path="/ab-testing" element={<RoutedPage component={ABTesting} />} />
        <Route path="/leaderboard" element={<RoutedPage component={Leaderboard} />} />
        <Route path="/truth-radar" element={<RoutedPage component={TruthRadar} />} />
        <Route path="/strategy" element={<RoutedPage component={Strategy} />} />
        <Route path="/night-watch" element={<RoutedPage component={NightWatch} />} />
        <Route path="/platforms" element={<RoutedPage component={Platforms} />} />
        <Route path="/wellness" element={<RoutedPage component={Wellness} />} />
        <Route path="/settings" element={<RoutedPage component={Settings} />} />
      </Route>
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}

export default App;
