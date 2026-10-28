# MASTER BUILD PROMPT — BuildStock

> **How to use:** Upload the companion `AGENTS.md` into the project root alongside this prompt, then paste this entire document into Replit Agent. Use Replit's strongest/Power mode, turn on App Testing and Code Optimizations if available, and review the proposed implementation plan before starting the build. Keep the `AGENTS.md` in the repository so later agent sessions continue following the same conventions.

## 1. Your role and objective

Act as a senior frontend architect, UX/UI designer, TypeScript engineer, test engineer, and technical writer. Build **BuildStock**, a polished, functional Next.js 16 offline-first inventory and sales management PWA for one construction-supply business operating multiple physical stores with multiple cashier devices.

**Hard scope boundary: build the Next.js project only. Do not create a Django/Python backend, PostgreSQL database, separate API service, Dockerized backend, or other server project.** For now, implement a well-structured mock API/data layer using schema-validated constants and persistent browser storage. The mock API must follow Django REST Framework conventions closely enough that it can later be replaced with a real Django REST Framework backend without rewriting feature UI and business workflows.

The deliverable must include an excellent responsive interface, working inventory/sales workflows, role-based demo experiences, a local-first POS flow, IndexedDB persistence, an outbox and simulated sync flow, admin/store views, realistic construction-product fixtures, tests, and setup/migration documentation. Be completely honest in the UI and documentation: mock mode is a frontend prototype and cannot synchronize data between separate physical devices or provide production-grade authentication/security without a real shared backend.

Do not respond with only a plan or mockups. First inspect `AGENTS.md` and this prompt, confirm the frontend-only architecture and implementation plan, then build incrementally, run the project, test important journeys, fix discovered issues, and document what is actually working. Do not claim a feature is complete unless code and tests support that claim.

## 2. Product context and non-negotiable business rules

### Business model

- The product serves **one business/organization** with multiple physical stores/branches.
- Each branch has its own physical stock, sales, receiving records, inventory movements, devices, and store-level reports.
- The product catalog is shared across the organization by default. Stock quantities are always branch-specific. Keep product prices shared by default; do not add complex branch price books unless they are needed for a coherent implementation. Design the model so branch-specific pricing can be added later without a migration disaster.
- A central **Owner/Admin** can view and manage all branches and consolidated reports.
- Store users can see only their assigned store(s). Do not leak other branches' products where branch restrictions apply, inventory, sales, purchases, devices, staff or reports. The mock data layer and UI must honor this for the demo; the future Django API must enforce it server-side in production.
- A cashier transaction deducts stock only from the store where the product is physically held and sold. A sale at Store A must never deduct stock from Store B.
- Cashiers sell products physically available in their store. The business accepts that staff and physical stock constrain what can be handed over. Do not build device-level stock allocations or distributed locks as an MVP requirement. Offline snapshots can be stale; if synchronization reveals a negative balance or physical-count discrepancy, preserve the real recorded sale and flag the discrepancy for the store manager/admin to resolve. Do not silently erase transactions or overwrite the ledger to hide differences.
- In mock mode, a persistent browser-local mock repository simulates the central API for development only; it is not a shared server and is not authoritative across separate devices. The future Django service will be authoritative for consolidated records and final branch stock state. A device can record an offline sale immediately in its own local database, but it must show that the sale is pending synchronization until acknowledged by the mock API in demo mode. Clearly label this as simulated acknowledgement; real multi-device acknowledgement requires the future shared API.
- This is an offline-first PWA. The cashier must be able to open the previously installed/cached application, search cached products, complete a supported sale and retain the transaction while the internet is unavailable. The app must not pretend that pending sales are already mock-repository-confirmed.
- Offline operation is for a previously authenticated and registered device. Initial login, user creation, role changes, catalog administration, product pricing changes, branch management and other privileged administration require a connection in the MVP. Do not invent a secure offline login flow.

### POS terminal integration is optional

- External payment-terminal integration is an optional module, not a dependency for core inventory or checkout.
- The initial release must support recording payment methods such as cash, bank transfer and external card/POS payment. For a non-integrated physical terminal, let the cashier enter a transaction reference and record whether the payment is manually confirmed or awaiting verification.
- Create a clean provider-adapter boundary for future terminal providers. Do not fake a terminal connection, simulate successful payments in production, or claim a provider is supported without checking its current official API, terminal eligibility and account permissions.
- A later provider integration may create a payment request, receive a signed/verified callback or poll for status, and match a confirmed transaction to a sale using stable IDs/references. Do not match automatically by amount alone.
- Payment and sale status must be distinct. A sale may exist while its electronic payment is pending verification. Never mark a payment successful only because the client says it succeeded.

## 3. Required technology and architecture

Follow `AGENTS.md` as the canonical convention document. Do not casually substitute tools or flatten the architecture for convenience.

### Frontend-only build (mandatory)

- Next.js 16 App Router, React 19, TypeScript strict mode.
- Ant Design 6 for application components and interaction patterns.
- Tailwind CSS 4 for layout and utilities, driven by CSS design tokens. Avoid arbitrary Tailwind values.
- TanStack Query 5 for query state, invalidation, loading and mutation workflows.
- Formik + Yup for forms and domain/API schemas.
- Axios for the feature API transport layer.
- Zod for environment validation; Yup schemas for domain models, request payloads and API response shapes.
- next-intl for localization structure; English is the initial locale.
- Dexie.js over IndexedDB for persistent local catalog, inventory snapshots, sales, sale lines, local payments, device metadata, sync outbox and mock-server fixture state.
- Vitest + Testing Library and suitable browser/E2E coverage.
- Sentry may be configured for production monitoring but must not be required to run the demo.
- Preserve all supplied React import, named export, no-destructuring, normal-function component, import ordering, semantic JSX, feature module and co-located test conventions.

