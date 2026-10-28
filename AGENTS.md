# AGENTS.md — BuildStock Construction Inventory & Sales PWA

This file is the canonical coding and architecture reference for this repository. Read it fully before making changes. When in doubt, follow these rules over generic Next.js/React advice. Product requirements and synchronization correctness are defined in `REPLIT_MASTER_PROMPT.md` and `docs/`.

## 1. Project Identity

- **Working name:** BuildStock (renameable product label)
- **Purpose:** Offline-first inventory and sales management for one construction-supply business operating multiple stores.
- **Target platform:** Installable web PWA on laptops, desktops and tablets.
- **Frontend:** Next.js App Router, React, TypeScript.
- **Implementation scope:** Next.js frontend only. No Python/Django source, PostgreSQL, backend service, hosted database or separate API server in this phase.
- **Data mode:** Schema-validated fixture constants plus a typed, persistent browser-local mock API adapter and Dexie/IndexedDB.
- **Future target:** Django REST Framework (DRF) with PostgreSQL. The current frontend API contract must be migration-ready but is not a real backend.
- **Repository:** One Next.js project plus documentation/tests only.

## 2. Core Business Invariants

1. One organization can operate multiple stores/branches.
2. Each branch has its own stock, sales, purchases, devices and store-level reports.
3. The owner/admin can view all authorized branch data; store users can only access their assigned branch(es).
4. The mock adapter must enforce branch-scoping rules for demo behavior across list/detail/report/export/sync operations. This is not a production security boundary; the future Django API must repeat authorization server-side.
5. A sale at one branch deducts only that branch's stock. No automatic cross-store deduction or stock pooling.
6. Products are shared across the organization by default; inventory balances are branch-specific.
7. Offline sales must be durable locally and clearly marked pending until the mock adapter acknowledges them. Clearly label acknowledgement and sync as simulated in mock mode; real cross-device acknowledgement requires a shared Django API.
8. A stale offline stock snapshot must not cause the application to delete or silently rewrite a recorded sale. Preserve the sale and stock ledger, then flag any server-side negative balance/discrepancy for review.
9. Sync operations must be idempotent. A retry cannot create a duplicate sale or stock movement.
10. The optional external POS terminal module must never be required for normal sales. Never claim an electronic payment was verified without reliable provider confirmation or explicit authorized manual confirmation.

## 3. Required Tech Stack

### Frontend

- Next.js 16 App Router, React 19, TypeScript strict mode.
- Ant Design 6, Tailwind CSS 4 and CSS design tokens.
- TanStack Query 5, Formik + Yup, Axios.
- Zod environment validation, next-intl.
- Dexie.js over IndexedDB for offline structured data.
- Vitest + Testing Library; E2E coverage for critical flows.
- Sentry optional in production, never required to run locally.

### Mock API and Django migration contract

- The current build implements a Next.js-only frontend with schema-validated constants and a typed mock API adapter. Do not generate a Django/Python backend, PostgreSQL database or other API service.
- Use `src/constants/mock-data/` for initial fixtures, and validate the fixture arrays through feature Yup schemas before seeding the persistent mock store.
- Use `src/libraries/mock-api/` to simulate REST resources and state transitions. Keep it separate from feature UI and use a single transport interface so a future real HTTP transport can replace it.
- All wire-level API fields must use `snake_case` and follow DRF conventions. The standard page response is `{ count, next, previous, results }`; query params include `page` and `page_size`; general errors use `{ detail }` and validation errors use field-keyed arrays. Use UUID string identifiers, ISO 8601 timestamps, integer minor units for NGN money, explicit status strings and decimal-capable product quantities.
- List endpoints use DRF `PageNumberPagination`: `{ count, next, previous, results }`, with `page`/`page_size`; document default/max sizes. Mock errors must resemble DRF error objects (`detail` or field errors).
- Document future Django mapping in `docs/django-api-contract.md`: logical models, serializers, endpoint paths, pagination, filters, status codes, validation, branch permissions, idempotency and sync cursor. This is documentation only, not a backend implementation.
- Do not silently replace the frontend stack with a different UI library, hosted database or backend. Explain genuine frontend runtime limitations before proposing substitutions.

## 4. Frontend Architecture

The `src/` top-level layout must stay compatible with the canonical template:

