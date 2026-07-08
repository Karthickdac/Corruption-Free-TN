import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
} from "@/constants/complaint-workflow";

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
        "text-[10px] px-1.5 py-0 font-medium whitespace-nowrap",
        STATUS_COLORS[status] ?? "bg-muted text-muted-foreground",
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
        "text-[10px] px-1.5 py-0 font-medium whitespace-nowrap",
        PRIORITY_COLORS[priority] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {PRIORITY_LABELS[priority] ?? priority}
    </Badge>
  );
}
