# Django REST Framework-compatible API contract

This is the frontend wire contract for a future Django REST Framework service. It is not an implemented backend.

## Naming and identifiers

- JSON keys use `snake_case`.
- Primary identifiers are UUID strings; timestamps are ISO 8601 strings with timezone information.
- NGN amounts are integer minor units (kobo), e.g. `sale_price_minor`; do not use floating-point money values.
- Decimal quantities are allowed for weight/volume products where the unit requires them.
- Resource collection/detail endpoints end in `/`, e.g. `GET /api/products/`, `GET /api/products/{uuid}/`, `POST /api/sales/`, `POST /api/sync/operations/`.

## List pagination

Use DRF `PageNumberPagination`: query parameters `page` and `page_size` and a response shaped as:

```json
{
  "count": 42,
  "next": "/api/products/?page=2&page_size=20",
  "previous": null,
  "results": []
}
```

`next` and `previous` are nullable URLs. Document filters/search/order for each endpoint and validate fixtures using the same schema.

## Errors

General errors use `{ "detail": "Human-readable explanation" }`. Validation errors use field keys with arrays of messages, for example `{ "sku": ["This field must be unique."] }`. The UI should parse both forms and keep field-level errors near controls where applicable.

## Core resources

- `/api/branches/`, `/api/products/`, `/api/inventory/balances/`, `/api/inventory/movements/`
- `/api/sales/`, `/api/sales/{uuid}/`, `/api/sales/{uuid}/returns/`
- `/api/suppliers/`, `/api/purchases/`, `/api/transfers/`
- `/api/users/`, `/api/devices/`, `/api/audit-events/`
- `/api/sync/operations/`, `/api/sync/changes/?cursor={opaque_cursor}`

## Production requirements

The backend must enforce organization and branch authorization on every operation. It must use unique idempotency keys for client-created operations, commit sale + sale items + payment outcome + stock movements inside a database transaction, safely handle lost acknowledgements, prevent duplicate processing, and return operation-level statuses. Use a server-issued opaque cursor for pulls; do not use client wall clocks as synchronization cursors. Return only authorized branch data. Terminal webhooks/callbacks must be authenticated/verified according to the provider's documentation. A payment reference should link one intended sale/payment attempt; matching by amount alone is unsafe.

## Sale voids and full goods returns

Recommended action endpoints are:

- `POST /api/sales/{uuid}/void/` — void an eligible sale with a required reason and audit event.
- `POST /api/sales/{uuid}/returns/` — record a full or partial goods return with item quantities, reason, and audit event.

These are action endpoints rather than arbitrary status edits. The backend must validate the current sale state, actor permissions, already-returned quantities, and idempotency key before writing. Stock restoration must be represented by new reversing/return stock movements against the original sale branch; never delete the original sale or its original stock movements. All affected sale, return, stock movement, audit, and sync-operation records should commit atomically.

A goods return is not the same as a payment refund. The terminal/payment provider refund, if required, is a separate provider-specific operation with its own reference and verified outcome. A void/return in this frontend-only mock does not issue a real payment refund or cancel an external terminal transaction.
