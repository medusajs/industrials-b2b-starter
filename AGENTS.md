# AGENTS.md

Medusa v2 B2B starter for industrial equipment: a Medusa backend (`apps/backend`) and a TanStack Start storefront (`apps/storefront`) in a pnpm + Turborepo monorepo.

## Before You Start

1. **Package manager**: read `packageManager` in the root `package.json` (`pnpm@10.12.3`), then confirm with the lockfile (`pnpm-lock.yaml`). Use `pnpm` only. Never run `npm install` or `yarn`.
2. **Apps present**: check `apps/` before assuming an app exists. This repo has `backend` and `storefront`. Skip storefront steps if a fork removed it.
3. **Load the matching Medusa skill**: `building-with-medusa` (backend), `building-admin-dashboard-customizations` (admin UI in `apps/backend/src/admin`), `building-storefronts` / `storefront-best-practices` (storefront).
4. **Read the package docs**: before using a `@medusajs/*` package, read its `node_modules/@medusajs/<pkg>/AGENTS.md` if it exists. See [Medusa Package Docs](#medusa-package-docs-node_modules).

## Where to Look

| Task | Path in this repo | Package AGENTS.md to read first |
|------|-------------------|----------------------------------|
| Add/modify an API route | `apps/backend/src/api/{admin,store}/**/route.ts` | `@medusajs/framework` |
| Request validation | `apps/backend/src/api/store/validators.ts`, `validators.ts` next to routes | `@medusajs/framework` |
| Middleware / route auth | `apps/backend/src/api/middlewares.ts` (aggregator), `apps/backend/src/api/{admin,store}/*/middlewares.ts`, `apps/backend/src/api/middlewares/` | `@medusajs/framework` |
| Custom workflow or step | `apps/backend/src/workflows/`, `apps/backend/src/workflows/steps/` | `@medusajs/framework` (workflows-sdk) |
| Reuse a built-in flow (cart, order, customer) | import from `@medusajs/medusa/core-flows` | `@medusajs/core-flows` |
| Workflow hooks | `apps/backend/src/workflows/hooks/` | `@medusajs/core-flows` |
| Custom module (data model, service) | `apps/backend/src/modules/{company,quote}/` | `@medusajs/framework` |
| Module links | `apps/backend/src/links/` | `@medusajs/framework` |
| Admin widgets / pages | `apps/backend/src/admin/routes/`, `apps/backend/src/admin/components/` | `@medusajs/admin-sdk`, `@medusajs/ui`, `@medusajs/icons` |
| Admin data fetching | `apps/backend/src/admin/hooks/api/`, `apps/backend/src/admin/lib/client.ts` | `@medusajs/js-sdk` |
| Seed / data migration | `apps/backend/src/migration-scripts/` | `@medusajs/medusa` |
| Email templates | `apps/backend/src/email-templates/` | none |
| Product search (backend) | `apps/backend/src/search/`, `apps/backend/src/api/store/search/` | `@medusajs/medusa` |
| Modules, plugins, providers config | `apps/backend/medusa-config.ts` | `@medusajs/framework`, `@medusajs/medusa` |
| Backend tests | `apps/backend/integration-tests/http/` | `@medusajs/test-utils` |
| Storefront data fetching | `apps/storefront/src/lib/data/`, `apps/storefront/src/lib/hooks/`, SDK in `apps/storefront/src/lib/utils/sdk.ts` | `@medusajs/js-sdk`, `@medusajs/types` |
| Storefront routes | `apps/storefront/src/routes/` (file routes), `apps/storefront/src/pages/` (page components) | none |
| Storefront UI | `apps/storefront/src/components/`, `apps/storefront/src/components/ui/` | `@medusajs/icons` |
| Storefront search | `apps/storefront/src/lib/search-client.ts`, `apps/storefront/src/components/search/` | `@medusajs/instantsearch-adapter` |
| Lint failures (backend) | `apps/backend/eslint.config.ts`, root `eslint.config.ts` | `@medusajs/eslint-plugin` |

## Project Structure

```
.
├── apps/
│   ├── backend/                   # Medusa v2 server + admin extensions
│   │   ├── integration-tests/http/
│   │   ├── medusa-config.ts
│   │   └── src/
│   │       ├── admin/             # Admin UI: routes, components, hooks, lib
│   │       ├── api/               # admin/, store/, middlewares.ts
│   │       ├── email-templates/   # React Email templates
│   │       ├── links/             # Module links
│   │       ├── migration-scripts/ # Initial seed + data migrations
│   │       ├── modules/           # company, quote
│   │       ├── search/            # Product search helpers
│   │       ├── types/
│   │       ├── utils/
│   │       └── workflows/         # Workflows, steps/, hooks/
│   └── storefront/                # TanStack Start + Vite + Tailwind v4
│       ├── scripts/               # generate-static-routes.ts
│       └── src/
│           ├── components/        # Feature components, ui/, search/
│           ├── lib/               # data/, hooks/, utils/, context/, types/
│           ├── pages/             # Page components
│           ├── routes/            # TanStack file routes
│           └── styles/
├── .github/workflows/update.yaml  # Manual Medusa version update action
├── eslint.config.ts               # Shared Medusa ESLint config
├── pnpm-workspace.yaml
└── turbo.json
```

There are no subscribers or scheduled jobs. Add them under `apps/backend/src/subscribers/` and `apps/backend/src/jobs/` if needed.

## Commands

Run from the repo root unless noted. Requires Node `>=22.22.0` and pnpm 10.

| Command | What it does |
|---------|--------------|
| `pnpm install` | Install all workspaces |
| `pnpm dev` | Backend (`:9000`, admin at `/app`) + storefront |
| `pnpm backend:dev` / `pnpm storefront:dev` | Run one app |
| `pnpm build` | Build both apps |
| `pnpm lint` | Runs `medusa lint` in backend only. Storefront has no lint script |
| `pnpm --filter backend test:integration:http` | HTTP integration tests |
| `pnpm --filter backend test:unit` | Unit tests (`src/**/__tests__/**/*.unit.spec.ts`) |
| `pnpm --filter backend test:integration:modules` | Module tests (`src/modules/*/__tests__/`) |
| `pnpm --filter backend email:dev` | Email template preview on `:9004` |
| `cd apps/backend && npx medusa db:migrate` | Run migrations (also seeds demo data on first run) |
| `cd apps/backend && npx medusa db:generate <module>` | Generate migrations for a custom module |
| `cd apps/backend && npx medusa user -e <email> -p <password>` | Create an admin user |

Do not use these, they run nothing or fail:

- `pnpm test`: no app defines a `test` script. Use the backend `test:*` scripts above.
- `pnpm start`: only starts the backend. Storefront uses `serve`/`preview`.
- `pnpm --filter backend seed`: points to `src/scripts/seed.ts`, which does not exist. Seeding runs from `src/migration-scripts/` during `db:migrate`.

## Environment

- Backend: copy `apps/backend/.env.template` to `apps/backend/.env`. Stripe is enabled only when `STRIPE_API_KEY` is set. `SKIP_INITIAL_SEED=true` skips the demo seed. Tests read `apps/backend/.env.test`.
- Storefront: copy `apps/storefront/.env.example` to `apps/storefront/.env`. Needs `VITE_MEDUSA_BACKEND_URL`, `VITE_MEDUSA_PUBLISHABLE_KEY`, and `VITE_STRIPE_PUBLISHABLE_KEY` when Stripe is on.

## Medusa Package Docs (node_modules)

Published `@medusajs/*` packages ship an `AGENTS.md` at `node_modules/@medusajs/<pkg>/AGENTS.md` (added in [medusajs/medusa#17382](https://github.com/medusajs/medusa/pull/17382)). It documents the API, examples, architecture, and gotchas for the **exact installed version**. Prefer it over memory.

Older Medusa versions don't include it. If it's missing, fall back to the skills and the docs MCP server.

Find the installed ones (works with pnpm, npm, and yarn):

```bash
find node_modules apps/*/node_modules -maxdepth 6 -path "*/@medusajs/*/AGENTS.md" 2>/dev/null
```

Packages this repo depends on:

| Package | Read it for |
|---------|-------------|
| `@medusajs/framework` | API routes, middlewares, workflows-sdk, modules, data models, links, DI, `utils`/`types`/`zod` subpaths |
| `@medusajs/medusa` | Commerce modules, `core-flows`, payment-stripe provider, `medusa-config` module paths |
| `@medusajs/core-flows` | Built-in workflows and hooks (via `@medusajs/medusa/core-flows`) |
| `@medusajs/cli` | `medusa develop`, `build`, `db:*`, `user`, `exec`, `lint` |
| `@medusajs/admin-sdk` | `defineWidgetConfig`, `defineRouteConfig` |
| `@medusajs/ui`, `@medusajs/icons` | Admin components and icons |
| `@medusajs/js-sdk` | SDK used by the admin hooks and the storefront |
| `@medusajs/types` | `HttpTypes` in the storefront |
| `@medusajs/instantsearch-adapter` | Storefront search client |
| `@medusajs/draft-order` | Draft order plugin (installed, not registered in `medusa-config.ts`) |
| `@medusajs/test-utils` | `medusaIntegrationTestRunner` for integration tests |
| `@medusajs/eslint-plugin` | Lint rules enforced by `medusa lint` |

In the backend, import from `@medusajs/framework/*` subpaths (`@medusajs/framework/utils`, `/types`, `/http`, `/workflows-sdk`), not from `@medusajs/utils`, `@medusajs/types`, or `@medusajs/workflows-sdk` directly. The storefront has no `framework` dependency and uses `@medusajs/types` and `@medusajs/js-sdk`.

## Medusa Skills & MCP

Use sources in this order:

1. Package `AGENTS.md` in `node_modules` (version-exact).
2. Medusa agent skills. Claude Code: `/plugin marketplace add medusajs/medusa-agent-skills`, then `/plugin install medusa-dev@medusa` and `/plugin install ecommerce-storefront@medusa`. Other agents: `npx skills add medusajs/medusa-agent-skills`.
3. Docs MCP server or plain-text docs.

Docs MCP server:

```bash
claude mcp add --transport http medusa https://docs.medusajs.com/mcp
```

Without MCP, read https://docs.medusajs.com/llms.txt, or append `.md` to any `docs.medusajs.com` page URL.

### Medusa Cloud MCP

For projects deployed on Medusa Cloud:

```bash
claude mcp add --transport http medusa-cloud https://cloud.medusajs.com/mcp
```

It exposes deployments, build/runtime logs, environment variables, and store data. Use it to debug failed deploys and production errors.

- Never ask for, store, or handle Cloud credentials. The user authenticates the server.
- Never reveal environment variable values unless the user asks.
- Confirm with the user before any write to a live store.

## Conventions

- Mutate commerce data through workflows (custom or `@medusajs/medusa/core-flows`), not raw module service calls in routes.
- Business rules live in workflow steps (see `steps/validate-*.ts`). Routes stay thin.
- Each route folder exports its own `middlewares.ts`, spread into `src/api/middlewares.ts`. Register new ones there.
- Cart completion and checkout are gated by `requireCompanySetup`. Employee management is gated by `requireEmployeeAdmin`.
- New custom module: add it to `modules` in `medusa-config.ts`, then run `db:generate` and `db:migrate`.
- Storefront calls Medusa only through the SDK in `src/lib/utils/sdk.ts`, wrapped by `src/lib/data/*` and React Query hooks in `src/lib/hooks/*`.
- `apps/storefront/src/routeTree.gen.ts` is generated by the TanStack router plugin. Don't edit it.

## Common Mistakes

- Guessing Medusa APIs from memory when the package `AGENTS.md` or the docs MCP is available.
- Mutating commerce data (carts, orders, customers) with raw module service calls instead of `core-flows` workflows.
- Importing from `@medusajs/utils` / `@medusajs/types` in backend code instead of `@medusajs/framework/*`.
- Adding a module or model without generating and running migrations.
- Running `pnpm test` and assuming tests passed. It runs nothing.
- Using npm or yarn, or committing a new lockfile.

## Off-Limits

- `node_modules/`: read the package docs there, never edit installed packages.
- `.env` files: never commit or print secret values.
- Existing migration files in `src/modules/*/migrations/`: generate new ones instead of editing.
- `apps/storefront/src/routeTree.gen.ts`, `.medusa/`, `dist/`, `.turbo/`: generated.
