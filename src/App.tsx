import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import DvizhiPage from './pages/DvizhiPage.tsx'
import ChallengesPage from './pages/ChallengesPage.tsx'
import SettingsPage from './pages/SettingsPage.tsx'

const tabs = [
  { to: '/dvizhi', label: 'Движухи', emoji: '🌞' },
  { to: '/challenges', label: 'Челленджи', emoji: '🏆' },
  { to: '/settings', label: 'Настройки', emoji: '⚙️' },
]

export default function App() {
  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col">
      <main className="flex-1 overflow-y-auto px-4 pb-2 pt-6">
        <Routes>
          <Route path="/" element={<Navigate to="/dvizhi" replace />} />
          <Route path="/dvizhi" element={<DvizhiPage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
      <nav className="flex border-t border-amber-200 bg-white/80 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
                isActive ? 'font-semibold text-amber-600' : 'text-stone-500'
              }`
            }
          >
            <span className="text-xl">{tab.emoji}</span>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
