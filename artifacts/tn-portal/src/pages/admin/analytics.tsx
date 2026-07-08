import {
  useGetAnalyticsOfficerPerformance,
  useGetAnalyticsDepartmentPerformance,
  useGetAnalyticsOverview,
  useGetAnalyticsTrends,
  useGetAnalyticsMapData,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminLayout, { RoleGate } from "@/components/admin-layout";
import { ADMIN_ROLES, OFFICER_ROLES } from "@/constants/roles";
import { PageHeader } from "@/components/admin/page-header";
import TNDistrictMap from "@/components/TNDistrictMap";
import { FileText, CheckCircle2, Clock, Timer, Map } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip as RechartsTooltip, AreaChart, Area, Legend,
} from "recharts";

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--background))",
  borderColor: "hsl(var(--border))",
  borderRadius: "0.75rem",
  fontSize: "12px",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
} as const;

export default function AdminAnalytics() {
  return (
    <RoleGate roles={OFFICER_ROLES}>
      <AdminLayout>
        <AnalyticsContent />
      </AdminLayout>
    </RoleGate>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}) {
  return (
    <Card className="rounded-2xl shadow-sm border-border/40 hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${tone}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
          <div className="text-sm font-medium text-muted-foreground truncate">
            {label}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsContent() {
  const { data: overview, isLoading: overviewLoading } = useGetAnalyticsOverview();
  const { data: trends, isLoading: trendsLoading } = useGetAnalyticsTrends({ granularity: "monthly" });
  const { data: mapData, isLoading: mapLoading } = useGetAnalyticsMapData();
  const { data: deptPerf, isLoading: deptLoading } = useGetAnalyticsDepartmentPerformance({ limit: 20 });
  const { data: officerPerf, isLoading: officerLoading } = useGetAnalyticsOfficerPerformance({ limit: 20 });

  const trendData = (trends ?? []).map((t) => ({
    period: t.period,
    total: t.total,
    resolved: t.resolved,
  }));

  const categoryData = (overview?.byCategory ?? []).slice(0, 10).map((c) => ({
    name: c.name.length > 18 ? c.name.slice(0, 16) + "…" : c.name,
    count: c.count,
  }));

  const priorityData = (overview?.byPriority ?? []).map((p) => ({
    name: p.name.charAt(0).toUpperCase() + p.name.slice(1),
    count: p.count,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Analytics Overview"
        description="Complaint volume, geography, and performance metrics"
      />

      {/* KPI cards */}
      {overviewLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      ) : overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Complaints"
            value={overview.totalComplaints}
            icon={FileText}
            tone="bg-primary/10 text-primary border border-primary/20"
          />
          <StatCard
            label="Resolved"
            value={overview.resolved}
            icon={CheckCircle2}
            tone="bg-emerald-100/50 text-emerald-600 border border-emerald-200/50"
          />
          <StatCard
            label="Pending"
            value={overview.pending}
            icon={Clock}
            tone="bg-amber-100/50 text-amber-600 border border-amber-200/50"
          />
          <StatCard
            label="Avg Resolution"
            value={overview.avgResolutionDays != null ? `${overview.avgResolutionDays.toFixed(1)}d` : "—"}
            icon={Timer}
            tone="bg-stone-100/80 text-stone-600 border border-stone-200/80"
          />
        </div>
      )}

      {/* Trends */}
      <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-border/40 px-6 py-4">
          <CardTitle className="text-base font-semibold">
            Monthly Complaint Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[320px] p-6">
          {trendsLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          ) : trendData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No trend data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminTotalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="adminResGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} dx={-8} />
                <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Area type="monotone" dataKey="total" name="Total" stroke="hsl(var(--primary))" fill="url(#adminTotalGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" fill="url(#adminResGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Category + Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/20 border-b border-border/40 px-6 py-4">
            <CardTitle className="text-base font-semibold">
              Top Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] p-6">
            {categoryData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" width={130} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={TOOLTIP_STYLE} cursor={{fill: 'hsl(var(--muted))', opacity: 0.4}} />
                  <Bar dataKey="count" name="Complaints" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/20 border-b border-border/40 px-6 py-4">
            <CardTitle className="text-base font-semibold">
              By Priority
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] p-6">
            {priorityData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} dx={-8} />
                  <RechartsTooltip contentStyle={TOOLTIP_STYLE} cursor={{fill: 'hsl(var(--muted))', opacity: 0.4}} />
                  <Bar dataKey="count" name="Complaints" fill="#e11d48" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* District heat map */}
      <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between py-4 px-6 bg-muted/20 border-b border-border/40">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Map className="h-5 w-5 text-muted-foreground" /> District Heat Map
          </CardTitle>
          <span className="text-sm font-medium text-muted-foreground hidden sm:block">
            Click a district to drill down
          </span>
        </CardHeader>
        <CardContent className="p-6">
          {mapLoading ? (
            <div className="flex justify-center items-center h-[300px]">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          ) : mapData && mapData.length > 0 ? (
            <TNDistrictMap mapData={mapData} />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
              No district data available yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Department Performance */}
      <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-border/40 px-6 py-4">
          <CardTitle className="text-base font-semibold">Department Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {deptLoading ? (
            <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" /></div>
          ) : (
            <>
              <div className="h-[300px] p-6 border-b border-border/40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(deptPerf ?? []).slice(0,12).map(d => ({ name: d.departmentName.length > 14 ? d.departmentName.slice(0,12)+"…" : d.departmentName, total: d.total, resolved: d.resolved, pending: d.pending }))} margin={{ top:10, right:20, left:0, bottom:60 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} angle={-30} textAnchor="end" interval={0} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} />
                    <RechartsTooltip contentStyle={TOOLTIP_STYLE} cursor={{fill: 'hsl(var(--muted))', opacity: 0.4}} />
                    <Bar dataKey="total" name="Total" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                    <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/20">
                    <tr className="border-b border-border/40">
                      <th className="text-left py-3 px-6 font-medium text-muted-foreground">Department</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Total</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Resolved</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Pending</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Rate</th>
                      <th className="text-right py-3 px-6 font-medium text-muted-foreground">Avg Days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {(deptPerf ?? []).map(d => (
                      <tr key={d.departmentId} className="hover:bg-muted/10 transition-colors">
                        <td className="py-3 px-6 font-medium text-foreground">{d.departmentName}</td>
                        <td className="py-3 px-4 text-right font-medium text-muted-foreground">{d.total}</td>
                        <td className="py-3 px-4 text-right font-medium text-emerald-600">{d.resolved}</td>
                        <td className="py-3 px-4 text-right font-medium text-amber-600">{d.pending}</td>
                        <td className="py-3 px-4 text-right">
                          <Badge variant="secondary" className={`font-medium ${d.resolutionRate>=70?"bg-emerald-100/50 text-emerald-700 hover:bg-emerald-100/50":d.resolutionRate>=40?"bg-amber-100/50 text-amber-700 hover:bg-amber-100/50":"bg-red-100/50 text-red-700 hover:bg-red-100/50"}`}>
                            {d.resolutionRate}%
                          </Badge>
                        </td>
                        <td className="py-3 px-6 text-right text-muted-foreground font-medium">
                          {d.avgResolutionDays!=null?`${d.avgResolutionDays.toFixed(1)}d`:"—"}
                        </td>
                      </tr>
                    ))}
                    {(!deptPerf||deptPerf.length===0)&&<tr><td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">No data yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Officer Performance */}
      <RoleGate roles={[...ADMIN_ROLES, "auditor", "legal_officer"]}>
        <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/20 border-b border-border/40 px-6 py-4">
            <CardTitle className="text-base font-semibold">Officer Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {officerLoading ? (
              <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/20">
                    <tr className="border-b border-border/40">
                      <th className="text-left py-3 px-6 font-medium text-muted-foreground">Officer</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Total</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Resolved</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Pending</th>
                      <th className="text-right py-3 px-6 font-medium text-muted-foreground">Avg Days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {(officerPerf ?? []).map(o => (
                      <tr key={o.officerId} className="hover:bg-muted/10 transition-colors">
                        <td className="py-3 px-6 font-medium text-foreground">
                          {o.officerName ?? "—"}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-muted-foreground">{o.total}</td>
                        <td className="py-3 px-4 text-right font-medium text-emerald-600">{o.resolved}</td>
                        <td className="py-3 px-4 text-right font-medium text-amber-600">{o.pending}</td>
                        <td className="py-3 px-6 text-right text-muted-foreground font-medium">
                          {o.avgResolutionDays!=null?`${o.avgResolutionDays.toFixed(1)}d`:"—"}
                        </td>
                      </tr>
                    ))}
                    {(!officerPerf||officerPerf.length===0)&&<tr><td colSpan={5} className="py-12 text-center text-muted-foreground text-sm">No officer assignment data yet</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </RoleGate>
    </div>
  );
}
