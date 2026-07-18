# STOK

STOK is an early-stage system for traceable intake and sale of unique items in small second-hand stores. This repository currently contains the Product Compass and a reproducible engineering harness only; store features are intentionally absent.

## Start locally

1. Use Node.js 24.14.0, pnpm 11.9.0 and Docker Desktop.
2. Copy `.env.example` to ignored `.env`.
3. Run `pnpm install --frozen-lockfile`.
4. Run `pnpm db:up`, `pnpm db:migrate`, then `pnpm db:seed`.
5. Run `pnpm dev` and open `http://localhost:3000/health`.

Full instructions: [LOCAL_SETUP.md](docs/runbooks/LOCAL_SETUP.md). Product direction: [PRODUCT_COMPASS.md](docs/product/PRODUCT_COMPASS.md). Architecture: [ARCHITECTURE.md](ARCHITECTURE.md).
