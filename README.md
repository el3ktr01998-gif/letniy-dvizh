# Летний Движ 🌞

PWA для взрослых, которые хотят вернуть себе вайб летних каникул: движухи, челленджи и трекинг прогресса. План разработки — в [ROADMAP.md](./ROADMAP.md).

## Стек
Vite + React + TypeScript, Tailwind CSS 4, Dexie (IndexedDB), vite-plugin-pwa. Хостинг — GitLab Pages.

## Запуск локально
Нужен Node.js 20+ (https://nodejs.org).

```bash
npm install
npm run dev
```

Открыть http://localhost:5173.

## Деплой
Пуш в `main` автоматически запускает пайплайн (см. `.gitlab-ci.yml`): сборка → публикация на GitLab Pages.

- Прогресс: Build → Pipelines
- Адрес сайта: Deploy → Pages

Открыть адрес на телефоне → «Добавить на главный экран» — приложение установится как PWA.

## Что дальше
Дни 2–3 по ROADMAP: CRUD движух, категории, лимит. Схема данных уже готова в `src/db.ts` — это контракт для экспорта и будущей миграции на v2.
