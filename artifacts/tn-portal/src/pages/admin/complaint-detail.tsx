import { useState } from "react";
import { useParams, useLocation } from "wouter";
import AdminLayout, { RoleGate } from "@/components/admin-layout";
import { OFFICER_ROLES } from "@/constants/roles";
import {
  useGetComplaintById,
  useListCaseNotes,
  useAddCaseNote,
  useUpdateComplaintStatus,
  useSubmitInvestigationReport,
  getListCaseNotesQueryKey,
  getGetComplaintByIdQueryKey,
} from "@workspace/api-client-react";
import { CaseNoteInputNoteType } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileText, MessageSquare, Eye, EyeOff, Clock, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

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

// Keep in sync with WORKFLOW_TRANSITIONS in artifacts/api-server/src/middlewares/rbac.ts
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  submitted: ["under_review", "rejected"],
  under_review: ["evidence_verification", "forwarded", "rejected", "closed"],
  evidence_verification: ["forwarded", "under_review", "rejected"],
  forwarded: ["department_response", "investigation", "rejected"],
  department_response: ["investigation", "action_taken", "closed"],
  investigation: ["action_taken", "closed"],
  action_taken: ["closed"],
  closed: ["reopened"],
  reopened: ["under_review"],
  rejected: ["reopened"],
};

const NOTE_TYPE_LABELS: Record<string, string> = {
  case_note: "Case Note",
  visit_log: "Visit Log",
  timeline_event: "Timeline Event",
  department_response: "Department Response",
  internal_comment: "Internal Comment",
};

export default function ComplaintDetail() {
  return (
    <RoleGate roles={OFFICER_ROLES}>
      <AdminLayout>
        <ComplaintDetailContent />
      </AdminLayout>
    </RoleGate>
  );
}

