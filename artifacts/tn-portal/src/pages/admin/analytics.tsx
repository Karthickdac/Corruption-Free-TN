import { useGetAnalyticsOfficerPerformance, useGetAnalyticsDepartmentPerformance } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoleGate } from "@/components/admin-layout";
import { ADMIN_ROLES, OFFICER_ROLES } from "@/constants/roles";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip,
} from "recharts";

export default function AdminAnalytics() {
  const { data: deptPerf, isLoading: deptLoading } = useGetAnalyticsDepartmentPerformance({ limit: 20 });
  const { data: officerPerf, isLoading: officerLoading } = useGetAnalyticsOfficerPerformance({ limit: 20 });

  return (
    <RoleGate roles={OFFICER_ROLES}>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold uppercase tracking-tight">Performance Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Department and officer performance metrics</p>
        </div>

        {/* Department Performance */}
        <Card className="mb-6">
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
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <RechartsTooltip contentStyle={{ backgroundColor:"hsl(var(--background))", borderColor:"hsl(var(--border))", borderRadius:"8px", fontSize:"12px" }} />
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
                          <td className="py-2 px-2 text-right font-mono text-emerald-500">{d.resolved}</td>
                          <td className="py-2 px-2 text-right font-mono text-amber-500">{d.pending}</td>
                          <td className="py-2 px-2 text-right">
                            <Badge variant="secondary" className={d.resolutionRate>=70?"bg-emerald-500/10 text-emerald-600":d.resolutionRate>=40?"bg-amber-500/10 text-amber-600":"bg-red-500/10 text-red-600"}>
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
                            {o.officerEmail && <div className="text-xs text-muted-foreground">{o.officerEmail}</div>}
                          </td>
                          <td className="py-2 px-2 text-right font-mono">{o.total}</td>
                          <td className="py-2 px-2 text-right font-mono text-emerald-500">{o.resolved}</td>
                          <td className="py-2 px-2 text-right font-mono text-amber-500">{o.pending}</td>
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
    </RoleGate>
  );
}
