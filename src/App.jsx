import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import TrendRadar from './pages/TrendRadar'
import Scheduler from './pages/Scheduler'
import Analytics from './pages/Analytics'
import ABTesting from './pages/ABTesting'
import Leaderboard from './pages/Leaderboard'
import TruthRadar from './pages/TruthRadar'
import Strategy from './pages/Strategy'
import NightWatch from './pages/NightWatch'
import Platforms from './pages/Platforms'
import Wellness from './pages/Wellness'
import Settings from './pages/Settings'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/trends" element={<TrendRadar />} />
        <Route path="/scheduler" element={<Scheduler />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/ab-testing" element={<ABTesting />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/truth-radar" element={<TruthRadar />} />
        <Route path="/strategy" element={<Strategy />} />
        <Route path="/night-watch" element={<NightWatch />} />
        <Route path="/platforms" element={<Platforms />} />
        <Route path="/wellness" element={<Wellness />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App
