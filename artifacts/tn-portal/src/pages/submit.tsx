import { useState, useRef, useEffect, useCallback } from "react";
import { useI18n } from "@/contexts/i18n";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCreateComplaint, useRequestUploadUrl, useAddEvidence, useAiClassifyComplaint, type DuplicateMatch } from "@workspace/api-client-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUser } from "@clerk/react";
import { useListDistricts, useListTaluks, useListDepartments, useListComplaintCategories, getListTaluksQueryKey } from "@workspace/api-client-react";
import {
  ChevronRight, ChevronLeft, Building, MapPin, User, Tag, FileText, CheckCircle, Paperclip, X, Upload, Sparkles,
  AlertCircle, Loader2, RotateCw
} from "lucide-react";

const TOTAL_STEPS = 5;

type FormData = {
  departmentId: string;
  categoryId: string;
  districtId: string;
  talukId: string;
  village: string;
  officerName: string;
  officerDesignation: string;
  officeName: string;
  incidentDate: string;
  amountInvolved: string;
  title: string;
  description: string;
  location: string;
  witnesses: string;
  isAnonymous: boolean;
};

const empty: FormData = {
  departmentId: "",
  categoryId: "",
  districtId: "",
  talukId: "",
  village: "",
  officerName: "",
  officerDesignation: "",
  officeName: "",
  incidentDate: "",
  amountInvolved: "",
  title: "",
  description: "",
  location: "",
  witnesses: "",
  isAnonymous: false,
};

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1 justify-center mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center">
          <div
            className={`rounded-full transition-all duration-300 ${
              i + 1 < step
                ? "w-8 h-8 bg-primary flex items-center justify-center"
                : i + 1 === step
                ? "w-8 h-8 bg-primary ring-4 ring-primary/20 flex items-center justify-center"
                : "w-8 h-8 bg-muted/40 flex items-center justify-center"
            }`}
          >
            <span className={`text-xs font-bold ${i + 1 <= step ? "text-primary-foreground" : "text-muted-foreground"}`}>
              {i + 1}
            </span>
          </div>
          {i < total - 1 && (
            <div className={`h-0.5 w-8 mx-1 transition-all duration-300 ${i + 1 < step ? "bg-primary" : "bg-muted/40"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

type EvidenceItem = {
  id: string;
  file: File | null;
  name: string;
  fileType: string;
  size: number;
  status: "uploading" | "done" | "error";
  objectPath?: string;
  fileHash?: string;
};

function EvidenceUploader({
  items,
  onChange,
}: {
  items: EvidenceItem[];
  onChange: (updater: (items: EvidenceItem[]) => EvidenceItem[]) => void;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const requestUpload = useRequestUploadUrl();

  const anyUploading = items.some((i) => i.status === "uploading");

  const computeHash = async (file: File): Promise<string> => {
    const buf = await file.arrayBuffer();
    const hashBuf = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const uploadItem = async (id: string, file: File) => {
    onChange((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: "uploading" } : it))
    );
    try {
      const [fileHash, uploadResult] = await Promise.all([
        computeHash(file),
        requestUpload.mutateAsync({
          data: { name: file.name, size: file.size, contentType: file.type },
        }),
      ]);
      const { uploadURL, objectPath } = uploadResult;
      const putRes = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!putRes.ok) throw new Error("Upload failed");
      onChange((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, status: "done", objectPath, fileHash } : it
        )
      );
    } catch {
      onChange((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: "error" } : it))
      );
      toast({
        title: `${t("upload_failed")}: ${file.name}`,
        description: t("evidence_upload_failed_toast"),
        variant: "destructive",
      });
    }
  };

  const handleFiles = (selected: FileList | null) => {
    if (!selected || selected.length === 0) return;
    for (const file of Array.from(selected)) {
      if (file.size > 20 * 1024 * 1024) {
        toast({ title: `${file.name}: max 20MB`, variant: "destructive" });
        continue;
      }
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      onChange((prev) => [
        ...prev,
        { id, file, name: file.name, fileType: file.type, size: file.size, status: "uploading" },
      ]);
      void uploadItem(id, file);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <div
        className="border-2 border-dashed border-border/60 rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          {anyUploading ? t("uploading") : t("evidence_drop_hint")}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{t("evidence_types")}</p>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,application/pdf,audio/*,video/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((f) => (
            <li
              key={f.id}
              className={`flex items-center gap-2 rounded px-3 py-2 text-sm ${
                f.status === "error"
                  ? "bg-destructive/10 border border-destructive/30"
                  : "bg-muted/20"
              }`}
            >
              {f.status === "error" ? (
                <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
              ) : f.status === "uploading" ? (
                <Loader2 className="h-3.5 w-3.5 text-primary shrink-0 animate-spin" />
              ) : (
                <Paperclip className="h-3.5 w-3.5 text-primary shrink-0" />
              )}
              <span className="truncate flex-1 text-foreground">{f.name}</span>
              {f.status === "error" ? (
                <>
                  <span className="text-destructive text-xs font-medium shrink-0">
                    {t("upload_failed")}
                  </span>
                  {f.file && (
                    <button
                      type="button"
                      onClick={() => f.file && uploadItem(f.id, f.file)}
                      className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline shrink-0"
                    >
                      <RotateCw className="h-3 w-3" />
                      {t("retry")}
                    </button>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground text-xs shrink-0">
                  {(f.size / 1024).toFixed(0)}KB
                </span>
              )}
              <button
                type="button"
                onClick={() => onChange((prev) => prev.filter((it) => it.id !== f.id))}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Submit() {
  const { t, isTa } = useI18n();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isSignedIn } = useUser();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(empty);
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const evidenceFiles = evidenceItems.filter((it) => it.status === "done");
  const hasUploadIssues = evidenceItems.some((it) => it.status === "error" || it.status === "uploading");
  const [result, setResult] = useState<{ complaintNumber: string; id: number } | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[] | null>(null);

  const canUploadEvidence = isSignedIn && !form.isAnonymous;

  const { data: departments } = useListDepartments();
  const { data: categories } = useListComplaintCategories();
  const { data: districts } = useListDistricts();
  const talukParams = { districtId: form.districtId ? parseInt(form.districtId) : undefined };
  const { data: taluks } = useListTaluks(talukParams, {
    query: { enabled: !!form.districtId, queryKey: getListTaluksQueryKey(talukParams) },
  });

  const createComplaint = useCreateComplaint();
  const addEvidence = useAddEvidence();
  const classifyMutation = useAiClassifyComplaint();
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ categoryName: string; confidence: number }>>([]);
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);
  const [appliedCategoryName, setAppliedCategoryName] = useState<string | null>(null);
  const classifyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const upd = (field: keyof FormData, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  const triggerClassify = useCallback(async (text: string) => {
    if (text.length < 50) { setAiSuggestions([]); return; }
    try {
      const result = await classifyMutation.mutateAsync({ data: { text, categories: [] } });
      setAiSuggestions(result.suggestions?.slice(0, 3) ?? []);
    } catch { setAiSuggestions([]); }
  }, [classifyMutation]);

  useEffect(() => {
    setSuggestionsDismissed(false);
    setAppliedCategoryName(null);
    if (classifyTimerRef.current) clearTimeout(classifyTimerRef.current);
    classifyTimerRef.current = setTimeout(() => triggerClassify(form.description), 600);
    return () => { if (classifyTimerRef.current) clearTimeout(classifyTimerRef.current); };
  }, [form.description]);

  const canNextStep = () => {
    if (step === 1) return !!form.departmentId;
    if (step === 2) return !!form.districtId;
    if (step === 4) return form.title.trim().length >= 5 && form.description.trim().length >= 20;
    return true;
  };

  const handleSubmit = async (confirmDuplicate = false) => {
    try {
      const created = await createComplaint.mutateAsync({
        data: {
          confirmDuplicate: confirmDuplicate || undefined,
          title: form.title,
          description: form.description,
          isAnonymous: form.isAnonymous,
          departmentId: form.departmentId ? parseInt(form.departmentId) : undefined,
          categoryId: form.categoryId ? parseInt(form.categoryId) : undefined,
          districtId: form.districtId ? parseInt(form.districtId) : undefined,
          talukId: form.talukId ? parseInt(form.talukId) : undefined,
          officerName: form.officerName || undefined,
          officerDesignation: form.officerDesignation || undefined,
          officeName: form.officeName || undefined,
          incidentDate: form.incidentDate || undefined,
          amountInvolved: form.amountInvolved ? parseFloat(form.amountInvolved) : undefined,
          location: form.location || undefined,
          village: form.village || undefined,
          witnesses: form.witnesses || undefined,
        },
      });

      let evidenceFailed = 0;
      for (const f of evidenceFiles) {
        try {
          await addEvidence.mutateAsync({
            complaintId: created.id,
            data: { fileUrl: f.objectPath!, fileType: f.fileType, fileHash: f.fileHash, description: f.name },
          });
        } catch {
          evidenceFailed++;
        }
      }

      if (evidenceFailed > 0) {
        toast({
          title: t("evidence_error"),
          variant: "destructive",
        });
      }

      setResult({ complaintNumber: created.complaintNumber, id: created.id });
    } catch (err) {
      const apiErr = err as { status?: number; data?: { duplicates?: DuplicateMatch[] } };
      if (apiErr?.status === 409 && Array.isArray(apiErr?.data?.duplicates)) {
        setDuplicates(apiErr.data.duplicates);
        return;
      }
      if (apiErr?.status === 429) {
        toast({ title: t("rate_limited"), variant: "destructive" });
        return;
      }
      toast({ title: t("error_generic"), variant: "destructive" });
    }
  };

  if (result) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-xl text-center">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-serif font-bold text-foreground mb-3">
            {t("submit_success_title")}
          </h1>
          <p className="text-muted-foreground mb-6">{t("submit_success_desc")}</p>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-8">
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-2">
              {t("track_input")}
            </p>
            <p className="text-3xl font-mono font-bold text-primary">{result.complaintNumber}</p>
            <p className="text-xs text-muted-foreground mt-2">{t("submit_save_number")}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => setLocation(`/track?q=${result.complaintNumber}`)}
            >
              {t("track_btn")}
            </Button>
            <Button
              onClick={() => {
                setForm(empty);
                setEvidenceItems([]);
                setResult(null);
                setStep(1);
              }}
            >
              {t("submit_another")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-4xl font-serif font-bold uppercase tracking-tight text-foreground">
          {t("submit_title")}
        </h1>
        <p className="text-lg text-muted-foreground mt-2">{t("submit_desc")}</p>
      </div>

      <StepIndicator step={step} total={TOTAL_STEPS} />

      <Card className="border-border/40 shadow-md">
        <CardContent className="p-6 sm:p-8">
          {/* Step 1: Department + Category */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-foreground">{t("step_dept_title")}</h2>
                  <p className="text-sm text-muted-foreground">{t("step_dept_desc")}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>
                  {t("form_department")} <span className="text-destructive">*</span>
                </Label>
                <Select value={form.departmentId} onValueChange={(v) => upd("departmentId", v)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder={t("form_department")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {departments?.map((d) => (
                      <SelectItem key={d.id} value={d.id.toString()}>
                        {isTa && d.nameTa ? d.nameTa : d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("form_category")}</Label>
                <Select value={form.categoryId} onValueChange={(v) => upd("categoryId", v)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder={t("form_category")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {isTa && c.nameTa ? c.nameTa : c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-foreground">{t("step_loc_title")}</h2>
                  <p className="text-sm text-muted-foreground">{t("step_loc_desc")}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>
                  {t("form_district")} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.districtId}
                  onValueChange={(v) => { upd("districtId", v); upd("talukId", ""); }}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder={t("form_district")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {districts?.map((d) => (
                      <SelectItem key={d.id} value={d.id.toString()}>
                        {isTa && d.nameTa ? d.nameTa : d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("form_taluk")}</Label>
                <Select
                  value={form.talukId}
                  onValueChange={(v) => upd("talukId", v)}
                  disabled={!form.districtId || !taluks?.length}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder={t("form_taluk")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {taluks?.map((t) => (
                      <SelectItem key={t.id} value={t.id.toString()}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("form_village")}</Label>
                <Input
                  placeholder={t("form_village_placeholder")}
                  value={form.village}
                  onChange={(e) => upd("village", e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("form_location")}</Label>
                <Input
                  placeholder={t("form_location")}
                  value={form.location}
                  onChange={(e) => upd("location", e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>
          )}

          {/* Step 3: Officer details */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-foreground">{t("step_officer_title")}</h2>
                  <p className="text-sm text-muted-foreground">{t("step_officer_desc")}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("form_office")}</Label>
                <Input
                  placeholder={t("form_office")}
                  value={form.officeName}
                  onChange={(e) => upd("officeName", e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("form_officer")}</Label>
                <Input
                  placeholder={t("form_officer")}
                  value={form.officerName}
                  onChange={(e) => upd("officerName", e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("form_designation")}</Label>
                <Input
                  placeholder={t("form_designation")}
                  value={form.officerDesignation}
                  onChange={(e) => upd("officerDesignation", e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("form_date")}</Label>
                  <Input
                    type="date"
                    value={form.incidentDate}
                    onChange={(e) => upd("incidentDate", e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("form_amount")}</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.amountInvolved}
                    onChange={(e) => upd("amountInvolved", e.target.value)}
                    className="bg-background"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Description + Evidence */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-foreground">{t("step_desc_title")}</h2>
                  <p className="text-sm text-muted-foreground">{t("step_desc_desc")}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>
                  {t("form_title_label")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder={t("form_title_label")}
                  value={form.title}
                  onChange={(e) => upd("title", e.target.value)}
                  minLength={5}
                  className="bg-background"
                />
                {form.title.length > 0 && form.title.length < 5 && (
                  <p className="text-xs text-destructive">{t("validation_min_5")}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>
                  {t("form_desc_label")} <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  placeholder={t("form_desc_label")}
                  value={form.description}
                  onChange={(e) => upd("description", e.target.value)}
                  rows={5}
                  className="bg-background resize-none"
                />
                {form.description.length > 0 && form.description.length < 20 && (
                  <p className="text-xs text-destructive">{t("validation_min_20")}</p>
                )}
                {aiSuggestions.length > 0 && !suggestionsDismissed && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-primary" /> {t("ai_suggests")}
                    </span>
                    {aiSuggestions.map((s, i) => {
                      const matched = categories?.find(c =>
                        c.name.toLowerCase().includes(s.categoryName.toLowerCase()) ||
                        s.categoryName.toLowerCase().includes(c.name.toLowerCase())
                      );
                      const isApplied = matched != null && form.categoryId === String(matched.id);
                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={!matched}
                          onClick={() => {
                            if (matched) {
                              upd("categoryId", String(matched.id));
                              setAppliedCategoryName(matched.name);
                            }
                          }}
                          className={`text-xs px-2 py-1 rounded-full border transition-colors inline-flex items-center gap-1 ${
                            isApplied
                              ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-600"
                              : matched
                                ? "border-primary/40 bg-primary/5 text-primary hover:bg-primary/10"
                                : "border-border/40 bg-muted/20 text-muted-foreground cursor-default"
                          }`}
                        >
                          {isApplied && <CheckCircle className="h-3 w-3" />}
                          {s.categoryName} <span className="text-muted-foreground">({Math.round(s.confidence * 100)}%)</span>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setSuggestionsDismissed(true)}
                      className="p-0.5 rounded hover:bg-muted transition-colors"
                      aria-label={t("ai_dismiss")}
                    >
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                    {appliedCategoryName && (
                      <span className="text-xs text-emerald-600 w-full sm:w-auto">
                        ✓ {t("ai_category_set")} "{appliedCategoryName}"
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t("form_witnesses")}</Label>
                <Input
                  placeholder={t("form_witnesses")}
                  value={form.witnesses}
                  onChange={(e) => upd("witnesses", e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("evidence_label")}</Label>
                {canUploadEvidence ? (
                  <EvidenceUploader items={evidenceItems} onChange={setEvidenceItems} />
                ) : (
                  <div className="rounded-lg border border-border/40 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                    {!isSignedIn
                      ? t("evidence_auth_notice")
                      : t("evidence_anon_notice")}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 bg-muted/20 border border-border/40 p-4 rounded-lg">
                <Checkbox
                  id="anon"
                  checked={form.isAnonymous}
                  onCheckedChange={(v) => {
                    upd("isAnonymous", !!v);
                    if (!!v) setEvidenceItems([]);
                  }}
                />
                <div>
                  <Label htmlFor="anon" className="cursor-pointer font-semibold">
                    {t("form_anon_label")}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("form_anon_hint")}</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Tag className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-foreground">{t("step_review_title")}</h2>
                  <p className="text-sm text-muted-foreground">{t("step_review_desc")}</p>
                </div>
              </div>

              <div className="space-y-3 bg-muted/20 rounded-lg border border-border/40 divide-y divide-border/30">
                {[
                  {
                    label: t("form_department"),
                    value: departments?.find((d) => d.id.toString() === form.departmentId)?.name,
                  },
                  {
                    label: t("form_category"),
                    value: categories?.find((c) => c.id.toString() === form.categoryId)?.name,
                  },
                  {
                    label: t("form_district"),
                    value: districts?.find((d) => d.id.toString() === form.districtId)?.name,
                  },
                  {
                    label: t("form_taluk"),
                    value: taluks?.find((t) => t.id.toString() === form.talukId)?.name,
                  },
                  { label: t("form_village"), value: form.village },
                  { label: t("form_officer"), value: form.officerName },
                  { label: t("form_date"), value: form.incidentDate },
                  {
                    label: t("form_amount"),
                    value: form.amountInvolved ? `₹${Number(form.amountInvolved).toLocaleString("en-IN")}` : undefined,
                  },
                  { label: t("form_title_label"), value: form.title },
                ]
                  .filter((r) => r.value)
                  .map((r) => (
                    <div key={r.label} className="flex justify-between px-4 py-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {r.label}
                      </span>
                      <span className="text-sm text-foreground text-right max-w-[60%]">{r.value}</span>
                    </div>
                  ))}
              </div>

              <div className="bg-muted/20 rounded-lg border border-border/40 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  {t("form_desc_label")}
                </p>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {form.description}
                </p>
              </div>

              {evidenceFiles.length > 0 && (
                <div className="bg-muted/20 rounded-lg border border-border/40 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    {t("evidence_label")} ({evidenceFiles.length})
                  </p>
                  {evidenceFiles.map((f, i) => (
                    <p key={i} className="text-sm text-foreground flex items-center gap-2">
                      <Paperclip className="h-3 w-3 text-primary" /> {f.name}
                    </p>
                  ))}
                </div>
              )}

              {form.isAnonymous && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 text-sm text-amber-600 font-medium">
                  {t("form_anon_label")}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between gap-3 mt-8 pt-6 border-t border-border/30">
            <Button
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 1}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("back")}
            </Button>
            {step < TOTAL_STEPS ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNextStep()}
                className="gap-2"
              >
                {t("next")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex flex-col items-end gap-1.5">
                <Button
                  onClick={() => handleSubmit(false)}
                  disabled={createComplaint.isPending || hasUploadIssues}
                  className="gap-2 min-w-[140px]"
                >
                  {createComplaint.isPending ? t("submitting") : t("submit_btn")}
                  {!createComplaint.isPending && <CheckCircle className="h-4 w-4" />}
                </Button>
                {hasUploadIssues && (
                  <p className="text-xs text-destructive text-right">{t("evidence_fix_uploads")}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!duplicates}
        onOpenChange={(open) => {
          if (!open) setDuplicates(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dup_title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("dup_desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {duplicates?.map((d) => (
              <div key={d.complaintNumber} className="border border-border rounded-md p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-primary">{d.complaintNumber}</span>
                  <Badge variant="outline" className="text-[10px] uppercase">{d.status}</Badge>
                </div>
                <div className="font-medium mt-1">{d.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {new Date(d.submittedAt).toLocaleDateString()} &middot; {Math.round(d.similarity * 100)}% {t("dup_match")}
                </div>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("dup_cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDuplicates(null);
                handleSubmit(true);
              }}
            >
              {t("dup_submit_anyway")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
