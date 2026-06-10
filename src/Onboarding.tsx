import { useState } from 'react'
import { db, CATEGORIES, DEFAULT_SETTINGS, type Category } from './db.ts'

const MIN_LIMIT = 5
const MAX_LIMIT = 20

interface Draft {
  title: string
  category: Category
}

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [limit, setLimit] = useState(DEFAULT_SETTINGS.wishLimit)
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('Прочее')
  const [saving, setSaving] = useState(false)

  function addDraft() {
    const t = title.trim()
    if (!t || drafts.length >= limit) return
    setDrafts([...drafts, { title: t, category }])
    setTitle('')
  }

  function removeDraft(i: number) {
    setDrafts(drafts.filter((_, idx) => idx !== i))
  }

  async function finish() {
    if (drafts.length === 0 || saving) return
    setSaving(true)
    const now = new Date().toISOString()
    await db.transaction('rw', db.dvizh, db.settings, async () => {
      await db.dvizh.bulkAdd(
        drafts.map((d) => ({
          id: crypto.randomUUID(),
          title: d.title,
          note: '',
          category: d.category,
          status: 'active' as const,
          createdAt: now,
          doneAt: null,
        })),
      )
      await db.settings.put({
        ...DEFAULT_SETTINGS,
        wishLimit: limit,
        onboardingCompleted: true,
      })
    })
  }

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col px-5 py-8">
      {step === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="text-6xl">🌞</span>
          <h1 className="mt-4 text-3xl font-bold text-stone-800">Летний Движ</h1>
          <p className="mt-4 text-stone-600">
            Помнишь, какими были летние каникулы? Вернём этот вайб. Собери свой
            список движух на лето — прогулки, челленджи, путешествия, свидания —
            и проживи его по-настоящему.
          </p>
          <button
            onClick={() => setStep(1)}
            className="mt-8 w-full rounded-xl bg-amber-500 py-3 font-semibold text-white shadow-sm active:bg-amber-600"
          >
            Начать
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h2 className="text-2xl font-bold text-stone-800">Сколько движух берём?</h2>
          <p className="mt-3 text-stone-600">
            Лучше сделать 10 вещей качественно, чем 30 как попало. Лимит всегда
            можно поменять в настройках.
          </p>
          <div className="mt-6 flex items-center gap-8">
            <button
              onClick={() => setLimit(Math.max(MIN_LIMIT, limit - 1))}
              disabled={limit <= MIN_LIMIT}
              className="h-12 w-12 rounded-full bg-amber-100 text-2xl font-bold text-amber-700 disabled:opacity-40"
            >
              −
            </button>
            <span className="w-12 text-center text-4xl font-bold text-stone-800">
              {limit}
            </span>
            <button
              onClick={() => setLimit(Math.min(MAX_LIMIT, limit + 1))}
              disabled={limit >= MAX_LIMIT}
              className="h-12 w-12 rounded-full bg-amber-100 text-2xl font-bold text-amber-700 disabled:opacity-40"
            >
              +
            </button>
          </div>
          <button
            onClick={() => setStep(2)}
            className="mt-8 w-full rounded-xl bg-amber-500 py-3 font-semibold text-white shadow-sm active:bg-amber-600"
          >
            Дальше
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex min-h-0 flex-1 flex-col">
          <h2 className="text-2xl font-bold text-stone-800">Первые движухи</h2>
          <p className="mt-2 text-sm text-stone-600">
            Запиши хотя бы одну — остальные добавишь по ходу лета. ({drafts.length}/{limit})
          </p>

          <div className="mt-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addDraft()}
              placeholder="Например: сплавиться по реке"
              className="w-full rounded-xl border border-amber-200 p-3 outline-none focus:border-amber-400"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-full px-2.5 py-1 text-xs ${
                    category === c
                      ? 'bg-amber-500 text-white'
                      : 'bg-amber-100 text-stone-600'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <button
              onClick={addDraft}
              disabled={!title.trim() || drafts.length >= limit}
              className="mt-2 w-full rounded-xl bg-amber-100 py-2.5 font-medium text-amber-700 disabled:opacity-40"
            >
              + Добавить в список
            </button>
          </div>

          <ul className="mt-3 flex-1 space-y-1.5 overflow-y-auto">
            {drafts.map((d, i) => (
              <li
                key={i}
                className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm"
              >
                <span className="min-w-0 flex-1 truncate text-stone-800">{d.title}</span>
                <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                  {d.category}
                </span>
                <button
                  onClick={() => removeDraft(i)}
                  aria-label="Убрать"
                  className="shrink-0 p-1 text-stone-400 hover:text-red-500"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          <button
            onClick={finish}
            disabled={drafts.length === 0 || saving}
            className="mt-3 w-full rounded-xl bg-amber-500 py-3 font-semibold text-white shadow-sm active:bg-amber-600 disabled:opacity-40"
          >
            Лето началось! 🌞
          </button>
        </div>
      )}
    </div>
  )
}
