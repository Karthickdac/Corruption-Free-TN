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
    <div className="p-6 md:p-8 space-y-8">
      <PageHeader
        title="Officer Dashboard"
        description={`Welcome back, ${user?.name ?? "Officer"} | Overview`}
      />

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            { label: "Submitted", value: stats.submitted, icon: <FileText className="h-4 w-4" />, color: "text-stone-800 bg-stone-200 border-stone-300", highlight: false },
            { label: "Under Review", value: stats.under_review, icon: <Clock className="h-4 w-4" />, color: "text-amber-900 bg-amber-100 border-amber-300", highlight: false },
            { label: "Investigation", value: stats.investigation, icon: <Search className="h-4 w-4" />, color: "text-orange-900 bg-orange-100 border-orange-300", highlight: false },
            { label: "Action Taken", value: stats.action_taken, icon: <CheckCircle className="h-4 w-4" />, color: "text-emerald-900 bg-emerald-100 border-emerald-300", highlight: false },
            { label: "Closed", value: stats.closed, icon: <CheckCircle className="h-4 w-4" />, color: "text-stone-100 bg-stone-800 border-stone-900", highlight: false },
            { label: "Rejected", value: stats.rejected, icon: <XCircle className="h-4 w-4" />, color: "text-red-900 bg-red-100 border-red-300", highlight: false },
            { label: "Overdue", value: stats.overdue ?? 0, icon: <AlarmClock className="h-4 w-4" />, color: "text-white bg-red-600 border-red-800", highlight: (stats.overdue ?? 0) > 0 },
          ].map((stat) => (
            <Card
              key={stat.label}
              className={`rounded-none border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] ${stat.color} transition-all hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)]`}
              data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2 opacity-80">
                  {stat.icon}
                  <span className="text-[10px] uppercase font-bold tracking-wider">{stat.label}</span>
                </div>
                <div className="text-3xl font-black font-mono">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 bg-stone-100 p-3 border-2 border-stone-200">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-10 text-xs font-bold uppercase rounded-none border-2">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36 h-10 text-xs font-bold uppercase rounded-none border-2">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={assignedToMe ? "default" : "outline"}
          size="sm"
          className="h-10 text-xs font-bold uppercase tracking-wider gap-2 rounded-none border-2"
          onClick={() => setAssignedToMe(!assignedToMe)}
        >
          <UserCheck className="h-4 w-4" />
          Assigned to Me
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-10 text-xs font-bold uppercase tracking-wider gap-2 ml-auto rounded-none hover:bg-stone-200"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["getDashboardComplaints"] })}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>
      ) : complaints.length === 0 ? (
        <div className="border-4 border-dashed border-stone-300 p-12 text-center text-stone-500">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm font-bold uppercase tracking-wider">No active complaints found for the selected parameters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-black uppercase tracking-widest text-stone-800 border-b-2 border-stone-200 pb-2">Recent Activity</h2>
          {complaints.map((c) => (
            <Card key={c.id} className="rounded-none border-2 border-stone-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:border-stone-400 transition-colors bg-white">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row items-stretch">
                  <div className="p-4 flex-1 min-w-0 border-b sm:border-b-0 sm:border-r border-stone-200">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <span className="text-xs font-mono font-bold bg-stone-100 px-2 py-1 border border-stone-300">{c.complaintNumber}</span>
                      <StatusBadge status={c.status} />
                      <PriorityBadge priority={c.priority} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 ml-auto">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-stone-900 line-clamp-2 mb-2">{c.title}</h3>
                    <div className="flex items-center gap-x-4 gap-y-2 mt-2 text-xs font-medium text-stone-600 flex-wrap uppercase tracking-wider">
                      {c.districtName && <span className="flex items-center gap-1"><span className="text-stone-400">Dist:</span> {c.districtName}</span>}
                      {c.departmentName && <span className="flex items-center gap-1"><span className="text-stone-400">Dept:</span> {c.departmentName}</span>}
                      {c.assignedOfficerName && (
                        <span className="flex items-center gap-1 text-primary">
                          <UserCheck className="h-3 w-3" />
                          {c.assignedOfficerName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-stretch justify-center bg-stone-50 sm:w-40 border-stone-200 shrink-0">
                    <Button
                      variant="ghost"
                      className="flex-1 rounded-none border-r sm:border-r-0 sm:border-b border-stone-200 h-full min-h-[3rem] text-xs font-bold uppercase tracking-wider gap-2 hover:bg-stone-200 hover:text-stone-900"
                      onClick={() => {
                        setSelectedComplaint({ id: c.id, status: c.status, title: c.title });
                        setNewStatus("");
                        setStatusDialogOpen(true);
                      }}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Status
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex-1 rounded-none border-r sm:border-r-0 sm:border-b border-stone-200 h-full min-h-[3rem] text-xs font-bold uppercase tracking-wider gap-2 hover:bg-stone-200 hover:text-stone-900"
                      onClick={() => {
                        setSelectedComplaint({ id: c.id, status: c.status, title: c.title });
                        setAssignDialogOpen(true);
                      }}
                    >
                      <Users className="h-3.5 w-3.5" />
                      Assign
                    </Button>
                    <Link href={`/admin/complaints/${c.id}`} className="flex-1 flex">
                      <Button variant="ghost" className="flex-1 rounded-none h-full min-h-[3rem] text-xs font-bold uppercase tracking-wider gap-2 text-primary hover:bg-primary/10 hover:text-primary">
                        View File <ChevronRight className="h-3.5 w-3.5" />
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
        <DialogContent className="rounded-none border-4 border-stone-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] sm:max-w-md">
          <DialogHeader className="border-b-2 border-stone-200 pb-4">
            <DialogTitle className="font-serif text-xl uppercase tracking-wider font-black">Update Status</DialogTitle>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-6 pt-4">
              <div className="bg-stone-100 p-3 border border-stone-200">
                <p className="text-sm font-bold text-stone-800 truncate mb-2">{selectedComplaint.title}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Current:</span>
                  <StatusBadge status={selectedComplaint.status} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">New Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="rounded-none border-2 h-10">
                    <SelectValue placeholder="Select new status..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2">
                    {(ALLOWED_TRANSITIONS[selectedComplaint.status] ?? []).map((s) => (
                      <SelectItem key={s} value={s} className="font-medium">{STATUS_LABELS[s] ?? s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">Note (Optional)</label>
                <Textarea
                  placeholder="Reason for status change..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                  className="rounded-none border-2 resize-none"
                />
              </div>
            </div>
          )}
          <DialogFooter className="pt-4 border-t-2 border-stone-200 sm:justify-between">
            <Button variant="outline" className="rounded-none border-2 font-bold uppercase tracking-wider" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
            <Button
              className="rounded-none font-bold uppercase tracking-wider"
              disabled={!newStatus || updateStatus.isPending}
              onClick={() => {
                if (!selectedComplaint || !newStatus) return;
                updateStatus.mutate({
                  complaintId: selectedComplaint.id,
                  data: { status: newStatus, note: statusNote || undefined },
                });
              }}
            >
              {updateStatus.isPending ? "Updating..." : "Confirm Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="rounded-none border-4 border-stone-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] sm:max-w-md">
          <DialogHeader className="border-b-2 border-stone-200 pb-4">
            <DialogTitle className="font-serif text-xl uppercase tracking-wider font-black">Assign Officer</DialogTitle>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-6 pt-4">
              <div className="bg-stone-100 p-3 border border-stone-200">
                <p className="text-sm font-bold text-stone-800 truncate mb-1">{selectedComplaint.title}</p>
                <p className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Complaint ID: {selectedComplaint.id}</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">Select Officer</label>
                <Select value={selectedOfficer} onValueChange={setSelectedOfficer}>
                  <SelectTrigger className="rounded-none border-2 h-10">
                    <SelectValue placeholder="Select officer..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2">
                    {(officersData ?? []).map((u) => (
                      <SelectItem key={u.id} value={String(u.id)} className="font-medium">
                        {u.name ?? u.email ?? `Officer #${u.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">Assignment Note (Optional)</label>
                <Textarea
                  placeholder="Instructions for the assigned officer..."
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  rows={2}
                  className="rounded-none border-2 resize-none"
                />
              </div>
            </div>
          )}
          <DialogFooter className="pt-4 border-t-2 border-stone-200 sm:justify-between">
            <Button variant="outline" className="rounded-none border-2 font-bold uppercase tracking-wider" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button
              className="rounded-none font-bold uppercase tracking-wider"
              disabled={!selectedOfficer || assignComplaint.isPending}
              onClick={() => {
                if (!selectedComplaint || !selectedOfficer) return;
                assignComplaint.mutate({
                  complaintId: selectedComplaint.id,
                  data: { officerUserId: Number(selectedOfficer), note: assignNote || undefined },
                });
              }}
            >
              {assignComplaint.isPending ? "Assigning..." : "Confirm Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
