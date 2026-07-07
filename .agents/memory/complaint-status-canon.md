---
name: Canonical complaint statuses
description: The complaint status column is free text; the canonical status set and where drift causes silent zero-count bugs.
---

The `complaints.status` column is plain text with no DB enum. The canonical status set is defined solely by `WORKFLOW_TRANSITIONS` in the API server's RBAC middleware: submitted, under_review, evidence_verification, forwarded, department_response, investigation, action_taken, closed, reopened, rejected.

**Why:** Seed/legacy data once used `under_investigation` and `resolved`, which are NOT workflow states. Public stats aggregated by status name, so the landing page showed permanently-zero counts for "resolved" and "under investigation" — a silent data-drift bug with no error anywhere.

**How to apply:** Any code that filters or aggregates complaints by status string must use the WORKFLOW_TRANSITIONS names exactly. "Resolved" in UI terms = closed + action_taken. If counts look wrong, check the DB for stale status strings before touching code.