function ComplaintDetailContent() {
  const params = useParams<{ id: string }>();
  const complaintId = Number(params.id);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState<CaseNoteInputNoteType>(CaseNoteInputNoteType.case_note);
  const [isInternal, setIsInternal] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [reportSummary, setReportSummary] = useState("");
  const [reportFindings, setReportFindings] = useState("");
  const [reportRecommendation, setReportRecommendation] = useState("");
  const [reportNotes, setReportNotes] = useState("");

  const { data: complaint, isLoading: complaintLoading } = useGetComplaintById(
    complaintId,
    { query: { enabled: !!complaintId && !isNaN(complaintId), queryKey: getGetComplaintByIdQueryKey(complaintId), staleTime: 0 } },
  );

  const { data: caseNotes = [], isLoading: notesLoading } = useListCaseNotes(
    complaintId,
    { query: { enabled: !!complaintId && !isNaN(complaintId), queryKey: getListCaseNotesQueryKey(complaintId) } },
  );

  const addNote = useAddCaseNote({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCaseNotesQueryKey(complaintId) });
        setNoteContent("");
        toast({ title: "Note added" });
      },
      onError: (err: { message?: string }) => {
        toast({ title: "Failed to add note", description: err?.message, variant: "destructive" });
      },
    },
  });

  const submitReport = useSubmitInvestigationReport({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetComplaintByIdQueryKey(complaintId) });
        toast({ title: "Investigation report submitted" });
        setReportSummary("");
        setReportFindings("");
        setReportRecommendation("");
        setReportNotes("");
      },
      onError: (err: { message?: string }) => {
        toast({ title: "Failed to submit report", description: err?.message, variant: "destructive" });
      },
    },
  });

  const updateStatus = useUpdateComplaintStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetComplaintByIdQueryKey(complaintId) });
        toast({ title: "Status updated" });
        setNewStatus("");
        setStatusNote("");
      },
      onError: (err: { message?: string }) => {
        toast({ title: "Failed to update status", description: err?.message, variant: "destructive" });
      },
    },
  });

  if (!complaint) {
    return (
      <div className="p-6">
        <Link href="/admin/dashboard">
          <Button variant="ghost" size="sm" className="gap-1 mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>
        <div className="text-center py-12 text-muted-foreground">
          {isNaN(complaintId) ? "Invalid complaint ID." : "Complaint not found or loading..."}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/dashboard">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">{complaint.complaintNumber}</span>
            <Badge className={`text-xs ${STATUS_COLORS[complaint.status]}`}>
              {STATUS_LABELS[complaint.status] ?? complaint.status}
            </Badge>
            <Badge variant="outline" className="text-xs capitalize">{complaint.priority}</Badge>
          </div>
          <h1 className="text-xl font-bold text-foreground mt-0.5">{complaint.title}</h1>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details" className="gap-1">
            <FileText className="h-3.5 w-3.5" /> Details
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            Notes {caseNotes.length > 0 && `(${caseNotes.length})`}
          </TabsTrigger>
          <TabsTrigger value="workflow" className="gap-1">
            <Clock className="h-3.5 w-3.5" /> Workflow
          </TabsTrigger>
          <TabsTrigger value="report" className="gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> Investigation Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4 mt-4">
          <Card className="bg-muted/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Complaint Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              {(
                [
                  ["Description", complaint.description],
                  complaint.districtName ? ["District", complaint.districtName] : null,
                  complaint.talukName ? ["Taluk", complaint.talukName] : null,
                  complaint.departmentName ? ["Department", complaint.departmentName] : null,
                  complaint.categoryName ? ["Category", complaint.categoryName] : null,
                  complaint.officeName ? ["Office", complaint.officeName] : null,
                  complaint.officerName ? ["Officer Involved", complaint.officerName] : null,
                  complaint.amountInvolved ? ["Amount Involved", `₹${complaint.amountInvolved}`] : null,
                  complaint.incidentDate ? ["Incident Date", complaint.incidentDate] : null,
                  complaint.location ? ["Location", complaint.location] : null,
                  complaint.village ? ["Village", complaint.village] : null,
                  complaint.assignedOfficerName ? ["Assigned To", complaint.assignedOfficerName] : null,
                ] as ([string, string] | null)[]
              )
                .filter((item): item is [string, string] => item !== null)
                .map(([label, value]) => (
                  <div key={label} className={label === "Description" ? "col-span-2" : ""}>
                    <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
                    <div className="text-foreground">{value}</div>
                  </div>
                ))}
            </CardContent>
          </Card>

          {complaint.statusHistory && complaint.statusHistory.length > 0 && (
            <Card className="bg-muted/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Status Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {complaint.statusHistory.map((h, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1 shrink-0" />
                    <div>
                      <Badge className={`text-[10px] ${STATUS_COLORS[h.status]}`}>
                        {STATUS_LABELS[h.status] ?? h.status}
                      </Badge>
                      <span className="text-muted-foreground ml-2">
                        {new Date(h.changedAt).toLocaleString()}
                      </span>
                      {h.note && <div className="text-muted-foreground mt-0.5">{h.note}</div>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notes" className="space-y-4 mt-4">
          <Card className="bg-muted/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Add Note</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Select value={noteType} onValueChange={(v) => setNoteType(v as CaseNoteInputNoteType)}>
                  <SelectTrigger className="w-44 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(NOTE_TYPE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant={isInternal ? "secondary" : "outline"}
                  size="sm"
                  className="h-8 text-xs gap-1"
                  onClick={() => setIsInternal(!isInternal)}
                >
                  {isInternal ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {isInternal ? "Internal" : "Public"}
                </Button>
              </div>
              <Textarea
                placeholder="Write your note here..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={4}
                className="text-sm"
              />
              <Button
                size="sm"
                disabled={!noteContent.trim() || addNote.isPending}
                onClick={() =>
                  addNote.mutate({
                    complaintId,
                    data: { noteType, content: noteContent, isInternal },
                  })
                }
              >
                {addNote.isPending ? "Adding..." : "Add Note"}
              </Button>
            </CardContent>
          </Card>

          {notesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : caseNotes.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">No notes yet.</p>
          ) : (
            <div className="space-y-3">
              {caseNotes.map((note) => (
                <Card key={note.id} className={`bg-muted/20 ${note.isInternal ? "border-l-2 border-l-amber-500/50" : "border-l-2 border-l-primary/50"}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {NOTE_TYPE_LABELS[note.noteType] ?? note.noteType}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${note.isInternal ? "border-amber-500/30 text-amber-500" : "border-primary/30 text-primary"}`}
                      >
                        {note.isInternal ? "Internal" : "Public"}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {note.authorName ?? "Officer"} · {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="workflow" className="space-y-4 mt-4">
          <Card className="bg-muted/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Update Workflow Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Current:</span>
                <Badge className={STATUS_COLORS[complaint.status]}>
                  {STATUS_LABELS[complaint.status]}
                </Badge>
              </div>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select next status..." />
                </SelectTrigger>
                <SelectContent>
                  {(ALLOWED_TRANSITIONS[complaint.status] ?? []).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s] ?? s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Add a note about this transition (optional)..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                rows={2}
                className="text-sm"
              />
              <Button
                disabled={!newStatus || updateStatus.isPending}
                onClick={() =>
                  updateStatus.mutate({
                    complaintId,
                    data: { status: newStatus, note: statusNote || undefined },
                  })
                }
              >
                {updateStatus.isPending ? "Updating..." : "Update Status"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="space-y-4 mt-4">
          {complaint.investigationReport ? (
            <Card className="bg-muted/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Submitted Investigation Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Summary</div>
                  <p className="text-foreground whitespace-pre-wrap">{complaint.investigationReport.summary}</p>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Findings</div>
                  <p className="text-foreground whitespace-pre-wrap">{complaint.investigationReport.findings}</p>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Recommendation</div>
                  <Badge variant="outline" className="capitalize text-xs">
                    {complaint.investigationReport.recommendation.replace(/_/g, " ")}
                  </Badge>
                </div>
                {complaint.investigationReport.notes && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Notes</div>
                    <p className="text-foreground whitespace-pre-wrap">{complaint.investigationReport.notes}</p>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Submitted by {complaint.investigationReport.authorName ?? "Officer"} ·{" "}
                  {new Date(complaint.investigationReport.createdAt).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-muted/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Submit Investigation Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Summary *</label>
                  <Textarea
                    placeholder="Brief summary of the investigation (min 10 chars)..."
                    value={reportSummary}
                    onChange={(e) => setReportSummary(e.target.value)}
                    rows={3}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Findings *</label>
                  <Textarea
                    placeholder="Detailed findings from the investigation (min 10 chars)..."
                    value={reportFindings}
                    onChange={(e) => setReportFindings(e.target.value)}
                    rows={4}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Recommendation *</label>
                  <Select value={reportRecommendation} onValueChange={setReportRecommendation}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select recommendation..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="substantiated">Substantiated</SelectItem>
                      <SelectItem value="unsubstantiated">Unsubstantiated</SelectItem>
                      <SelectItem value="partially_substantiated">Partially Substantiated</SelectItem>
                      <SelectItem value="referred_to_authority">Referred to Authority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Additional Notes (optional)</label>
                  <Textarea
                    placeholder="Any additional notes..."
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>
                <Button
                  disabled={
                    reportSummary.length < 10 ||
                    reportFindings.length < 10 ||
                    !reportRecommendation ||
                    submitReport.isPending
                  }
                  onClick={() =>
                    submitReport.mutate({
                      complaintId,
                      data: {
                        summary: reportSummary,
                        findings: reportFindings,
                        recommendation: reportRecommendation as "substantiated" | "unsubstantiated" | "partially_substantiated" | "referred_to_authority",
                        notes: reportNotes || undefined,
                      },
                    })
                  }
                >
                  {submitReport.isPending ? "Submitting..." : "Submit Report"}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
