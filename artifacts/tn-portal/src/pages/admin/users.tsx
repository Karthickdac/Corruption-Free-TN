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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Users, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";

const ALL_ROLES = Object.keys(ROLE_LABELS);

const ROLE_COLORS: Record<string, string> = {
  citizen: "bg-stone-200 text-stone-600 border-stone-300",
  super_admin: "bg-red-600 text-white border-red-800",
  state_administrator: "bg-orange-600 text-white border-orange-800",
  investigation_officer: "bg-rose-100 text-rose-900 border-rose-400",
  department_officer: "bg-orange-100 text-orange-900 border-orange-400",
  district_officer: "bg-lime-100 text-lime-900 border-lime-400",
  auditor: "bg-emerald-100 text-emerald-900 border-emerald-400",
  moderator: "bg-yellow-100 text-yellow-900 border-yellow-400",
  legal_officer: "bg-pink-100 text-pink-900 border-pink-400",
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
        toast({ title: "AUTHORIZATION UPDATED" });
        setEditUser(null);
      },
      onError: (err: { message?: string }) => {
        toast({ title: "UPDATE FAILED", description: err?.message, variant: "destructive" });
      },
    },
  });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personnel Registry"
        description={`${total} REGISTERED USERS`}
      />

      <div className="flex gap-2 items-center bg-stone-100 p-3 border-2 border-stone-200">
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(0); }}>
          <SelectTrigger className="w-48 h-10 text-xs font-bold uppercase tracking-wider rounded-none border-2 bg-white">
            <SelectValue placeholder="FILTER BY DESIGNATION" />
          </SelectTrigger>
          <SelectContent className="rounded-none border-2">
            <SelectItem value="all" className="font-bold uppercase text-xs tracking-wider">ALL DESIGNATIONS</SelectItem>
            {ALL_ROLES.map((r) => (
              <SelectItem key={r} value={r} className="font-bold uppercase text-xs tracking-wider">{ROLE_LABELS[r] ?? r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>
      ) : users.length === 0 ? (
        <div className="border-4 border-dashed border-stone-300 p-16 text-center text-stone-500 bg-white">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm font-bold uppercase tracking-wider">NO PERSONNEL FOUND.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {users.map((u) => (
              <Card key={u.id} className="rounded-none border-2 border-stone-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] bg-white hover:border-stone-400 transition-colors">
                <CardContent className="p-0 flex flex-col h-full">
                  <div className="p-4 flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-serif font-black text-lg text-stone-900 truncate pr-2">{u.name ?? "UNKNOWN OFFICER"}</h3>
                      <Badge className={`rounded-none text-[10px] font-bold uppercase tracking-widest border-2 whitespace-nowrap ${ROLE_COLORS[u.role] ?? "bg-stone-200 text-stone-600 border-stone-300"}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </Badge>
                    </div>
                    <div className="text-xs font-mono text-stone-600 truncate mb-1">
                      {u.email ?? "NO CONTACT ON FILE"}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                      REGISTERED: {new Date(u.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="border-t-2 border-stone-200 bg-stone-50 p-2">
                    <Button
                      variant="ghost"
                      className="w-full rounded-none h-8 text-xs font-bold uppercase tracking-wider text-stone-600 hover:text-stone-900 hover:bg-stone-200 gap-2"
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
                      <Edit className="h-3 w-3" /> MODIFY CLEARANCE
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-6">
              <Button
                variant="outline"
                className="rounded-none border-2 font-bold uppercase tracking-wider h-10 w-10 p-0"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-black uppercase tracking-widest text-stone-600">
                PAGE {page + 1} OF {totalPages}
              </span>
              <Button
                variant="outline"
                className="rounded-none border-2 font-bold uppercase tracking-wider h-10 w-10 p-0"
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
        <DialogContent className="rounded-none border-4 border-stone-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] sm:max-w-md">
          <DialogHeader className="border-b-2 border-stone-200 pb-4">
            <DialogTitle className="font-serif text-xl uppercase tracking-wider font-black">Adjust Personnel Status</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-6 pt-4">
              <div className="bg-stone-100 p-3 border border-stone-200">
                <p className="font-black text-stone-900">{editUser.name ?? "UNKNOWN"}</p>
                <p className="text-xs font-mono text-stone-600">{editUser.email}</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Designation Level</label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="rounded-none border-2 h-10 font-bold text-xs uppercase tracking-wider bg-white">
                    <SelectValue placeholder="Select designation..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2">
                    {ALL_ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="font-bold text-xs uppercase tracking-wider">{ROLE_LABELS[r] ?? r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Department Authority (Optional)</label>
                <Select value={newDeptId} onValueChange={setNewDeptId}>
                  <SelectTrigger className="rounded-none border-2 h-10 font-bold text-xs uppercase tracking-wider bg-white">
                    <SelectValue placeholder="Select department..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2">
                    <SelectItem value="none" className="font-bold text-xs uppercase tracking-wider italic text-stone-500">NO DEPARTMENT ASSIGNED</SelectItem>
                    {(departments ?? []).map((d) => (
                      <SelectItem key={d.id} value={String(d.id)} className="font-bold text-xs uppercase tracking-wider">{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">District Authority (Optional)</label>
                <Select value={newDistrictId} onValueChange={setNewDistrictId}>
                  <SelectTrigger className="rounded-none border-2 h-10 font-bold text-xs uppercase tracking-wider bg-white">
                    <SelectValue placeholder="Select district..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2">
                    <SelectItem value="none" className="font-bold text-xs uppercase tracking-wider italic text-stone-500">NO DISTRICT ASSIGNED</SelectItem>
                    {(districts ?? []).map((d) => (
                      <SelectItem key={d.id} value={String(d.id)} className="font-bold text-xs uppercase tracking-wider">{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="pt-4 border-t-2 border-stone-200 sm:justify-between">
            <Button variant="outline" className="rounded-none border-2 font-bold uppercase tracking-wider" onClick={() => setEditUser(null)}>ABORT</Button>
            <Button
              className="rounded-none font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
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
              {updateRole.isPending ? "AUTHORIZING..." : "CONFIRM CLEARANCE"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