### Mock API: constants + schema, designed for a future Django REST Framework backend

- The default and only implemented data mode is `mock`. Implement the mock API inside the Next.js project; do not build another server.
- Keep seed records in `src/constants/mock-data/`. They must cover multiple branches, demo users/roles, products, inventory balances/movements, suppliers, purchases, sales, sale items, payment records, devices, transfers and audit events as appropriate.
- Validate fixture sets using the relevant Yup schemas at the mock data boundary. Prefer schema-inferred types; do not maintain duplicate handwritten TypeScript interfaces for the same payload.
- Put reusable API contracts in `src/common/schema/` (including a DRF-style paginated response schema and DRF-style error schema) and domain/request/response schemas in each feature's `schema/index.ts`.
- Keep feature API functions in `features/<feature>/api/index.ts`. UI and hooks must call these feature API functions rather than importing fixture constants or mutating the mock store directly.
- Implement `src/libraries/mock-api/` as a typed mock transport/repository. It must support realistic list/detail/create/update/action behavior and persist mutable demo state in IndexedDB so refreshes do not reset every transaction. Keep mock-server state conceptually separate from the cashier's local cache and outbox.
- Keep a single transport interface under `src/libraries/api/`. In `mock` mode, route calls to the mock adapter. Leave a clearly documented future `http` mode contract for a real Django API, but do not pretend that mode works without a configured backend.
- Do not use Supabase, Firebase, Replit Database, a hosted database, Next.js route handlers as a business-logic backend, or another API service. The requested implementation is the Next.js project plus local mock data only.

### Django REST Framework compatibility contract

The mock API must mirror a conventional DRF resource API so the frontend can later switch transports with minimal feature-level changes:

- Use resource-oriented endpoints with trailing slashes, e.g. `/api/branches/`, `/api/products/`, `/api/inventory-balances/`, `/api/sales/`, `/api/purchases/`, `/api/sync/push/` and `/api/sync/pull/`.
- Use `snake_case` for JSON wire fields to match typical Django serializer output, including `branch_id`, `created_at`, `updated_at`, `unit_price_minor`, `operation_id`, and `sync_status`.
- Use UUID strings for entity IDs and operation IDs, ISO 8601 timestamps for date-time fields, explicit enumerated status values, and integer minor units for NGN money values (kobo). Quantity may be fractional where a product's unit requires it.
- Paginated list responses must match DRF `PageNumberPagination`: `{ "count": number, "next": string | null, "previous": string | null, "results": [] }`.
- Use standard query parameters such as `page`, `page_size`, `search`, `ordering`, `branch_id`, `status`, and documented date-range filters. Define a default page size and maximum page size in constants/docs.
- Use normal HTTP status semantics in the mock transport: 200 for successful reads/updates, 201 for creation, 204 only when there is no response body, 400 for validation, 401 for unauthenticated, 403 for forbidden, 404 for missing records and 409 for an explicit conflict where appropriate. Ensure the Axios transport converts these mock outcomes into normal resolved/rejected Axios responses so the feature code behaves the same in eventual HTTP mode.
- Error bodies should follow DRF-like patterns: `{ "detail": "..." }` for general errors and `{ "field_name": ["...", "..."] }` for field validation errors. Validate these with shared schemas and parse them through `utils/parser`.
- Define request schemas, response schemas, list pagination schemas, and common model metadata in Yup. Do not let components depend on fixture-specific shapes.
- Document the future Django model/serializer/viewset/service mapping and endpoint contract in `docs/django-api-contract.md`. This is a migration guide only; do not generate Python source, migrations, Django apps or PostgreSQL configuration.

### Local-first data and simulated synchronization

- Use Dexie.js/IndexedDB for local-first cashier data and schema migrations. Use a service-worker/PWA solution compatible with the selected Next.js version; check current compatibility before installing packages.
- The cashier UI reads through centralized local repositories, not scattered raw IndexedDB calls. Seed fixture constants are initialized into the mock repository once, validated at the data boundary, and not re-applied on every page load.
- Persist each local sale, its lines, payment record(s), local branch-stock adjustment and outbox operation within one IndexedDB transaction.
- In mock mode, simulate an API round trip against a mock repository and keep the mock remote state persistent in this browser. Respect browser connectivity and include an obvious developer/demo control for simulating offline/online behavior if true disconnection is awkward to demonstrate.
- Make the limitation explicit: browser-local mock state is not shared across physical devices or separate browser profiles. The UI may demonstrate the queue and acknowledgement state, but must not claim to provide real multi-device sync in mock mode.
- The future HTTP/Django contract must use idempotent sync operations, per-operation acknowledgements and a deterministic mock cursor in demo mode (future server-issued cursor). Keep these interfaces defined now so the real backend can implement them later.
- Cache only the active store's transactional data plus the permitted shared product catalog. Keep the admin demo experience separate from the data shown to store roles.
- Avoid a module-level TanStack QueryClient singleton; providers must be SSR-safe per `AGENTS.md`.

## 4. Required visual direction and palette

Design the product as **serious construction-supply retail software**: dependable, organized, practical and high-signal. It should feel like a well-designed operations platform, not a generic AI-generated admin template. Make POS tasks fast and legible under shop-floor conditions, including on a laptop or tablet. Use a stable application shell with a sidebar, a compact top bar, branch label, online/offline/sync status and user menu.

