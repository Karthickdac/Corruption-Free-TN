import { Link } from "wouter";
import AdminLayout, { RoleGate } from "@/components/admin-layout";
import { OFFICER_ROLES } from "@/constants/roles";
import { useGetDashboardComplaints, getGetDashboardComplaintsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, FileText } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-stone-500/10 text-stone-600 border-stone-500/20",
  under_review: "bg-amber-600/10 text-amber-600 border-amber-600/20",
  evidence_verification: "bg-pink-600/10 text-pink-600 border-pink-600/20",
  forwarded: "bg-lime-600/10 text-lime-600 border-lime-600/20",
  department_response: "bg-emerald-600/10 text-emerald-600 border-emerald-600/20",
  investigation: "bg-orange-600/10 text-orange-600 border-orange-600/20",
  action_taken: "bg-green-500/10 text-green-600 border-green-500/20",
  closed: "bg-stone-600/10 text-stone-600 border-stone-600/20",
  rejected: "bg-red-600/10 text-red-600 border-red-600/20",
  reopened: "bg-rose-600/10 text-rose-600 border-rose-600/20",
};

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted", under_review: "Under Review",
  evidence_verification: "Evidence Verification", forwarded: "Forwarded",
  department_response: "Dept. Response", investigation: "Investigation",
  action_taken: "Action Taken", closed: "Closed", rejected: "Rejected", reopened: "Reopened",
};

export default function AdminComplaintsList() {
  return (
    <RoleGate roles={OFFICER_ROLES}>
      <AdminLayout>
        <ComplaintsListContent />
      </AdminLayout>
    </RoleGate>
  );
}

function ComplaintsListContent() {
  const { data, isLoading } = useGetDashboardComplaints(
    {},
    { query: { staleTime: 30000, queryKey: getGetDashboardComplaintsQueryKey({}) } },
  );
  const complaints = data?.complaints ?? [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">All Complaints</h1>
        <p className="text-muted-foreground text-sm mt-1">{data?.total ?? 0} total</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : complaints.length === 0 ? (
        <Card className="bg-muted/30">
          <CardContent className="py-12 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No complaints in your jurisdiction.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {complaints.map((c) => (
            <Card key={c.id} className="bg-muted/20 hover:bg-muted/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-mono text-muted-foreground">{c.complaintNumber}</span>
                      <Badge className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[c.status]}`}>
                        {STATUS_LABELS[c.status] ?? c.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                        {c.priority}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-sm text-foreground truncate">{c.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                      {c.districtName && <span>{c.districtName}</span>}
                      {c.departmentName && <span>· {c.departmentName}</span>}
                      <span className="ml-auto">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Link href={`/admin/complaints/${c.id}`}>
                    <Button variant="secondary" size="sm" className="h-7 text-xs gap-1 shrink-0">
                      View <ChevronRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
