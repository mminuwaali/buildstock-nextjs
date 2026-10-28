# BuildStock

BuildStock is a frontend-only Next.js 16 PWA prototype for inventory, purchasing and sales operations at a multi-branch construction-materials business. It includes a branch-aware demo experience, local IndexedDB persistence, and simulated synchronization. It does **not** include a Django backend or production authentication, and local mock state is not shared between devices.

## Requirements

- Node.js 22 or later
- npm 10 or later

## Run locally

```bash
corepack enable  # one-time, if pnpm is not already available
pnpm install
cp .env.example .env.local
pnpm dev
```

You can also use `npm install` and the equivalent `npm run <command>` scripts if you prefer npm.

Open `http://localhost:3000`. The demo defaults to the Owner/Admin role. Use the role selector in the top bar or visit `/sign-in` to switch between demo roles. Demo data is illustrative only.

## Commands

```bash
npm run dev       # local development
npm run typecheck # TypeScript strict check
npm run lint      # ESLint
npm test          # Vitest
npm run build     # production build
```

## Core implementation

- Next.js App Router and the supplied feature-oriented `src/` conventions.
- Ant Design, Tailwind CSS v4 theme tokens, TanStack Query, Formik and Yup.
- Dexie/IndexedDB stores local products, balances, sale records, movement ledger and outbox operations.
- The local repository validates fixtures at its data boundary and uses DRF-compatible snake_case payloads and `count/next/previous/results` pagination contracts.
- A committed sale updates only the selected branch's local balance and appends a stock movement plus durable outbox operation in one IndexedDB transaction.
- The Sync Center simulates acknowledgement in this browser. It is not a shared API and cannot synchronize physically separate cashier devices. `GET /api/health` reports this mock mode explicitly.

## Demo mode and production boundary

Demo role selection and branch visibility are UI-level simulation only. They are not secure authentication or server-enforced authorization. For production, connect the feature API layer to a Django REST Framework API, enforce organization and branch scope server-side, use idempotent operation IDs and atomic sale/stock transactions, and replace simulated sync acknowledgements with server acknowledgements and a server-issued pull cursor.

Read `AGENTS.md` before modifying source. The architecture and integration notes live under `docs/`.

**Role visibility:** store-scoped roles see their assigned branch only. Cross-branch transfer management is admin-only in this prototype because a transfer contains data about two stores. A production Django API must enforce access in server-side querysets and write services; the current frontend role switcher is a demonstration, not authentication.