### Color palette (define these as CSS custom properties in `src/styles/themes.style.css`)

| Token                    | Hex       | Purpose                                                                       |
| ------------------------ | --------- | ----------------------------------------------------------------------------- |
| `--color-brand-950`      | `#14283F` | Deep blueprint navy; primary navigation and strong text                       |
| `--color-brand-800`      | `#1F3A5F` | Primary brand, buttons, selected navigation                                   |
| `--color-brand-600`      | `#315B86` | Secondary brand interactions and links                                        |
| `--color-brand-100`      | `#E8EFF6` | Soft blue selection/background                                                |
| `--color-accent-600`     | `#D97724` | Construction/safety orange; primary highlights and key actions used sparingly |
| `--color-accent-100`     | `#FFF0DF` | Soft orange emphasis and warning-adjacent surfaces                            |
| `--color-success-700`    | `#247447` | Confirmed, synced, paid and healthy states                                    |
| `--color-success-100`    | `#E7F5EC` | Soft success surfaces                                                         |
| `--color-warning-700`    | `#A85A08` | Stale stock, pending sync, low stock and review-needed states                 |
| `--color-warning-100`    | `#FFF3D6` | Warning surfaces                                                              |
| `--color-danger-700`     | `#B42318` | Failed, rejected, voided or high-risk state                                   |
| `--color-danger-100`     | `#FDEAE8` | Error surfaces                                                                |
| `--color-background`     | `#F4F6F8` | App background, reminiscent of concrete/industrial surfaces                   |
| `--color-surface`        | `#FFFFFF` | Cards, tables, dialogs and inputs                                             |
| `--color-surface-muted`  | `#EEF1F4` | Secondary panels, table headers and quiet fills                               |
| `--color-text-primary`   | `#17212F` | Primary text                                                                  |
| `--color-text-secondary` | `#586779` | Secondary text and metadata                                                   |
| `--color-border`         | `#D7DEE7` | Borders and dividers                                                          |

Use brand navy for structure, white/soft concrete for surfaces and safety orange as a deliberate accent—not as a color on every button. Statuses must always include text/icon, not color alone. Check contrast and keyboard focus. Avoid gradient-heavy dashboards, glassmorphism, excessive shadows, oversized marketing headings, random emoji and meaningless decoration. Use a consistent icon set (prefer Ant Design icons or a single established icon family).

### UX and interaction expectations

- Desktop/tablet-first, responsive down to mobile. POS should remain usable on common tablet widths.
- Clear typographic hierarchy, consistent spacing, compact but readable data tables, meaningful empty/loading/error states.
- Use real actions: search, filters, pagination, forms, validation, table row actions, modal confirmation for destructive operations and feedback after saves.
- Fast POS flow: persistent search/barcode input, product results, cart lines, quantity adjustment, subtotal/discount/total, payment selection, amount tendered/change when relevant, complete-sale action and receipt.
- Provide keyboard-friendly focus, Enter/Escape behavior where appropriate, proper labels, accessible dialogs and table semantics.
- Show branch identity and network/sync state consistently. Use explicit labels such as `Online`, `Offline`, `Syncing`, `Pending sync`, `Needs review`, and `Last synced …`.
- Distinguish mock-repository-confirmed totals from local/pending totals in reports. If offline, label any locally calculated numbers as provisional.

## 5. Required feature scope

Implement a complete, coherent frontend prototype with working routes and persistent browser-side mock state. Do not create superficial pages whose buttons do nothing. Clearly document which capabilities are simulated until a real Django backend is connected.

### A. Authentication and organization access

- Sign in, sign out, password reset flow and current-user profile/session handling.
- Implement clearly labeled demo authentication using seeded demo users/roles and a mock session. This is for UI/workflow demonstration only, not production security. Keep the future DRF auth request/response contract documented. Never claim client-side role guards are a security boundary.
- Roles: `owner_admin`, `store_manager`, `cashier`, `inventory_officer`, and `auditor` (read-only). Keep permissions explicit and centralized.
- A user may be assigned to one or more branches only if permitted by their role. The normal store-user experience has one active branch. Never trust a branch ID supplied by the client in the mock adapter without checking the current demo user/role. Document that the actual security boundary must be enforced by Django when connected.
- Provide a clear unauthorized/forbidden state; don't merely hide menus.
- Provide visible demo account options or development-only demo credentials in the README. Clearly label these as mock accounts; no permanent production credential or secure auth is being implemented in this frontend-only phase.

### B. Branches and user/device management

- Admin-only branch creation, editing, activation/deactivation and branch detail.
- User management and branch assignment for authorized admins/managers.
- Register each browser/device with a stable device UUID, branch assignment, friendly name, last-seen time and active/revoked status.
- In the mock demo, device revocation changes simulated permissions and prevents further mock sync; pending local records should remain visible locally and be clearly marked as not uploaded. Never silently claim those records reached the server.
- Admin can view all branches and all devices; a store manager sees authorized devices for their branch only.

### C. Product catalog for construction materials

