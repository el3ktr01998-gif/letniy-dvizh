// Утилиты для работы с датами (локальные даты в формате YYYY-MM-DD)

export const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export const MONTH_LABELS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
]

export function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayStr(): string {
  return toDateStr(new Date())
}

/** День недели: 1 (пн) … 7 (вс) */
export function isoWeekday(d: Date): number {
  return d.getDay() === 0 ? 7 : d.getDay()
}

/** Все запланированные дни челленджа */
export function expectedDates(c: {
  startDate: string
  endDate: string
  daysOfWeek: number[]
}): string[] {
  const res: string[] = []
  const cur = new Date(c.startDate + 'T00:00:00')
  const end = new Date(c.endDate + 'T00:00:00')
  let guard = 0
  while (cur <= end && guard < 1000) {
    if (c.daysOfWeek.includes(isoWeekday(cur))) res.push(toDateStr(cur))
    cur.setDate(cur.getDate() + 1)
    guard++
  }
  return res
}

/** Ячейки календаря месяца: null — пустые клетки до 1-го числа */
export function monthCells(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1)
  const cells: (string | null)[] = Array(isoWeekday(first) - 1).fill(null)
  const d = new Date(first)
  while (d.getMonth() === month) {
    cells.push(toDateStr(d))
    d.setDate(d.getDate() + 1)
  }
  return cells
}

/** Дата конца челленджа по умолчанию: до конца лета, иначе +4 недели */
export function defaultEndDate(start: string): string {
  const aug = `${new Date().getFullYear()}-08-31`
  if (aug >= start) return aug
  const d = new Date(start + 'T00:00:00')
  d.setDate(d.getDate() + 28)
  return toDateStr(d)
}
