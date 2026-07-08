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
  borderRadius: "8px",
  fontSize: "12px",
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
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-9 w-9 rounded-md flex items-center justify-center shrink-0 ${tone}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <div className="text-xl font-bold leading-tight">{value}</div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium truncate">
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
    <div className="p-6 space-y-6">
      <PageHeader
        title="Analytics"
        description="Complaint volume, geography, and performance metrics"
      />

      {/* KPI cards */}
      {overviewLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total Complaints"
            value={overview.totalComplaints}
            icon={FileText}
            tone="bg-primary/10 text-primary"
          />
          <StatCard
            label="Resolved"
            value={overview.resolved}
            icon={CheckCircle2}
            tone="bg-emerald-600/10 text-emerald-600"
          />
          <StatCard
            label="Pending"
            value={overview.pending}
            icon={Clock}
            tone="bg-amber-600/10 text-amber-600"
          />
          <StatCard
            label="Avg Resolution"
            value={overview.avgResolutionDays != null ? `${overview.avgResolutionDays.toFixed(1)}d` : "—"}
            icon={Timer}
            tone="bg-stone-600/10 text-stone-600"
          />
        </div>
      )}

      {/* Trends */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
            Monthly Complaint Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[260px]">
          {trendsLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="adminResGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Area type="monotone" dataKey="total" name="Total" stroke="#f59e0b" fill="url(#adminTotalGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" fill="url(#adminResGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Category + Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
              Top Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            {categoryData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" width={130} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="count" name="Complaints" fill="#0d9488" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
              By Priority
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            {priorityData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                  <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="count" name="Complaints" fill="#d97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* District heat map */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-muted-foreground">
            <Map className="h-4 w-4" /> District Heat Map
          </CardTitle>
          <span className="text-xs text-muted-foreground hidden sm:block">
            Click a district to drill down
          </span>
        </CardHeader>
        <CardContent>
          {mapLoading ? (
            <div className="flex justify-center items-center h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : mapData && mapData.length > 0 ? (
            <TNDistrictMap mapData={mapData} />
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
              No district data available yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Department Performance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Department Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {deptLoading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : (
            <>
              <div className="h-[280px] mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(deptPerf ?? []).slice(0,12).map(d => ({ name: d.departmentName.length > 14 ? d.departmentName.slice(0,12)+"…" : d.departmentName, total: d.total, resolved: d.resolved, pending: d.pending }))} margin={{ top:10, right:20, left:0, bottom:60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} angle={-30} textAnchor="end" interval={0} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                    <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="total" name="Total" fill="hsl(var(--primary))" radius={[2,2,0,0]} />
                    <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[2,2,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Department</th>
                      <th className="text-right py-2 px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Total</th>
                      <th className="text-right py-2 px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Resolved</th>
                      <th className="text-right py-2 px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Pending</th>
                      <th className="text-right py-2 px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Rate</th>
                      <th className="text-right py-2 pl-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Avg Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(deptPerf ?? []).map(d => (
                      <tr key={d.departmentId} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="py-2 pr-4 font-medium">{d.departmentName}</td>
                        <td className="py-2 px-2 text-right font-mono">{d.total}</td>
                        <td className="py-2 px-2 text-right font-mono text-emerald-600">{d.resolved}</td>
                        <td className="py-2 px-2 text-right font-mono text-amber-600">{d.pending}</td>
                        <td className="py-2 px-2 text-right">
                          <Badge variant="secondary" className={d.resolutionRate>=70?"bg-emerald-600/10 text-emerald-600":d.resolutionRate>=40?"bg-amber-600/10 text-amber-600":"bg-red-600/10 text-red-600"}>
                            {d.resolutionRate}%
                          </Badge>
                        </td>
                        <td className="py-2 pl-2 text-right text-muted-foreground font-mono text-xs">
                          {d.avgResolutionDays!=null?`${d.avgResolutionDays.toFixed(1)}d`:"—"}
                        </td>
                      </tr>
                    ))}
                    {(!deptPerf||deptPerf.length===0)&&<tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">No data yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Officer Performance */}
      <RoleGate roles={[...ADMIN_ROLES, "auditor", "legal_officer"]}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Officer Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {officerLoading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Officer</th>
                      <th className="text-right py-2 px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Total</th>
                      <th className="text-right py-2 px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Resolved</th>
                      <th className="text-right py-2 px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Pending</th>
                      <th className="text-right py-2 pl-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Avg Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(officerPerf ?? []).map(o => (
                      <tr key={o.officerId} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="py-2 pr-4">
                          <div className="font-medium">{o.officerName ?? "—"}</div>
                        </td>
                        <td className="py-2 px-2 text-right font-mono">{o.total}</td>
                        <td className="py-2 px-2 text-right font-mono text-emerald-600">{o.resolved}</td>
                        <td className="py-2 px-2 text-right font-mono text-amber-600">{o.pending}</td>
                        <td className="py-2 pl-2 text-right text-muted-foreground font-mono text-xs">
                          {o.avgResolutionDays!=null?`${o.avgResolutionDays.toFixed(1)}d`:"—"}
                        </td>
                      </tr>
                    ))}
                    {(!officerPerf||officerPerf.length===0)&&<tr><td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">No officer assignment data yet</td></tr>}
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