```text
src/
├── app/
│   ├── (0)/
│   ├── (auth)/
│   ├── (dash)/
│   └── (routes)/
├── components/
│   ├── elements/
│   │   ├── forms/
│   │   ├── primary/
│   │   └── secondary/
│   └── providers/
├── common/
│   ├── hooks/query/
│   ├── keys/query/
│   ├── schema/
│   └── types/
├── constants/
│   ├── environment/
│   ├── routes/
│   ├── settings/
│   ├── token/
│   └── mock-data/              # Yup-validated fixture constants
├── features/
│   ├── auth/
│   ├── branches/
│   ├── devices/
│   ├── users/
│   ├── catalog/
│   ├── inventory/
│   ├── sales/
│   ├── purchases/
│   ├── suppliers/
│   ├── transfers/
│   ├── reports/
│   ├── payments/
│   ├── sync/
│   ├── audit/
│   ├── dashboard/
│   └── settings/
├── libraries/
│   ├── api/                    # transport interface and future HTTP contract
│   ├── mock-api/               # persistent DRF-like simulated API/repository
│   ├── cookie/
│   ├── logger/
│   ├── offline/
│   ├── payment-providers/
│   ├── rate-limit/
│   └── token/
├── utils/
│   ├── parser/
│   └── token/
├── styles/
│   ├── globals.style.css
│   ├── themes.style.css
│   ├── utilities.style.css
│   ├── components.style.css
│   └── animations.style.css
└── i18n/
    ├── index.ts
    ├── request.ts
    └── routing.ts
```

The frontend may live in `/frontend`; if so, the structure above remains the exact internal `frontend/src/` tree. Do not add new top-level directories inside `src/`. Add infrastructure as subdirectories inside existing directories, for example `libraries/offline`.

### Routes

- Keep `(0)`, `(auth)`, `(dash)` and `(routes)` route groups.
- `(auth)` contains sign-in, password/forgot and password/reset routes, with `layout.tsx`, `loading.tsx`, and `_sections/` page components.
- `(dash)` contains the shared authenticated shell and `_layouts/` such as header/sidebar/footer.
- The dashboard includes distinct admin and store namespaces, such as `/admin/overview`, `/admin/branches`, `/admin/users`, `/admin/reports`, `/store/overview`, `/store/pos`, `/store/sales`, `/store/inventory`, `/store/products`, `/store/purchases`, `/store/suppliers`, `/store/transfers`, `/store/reports` and `/store/sync`.
- `(routes)/api/` preserves API health/session and future proxy route structure, but mock mode must not put business logic in Next.js route handlers. Any future proxy uses an explicit DRF-route allowlist.
- Avoid duplicate route paths across route groups. Pages stay thin and compose feature hooks with `*.section.tsx` sections.

### Feature-module pattern

Each feature should own its API functions, query/mutation hooks, schemas and barrel exports:

```text
features/<feature>/
├── api/index.ts
├── hooks/index.ts or hooks/index.tsx
├── schema/index.ts
└── index.ts
```

Feature-owned components may be added where useful, but keep route-specific page sections under the relevant route's `_sections/` directory and shared primitives under `components/elements/`.

## 5. Naming and Component Conventions

- File naming: `index.tsx` for component implementations; `index.ts` for barrel exports; `*.section.tsx` for route sections; `*.layout.tsx` for layout subcomponents; `*.style.css` for CSS files.
- Components use normal `function` declarations, named exports except Next.js convention files.
- Do not destructure props or objects; use `props.value`, `authCtx.user`, `formikCtx.handleSubmit`, etc. Spread operations are allowed.
- React is default-imported as `import React from "react"`; use `React.useState`, `React.useEffect`, etc. Do not import React hooks by name.
- Non-React library hooks may use named imports.
- Sort imports by path length within these groups: framework, third-party, internal `@/*`, relative local.
- No TypeScript `any`. Infer types from Yup schemas where appropriate; don't duplicate a schema's shape manually.
- Use semantic HTML and accessible Ant Design controls; avoid unnecessary wrappers.
- Section components do not receive props. They consume feature hooks, providers and form context.
- Use `@/*` aliases for internal imports. Avoid classes in React code.

## 6. State, API and Authentication

