import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, DEFAULT_SETTINGS, type Settings } from './db.ts'
import { expectedDates, todayStr } from './lib/dates.ts'
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

  // Сколько челленджей ждут чекина сегодня — для бейджа на вкладке
  const todayCount = useLiveQuery(async () => {
    const today = todayStr()
    const challenges = await db.challenge.toArray()
    let n = 0
    for (const c of challenges) {
      if (!expectedDates(c).includes(today)) continue
      const dvizh = await db.dvizh.get(c.dvizhId)
      if (!dvizh || dvizh.status !== 'active') continue
      const checkin = await db.checkin
        .where('challengeId')
        .equals(c.id)
        .and((x) => x.date === today)
        .first()
      if (!checkin) n++
    }
    return n
  }, []) ?? 0

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
            <span className="relative text-xl">
              {tab.emoji}
              {tab.to === '/challenges' && todayCount > 0 && (
                <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {todayCount}
                </span>
              )}
            </span>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
