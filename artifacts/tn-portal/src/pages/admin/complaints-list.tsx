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
import { ChevronLeft, ChevronRight, FileText, AlarmClock, X, UserCheck, RefreshCw, Settings2 } from "lucide-react";
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
  const [page, setPage] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    setSelectedIds(new Set());
    setPage(0);
  }, [statusFilter, priorityFilter, overdueOnly]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [page]);

  const params: GetDashboardComplaintsParams = {
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(priorityFilter !== "all" ? { priority: priorityFilter } : {}),
    ...(overdueOnly ? { overdue: true } : {}),
    limit: pageSize,
    offset: page * pageSize,
  };

  const { data, isLoading } = useGetDashboardComplaints(params, {
    query: {
      staleTime: 30000,
      queryKey: getGetDashboardComplaintsQueryKey(params),
    },
  });
  const complaints = data?.complaints ?? [];
  const overdueCount = data?.stats?.overdue ?? 0;
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  useEffect(() => {
    if (!isLoading && page > 0 && page * pageSize >= total) {
      setPage(Math.max(0, Math.ceil(total / pageSize) - 1));
    }
  }, [isLoading, page, total]);

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
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Complaint Registry"
        description={`${data?.total ?? 0} ${overdueOnly ? "Overdue" : "Total"} Files in your jurisdiction`}
      />

      <div className="flex gap-3 items-center flex-wrap bg-card p-2 rounded-xl border shadow-sm">
        <div className="flex items-center pl-3 pr-1 text-muted-foreground">
          <Settings2 className="h-4 w-4" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-background border-transparent hover:bg-accent/50 transition-colors rounded-lg" data-testid="filter-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="w-px h-6 bg-border/50 hidden sm:block" />

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[180px] bg-background border-transparent hover:bg-accent/50 transition-colors rounded-lg" data-testid="filter-priority">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Priorities</SelectItem>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="w-px h-6 bg-border/50 hidden sm:block" />

        <Button
          variant={overdueOnly ? "destructive" : "ghost"}
          className={`h-9 gap-2 font-medium rounded-lg transition-colors ${overdueOnly ? "shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => setOverdueOnly((v) => !v)}
          data-testid="filter-overdue"
        >
          <AlarmClock className="h-4 w-4" />
          Overdue {overdueCount > 0 && `(${overdueCount})`}
        </Button>
      </div>

      {selectedIds.size > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-4 flex-wrap shadow-sm animate-in slide-in-from-top-2 duration-300">
          <span className="text-sm font-semibold text-primary" data-testid="text-selected-count">
            {selectedIds.size} files selected
          </span>

          <div className="h-6 w-px bg-primary/20 mx-2 hidden sm:block" />

          <div className="flex items-center gap-2">
            <Select value={bulkStatus} onValueChange={setBulkStatus}>
              <SelectTrigger className="w-[180px] h-9 bg-background rounded-lg border-primary/20 hover:border-primary/40 focus:ring-primary" data-testid="select-bulk-status">
                <SelectValue placeholder="Set status..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="h-9 gap-1.5 rounded-lg shadow-sm"
              disabled={!bulkStatus || bulkAction.isPending}
              onClick={applyBulkStatus}
              data-testid="button-bulk-status"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Execute
            </Button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Select value={bulkOfficer} onValueChange={setBulkOfficer}>
              <SelectTrigger className="w-[200px] h-9 bg-background rounded-lg border-primary/20 hover:border-primary/40 focus:ring-primary" data-testid="select-bulk-officer">
                <SelectValue placeholder="Assign officer..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {(officers ?? []).map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="h-9 gap-1.5 rounded-lg shadow-sm"
              disabled={!bulkOfficer || bulkAction.isPending}
              onClick={applyBulkAssign}
              data-testid="button-bulk-assign"
            >
              <UserCheck className="h-3.5 w-3.5" /> Assign
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 text-muted-foreground hover:text-foreground rounded-lg ml-2"
            onClick={() => setSelectedIds(new Set())}
            data-testid="button-clear-selection"
          >
            <X className="h-4 w-4" /> Clear
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : complaints.length === 0 ? (
        <div className="border border-dashed border-border/60 rounded-2xl p-16 text-center bg-card shadow-sm">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">
            {overdueOnly ? "No overdue files" : "Registry empty"}
          </h3>
          <p className="text-sm text-muted-foreground">Adjust your filters to see more results.</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-b-border/60">
                <TableHead className="w-12 text-center">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(v) => toggleSelectAll(v === true)}
                    aria-label="Select all"
                    data-testid="checkbox-select-all"
                    className="rounded text-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </TableHead>
                <TableHead className="w-32 text-xs font-semibold text-muted-foreground">File No.</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Subject</TableHead>
                <TableHead className="w-40 text-xs font-semibold text-muted-foreground">Status</TableHead>
                <TableHead className="w-28 text-xs font-semibold text-muted-foreground">Priority</TableHead>
                <TableHead className="hidden lg:table-cell text-xs font-semibold text-muted-foreground">Jurisdiction</TableHead>
                <TableHead className="w-32 text-xs font-semibold text-muted-foreground">Filed On</TableHead>
                <TableHead className="w-20 text-right pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {complaints.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer border-b-border/40 hover:bg-muted/30 transition-colors group"
                  onClick={() => navigate(`/admin/complaints/${c.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()} className="text-center">
                    <Checkbox
                      checked={selectedIds.has(c.id)}
                      onCheckedChange={(v) => toggleSelect(c.id, v === true)}
                      aria-label={`Select complaint ${c.complaintNumber}`}
                      data-testid={`checkbox-select-${c.id}`}
                      className="rounded text-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                    {c.complaintNumber}
                  </TableCell>
                  <TableCell className="max-w-[320px]">
                    <span className="font-semibold text-sm text-foreground truncate block">
                      {c.title}
                    </span>
                    {c.departmentName && (
                      <span className="text-xs text-muted-foreground mt-0.5 block truncate">
                        {c.departmentName}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1.5">
                      <StatusBadge status={c.status} />
                      {c.isOverdue && (
                        <Badge
                          variant="destructive"
                          className="rounded-full text-[10px] px-2 py-0 font-medium gap-1 shadow-sm"
                          data-testid={`badge-overdue-${c.id}`}
                        >
                          <AlarmClock className="h-3 w-3" /> SLA Breach
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={c.priority} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="text-sm font-medium text-muted-foreground">
                      {c.districtName ?? "—"}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                      onClick={(e) => { e.stopPropagation(); navigate(`/admin/complaints/${c.id}`); }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10 border-border/60 hover:bg-muted"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            data-testid="button-prev-page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-muted-foreground" data-testid="text-page-info">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10 border-border/60 hover:bg-muted"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            data-testid="button-next-page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
