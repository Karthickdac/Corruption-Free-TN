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
import { ClipboardList, ChevronLeft, ChevronRight, ArrowRight, Filter } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import {
  STATUS_LABELS,
  ROLE_LABELS,
} from "@/constants/complaint-workflow";

// Keys must match audit `action` values written by the API server
const ACTION_COLORS: Record<string, string> = {
  status_change: "bg-orange-100/80 text-orange-800 border-orange-200",
  assignment: "bg-rose-100/80 text-rose-800 border-rose-200",
  case_note_added: "bg-emerald-100/80 text-emerald-800 border-emerald-200",
  role_update: "bg-orange-100/80 text-orange-800 border-orange-200",
  evidence_upload: "bg-lime-100/80 text-lime-800 border-lime-200",
  evidence_download: "bg-lime-100/80 text-lime-800 border-lime-200",
  investigation_report_submitted: "bg-emerald-100/80 text-emerald-800 border-emerald-200",
  login: "bg-stone-100 text-stone-700 border-stone-200",
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

const ADMIN_STATUS_COLORS: Record<string, string> = {
  submitted: "bg-stone-100 text-stone-700 border-stone-200",
  under_review: "bg-amber-100/80 text-amber-800 border-amber-200",
  evidence_verification: "bg-fuchsia-100/80 text-fuchsia-800 border-fuchsia-200",
  forwarded: "bg-lime-100/80 text-lime-800 border-lime-200",
  department_response: "bg-teal-100/80 text-teal-800 border-teal-200",
  investigation: "bg-orange-100/80 text-orange-800 border-orange-200",
  action_taken: "bg-emerald-100/80 text-emerald-800 border-emerald-200",
  closed: "bg-stone-200 text-stone-800 border-stone-300",
  rejected: "bg-red-100/80 text-red-800 border-red-200",
  reopened: "bg-rose-100/80 text-rose-800 border-rose-200",
};

function ValuePill({ value, kind }: { value: string; kind: "status" | "role" | "plain" }) {
  if (kind === "status") {
    return (
      <Badge className={`rounded-full px-2 py-0.5 text-[10px] font-medium border shadow-none whitespace-nowrap ${ADMIN_STATUS_COLORS[value] ?? "bg-stone-100 text-stone-700 border-stone-200"}`}>
        {STATUS_LABELS[value] ?? value}
      </Badge>
    );
  }
  if (kind === "role") {
    return (
      <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-stone-50 text-stone-700 border-stone-200 shadow-none whitespace-nowrap">
        {ROLE_LABELS[value] ?? value}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="rounded-md px-1.5 py-0 text-[10px] font-mono font-medium bg-card text-foreground border-border shadow-none whitespace-nowrap">
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
    <span className="inline-flex items-center gap-2 bg-muted/30 p-1.5 rounded-lg border border-border/40">
      {before ? <ValuePill value={before} kind={kind} /> : (
        <span className="text-[10px] text-muted-foreground font-medium px-1">None</span>
      )}
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/70" />
      {after ? <ValuePill value={after} kind={kind} /> : (
        <span className="text-[10px] text-muted-foreground font-medium px-1">None</span>
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
      <span key="as" className="inline-flex items-center gap-2 text-xs text-foreground font-medium bg-muted/30 px-3 py-1.5 rounded-lg border border-border/40">
        <span className="text-muted-foreground">Assigned to:</span>
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
        <span key="kv" className="inline-flex items-center gap-2 flex-wrap bg-muted/30 p-1.5 rounded-lg border border-border/40">
          {entries.slice(0, 6).map(([k, v]) => (
            <span key={k} className="inline-flex items-center gap-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border/50">
              <span className="text-muted-foreground font-medium">{k}:</span>
              <ValuePill
                value={typeof v === "string" ? v : JSON.stringify(v)}
                kind={k === "status" || k === "previousStatus" ? "status" : "plain"}
              />
            </span>
          ))}
          {entries.length > 6 && (
            <span className="text-[10px] font-medium text-muted-foreground px-1">
              +{entries.length - 6} more
            </span>
          )}
        </span>,
      );
    }
  }

  if (rows.length === 0 && !note) return null;

  return (
    <div className="mt-3 space-y-2">
      {rows.length > 0 && <div className="flex items-center gap-2 flex-wrap">{rows}</div>}
      {note && (
        <div className="text-sm text-foreground/90 font-normal leading-relaxed max-w-2xl bg-muted/20 p-3 rounded-xl border border-border/40">
          "{note}"
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader title="System Audit Logs" description={`Immutable ledger containing ${total} recorded events`} />

      <div className="flex gap-4 items-center bg-card p-2 rounded-xl border border-border/60 shadow-sm flex-wrap">
        <div className="pl-3 pr-1 text-muted-foreground hidden sm:block">
          <Filter className="h-4 w-4" />
        </div>
        <Select
          value={entityTypeFilter}
          onValueChange={(v) => { setEntityTypeFilter(v); setPage(0); }}
        >
          <SelectTrigger className="w-[180px] bg-background border-transparent hover:bg-accent/50 transition-colors rounded-lg h-9">
            <SelectValue placeholder="Filter Entity" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Entities</SelectItem>
            {ENTITY_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="w-px h-6 bg-border/50 hidden sm:block" />
        
        <Select
          value={actionFilter}
          onValueChange={(v) => { setActionFilter(v); setPage(0); }}
        >
          <SelectTrigger className="w-[220px] bg-background border-transparent hover:bg-accent/50 transition-colors rounded-lg h-9">
            <SelectValue placeholder="Filter Action" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Actions</SelectItem>
            {ACTIONS.map((a) => (
              <SelectItem key={a} value={a}>{ACTION_LABELS[a]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : logs.length === 0 ? (
        <div className="border border-dashed border-border/60 rounded-2xl p-16 text-center text-muted-foreground bg-card shadow-sm">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium text-foreground mb-1">No audit records found.</p>
          <p className="text-sm">Adjust filters to see more results.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden divide-y divide-border/40">
            {logs.map((log) => (
              <div key={log.id} className="p-5 hover:bg-muted/10 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 md:gap-6">
                  <div className="w-32 shrink-0 pt-0.5">
                    <span className="text-xs font-medium text-muted-foreground block mb-0.5">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs font-mono font-medium text-muted-foreground/80">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour12: false })}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium border shadow-none ${ACTION_COLORS[log.action] ?? "bg-stone-100 text-stone-700 border-stone-200"}`}>
                        {ACTION_LABELS[log.action] ?? log.action}
                      </Badge>
                      
                      {log.entityType && (
                        <span className="inline-flex items-center text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                          {log.entityType.replace('_', ' ')}
                          {log.entityId ? <span className="ml-1 text-foreground/70 font-mono">#{log.entityId}</span> : ""}
                        </span>
                      )}
                      
                      {log.userName && (
                        <div className="ml-auto flex items-center">
                           <span className="text-xs text-muted-foreground mr-1.5">by</span>
                           <span className="text-xs font-medium text-foreground bg-secondary px-2 py-0.5 rounded-md">{log.userName}</span>
                        </div>
                      )}
                    </div>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <AuditDetails
                        action={log.action}
                        details={log.details as Record<string, unknown>}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-10 w-10 border-border/60 hover:bg-muted"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-10 w-10 border-border/60 hover:bg-muted"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
