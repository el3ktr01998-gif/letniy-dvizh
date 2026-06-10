import { useLiveQuery } from 'dexie-react-hooks'
import { db, DEFAULT_SETTINGS } from '../db.ts'

const MIN_LIMIT = 5
const MAX_LIMIT = 20

export default function SettingsPage() {
  const settings = useLiveQuery(() => db.settings.get('main'))
  const limit = settings?.wishLimit ?? DEFAULT_SETTINGS.wishLimit

  async function setLimit(n: number) {
    const value = Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, n))
    await db.settings.put({ ...DEFAULT_SETTINGS, ...settings, wishLimit: value })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800">Настройки</h1>

      <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
        <p className="font-medium text-stone-800">Лимит активных движух</p>
        <p className="mt-1 text-sm text-stone-500">
          Лучше меньше, но качественно. Рекомендуем 10.
        </p>
        <div className="mt-3 flex items-center justify-center gap-6">
          <button
            onClick={() => setLimit(limit - 1)}
            disabled={limit <= MIN_LIMIT}
            className="h-10 w-10 rounded-full bg-amber-100 text-xl font-bold text-amber-700 disabled:opacity-40"
          >
            −
          </button>
          <span className="w-10 text-center text-2xl font-bold text-stone-800">
            {limit}
          </span>
          <button
            onClick={() => setLimit(limit + 1)}
            disabled={limit >= MAX_LIMIT}
            className="h-10 w-10 rounded-full bg-amber-100 text-xl font-bold text-amber-700 disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-stone-400">
        Экспорт и импорт данных появятся чуть позже 🌞
      </p>
    </div>
  )
}
