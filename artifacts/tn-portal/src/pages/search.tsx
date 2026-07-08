import { useState, useCallback } from "react";
import { useSearchComplaints, useListDepartments, useListDistricts, useListComplaintCategories, useListTaluks, getListTaluksQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, ChevronLeft, ChevronRight, Filter, X, FileSpreadsheet, Printer } from "lucide-react";
import { Link } from "wouter";

const STATUSES = ["submitted","under_review","evidence_verification","forwarded","department_response","investigation","action_taken","closed","reopened","rejected"];
const PRIORITIES = ["low","medium","high","critical"];

function humanStatus(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-orange-500/10 text-orange-600",
  under_review: "bg-amber-500/10 text-amber-600",
  evidence_verification: "bg-rose-500/10 text-rose-600",
  forwarded: "bg-lime-600/10 text-lime-600",
  department_response: "bg-pink-500/10 text-pink-600",
  investigation: "bg-rose-500/10 text-rose-600",
  action_taken: "bg-emerald-500/10 text-emerald-600",
  closed: "bg-green-500/10 text-green-600",
  reopened: "bg-red-500/10 text-red-600",
  rejected: "bg-muted text-muted-foreground",
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-500/10 text-red-500",
  high: "bg-orange-500/10 text-orange-500",
  medium: "bg-yellow-500/10 text-yellow-600",
  low: "bg-green-500/10 text-green-600",
};

type Filters = {
  q: string;
  complaintNumber: string;
  status: string;
  departmentId: string;
  districtId: string;
  talukId: string;
  categoryId: string;
  priority: string;
  officerName: string;
  from: string;
  to: string;
  minAmount: string;
  maxAmount: string;
  sortBy: string;
  sortDir: "asc" | "desc";
};

const emptyFilters: Filters = {
  q: "", complaintNumber: "", status: "", departmentId: "", districtId: "",
  talukId: "", categoryId: "", priority: "", officerName: "", from: "", to: "",
  minAmount: "", maxAmount: "", sortBy: "createdAt", sortDir: "desc",
};

function buildApiUrl(filters: Filters, page: number, limit: number, format = "json") {
  const base = window.location.origin + (import.meta.env.BASE_URL.replace(/\/$/, "")) + "/api/search/complaints";
  const p = new URLSearchParams();
  if (filters.q) p.set("q", filters.q);
  if (filters.complaintNumber) p.set("complaintNumber", filters.complaintNumber);
  if (filters.status) p.set("status", filters.status);
  if (filters.departmentId) p.set("departmentId", filters.departmentId);
  if (filters.districtId) p.set("districtId", filters.districtId);
  if (filters.talukId) p.set("talukId", filters.talukId);
  if (filters.categoryId) p.set("categoryId", filters.categoryId);
  if (filters.priority) p.set("priority", filters.priority);
  if (filters.officerName) p.set("officerName", filters.officerName);
  if (filters.from) p.set("from", filters.from);
  if (filters.to) p.set("to", filters.to);
  if (filters.minAmount) p.set("minAmount", filters.minAmount);
  if (filters.maxAmount) p.set("maxAmount", filters.maxAmount);
  p.set("sortBy", filters.sortBy);
  p.set("sortDir", filters.sortDir);
  p.set("page", String(page));
  p.set("limit", String(limit));
  p.set("format", format);
  return `${base}?${p.toString()}`;
}

function filtersFromSearch(): Filters {
  const p = new URLSearchParams(window.location.search);
  return {
    q: p.get("q") ?? "",
    complaintNumber: p.get("complaintNumber") ?? "",
    status: p.get("status") ?? "",
    departmentId: p.get("departmentId") ?? "",
    districtId: p.get("districtId") ?? "",
    talukId: p.get("talukId") ?? "",
    categoryId: p.get("categoryId") ?? "",
    priority: p.get("priority") ?? "",
    officerName: p.get("officerName") ?? "",
    from: p.get("from") ?? "",
    to: p.get("to") ?? "",
    minAmount: p.get("minAmount") ?? "",
    maxAmount: p.get("maxAmount") ?? "",
    sortBy: p.get("sortBy") ?? "createdAt",
    sortDir: (p.get("sortDir") as "asc" | "desc") || "desc",
  };
}

