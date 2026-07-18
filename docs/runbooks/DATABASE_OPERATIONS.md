# Операции с базой

## Окружения

- Development: `localhost:55432/stok`, persistent named volume. Нестандартный host-port снижает конфликт с другими локальными PostgreSQL; внутри контейнера остаётся 5432.
- Test: `localhost:55433/stok_test`, tmpfs; команда integration всегда сбрасывает только эту базу.

## Команды

- `pnpm db:up` — поднять обе БД и дождаться healthcheck.
- `pnpm db:migrate` — применить committed migrations к `DATABASE_URL`.
- `pnpm db:seed` — идемпотентно записать технический marker.
- `pnpm db:reset` — **разрушительно** пересоздать схему по `DATABASE_URL`, затем seed; перед запуском проверьте URL.
- `pnpm db:down` — остановить без удаления development volume.

Новая продуктовая схема создаётся только в соответствующем вертикальном срезе: изменить Prisma schema, создать именованную migration на локальной development DB, просмотреть SQL, проверить чистое применение и upgrade, затем добавить тест. Применённую migration не редактировать.

Техническая таблица `_harness_state` доказывает migration/seed и не принимает бизнес-поля.
