---
name: Live-server integration test idempotency
description: Pitfalls when integration tests hit the running dev API (duplicate detection, rate limits, data pollution)
---

# Live-server integration tests must be idempotent

- Any test that POSTs a complaint with a fixed description will pass once and then 409 forever: duplicate detection compares description similarity (>0.55, last 90 days, no district filter). Always send `confirmDuplicate: true` (or randomize descriptions) in test payloads.
- **Why:** The evidence-validation suite deterministically failed on its second run until `confirmDuplicate: true` was added.
- **How to apply:** Any new integration test or scripted check that creates complaints against the live API needs this flag.
- Complaint submission is rate-limited to 5/hour/IP and registration to 20/15min — repeated validation runs from localhost can 429 in setup. Interpret 429s in test setup as the limiter, not a regression.
- These tests create real users/complaints/objects in the shared dev DB (visible in public stats) — no teardown exists; keep payloads clearly labeled as test data.
