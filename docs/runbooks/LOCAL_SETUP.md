# Локальный запуск

## Зафиксированные инструменты

Git 2.53.0, Node.js 24.14.0, pnpm 11.9.0, Docker 29.6.1 / Compose 5.3.0. Совместимые более новые Docker/Git допустимы, но Node и pnpm должны совпадать с `package.json` и CI.

В Codex Desktop bundled Node, pnpm и Git находятся в workspace dependencies. Если они не видны в PowerShell, добавьте выданные приложением каталоги Node/fallback/Git в `PATH` текущей сессии; не устанавливайте второй runtime скрытно.

## Чистый старт

```powershell
Copy-Item -LiteralPath .env.example -Destination .env
pnpm install --frozen-lockfile
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Откройте `http://localhost:3000/health` и `http://localhost:3000/api/health`. При доступной БД endpoint отвечает `200`; остановленная БД даёт безопасный `503`.

`.env` содержит только локальные значения, игнорируется Git и не переносится в production. Для другого порта измените одновременно Compose и локальную строку подключения.

## Codex worktrees

Каждый worktree использует собственный `node_modules`, но общие контейнерные имена/порты конфликтуют. Для параллельной работы задайте уникальный Compose project name и порты в локальном override либо запускайте БД только в одном worktree. Никогда не направляйте тесты на development/production DB. Перед утверждением результата выполните `pnpm check:full` из нужного worktree.

## Остановка

`pnpm db:down` останавливает контейнеры и сохраняет development volume. Удаление volume не является обычной остановкой; используйте reset только осознанно по [DATABASE_OPERATIONS.md](DATABASE_OPERATIONS.md).
