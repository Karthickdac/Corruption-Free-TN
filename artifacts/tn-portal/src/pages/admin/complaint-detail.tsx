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
        toast({ title: "Note recorded" });
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
        toast({ title: "Investigation report submitted successfully" });
        setReportSummary("");
        setReportFindings("");
        setReportRecommendation("");
        setReportNotes("");
      },
      onError: (err: { message?: string }) => {
        toast({ title: "Submission failed", description: err?.message, variant: "destructive" });
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
      <div className="space-y-6">
        <Link href="/admin/dashboard">
          <Button variant="ghost" className="rounded-none font-bold uppercase tracking-wider text-xs gap-2 border-2 border-transparent hover:border-stone-300">
            <ArrowLeft className="h-4 w-4" /> Back to Base
          </Button>
        </Link>
        <div className="border-4 border-dashed border-stone-300 p-16 text-center text-stone-500 bg-white">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm font-bold uppercase tracking-wider">
            {isNaN(complaintId) ? "INVALID FILE IDENTIFIER." : "FILE NOT FOUND OR FETCHING DATA..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-4 border-stone-800 pb-6">
        <div>
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm" className="mb-4 rounded-none font-bold uppercase tracking-wider text-[10px] h-7 gap-1 border-2 border-transparent hover:border-stone-300 bg-stone-100 hover:bg-white text-stone-600">
              <ArrowLeft className="h-3 w-3" /> Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <span className="text-sm font-mono font-black bg-stone-900 text-white px-2 py-0.5">{complaint.complaintNumber}</span>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
            {complaint.isOverdue && (
              <Badge className="rounded-none bg-red-600 text-white border-red-800 text-[10px] px-1.5 py-0 font-bold uppercase tracking-widest border-2">SLA BREACH</Badge>
            )}
          </div>
          <h1 className="text-3xl font-black font-serif text-stone-900 leading-tight max-w-4xl">{complaint.title}</h1>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase font-bold tracking-widest text-stone-500 mb-1">Filed On</div>
          <div className="font-mono font-bold text-stone-900">{new Date(complaint.createdAt).toLocaleDateString()} {new Date(complaint.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="w-full h-auto flex-wrap justify-start rounded-none border-b-2 border-stone-200 bg-transparent p-0 gap-2">
          <TabsTrigger value="details" className="rounded-none border-2 border-transparent data-[state=active]:border-stone-900 data-[state=active]:bg-stone-900 data-[state=active]:text-white font-bold uppercase tracking-wider text-xs py-2 px-4">
            <FileText className="h-4 w-4 mr-2" /> File Details
          </TabsTrigger>
          <TabsTrigger value="evidence" className="rounded-none border-2 border-transparent data-[state=active]:border-stone-900 data-[state=active]:bg-stone-900 data-[state=active]:text-white font-bold uppercase tracking-wider text-xs py-2 px-4" data-testid="tab-evidence">
            <Paperclip className="h-4 w-4 mr-2" /> Evidence
          </TabsTrigger>
          <TabsTrigger value="notes" className="rounded-none border-2 border-transparent data-[state=active]:border-stone-900 data-[state=active]:bg-stone-900 data-[state=active]:text-white font-bold uppercase tracking-wider text-xs py-2 px-4">
            <MessageSquare className="h-4 w-4 mr-2" />
            Notes {caseNotes.length > 0 && <span className="ml-1 opacity-70">({caseNotes.length})</span>}
          </TabsTrigger>
          <TabsTrigger value="workflow" className="rounded-none border-2 border-transparent data-[state=active]:border-stone-900 data-[state=active]:bg-stone-900 data-[state=active]:text-white font-bold uppercase tracking-wider text-xs py-2 px-4">
            <Clock className="h-4 w-4 mr-2" /> Workflow
          </TabsTrigger>
          <TabsTrigger value="report" className="rounded-none border-2 border-transparent data-[state=active]:border-stone-900 data-[state=active]:bg-stone-900 data-[state=active]:text-white font-bold uppercase tracking-wider text-xs py-2 px-4">
            <ShieldCheck className="h-4 w-4 mr-2" /> Investigation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6 mt-6 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card className="rounded-none border-2 border-stone-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                <CardHeader className="bg-stone-100 border-b-2 border-stone-200 py-3">
                  <CardTitle className="text-sm font-black uppercase tracking-widest">Incident Description</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="whitespace-pre-wrap text-stone-800 font-medium leading-relaxed">
                    {complaint.description}
                  </p>
                </CardContent>
              </Card>

              {complaint.statusHistory && complaint.statusHistory.length > 0 && (
                <Card className="rounded-none border-2 border-stone-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                  <CardHeader className="bg-stone-100 border-b-2 border-stone-200 py-3">
                    <CardTitle className="text-sm font-black uppercase tracking-widest">Chain of Custody</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6 border-l-2 border-stone-200 pl-4 ml-2">
                      {complaint.statusHistory.map((h, i) => (
                        <div key={i} className="relative">
                          <div className="absolute w-3 h-3 bg-stone-900 rounded-none -left-[23px] top-1 border-2 border-white" />
                          <div className="flex items-center gap-3 mb-1">
                            <StatusBadge status={h.status} className="border" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                              {new Date(h.changedAt).toLocaleString()}
                            </span>
                          </div>
                          {h.note && (
                            <div className="mt-2 bg-stone-50 p-3 border-l-4 border-stone-300 text-sm font-medium text-stone-700">
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
              <Card className="rounded-none border-2 border-stone-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                <CardHeader className="bg-stone-100 border-b-2 border-stone-200 py-3">
                  <CardTitle className="text-sm font-black uppercase tracking-widest">Metadata</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <dl className="divide-y divide-stone-200">
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
                        <div key={label} className="p-4 flex flex-col gap-1">
                          <dt className="text-[10px] font-black uppercase tracking-widest text-stone-500">{label}</dt>
                          <dd className="text-sm font-bold text-stone-900">{value}</dd>
                        </div>
                      ))}
                  </dl>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="evidence" className="mt-6 outline-none">
          <EvidenceGallery complaintId={complaintId} />
        </TabsContent>

        <TabsContent value="notes" className="mt-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 order-last lg:order-first">
              <Card className="rounded-none border-2 border-stone-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] sticky top-6">
                <CardHeader className="bg-stone-100 border-b-2 border-stone-200 py-3">
                  <CardTitle className="text-sm font-black uppercase tracking-widest">Append Record</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Record Type</label>
                    <Select value={noteType} onValueChange={(v) => setNoteType(v as CaseNoteInputNoteType)}>
                      <SelectTrigger className="rounded-none border-2 h-10 font-bold text-xs uppercase tracking-wider">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-2">
                        {Object.entries(NOTE_TYPE_LABELS).map(([v, l]) => (
                          <SelectItem key={v} value={v} className="font-bold text-xs uppercase tracking-wider">{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Visibility</label>
                    <div className="flex bg-stone-100 border-2 border-stone-200 p-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`flex-1 rounded-none text-xs font-bold uppercase tracking-wider h-8 ${isInternal ? 'bg-amber-100 text-amber-900 shadow-sm border-2 border-amber-300' : 'text-stone-500 hover:text-stone-900'}`}
                        onClick={() => setIsInternal(true)}
                      >
                        <EyeOff className="h-3 w-3 mr-2" /> Internal
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`flex-1 rounded-none text-xs font-bold uppercase tracking-wider h-8 ${!isInternal ? 'bg-white text-stone-900 shadow-sm border-2 border-stone-300' : 'text-stone-500 hover:text-stone-900'}`}
                        onClick={() => setIsInternal(false)}
                      >
                        <Eye className="h-3 w-3 mr-2" /> Public
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Content</label>
                    <Textarea
                      placeholder="ENTER LOG DETAILS..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      rows={5}
                      className="rounded-none border-2 resize-none font-medium text-sm p-3 focus:ring-0 focus:border-stone-900"
                    />
                  </div>
                  <Button
                    className="w-full rounded-none font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                    disabled={!noteContent.trim() || addNote.isPending}
                    onClick={() =>
                      addNote.mutate({
                        complaintId,
                        data: { noteType, content: noteContent, isInternal },
                      })
                    }
                  >
                    {addNote.isPending ? "SAVING..." : "COMMIT TO RECORD"}
                  </Button>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2">
              {notesLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent" />
                </div>
              ) : caseNotes.length === 0 ? (
                <div className="border-4 border-dashed border-stone-300 p-16 text-center text-stone-500 bg-white">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm font-bold uppercase tracking-wider">No officer notes recorded.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {caseNotes.map((note) => (
                    <Card key={note.id} className={`rounded-none border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] ${note.isInternal ? "border-amber-400 bg-amber-50/30" : "border-stone-300 bg-white"}`}>
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-3 border-b-2 border-stone-100 pb-3">
                          <Badge variant="outline" className="rounded-none text-[10px] font-bold uppercase tracking-widest border-2 border-stone-300 bg-stone-100 text-stone-700">
                            {NOTE_TYPE_LABELS[note.noteType] ?? note.noteType}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`rounded-none text-[10px] font-bold uppercase tracking-widest border-2 ${note.isInternal ? "border-amber-400 bg-amber-100 text-amber-900" : "border-emerald-400 bg-emerald-100 text-emerald-900"}`}
                          >
                            {note.isInternal ? "INTERNAL ONLY" : "PUBLIC VISIBLE"}
                          </Badge>
                          <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-auto text-right">
                            {new Date(note.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex gap-4">
                          <div className="w-10 h-10 bg-stone-200 border-2 border-stone-300 shrink-0 flex items-center justify-center font-bold text-stone-500">
                            {note.authorName ? note.authorName.charAt(0).toUpperCase() : "O"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black uppercase tracking-widest text-stone-800 mb-2">{note.authorName ?? "OFFICER"}</p>
                            <p className="text-sm font-medium text-stone-900 whitespace-pre-wrap leading-relaxed">{note.content}</p>
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

        <TabsContent value="workflow" className="mt-6 outline-none">
          <Card className="rounded-none border-2 border-stone-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] max-w-2xl">
            <CardHeader className="bg-stone-100 border-b-2 border-stone-200 py-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest">Execute State Transition</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-4 bg-stone-50 p-4 border border-stone-200">
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Current State:</span>
                <StatusBadge status={complaint.status} className="text-sm py-1" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Target State</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="rounded-none border-2 h-12 font-bold uppercase tracking-wider text-sm">
                    <SelectValue placeholder="SELECT TARGET STATE..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2">
                    {(ALLOWED_TRANSITIONS[complaint.status] ?? []).map((s) => (
                      <SelectItem key={s} value={s} className="font-bold uppercase tracking-wider text-xs">{STATUS_LABELS[s] ?? s}</SelectItem>
                    ))}
                    {(ALLOWED_TRANSITIONS[complaint.status] ?? []).length === 0 && (
                      <div className="p-4 text-xs font-bold text-stone-500 uppercase text-center">No transitions available from current state</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Transition Justification (Optional)</label>
                <Textarea
                  placeholder="ENTER REASONING FOR THIS TRANSITION..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                  className="rounded-none border-2 resize-none font-medium text-sm focus:ring-0 focus:border-stone-900"
                />
              </div>
              <Button
                className="w-full h-12 rounded-none font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] text-sm"
                disabled={!newStatus || updateStatus.isPending}
                onClick={() =>
                  updateStatus.mutate({
                    complaintId,
                    data: { status: newStatus, note: statusNote || undefined },
                  })
                }
              >
                {updateStatus.isPending ? "EXECUTING..." : "AUTHORIZE TRANSITION"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="mt-6 outline-none">
          {complaint.investigationReport ? (
            <Card className="rounded-none border-2 border-emerald-400 shadow-[4px_4px_0px_0px_rgba(16,185,129,0.15)] bg-white max-w-4xl">
              <CardHeader className="bg-emerald-50 border-b-2 border-emerald-200 py-4 flex flex-row items-center gap-3">
                <div className="h-10 w-10 bg-emerald-500 flex items-center justify-center border-2 border-emerald-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-black uppercase tracking-widest text-emerald-900">Official Investigation Report</CardTitle>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mt-1">FILED ON RECORD</p>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <dl className="divide-y-2 divide-stone-100">
                  <div className="p-6 bg-emerald-50/30">
                    <dt className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Final Recommendation</dt>
                    <dd>
                      <Badge className="rounded-none bg-stone-900 text-white hover:bg-stone-800 text-sm py-1 px-3 uppercase tracking-widest font-black border-2 border-transparent">
                        {complaint.investigationReport.recommendation.replace(/_/g, " ")}
                      </Badge>
                    </dd>
                  </div>
                  <div className="p-6">
                    <dt className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Executive Summary</dt>
                    <dd className="text-sm font-medium text-stone-900 whitespace-pre-wrap leading-relaxed">{complaint.investigationReport.summary}</dd>
                  </div>
                  <div className="p-6">
                    <dt className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Detailed Findings</dt>
                    <dd className="text-sm font-medium text-stone-900 whitespace-pre-wrap leading-relaxed">{complaint.investigationReport.findings}</dd>
                  </div>
                  {complaint.investigationReport.notes && (
                    <div className="p-6">
                      <dt className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Supplementary Notes</dt>
                      <dd className="text-sm font-medium text-stone-900 whitespace-pre-wrap leading-relaxed">{complaint.investigationReport.notes}</dd>
                    </div>
                  )}
                  <div className="p-4 bg-stone-100 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-stone-500">
                    <span>Investigating Officer: {complaint.investigationReport.authorName ?? "UNKNOWN"}</span>
                    <span>Timestamp: {new Date(complaint.investigationReport.createdAt).toLocaleString()}</span>
                  </div>
                </dl>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-none border-2 border-stone-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] max-w-4xl">
              <CardHeader className="bg-stone-100 border-b-2 border-stone-200 py-4 flex flex-row items-center gap-3">
                <div className="h-10 w-10 bg-primary flex items-center justify-center border-2 border-stone-700 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-black uppercase tracking-widest text-stone-900">File Investigation Report</CardTitle>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mt-1">THIS ACTION IS PERMANENT</p>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Executive Summary <span className="text-primary">*</span></label>
                  <Textarea
                    placeholder="PROVIDE A HIGH-LEVEL SUMMARY OF THE INVESTIGATION..."
                    value={reportSummary}
                    onChange={(e) => setReportSummary(e.target.value)}
                    rows={3}
                    className="rounded-none border-2 resize-none font-medium focus:ring-0 focus:border-stone-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Detailed Findings <span className="text-primary">*</span></label>
                  <Textarea
                    placeholder="DOCUMENT ALL FACTUAL FINDINGS, EVIDENCE REVIEWED, AND WITNESS STATEMENTS..."
                    value={reportFindings}
                    onChange={(e) => setReportFindings(e.target.value)}
                    rows={6}
                    className="rounded-none border-2 resize-none font-medium focus:ring-0 focus:border-stone-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Official Recommendation <span className="text-primary">*</span></label>
                  <Select value={reportRecommendation} onValueChange={setReportRecommendation}>
                    <SelectTrigger className="rounded-none border-2 h-12 font-bold uppercase tracking-wider text-sm bg-stone-50">
                      <SelectValue placeholder="SELECT FINAL RECOMMENDATION..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-2">
                      <SelectItem value="substantiated" className="font-bold uppercase tracking-wider text-xs">Substantiated - Evidence supports claim</SelectItem>
                      <SelectItem value="unsubstantiated" className="font-bold uppercase tracking-wider text-xs">Unsubstantiated - Insufficient evidence</SelectItem>
                      <SelectItem value="partially_substantiated" className="font-bold uppercase tracking-wider text-xs">Partially Substantiated - Mixed findings</SelectItem>
                      <SelectItem value="referred_to_authority" className="font-bold uppercase tracking-wider text-xs">Referred - Escalate to higher authority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Supplementary Notes</label>
                  <Textarea
                    placeholder="ANY ADDITIONAL CONTEXT NOT COVERED IN MAIN FINDINGS..."
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    rows={3}
                    className="rounded-none border-2 resize-none font-medium focus:ring-0 focus:border-stone-900"
                  />
                </div>
                <div className="pt-4 border-t-2 border-stone-200">
                  <Button
                    className="w-full h-12 rounded-none font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] text-sm"
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
                    {submitReport.isPending ? "SUBMITTING TO RECORD..." : "FINALIZE AND SUBMIT REPORT"}
                  </Button>
                  <p className="text-center text-[10px] font-bold text-stone-500 uppercase mt-3 tracking-widest">
                    Report submission is final and cannot be modified.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
