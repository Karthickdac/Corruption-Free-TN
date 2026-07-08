---
name: Orval codegen pitfalls
description: Rules to follow when editing lib/api-spec/openapi.yaml so orval codegen output compiles
---

# Orval codegen pitfalls

**Rule:** Define request bodies as named `$ref` components in `openapi.yaml` (e.g. `RegisterInput`, `LoginInput`), never inline.

**Why:** Inline request bodies make orval's types generator emit `<OperationId>Body` interfaces that collide with the zod generator's `<OperationId>Body` const exports in the same barrel, breaking `typecheck:libs`.

**How to apply:** When adding endpoints to `lib/api-spec/openapi.yaml`, put every request body schema under `components/schemas` and reference it. After editing, run `pnpm --filter @workspace/api-spec run codegen` then `pnpm run typecheck:libs`.

# Schema names vs operationId collision

**Rule:** A `components/schemas` name must never equal `<OperationId>Response` or `<OperationId>Body` for any operation (e.g. schema `BulkComplaintActionResponse` + operationId `bulkComplaintAction` collide).

**Why:** Orval's zod generator emits `<OperationId>Response`/`<OperationId>Body` consts and the types generator re-exports schema names from the same barrel — a collision throws TS2308 in api-zod. Fix by renaming the schema (e.g. `BulkActionOutcome`), not the operationId.

**How to apply:** When naming new schemas, check they don't match PascalCase(operationId) + `Response`/`Body` of any endpoint. After codegen, also run `npx tsc -b` in `lib/api-zod` and `lib/api-client-react` — stale composite dist otherwise breaks api-server typecheck.

# API error contract

**Rule:** API error responses use `{ "error": "..." }` — clients must read `err.data.error`, not `err.data.message`.

**Why:** All four sign-in/sign-up screens once read `.message` and silently showed generic fallbacks for every specific server error.

**How to apply:** Any new client-side error handler for API mutations should extract `err.data?.error`.
