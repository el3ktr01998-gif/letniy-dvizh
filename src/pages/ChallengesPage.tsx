import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Challenge, type Checkin } from '../db.ts'
import {
  WEEKDAY_LABELS,
  MONTH_LABELS,
  expectedDates,
  monthCells,
  todayStr,
} from '../lib/dates.ts'

interface Row {
  challenge: Challenge
  title: string
  done: number
  total: number
  needsToday: boolean
}

export default function ChallengesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const now = new Date()
  const [month, setMonth] = useState({ y: now.getFullYear(), m: now.getMonth() })

  const rows = useLiveQuery(async (): Promise<Row[]> => {
    const today = todayStr()
    const challenges = await db.challenge.toArray()
    const result: Row[] = []
    for (const c of challenges) {
      const dvizh = await db.dvizh.get(c.dvizhId)
      if (!dvizh) continue
      const expected = expectedDates(c)
      const checkins = await db.checkin.where('challengeId').equals(c.id).toArray()
      const done = checkins.filter((x) => x.status === 'done').length
      const needsToday =
        expected.includes(today) && !checkins.some((x) => x.date === today)
      result.push({
        challenge: c,
        title: dvizh.title,
        done,
        total: expected.length,
        needsToday,
      })
    }
    return result
  }, []) ?? []

  const selected = rows.find((r) => r.challenge.id === selectedId) ?? rows[0] ?? null

  const checkins = useLiveQuery(
    () =>
      selected
        ? db.checkin.where('challengeId').equals(selected.challenge.id).toArray()
        : Promise.resolve([] as Checkin[]),
    [selected?.challenge.id],
  ) ?? []

  if (rows.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Челленджи</h1>
        <p className="mt-8 text-center text-stone-400">
          Пока нет ни одного челленджа. Создай движуху и включи у неё
          «Сделать челленджем» — появится расписание и календарь. 🏆
        </p>
      </div>
    )
  }

  const expected = selected ? new Set(expectedDates(selected.challenge)) : new Set<string>()
  const byDate = new Map(checkins.map((c) => [c.date, c]))
  const today = todayStr()
  const cells = monthCells(month.y, month.m)

  async function tapDay(date: string) {
    if (!selected || !expected.has(date)) return
    const existing = byDate.get(date)
    if (!existing) {
      await db.checkin.add({
        id: crypto.randomUUID(),
        challengeId: selected.challenge.id,
        date,
        status: 'done',
      })
    } else if (existing.status === 'done') {
      await db.checkin.update(existing.id, { status: 'skipped' })
    } else {
      await db.checkin.delete(existing.id)
    }
  }

  function shiftMonth(delta: number) {
    const d = new Date(month.y, month.m + delta, 1)
    setMonth({ y: d.getFullYear(), m: d.getMonth() })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800">Челленджи</h1>

      <div className="mt-3 space-y-2">
        {rows.map((r) => {
          const isSel = selected?.challenge.id === r.challenge.id
          const pct = r.total === 0 ? 0 : Math.round((r.done / r.total) * 100)
          return (
            <button
              key={r.challenge.id}
              onClick={() => setSelectedId(r.challenge.id)}
              className={`w-full rounded-xl bg-white p-3 text-left shadow-sm ${
                isSel ? 'ring-2 ring-amber-400' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 flex-1 truncate font-medium text-stone-800">
                  {r.title}
                </p>
                {r.needsToday && (
                  <span className="shrink-0 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
                    сегодня!
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-stone-500">
                {r.challenge.daysOfWeek
                  .slice()
                  .sort((a, b) => a - b)
                  .map((d) => WEEKDAY_LABELS[d - 1])
                  .join(' · ')}{' '}
                — {r.done} из {r.total}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-amber-100">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>
          )
        })}
      </div>

      {selected && (
        <div className="mt-4 rounded-xl bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <button
              onClick={() => shiftMonth(-1)}
              className="rounded-full px-3 py-1 text-lg text-amber-600"
            >
              ‹
            </button>
            <p className="font-semibold text-stone-800">
              {MONTH_LABELS[month.m]} {month.y}
            </p>
            <button
              onClick={() => shiftMonth(1)}
              className="rounded-full px-3 py-1 text-lg text-amber-600"
            >
              ›
            </button>
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1 text-center text-xs text-stone-400">
            {WEEKDAY_LABELS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((date, i) => {
              if (!date) return <span key={`e${i}`} />
              const isExpected = expected.has(date)
              const ci = byDate.get(date)
              const isToday = date === today
              let cls = 'text-stone-400'
              let mark = ''
              if (isExpected) {
                if (ci?.status === 'done') {
                  cls = 'bg-amber-500 text-white font-semibold'
                  mark = '✓'
                } else if (ci?.status === 'skipped') {
                  cls = 'bg-stone-200 text-stone-500 line-through'
                } else {
                  cls = 'bg-amber-100 text-amber-800 font-medium'
                }
              }
              return (
                <button
                  key={date}
                  onClick={() => tapDay(date)}
                  className={`flex h-9 items-center justify-center rounded-lg text-sm ${cls} ${
                    isToday ? 'ring-2 ring-amber-400' : ''
                  }`}
                >
                  {mark || Number(date.slice(8))}
                </button>
              )
            })}
          </div>

          <p className="mt-2 text-center text-xs text-stone-400">
            Тап по дню: отметить ✓ → пропустить → сбросить
          </p>
        </div>
      )}
    </div>
  )
}