export default function SearchPage() {
  const [filters, setFilters] = useState<Filters>(() => filtersFromSearch());
  const [applied, setApplied] = useState<Filters>(() => filtersFromSearch());
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true);
  const limit = 20;

  const { data: depts } = useListDepartments({});
  const { data: districts } = useListDistricts();
  const { data: categories } = useListComplaintCategories();
  const talukParams = filters.districtId ? { districtId: Number(filters.districtId) } : undefined;
  const { data: taluks } = useListTaluks(talukParams, {
    query: { queryKey: getListTaluksQueryKey(talukParams) },
  });

  const queryParams = {
    q: applied.q || undefined,
    complaintNumber: applied.complaintNumber || undefined,
    status: applied.status || undefined,
    departmentId: applied.departmentId ? Number(applied.departmentId) : undefined,
    districtId: applied.districtId ? Number(applied.districtId) : undefined,
    talukId: applied.talukId ? Number(applied.talukId) : undefined,
    categoryId: applied.categoryId ? Number(applied.categoryId) : undefined,
    priority: applied.priority || undefined,
    officerName: applied.officerName || undefined,
    from: applied.from || undefined,
    to: applied.to || undefined,
    minAmount: applied.minAmount ? Number(applied.minAmount) : undefined,
    maxAmount: applied.maxAmount ? Number(applied.maxAmount) : undefined,
    sortBy: applied.sortBy || undefined,
    sortDir: (applied.sortDir || undefined) as "asc" | "desc" | undefined,
    page,
    limit,
    format: "json" as const,
  };

  const { data: rawData, isLoading } = useSearchComplaints(queryParams);
  const data = typeof rawData === "string" ? undefined : rawData;

  const upd = (k: keyof Filters, v: string) => setFilters(f => ({ ...f, [k]: v }));
  const apply = () => { setApplied({ ...filters }); setPage(1); };
  const reset = () => { setFilters(emptyFilters); setApplied(emptyFilters); setPage(1); };

  const handleExportCsv = useCallback(() => {
    window.open(buildApiUrl(applied, 1, 1000, "csv"), "_blank");
  }, [applied]);

  const handleExportXlsx = useCallback(() => {
    window.open(buildApiUrl(applied, 1, 5000, "xlsx"), "_blank");
  }, [applied]);

  const handleExportPdf = useCallback(() => {
    window.open(buildApiUrl(applied, 1, 5000, "pdf"), "_blank");
  }, [applied]);

  const totalPages = data ? Math.ceil(data.total / limit) : 0;
  const activeFilters = Object.entries(applied).filter(([k, v]) => v && k !== "sortBy" && k !== "sortDir").length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold uppercase tracking-tight">Advanced Search</h1>
          <p className="text-sm text-muted-foreground mt-1">Search and filter all public complaint records</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(f => !f)} className="text-xs uppercase tracking-wider font-bold">
            <Filter className="h-3.5 w-3.5 mr-1" />
            Filters {activeFilters > 0 && <Badge className="ml-1 h-4 px-1 text-xs bg-primary">{activeFilters}</Badge>}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv} className="text-xs uppercase tracking-wider font-bold">
            <Download className="h-3.5 w-3.5 mr-1" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportXlsx} className="text-xs uppercase tracking-wider font-bold">
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPdf} className="text-xs uppercase tracking-wider font-bold">
            <Printer className="h-3.5 w-3.5 mr-1" />
            PDF
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
              <div className="xl:col-span-2">
                <Label className="text-xs">Keyword Search</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input className="pl-8 text-sm" placeholder="Title, description, location…" value={filters.q} onChange={e => upd("q", e.target.value)} onKeyDown={e => e.key === "Enter" && apply()} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Complaint Number</Label>
                <Input className="mt-1 text-sm" placeholder="e.g. CFT-2024-001" value={filters.complaintNumber} onChange={e => upd("complaintNumber", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={filters.status} onValueChange={v => upd("status", v === "all" ? "" : v)}>
                  <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Any status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Status</SelectItem>
                    {STATUSES.map(s => <SelectItem key={s} value={s}>{humanStatus(s)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Department</Label>
                <Select value={filters.departmentId} onValueChange={v => upd("departmentId", v === "all" ? "" : v)}>
                  <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Any department" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Department</SelectItem>
                    {(depts ?? []).map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">District</Label>
                <Select value={filters.districtId} onValueChange={v => { upd("districtId", v === "all" ? "" : v); upd("talukId", ""); }}>
                  <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Any district" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any District</SelectItem>
                    {(districts ?? []).map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Taluk</Label>
                <Select value={filters.talukId} onValueChange={v => upd("talukId", v === "all" ? "" : v)} disabled={!filters.districtId}>
                  <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder={filters.districtId ? "Any taluk" : "Select district first"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Taluk</SelectItem>
                    {(taluks ?? []).map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={filters.categoryId} onValueChange={v => upd("categoryId", v === "all" ? "" : v)}>
                  <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Any category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Category</SelectItem>
                    {(categories ?? []).map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Priority</Label>
                <Select value={filters.priority} onValueChange={v => upd("priority", v === "all" ? "" : v)}>
                  <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Any priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Priority</SelectItem>
                    {PRIORITIES.map(p => <SelectItem key={p} value={p}>{humanStatus(p)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Officer Name</Label>
                <Input className="mt-1 text-sm" placeholder="Search by officer name…" value={filters.officerName} onChange={e => upd("officerName", e.target.value)} onKeyDown={e => e.key === "Enter" && apply()} />
              </div>
              <div>
                <Label className="text-xs">From Date</Label>
                <Input type="date" className="mt-1 text-sm" value={filters.from} onChange={e => upd("from", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">To Date</Label>
                <Input type="date" className="mt-1 text-sm" value={filters.to} onChange={e => upd("to", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Min Amount (₹)</Label>
                <Input type="number" className="mt-1 text-sm" placeholder="0" value={filters.minAmount} onChange={e => upd("minAmount", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Max Amount (₹)</Label>
                <Input type="number" className="mt-1 text-sm" placeholder="any" value={filters.maxAmount} onChange={e => upd("maxAmount", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Sort By</Label>
                <Select value={filters.sortBy} onValueChange={v => upd("sortBy", v)}>
                  <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Date Filed</SelectItem>
                    <SelectItem value="updatedAt">Last Updated</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={reset} className="text-xs"><X className="h-3.5 w-3.5 mr-1" />Clear</Button>
              <Button size="sm" onClick={apply} className="text-xs uppercase tracking-wider font-bold">
                <Search className="h-3.5 w-3.5 mr-1" />Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
            {data ? `${data.total.toLocaleString()} result${data.total !== 1 ? "s" : ""}` : "Results"}
          </CardTitle>
          {data && data.total > limit && (
            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : !data || data.results.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              No complaints match your filters.{activeFilters > 0 && " Try broadening your search."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Number","Title","Status","Priority","District","Department","Date"].map(h => (
                      <th key={h} className="text-left py-3 px-4 font-bold text-muted-foreground uppercase text-xs tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.results.map(c => (
                    <tr key={c.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                        <Link href={`/track?id=${c.complaintNumber}`} className="text-primary hover:underline">{c.complaintNumber}</Link>
                      </td>
                      <td className="py-3 px-4 max-w-[220px] truncate font-medium">{c.title}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant="secondary" className={`text-xs ${STATUS_COLORS[c.status] ?? "bg-muted text-muted-foreground"}`}>{humanStatus(c.status)}</Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant="secondary" className={`text-xs ${PRIORITY_COLORS[c.priority] ?? "bg-muted text-muted-foreground"}`}>{humanStatus(c.priority)}</Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap text-xs">{c.districtName ?? "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground max-w-[160px] truncate text-xs">{c.departmentName ?? "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap text-xs font-mono">{new Date(c.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="text-xs">
                <ChevronLeft className="h-3.5 w-3.5" />Prev
              </Button>
              <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="text-xs">
                Next<ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
