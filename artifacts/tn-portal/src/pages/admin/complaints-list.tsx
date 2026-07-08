import { Link } from "wouter";
import AdminLayout, { RoleGate } from "@/components/admin-layout";
import { OFFICER_ROLES } from "@/constants/roles";
import { useGetDashboardComplaints, getGetDashboardComplaintsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, FileText } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  under_review: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  evidence_verification: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  forwarded: "bg-lime-600/10 text-lime-600 border-lime-600/20",
  department_response: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  investigation: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  action_taken: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  closed: "bg-green-500/10 text-green-500 border-green-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
  reopened: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
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
