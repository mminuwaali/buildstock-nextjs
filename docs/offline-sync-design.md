# Offline-first and synchronization design

## Local data model

Dexie/IndexedDB stores cached branches and products, branch stock balances, sales, sale line items, stock movements, suppliers, purchase orders and lines, transfers and lines, users/devices for demo display, audit events, and a durable outbox.

## Sale transaction

At checkout, `completeSale` validates the request with Yup and resolves active catalog products. It persists the sale, sale items, per-branch stock changes, a stock movement per sale line, a stable operation identifier in the outbox, and an audit event in a single read-write Dexie transaction. Cart selection alone does not change stock. The committed sale deducts only from its `branch_id`.

## Outbox states

- `pending`: saved locally and awaiting simulated sync.
- `syncing`: currently being processed by the demo adapter.
- `synced`: mock adapter acknowledged the operation.
- `needs_review`: the demo discovered a negative recorded branch balance or another discrepancy requiring staff review.
- `rejected`: reserved for a future authoritative server rejection; never discard without an explicit resolution path.

Outbox IDs and operation IDs remain stable across retry. The demo sync is a simulation; it does not send transactions to another device or a remote backend. IndexedDB persists within one browser profile but can be evicted or cleared. Browser storage should not be represented as a backup.

## Physical stock and concurrency

The business assumes staff sell only products physically present at the store. Multiple offline devices can have stale snapshots, so the prototype flags discrepancies if their eventual shared-server implementation reveals a negative balance. It never silently erases a committed sale or edits history to hide a discrepancy. A real backend must decide the authoritative acceptance/reconciliation policy and process each operation idempotently and atomically.

## Reconnection

The current mock supports manually running a sync simulation while marked online. A production implementation should attempt sync on app startup, reconnect, focus and while active, with bounded retries and explicit operation acknowledgements. Background Sync is best-effort, not a guarantee that a closed browser executes work.

## Cross-device requirement

This prototype is local-only. Genuine cross-device synchronization requires: a shared HTTPS API, registered devices, authenticated and branch-scoped access, idempotency records keyed by operation ID, atomic writes, server-owned change cursor, acknowledgement of each operation, conflict visibility and backup/restore procedures. Never describe the local simulation as production synchronization.

## Sale reversals

A full goods return or void is a separate transaction. It is allowed only for a completed sale with a non-pending payment status and saved sale lines. The action restores the goods to the original branch, appends positive `return` stock movements, updates the sale status, writes an audit event and queues a new outbox operation in one IndexedDB transaction. Repeated reversals are rejected. The demo does not issue a cash/bank refund or reverse a terminal payment; that remains a separately verified payment operation in production.
