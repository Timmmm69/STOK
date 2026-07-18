# Индекс архитектурных решений

| ADR                                                               | Статус   | Решение                                              |
| ----------------------------------------------------------------- | -------- | ---------------------------------------------------- |
| [ADR-001](ADR-001-repository-and-application-shape.md)            | accepted | Один репозиторий, пакет и Next.js-приложение         |
| [ADR-002](ADR-002-core-technology-stack.md)                       | accepted | TypeScript/Next.js/PostgreSQL/Prisma/Zod             |
| [ADR-003](ADR-003-modular-monolith.md)                            | accepted | Модульный монолит с публичными границами             |
| [ADR-004](ADR-004-database-and-money-storage.md)                  | accepted | PostgreSQL, миграции и целые денежные единицы        |
| [ADR-005](ADR-005-operation-history-and-corrections.md)           | accepted | Неизменяемые факты и компенсирующие операции         |
| [ADR-006](ADR-006-testing-and-quality-gates.md)                   | accepted | Пирамида тестов и обязательные quality gates         |
| [ADR-007](ADR-007-saas-ready-without-premature-generalization.md) | accepted | Подписная готовность без универсального конструктора |

ADR нужен до смены ключевого стека, формы поставки, владельца данных, транзакционной границы, политики истории/изоляции либо ослабления автоматической защиты. Новый ADR содержит контекст, решение, альтернативы, последствия, риски и условия пересмотра.