- Use TanStack Query through shared query helpers in `common/hooks/query` where practical.
- Query keys are defined through `common/keys/query` and mutations invalidate affected keys after success.
- `QueryProvider` must create a fresh QueryClient per render via `React.useState`, not a module-level singleton.
- Feature APIs call a centralized transport in `libraries/api/client.ts`. Default `NEXT_PUBLIC_API_MODE=mock` routes requests to `libraries/mock-api/`; future `http` mode may call the DRF endpoint base only after a real backend has been supplied.
- `libraries/api/server.ts` and the `(routes)/api/` proxy structure remain future-compatible scaffolding. Do not require them for mock-mode domain operations or move business logic into Next route handlers.
- Demo authentication uses seeded mock users solely to demonstrate role-specific UI and workflows. Do not claim client-side authentication/authorization is secure. Future production auth must use server-controlled sessions/tokens, HttpOnly/Secure cookies, appropriate SameSite/CSRF protection, and server-side permissions. Do not put real refresh tokens in localStorage or IndexedDB.
- Sign-out clears the demo session without deleting pending offline sales. Simulated session expiry must preserve local pending work.
- Validate environment variables at startup with Zod and maintain `.env.example` with safe placeholders only.

## 7. Offline Data and Synchronization

- Use Dexie.js/IndexedDB via a centralized `libraries/offline` data layer. UI components must not perform scattered raw IndexedDB work.
- Keep local schema versioning/migrations and preserve pending outbox operations during upgrades.
- Write the sale, sale lines, local stock adjustment and associated outbox item in one IndexedDB transaction.
- Each operation has a stable UUID, branch/device identity and a durable pending status.
- Do not remove an outbox item until the mock adapter acknowledges processing in demo mode or an explicitly audited resolution path is recorded.
- In mock mode, process operations through the mock API adapter with per-operation acknowledgements and persist the simulated repository in IndexedDB. Explain that the simulation is local to the browser and is not true multi-device synchronization.
- Define the future HTTP contract so Django deduplicates operation IDs and returns stored results on retries; use a server-issued pull cursor, not client timestamps. Apply pull results transactionally and don't overwrite unsynced sales.
- Retry transient network errors while the app is active, including on app startup, reconnect and focus. Background Sync is opportunistic only.
- Show pending count, last sync time, oldest pending operation and understandable failure/review information.
- The product catalog/stock snapshot cached on a device must be restricted to the assigned store and required shared catalog data. Never download all branches' transactional data to a cashier device.
- Use explicit statuses such as `pending`, `syncing`, `synced`, `needs_review` and `rejected`. Don't silently swallow failures. In mock mode, `synced` means accepted by the local simulated repository only; never call it true cross-device or server sync.

## 8. DRF-Compatible Domain and API Contract (No Backend Source)

Do not implement Django apps in this project. Describe the future Django mapping in `docs/django-api-contract.md`, including logical resources for `Organization`, `Branch`, `User`, `BranchMembership`, `Device`, `Product`, `Category`, `ProductBarcode`, `InventoryBalance`, append-only `StockMovement`, `Supplier`, `Purchase`, `PurchaseItem`, `Sale`, `SaleItem`, `Payment`, returns, transfers, `SyncOperation` and `AuditEvent`.

- All wire fields use `snake_case`, IDs are UUID strings, timestamps are ISO 8601 and money uses integer minor units (NGN kobo). Quantities support decimals where unit of measure requires them.
- Every list endpoint follows DRF `PageNumberPagination` response shape `{ count, next, previous, results }` and supports `page`/`page_size` plus documented resource-appropriate filters.
- Mock API errors follow DRF shapes: `{ detail: string }` for general errors and `{ field_name: [messages] }` for validation errors.
- The mock adapter must scope store records using the mock session's role and store assignment. This only simulates the intended behavior; future Django querysets, permissions and bulk-sync services must independently enforce branch isolation.
- Document future service functions such as `complete_sale`, `receive_purchase`, `adjust_stock`, `process_sync_operation` and `record_return`; do not create these in Python now.
- Stock movement records are append-only. Corrections create reversing/corrective movements. Sales retain price/quantity/unit/product label snapshots.
- The future Django implementation must enforce idempotency constraints and atomic sale/line/payment/stock writes at the database level. IndexedDB mocks cannot provide this guarantee across physical devices.
- The future backend must audit manual payment confirmation, returns, voids, inventory adjustments, permission changes and branch assignments.
- Never log passwords, tokens, payment secrets or other sensitive values, including in mock-mode diagnostics.

