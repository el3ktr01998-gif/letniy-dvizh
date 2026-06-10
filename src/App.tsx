import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, DEFAULT_SETTINGS, type Settings } from './db.ts'
import Onboarding from './Onboarding.tsx'
import DvizhiPage from './pages/DvizhiPage.tsx'
import ChallengesPage from './pages/ChallengesPage.tsx'
import SettingsPage from './pages/SettingsPage.tsx'

const tabs = [
  { to: '/dvizhi', label: 'Движухи', emoji: '🌞' },
  { to: '/challenges', label: 'Челленджи', emoji: '🏆' },
  { to: '/settings', label: 'Настройки', emoji: '⚙️' },
]

export default function App() {
  // null = ещё загружается; после загрузки — настройки (или дефолтные).
  // Если настроек нет, но движухи уже есть (старые пользователи) —
  // онбординг не показываем.
  const settings = useLiveQuery<Settings, null>(
    async () => {
      const s = await db.settings.get('main')
      if (s) return s
      const count = await db.dvizh.count()
      return { ...DEFAULT_SETTINGS, onboardingCompleted: count > 0 }
    },
    [],
    null,
  )

  if (settings === null) return null
  if (!settings.onboardingCompleted) return <Onboarding />

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