- Products, categories, SKU, barcode (optional), product name, description, unit of measure, purchase cost, selling price, reorder threshold, active status, and optional supplier references.
- Example categories: cement, blocks, rebar/steel, sand/aggregates, roofing, timber, plumbing, electrical, paint, tiles, tools, fasteners and general building materials.
- Units should be configurable and may include bag, piece, length/bar, kg, tonne, cubic metre, litre, roll, box, pallet and unit. Quantity must support decimal values for products sold by weight/volume; do not force all quantities into integers.
- Search by name, SKU or barcode. Support a keyboard-wedge USB barcode scanner as a text input where possible; don't claim support for proprietary hardware without testing it.
- Shared catalog, branch-specific stock. Cache the catalog and stock snapshot for the assigned branch only. Catalog/pricing administration is online-only within the modeled workflow; in mock mode, treat a simulated offline state as a reason to disable these actions.

### D. Inventory

- Branch stock overview with on-hand quantity, unit, reorder threshold, stock value when cost is known, recent movement and low-stock status.
- Append-only `StockMovement` ledger covering initial stock, purchase receipt, sale, return, adjustment and transfer dispatch/receipt.
- Keep a balance table/record for quick reads, but every change must have a corresponding movement with source type, source ID, branch, product, quantity delta, timestamp, actor/device and idempotency/source reference.
- Manual adjustment requires reason and audit record. Never delete/overwrite ledger history to correct mistakes; create a reversing/corrective movement.
- Purchase receiving updates only the receiving branch. A transfer must be represented by explicit source and destination operations; do not pretend a transfer is one instantaneous mutation while one side is offline.
- For MVP, product master-data changes, new purchases and transfers can require internet unless offline support is explicitly extended later. The central POS sale is the critical offline operation.

### E. Point of sale and sales history

- Search/select product, add to cart, change quantities, remove items, apply permission-controlled discount if supported, calculate totals using a consistent money representation, record payment method and complete sale.
- Snapshot unit price, discounts, tax (only if configured), unit of measure, product display name and quantity on the sale line so future catalog edits never mutate historical receipts.
- Support cash, bank transfer, card/external POS and optionally split payments if implemented without weakening payment correctness. Do not invent local tax rates; make tax configurable and disabled/zero unless the business supplies a rate.
- Cash payment calculates tendered amount and change. Receipt includes sale number/ID, branch, cashier, date/time, line items, quantity/unit, unit prices, discounts, total, payment records and sync status.
- Sales list with date range, payment method, cashier, status and branch filters within the user's authorized scope. Provide sale detail, reprint view, and audited void/return workflows.
- Offline checkout writes the sale, sale lines, payment intent/records and one outbox operation atomically to IndexedDB. It immediately deducts stock from this device's local branch snapshot. It is marked pending until mock-API acknowledgement in demo mode. Explain that this is simulated, not cross-device synchronization.
- A completed sale must not be lost if the page reloads, tab closes or connection drops after the local transaction commits.

### F. Purchases and suppliers

- Supplier records, purchase order/receiving workflow sized for the MVP, purchase line items, cost snapshots and receiving branch.
- Receiving stock produces inventory movements. Keep supplier balances/accounting out of scope unless clearly requested.

### G. Reporting

- Store dashboard: today's sales, number of transactions, payment-method totals, low-stock products, recent sales and sync health for the assigned store.
- Admin dashboard: consolidated totals and branch comparison, with ability to filter by branch and date. Admin figures in mock mode must distinguish the simulated mock repository from locally pending transactions. Never label browser-local mock figures as live, centrally confirmed data.
- Reports for daily/weekly/monthly sales, product sales, stock on hand, low stock, movement history and purchases. Export CSV if practical; exports must use the same server authorization filters as the view.
- Only show profit/margin when the purchase cost model supports a truthful calculation. Label any approximate calculation clearly. Make mock/demo data status visible in the UI or app information area so users do not mistake it for live business data.

### H. Sync center and offline visibility

- Visible sync indicator in the global app shell and on sale records.
- A local durable outbox with operation UUID, operation type, local entity ID, branch ID, device ID, creation time, attempt count, last error, state and payload/version information.
- States at minimum: `pending`, `syncing`, `synced`, `needs_review`. A terminal failure must remain recoverable and visible; don't delete the row just because it failed.
- Retry transient errors with bounded exponential backoff and jitter while the app is running. Also retry on app start, reconnect and window focus. Treat Background Sync as an enhancement only; do not depend on it to guarantee execution when the browser is closed.
- Show pending count, oldest pending item, last successful sync, last error and actions to retry or inspect. Avoid a destructive “clear queue” button.
- Define and simulate a cursor-based pull for downloading mock repository updates; document that only a shared server can provide real cross-device change cursors. Don't use client timestamps as the sole synchronization cursor.
- On sign-out or session expiry, preserve pending local sales. Require reauthentication before upload when necessary; never discard transactions because credentials expire.

### I. Optional payment terminal integration boundary

- Model provider, terminal, store assignment, provider transaction reference, linked sale, amount, payment method, status (`pending`, `confirmed`, `failed`, `reversed`, `needs_review`), timestamps and verification/audit metadata.
- MVP: manual external-terminal reference capture and payment confirmation controls protected by permissions; clearly distinguish manual confirmation from provider-verified confirmation.
- Build a typed provider interface and a disabled/unconfigured adapter placeholder for future providers. Do not connect live payment endpoints, invent API payloads, store PAN/card security data, or claim support without client/provider credentials and current official documentation.
- Keep payment reconciliation auditable and idempotent. Provider callback processing, once implemented, must verify signatures or use provider-side verification and must deduplicate provider event IDs/transaction references.

## 6. Local-first protocol and simulated synchronization

Implement operation-based synchronization as a realistic frontend simulation and define the matching future Django contract. Do not imply that IndexedDB in one browser is a shared server or that this phase provides true synchronization across physical devices.

### Local write path

