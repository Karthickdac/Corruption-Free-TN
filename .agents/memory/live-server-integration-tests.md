---
name: Live-server integration test idempotency
description: Pitfalls when integration tests hit the running dev API (duplicate detection, rate limits, data pollution)
---

# Live-server integration tests must be idempotent

- Any test that POSTs a complaint with a fixed description will pass once and then 409 forever: duplicate detection compares description similarity (>0.55, last 90 days, no district filter). Always send `confirmDuplicate: true` (or randomize descriptions) in test payloads.
- **Why:** The evidence-validation suite deterministically failed on its second run until `confirmDuplicate: true` was added.
- **How to apply:** Any new integration test or scripted check that creates complaints against the live API needs this flag.
- Complaint submission (5/hour/IP) and auth (20/15min) rate limiters are skipped when NODE_ENV=development (the dev workflow sets it), so repeated local test runs no longer 429. Production limits are unchanged and covered by a unit test that stubs NODE_ENV=production against an isolated express app.
- These tests create real users/complaints/objects in the shared dev DB (visible in public stats). The evidence suite now has an `afterAll` DB teardown that deletes everything matching the reserved `evidence-test-%@example.com` email pattern (including leftovers from older runs). Any new suite that creates data must either reuse that pattern or ship its own teardown — otherwise test data pollutes public transparency lists and the heat map.
- Teardown deletion order matters: child rows first (evidence, case_notes, investigation_reports, rti_requests → complaints; notifications/audit_logs/sessions → users) because of FK constraints.
