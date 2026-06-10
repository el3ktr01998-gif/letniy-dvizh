import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  db,
  CATEGORIES,
  DEFAULT_SETTINGS,
  type Category,
  type Challenge,
  type Dvizh,
} from '../db.ts'
import { WEEKDAY_LABELS, todayStr, defaultEndDate } from '../lib/dates.ts'

type Filter = 'Все' | Category

interface EditState {
  dvizh: Dvizh | null
  challenge: Challenge | null
}

export default function DvizhiPage() {
  const [filter, setFilter] = useState<Filter>('Все')
  const [editing, setEditing] = useState<EditState | null>(null)

  const settings = useLiveQuery(() => db.settings.get('main'))
  const limit = settings?.wishLimit ?? DEFAULT_SETTINGS.wishLimit
  const all = useLiveQuery(() => db.dvizh.toArray()) ?? []

  const activeCount = all.filter((d) => d.status === 'active').length
  const limitReached = activeCount >= limit

  const shown = (filter === 'Все' ? all : all.filter((d) => d.category === filter))
    .slice()
    .sort((a, b) =>
      a.status === b.status
        ? b.createdAt.localeCompare(a.createdAt)
        : a.status === 'active'
          ? -1
          : 1,
    )

  async function toggleDone(d: Dvizh) {
    await db.dvizh.update(
      d.id,
      d.status === 'active'
        ? { status: 'done', doneAt: new Date().toISOString() }
        : { status: 'active', doneAt: null },
    )
  }

  async function remove(d: Dvizh) {
    if (!confirm(`Удалить «${d.title}»?`)) return
    await db.transaction('rw', db.dvizh, db.challenge, db.checkin, async () => {
      const ch = await db.challenge.where('dvizhId').equals(d.id).first()
      if (ch) {
        await db.checkin.where('challengeId').equals(ch.id).delete()
        await db.challenge.delete(ch.id)
      }
      await db.dvizh.delete(d.id)
    })
  }

  async function openEdit(d: Dvizh) {
    const ch = await db.challenge.where('dvizhId').equals(d.id).first()
    setEditing({ dvizh: d, challenge: ch ?? null })
  }

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-stone-800">Движухи</h1>
        <span className="text-sm font-medium text-amber-600">
          {activeCount} из {limit}
        </span>
      </div>

      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {(['Все', ...CATEGORIES] as Filter[]).map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`shrink-0 rounded-full px-3 py-1 text-sm ${
              filter === c
                ? 'bg-amber-500 text-white'
                : 'bg-amber-100 text-stone-600'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {shown.length === 0 && (
        <p className="mt-8 text-center text-stone-400">
          {filter === 'Все'
            ? 'Пока пусто. Добавь первую движуху на лето! 🌞'
            : 'В этой категории пока пусто.'}
        </p>
      )}

      <ul className="mt-4 space-y-2">
        {shown.map((d) => (
          <li
            key={d.id}
            className={`rounded-xl bg-white p-3 shadow-sm ${
              d.status === 'done' ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => toggleDone(d)}
                aria-label="Сделано"
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                  d.status === 'done'
                    ? 'border-amber-500 bg-amber-500 text-white'
                    : 'border-amber-300'
                }`}
              >
                {d.status === 'done' ? '✓' : ''}
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={`font-medium text-stone-800 ${
                    d.status === 'done' ? 'line-through' : ''
                  }`}
                >
                  {d.title}
                </p>
                {d.note && <p className="mt-0.5 text-sm text-stone-500">{d.note}</p>}
                <span className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                  {d.category}
                </span>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => openEdit(d)}
                  aria-label="Редактировать"
                  className="rounded p-1.5 text-stone-400 hover:text-stone-600"
                >
                  ✏️
                </button>
                <button
                  onClick={() => remove(d)}
                  aria-label="Удалить"
                  className="rounded p-1.5 text-stone-400 hover:text-red-500"
                >
                  🗑️
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-5 pb-2">
        {limitReached ? (
          <p className="rounded-xl bg-amber-100 p-3 text-center text-sm text-stone-600">
            Лимит достигнут: {limit} активных движух. Лучше сделать {limit}{' '}
            качественно, чем 30 как попало 😉 Заверши что-нибудь или подними
            лимит в настройках.
          </p>
        ) : (
          <button
            onClick={() => setEditing({ dvizh: null, challenge: null })}
            className="w-full rounded-xl bg-amber-500 py-3 font-semibold text-white shadow-sm active:bg-amber-600"
          >
            + Добавить движуху
          </button>
        )}
      </div>

      {editing !== null && (
        <DvizhForm
          dvizh={editing.dvizh}
          challenge={editing.challenge}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function DvizhForm({
  dvizh,
  challenge,
  onClose,
}: {
  dvizh: Dvizh | null
  challenge: Challenge | null
  onClose: () => void
}) {
  const [title, setTitle] = useState(dvizh?.title ?? '')
  const [note, setNote] = useState(dvizh?.note ?? '')
  const [category, setCategory] = useState<Category>(dvizh?.category ?? 'Прочее')
  const [isChallenge, setIsChallenge] = useState(challenge !== null)
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(challenge?.daysOfWeek ?? [])
  const [startDate, setStartDate] = useState(challenge?.startDate ?? todayStr())
  const [endDate, setEndDate] = useState(
    challenge?.endDate ?? defaultEndDate(todayStr()),
  )

  function toggleDay(d: number) {
    setDaysOfWeek((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    )
  }

  const challengeValid =
    !isChallenge || (daysOfWeek.length > 0 && startDate <= endDate)

  async function save() {
    const t = title.trim()
    if (!t || !challengeValid) return
    const dvizhId = dvizh?.id ?? crypto.randomUUID()

    await db.transaction('rw', db.dvizh, db.challenge, db.checkin, async () => {
      if (dvizh) {
        await db.dvizh.update(dvizh.id, { title: t, note: note.trim(), category })
      } else {
        await db.dvizh.add({
          id: dvizhId,
          title: t,
          note: note.trim(),
          category,
          status: 'active',
          createdAt: new Date().toISOString(),
          doneAt: null,
        })
      }

      const existing = await db.challenge.where('dvizhId').equals(dvizhId).first()
      if (isChallenge) {
        if (existing) {
          await db.challenge.update(existing.id, { startDate, endDate, daysOfWeek })
        } else {
          await db.challenge.add({
            id: crypto.randomUUID(),
            dvizhId,
            startDate,
            endDate,
            daysOfWeek,
          })
        }
      } else if (existing) {
        await db.checkin.where('challengeId').equals(existing.id).delete()
        await db.challenge.delete(existing.id)
      }
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-10 flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-stone-800">
          {dvizh ? 'Редактировать' : 'Новая движуха'}
        </h2>
        <input
          autoFocus={!dvizh}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Что сделаем этим летом?"
          className="mt-3 w-full rounded-xl border border-amber-200 p-3 outline-none focus:border-amber-400"
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Заметка (необязательно)"
          rows={2}
          className="mt-2 w-full rounded-xl border border-amber-200 p-3 outline-none focus:border-amber-400"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1 text-sm ${
                category === c
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-100 text-stone-600'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <label className="mt-4 flex items-center justify-between rounded-xl bg-amber-50 p-3">
          <span className="font-medium text-stone-800">Сделать челленджем 🏆</span>
          <input
            type="checkbox"
            checked={isChallenge}
            onChange={(e) => setIsChallenge(e.target.checked)}
            className="h-5 w-5 accent-amber-500"
          />
        </label>

        {isChallenge && (
          <div className="mt-2 rounded-xl border border-amber-200 p-3">
            <p className="text-sm font-medium text-stone-700">Дни недели</p>
            <div className="mt-2 flex gap-1.5">
              {WEEKDAY_LABELS.map((w, i) => (
                <button
                  key={w}
                  onClick={() => toggleDay(i + 1)}
                  className={`h-9 flex-1 rounded-lg text-sm ${
                    daysOfWeek.includes(i + 1)
                      ? 'bg-amber-500 font-semibold text-white'
                      : 'bg-amber-100 text-stone-600'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <label className="flex-1 text-sm text-stone-600">
                С
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-amber-200 p-2"
                />
              </label>
              <label className="flex-1 text-sm text-stone-600">
                По
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-amber-200 p-2"
                />
              </label>
            </div>
            {!challengeValid && (
              <p className="mt-2 text-xs text-red-500">
                Выбери хотя бы один день недели и проверь даты.
              </p>
            )}
            {challenge && (
              <p className="mt-2 text-xs text-stone-400">
                Отметки чекинов сохраняются при изменении расписания.
              </p>
            )}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-stone-100 py-3 font-medium text-stone-600"
          >
            Отмена
          </button>
          <button
            onClick={save}
            disabled={!title.trim() || !challengeValid}
            className="flex-1 rounded-xl bg-amber-500 py-3 font-semibold text-white disabled:opacity-40"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  )
}
