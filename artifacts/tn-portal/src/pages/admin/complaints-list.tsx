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
    <div className="space-y-6">
      <PageHeader
        title="Complaint Registry"
        description={`${data?.total ?? 0} ${overdueOnly ? "OVERDUE" : "TOTAL"} FILES IN YOUR JURISDICTION`}
      />

      <div className="flex gap-3 items-center flex-wrap bg-stone-100 p-3 border-2 border-stone-200">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px] h-10 text-xs font-bold uppercase tracking-wider rounded-none border-2 bg-white" data-testid="filter-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-none border-2">
            <SelectItem value="all" className="font-bold">ALL STATUSES</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value} className="font-bold uppercase text-xs tracking-wider">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[180px] h-10 text-xs font-bold uppercase tracking-wider rounded-none border-2 bg-white" data-testid="filter-priority">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent className="rounded-none border-2">
            <SelectItem value="all" className="font-bold">ALL PRIORITIES</SelectItem>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value} className="font-bold uppercase text-xs tracking-wider">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={overdueOnly ? "destructive" : "outline"}
          className="h-10 gap-2 font-bold uppercase tracking-wider text-xs rounded-none border-2 bg-white data-[state=active]:bg-red-600 data-[state=active]:text-white"
          onClick={() => setOverdueOnly((v) => !v)}
          data-testid="filter-overdue"
          data-state={overdueOnly ? "active" : "inactive"}
        >
          <AlarmClock className="h-4 w-4" />
          Overdue Files {overdueCount > 0 && `(${overdueCount})`}
        </Button>
      </div>

      {selectedIds.size > 0 && (
        <div className="border-4 border-primary bg-primary/5 p-4 flex items-center gap-4 flex-wrap shadow-[4px_4px_0px_0px_rgba(234,88,12,0.15)] animate-in slide-in-from-top-2">
          <span className="text-sm font-black uppercase tracking-widest text-primary" data-testid="text-selected-count">
            {selectedIds.size} FILES SELECTED
          </span>

          <div className="h-6 w-px bg-primary/20 mx-2" />

          <div className="flex items-center gap-2">
            <Select value={bulkStatus} onValueChange={setBulkStatus}>
              <SelectTrigger className="w-[200px] h-10 text-xs font-bold uppercase tracking-wider bg-white rounded-none border-2 border-primary/40 focus:border-primary" data-testid="select-bulk-status">
                <SelectValue placeholder="SET STATUS TO…" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-2 border-primary">
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="font-bold uppercase text-xs tracking-wider">{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="h-10 text-xs font-bold uppercase tracking-wider gap-2 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
              disabled={!bulkStatus || bulkAction.isPending}
              onClick={applyBulkStatus}
              data-testid="button-bulk-status"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Execute
            </Button>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Select value={bulkOfficer} onValueChange={setBulkOfficer}>
              <SelectTrigger className="w-[240px] h-10 text-xs font-bold uppercase tracking-wider bg-white rounded-none border-2 border-primary/40 focus:border-primary" data-testid="select-bulk-officer">
                <SelectValue placeholder="ASSIGN TO OFFICER…" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-2 border-primary">
                {(officers ?? []).map((o) => (
                  <SelectItem key={o.id} value={String(o.id)} className="font-bold text-xs uppercase tracking-wider">{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="h-10 text-xs font-bold uppercase tracking-wider gap-2 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
              disabled={!bulkOfficer || bulkAction.isPending}
              onClick={applyBulkAssign}
              data-testid="button-bulk-assign"
            >
              <UserCheck className="h-3.5 w-3.5" /> Assign
            </Button>
          </div>

          <Button
            variant="ghost"
            className="h-10 text-xs font-bold uppercase tracking-wider gap-2 ml-auto text-stone-500 hover:text-stone-900 rounded-none"
            onClick={() => setSelectedIds(new Set())}
            data-testid="button-clear-selection"
          >
            <X className="h-4 w-4" /> Clear Batch
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>
      ) : complaints.length === 0 ? (
        <div className="border-4 border-dashed border-stone-300 p-16 text-center text-stone-500">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm font-bold uppercase tracking-wider">
            {overdueOnly
              ? "No overdue files matching criteria."
              : "Registry is empty for current filters."}
          </p>
        </div>
      ) : (
        <div className="border-2 border-stone-300 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
          <Table>
            <TableHeader className="bg-stone-100 border-b-2 border-stone-300">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 text-center p-0">
                  <div className="flex justify-center items-center h-full w-full">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(v) => toggleSelectAll(v === true)}
                      aria-label="Select all"
                      data-testid="checkbox-select-all"
                      className="rounded-none border-2 border-stone-400 data-[state=checked]:border-primary"
                    />
                  </div>
                </TableHead>
                <TableHead className="w-36 text-xs font-black uppercase tracking-widest text-stone-700">
                  File No.
                </TableHead>
                <TableHead className="text-xs font-black uppercase tracking-widest text-stone-700">
                  Subject
                </TableHead>
                <TableHead className="w-48 text-xs font-black uppercase tracking-widest text-stone-700">
                  Status
                </TableHead>
                <TableHead className="w-32 text-xs font-black uppercase tracking-widest text-stone-700">
                  Priority
                </TableHead>
                <TableHead className="hidden lg:table-cell text-xs font-black uppercase tracking-widest text-stone-700">
                  Jurisdiction
                </TableHead>
                <TableHead className="w-32 text-xs font-black uppercase tracking-widest text-stone-700">
                  Filed On
                </TableHead>
                <TableHead className="w-24 text-right pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {complaints.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer border-b border-stone-200 hover:bg-stone-50 group"
                  onClick={() => navigate(`/admin/complaints/${c.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()} className="text-center p-0">
                    <div className="flex justify-center items-center h-full w-full p-2">
                      <Checkbox
                        checked={selectedIds.has(c.id)}
                        onCheckedChange={(v) => toggleSelect(c.id, v === true)}
                        aria-label={`Select complaint ${c.complaintNumber}`}
                        data-testid={`checkbox-select-${c.id}`}
                        className="rounded-none border-2 border-stone-300 data-[state=checked]:border-primary"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-stone-600 group-hover:text-primary transition-colors">
                    {c.complaintNumber}
                  </TableCell>
                  <TableCell className="max-w-[320px]">
                    <span className="font-serif font-bold text-base text-stone-900 truncate block">
                      {c.title}
                    </span>
                    {c.departmentName && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mt-1 block truncate">
                        {c.departmentName}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <StatusBadge status={c.status} />
                      {c.isOverdue && (
                        <Badge
                          className="rounded-none bg-red-600 text-white border-red-800 text-[10px] px-1.5 py-0 font-bold uppercase tracking-widest gap-1 border-2"
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
                    <div className="text-xs font-bold uppercase tracking-wider text-stone-600">
                      {c.districtName ?? "—"}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-bold font-mono text-stone-600">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <Link
                      href={`/admin/complaints/${c.id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-[10px] font-bold uppercase tracking-widest gap-1 rounded-none border-2 border-transparent group-hover:border-stone-300 group-hover:bg-white"
                      >
                        Open <ChevronRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
