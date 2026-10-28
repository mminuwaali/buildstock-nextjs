# Demo accounts, test plan and acceptance criteria

## Demo accounts

Use the header role selector or `/sign-in` to switch demo roles:

- Owner/Admin: `owner@buildstock.demo` — all-branch view.
- Store Manager: `manager.central@buildstock.demo` — Central Building Mart.
- Cashier: `cashier.central@buildstock.demo` — Central Building Mart POS.
- Stock Officer: `stock.central@buildstock.demo` — Central Building Mart inventory.
- Auditor: `audit@buildstock.demo` — read-only, assigned branch.

These are role simulations, not real authentication. Do not reuse demo behavior as a security control.

## Manual acceptance tests

1. Create a product and verify it appears in search/list results with zero opening stock.
2. Complete a cash sale; verify branch stock decreases, sale and lines persist, stock movement appears and an outbox item is pending.
3. Refresh the browser; verify the sale and pending operation remain in IndexedDB.
4. Toggle offline mode; verify POS continues using cached products and clearly warns that sync is unavailable.
5. Mark online and run demo sync; verify pending operations receive a visible result and duplicate retries do not create another local sale.
6. Use a store role and verify the interface only queries its assigned branch. Switch to Owner/Admin and verify consolidated reporting.
7. Receive an ordered purchase and verify stock movement and balance update.
8. Dispatch a transfer and verify source stock decreases; receive it and verify destination stock increases.
9. Record a stock adjustment with a reason and verify the movement and audit record.
10. Choose external POS payment and verify it is shown as awaiting verification rather than falsely confirmed by a provider.
11. Verify product create forms reject invalid values and pagination/search controls work.
12. Test responsive use at desktop, tablet and narrow mobile widths; use keyboard navigation and print a receipt.

## Automated tests

Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run build`. The environment in which this project was authored may not have network access to install all packages, so the final handoff must indicate whether these commands were actually run. Never report a test as passing without its command completing successfully.

- Full sale return restores only the originating branch stock, appends return movements, writes an audit event and queues a separate operation; duplicate reversals are rejected. The prototype does not send payment refunds.
