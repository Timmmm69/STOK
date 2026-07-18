# Локальное тестирование

## Быстрый цикл

- `pnpm test` — unit и HTTP behavior tests без БД.
- `pnpm lint` / `pnpm typecheck` — статические ошибки.
- `pnpm check:architecture` — циклы, границы, документы, секреты, env и Prisma schema.
- `pnpm check` — весь быстрый gate.

## Полный цикл

`pnpm check:full` запускает быстрый gate, поднимает PostgreSQL, сбрасывает только test DB, применяет migrations/seed, выполняет integration, production build и Playwright Chromium smoke.

Для отдельного E2E сначала выполните `pnpm db:up`, `pnpm test:integration`, затем `pnpm test:e2e`. Playwright ждёт URL по состоянию, сохраняет trace и screenshot при падении; фиксированные sleeps запрещены.

E2E web server использует выделенный локальный порт 3100, чтобы не вмешиваться в обычный `pnpm dev` на 3000.

Локальная установка браузера при необходимости: `pnpm exec playwright install chromium`. В CI используется `--with-deps`.

Тесты не зависят от development данных, порядка выполнения или production секретов. Факт запуска и результат существенной задачи записываются в execution plan.
