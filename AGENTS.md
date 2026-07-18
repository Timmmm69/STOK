# STOK agent map

STOK is a specialized operating and management system for small stores with many unique physical items. The first store is «Лучок». The repository implements the engineering harness, invited-owner Google access and the organization/store setup; inventory and sales flows are not implemented.

## Read before changing

- Product direction: `docs/product/PRODUCT_COMPASS.md`
- Business rules: `docs/product/BUSINESS_RULES.md`
- Active execution plans: `docs/exec-plans/active/`
- Architecture: `ARCHITECTURE.md` and `docs/architecture/`
- Decisions: `docs/decisions/index.md`
- Definition of Done: `docs/quality/DEFINITION_OF_DONE.md`
- Local setup and testing: `docs/runbooks/LOCAL_SETUP.md`, `docs/runbooks/GOOGLE_LOGIN_SETUP.md`, `docs/runbooks/TESTING_LOCALLY.md`

For a non-trivial task, create/update an execution plan before implementation. Do not implement a feature without acceptance criteria or expand scope for hypothetical future use.

## Required commands

```text
pnpm format
pnpm check
pnpm check:full
```

Run the narrower relevant tests while iterating, then the gates required by Definition of Done. Never claim a command passed unless it actually ran.

## Non-negotiable rules

- UI and route handlers do not access Prisma/database directly; business operations go through application services.
- Modules expose public contracts; no deep cross-module imports, hidden table sharing, cycles, or unjustified neighboring-module changes.
- Do not create an abstraction for one use or add future behavior “just in case”.
- Do not disable tests/linters, use `any` as an escape hatch, or weaken a gate to get green.
- Store money as integer minor units, never `float`.
- Financial and inventory facts are corrected, not silently deleted; critical operations are atomic and idempotent.
- Derive allowed organization scope on the server; never trust client `organization_id`.
- Keep secrets out of code, logs, fixtures and committed `.env` files.
- Update rules, tests, migrations, ADR/docs and implementation in the same vertical slice.

The task is done only when behavior, negative paths, automated tests, documentation, migration/recovery impact and executed verification evidence agree.
