# Execution Plan 001: Organization and Store Foundation

Статус: draft, не начат. Этот план не разрешает реализацию в рамках harness.

## Цель и пользовательский результат

Создать первый вертикальный срез, в котором владелец при чистом запуске видит и сохраняет базовые настройки одной организации и одного магазина, необходимые следующим потокам. Результат — устойчивый server-owned context, а не SaaS/admin-панель.

## Границы

Входит: одна организация, один магазин, рабочее имя, валюта, timezone, locale, базовая настройка; первичная настройка и просмотр; миграция, validation, application service, UI и тесты.

Не входит: auth/пользователи/роли, несколько организаций/магазинов, billing, адресный справочник, категории, поставщики, партии, товар, цены, касса и аналитика. До auth используется явно ограниченный bootstrap context только для локального собственного магазина; production exposure запрещён.

## Предполагаемая модель данных

- `Organization`: UUID, name, defaultCurrency, defaultTimezone, locale, timestamps/version.
- `Store`: UUID, organizationId, name, timezone override (если доказано), status, timestamps/version.
- Ровно одна bootstrap organization/store в этом срезе; уникальность и FK включают organization scope там, где применимо.

Модель является предложением. До migration нужно подтвердить валюту BYN, timezone `Europe/Minsk`, обязательность store override и допустимость изменения.

## Бизнес-инварианты

- `BR-ORG-001` (proposed): context создаётся идемпотентно и не дублируется повтором.
- `BR-ORG-002` (proposed): разрешённая организация определяется серверным bootstrap context, а не client ID.
- `BR-ORG-003` (proposed): валюта/timezone валидны и не меняют историю уже зафиксированных будущих операций.
- `BR-STORE-001` (proposed): магазин принадлежит ровно одной организации.

После утверждения правила добавляются в нормативный реестр до кода.

## API-контракты

- `GET /api/setup` → текущее состояние setup без секретов.
- `POST /api/setup` с idempotency key и Zod payload `{ organizationName, storeName, currency, timezone, locale }` → `201` впервые, стабильный результат при безопасном повторе; `409` при конфликтующем повторе.
- После setup отдельное изменение настроек проектируется только если нужно пользователю; endpoint не принимает доверенный `organizationId`.

Route только валидирует/преобразует и вызывает `organizations` application service. Конкретные error codes фиксируются до реализации.

## Интерфейс

Один короткий экран первичной настройки и read-only summary после сохранения. Defaults видимы, timezone/currency объяснены, повтор submit блокируется интерфейсом и сервером. Нет навигации к будущим функциям.

## Тесты

Unit validation/invariants; HTTP `GET/POST`, invalid input, idempotent repeat/conflict; PostgreSQL migration/constraints/repository; transaction rollback; запрещённый client organization scope; Playwright clean setup and persisted reload; architecture/import gates.

## Критерии готовности

- Вопросы ниже решены и нормативные правила утверждены.
- Чистая БД проходит setup; повтор не создаёт дубли.
- После reload сохраняется одна organization/store с корректной currency/timezone.
- Client ID не меняет scope; route/UI не импортируют Prisma.
- Migration/rollback/recovery impact reviewed; docs и tests обновлены.
- `pnpm check:full` и clean-state setup фактически прошли.

## Риски

Временный bootstrap context может ошибочно попасть в production; ранняя модель может преждевременно зафиксировать multi-tenancy; изменение валюты/timezone повлияет на будущую историю; auth может потребовать миграцию context.

## Вопросы до запуска

1. Подтверждены ли BYN, `Europe/Minsk` и русский locale?
2. Нужен ли юридический name/адрес сейчас или это scope creep?
3. Может ли валюта меняться и как это влияет на будущие записи?
4. Как технически запретить внешний production-доступ до auth?
5. Нужно ли хранить business day cutoff отдельно от timezone?
