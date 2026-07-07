---
name: Orval codegen script fails silently via pnpm filter
description: Workaround for lib/api-spec codegen exiting -1 with no output
---

**Rule:** If `pnpm --filter @workspace/api-spec run codegen` exits -1 silently, run `cd lib/api-spec && npx orval --config ./orval.config.ts` directly, then `pnpm -w run typecheck:libs` separately.

**Why:** The filtered pnpm script failed silently (exit -1, no error output) twice during API client regeneration; invoking orval directly worked every time.

**How to apply:** Use the direct orval invocation whenever regenerating clients after editing `lib/api-spec/openapi.yaml`.
