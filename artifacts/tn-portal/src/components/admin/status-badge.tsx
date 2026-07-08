import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
} from "@/constants/complaint-workflow";

const ADMIN_STATUS_COLORS: Record<string, string> = {
  submitted: "bg-stone-200 text-stone-800 border-stone-400",
  under_review: "bg-amber-100 text-amber-900 border-amber-400",
  evidence_verification: "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-400",
  forwarded: "bg-lime-100 text-lime-900 border-lime-400",
  department_response: "bg-teal-100 text-teal-900 border-teal-400",
  investigation: "bg-orange-100 text-orange-900 border-orange-400",
  action_taken: "bg-emerald-100 text-emerald-900 border-emerald-400",
  closed: "bg-stone-800 text-stone-100 border-stone-900",
  rejected: "bg-red-100 text-red-900 border-red-400",
  reopened: "bg-rose-100 text-rose-900 border-rose-400",
};

const ADMIN_PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-600 text-white border-red-800",
  high: "bg-orange-500 text-white border-orange-700",
  medium: "bg-amber-100 text-amber-900 border-amber-400",
  low: "bg-emerald-100 text-emerald-900 border-emerald-400",
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
        "rounded-none text-[10px] px-1.5 py-0 font-bold uppercase tracking-wider whitespace-nowrap border-2",
        ADMIN_STATUS_COLORS[status] ?? "bg-stone-100 text-stone-600 border-stone-300",
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
        "rounded-none text-[10px] px-1.5 py-0 font-bold uppercase tracking-wider whitespace-nowrap border-2",
        ADMIN_PRIORITY_COLORS[priority] ?? "bg-stone-100 text-stone-600 border-stone-300",
        className,
      )}
    >
      {PRIORITY_LABELS[priority] ?? priority}
    </Badge>
  );
}
