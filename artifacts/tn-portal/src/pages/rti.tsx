import { useState } from "react";
import { useI18n } from "@/contexts/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useFileRti, useGetRti, getGetRtiQueryKey } from "@workspace/api-client-react";
import { Search, FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    filed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    acknowledged: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    processing: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    responded: "bg-green-500/10 text-green-500 border-green-500/20",
    closed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  };
  const cls = colors[status] ?? "bg-gray-500/10 text-gray-500 border-gray-500/20";
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${cls}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function TrackRtiSection() {
  const { t } = useI18n();
  const [refInput, setRefInput] = useState("");
  const [refNumber, setRefNumber] = useState("");

  const { data: rti, isLoading, isError } = useGetRti(refNumber, {
    query: {
      enabled: !!refNumber,
      queryKey: getGetRtiQueryKey(refNumber),
      retry: false,
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (refInput.trim()) setRefNumber(refInput.trim());
  };

  return (
    <div>
      <h2 className="text-2xl font-serif font-bold text-foreground mb-4">
        {t("rti_track_title")}
      </h2>
      <Card className="mb-6 border-primary/20">
        <CardContent className="p-5">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("rti_ref_placeholder")}
                className="pl-9 bg-background border-border/60"
                value={refInput}
                onChange={(e) => setRefInput(e.target.value)}
              />
            </div>
            <Button type="submit">{t("track_btn")}</Button>
          </form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {isError && refNumber && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-6 flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-destructive shrink-0" />
            <p className="text-muted-foreground">{t("rti_not_found")}</p>
          </CardContent>
        </Card>
      )}

      {rti && (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="border-b border-border/40 bg-muted/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-sm text-muted-foreground bg-background px-2 py-1 rounded border border-border">
                {rti.referenceNumber}
              </span>
              <StatusBadge status={rti.status} />
            </div>
            <CardTitle className="text-xl font-bold">{rti.subject}</CardTitle>
            {rti.complaintNumber && (
              <CardDescription>
                {t("rti_linked_complaint")}: {rti.complaintNumber}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1 flex items-center gap-2">
                <FileText className="h-3 w-3" /> {t("form_desc_label")}
              </p>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">{rti.description}</p>
            </div>
            <div>
              <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1 flex items-center gap-2">
                <Clock className="h-3 w-3" /> {t("rti_filed_at")}
              </p>
              <p className="font-medium text-foreground">
                {new Date(rti.filedAt).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Rti() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"file" | "track">("file");

  const [form, setForm] = useState({
    complaintNumber: "",
    applicantName: "",
    applicantEmail: "",
    subject: "",
    description: "",
  });
  const [submitted, setSubmitted] = useState<{ referenceNumber: string } | null>(null);

  const mutation = useFileRti({
    mutation: {
      onSuccess: (data) => {
        setSubmitted({ referenceNumber: data.referenceNumber });
        toast({ title: t("rti_filed_success"), description: data.referenceNumber });
      },
      onError: () => {
        toast({ title: t("error_generic"), variant: "destructive" });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) return;
    mutation.mutate({
      data: {
        complaintNumber: form.complaintNumber || undefined,
        applicantName: form.applicantName || undefined,
        applicantEmail: form.applicantEmail || undefined,
        subject: form.subject,
        description: form.description,
      },
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-bold uppercase tracking-tight text-foreground">
          {t("rti_title")}
        </h1>
        <p className="text-lg text-muted-foreground mt-2">{t("rti_desc")}</p>
      </div>

      <div className="flex gap-2 mb-8 border-b border-border/40 pb-0">
        <button
          onClick={() => setActiveTab("file")}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "file"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("rti_file_tab")}
        </button>
        <button
          onClick={() => setActiveTab("track")}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "track"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("rti_track_tab")}
        </button>
      </div>

      {activeTab === "track" ? (
        <TrackRtiSection />
      ) : submitted ? (
        <Card className="border-green-500/20 bg-green-500/5 animate-in fade-in duration-500">
          <CardContent className="p-8 text-center flex flex-col items-center gap-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h2 className="text-2xl font-bold text-foreground">{t("rti_success_title")}</h2>
            <p className="text-muted-foreground">{t("rti_success_desc")}</p>
            <span className="font-mono text-lg font-bold text-primary bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
              {submitted.referenceNumber}
            </span>
            <p className="text-sm text-muted-foreground">{t("rti_save_ref")}</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setActiveTab("track"); }}>
                {t("rti_track_tab")}
              </Button>
              <Button onClick={() => setSubmitted(null)}>{t("rti_file_another")}</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="applicantName">{t("rti_applicant_name")}</Label>
              <Input
                id="applicantName"
                placeholder={t("rti_applicant_name_placeholder")}
                value={form.applicantName}
                onChange={(e) => setForm((f) => ({ ...f, applicantName: e.target.value }))}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="applicantEmail">{t("rti_applicant_email")}</Label>
              <Input
                id="applicantEmail"
                type="email"
                placeholder={t("rti_applicant_email_placeholder")}
                value={form.applicantEmail}
                onChange={(e) => setForm((f) => ({ ...f, applicantEmail: e.target.value }))}
                className="bg-background"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="complaintNumber">{t("rti_complaint_number")}</Label>
            <Input
              id="complaintNumber"
              placeholder="CFT-2026-XXXXXX"
              value={form.complaintNumber}
              onChange={(e) => setForm((f) => ({ ...f, complaintNumber: e.target.value }))}
              className="bg-background font-mono"
            />
            <p className="text-xs text-muted-foreground">{t("rti_complaint_number_hint")}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">
              {t("rti_subject")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject"
              placeholder={t("rti_subject_placeholder")}
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              required
              minLength={5}
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">
              {t("rti_description")} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder={t("rti_description_placeholder")}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
              minLength={10}
              rows={6}
              className="bg-background resize-none"
            />
          </div>
          <Button type="submit" size="lg" className="w-full font-semibold" disabled={mutation.isPending}>
            {mutation.isPending ? t("submitting") : t("rti_submit_btn")}
          </Button>
        </form>
      )}
    </div>
  );
}
