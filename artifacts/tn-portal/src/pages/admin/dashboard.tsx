import { useState } from "react";
import { Link } from "wouter";
import AdminLayout, { RoleGate } from "@/components/admin-layout";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  useGetDashboardComplaints,
  useUpdateComplaintStatus,
  useAssignComplaint,
  getGetDashboardComplaintsQueryKey,
  useListAssignableOfficers,
  getListAssignableOfficersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, Users, CheckCircle, Clock, XCircle, Search, RefreshCw,
  AlertTriangle, ChevronRight, UserCheck, AlarmClock,
} from "lucide-react";
import { OFFICER_ROLES } from "@/constants/roles";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  ALLOWED_TRANSITIONS,
} from "@/constants/complaint-workflow";
import { StatusBadge, PriorityBadge } from "@/components/admin/status-badge";
import { PageHeader } from "@/components/admin/page-header";

export default function AdminDashboard() {
  return (
    <RoleGate roles={OFFICER_ROLES}>
      <AdminLayout>
        <DashboardContent />
      </AdminLayout>
    </RoleGate>
  );
}

function DashboardContent() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<{ id: number; status: string; title: string } | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [selectedOfficer, setSelectedOfficer] = useState("");
  const [assignNote, setAssignNote] = useState("");

  const { data, isLoading } = useGetDashboardComplaints(
    {
      status: statusFilter !== "all" ? statusFilter : undefined,
      priority: priorityFilter !== "all" ? priorityFilter : undefined,
      assignedToMe: assignedToMe || undefined,
    },
    { query: { queryKey: getGetDashboardComplaintsQueryKey({ status: statusFilter !== "all" ? statusFilter : undefined, priority: priorityFilter !== "all" ? priorityFilter : undefined, assignedToMe: assignedToMe || undefined }) } },
  );

  const { data: officersData } = useListAssignableOfficers(
    { query: { staleTime: 60000, queryKey: getListAssignableOfficersQueryKey() } },
  );

  const updateStatus = useUpdateComplaintStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["getDashboardComplaints"] });
        toast({ title: "Status updated successfully" });
        setStatusDialogOpen(false);
        setStatusNote("");
      },
      onError: (err: { message?: string }) => {
        toast({ title: "Failed to update status", description: err?.message, variant: "destructive" });
      },
    },
  });

  const assignComplaint = useAssignComplaint({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["getDashboardComplaints"] });
        toast({ title: "Complaint assigned successfully" });
        setAssignDialogOpen(false);
        setAssignNote("");
        setSelectedOfficer("");
      },
      onError: (err: { message?: string }) => {
        toast({ title: "Failed to assign", description: err?.message, variant: "destructive" });
      },
    },
  });

  const stats = data?.stats;
  const complaints = data?.complaints ?? [];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Officer Dashboard"
        description={`Welcome back, ${user?.name ?? "Officer"}`}
      />

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: "Submitted", value: stats.submitted, icon: <FileText className="h-4 w-4" />, color: "text-stone-600", highlight: false },
            { label: "Under Review", value: stats.under_review, icon: <Clock className="h-4 w-4" />, color: "text-amber-600", highlight: false },
            { label: "Investigation", value: stats.investigation, icon: <Search className="h-4 w-4" />, color: "text-orange-600", highlight: false },
            { label: "Action Taken", value: stats.action_taken, icon: <CheckCircle className="h-4 w-4" />, color: "text-green-600", highlight: false },
            { label: "Closed", value: stats.closed, icon: <CheckCircle className="h-4 w-4" />, color: "text-stone-500", highlight: false },
            { label: "Rejected", value: stats.rejected, icon: <XCircle className="h-4 w-4" />, color: "text-red-600", highlight: false },
            { label: "Overdue", value: stats.overdue ?? 0, icon: <AlarmClock className="h-4 w-4" />, color: "text-red-700", highlight: (stats.overdue ?? 0) > 0 },
          ].map((stat) => (
            <Card
              key={stat.label}
              className={stat.highlight ? "bg-red-600/5 border-red-600/30" : "bg-muted/30"}
              data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}
            >
              <CardContent className="p-3">
                <div className={`flex items-center gap-1.5 mb-1 ${stat.color}`}>
                  {stat.icon}
                  <span className="text-xs font-medium">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={assignedToMe ? "secondary" : "outline"}
          size="sm"
          className="h-8 text-xs gap-1"
          onClick={() => setAssignedToMe(!assignedToMe)}
        >
          <UserCheck className="h-3 w-3" />
          Assigned to Me
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs gap-1 ml-auto"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["getDashboardComplaints"] })}
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : complaints.length === 0 ? (
        <Card className="bg-muted/30">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No complaints found for the selected filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {complaints.map((c) => (
            <Card key={c.id} className="bg-muted/20 hover:bg-muted/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-mono text-muted-foreground">{c.complaintNumber}</span>
                      <StatusBadge status={c.status} />
                      <PriorityBadge priority={c.priority} />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground truncate">{c.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      {c.districtName && <span>{c.districtName}</span>}
                      {c.departmentName && <span>· {c.departmentName}</span>}
                      {c.assignedOfficerName && (
                        <span className="text-primary">· Assigned: {c.assignedOfficerName}</span>
                      )}
                      <span className="ml-auto">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => {
                        setSelectedComplaint({ id: c.id, status: c.status, title: c.title });
                        setNewStatus("");
                        setStatusDialogOpen(true);
                      }}
                    >
                      <RefreshCw className="h-3 w-3" />
                      Status
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => {
                        setSelectedComplaint({ id: c.id, status: c.status, title: c.title });
                        setAssignDialogOpen(true);
                      }}
                    >
                      <Users className="h-3 w-3" />
                      Assign
                    </Button>
                    <Link href={`/admin/complaints/${c.id}`}>
                      <Button variant="secondary" size="sm" className="h-7 text-xs gap-1">
                        View <ChevronRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Complaint Status</DialogTitle>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground truncate">{selectedComplaint.title}</p>
              <div className="space-y-2">
                <label className="text-xs font-medium">Current Status</label>
                <Badge className={`${STATUS_COLORS[selectedComplaint.status]}`}>
                  {STATUS_LABELS[selectedComplaint.status]}
                </Badge>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">New Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(ALLOWED_TRANSITIONS[selectedComplaint.status] ?? []).map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABELS[s] ?? s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Note (optional)</label>
                <Textarea
                  placeholder="Add a note about this status change..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!newStatus || updateStatus.isPending}
              onClick={() => {
                if (!selectedComplaint || !newStatus) return;
                updateStatus.mutate({
                  complaintId: selectedComplaint.id,
                  data: { status: newStatus, note: statusNote || undefined },
                });
              }}
            >
              {updateStatus.isPending ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Investigation Officer</DialogTitle>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground truncate">{selectedComplaint.title}</p>
              <div className="space-y-2">
                <label className="text-xs font-medium">Select Officer</label>
                <Select value={selectedOfficer} onValueChange={setSelectedOfficer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select officer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(officersData ?? []).map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.name ?? u.email ?? `Officer #${u.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Note (optional)</label>
                <Textarea
                  placeholder="Add assignment instructions..."
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!selectedOfficer || assignComplaint.isPending}
              onClick={() => {
                if (!selectedComplaint || !selectedOfficer) return;
                assignComplaint.mutate({
                  complaintId: selectedComplaint.id,
                  data: { officerUserId: Number(selectedOfficer), note: assignNote || undefined },
                });
              }}
            >
              {assignComplaint.isPending ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
