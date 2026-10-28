# Migration path from mock repository to Django

1. Preserve the feature API boundary. Replace `src/libraries/mock-api/repository.ts` calls with a typed HTTP transport to Django REST Framework, while keeping feature hooks and screens dependent on stable schemas and API functions.
2. Implement the endpoint/response contract in `django-api-contract.md`. Use DRF page-number pagination and snake_case serializers.
3. Add real authentication and branch membership. Demo role selection and localStorage session state are not suitable for production. Prefer secure, server-managed HttpOnly cookies with an appropriate CSRF strategy.
4. On the server, enforce organization/store access in every queryset and detail/action operation; frontend filters are not authorization.
5. Maintain PostgreSQL inventory balances alongside an immutable stock movement ledger. Sale creation must lock/check or otherwise safely update stock according to the agreed business policy and atomically write sales, lines, payment state, stock movement and idempotency record.
6. Implement sync push with a stable `operation_id`, per-operation acknowledgements, duplicate protection, retry-safe responses and explicit conflict outcomes. Implement pull with an opaque server cursor.
7. Replace demo sync with HTTP push/pull. Keep local sales/outbox if requests fail, and do not clear outbox records until acknowledgement/explicit resolution.
8. Implement supplier/purchase receipt, returns and transfer dispatch/receipt as audited domain operations.
9. Add production API integration tests for cross-branch data leaks, duplicate retries, transactions interrupted after commit, concurrent sales, expired sessions and schema version migrations.
10. Add payment terminal providers only after confirming exact merchant/provider access, supported models and documented APIs. Keep payment status distinct from sale status.
