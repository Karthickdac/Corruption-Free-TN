import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout, { RoleGate } from "@/components/admin-layout";
import { OFFICER_ROLES } from "@/constants/roles";
import {
  useGetDashboardComplaints,
  getGetDashboardComplaintsQueryKey,
  useBulkComplaintAction,
  useListAssignableOfficers,
  getListAssignableOfficersQueryKey,
  type GetDashboardComplaintsParams,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronRight, FileText, AlarmClock, X, UserCheck, RefreshCw } from "lucide-react";
import { StatusBadge, PriorityBadge } from "@/components/admin/status-badge";
import { PageHeader } from "@/components/admin/page-header";
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
} from "@/constants/complaint-workflow";

export default function AdminComplaintsList() {
  return (
    <RoleGate roles={OFFICER_ROLES}>
      <AdminLayout>
        <ComplaintsListContent />
      </AdminLayout>
    </RoleGate>
  );
}

function ComplaintsListContent() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [bulkOfficer, setBulkOfficer] = useState<string>("");

  // Avoid bulk-acting on rows that are no longer visible after a filter change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [statusFilter, priorityFilter, overdueOnly]);

  const params: GetDashboardComplaintsParams = {
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(priorityFilter !== "all" ? { priority: priorityFilter } : {}),
    ...(overdueOnly ? { overdue: true } : {}),
  };

  const { data, isLoading } = useGetDashboardComplaints(params, {
    query: {
      staleTime: 30000,
      queryKey: getGetDashboardComplaintsQueryKey(params),
    },
  });
  const complaints = data?.complaints ?? [];
  const overdueCount = data?.stats?.overdue ?? 0;

  const { data: officers } = useListAssignableOfficers({
    query: {
      queryKey: getListAssignableOfficersQueryKey(),
      enabled: selectedIds.size > 0,
    },
  });

  const bulkAction = useBulkComplaintAction({
    mutation: {
      onSuccess: (result) => {
        const { succeeded, failed, results } = result;
        if (failed === 0) {
          toast({
            title: "Bulk action complete",
            description: `${succeeded} complaint${succeeded === 1 ? "" : "s"} updated.`,
          });
        } else {
          const firstError = results.find((r) => !r.ok)?.error;
          toast({
            title: `${succeeded} updated, ${failed} failed`,
            description: firstError ?? "Some complaints could not be updated.",
            variant: succeeded === 0 ? "destructive" : "default",
          });
        }
        setSelectedIds(new Set());
        setBulkStatus("");
        setBulkOfficer("");
        queryClient.invalidateQueries({
          queryKey: getGetDashboardComplaintsQueryKey(),
        });
      },
      onError: (err) => {
        const message =
          (err as { response?: { data?: { error?: string } } })?.response?.data
            ?.error ?? "Bulk action failed";
        toast({ title: "Error", description: message, variant: "destructive" });
      },
    },
  });

  const toggleSelect = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const allSelected =
    complaints.length > 0 && complaints.every((c) => selectedIds.has(c.id));

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(complaints.map((c) => c.id)) : new Set());
  };

  const applyBulkStatus = () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    bulkAction.mutate({
      data: { action: "status", ids: [...selectedIds], status: bulkStatus },
    });
  };

  const applyBulkAssign = () => {
    if (!bulkOfficer || selectedIds.size === 0) return;
    bulkAction.mutate({
      data: {
        action: "assign",
        ids: [...selectedIds],
        officerUserId: Number(bulkOfficer),
      },
    });
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="All Complaints"
        description={`${data?.total ?? 0} ${overdueOnly ? "overdue" : "total"} in your jurisdiction`}
      />

      <div className="flex gap-2 items-center flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] h-9 text-sm" data-testid="filter-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[150px] h-9 text-sm" data-testid="filter-priority">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={overdueOnly ? "destructive" : "outline"}
          size="sm"
          className="h-9 gap-1.5"
          onClick={() => setOverdueOnly((v) => !v)}
          data-testid="filter-overdue"
        >
          <AlarmClock className="h-3.5 w-3.5" />
          Overdue {overdueCount > 0 && `(${overdueCount})`}
        </Button>
      </div>

      {selectedIds.size > 0 && (
        <Card className="border-amber-300 bg-amber-50/60">
          <CardContent className="py-3 px-4 flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium" data-testid="text-selected-count">
              {selectedIds.size} selected
            </span>

            <div className="flex items-center gap-1.5">
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger className="w-[170px] h-8 text-xs bg-white" data-testid="select-bulk-status">
                  <SelectValue placeholder="Change status to…" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-8 text-xs gap-1"
                disabled={!bulkStatus || bulkAction.isPending}
                onClick={applyBulkStatus}
                data-testid="button-bulk-status"
              >
                <RefreshCw className="h-3 w-3" /> Apply
              </Button>
            </div>

            <div className="flex items-center gap-1.5">
              <Select value={bulkOfficer} onValueChange={setBulkOfficer}>
                <SelectTrigger className="w-[190px] h-8 text-xs bg-white" data-testid="select-bulk-officer">
                  <SelectValue placeholder="Assign to officer…" />
                </SelectTrigger>
                <SelectContent>
                  {(officers ?? []).map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1 bg-white"
                disabled={!bulkOfficer || bulkAction.isPending}
                onClick={applyBulkAssign}
                data-testid="button-bulk-assign"
              >
                <UserCheck className="h-3 w-3" /> Assign
              </Button>
            </div>

            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs gap-1 ml-auto"
              onClick={() => setSelectedIds(new Set())}
              data-testid="button-clear-selection"
            >
              <X className="h-3 w-3" /> Clear
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : complaints.length === 0 ? (
        <Card className="bg-muted/30">
          <CardContent className="py-12 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {overdueOnly
                ? "No overdue complaints. Great work!"
                : "No complaints match the current filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(v) => toggleSelectAll(v === true)}
                    aria-label="Select all"
                    data-testid="checkbox-select-all"
                  />
                </TableHead>
                <TableHead className="w-36 text-xs uppercase tracking-wider">
                  Complaint #
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider">
                  Title
                </TableHead>
                <TableHead className="w-44 text-xs uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="w-24 text-xs uppercase tracking-wider">
                  Priority
                </TableHead>
                <TableHead className="hidden lg:table-cell text-xs uppercase tracking-wider">
                  District
                </TableHead>
                <TableHead className="hidden xl:table-cell text-xs uppercase tracking-wider">
                  Department
                </TableHead>
                <TableHead className="w-28 text-xs uppercase tracking-wider">
                  Filed
                </TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {complaints.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/admin/complaints/${c.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(c.id)}
                      onCheckedChange={(v) => toggleSelect(c.id, v === true)}
                      aria-label={`Select complaint ${c.complaintNumber}`}
                      data-testid={`checkbox-select-${c.id}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {c.complaintNumber}
                  </TableCell>
                  <TableCell className="max-w-[320px]">
                    <span className="font-medium text-sm truncate block">
                      {c.title}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <StatusBadge status={c.status} />
                      {c.isOverdue && (
                        <Badge
                          className="bg-red-600 text-white border-transparent text-[10px] px-1.5 py-0 gap-0.5"
                          data-testid={`badge-overdue-${c.id}`}
                        >
                          <AlarmClock className="h-2.5 w-2.5" /> Overdue
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={c.priority} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {c.districtName ?? "—"}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                    {c.departmentName ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/complaints/${c.id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                      >
                        View <ChevronRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
