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
- Required env: `DATABASE_URL` — Postgres connection string; optional `SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD` override the seeded super admin login

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + custom session auth (bcrypt password hashes, opaque session tokens in a `sessions` table; httpOnly cookie for web, Bearer token for mobile)
- Frontend: React + Vite, wouter, TanStack Query, shadcn/ui, Tailwind v4, Recharts, next-themes (single light theme)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for the API contract (codegen feeds client + zod)
- `lib/db/src/schema/` — Drizzle schema: `users.ts`, `geo.ts` (districts/taluks), `government.ts` (ministries/departments), `complaints.ts`
- `artifacts/api-server/src/routes/` — `masterdata.ts`, `stats.ts`, `users.ts`, `complaints.ts`
- `artifacts/api-server/src/routes/auth.ts` — register/login/logout; `src/middlewares/authSession.ts` — session resolution (Bearer first, then `session_token` cookie)
- `artifacts/tn-portal/` — citizen portal frontend; `src/contexts/i18n.tsx` holds Tamil/English translations
- Seeded data: 38 TN districts (Tamil names), ~290 taluks, 12 ministries, 39 departments, 10 complaint categories

## Architecture decisions

- Complaint numbers: `CFT-YYYY-######` random 6-digit with unique-violation retry loop on insert
- `amountInvolved` stored as Postgres `numeric` (string in Drizzle), converted with `Number()` at the API boundary
- Auth: users sign up/in with email OR Indian mobile number (10 digits, 6-9 start; 91/0 prefixes stripped) + password (min 8 chars); sessions last 30 days; web uses SameSite=Lax httpOnly cookie, Expo stores the token in SecureStore (localStorage on web) and sends it via `setAuthTokenGetter` Bearer
- Public complaint endpoints redact `location`, `witnesses`, `officerDesignation`, `userId`
- Design direction: "Power" — bold/commanding, crimson (#e11d48) primary, Oswald + Inter, dark mode default

## User preferences

- App name: CorruptionFreeTN (renamed from TNCorruptions)
- Tamil UI text must use plain, everyday spoken Tamil that ordinary people understand — never formal/literary Tamil (e.g. "பெயர் இல்லாமல்" not "அநாமதேயமாக", "கட்டாயம் இல்லை" not "விருப்பத்திற்குரியது")
