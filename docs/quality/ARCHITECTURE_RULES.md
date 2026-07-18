# Автоматические архитектурные правила

`pnpm check:architecture` объединяет три проверяемых механизма:

- dependency-cruiser падает на цикле и зависимости `src/app` от database/generated Prisma, а domain/application — от framework/infrastructure;
- `scripts/quality.ts` падает на отсутствующем нормативном документе, committed env, типовом секрете, пустой/отсутствующей migration и deep import соседнего модуля;
- Prisma validate падает на некорректной schema/config; integration дополнительно применяет migrations к чистой PostgreSQL.

ESLint отдельно запрещает `any` и database/Prisma imports из `src/app`. TypeScript работает в strict/noEmit. `.gitignore` исключает local env, generated client и test/build artifacts.

Проверка изменяется только вместе с правилом и тестовым нарушением, которое доказывает способность gate упасть. Запрещены quality score, произвольные лимиты файлов и исключение пути ради зелёного результата.
