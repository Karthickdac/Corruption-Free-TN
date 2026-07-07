export const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  investigation: "Investigation",
  action_taken: "Action Taken",
  closed: "Closed",
  rejected: "Rejected",
  resolved: "Resolved",
  pending: "Pending",
};

export function statusLabel(status: string): string {
  return (
    STATUS_LABELS[status] ??
    status
      .split("_")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ")
  );
}

export function statusColor(
  status: string,
  c: {
    primary: string;
    mutedForeground: string;
    success: string;
    warning: string;
    destructive: string;
  },
): string {
  switch (status) {
    case "submitted":
      return c.mutedForeground;
    case "under_review":
      return c.warning;
    case "investigation":
      return c.primary;
    case "action_taken":
    case "closed":
    case "resolved":
      return c.success;
    case "rejected":
      return c.destructive;
    default:
      return c.mutedForeground;
  }
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
