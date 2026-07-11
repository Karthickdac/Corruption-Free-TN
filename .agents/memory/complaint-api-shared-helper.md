---
name: Complaint API shared serializer feeds public + gated routes
description: Why officer/assignee identity must not be added to toApiComplaint/complaintSelection in api-server complaints route
---

The `toApiComplaint()` serializer and `complaintSelection()` query builder in the
api-server complaints route are shared by BOTH public endpoints (GET
/complaints, GET /complaints/track/:complaintNumber) and officer-gated endpoints
(GET /complaints/:complaintId, etc.).

**Rule:** Never add investigating-officer or assignee identity (e.g.
`assignedOfficerName`, report `authorName`) to the shared helper. Fetch and spread
such fields only inside the specific officer-gated handler.

**Why:** The public track endpoint deliberately redacts the investigating
officer's identity (safety/privacy on a corruption portal). Adding the name to
the shared helper would silently leak it on the public routes. The Complaint
schema marks these fields optional, so tsc + zod stay green even when the field
is absent — a leak here would NOT be caught by the type checker or tests.

**How to apply:** When a gated route needs assignee/author names, join
`usersTable` (or do a small lookup by id) inside that handler and spread the
field into the response object, mirroring the per-handler pattern in
dashboard.ts. Leave `toApiComplaint`/`complaintSelection` untouched.
