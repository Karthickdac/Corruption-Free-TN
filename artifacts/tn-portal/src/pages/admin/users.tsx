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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Users, Edit, Search, ChevronLeft, ChevronRight } from "lucide-react";

const ALL_ROLES = Object.keys(ROLE_LABELS);

const ROLE_COLORS: Record<string, string> = {
  citizen: "bg-gray-500/10 text-gray-400",
  super_admin: "bg-red-500/10 text-red-400",
  state_administrator: "bg-orange-500/10 text-orange-400",
  investigation_officer: "bg-rose-500/10 text-rose-400",
  department_officer: "bg-orange-500/10 text-orange-400",
  district_officer: "bg-lime-600/10 text-lime-500",
  auditor: "bg-emerald-500/10 text-emerald-400",
  moderator: "bg-yellow-500/10 text-yellow-400",
  legal_officer: "bg-pink-500/10 text-pink-400",
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
  const limit = 20;

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
        toast({ title: "Role updated successfully" });
        setEditUser(null);
      },
      onError: (err: { message?: string }) => {
        toast({ title: "Failed to update role", description: err?.message, variant: "destructive" });
      },
    },
  });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} total users</p>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(0); }}>
          <SelectTrigger className="w-44 h-8 text-xs">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ALL_ROLES.map((r) => (
              <SelectItem key={r} value={r}>{ROLE_LABELS[r] ?? r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : users.length === 0 ? (
        <Card className="bg-muted/30">
          <CardContent className="py-12 text-center">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No users found.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {users.map((u) => (
              <Card key={u.id} className="bg-muted/20 hover:bg-muted/30 transition-colors">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate">
                        {u.name ?? "—"}
                      </span>
                      <Badge className={`text-[10px] px-1.5 py-0 ${ROLE_COLORS[u.role] ?? "bg-gray-500/10 text-gray-400"}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {u.email ?? "No email"} · Joined {new Date(u.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
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
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">{editUser.name ?? "Anonymous"}</p>
                <p className="text-xs text-muted-foreground">{editUser.email}</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Role</label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r] ?? r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Department (optional)</label>
                <Select value={newDeptId} onValueChange={setNewDeptId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {(departments ?? []).map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">District (optional)</label>
                <Select value={newDistrictId} onValueChange={setNewDistrictId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select district..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {(districts ?? []).map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button
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
              {updateRole.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
