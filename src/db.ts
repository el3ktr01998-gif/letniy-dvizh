import Dexie, { type EntityTable } from 'dexie'

// ===== Модель данных v1 (она же контракт экспорта/миграции на v2) =====

export type DvizhStatus = 'active' | 'done'
export type CheckinStatus = 'done' | 'skipped'

export const CATEGORIES = [
  'Прогулки',
  'Путешествия',
  'Челленджи',
  'Спорт',
  'Привычки',
  'Семья',
  'Любовь к себе',
  'Прочее',
] as const
export type Category = (typeof CATEGORIES)[number]

export interface Dvizh {
  id: string
  title: string
  note: string
  category: Category
  status: DvizhStatus
  createdAt: string // ISO
  doneAt: string | null
}

export interface Challenge {
  id: string
  dvizhId: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  daysOfWeek: number[] // 1 (пн) … 7 (вс)
}

export interface Checkin {
  id: string
  challengeId: string
  date: string // YYYY-MM-DD
  status: CheckinStatus
}

export interface Settings {
  id: 'main'
  wishLimit: number
  onboardingCompleted: boolean
  lastExportAt: string | null
}

export const db = new Dexie('letniy-dvizh') as Dexie & {
  dvizh: EntityTable<Dvizh, 'id'>
  challenge: EntityTable<Challenge, 'id'>
  checkin: EntityTable<Checkin, 'id'>
  settings: EntityTable<Settings, 'id'>
}

db.version(1).stores({
  dvizh: 'id, status, category, createdAt',
  challenge: 'id, dvizhId',
  checkin: 'id, challengeId, date',
  settings: 'id',
})

export const DEFAULT_SETTINGS: Settings = {
  id: 'main',
  wishLimit: 10,
  onboardingCompleted: false,
  lastExportAt: null,
}

export async function getSettings(): Promise<Settings> {
  return (await db.settings.get('main')) ?? DEFAULT_SETTINGS
}
