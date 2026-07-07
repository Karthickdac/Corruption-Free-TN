---
name: Evidence file access model
description: How complaint evidence downloads are authorized (complaint context, not uploader ACL)
---

# Evidence file access model

**Rule:** Complaint evidence files served via the private object download route are authorized by *complaint context* — complaint owner (citizen) or `canAccessComplaint` (jurisdiction/assignment-based officer check) — not by the uploader-only object ACL. The uploader ACL is only a fallback for non-evidence objects.

**Why:** Code review rejected the uploader-only ACL: citizens upload evidence, and officers handling the complaint were blocked from downloading files they could see in metadata. Assignment/jurisdiction changes over time also make baked-in ACL grants go stale, so authorization is resolved at download time from the DB.

**How to apply:** Any new file-serving path for complaint-related objects must join through the evidence table to the complaint and reuse `canAccessComplaint`. Do not rely on object ACL grants for role-scoped access. `evidence_download` audit events are logged at the actual file download endpoint, not on metadata listing.