1. Generate stable UUIDs for the sale and its sync operation before saving.
2. In one Dexie/IndexedDB transaction, persist the sale, sale lines, local stock movement/balance update, payment record(s), and outbox operation.
3. Immediately update the POS from local state. A completed cash sale can be recorded offline using the last downloaded/cached store catalog and branch stock snapshot.
4. Mark the sale `pending` until the mock API acknowledges it. Use clear text/icon status and distinguish local completion from remote confirmation.
5. Never remove an outbox item until the mock adapter has acknowledged it or a clearly audited user resolution is recorded.

### Mock API write path (simulates the future DRF behavior)

1. Resolve the current demo user, role, branch assignment and registered device from the mock session/state; never trust a caller-supplied branch ID without checking it.
2. Validate the operation and sale payload against the Yup request schema.
3. Deduplicate by stable `operation_id`: a retry must return the previous outcome instead of creating a duplicate sale or movement.
4. Apply the mock sale, sale lines, payments and stock movements inside a Dexie transaction in the simulated repository.
5. Apply stock changes only to the sale's branch. A Store A sale must never change Store B stock.
6. If a stale offline snapshot causes a negative mock balance or a physical count differs, preserve the sale and create a `needs_review` reconciliation item; never silently erase the sale or rewrite the movement ledger.
7. Return per-operation outcomes such as `accepted`, `already_processed`, `needs_review` or `rejected`, with safe reasons.

This simulates a server contract inside one browser profile. It does **not** provide PostgreSQL transactions, cross-browser/device idempotency, shared event delivery or distributed concurrency guarantees. Document the real Django implementation requirements instead of claiming these guarantees already exist.

### Pull path

- Define a monotonic mock cursor (for example, a persisted sequence number) for mock repository changes; do not use the device's wall clock as the cursor.
- Pull only the active store's transactional data plus allowed shared product catalog records. Admin demo views may aggregate all fixtures; store roles must not receive another branch's data through the mock API.
- Apply pull results and persist the cursor in one IndexedDB transaction.
- Never overwrite or delete unsynced local sales when applying pulled data.
- In future HTTP mode, Django will issue and validate the real cursor, scope results to authorized branches and deduplicate operations across devices.

### Required mock-sync tests

- An offline sale survives refresh, browser close/reopen and an IndexedDB schema upgrade.
- Reconnecting processes a pending operation once within the same browser profile.
- Simulate a mock operation being committed but its acknowledgement being lost; retry does not duplicate the sale.
- A batch that fails partway keeps unacknowledged operations queued.
- Store A's sync cannot read or mutate Store B records through supported mock API calls or guessed IDs.
- A stale stock discrepancy creates a visible review item without deleting transaction history.
- Mock acknowledgements are never described as real server-confirmed, cross-device sync.

### Offline limitations shown in product documentation

- A previously loaded PWA can serve cached application assets, and IndexedDB can retain local transactions. Neither feature makes browser data available on another device.
- Browser storage may be cleared or evicted. Local persistence is not a backup.
- Background Sync is opportunistic; sync retries must also run on app start, reconnect and window focus while the app is open.
- Initial demo sign-in and privileged admin workflows may be disabled while the simulated connection is offline. Do not claim secure offline authentication.

## 7. Security boundaries and data integrity

This is a frontend-only mock build. Its guards are for demonstrating expected user journeys, not for protecting a real business. Make that limitation explicit in the README and app information area.

- Centralize demo-role and branch-scope checks in the mock adapter; do not scatter ad hoc filtering across UI components. Store roles see their assigned store only; the demo owner/admin sees all stores.
- Never rely on frontend route guards as production security. The future Django backend must independently enforce authorization on every queryset, detail route, report, export, mutation and sync operation.
- Use a clearly labeled seeded mock authentication flow. Do not claim that a client-side mock session, cookie, role selector or local token is production-secure. Do not store real credentials or refresh tokens in browser storage.
- Validate mock requests against Yup schemas. The future Django backend must repeat all validation server-side and guard against IDOR, cross-branch access, mass assignment, replay, duplicate operations and unsafe uploads.
- Keep audit events for stock adjustments, voids, returns, role changes, branch assignments and manual payment confirmations.
- Store NGN money as integer minor units (kobo); avoid floating-point arithmetic for payment totals. Display currency and timezone through configuration; default to NGN and Africa/Lagos without inventing tax rules.
- Keep stock movement records append-only. Corrections use reversing/corrective movements. Preserve completed sales even if a mock reconciliation flags a stock discrepancy.
- Document the future production requirements: secure HttpOnly/Secure cookie sessions or another reviewed auth mechanism, CSRF protection where applicable, server-side permission enforcement, rate limiting, secrets management, security headers, server logs and database backup/restore. Do not claim these are provided by frontend mock mode.

## 8. Required project structure

The repository must contain **one Next.js project at the repository root**. The core `src/` tree must follow `AGENTS.md`; do not introduce a separate `frontend/` or `backend/` project unless the user explicitly requests it. Do not add new first-level directories under `src/` beyond the canonical roots. `constants/mock-data/` and `libraries/mock-api/` are subdirectories within existing roots.