## 9. Optional Terminal Integration

- Core checkout must work without a connected terminal.
- Record external POS/card references manually in the first release, clearly distinguishing manual confirmation from provider-verified payment.
- `libraries/payment-providers` defines typed adapter contracts only until a provider is selected and approved. Do not fake a live terminal integration.
- Never match a payment automatically by amount alone. Use a sale/payment reference and provider transaction/event identity.
- Validate provider notifications and make callback processing idempotent before marking payments confirmed.

## 10. Styling and Design Tokens

Set tokens in `styles/themes.style.css` and use them instead of hard-coded colors:

```css
:root {
  --color-brand-950: #14283f;
  --color-brand-800: #1f3a5f;
  --color-brand-600: #315b86;
  --color-brand-100: #e8eff6;
  --color-accent-600: #d97724;
  --color-accent-100: #fff0df;
  --color-success-700: #247447;
  --color-success-100: #e7f5ec;
  --color-warning-700: #a85a08;
  --color-warning-100: #fff3d6;
  --color-danger-700: #b42318;
  --color-danger-100: #fdeae8;
  --color-background: #f4f6f8;
  --color-surface: #ffffff;
  --color-surface-muted: #eef1f4;
  --color-text-primary: #17212f;
  --color-text-secondary: #586779;
  --color-border: #d7dee7;
}
```

Use blueprint navy for structure, concrete-neutral surfaces and safety orange sparingly for important actions. All status signals require text/icon as well as color. Maintain accessible contrast, visible focus and responsive POS layouts. Avoid unthemed colors, arbitrary Tailwind values, heavy gradients, decorative clutter and generic dashboard styling.

## 11. Testing and Quality Gates

- Co-locate frontend tests as `test.ts` / `test.tsx`.
- Use Vitest + Testing Library; use accessibility assertions where practical.
- Mock external services in unit tests; don't hit a real backend in unit tests.
- Add frontend integration/e2e tests for demo sign-in, store isolation in the mock adapter, online/offline sale persistence, simulated sync, pagination, DRF-shaped validation errors and duplicate-operation retry.
- Run lint, TypeScript checking, frontend tests and production build after meaningful changes. Do not report Django tests/migrations as run or implemented.
- Never suppress a failure just to get a green build. Explain platform blockers clearly.

## 12. Error Handling, Security and Operations

- Provide a global error boundary, global critical fallback, not-found UI and shared API error parser matching Django/DRF error shapes.
- Use user-friendly errors with redacted structured logs. No silent failures outside documented patterns.
- Configure appropriate Next.js response headers where supported and validate environment variables. Document server-side rate limiting, secrets management and API health as future Django/proxy requirements; do not claim they are implemented by mock mode.
- PWA/browser storage is not a backup. Document future server backup/restore requirements, unsynced-data limits and device-loss scenarios.
- Seed fixtures from schema-validated constants only in mock mode; initialization must not overwrite existing user changes on every startup.
- Keep README and `docs/` synchronized with architecture changes. Maintain documentation for data model, synchronization, security, deployment, terminal integration and test commands.

## 13. Anti-Patterns

Never:

1. Use TypeScript `any`.
2. Create module-level QueryClient singletons.
3. Destructure props/objects.
4. Use arrow functions for React components.
5. Use default exports for ordinary components.
6. Put business logic in App Router page files.
7. Add arbitrary Tailwind values or hard-coded non-theme colors.
8. Trust branch IDs or roles sent by the browser.
9. Deduct stock from another store.
10. Treat amount-only matching as reliable payment confirmation.
11. Remove outbox records before mock/API acknowledgement.
12. Use last-write-wins for inventory balances or overwrite the stock ledger.
13. Claim background sync is guaranteed when the browser is closed.
14. Present mock-only behavior as production functionality or claim mock sync works across physical devices.
15. Create Django/Python backend files, PostgreSQL setup or another server service in this phase.
16. Change the frontend stack/tree without explaining a genuine platform constraint.
17. Skip tests for new features.

Any change to these conventions or the architecture must be documented in the same change. Keep `AGENTS.md` and `docs/` in sync with the frontend implementation and future Django contract.
