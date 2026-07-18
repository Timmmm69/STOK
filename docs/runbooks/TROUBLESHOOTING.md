# Диагностика

## Docker недоступен

Убедитесь, что Docker Desktop запущен и Linux engine готов: `docker info`. Затем повторите `pnpm db:up`. Установленный CLI без daemon не запускает PostgreSQL.

## Порт 55432 или 55433 занят

Найдите владеющий процесс/контейнер. Не останавливайте неизвестный сервис автоматически. Выберите свободные локальные порты в Compose override и синхронно обновите ignored `.env`.

## Prisma не видит DATABASE_URL

Скопируйте `.env.example` в ignored `.env` или задайте переменную текущей сессии. Проверьте, что URL указывает на нужную development/test DB до reset.

## Health возвращает 503

Проверьте `docker compose ps`, migrations и безопасный structured log. Публичный ответ намеренно не содержит внутреннюю ошибку. После восстановления БД обновите страницу; не меняйте 503 на 200 для маскировки отказа.

## Playwright не запускает Chromium

Выполните `pnpm exec playwright install chromium`; на Linux CI — `pnpm exec playwright install --with-deps chromium`. Артефакты падения находятся в `test-results/` и `playwright-report/`.

## OneDrive блокирует файлы

Остановите dev server, закройте процесс, удерживающий `.next`, и повторите. Не удаляйте весь worktree или пользовательские изменения. Для стабильного file watching допускается отдельный worktree вне синхронизируемой папки.