```text
.
├── AGENTS.md
├── REPLIT_MASTER_PROMPT.md
├── README.md
├── .env.example
├── package.json
├── next.config.ts
├── tsconfig.json
├── public/
│   ├── manifest.webmanifest
│   ├── icons/
│   └── offline/
├── messages/
│   └── en.json
├── src/
│   ├── app/
│   │   ├── (0)/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── loading.tsx
│   │   │   ├── sign-in/
│   │   │   │   ├── page.tsx
│   │   │   │   └── _sections/
│   │   │   │       ├── header.section.tsx
│   │   │   │       ├── field.section.tsx
│   │   │   │       └── footer.section.tsx
│   │   │   └── password/
│   │   │       ├── forgot/
│   │   │       └── reset/
│   │   ├── (dash)/
│   │   │   ├── layout.tsx
│   │   │   ├── loading.tsx
│   │   │   ├── _layouts/
│   │   │   │   ├── header.layout.tsx
│   │   │   │   ├── sidebar.layout.tsx
│   │   │   │   └── footer.layout.tsx
│   │   │   ├── overview/
│   │   │   ├── admin/
│   │   │   │   ├── overview/
│   │   │   │   ├── branches/
│   │   │   │   ├── users/
│   │   │   │   ├── devices/
│   │   │   │   ├── reports/
│   │   │   │   └── settings/
│   │   │   └── store/
│   │   │       ├── overview/
│   │   │       ├── pos/
│   │   │       ├── sales/
│   │   │       ├── products/
│   │   │       ├── inventory/
│   │   │       ├── purchases/
│   │   │       ├── suppliers/
│   │   │       ├── transfers/
│   │   │       ├── devices/
│   │   │       ├── reports/
│   │   │       ├── sync/
│   │   │       └── settings/
│   │   ├── (routes)/
│   │   │   └── api/
│   │   │       ├── [...all]/
│   │   │       ├── auth/
│   │   │       ├── health/
│   │   │       └── session/
│   │   ├── error.tsx
│   │   ├── global-error.tsx
│   │   ├── not-found.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── elements/
│   │   │   ├── forms/
│   │   │   ├── primary/
│   │   │   └── secondary/
│   │   └── providers/
│   │       ├── antd/
│   │       ├── query/
│   │       └── index.ts
│   ├── common/
│   │   ├── hooks/query/
│   │   ├── keys/query/
│   │   ├── schema/
│   │   └── types/
│   ├── constants/
│   │   ├── environment/
│   │   ├── routes/
│   │   ├── settings/
│   │   ├── token/
│   │   └── mock-data/              # Schema-validated fixture constants
│   ├── features/
│   │   ├── auth/
│   │   ├── branches/
│   │   ├── devices/
│   │   ├── users/
│   │   ├── catalog/
│   │   ├── inventory/
│   │   ├── sales/
│   │   ├── purchases/
│   │   ├── suppliers/
│   │   ├── transfers/
│   │   ├── reports/
│   │   ├── payments/
│   │   ├── sync/
│   │   ├── audit/
│   │   ├── dashboard/
│   │   └── settings/
│   ├── libraries/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   └── server.ts            # Future HTTP/proxy contract only
│   │   ├── mock-api/               # Persistent DRF-like simulated API
│   │   ├── cookie/
│   │   ├── logger/
│   │   ├── offline/                # Dexie DB, migrations, outbox, repositories
│   │   ├── payment-providers/       # Typed disabled adapter boundary
│   │   ├── rate-limit/
│   │   └── token/
│   ├── utils/
│   │   ├── parser/
│   │   └── token/
│   ├── styles/
│   │   ├── globals.style.css
│   │   ├── themes.style.css
│   │   ├── utilities.style.css
│   │   ├── components.style.css
│   │   └── animations.style.css
│   └── i18n/
│       ├── index.ts
│       ├── request.ts
│       └── routing.ts
├── tests/
│   ├── integration/
│   ├── system/
│   └── e2e/
└── docs/
    ├── architecture.md
    ├── data-model.md
    ├── django-api-contract.md
    ├── synchronization.md
    ├── security-and-mock-limitations.md
    └── payment-terminal-integration.md
```

### Structure details

- The tree above is canonical. Preserve `(0)`, `(auth)`, `(dash)` and `(routes)` as route groups. The existing auth group and nested section conventions should remain recognizable.
- Each feature owns `api/index.ts`, `hooks/index.ts` or `hooks/index.tsx`, `schema/index.ts` and `index.ts`. Components and hooks call feature API functions; they never import fixture constants directly.
- Shared Yup contracts, including DRF pagination/error schemas, live under `common/schema/`. Feature domain/request/response schemas live in each feature's `schema/index.ts`.
- The mock fixture constants live under `constants/mock-data/`. The mock transport/repository lives under `libraries/mock-api/`. Offline local persistence and the outbox live under `libraries/offline/`. Keep these responsibilities separate.
- `app/(routes)/api/` and `libraries/api/server.ts` are future-compatible health/session/proxy scaffolding only. Mock mode uses the client transport adapter and must not put business logic in Next.js route handlers.
- App Router pages stay thin and compose `*.section.tsx` sections; layouts use `*.layout.tsx`. Section components do not accept props under the project convention; use feature hooks, providers or form context.
- Avoid conflicting URLs between route groups. Use explicit `/admin/*` and `/store/*` namespaces with role-aware redirects.

## 9. Django-compatible API contract and domain schema (no backend implementation)

Do not create Django source code. Define the domain and API contract in TypeScript/Yup so a future Django REST Framework backend can implement it consistently. Document the mapping in `docs/django-api-contract.md`.

### Domain resources

Use the following logical entities in fixture schemas and mock state (field names should be `snake_case` to match Django serializers):

