<p align="center">
  <a href="https://www.medusajs.com">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/59018053/229103275-b5e482bb-4601-46e6-8142-244f531cebdb.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    <img alt="Medusa logo" src="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    </picture>
  </a>
</p>
<h1 align="center">
  Industrials B2B Starter
</h1>

<h4 align="center">
  <a href="https://docs.medusajs.com">Documentation</a> |
  <a href="https://www.medusajs.com">Website</a>
</h4>

<p align="center">
  Building blocks for digital commerce
</p>
<p align="center">
  <a href="https://github.com/medusajs/medusa/blob/develop/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="Medusa is released under the MIT license." />
  </a>
  <a href="https://circleci.com/gh/medusajs/medusa">
    <img src="https://circleci.com/gh/medusajs/medusa.svg?style=shield" alt="Current CircleCI build status." />
  </a>
  <a href="https://github.com/medusajs/medusa/blob/develop/CONTRIBUTING.md">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat" alt="PRs welcome!" />
  </a>
    <a href="https://www.producthunt.com/posts/medusa"><img src="https://img.shields.io/badge/Product%20Hunt-%231%20Product%20of%20the%20Day-%23DA552E" alt="Product Hunt"></a>
  <a href="https://discord.gg/xpCwq3Kfn8">
    <img src="https://img.shields.io/badge/chat-on%20discord-7289DA.svg" alt="Discord Chat" />
  </a>
  <a href="https://twitter.com/intent/follow?screen_name=medusajs">
    <img src="https://img.shields.io/twitter/follow/medusajs.svg?label=Follow%20@medusajs" alt="Follow @medusajs" />
  </a>
</p>

A ready-to-launch B2B store for industrial equipment and parts, built with Medusa. It pairs a Medusa backend, seeded with a catalog of forklift parts, safety gear, and warehouse equipment, with a TanStack Start storefront for business buyers.

## Features

- Company accounts with employee invites and spending limits
- Quote requests that merchants review and respond to from the Medusa Admin
- Company and quote management in the Medusa Admin
- Product search, quick reorder, and order history
- Cart and checkout with optional Stripe or Adyen payments
- Order confirmation emails
- Demo data seeded automatically on the first migration

## Prerequisites

- [Node.js](https://nodejs.org/) v22.22+
- [pnpm](https://pnpm.io/) v10+
- [PostgreSQL](https://www.postgresql.org/)
- [Redis](https://redis.io/)

## Installation

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/medusajs/industrials-b2b-starter.git
   cd industrials-b2b-starter
   pnpm install
   ```

2. Copy `apps/backend/.env.template` to `apps/backend/.env` and set the [backend environment variables](#backend).

3. Run the migrations. This also seeds the demo store data:

   ```bash
   cd apps/backend
   npx medusa db:migrate
   ```

4. Create an admin user:

   ```bash
   npx medusa user -e admin@example.com -p supersecret
   ```

5. Copy `apps/storefront/.env.example` to `apps/storefront/.env` and set the [storefront environment variables](#storefront). You can find the publishable API key in the Medusa Admin under **Settings → Publishable API Keys**.

## Usage

Start the backend and storefront together from the repository root:

```bash
pnpm dev
```

The Medusa Admin runs at `http://localhost:9000/app`. To run only one app, use `pnpm backend:dev` or `pnpm storefront:dev`.

## Project Structure

```
apps/
├── backend/      # Medusa server, admin extensions, company and quote modules
│   ├── medusa-config.ts
│   ├── integration-tests/
│   └── src/      # api, workflows, modules, links, admin, migration-scripts
└── storefront/   # TanStack Start storefront (Vite, Tailwind)
    └── src/      # routes, pages, components, lib/data
```

The repo is a pnpm workspace orchestrated by [Turborepo](https://turborepo.com).

## Configuration

### Backend

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection URL |
| `REDIS_URL` | Redis connection URL |
| `STORE_CORS` | Allowed origins for the storefront |
| `ADMIN_CORS` | Allowed origins for the Medusa Admin |
| `AUTH_CORS` | Allowed origins for authentication routes |
| `JWT_SECRET` | Secret used to sign JWTs |
| `COOKIE_SECRET` | Secret used to sign cookies |
| `STRIPE_API_KEY` | Stripe secret key. Enables Stripe payments when set |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `ADYEN_API_KEY` | Adyen API key. Enables Adyen payments when set, used for company payment methods unless Stripe is set |
| `ADYEN_MERCHANT_ACCOUNT` | Adyen merchant account |
| `ADYEN_HMAC_KEY` | HMAC key of the Adyen standard webhook, pointed to `{backend_url}/hooks/payment/adyen_adyen` |
| `ADYEN_ENVIRONMENT` | Adyen environment, `TEST` or `LIVE` |
| `ADYEN_LIVE_ENDPOINT_URL_PREFIX` | Adyen live endpoint prefix, required in `LIVE` |
| `SKIP_INITIAL_SEED` | Set to `true` to skip seeding the demo data |

### Storefront

| Variable | Description |
|----------|-------------|
| `VITE_MEDUSA_BACKEND_URL` | URL of the Medusa backend |
| `VITE_MEDUSA_PUBLISHABLE_KEY` | Publishable API key of the store's sales channel |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key, required when Stripe is enabled |
| `VITE_ADYEN_CLIENT_KEY` | Adyen client key, required when Adyen is enabled |
| `VITE_ADYEN_ENVIRONMENT` | Adyen environment, `test` or `live` |

## Building with AI Agents

- [`AGENTS.md`](./AGENTS.md) maps common tasks to paths in this repo, lists the real commands, and covers conventions for AI coding agents.
- Installed `@medusajs/*` packages may ship version-specific docs at `node_modules/@medusajs/<pkg>/AGENTS.md`. Agents should read those before using a package.
- [Medusa agent skills](https://docs.medusajs.com/learn/introduction/build-with-llms-ai/agentic-skills) add Medusa backend, admin, and storefront know-how to Claude Code and other agents.
- Connect the Medusa docs MCP server:

  ```bash
  claude mcp add --transport http medusa https://docs.medusajs.com/mcp
  ```

- If you deploy on Medusa Cloud, connect the Cloud MCP server to inspect deployments, logs, and environment variables:

  ```bash
  claude mcp add --transport http medusa-cloud https://cloud.medusajs.com/mcp
  ```

## Resources

- [Medusa Documentation](https://docs.medusajs.com)
- [Storefront Development](https://docs.medusajs.com/resources/storefront-development)
- [Deploy to Medusa Cloud](https://docs.medusajs.com/cloud)
- [Build with LLMs and AI](https://docs.medusajs.com/learn/introduction/build-with-llms-ai)
- [Medusa docs for LLMs (llms.txt)](https://docs.medusajs.com/llms.txt)

