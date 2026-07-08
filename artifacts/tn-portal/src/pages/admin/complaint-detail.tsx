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
import { ArrowLeft, FileText, MessageSquare, Eye, EyeOff, Clock, ShieldCheck, Paperclip, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import {
  STATUS_LABELS,
  ALLOWED_TRANSITIONS,
} from "@/constants/complaint-workflow";
import { StatusBadge, PriorityBadge } from "@/components/admin/status-badge";
import { EvidenceGallery } from "@/components/admin/evidence-gallery";

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
        toast({ title: "Note recorded successfully" });
      },
      onError: (err: { message?: string }) => {
        toast({ title: "Operation failed", description: err?.message, variant: "destructive" });
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
        toast({ title: "Workflow status updated" });
        setNewStatus("");
        setStatusNote("");
      },
      onError: (err: { message?: string }) => {
        toast({ title: "Update failed", description: err?.message, variant: "destructive" });
      },
    },
  });

  if (!complaint) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Link href="/admin/dashboard">
          <Button variant="ghost" className="rounded-lg gap-2 font-medium">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>
        <div className="border border-dashed border-border/60 p-16 text-center text-muted-foreground bg-card rounded-2xl shadow-sm">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-base font-medium">
            {isNaN(complaintId) ? "Invalid file identifier" : "File not found or still fetching..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6">
        <div>
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm" className="mb-4 rounded-lg h-8 gap-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3 flex-wrap mb-3">
            <span className="text-sm font-mono font-semibold bg-muted px-2.5 py-1 rounded-md text-foreground">
              {complaint.complaintNumber}
            </span>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
            {complaint.isOverdue && (
              <Badge variant="destructive" className="rounded-full text-[11px] px-2.5 py-0.5 font-medium shadow-sm">
                SLA Breach
              </Badge>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground leading-tight max-w-4xl">
            {complaint.title}
          </h1>
        </div>
        <div className="text-left md:text-right shrink-0 bg-card border border-border/50 px-4 py-3 rounded-xl shadow-sm">
          <div className="text-xs font-medium text-muted-foreground mb-1">Filed On</div>
          <div className="font-medium text-foreground">
            {new Date(complaint.createdAt).toLocaleDateString()} <span className="text-muted-foreground">at</span> {new Date(complaint.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="w-full h-auto flex-wrap justify-start bg-transparent p-0 gap-2 border-b border-border/40 pb-px">
          <TabsTrigger value="details" className="rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2.5 font-medium transition-all">
            <FileText className="h-4 w-4 mr-2 text-muted-foreground" /> File Details
          </TabsTrigger>
          <TabsTrigger value="evidence" className="rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2.5 font-medium transition-all" data-testid="tab-evidence">
            <Paperclip className="h-4 w-4 mr-2 text-muted-foreground" /> Evidence
          </TabsTrigger>
          <TabsTrigger value="notes" className="rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2.5 font-medium transition-all">
            <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
            Notes {caseNotes.length > 0 && <span className="ml-1.5 inline-flex items-center justify-center bg-muted text-muted-foreground text-[10px] rounded-full px-1.5 min-w-[1.25rem]">{caseNotes.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="workflow" className="rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2.5 font-medium transition-all">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" /> Workflow
          </TabsTrigger>
          <TabsTrigger value="report" className="rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2.5 font-medium transition-all">
            <ShieldCheck className="h-4 w-4 mr-2 text-muted-foreground" /> Investigation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6 mt-6 outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card className="rounded-2xl shadow-sm border-border/50">
                <CardHeader className="border-b border-border/40 py-4 px-6 bg-muted/20">
                  <CardTitle className="text-base font-semibold">Incident Description</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="whitespace-pre-wrap text-foreground/90 font-medium leading-relaxed text-sm md:text-base">
                    {complaint.description}
                  </p>
                </CardContent>
              </Card>

              {complaint.statusHistory && complaint.statusHistory.length > 0 && (
                <Card className="rounded-2xl shadow-sm border-border/50">
                  <CardHeader className="border-b border-border/40 py-4 px-6 bg-muted/20">
                    <CardTitle className="text-base font-semibold">Chain of Custody</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6 border-l-2 border-muted pl-5 ml-2 relative">
                      {complaint.statusHistory.map((h, i) => (
                        <div key={i} className="relative">
                          <div className="absolute w-3.5 h-3.5 bg-background rounded-full -left-[27px] top-1 border-2 border-primary shadow-sm" />
                          <div className="flex items-center gap-3 mb-1.5">
                            <StatusBadge status={h.status} className="shadow-none" />
                            <span className="text-xs font-medium text-muted-foreground">
                              {new Date(h.changedAt).toLocaleString()}
                            </span>
                          </div>
                          {h.note && (
                            <div className="mt-2 bg-muted/30 p-3.5 rounded-xl border border-border/40 text-sm text-foreground">
                              {h.note}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="rounded-2xl shadow-sm border-border/50">
                <CardHeader className="border-b border-border/40 py-4 px-6 bg-muted/20">
                  <CardTitle className="text-base font-semibold">Metadata</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <dl className="divide-y divide-border/40">
                    {(
                      [
                        complaint.districtName ? ["District", complaint.districtName] : null,
                        complaint.talukName ? ["Taluk", complaint.talukName] : null,
                        complaint.departmentName ? ["Department", complaint.departmentName] : null,
                        complaint.categoryName ? ["Category", complaint.categoryName] : null,
                        complaint.officeName ? ["Office", complaint.officeName] : null,
                        complaint.officerName ? ["Subject Officer", complaint.officerName] : null,
                        complaint.amountInvolved ? ["Amount Involved", `₹${complaint.amountInvolved}`] : null,
                        complaint.incidentDate ? ["Incident Date", complaint.incidentDate] : null,
                        complaint.location ? ["Location", complaint.location] : null,
                        complaint.village ? ["Village", complaint.village] : null,
                        complaint.assignedOfficerName ? ["Assigned To", complaint.assignedOfficerName] : null,
                      ] as ([string, string] | null)[]
                    )
                      .filter((item): item is [string, string] => item !== null)
                      .map(([label, value]) => (
                        <div key={label} className="p-4 flex flex-col gap-1 hover:bg-muted/10 transition-colors">
                          <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                          <dd className="text-sm font-semibold text-foreground">{value}</dd>
                        </div>
                      ))}
                  </dl>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="evidence" className="mt-6 outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
          <EvidenceGallery complaintId={complaintId} />
        </TabsContent>

        <TabsContent value="notes" className="mt-6 outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 order-last lg:order-first">
              <Card className="rounded-2xl shadow-sm border-border/50 sticky top-6">
                <CardHeader className="border-b border-border/40 py-4 px-6 bg-muted/20">
                  <CardTitle className="text-base font-semibold">Append Record</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Record Type</label>
                    <Select value={noteType} onValueChange={(v) => setNoteType(v as CaseNoteInputNoteType)}>
                      <SelectTrigger className="rounded-xl h-11 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {Object.entries(NOTE_TYPE_LABELS).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Visibility</label>
                    <div className="flex bg-muted/50 p-1 rounded-xl">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`flex-1 rounded-lg text-sm font-medium h-9 transition-all ${isInternal ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setIsInternal(true)}
                      >
                        <EyeOff className="h-4 w-4 mr-2 text-amber-500" /> Internal
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`flex-1 rounded-lg text-sm font-medium h-9 transition-all ${!isInternal ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setIsInternal(false)}
                      >
                        <Eye className="h-4 w-4 mr-2 text-emerald-500" /> Public
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Content</label>
                    <Textarea
                      placeholder="Enter log details..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      rows={5}
                      className="rounded-xl resize-none font-normal text-sm transition-colors"
                    />
                  </div>
                  <Button
                    className="w-full rounded-xl font-medium shadow-sm"
                    disabled={!noteContent.trim() || addNote.isPending}
                    onClick={() =>
                      addNote.mutate({
                        complaintId,
                        data: { noteType, content: noteContent, isInternal },
                      })
                    }
                  >
                    {addNote.isPending ? "Saving..." : "Commit to Record"}
                  </Button>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2">
              {notesLoading ? (
                <div className="flex justify-center py-16">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : caseNotes.length === 0 ? (
                <div className="border border-dashed border-border/60 rounded-2xl p-16 text-center bg-card shadow-sm">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-1">No notes yet</h3>
                  <p className="text-sm text-muted-foreground">Add notes to track investigation progress.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {caseNotes.map((note) => (
                    <Card key={note.id} className={`rounded-2xl overflow-hidden transition-colors ${note.isInternal ? "border-amber-200/50 bg-amber-50/10" : "border-border/50 bg-card"}`}>
                      <CardContent className="p-0">
                        <div className={`px-5 py-3 border-b flex items-center gap-3 ${note.isInternal ? 'bg-amber-50/50 border-amber-100' : 'bg-muted/20 border-border/40'}`}>
                          <Badge variant="secondary" className="rounded-full text-[10px] font-medium px-2 shadow-none bg-background">
                            {NOTE_TYPE_LABELS[note.noteType] ?? note.noteType}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`rounded-full text-[10px] font-medium px-2 shadow-none border-transparent ${note.isInternal ? "bg-amber-100/50 text-amber-700" : "bg-emerald-100/50 text-emerald-700"}`}
                          >
                            {note.isInternal ? "Internal Only" : "Public"}
                          </Badge>
                          <span className="text-xs font-medium text-muted-foreground ml-auto">
                            {new Date(note.createdAt).toLocaleString(undefined, {
                              year: 'numeric', month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="p-5 flex gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0 flex items-center justify-center font-bold text-sm shadow-inner">
                            {note.authorName ? note.authorName.charAt(0).toUpperCase() : "O"}
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className="text-sm font-semibold text-foreground mb-2">{note.authorName ?? "Officer"}</p>
                            <p className="text-sm font-normal text-foreground/80 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="workflow" className="mt-6 outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Card className="rounded-2xl shadow-sm border-border/50 max-w-2xl">
            <CardHeader className="border-b border-border/40 py-4 px-6 bg-muted/20">
              <CardTitle className="text-base font-semibold">Execute State Transition</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                <span className="text-sm font-medium text-muted-foreground">Current State:</span>
                <StatusBadge status={complaint.status} className="shadow-none text-sm px-3 py-1" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Target State</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="rounded-xl h-12 font-medium">
                    <SelectValue placeholder="Select target state..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {(ALLOWED_TRANSITIONS[complaint.status] ?? []).map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABELS[s] ?? s}</SelectItem>
                    ))}
                    {(ALLOWED_TRANSITIONS[complaint.status] ?? []).length === 0 && (
                      <div className="p-4 text-sm font-medium text-muted-foreground text-center">No transitions available from current state</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Transition Justification (Optional)</label>
                <Textarea
                  placeholder="Enter reasoning for this transition..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                  className="rounded-xl resize-none font-normal text-sm transition-colors"
                />
              </div>
              <Button
                className="w-full h-12 rounded-xl font-medium shadow-sm text-sm"
                disabled={!newStatus || updateStatus.isPending}
                onClick={() =>
                  updateStatus.mutate({
                    complaintId,
                    data: { status: newStatus, note: statusNote || undefined },
                  })
                }
              >
                {updateStatus.isPending ? "Executing..." : "Authorize Transition"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="mt-6 outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
          {complaint.investigationReport ? (
            <Card className="rounded-2xl shadow-sm border-border/50 max-w-2xl">
              <CardHeader className="border-b border-border/40 py-4 px-6 bg-muted/20">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Submitted Investigation Report
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5 text-sm">
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-muted-foreground">Summary</div>
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">{complaint.investigationReport.summary}</p>
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-muted-foreground">Findings</div>
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">{complaint.investigationReport.findings}</p>
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-muted-foreground">Recommendation</div>
                  <Badge variant="outline" className="capitalize text-xs rounded-lg">
                    {complaint.investigationReport.recommendation.replace(/_/g, " ")}
                  </Badge>
                </div>
                {complaint.investigationReport.notes && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-medium text-muted-foreground">Notes</div>
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">{complaint.investigationReport.notes}</p>
                  </div>
                )}
                <div className="text-xs text-muted-foreground pt-3 border-t border-border/40">
                  Submitted by {complaint.investigationReport.authorName ?? "Officer"} ·{" "}
                  {new Date(complaint.investigationReport.createdAt).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl shadow-sm border-border/50 max-w-2xl">
              <CardHeader className="border-b border-border/40 py-4 px-6 bg-muted/20">
                <CardTitle className="text-base font-semibold">Submit Investigation Report</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Summary *</label>
                  <Textarea
                    placeholder="Brief summary of the investigation (min 10 chars)..."
                    value={reportSummary}
                    onChange={(e) => setReportSummary(e.target.value)}
                    rows={3}
                    className="rounded-xl resize-none font-normal text-sm transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Findings *</label>
                  <Textarea
                    placeholder="Detailed findings from the investigation (min 10 chars)..."
                    value={reportFindings}
                    onChange={(e) => setReportFindings(e.target.value)}
                    rows={4}
                    className="rounded-xl resize-none font-normal text-sm transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Recommendation *</label>
                  <Select value={reportRecommendation} onValueChange={setReportRecommendation}>
                    <SelectTrigger className="rounded-xl h-12 font-medium">
                      <SelectValue placeholder="Select recommendation..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="substantiated">Substantiated</SelectItem>
                      <SelectItem value="unsubstantiated">Unsubstantiated</SelectItem>
                      <SelectItem value="partially_substantiated">Partially Substantiated</SelectItem>
                      <SelectItem value="referred_to_authority">Referred to Authority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Additional Notes (optional)</label>
                  <Textarea
                    placeholder="Any additional notes..."
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    rows={2}
                    className="rounded-xl resize-none font-normal text-sm transition-colors"
                  />
                </div>
                <Button
                  className="w-full h-12 rounded-xl font-medium shadow-sm text-sm"
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