- `Organization`, `Branch`, `User`, `Role`, `BranchMembership`, `Device`.
- `Product`, `Category`, `ProductBarcode`.
- `InventoryBalance` unique conceptually by `branch_id + product_id`; append-only `StockMovement`.
- `Supplier`, `Purchase`, `PurchaseItem`.
- `Sale`, `SaleItem`, `Payment`, `SaleReturn`, `SaleReturnItem`.
- `StockTransfer`, `StockTransferItem`.
- `SyncOperation`, `SyncAcknowledgement`, `AuditEvent`.
- Optional `TerminalProvider`, `PaymentTerminal` metadata only.

Use UUID strings for IDs, ISO 8601 for timestamps, explicit status enums, integer minor units for money, and decimal-capable quantities. Preserve product name, unit, price and discount snapshots on sale lines. Use deactivation/archival state for records referenced by transactions rather than demonstrating destructive deletion.

### Common DRF-compatible response schemas

In `src/common/schema/`, define Yup schemas (and infer TypeScript types from them) for:

- `BaseModelSchema`: `id`, `created_at`, `updated_at` where relevant.
- `BasePaginationSchema`: `count`, `next`, `previous`, `results`.
- `ApiErrorSchema`: `detail` and/or field-keyed arrays of validation messages.
- Standard response metadata and common validation primitives.

Paginated list payload must use DRF `PageNumberPagination` structure exactly:

```json
{
  "count": 42,
  "next": "/api/products/?page=2&page_size=20",
  "previous": null,
  "results": []
}
```

Use `page` and `page_size` query parameters with a documented default and maximum. Implement mock pagination after filtering/search/order, and return correct `count`, `next` and `previous` values. Support realistic `search`, `ordering`, `branch_id`, `status`, and date filters only on resources for which they make sense.

### Endpoint contract

Use trailing-slash resource paths and keep the endpoint map centralized under `constants/routes` or a documented equivalent. At minimum describe and simulate:

- `/api/auth/sign-in/`, `/api/auth/sign-out/`, `/api/auth/profile/` (mock demo contract only).
- `/api/branches/`, `/api/users/`, `/api/devices/`.
- `/api/categories/`, `/api/products/`, `/api/products/{uuid}/`.
- `/api/inventory-balances/`, `/api/stock-movements/`, `/api/inventory-adjustments/`.
- `/api/suppliers/`, `/api/purchases/`, `/api/purchases/{uuid}/receive/`.
- `/api/sales/`, `/api/sales/{uuid}/`, `/api/sales/{uuid}/void/`, `/api/sales/{uuid}/returns/`.
- `/api/stock-transfers/`, `/api/reports/…`.
- `/api/sync/push/`, `/api/sync/pull/?cursor=…`.

The mock transport should mimic status codes and error bodies, not merely return arbitrary objects. The API contract should specify which endpoints are read-only, which mutations require manager/admin permissions, which filters are accepted, and which payload fields are required. The contract is a frontend design target; these route handlers are not being implemented as a real Django API in this phase.

### Future migration mapping

Document how each resource maps later to Django models, serializers, viewsets/API views, service functions, permissions, pagination and database constraints. Use DRF naming/pagination/error conventions now so switching the adapter from `mock` to a real HTTP transport does not force UI components to change. Do not generate Python, Django settings, migrations, PostgreSQL config or backend tests.

## 10. Naming, coding and review conventions

Follow the supplied `AGENTS.md`, especially:

- No TypeScript `any`; prefer `unknown`, narrow types or infer from schemas.
- React components use normal `function` declarations and named exports except Next.js convention files.
- Do not destructure objects or props. Access properties directly (e.g. `props.value`, `authCtx.user`, `formikCtx.handleSubmit`). Spread operations remain allowed.
- React is default-imported and hooks accessed as `React.useState`, `React.useEffect`, etc., matching the supplied convention. Do not replace it with named React hook imports.
- Imports are grouped and sorted by import-path string length within groups: framework, third-party, internal `@/*`, local relative.
- Avoid business logic in page files. Use feature APIs/hooks/schemas and the centralized mock/API adapter.
- Validate env at startup using Zod. Never hard-code non-theme colors or arbitrary Tailwind values.
- Invalidate relevant TanStack Query keys after successful mutations.
- Keep the future server-token/cookie contract isolated from browser bundles; demo auth is intentionally not production-secure.
- Keep tests co-located as `test.ts` / `test.tsx` where appropriate and add integration/e2e tests for important journeys.
- Error handlers should show concise user messages and log structured, redacted context. Do not swallow errors silently outside the established form error pattern.
- Update `AGENTS.md` and relevant `docs/` whenever a new pattern or architectural change is introduced.

## 11. Testing and acceptance criteria

Do not consider the frontend prototype complete until these acceptance tests pass, or list remaining failures clearly. Tests must not imply that browser-local mock mode proves production multi-device synchronization or server-side security.

### Core business flows

- Demo admin can create or manage two stores and assign users/devices to them in persistent mock state.
- In the mock adapter and UI, Store A users cannot list, read, mutate or export Store B sales, inventory, purchases, users or devices, including via a guessed URL/UUID/API request. Label this as demo enforcement; document that production must repeat these checks in Django.
- Demo admin can see all seeded stores and consolidated mock reporting; store roles see only their assigned store.
- A sale in Store A changes Store A's stock only.
- Selling a product records fixed price/quantity snapshots and a corresponding stock movement.
- Manual stock adjustment requires a reason and creates a ledger entry.
- Purchase receiving creates stock movements for the receiving branch only.
- Returns/voids are auditable and do not delete the original sale.

### Offline and sync flows

