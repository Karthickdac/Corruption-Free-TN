import { useState } from "react";
import { useI18n } from "@/contexts/i18n";
import {
  useGetPublicStats,
  useGetAnalyticsOverview,
  useGetAnalyticsTrends,
  useGetAnalyticsDepartmentPerformance,
  useGetAnalyticsMapData,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from "recharts";
import { ShieldAlert, CheckCircle2, Clock, AlertTriangle, Map } from "lucide-react";
import { Link } from "wouter";
import TNDistrictMap from "@/components/TNDistrictMap";

const PIE_COLORS = ["#cca360","#475569","#3b82f6","#10b981","#f59e0b","#8b5cf6","#ec4899","#14b8a6","#ef4444","#6b7280"];

const STATUS_COLORS: Record<string, string> = {
  submitted:"#6366f1", under_review:"#f59e0b", evidence_verification:"#8b5cf6",
  forwarded:"#3b82f6", department_response:"#0ea5e9", investigation:"#f97316",
  action_taken:"#10b981", closed:"#22c55e", reopened:"#ef4444", rejected:"#6b7280",
};

function humanStatus(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export default function Transparency() {
  const { t } = useI18n();
  const [gran, setGran] = useState<"monthly"|"yearly">("monthly");

  const { data: stats, isLoading: statsLoading } = useGetPublicStats();
  const { data: overview } = useGetAnalyticsOverview({});
  const { data: trends, isLoading: trendsLoading } = useGetAnalyticsTrends({ granularity: gran });
  const { data: deptPerf, isLoading: deptLoading } = useGetAnalyticsDepartmentPerformance({ limit: 10 });
  const { data: mapData } = useGetAnalyticsMapData();

  if (statsLoading || !stats) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-6xl flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const statusPieData = overview
    ? overview.byStatus.map((s, i) => ({
        name: humanStatus(s.name),
        value: s.count,
        color: STATUS_COLORS[s.name] ?? PIE_COLORS[i % PIE_COLORS.length],
      }))
    : stats.byStatus.map((s, i) => ({
        name: humanStatus(s.status),
        value: s.count,
        color: STATUS_COLORS[s.status] ?? PIE_COLORS[i % PIE_COLORS.length],
      }));

  const categoryBarData = (overview?.byCategory ?? stats.topCategories).slice(0, 8).map(c => ({
    name: c.name.length > 18 ? c.name.slice(0, 16) + "…" : c.name,
    count: c.count,
  }));

  const districtBarData = (overview?.byDistrict ?? stats.topDistricts).slice(0, 8).map(d => ({
    name: d.name.length > 12 ? d.name.slice(0, 10) + "…" : d.name,
    count: d.count,
  }));

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold uppercase tracking-tight">{t("transparency_title")}</h1>
          <p className="text-lg text-muted-foreground mt-2">{t("transparency_desc")}</p>
        </div>
        <div className="sm:ml-auto flex gap-2">
          <Link href="/search">
            <Button variant="outline" size="sm" className="text-xs uppercase tracking-wider font-bold">
              Advanced Search
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: ShieldAlert, label: "Total Reports", value: (overview?.totalComplaints ?? stats.totalComplaints).toLocaleString(), color: "text-primary", bg: "bg-primary/5 border-primary/20" },
          { icon: CheckCircle2, label: "Resolved", value: (overview?.resolved ?? stats.resolved).toLocaleString(), color: "text-emerald-500", bg: "bg-emerald-500/5 border-emerald-500/20" },
          { icon: Clock, label: "Avg Resolution", value: overview?.avgResolutionDays != null ? `${overview.avgResolutionDays.toFixed(1)}d` : "—", color: "text-amber-500", bg: "bg-amber-500/5 border-amber-500/20" },
          { icon: AlertTriangle, label: "Pending", value: (overview?.pending ?? stats.pending).toLocaleString(), color: "text-blue-500", bg: "bg-blue-500/5 border-blue-500/20" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <Card key={label} className={bg}>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Icon className={`h-8 w-8 ${color} mb-2`} />
              <span className="text-3xl font-bold font-serif">{value}</span>
              <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground mt-1">{label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status donut + Categories bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle className="uppercase tracking-wider text-xs font-bold text-muted-foreground">Status Breakdown</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value">
                  {statusPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor:"hsl(var(--background))", borderColor:"hsl(var(--border))", borderRadius:"8px", fontSize:"12px" }} itemStyle={{ color:"hsl(var(--foreground))" }} />
                <Legend wrapperStyle={{ fontSize:"11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="uppercase tracking-wider text-xs font-bold text-muted-foreground">Top Categories</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBarData} layout="vertical" margin={{ top:0, right:20, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis dataKey="name" type="category" width={120} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <RechartsTooltip contentStyle={{ backgroundColor:"hsl(var(--background))", borderColor:"hsl(var(--border))", borderRadius:"8px", fontSize:"12px" }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Trend chart */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="uppercase tracking-wider text-xs font-bold text-muted-foreground">Complaint Trend</CardTitle>
          <div className="flex gap-1">
            {(["monthly","yearly"] as const).map(g => (
              <Button key={g} size="sm" variant={gran===g?"default":"ghost"} className="text-xs h-7 capitalize" onClick={()=>setGran(g)}>{g}</Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="h-[260px]">
          {trendsLoading ? (
            <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : !trends || trends.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm text-center">
              No trend data yet — data appears once complaints are filed over multiple periods.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top:10, right:20, left:0, bottom:0 }}>
                <defs>
                  <linearGradient id="totGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="resGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <RechartsTooltip contentStyle={{ backgroundColor:"hsl(var(--background))", borderColor:"hsl(var(--border))", borderRadius:"8px", fontSize:"12px" }} />
                <Legend wrapperStyle={{ fontSize:"11px" }} />
                <Area type="monotone" dataKey="total" name="Total" stroke="hsl(var(--primary))" fill="url(#totGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" fill="url(#resGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Districts bar + Priority bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle className="uppercase tracking-wider text-xs font-bold text-muted-foreground">Most Reported Districts</CardTitle></CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtBarData} layout="vertical" margin={{ top:0, right:20, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis dataKey="name" type="category" width={100} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <RechartsTooltip contentStyle={{ backgroundColor:"hsl(var(--background))", borderColor:"hsl(var(--border))", borderRadius:"8px", fontSize:"12px" }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="uppercase tracking-wider text-xs font-bold text-muted-foreground">By Priority</CardTitle></CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(overview?.byPriority ?? []).map(p => ({ name: p.name, count: p.count }))} margin={{ top:10, right:20, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <RechartsTooltip contentStyle={{ backgroundColor:"hsl(var(--background))", borderColor:"hsl(var(--border))", borderRadius:"8px", fontSize:"12px" }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* TN District Geographic Heat Map */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 uppercase tracking-wider text-xs font-bold text-muted-foreground">
            <Map className="h-4 w-4" /> TN District Complaints Geographic Heat Map
          </CardTitle>
          <span className="text-xs text-muted-foreground">Click a district to drill down → taluks → complaints</span>
        </CardHeader>
        <CardContent>
          {mapData && mapData.length > 0 ? (
            <TNDistrictMap mapData={mapData} />
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
              No district data available yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Department Performance Table */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="uppercase tracking-wider text-xs font-bold text-muted-foreground">Department Performance</CardTitle>
          <Link href="/search"><Button variant="ghost" size="sm" className="text-xs">View All →</Button></Link>
        </CardHeader>
        <CardContent>
          {deptLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Department","Total","Resolved","Rate","Avg Days"].map(h => (
                      <th key={h} className={`py-2 font-bold text-muted-foreground uppercase text-xs tracking-wider ${h==="Department"?"text-left pr-4":"text-right px-2"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(deptPerf ?? []).map(d => (
                    <tr key={d.departmentId} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2 pr-4 font-medium">{d.departmentName}</td>
                      <td className="py-2 px-2 text-right font-mono">{d.total}</td>
                      <td className="py-2 px-2 text-right font-mono text-emerald-500">{d.resolved}</td>
                      <td className="py-2 px-2 text-right">
                        <Badge variant="secondary" className={d.resolutionRate>=70?"bg-emerald-500/10 text-emerald-600":d.resolutionRate>=40?"bg-amber-500/10 text-amber-600":"bg-red-500/10 text-red-600"}>
                          {d.resolutionRate}%
                        </Badge>
                      </td>
                      <td className="py-2 pl-2 text-right text-muted-foreground font-mono text-xs">
                        {d.avgResolutionDays!=null ? `${d.avgResolutionDays.toFixed(1)}d` : "—"}
                      </td>
                    </tr>
                  ))}
                  {(!deptPerf||deptPerf.length===0) && (
                    <tr><td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">No department data yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Data refreshes periodically. All figures are public and reflect live complaint records.
      </p>
    </div>
  );
}
