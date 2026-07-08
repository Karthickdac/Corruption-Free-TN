import { useI18n } from "@/contexts/i18n";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useListMyComplaints, getListMyComplaintsQueryKey } from "@workspace/api-client-react";
import {
  Calendar, Building, MapPin, FileText, ShieldAlert, LogIn
} from "lucide-react";

function getStatusColor(status: string) {
  switch (status) {
    case "submitted": return "bg-stone-500/10 text-stone-600 border-stone-500/20";
    case "under_review": return "bg-amber-600/10 text-amber-600 border-amber-600/20";
    case "under_investigation": return "bg-orange-600/10 text-orange-600 border-orange-600/20";
    case "action_taken": return "bg-green-500/10 text-green-600 border-green-500/20";
    case "resolved": return "bg-emerald-600/10 text-emerald-600 border-emerald-600/20";
    case "rejected": return "bg-red-600/10 text-red-600 border-red-600/20";
    default: return "bg-stone-500/10 text-stone-500 border-stone-500/20";
  }
}

function getPriorityStyle(priority: string) {
  switch (priority) {
    case "critical": return "bg-red-500 text-white";
    case "high": return "bg-orange-500 text-white";
    case "medium": return "bg-yellow-500/20 text-yellow-600";
    default: return "bg-green-500/20 text-green-600";
  }
}

export default function MyComplaints() {
  const { t } = useI18n();
  const { isSignedIn, isLoaded } = useCurrentUser();
  const [, setLocation] = useLocation();
  const { data: complaints, isLoading } = useListMyComplaints({
    query: { enabled: !!isSignedIn, queryKey: getListMyComplaintsQueryKey() },
  });

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-xl text-center">
        <ShieldAlert className="h-16 w-16 text-primary mx-auto mb-6" />
        <h1 className="text-3xl font-serif font-bold text-foreground mb-3">
          {t("my_complaints_auth_title")}
        </h1>
        <p className="text-muted-foreground mb-8">
          {t("my_complaints_auth_desc")}
        </p>
        <Link href="/sign-in">
          <Button size="lg" className="gap-2">
            <LogIn className="h-4 w-4" />
            {t("sign_in")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold uppercase tracking-tight text-foreground">
            {t("my_complaints_title")}
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            {t("my_complaints_desc")}
          </p>
        </div>
        <Link href="/submit">
          <Button className="gap-2 shrink-0">
            <FileText className="h-4 w-4" />
            {t("nav_submit")}
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-lg border border-border/40" />
          ))}
        </div>
      ) : !complaints || complaints.length === 0 ? (
        <div className="text-center py-20 bg-muted/10 rounded-lg border border-border/40 border-dashed">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg mb-4">
            {t("my_complaints_empty")}
          </p>
          <Link href="/submit">
            <Button>{t("cta_report")}</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => (
            <Card key={c.id} className="hover-elevate transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-medium text-muted-foreground bg-muted/30 px-2 py-0.5 rounded border border-border/40">
                      {c.complaintNumber}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(c.status)}`}>
                      {t(`status_${c.status}` as any) || c.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getPriorityStyle(c.priority)}`}>
                      {t(`priority_${c.priority}` as any) || c.priority}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center shrink-0">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="text-xl font-bold text-foreground leading-snug">
                  {c.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-muted-foreground text-sm line-clamp-2 mb-4 leading-relaxed">
                  {c.description}
                </p>
                <div className="flex flex-wrap gap-4 text-xs font-medium text-muted-foreground mb-4">
                  {c.districtName && (
                    <span className="flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1 text-primary/70" />
                      {c.districtName}
                    </span>
                  )}
                  {c.departmentName && (
                    <span className="flex items-center">
                      <Building className="h-3.5 w-3.5 mr-1 text-primary/70" />
                      {c.departmentName}
                    </span>
                  )}
                </div>
                <Link href={`/track?q=${c.complaintNumber}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    {t("track_btn")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
