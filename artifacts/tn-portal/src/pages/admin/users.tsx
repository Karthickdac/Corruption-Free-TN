import { useState } from "react";
import AdminLayout, { RoleGate } from "@/components/admin-layout";
import { ADMIN_ROLES, ROLE_LABELS } from "@/constants/roles";
import {
  useListAdminUsers,
  useUpdateUserRole,
  useListDepartments,
  useListDistricts,
  getListAdminUsersQueryKey,
} from "@workspace/api-client-react";
import { UpdateUserRoleInputRole } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, Edit, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";

const ALL_ROLES = Object.keys(ROLE_LABELS);

const ROLE_COLORS: Record<string, string> = {
  citizen: "bg-stone-100 text-stone-600 border-stone-200",
  super_admin: "bg-red-100 text-red-700 border-red-200",
  state_administrator: "bg-orange-100 text-orange-700 border-orange-200",
  investigation_officer: "bg-rose-100 text-rose-700 border-rose-200",
  department_officer: "bg-amber-100 text-amber-700 border-amber-200",
  district_officer: "bg-lime-100 text-lime-700 border-lime-200",
  auditor: "bg-emerald-100 text-emerald-700 border-emerald-200",
  moderator: "bg-yellow-100 text-yellow-700 border-yellow-200",
  legal_officer: "bg-pink-100 text-pink-700 border-pink-200",
};

export default function AdminUsers() {
  return (
    <RoleGate roles={ADMIN_ROLES}>
      <AdminLayout>
        <UsersContent />
      </AdminLayout>
    </RoleGate>
  );
}

function UsersContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(0);
  const limit = 24;

  const [editUser, setEditUser] = useState<{
    id: number; name: string | null; email: string | null; role: string;
    departmentId: number | null; districtId: number | null;
  } | null>(null);
  const [newRole, setNewRole] = useState("");
  const [newDeptId, setNewDeptId] = useState<string>("");
  const [newDistrictId, setNewDistrictId] = useState<string>("");

  const { data, isLoading } = useListAdminUsers(
    {
      role: roleFilter !== "all" ? roleFilter : undefined,
      limit,
      offset: page * limit,
    },
    {
      query: {
        queryKey: getListAdminUsersQueryKey({ role: roleFilter !== "all" ? roleFilter : undefined, limit, offset: page * limit }),
      },
    },
  );

  const { data: departments } = useListDepartments(
    {},
    { query: { staleTime: 300000, queryKey: ["listDepartments"] } },
  );
  const { data: districts } = useListDistricts(
    { query: { staleTime: 300000, queryKey: ["listDistricts"] } },
  );

  const updateRole = useUpdateUserRole({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["listAdminUsers"] });
        toast({ title: "User clearance updated" });
        setEditUser(null);
      },
      onError: (err: { message?: string }) => {
        toast({ title: "Update failed", description: err?.message, variant: "destructive" });
      },
    },
  });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Personnel Registry"
        description={`Manage designations and access for ${total} registered personnel`}
      />

      <div className="flex gap-4 items-center bg-card p-2 rounded-xl border border-border/60 shadow-sm">
        <div className="pl-3 pr-1 text-muted-foreground">
          <Search className="h-4 w-4" />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[240px] bg-background border-transparent hover:bg-accent/50 transition-colors rounded-lg h-9">
            <SelectValue placeholder="Filter by designation" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Designations</SelectItem>
            {ALL_ROLES.map((r) => (
              <SelectItem key={r} value={r}>{ROLE_LABELS[r] ?? r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : users.length === 0 ? (
        <div className="border border-dashed border-border/60 rounded-2xl p-16 text-center text-muted-foreground bg-card shadow-sm">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium text-foreground mb-1">No personnel found</p>
          <p className="text-sm">Adjust filters to see more results.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {users.map((u) => (
              <Card key={u.id} className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group">
                <CardContent className="p-0 flex flex-col flex-1">
                  <div className="p-5 flex-1 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                        {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <Badge className={`rounded-full text-[10px] px-2 py-0.5 font-medium border whitespace-nowrap shadow-none ${ROLE_COLORS[u.role] ?? "bg-stone-100 text-stone-600 border-stone-200"}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="font-semibold text-base text-foreground truncate">{u.name ?? "Unknown Officer"}</h3>
                      <div className="text-sm text-muted-foreground truncate mt-0.5">
                        {u.email ?? "No contact on file"}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground/80 font-medium">
                      Joined {new Date(u.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="p-3 bg-muted/20 border-t border-border/40 mt-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full rounded-xl h-9 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 gap-2 transition-colors"
                      onClick={() => {
                        setEditUser({
                          id: u.id,
                          name: u.name ?? null,
                          email: u.email ?? null,
                          role: u.role,
                          departmentId: u.departmentId ?? null,
                          districtId: u.districtId ?? null,
                        });
                        setNewRole(u.role);
                        setNewDeptId(u.departmentId ? String(u.departmentId) : "none");
                        setNewDistrictId(u.districtId ? String(u.districtId) : "none");
                      }}
                    >
                      <Edit className="h-4 w-4" /> Manage Clearance
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-10 w-10 border-border/60 hover:bg-muted"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-10 w-10 border-border/60 hover:bg-muted"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-border/50 shadow-xl">
          <DialogHeader className="px-6 py-4 bg-muted/30 border-b border-border/50">
            <DialogTitle className="text-lg font-semibold">Adjust Personnel Clearance</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="p-6 space-y-6">
              <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                <p className="font-semibold text-foreground text-sm mb-1">{editUser.name ?? "Unknown Officer"}</p>
                <p className="text-xs text-muted-foreground">{editUser.email}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Designation Level</label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="rounded-xl h-11 transition-colors">
                    <SelectValue placeholder="Select designation..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {ALL_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r] ?? r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Department Authority (Optional)</label>
                <Select value={newDeptId} onValueChange={setNewDeptId}>
                  <SelectTrigger className="rounded-xl h-11 transition-colors">
                    <SelectValue placeholder="Select department..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none" className="text-muted-foreground italic">No department assigned</SelectItem>
                    {(departments ?? []).map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">District Authority (Optional)</label>
                <Select value={newDistrictId} onValueChange={setNewDistrictId}>
                  <SelectTrigger className="rounded-xl h-11 transition-colors">
                    <SelectValue placeholder="Select district..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none" className="text-muted-foreground italic">No district assigned</SelectItem>
                    {(districts ?? []).map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border/50 sm:justify-between">
            <Button variant="ghost" className="rounded-xl font-medium" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button
              className="rounded-xl font-medium shadow-sm"
              disabled={!newRole || updateRole.isPending}
              onClick={() => {
                if (!editUser) return;
                updateRole.mutate({
                  userId: editUser.id,
                  data: {
                    role: newRole as UpdateUserRoleInputRole,
                    departmentId: newDeptId && newDeptId !== "none" ? Number(newDeptId) : null,
                    districtId: newDistrictId && newDistrictId !== "none" ? Number(newDistrictId) : null,
                  },
                });
              }}
            >
              {updateRole.isPending ? "Authorizing..." : "Confirm Clearance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
