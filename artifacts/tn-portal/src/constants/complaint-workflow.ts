export const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-stone-500/10 text-stone-600 border-stone-500/20",
  under_review: "bg-amber-600/10 text-amber-600 border-amber-600/20",
  evidence_verification: "bg-pink-600/10 text-pink-600 border-pink-600/20",
  forwarded: "bg-lime-600/10 text-lime-600 border-lime-600/20",
  department_response: "bg-emerald-600/10 text-emerald-600 border-emerald-600/20",
  investigation: "bg-orange-600/10 text-orange-600 border-orange-600/20",
  action_taken: "bg-green-500/10 text-green-600 border-green-500/20",
  closed: "bg-stone-600/10 text-stone-600 border-stone-600/20",
  rejected: "bg-red-600/10 text-red-600 border-red-600/20",
  reopened: "bg-rose-600/10 text-rose-600 border-rose-600/20",
};

export const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  evidence_verification: "Evidence Verification",
  forwarded: "Forwarded",
  department_response: "Dept. Response",
  investigation: "Investigation",
  action_taken: "Action Taken",
  closed: "Closed",
  rejected: "Rejected",
  reopened: "Reopened",
};

export const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-600 text-white border-transparent",
  high: "bg-orange-500 text-white border-transparent",
  medium: "bg-amber-500/20 text-amber-700 border-amber-500/30",
  low: "bg-green-500/15 text-green-700 border-green-500/30",
};

export const PRIORITY_LABELS: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

// Keep in sync with WORKFLOW_TRANSITIONS in artifacts/api-server/src/middlewares/rbac.ts
export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  submitted: ["under_review", "rejected"],
  under_review: ["evidence_verification", "forwarded", "rejected", "closed"],
  evidence_verification: ["forwarded", "under_review", "rejected"],
  forwarded: ["department_response", "investigation", "rejected"],
  department_response: ["investigation", "action_taken", "closed"],
  investigation: ["action_taken", "closed"],
  action_taken: ["closed"],
  closed: ["reopened"],
  reopened: ["under_review"],
  rejected: ["reopened"],
};

export const ROLE_LABELS: Record<string, string> = {
  citizen: "Citizen",
  village_officer: "Village Officer",
  taluk_officer: "Taluk Officer",
  district_officer: "District Officer",
  department_officer: "Department Officer",
  ministry_officer: "Ministry Officer",
  state_administrator: "State Administrator",
  super_admin: "Super Admin",
  investigation_officer: "Investigation Officer",
  moderator: "Moderator",
  auditor: "Auditor",
  legal_officer: "Legal Officer",
};