- With a previously authenticated device, disconnect the network and complete a supported cash sale.
- Refresh/close/reopen the PWA; the sale and pending outbox entry remain.
- Reconnect; pending sales process through the mock sync adapter exactly once within that browser profile.
- Simulate the mock API processing a sale but losing its acknowledgement; retry does not duplicate it.
- Test a batch whose connection fails partway through.
- Confirm a product/stock pull never overwrites a pending local sale.
- Confirm that different stores' data never crosses branch scope during sync.
- A stale stock discrepancy in mock state results in a visible review state without deleting the sale/ledger trail.
- Simulated expired authentication and device revocation preserve pending local records and make upload status clear.

### UI, accessibility and reliability

- Authenticated and unauthorized routes behave correctly.
- Main pages have loading, empty, error and success states.
- Forms validate with shared Yup schemas in the mock frontend. Document that the eventual Django backend must repeat validation server-side.
- Main POS flow works by keyboard and on tablet-sized layout.
- Status is never indicated by color alone.
- Unit tests cover money calculations, stock movement rules, permission helpers and outbox/idempotency logic.
- Mock-adapter/API-contract tests cover branch scoping, pagination, DRF-shaped errors and duplicate-operation handling.
- E2E tests cover sign-in, sale online, sale offline, reconnection/sync, and admin-vs-store visibility.
- Run frontend lint, typecheck, tests and production build. Fix failures rather than suppressing them. If a command cannot run in Replit, document the exact blocker and do not claim success.

## 12. Schema-validated constants and demo usability

Create schema-validated constants in `src/constants/mock-data/` that populate:

- One organization.
- At least three stores with distinct branch stock.
- Users representing owner/admin, store manager, cashier and inventory officer roles.
- Construction-product examples across several categories (e.g. cement bags, rebar lengths, paint litres, plumbing items, tiles boxes and sand/aggregate quantities).
- Purchases, stock movements and sales to make the dashboards realistic.

Seed/demo accounts must be clearly marked as demo-only. In mock mode, initialize the mock repository from fixtures only when it has not already been initialized; provide an explicit demo reset action protected by a confirmation step. Never imply the demo accounts are production-secure.

## 13. Delivery process — execute in phases

### Phase 0: Inspect and plan

- Read `AGENTS.md` fully.
- Confirm the Replit runtime can run the requested Next.js version and selected PWA, Dexie and UI dependencies; verify dependencies against current official documentation where necessary.
- Present a concise frontend architecture, route map, domain schemas, DRF-compatible endpoint contract, mock data adapter, local synchronization design and test plan before major structural changes. Explicitly confirm that no backend service will be created.

### Phase 1: Foundation

- Create the required Next.js tree, environment validation, design tokens, application shell, PWA baseline, API transport, mock adapter, DRF-compatible schemas and demo authentication. Keep `src/app/(routes)/api/` only for frontend health/session/proxy scaffolding required by the canonical tree; do not put business logic there. Document the mock-only runtime.

### Phase 2: Online core

- Implement branch/user management, product catalog, inventory ledger, purchase receiving, sales/POS, sale history and dashboards through feature APIs backed by the schema-validated mock adapter and persistent IndexedDB state. Test role/store scoping in the mock adapter as each feature is added.

### Phase 3: Offline POS and sync

- Implement Dexie schema/migrations, local repositories, atomic local sale/outbox writes, a sync worker, mock per-operation processing, acknowledgements, cursor pull and user-visible sync center. Build lost-acknowledgement, retry, persistence and cross-store-isolation tests. Explicitly state that cross-device sync is simulated and requires Django later.

### Phase 4: Polish and optional integration boundary

- Add reports, accessible error/empty/loading states, audit trails, responsive polish and optional manual external-POS reference capture/provider-adapter interface.
- Do not implement live third-party terminal payments without a confirmed provider and credentials.

### Phase 5: Verify and hand over

- Run browser testing against the running app, automated tests, lint, TypeScript checks and production build. Do not report any backend tests, database migrations or server-side enforcement as implemented.
- Fix issues caused by your changes; don't just report them.
- Update the README and `docs/` with frontend architecture, mock mode, environment variables, demo fixture setup/reset, tests, future Django migration contract, PWA/offline limitations and device recovery guidance.
- Summarize the completed features, exact commands run and their results, environment variables still needed, deployment limitation (if any), and known gaps. Clearly distinguish implemented features from scaffolding.

## 14. Scope controls: do not add these unless asked

- No accounting/payroll/ERP expansion.
- No customer loyalty, ecommerce marketplace or native mobile app.
- No automatic multi-store stock balancing; stores are physically separate.
- No device-level stock reservation/allocation in the MVP.
- No real third-party payment-terminal API call without provider approval/access.
- No storing sensitive card data.
- No fake API responses presented as real production data. Demo data must be visibly labeled. No decorative buttons without behavior, and no “success” toast until the operation succeeds in mock state or is safely saved locally with an honest pending status.
- Do not create a backend framework or database. Do not change the mandated frontend folder conventions or UI library just to minimize implementation effort. Explain genuine frontend runtime blockers before proposing a substitution.

## 15. First response expected from you

Before coding, provide:

1. A brief acknowledgement of the constraints you extracted from `AGENTS.md` and this prompt.
2. Your proposed architecture and confirmed folder layout.
3. The database/domain model outline and the sale/sync state machine.
4. A phased build plan with key risks and how each will be tested.
5. Any genuine Replit runtime constraints affecting the Next.js-only frontend and mock mode.

After that, proceed to implement in reviewable checkpoints. Do not stop after producing the plan.
