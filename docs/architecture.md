# BuildStock frontend architecture

BuildStock is a **frontend-only Next.js 16 App Router PWA prototype** for a single construction-supply business with multiple physical branches. It does not include a server, Django project, PostgreSQL or a shared remote database.

## Layers

- `src/app/`: route entry points, layouts, loading/error boundaries and manifest.
- `src/features/`: business capabilities own their API facade, Yup schemas, hooks and page sections.
- `src/components/elements/`: role-based shared UI primitives (`forms`, `primary`, `secondary`).
- `src/components/providers/`: Ant Design, TanStack Query, demo auth, connectivity and local DB bootstrap.
- `src/common/`: base schemas, shared types, query hooks and query key factories.
- `src/constants/`: validated settings, routes, environment and illustrative mock data.
- `src/libraries/`: mock API adapter, IndexedDB/Dexie persistence, API transport and logging.
- `src/styles/`: global CSS, token palette, utilities, component and animation styles.
- `src/i18n/` and `src/messages/`: locale configuration and English strings.

## Data ownership

The browser's IndexedDB is the local demo repository. Yup validates seed fixtures and command payloads at boundaries. UI components call feature APIs and never reach into Dexie directly. This lets the repository adapter later be replaced with HTTP calls to Django REST Framework while keeping UI composition mostly unchanged.

## Branch scoping

Owner/Admin may view all branches. Other demo roles are tied to a single assigned branch. Feature queries must pass the current branch scope. The mock layer applies that scope to returned data as a demonstration only; a production Django API must enforce object-level/organization/branch authorization server-side on every list, detail, search, report, export and synchronization endpoint.

## Inventory and sale invariants

A committed sale stores the sale, lines, local balance changes, stock movement ledger entries, outbox operation and audit record in one Dexie transaction. Quantities are deducted from the sale's branch only. Stock movements are additive history; corrections add new movements instead of deleting historical events. A stock discrepancy never silently removes a sale.

## React and source conventions

Read `AGENTS.md`. In short: strict TypeScript; no `any`; avoid object/props destructuring; default React import and `React.use*`; normal function declarations for components; named exports except Next convention files; keep pages thin; feature-owned business logic; schema-inferred types; semantic HTML; theme tokens only; co-located tests; update docs alongside architecture changes.

## Production boundary

This prototype's demo sessions are local browser state and are not secure authentication. Sync acknowledgements are simulated in one browser profile. True device-to-device sync requires a shared backend. See `offline-sync-design.md`, `django-api-contract.md` and `migration-to-django.md`.

### Cross-branch transfer visibility

The current demo restricts the stock-transfer workspace to `owner_admin`. A transfer necessarily references a source and destination branch, so this avoids exposing another branch's identity and movement history to store-scoped roles. Future Django permissions may support explicit transfer permissions while returning only the minimum destination information needed to authorized users.
