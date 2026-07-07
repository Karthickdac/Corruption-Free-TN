---
name: DB extensions must be codified in server bootstrap
description: Postgres extensions (e.g. pg_trgm) are not managed by drizzle-kit push; codify them in api-server startup
---

**Rule:** Any Postgres extension the app relies on (e.g. `pg_trgm` for similarity()) must be created via `CREATE EXTENSION IF NOT EXISTS ...` in the api-server bootstrap (runs before `app.listen`), never installed only by hand.

**Why:** `drizzle-kit push` does not create extensions, and production deploys get a fresh database. During duplicate-detection work, a manual extension install silently failed to persist, causing 500s on every complaint submission until reinstalled. A hand-installed extension would also be missing in prod.

**How to apply:** Add new extensions to the bootstrap block in the api-server entry point. Also: any non-essential DB feature used inside a request path (like the duplicate similarity check) should fail-open in its own try/catch so core intake never breaks.
