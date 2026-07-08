import { useState } from "react";
import AdminLayout, { RoleGate } from "@/components/admin-layout";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAdminListDepartments,
  useAdminCreateDepartment,
  useAdminUpdateDepartment,
  useAdminDeleteDepartment,
  useAdminListDistricts,
  useAdminCreateDistrict,
  useAdminUpdateDistrict,
  useAdminDeleteDistrict,
  useAdminListCategories,
  useAdminCreateCategory,
  useAdminUpdateCategory,
  useAdminDeleteCategory,
  useAdminListSettings,
  useAdminUpdateSetting,
  getAdminListDepartmentsQueryKey,
  getAdminListDistrictsQueryKey,
  getAdminListCategoriesQueryKey,
  getAdminListSettingsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, Building2, MapPin, Tag, Settings } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";

type Tab = "departments" | "districts" | "categories" | "settings";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "departments", label: "Departments", icon: <Building2 className="h-4 w-4" /> },
  { id: "districts", label: "Districts", icon: <MapPin className="h-4 w-4" /> },
  { id: "categories", label: "Categories", icon: <Tag className="h-4 w-4" /> },
  { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
];

// ─── Departments Tab ──────────────────────────────────────────────────────────

function DepartmentsTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: departments = [], isLoading } = useAdminListDepartments();
  const createMut = useAdminCreateDepartment();
  const updateMut = useAdminUpdateDepartment();
  const deleteMut = useAdminDeleteDepartment();

  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<{ id: number; name: string } | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [nameInput, setNameInput] = useState("");

  function refresh() {
    qc.invalidateQueries({ queryKey: getAdminListDepartmentsQueryKey() });
  }

  function handleAdd() {
    if (!nameInput.trim()) return;
    createMut.mutate(
      { data: { name: nameInput.trim() } },
      {
        onSuccess: () => { toast({ title: "Department created" }); refresh(); setAddOpen(false); setNameInput(""); },
        onError: () => toast({ title: "Failed to create department", variant: "destructive" }),
      },
    );
  }

  function handleEdit() {
    if (!editItem || !nameInput.trim()) return;
    updateMut.mutate(
      { departmentId: editItem.id, data: { name: nameInput.trim() } },
      {
        onSuccess: () => { toast({ title: "Department updated" }); refresh(); setEditItem(null); setNameInput(""); },
        onError: () => toast({ title: "Failed to update department", variant: "destructive" }),
      },
    );
  }

  function handleDelete() {
    if (deleteId === null) return;
    deleteMut.mutate(
      { departmentId: deleteId },
      {
        onSuccess: () => { toast({ title: "Department deleted" }); refresh(); setDeleteId(null); },
        onError: () => toast({ title: "Failed to delete department", variant: "destructive" }),
      },
    );
  }

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setNameInput(""); setAddOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Department
        </Button>
      </div>
      <div className="rounded-md border divide-y divide-border">
        {departments.length === 0 && (
          <div className="py-8 text-center text-muted-foreground text-sm">No departments yet.</div>
        )}
        {departments.map((d) => (
          <div key={d.id} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium">{d.name}</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem({ id: d.id, name: d.name }); setNameInput(d.name); }}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(d.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Department</DialogTitle></DialogHeader>
          <Input placeholder="Department name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={createMut.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Department</DialogTitle></DialogHeader>
          <Input placeholder="Department name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleEdit()} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={updateMut.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. Complaints linked to this department may be affected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Districts Tab ────────────────────────────────────────────────────────────

function DistrictsTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: districts = [], isLoading } = useAdminListDistricts();
  const createMut = useAdminCreateDistrict();
  const updateMut = useAdminUpdateDistrict();
  const deleteMut = useAdminDeleteDistrict();

  type EditDistrict = { id: number; name: string; nameTa: string; code: string };
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<EditDistrict | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", nameTa: "", code: "" });

  function refresh() { qc.invalidateQueries({ queryKey: getAdminListDistrictsQueryKey() }); }

  function handleAdd() {
    if (!form.name.trim() || !form.code.trim()) return;
    createMut.mutate(
      { data: { name: form.name.trim(), nameTa: form.nameTa.trim() || form.name.trim(), code: form.code.trim() } },
      {
        onSuccess: () => { toast({ title: "District created" }); refresh(); setAddOpen(false); setForm({ name: "", nameTa: "", code: "" }); },
        onError: () => toast({ title: "Failed to create district", variant: "destructive" }),
      },
    );
  }

  function handleEdit() {
    if (!editItem || !form.name.trim()) return;
    updateMut.mutate(
      { districtId: editItem.id, data: { name: form.name.trim(), nameTa: form.nameTa.trim() || form.name.trim(), code: form.code.trim() } },
      {
        onSuccess: () => { toast({ title: "District updated" }); refresh(); setEditItem(null); },
        onError: () => toast({ title: "Failed to update district", variant: "destructive" }),
      },
    );
  }

  function handleDelete() {
    if (deleteId === null) return;
    deleteMut.mutate(
      { districtId: deleteId },
      {
        onSuccess: () => { toast({ title: "District deleted" }); refresh(); setDeleteId(null); },
        onError: () => toast({ title: "Failed to delete district", variant: "destructive" }),
      },
    );
  }

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setForm({ name: "", nameTa: "", code: "" }); setAddOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add District
        </Button>
      </div>
      <div className="rounded-md border divide-y divide-border">
        {districts.length === 0 && <div className="py-8 text-center text-muted-foreground text-sm">No districts yet.</div>}
        {districts.map((d) => (
          <div key={d.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <span className="text-sm font-medium">{d.name}</span>
              {d.nameTa && <span className="ml-2 text-xs text-muted-foreground">{d.nameTa}</span>}
              <Badge variant="outline" className="ml-2 text-xs">{d.code}</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem({ id: d.id, name: d.name, nameTa: d.nameTa ?? "", code: d.code }); setForm({ name: d.name, nameTa: d.nameTa ?? "", code: d.code }); }}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(d.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add District</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name (English)" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Name (Tamil)" value={form.nameTa} onChange={(e) => setForm((f) => ({ ...f, nameTa: e.target.value }))} />
            <Input placeholder="Code (e.g. CHE)" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={createMut.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit District</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name (English)" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Name (Tamil)" value={form.nameTa} onChange={(e) => setForm((f) => ({ ...f, nameTa: e.target.value }))} />
            <Input placeholder="Code (e.g. CHE)" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={updateMut.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete District?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone. Complaints in this district may be affected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Categories Tab ───────────────────────────────────────────────────────────

function CategoriesTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: categories = [], isLoading } = useAdminListCategories();
  const createMut = useAdminCreateCategory();
  const updateMut = useAdminUpdateCategory();
  const deleteMut = useAdminDeleteCategory();

  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<{ id: number } | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", nameTa: "", description: "" });

  function refresh() { qc.invalidateQueries({ queryKey: getAdminListCategoriesQueryKey() }); }

  function handleAdd() {
    if (!form.name.trim()) return;
    createMut.mutate(
      { data: { name: form.name.trim(), nameTa: form.nameTa || undefined, description: form.description || undefined } },
      {
        onSuccess: () => { toast({ title: "Category created" }); refresh(); setAddOpen(false); setForm({ name: "", nameTa: "", description: "" }); },
        onError: () => toast({ title: "Failed to create category", variant: "destructive" }),
      },
    );
  }

  function handleEdit() {
    if (!editItem) return;
    updateMut.mutate(
      { categoryId: editItem.id, data: { name: form.name.trim(), nameTa: form.nameTa || undefined, description: form.description || undefined } },
      {
        onSuccess: () => { toast({ title: "Category updated" }); refresh(); setEditItem(null); },
        onError: () => toast({ title: "Failed to update category", variant: "destructive" }),
      },
    );
  }

  function handleDelete() {
    if (deleteId === null) return;
    deleteMut.mutate(
      { categoryId: deleteId },
      {
        onSuccess: () => { toast({ title: "Category deleted" }); refresh(); setDeleteId(null); },
        onError: () => toast({ title: "Failed to delete category", variant: "destructive" }),
      },
    );
  }

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setForm({ name: "", nameTa: "", description: "" }); setAddOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Category
        </Button>
      </div>
      <div className="rounded-md border divide-y divide-border">
        {categories.length === 0 && <div className="py-8 text-center text-muted-foreground text-sm">No categories yet.</div>}
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <span className="text-sm font-medium">{c.name}</span>
              {c.nameTa && <span className="ml-2 text-xs text-muted-foreground">{c.nameTa}</span>}
              {c.description && <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem({ id: c.id }); setForm({ name: c.name, nameTa: c.nameTa ?? "", description: c.description ?? "" }); }}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(c.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name (English)" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Name (Tamil)" value={form.nameTa} onChange={(e) => setForm((f) => ({ ...f, nameTa: e.target.value }))} />
            <Input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={createMut.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Category</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name (English)" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Name (Tamil)" value={form.nameTa} onChange={(e) => setForm((f) => ({ ...f, nameTa: e.target.value }))} />
            <Input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={updateMut.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone. Complaints in this category may be affected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: settings = [], isLoading } = useAdminListSettings();
  const updateMut = useAdminUpdateSetting();

  const [editKey, setEditKey] = useState<string | null>(null);
  const [valueInput, setValueInput] = useState("");

  function refresh() { qc.invalidateQueries({ queryKey: getAdminListSettingsQueryKey() }); }

  function handleSave() {
    if (!editKey) return;
    updateMut.mutate(
      { key: editKey, data: { value: valueInput } },
      {
        onSuccess: () => { toast({ title: "Setting updated" }); refresh(); setEditKey(null); },
        onError: () => toast({ title: "Failed to update setting", variant: "destructive" }),
      },
    );
  }

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-4">
      {settings.length === 0 && (
        <div className="py-8 text-center text-muted-foreground text-sm">No settings configured.</div>
      )}
      <div className="rounded-md border divide-y divide-border">
        {settings.map((s) => (
          <div key={s.key} className="flex items-center justify-between px-4 py-3">
            <div>
              <span className="text-sm font-mono font-medium">{s.key}</span>
              <p className="text-xs text-muted-foreground">{s.value ?? <em>not set</em>}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditKey(s.key); setValueInput(s.value ?? ""); }}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={!!editKey} onOpenChange={(o) => !o && setEditKey(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Setting: <code>{editKey}</code></DialogTitle></DialogHeader>
          <Input placeholder="Value" value={valueInput} onChange={(e) => setValueInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSave()} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditKey(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={updateMut.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminMasterData() {
  const [activeTab, setActiveTab] = useState<Tab>("departments");

  return (
    <AdminLayout>
      <RoleGate roles={["super_admin"]}>
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Master Data</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage reference data used across the portal — departments, districts, complaint categories, and system settings.
            </p>
          </div>

          <div className="flex gap-1 border-b border-border/60">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{TABS.find((t) => t.id === activeTab)?.label}</CardTitle>
            </CardHeader>
            <CardContent>
              {activeTab === "departments" && <DepartmentsTab />}
              {activeTab === "districts" && <DistrictsTab />}
              {activeTab === "categories" && <CategoriesTab />}
              {activeTab === "settings" && <SettingsTab />}
            </CardContent>
          </Card>
        </div>
      </RoleGate>
    </AdminLayout>
  );
}
