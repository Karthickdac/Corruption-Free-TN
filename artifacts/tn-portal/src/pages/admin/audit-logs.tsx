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
  STATUS_LABELS,
  ROLE_LABELS,
} from "@/constants/complaint-workflow";

// Keys must match audit `action` values written by the API server
const ACTION_COLORS: Record<string, string> = {
  status_change: "bg-orange-100 text-orange-900 border-orange-400",
  assignment: "bg-rose-100 text-rose-900 border-rose-400",
  case_note_added: "bg-emerald-100 text-emerald-900 border-emerald-400",
  role_update: "bg-orange-100 text-orange-900 border-orange-400",
  evidence_upload: "bg-lime-100 text-lime-900 border-lime-400",
  evidence_download: "bg-lime-100 text-lime-900 border-lime-400",
  investigation_report_submitted: "bg-emerald-100 text-emerald-900 border-emerald-400",
  login: "bg-stone-200 text-stone-800 border-stone-400",
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
  submitted: "bg-stone-200 text-stone-800 border-stone-400",
  under_review: "bg-amber-100 text-amber-900 border-amber-400",
  evidence_verification: "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-400",
  forwarded: "bg-lime-100 text-lime-900 border-lime-400",
  department_response: "bg-teal-100 text-teal-900 border-teal-400",
  investigation: "bg-orange-100 text-orange-900 border-orange-400",
  action_taken: "bg-emerald-100 text-emerald-900 border-emerald-400",
  closed: "bg-stone-800 text-stone-100 border-stone-900",
  rejected: "bg-red-100 text-red-900 border-red-400",
  reopened: "bg-rose-100 text-rose-900 border-rose-400",
};

function ValuePill({ value, kind }: { value: string; kind: "status" | "role" | "plain" }) {
  if (kind === "status") {
    return (
      <Badge className={`rounded-none border-2 text-[10px] px-1.5 py-0 font-bold uppercase tracking-wider ${ADMIN_STATUS_COLORS[value] ?? "bg-stone-100 text-stone-600 border-stone-300"}`}>
        {STATUS_LABELS[value] ?? value}
      </Badge>
    );
  }
  if (kind === "role") {
    return (
      <Badge variant="outline" className="rounded-none border-2 text-[10px] px-1.5 py-0 font-bold uppercase tracking-wider bg-stone-100 text-stone-700 border-stone-300">
        {ROLE_LABELS[value] ?? value}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="rounded-none border-2 text-[10px] px-1.5 py-0 font-mono font-bold bg-white text-stone-800 border-stone-300">
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
    <span className="inline-flex items-center gap-1.5 bg-stone-100 p-1 border-2 border-stone-200">
      {before ? <ValuePill value={before} kind={kind} /> : (
        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest px-1">NONE</span>
      )}
      <ArrowRight className="h-3 w-3 text-stone-400" />
      {after ? <ValuePill value={after} kind={kind} /> : (
        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest px-1">NONE</span>
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
      <span key="as" className="inline-flex items-center gap-1.5 text-xs text-stone-600 font-bold uppercase tracking-wider bg-stone-100 px-2 py-1 border-2 border-stone-200">
        ASSIGNED TO:{" "}
        <ValuePill
          value={str("assignedOfficerName") ?? `OFFICER #${String(details["officerUserId"])}`}
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
        <span key="kv" className="inline-flex items-center gap-1.5 flex-wrap bg-stone-100 p-1 border-2 border-stone-200">
          {entries.slice(0, 6).map(([k, v]) => (
            <span key={k} className="inline-flex items-center gap-1 text-[10px] font-mono px-1">
              <span className="text-stone-500 font-bold">{k}:</span>
              <ValuePill
                value={typeof v === "string" ? v : JSON.stringify(v)}
                kind={k === "status" || k === "previousStatus" ? "status" : "plain"}
              />
            </span>
          ))}
          {entries.length > 6 && (
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">
              +{entries.length - 6} MORE
            </span>
          )}
        </span>,
      );
    }
  }

  if (rows.length === 0 && !note) return null;

  return (
    <div className="mt-2 space-y-2">
      {rows.length > 0 && <div className="flex items-center gap-2 flex-wrap">{rows}</div>}
      {note && (
        <div className="text-xs text-stone-700 font-medium truncate max-w-xl bg-stone-50 p-2 border-l-4 border-stone-300">
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
    <div className="space-y-6">
      <PageHeader title="System Audit Logs" description={`${total} IMMUTABLE RECORD ENTRIES`} />

      <div className="flex gap-3 items-center flex-wrap bg-stone-100 p-3 border-2 border-stone-200">
        <Select
          value={entityTypeFilter}
          onValueChange={(v) => { setEntityTypeFilter(v); setPage(0); }}
        >
          <SelectTrigger className="w-[180px] h-10 text-xs font-bold uppercase tracking-wider rounded-none border-2 bg-white">
            <SelectValue placeholder="FILTER ENTITY" />
          </SelectTrigger>
          <SelectContent className="rounded-none border-2">
            <SelectItem value="all" className="font-bold uppercase text-xs tracking-wider">ALL ENTITIES</SelectItem>
            {ENTITY_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="font-bold uppercase text-xs tracking-wider">{t.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={actionFilter}
          onValueChange={(v) => { setActionFilter(v); setPage(0); }}
        >
          <SelectTrigger className="w-[200px] h-10 text-xs font-bold uppercase tracking-wider rounded-none border-2 bg-white">
            <SelectValue placeholder="FILTER ACTION" />
          </SelectTrigger>
          <SelectContent className="rounded-none border-2">
            <SelectItem value="all" className="font-bold uppercase text-xs tracking-wider">ALL ACTIONS</SelectItem>
            {ACTIONS.map((a) => (
              <SelectItem key={a} value={a} className="font-bold uppercase text-xs tracking-wider">{ACTION_LABELS[a]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>
      ) : logs.length === 0 ? (
        <div className="border-4 border-dashed border-stone-300 p-16 text-center text-stone-500 bg-white">
          <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm font-bold uppercase tracking-wider">NO AUDIT RECORDS FOUND.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-0">
            {logs.map((log) => (
              <Card key={log.id} className="rounded-none border-2 border-b-0 last:border-b-2 border-stone-300 shadow-none bg-white hover:bg-stone-50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="w-32 shrink-0">
                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 block mb-1">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] font-black font-mono text-stone-400">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour12: false })}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge className={`rounded-none text-[10px] px-1.5 py-0 font-bold uppercase tracking-wider border-2 ${ACTION_COLORS[log.action] ?? "bg-stone-200 text-stone-700 border-stone-300"}`}>
                          {ACTION_LABELS[log.action] ?? log.action}
                        </Badge>
                        {log.entityType && (
                          <Badge variant="outline" className="rounded-none text-[10px] px-1.5 py-0 font-bold uppercase tracking-wider border-2 border-stone-300 bg-stone-100 text-stone-600">
                            {log.entityType}
                            {log.entityId ? ` #${log.entityId}` : ""}
                          </Badge>
                        )}
                        {log.userName && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-2 border-l-2 border-stone-300 pl-2">OP: {log.userName}</span>
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
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-6">
              <Button
                variant="outline"
                className="rounded-none border-2 font-bold uppercase tracking-wider h-10 w-10 p-0"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-black uppercase tracking-widest text-stone-600">
                PAGE {page + 1} OF {totalPages}
              </span>
              <Button
                variant="outline"
                className="rounded-none border-2 font-bold uppercase tracking-wider h-10 w-10 p-0"
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
