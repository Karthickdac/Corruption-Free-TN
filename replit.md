# CorruptionFreeTN

Tamil Nadu Public Corruption Complaint & Transparency Portal — citizens report corruption (anonymously or signed-in), track complaints by number, and view statewide transparency statistics in Tamil or English.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/tn-portal run dev` — run the citizen portal frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run typecheck:libs` — rebuild lib declarations (run after changing lib/db or lib/api-spec)
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string; Clerk env vars are auto-managed

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Clerk auth (`@clerk/express`, proxy middleware)
- Frontend: React + Vite, wouter, TanStack Query, shadcn/ui, Tailwind v4, Recharts, next-themes (dark default), Clerk (`@clerk/react`)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for the API contract (codegen feeds client + zod)
- `lib/db/src/schema/` — Drizzle schema: `users.ts`, `geo.ts` (districts/taluks), `government.ts` (ministries/departments), `complaints.ts`
- `artifacts/api-server/src/routes/` — `masterdata.ts`, `stats.ts`, `users.ts`, `complaints.ts`
- `artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts` — Clerk prod proxy (mounted before express.json)
- `artifacts/tn-portal/` — citizen portal frontend; `src/contexts/i18n.tsx` holds Tamil/English translations
- Seeded data: 38 TN districts (Tamil names), ~290 taluks, 12 ministries, 39 departments, 10 complaint categories

## Architecture decisions

- Complaint numbers: `CFT-YYYY-######` random 6-digit with unique-violation retry loop on insert
- `amountInvolved` stored as Postgres `numeric` (string in Drizzle), converted with `Number()` at the API boundary
- Non-anonymous complaints lazily provision the local user row (Clerk → users table) inside POST /complaints
- Public complaint endpoints redact `location`, `witnesses`, `officerDesignation`, `userId`
- Clerk client wiring follows the canonical pattern: `publishableKeyFromHost` + unconditional `proxyUrl` + `routerPush`/`routerReplace` with base-path stripping; no `UserButton` (custom header auth UI instead)
- Design direction: "Power" — bold/commanding, crimson (#e11d48) primary, Oswald + Inter, dark mode default

## User preferences

- App name: CorruptionFreeTN (renamed from TNCorruptions)
