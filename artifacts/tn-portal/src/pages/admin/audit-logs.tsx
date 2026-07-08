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
import { ClipboardList, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  ROLE_LABELS,
} from "@/constants/complaint-workflow";

// Keys must match audit `action` values written by the API server
const ACTION_COLORS: Record<string, string> = {
  status_change: "bg-orange-600/10 text-orange-600",
  assignment: "bg-rose-600/10 text-rose-600",
  case_note_added: "bg-emerald-600/10 text-emerald-600",
  role_update: "bg-orange-600/10 text-orange-600",
  evidence_upload: "bg-lime-600/10 text-lime-600",
  evidence_download: "bg-lime-600/10 text-lime-600",
  investigation_report_submitted: "bg-emerald-600/10 text-emerald-600",
  login: "bg-stone-500/10 text-stone-600",
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

function ValuePill({ value, kind }: { value: string; kind: "status" | "role" | "plain" }) {
  if (kind === "status") {
    return (
      <Badge className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[value] ?? "bg-muted text-muted-foreground"}`}>
        {STATUS_LABELS[value] ?? value}
      </Badge>
    );
  }
  if (kind === "role") {
    return (
      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
        {ROLE_LABELS[value] ?? value}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
      {value}
    </Badge>
  );
}

function BeforeAfter({
  before,
  after,
  kind,
}: {
  before?: string | null;
  after?: string | null;
  kind: "status" | "role" | "plain";
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {before ? <ValuePill value={before} kind={kind} /> : (
        <span className="text-[10px] text-muted-foreground italic">none</span>
      )}
      <ArrowRight className="h-3 w-3 text-muted-foreground" />
      {after ? <ValuePill value={after} kind={kind} /> : (
        <span className="text-[10px] text-muted-foreground italic">none</span>
      )}
    </span>
  );
}

/**
 * Tolerant renderer for heterogeneous audit `details` JSON.
 * Known shapes get a readable before → after presentation;
 * everything else falls back to key-value chips.
 */
function AuditDetails({
  action,
  details,
}: {
  action: string;
  details: Record<string, unknown>;
}) {
  const str = (k: string): string | null => {
    const v = details[k];
    return typeof v === "string" && v.length > 0 ? v : null;
  };

  const note = str("note");
  const rows: React.ReactNode[] = [];

  if (action === "status_change" && str("status")) {
    rows.push(
      <BeforeAfter key="st" before={str("previousStatus")} after={str("status")} kind="status" />,
    );
  } else if (action === "role_update" && (str("role") || str("newRole"))) {
    rows.push(
      <BeforeAfter
        key="rl"
        before={str("previousRole") ?? str("oldRole")}
        after={str("role") ?? str("newRole")}
        kind="role"
      />,
    );
  } else if (action === "assignment" && (str("assignedOfficerName") || details["officerUserId"] != null)) {
    rows.push(
      <span key="as" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        Assigned to{" "}
        <ValuePill
          value={str("assignedOfficerName") ?? `Officer #${String(details["officerUserId"])}`}
          kind="plain"
        />
      </span>,
    );
  } else {
    const entries = Object.entries(details).filter(
      ([k, v]) => k !== "note" && v != null && (typeof v !== "string" || v.length > 0),
    );
    if (entries.length > 0) {
      rows.push(
        <span key="kv" className="inline-flex items-center gap-1.5 flex-wrap">
          {entries.slice(0, 6).map(([k, v]) => (
            <span key={k} className="inline-flex items-center gap-1 text-[10px]">
              <span className="text-muted-foreground">{k}:</span>
              <ValuePill
                value={typeof v === "string" ? v : JSON.stringify(v)}
                kind={k === "status" || k === "previousStatus" ? "status" : "plain"}
              />
            </span>
          ))}
          {entries.length > 6 && (
            <span className="text-[10px] text-muted-foreground">
              +{entries.length - 6} more
            </span>
          )}
        </span>,
      );
    }
  }

  if (rows.length === 0 && !note) return null;

  return (
    <div className="mt-1 space-y-0.5">
      {rows.length > 0 && <div className="flex items-center gap-2 flex-wrap">{rows}</div>}
      {note && (
        <div className="text-xs text-muted-foreground italic truncate max-w-xl">
          “{note}”
        </div>
      )}
    </div>
  );
}

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
      <PageHeader title="Audit Logs" description={`${total} total entries`} />

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
                        <AuditDetails
                          action={log.action}
                          details={log.details as Record<string, unknown>}
                        />
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
