import { useState } from "react";
import AdminLayout, { RoleGate } from "@/components/admin-layout";
import { ADMIN_ROLES } from "@/constants/roles";
import {
  useListAuditLogs,
  getListAuditLogsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";

// Keys must match audit `action` values written by the API server
const ACTION_COLORS: Record<string, string> = {
  status_change: "bg-orange-500/10 text-orange-400",
  assignment: "bg-rose-500/10 text-rose-400",
  case_note_added: "bg-green-500/10 text-green-400",
  role_update: "bg-orange-500/10 text-orange-400",
  evidence_upload: "bg-lime-600/10 text-lime-500",
  evidence_download: "bg-lime-600/10 text-lime-500",
  investigation_report_submitted: "bg-emerald-500/10 text-emerald-400",
  login: "bg-slate-500/10 text-slate-400",
};

const ACTION_LABELS: Record<string, string> = {
  status_change: "Status Change",
  assignment: "Assignment",
  case_note_added: "Case Note",
  role_update: "Role Update",
  evidence_upload: "Evidence Uploaded",
  evidence_download: "Evidence Downloaded",
  investigation_report_submitted: "Report Submitted",
  login: "Login",
};

const ENTITY_TYPES = ["complaint", "user", "evidence", "rti_request"];
const ACTIONS = Object.keys(ACTION_LABELS);

export default function AuditLogs() {
  return (
    <RoleGate roles={[...ADMIN_ROLES, "auditor"]}>
      <AdminLayout>
        <AuditLogsContent />
      </AdminLayout>
    </RoleGate>
  );
}

function AuditLogsContent() {
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(0);
  const limit = 25;

  const { data, isLoading } = useListAuditLogs(
    {
      entityType: entityTypeFilter !== "all" ? entityTypeFilter : undefined,
      action: actionFilter !== "all" ? actionFilter : undefined,
      limit,
      offset: page * limit,
    },
    {
      query: {
        queryKey: getListAuditLogsQueryKey({
          entityType: entityTypeFilter !== "all" ? entityTypeFilter : undefined,
          action: actionFilter !== "all" ? actionFilter : undefined,
          limit,
          offset: page * limit,
        }),
      },
    },
  );

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
        <p className="text-muted-foreground text-sm mt-1">{total} total entries</p>
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <Select
          value={entityTypeFilter}
          onValueChange={(v) => { setEntityTypeFilter(v); setPage(0); }}
        >
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="Entity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            {ENTITY_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={actionFilter}
          onValueChange={(v) => { setActionFilter(v); setPage(0); }}
        >
          <SelectTrigger className="w-44 h-8 text-xs">
            <SelectValue placeholder="Action type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {ACTIONS.map((a) => (
              <SelectItem key={a} value={a}>{ACTION_LABELS[a]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : logs.length === 0 ? (
        <Card className="bg-muted/30">
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No audit logs found.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-1.5">
            {logs.map((log) => (
              <Card key={log.id} className="bg-muted/20">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <Badge className={`text-[10px] px-1.5 py-0 ${ACTION_COLORS[log.action] ?? "bg-gray-500/10 text-gray-400"}`}>
                          {ACTION_LABELS[log.action] ?? log.action}
                        </Badge>
                        {log.entityType && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                            {log.entityType}
                            {log.entityId ? ` #${log.entityId}` : ""}
                          </Badge>
                        )}
                        {log.userName && (
                          <span className="text-xs text-muted-foreground">by {log.userName}</span>
                        )}
                      </div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                          {JSON.stringify(log.details, null, 0).slice(0, 200)}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground/60 shrink-0 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
