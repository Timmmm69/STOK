# Стратегия тестирования

## Слои доказательств

1. Unit: чистые правила/таймаут/ошибка health с injected dependencies.
2. HTTP: точный контракт `200`/`503`, JSON и отсутствие внутренних деталей.
3. PostgreSQL integration: реальная migration, idempotent seed и Prisma query на изолированной test DB.
4. Build: Next.js production compilation.
5. E2E: реальный Chromium открывает `/health` и наблюдает доступные приложение/БД.

Тест проверяет поведение, а не наличие файла. Мок не заменяет integration на критической границе. Фиксированные задержки не используются, когда можно ждать health/DOM. Тестовая база сбрасывается независимо и никогда не использует production secrets.

Для будущего вертикального среза обязательны happy path, validation/authorization, duplicate/idempotency, concurrency/transaction rollback, correction/audit и user-visible recovery пропорционально риску.
