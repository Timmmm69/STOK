# ADR-002: основной технологический стек

Статус: accepted, 2026-07-18.

## Контекст

Нужны Windows/Codex-совместимость, типобезопасный full-stack, PostgreSQL, низкая стоимость и зрелые тесты. Фактически доступны Node 24.14.0 и pnpm 11.9.0.

## Решение

TypeScript 6.0.3, Next.js 16/React 19 App Router, PostgreSQL 18.4, Prisma 7 с `@prisma/adapter-pg`, Zod, Pino, Vitest, Playwright, pnpm и Docker Compose. Версии фиксируются lock-файлом и CI. TypeScript 7.0.2 был проверен и отклонён: parser `@typescript-eslint` 8.64.0 из актуального Next.js поддерживает `<6.1.0` и падает до lint.

ESLint зафиксирован на последнем совместимом 9.39.5: ESLint 10.7.0 опубликован, но плагины React/import/a11y в `eslint-config-next` 16.2.10 объявляют peer support только до ESLint 9.

## Альтернативы

Отдельный React+NestJS отклонён из-за двух приложений и дублированной поставки. Drizzle/raw SQL рассмотрены: дают больший SQL-контроль, но Prisma выбран за schema/migrate/type-safe client; критический SQL остаётся просматриваемым в миграциях. SQLite отклонён из-за будущей конкурентности, транзакций и различия с production PostgreSQL.

## Последствия и риски

Prisma 7 требует ESM, generated output и driver adapter; ORM не определяет доменные правила. Next.js не должен втянуть бизнес-логику в route/UI. Major-обновления проходят полный gate.

## Условия пересмотра

Подтверждённая невозможность выразить критическую конкурентность/SQL, неприемлемая runtime/hosting стоимость или прекращение поддержки выбранного стека.
