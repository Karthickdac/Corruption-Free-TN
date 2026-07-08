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
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, Users, CheckCircle, Clock, XCircle, Search, RefreshCw,
  AlertTriangle, ChevronRight, UserCheck, AlarmClock, MapPin, Building2, Calendar
} from "lucide-react";
import { OFFICER_ROLES } from "@/constants/roles";
import {
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Operations Dashboard"
        description={`Welcome back, ${user?.name ?? "Officer"}. Here is your overview.`}
      />

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            { label: "Submitted", value: stats.submitted, icon: <FileText className="h-5 w-5" />, color: "bg-stone-50 text-stone-700 border-stone-200" },
            { label: "Under Review", value: stats.under_review, icon: <Clock className="h-5 w-5" />, color: "bg-amber-50 text-amber-700 border-amber-200" },
            { label: "Investigation", value: stats.investigation, icon: <Search className="h-5 w-5" />, color: "bg-orange-50 text-orange-700 border-orange-200" },
            { label: "Action Taken", value: stats.action_taken, icon: <CheckCircle className="h-5 w-5" />, color: "bg-teal-50 text-teal-700 border-teal-200" },
            { label: "Closed", value: stats.closed, icon: <CheckCircle className="h-5 w-5" />, color: "bg-stone-100 text-stone-700 border-stone-200" },
            { label: "Rejected", value: stats.rejected, icon: <XCircle className="h-5 w-5" />, color: "bg-red-50 text-red-700 border-red-200" },
            { label: "Overdue", value: stats.overdue ?? 0, icon: <AlarmClock className="h-5 w-5" />, color: "bg-destructive text-destructive-foreground border-destructive shadow-md", highlight: (stats.overdue ?? 0) > 0 },
          ].map((stat) => (
            <Card
              key={stat.label}
              className={`rounded-2xl border transition-all duration-300 hover:shadow-md hover:-transtone-y-0.5 ${stat.color}`}
              data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}
            >
              <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
                <div className="flex items-center justify-between opacity-80">
                  <span className="text-xs font-semibold tracking-wide">{stat.label}</span>
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 bg-card p-2 rounded-xl border border-border shadow-sm">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-background border-transparent hover:bg-accent/50 transition-colors rounded-lg">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="w-px h-6 bg-border/50 hidden sm:block" />
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[180px] bg-background border-transparent hover:bg-accent/50 transition-colors rounded-lg">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <div className="w-px h-6 bg-border/50 hidden sm:block" />
        <Button
          variant={assignedToMe ? "secondary" : "ghost"}
          size="sm"
          className={`h-9 gap-2 rounded-lg font-medium transition-all ${assignedToMe ? "bg-primary/10 text-primary hover:bg-primary/20" : ""}`}
          onClick={() => setAssignedToMe(!assignedToMe)}
        >
          <UserCheck className="h-4 w-4" />
          Assigned to Me
        </Button>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-2 rounded-lg font-medium text-muted-foreground hover:text-foreground"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["getDashboardComplaints"] })}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : complaints.length === 0 ? (
        <div className="border border-dashed border-border/60 rounded-2xl p-16 text-center bg-card shadow-sm">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No complaints found</h3>
          <p className="text-sm text-muted-foreground">Adjust your filters to see more results.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Recent Activity</h2>
          <div className="grid gap-4">
            {complaints.map((c) => (
              <Card key={c.id} className="overflow-hidden rounded-2xl border-border/40 shadow-sm hover:shadow-md transition-all duration-300 group">
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row items-stretch">
                    <div className="p-5 flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-3">
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
                          {c.complaintNumber}
                        </span>
                        <StatusBadge status={c.status} />
                        <PriorityBadge priority={c.priority} />
                        <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-md">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(c.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-foreground line-clamp-2 mb-4 group-hover:text-primary transition-colors">
                        {c.title}
                      </h3>
                      
                      <div className="flex items-center gap-x-6 gap-y-2 text-sm text-muted-foreground flex-wrap">
                        {c.districtName && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-border" /> 
                            {c.districtName}
                          </span>
                        )}
                        {c.departmentName && (
                          <span className="flex items-center gap-1.5">
                            <Building2 className="h-4 w-4 text-border" /> 
                            {c.departmentName}
                          </span>
                        )}
                        {c.assignedOfficerName && (
                          <span className="flex items-center gap-1.5 text-primary bg-primary/5 px-2 py-0.5 rounded-md font-medium">
                            <UserCheck className="h-4 w-4" />
                            {c.assignedOfficerName}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex lg:flex-col items-stretch bg-muted/20 lg:w-48 border-t lg:border-t-0 lg:border-l border-border/40 shrink-0">
                      <Button
                        variant="ghost"
                        className="flex-1 rounded-none lg:border-b border-r lg:border-r-0 border-border/40 h-full min-h-[3.5rem] font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        onClick={() => {
                          setSelectedComplaint({ id: c.id, status: c.status, title: c.title });
                          setNewStatus("");
                          setStatusDialogOpen(true);
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Update Status
                      </Button>
                      <Button
                        variant="ghost"
                        className="flex-1 rounded-none border-r lg:border-r-0 lg:border-b border-border/40 h-full min-h-[3.5rem] font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        onClick={() => {
                          setSelectedComplaint({ id: c.id, status: c.status, title: c.title });
                          setAssignDialogOpen(true);
                        }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Assign
                      </Button>
                      <Link href={`/admin/complaints/${c.id}`} className="flex-1 flex">
                        <Button variant="ghost" className="flex-1 rounded-none h-full min-h-[3.5rem] font-medium text-primary hover:bg-primary/10 hover:text-primary">
                          View Details <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-border/50 shadow-xl">
          <DialogHeader className="px-6 py-4 bg-muted/30 border-b border-border/50">
            <DialogTitle className="text-lg font-semibold">Update Status</DialogTitle>
          </DialogHeader>
          {selectedComplaint && (
            <div className="p-6 space-y-6">
              <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                <p className="text-sm font-medium text-foreground line-clamp-2 mb-3">{selectedComplaint.title}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Current</span>
                  <StatusBadge status={selectedComplaint.status} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">New Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="rounded-xl h-11 transition-colors">
                    <SelectValue placeholder="Select new status..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {(ALLOWED_TRANSITIONS[selectedComplaint.status] ?? []).map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABELS[s] ?? s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Note (Optional)</label>
                <Textarea
                  placeholder="Reason for status change..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                  className="rounded-xl resize-none transition-colors"
                />
              </div>
            </div>
          )}
          <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border/50 sm:justify-between">
            <Button variant="ghost" className="rounded-xl font-medium" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl font-medium shadow-sm"
              disabled={!newStatus || updateStatus.isPending}
              onClick={() => {
                if (!selectedComplaint || !newStatus) return;
                updateStatus.mutate({
                  complaintId: selectedComplaint.id,
                  data: { status: newStatus, note: statusNote || undefined },
                });
              }}
            >
              {updateStatus.isPending ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-border/50 shadow-xl">
          <DialogHeader className="px-6 py-4 bg-muted/30 border-b border-border/50">
            <DialogTitle className="text-lg font-semibold">Assign Officer</DialogTitle>
          </DialogHeader>
          {selectedComplaint && (
            <div className="p-6 space-y-6">
              <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                <p className="text-sm font-medium text-foreground line-clamp-2 mb-2">{selectedComplaint.title}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono bg-muted inline-flex px-2 py-0.5 rounded-md">ID: {selectedComplaint.id}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Select Officer</label>
                <Select value={selectedOfficer} onValueChange={setSelectedOfficer}>
                  <SelectTrigger className="rounded-xl h-11 transition-colors">
                    <SelectValue placeholder="Select officer..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {(officersData ?? []).map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.name ?? u.email ?? `Officer #${u.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Assignment Note (Optional)</label>
                <Textarea
                  placeholder="Instructions for the assigned officer..."
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  rows={3}
                  className="rounded-xl resize-none transition-colors"
                />
              </div>
            </div>
          )}
          <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border/50 sm:justify-between">
            <Button variant="ghost" className="rounded-xl font-medium" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl font-medium shadow-sm"
              disabled={!selectedOfficer || assignComplaint.isPending}
              onClick={() => {
                if (!selectedComplaint || !selectedOfficer) return;
                assignComplaint.mutate({
                  complaintId: selectedComplaint.id,
                  data: { officerUserId: Number(selectedOfficer), note: assignNote || undefined },
                });
              }}
            >
              {assignComplaint.isPending ? "Assigning..." : "Assign Complaint"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
