import { useI18n } from "@/contexts/i18n";
import { useGetPublicStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ShieldAlert, Scale, Building, Map } from "lucide-react";

export default function Transparency() {
  const { t, isTa } = useI18n();
  const { data: stats, isLoading } = useGetPublicStats();

  const COLORS = ['#e11d48', '#f59e0b', '#8b5cf6', '#10b981', '#3b82f6', '#64748b'];

  if (isLoading || !stats) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-6xl flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pieData = stats.byStatus.map(s => ({
    name: t(`status_${s.status}` as any) || s.status,
    value: s.count
  }));

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-bold uppercase tracking-tight text-foreground">
          {t("transparency_title")}
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          {t("transparency_desc")}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <ShieldAlert className="h-8 w-8 text-primary mb-2" />
            <span className="text-3xl font-bold font-serif">{stats.totalComplaints}</span>
            <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground mt-1">Total Reports</span>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Scale className="h-8 w-8 text-emerald-500 mb-2" />
            <span className="text-3xl font-bold font-serif">{stats.resolved}</span>
            <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground mt-1">Resolved</span>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Map className="h-8 w-8 text-amber-500 mb-2" />
            <span className="text-3xl font-bold font-serif">{stats.totalDistricts}</span>
            <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground mt-1">Districts</span>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Building className="h-8 w-8 text-blue-500 mb-2" />
            <span className="text-3xl font-bold font-serif">{stats.totalDepartments}</span>
            <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground mt-1">Departments</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="uppercase tracking-wider text-sm font-bold text-muted-foreground">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="uppercase tracking-wider text-sm font-bold text-muted-foreground">Top Departments</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.topDepartments}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis dataKey="name" type="category" width={150} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="uppercase tracking-wider text-sm font-bold text-muted-foreground">Most Reported Districts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topDistricts.map((d, i) => (
                <div key={d.name} className="flex items-center">
                  <div className="w-8 font-serif font-bold text-muted-foreground">{i + 1}</div>
                  <div className="flex-1 font-medium">{d.name}</div>
                  <div className="font-mono font-bold bg-muted/50 px-2 py-1 rounded text-sm">{d.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="uppercase tracking-wider text-sm font-bold text-muted-foreground">Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topCategories.map((c, i) => (
                <div key={c.name} className="flex items-center">
                  <div className="flex-1 font-medium">{c.name}</div>
                  <div className="w-full max-w-[100px] h-2 bg-muted rounded-full ml-4 overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${(c.count / stats.topCategories[0].count) * 100}%` }}></div>
                  </div>
                  <div className="font-mono text-sm ml-4 w-8 text-right">{c.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
