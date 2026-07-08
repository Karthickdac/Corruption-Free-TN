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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Pencil, Trash2, Plus, Building2, MapPin, Tag, Settings, Save } from "lucide-react";
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

  if (isLoading) return <div className="py-16 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border shadow-sm">
        <div>
          <h3 className="text-lg font-semibold">Government Departments</h3>
          <p className="text-sm text-muted-foreground mt-1">Manage the list of departments available for complaints.</p>
        </div>
        <Button onClick={() => { setNameInput(""); setAddOpen(true); }} className="rounded-lg shadow-sm">
          <Plus className="h-4 w-4 mr-2" /> Add Department
        </Button>
      </div>
      
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {departments.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-sm">No departments configured yet.</div>
        )}
        <div className="divide-y divide-border/60">
          {departments.map((d) => (
            <div key={d.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
              <span className="text-sm font-medium text-foreground">{d.name}</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => { setEditItem({ id: d.id, name: d.name }); setNameInput(d.name); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(d.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-border/50 shadow-xl">
          <DialogHeader className="px-6 py-4 bg-muted/30 border-b border-border/50">
            <DialogTitle className="text-lg font-semibold">Add Department</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Department Name</label>
              <Input placeholder="Enter name..." className="rounded-xl h-11" value={nameInput} onChange={(e) => setNameInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border/50">
            <Button variant="ghost" className="rounded-xl" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button className="rounded-xl shadow-sm" onClick={handleAdd} disabled={createMut.isPending || !nameInput.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-border/50 shadow-xl">
          <DialogHeader className="px-6 py-4 bg-muted/30 border-b border-border/50">
            <DialogTitle className="text-lg font-semibold">Edit Department</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Department Name</label>
              <Input placeholder="Enter name..." className="rounded-xl h-11" value={nameInput} onChange={(e) => setNameInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleEdit()} />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border/50">
            <Button variant="ghost" className="rounded-xl" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button className="rounded-xl shadow-sm" onClick={handleEdit} disabled={updateMut.isPending || !nameInput.trim()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl p-0 overflow-hidden border-border/50 shadow-xl">
          <AlertDialogHeader className="px-6 pt-6 pb-2">
            <AlertDialogTitle className="text-xl">Delete Department?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">This action cannot be undone. Complaints currently linked to this department may be affected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="px-6 py-4 mt-4 bg-muted/30 border-t border-border/50">
            <AlertDialogCancel className="rounded-xl mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm">Delete</AlertDialogAction>
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

  if (isLoading) return <div className="py-16 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border shadow-sm">
        <div>
          <h3 className="text-lg font-semibold">Districts</h3>
          <p className="text-sm text-muted-foreground mt-1">Manage geographic divisions and their identifiers.</p>
        </div>
        <Button onClick={() => { setForm({ name: "", nameTa: "", code: "" }); setAddOpen(true); }} className="rounded-lg shadow-sm">
          <Plus className="h-4 w-4 mr-2" /> Add District
        </Button>
      </div>
      
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {districts.length === 0 && <div className="py-16 text-center text-muted-foreground text-sm">No districts configured yet.</div>}
        <div className="divide-y divide-border/60">
          {districts.map((d) => (
            <div key={d.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
              <div>
                <span className="text-sm font-medium text-foreground">{d.name}</span>
                {d.nameTa && <span className="ml-3 text-xs text-muted-foreground font-medium">{d.nameTa}</span>}
                <Badge variant="outline" className="ml-3 text-[10px] font-mono rounded bg-muted/50 border-border/50 text-muted-foreground shadow-none">{d.code}</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => { setEditItem({ id: d.id, name: d.name, nameTa: d.nameTa ?? "", code: d.code }); setForm({ name: d.name, nameTa: d.nameTa ?? "", code: d.code }); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(d.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-border/50 shadow-xl">
          <DialogHeader className="px-6 py-4 bg-muted/30 border-b border-border/50">
            <DialogTitle className="text-lg font-semibold">Add District</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Name (English)</label>
              <Input placeholder="e.g. Chennai" className="rounded-xl h-11" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Name (Tamil)</label>
              <Input placeholder="e.g. சென்னை" className="rounded-xl h-11" value={form.nameTa} onChange={(e) => setForm((f) => ({ ...f, nameTa: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Code</label>
              <Input placeholder="e.g. CHE" className="rounded-xl h-11 uppercase" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border/50">
            <Button variant="ghost" className="rounded-xl" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button className="rounded-xl shadow-sm" onClick={handleAdd} disabled={createMut.isPending || !form.name.trim() || !form.code.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-border/50 shadow-xl">
          <DialogHeader className="px-6 py-4 bg-muted/30 border-b border-border/50">
            <DialogTitle className="text-lg font-semibold">Edit District</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Name (English)</label>
              <Input placeholder="e.g. Chennai" className="rounded-xl h-11" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Name (Tamil)</label>
              <Input placeholder="e.g. சென்னை" className="rounded-xl h-11" value={form.nameTa} onChange={(e) => setForm((f) => ({ ...f, nameTa: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Code</label>
              <Input placeholder="e.g. CHE" className="rounded-xl h-11 uppercase" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border/50">
            <Button variant="ghost" className="rounded-xl" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button className="rounded-xl shadow-sm" onClick={handleEdit} disabled={updateMut.isPending || !form.name.trim()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl p-0 overflow-hidden border-border/50 shadow-xl">
          <AlertDialogHeader className="px-6 pt-6 pb-2">
            <AlertDialogTitle className="text-xl">Delete District?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">This action cannot be undone. Complaints currently linked to this district may be affected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="px-6 py-4 mt-4 bg-muted/30 border-t border-border/50">
            <AlertDialogCancel className="rounded-xl mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm">Delete</AlertDialogAction>
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

  if (isLoading) return <div className="py-16 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border shadow-sm">
        <div>
          <h3 className="text-lg font-semibold">Complaint Categories</h3>
          <p className="text-sm text-muted-foreground mt-1">Manage the classification options for complaints.</p>
        </div>
        <Button onClick={() => { setForm({ name: "", nameTa: "", description: "" }); setAddOpen(true); }} className="rounded-lg shadow-sm">
          <Plus className="h-4 w-4 mr-2" /> Add Category
        </Button>
      </div>
      
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {categories.length === 0 && <div className="py-16 text-center text-muted-foreground text-sm">No categories configured yet.</div>}
        <div className="divide-y divide-border/60">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
              <div>
                <span className="text-sm font-medium text-foreground">{c.name}</span>
                {c.nameTa && <span className="ml-3 text-xs text-muted-foreground font-medium">{c.nameTa}</span>}
                {c.description && <p className="text-xs text-muted-foreground mt-1.5">{c.description}</p>}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => { setEditItem({ id: c.id }); setForm({ name: c.name, nameTa: c.nameTa ?? "", description: c.description ?? "" }); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(c.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-border/50 shadow-xl">
          <DialogHeader className="px-6 py-4 bg-muted/30 border-b border-border/50">
            <DialogTitle className="text-lg font-semibold">Add Category</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Name (English)</label>
              <Input placeholder="Enter name..." className="rounded-xl h-11" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Name (Tamil)</label>
              <Input placeholder="Enter translated name..." className="rounded-xl h-11" value={form.nameTa} onChange={(e) => setForm((f) => ({ ...f, nameTa: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description (Optional)</label>
              <Input placeholder="Brief explanation..." className="rounded-xl h-11" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border/50">
            <Button variant="ghost" className="rounded-xl" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button className="rounded-xl shadow-sm" onClick={handleAdd} disabled={createMut.isPending || !form.name.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-border/50 shadow-xl">
          <DialogHeader className="px-6 py-4 bg-muted/30 border-b border-border/50">
            <DialogTitle className="text-lg font-semibold">Edit Category</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Name (English)</label>
              <Input placeholder="Enter name..." className="rounded-xl h-11" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Name (Tamil)</label>
              <Input placeholder="Enter translated name..." className="rounded-xl h-11" value={form.nameTa} onChange={(e) => setForm((f) => ({ ...f, nameTa: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description (Optional)</label>
              <Input placeholder="Brief explanation..." className="rounded-xl h-11" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border/50">
            <Button variant="ghost" className="rounded-xl" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button className="rounded-xl shadow-sm" onClick={handleEdit} disabled={updateMut.isPending || !form.name.trim()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl p-0 overflow-hidden border-border/50 shadow-xl">
          <AlertDialogHeader className="px-6 pt-6 pb-2">
            <AlertDialogTitle className="text-xl">Delete Category?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">This action cannot be undone. Complaints currently linked to this category may be affected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="px-6 py-4 mt-4 bg-muted/30 border-t border-border/50">
            <AlertDialogCancel className="rounded-xl mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm">Delete</AlertDialogAction>
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

  if (isLoading) return <div className="py-16 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
         <h3 className="text-lg font-semibold">System Settings</h3>
         <p className="text-sm text-muted-foreground mt-1">Configure global application parameters and feature flags.</p>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {settings.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-sm">No settings configured.</div>
        )}
        <div className="divide-y divide-border/60">
          {settings.map((s) => (
            <div key={s.key} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
              <div>
                <span className="text-sm font-mono font-medium text-foreground bg-muted/50 px-2 py-0.5 rounded-md border border-border/50">{s.key}</span>
                <p className="text-sm text-muted-foreground mt-2 font-medium">{s.value ?? <em className="opacity-50">not set</em>}</p>
              </div>
              <Button variant="ghost" size="sm" className="rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 gap-2 font-medium" onClick={() => { setEditKey(s.key); setValueInput(s.value ?? ""); }}>
                <Pencil className="h-3.5 w-3.5" /> Modify
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!editKey} onOpenChange={(o) => !o && setEditKey(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-border/50 shadow-xl">
          <DialogHeader className="px-6 py-4 bg-muted/30 border-b border-border/50">
            <DialogTitle className="text-lg font-semibold">Edit Setting</DialogTitle>
            <CardDescription className="font-mono text-xs mt-1 text-primary">{editKey}</CardDescription>
          </DialogHeader>
          <div className="p-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Value</label>
              <Input placeholder="Enter value..." className="rounded-xl h-11" value={valueInput} onChange={(e) => setValueInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSave()} />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border/50">
            <Button variant="ghost" className="rounded-xl" onClick={() => setEditKey(null)}>Cancel</Button>
            <Button className="rounded-xl shadow-sm gap-2" onClick={handleSave} disabled={updateMut.isPending}>
               <Save className="h-4 w-4" /> Save Changes
            </Button>
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
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
          <PageHeader
            title="Master Data Management"
            description="Configure and manage system reference data, geographic divisions, and global parameters."
          />

          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden p-2">
            <div className="flex flex-wrap gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-[400px]">
            {activeTab === "departments" && <DepartmentsTab />}
            {activeTab === "districts" && <DistrictsTab />}
            {activeTab === "categories" && <CategoriesTab />}
            {activeTab === "settings" && <SettingsTab />}
          </div>
        </div>
      </RoleGate>
    </AdminLayout>
  );
}
