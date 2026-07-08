import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
} from "@/constants/complaint-workflow";

const ADMIN_STATUS_COLORS: Record<string, string> = {
  submitted: "bg-stone-100 text-stone-700 border-stone-200",
  under_review: "bg-amber-100/80 text-amber-800 border-amber-200",
  evidence_verification: "bg-fuchsia-100/80 text-fuchsia-800 border-fuchsia-200",
  forwarded: "bg-lime-100/80 text-lime-800 border-lime-200",
  department_response: "bg-teal-100/80 text-teal-800 border-teal-200",
  investigation: "bg-orange-100/80 text-orange-800 border-orange-200",
  action_taken: "bg-emerald-100/80 text-emerald-800 border-emerald-200",
  closed: "bg-stone-200 text-stone-800 border-stone-300",
  rejected: "bg-red-100/80 text-red-800 border-red-200",
  reopened: "bg-rose-100/80 text-rose-800 border-rose-200",
};

const ADMIN_PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-600 text-white border-red-700 shadow-sm",
  high: "bg-orange-500 text-white border-orange-600 shadow-sm",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full text-[11px] px-2.5 py-0.5 font-medium border whitespace-nowrap shadow-sm transition-colors",
        ADMIN_STATUS_COLORS[status] ?? "bg-stone-100 text-stone-700 border-stone-200",
        className,
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full text-[11px] px-2.5 py-0.5 font-medium border whitespace-nowrap transition-colors",
        ADMIN_PRIORITY_COLORS[priority] ?? "bg-stone-100 text-stone-700 border-stone-200",
        className,
      )}
    >
      {PRIORITY_LABELS[priority] ?? priority}
    </Badge>
  );
}
