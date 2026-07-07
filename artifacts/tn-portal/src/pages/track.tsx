import { useState } from "react";
import { useI18n } from "@/contexts/i18n";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Clock, MapPin, Building, Info, AlertTriangle, CheckCircle, RotateCcw, Eye, Gavel, XCircle, Languages, Loader2 } from "lucide-react";
import {
  useTrackComplaint as useTrackComplaintQuery,
  getTrackComplaintQueryKey,
  useAiTranslate,
} from "@workspace/api-client-react";

function useTrackComplaint(complaintNumber: string) {
  return useTrackComplaintQuery(complaintNumber, {
    query: {
      enabled: !!complaintNumber,
      queryKey: getTrackComplaintQueryKey(complaintNumber),
      retry: false,
    },
  });
}

export default function Track() {
  const { t, isTa } = useI18n();
  const [searchInput, setSearchInput] = useState("");
  const [complaintNumber, setComplaintNumber] = useState("");
  const [showTranslated, setShowTranslated] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const translateMutation = useAiTranslate();

  const { data: complaint, isLoading, isError } = useTrackComplaint(complaintNumber);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setComplaintNumber(searchInput.trim());
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'under_review': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'under_investigation': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'action_taken': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'resolved': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-4xl font-serif font-bold uppercase tracking-tight text-foreground">
          {t("track_title")}
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          {t("track_desc")}
        </p>
      </div>

      <Card className="mb-8 border-primary/20 shadow-md">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder={t("track_input")} 
                className="pl-10 h-14 text-lg bg-background border-border/60"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="h-14 px-8 text-lg font-semibold">
              {t("track_btn")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {isError && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-8 text-center flex flex-col items-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-xl font-bold text-foreground">Complaint Not Found</h3>
            <p className="text-muted-foreground mt-2">We couldn't find a complaint with that number. Please check and try again.</p>
          </CardContent>
        </Card>
      )}

      {complaint && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card>
            <CardHeader className="border-b border-border/40 pb-6 bg-muted/10">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-mono font-medium text-muted-foreground bg-background px-2 py-1 rounded border border-border">
                      {complaint.complaintNumber}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(complaint.status)}`}>
                      {t(`status_${complaint.status}` as any) || complaint.status}
                    </span>
                  </div>
                  <CardTitle className="text-2xl font-bold text-foreground">{complaint.title}</CardTitle>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">Priority</span>
                  <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                    complaint.priority === 'critical' ? 'bg-red-500 text-white' :
                    complaint.priority === 'high' ? 'bg-orange-500 text-white' :
                    complaint.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-600' :
                    'bg-green-500/20 text-green-600'
                  }`}>
                    {t(`priority_${complaint.priority}` as any) || complaint.priority}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-2">
                        <Info className="h-4 w-4" /> Description
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs px-2 gap-1"
                        onClick={async () => {
                          if (showTranslated) {
                            setShowTranslated(false);
                          } else {
                            if (translatedText === null) {
                              try {
                                const result = await translateMutation.mutateAsync({
                                  data: {
                                    text: complaint.description,
                                    targetLang: isTa ? "en" : "ta",
                                  },
                                });
                                setTranslatedText(result.translatedText);
                              } catch {}
                            }
                            setShowTranslated(true);
                          }
                        }}
                        disabled={translateMutation.isPending}
                      >
                        {translateMutation.isPending
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <Languages className="h-3 w-3" />
                        }
                        {showTranslated ? (isTa ? "Show Tamil" : "Show English") : (isTa ? "Translate to English" : "மொழிபெயர்க்கவும்")}
                      </Button>
                    </div>
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {showTranslated && translatedText ? translatedText : complaint.description}
                    </p>
                    {showTranslated && translatedText && (
                      <p className="text-xs text-muted-foreground mt-1 italic">AI translation — may not be fully accurate</p>
                    )}
                  </div>
                  
                  {complaint.amountInvolved && (
                    <div className="bg-destructive/5 border border-destructive/10 rounded-lg p-4">
                      <h4 className="text-sm uppercase font-bold tracking-wider text-destructive mb-1">Amount Involved</h4>
                      <p className="text-2xl font-mono font-bold text-foreground">₹{complaint.amountInvolved.toLocaleString('en-IN')}</p>
                    </div>
                  )}

                  {complaint.statusHistory && complaint.statusHistory.length > 0 && (
                    <div>
                      <h4 className="text-sm uppercase font-bold tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                        <RotateCcw className="h-4 w-4" /> Status Timeline
                      </h4>
                      <ol className="relative border-l border-border/40 space-y-0">
                        {complaint.statusHistory.map((item, idx) => {
                          const isLast = idx === complaint.statusHistory!.length - 1;
                          const statusIcons: Record<string, React.ReactNode> = {
                            submitted: <Clock className="h-3.5 w-3.5" />,
                            under_review: <Eye className="h-3.5 w-3.5" />,
                            under_investigation: <Search className="h-3.5 w-3.5" />,
                            action_taken: <Gavel className="h-3.5 w-3.5" />,
                            resolved: <CheckCircle className="h-3.5 w-3.5" />,
                            rejected: <XCircle className="h-3.5 w-3.5" />,
                          };
                          return (
                            <li key={idx} className="mb-6 ml-4">
                              <div className={`absolute -left-2 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] ${
                                isLast ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-border/60 text-muted-foreground'
                              }`}>
                                {statusIcons[item.status] ?? <Clock className="h-2.5 w-2.5" />}
                              </div>
                              <div className="flex flex-wrap items-baseline gap-2">
                                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusColor(item.status)}`}>
                                  {t(`status_${item.status}` as any) || item.status}
                                </span>
                                <time className="text-xs text-muted-foreground">
                                  {new Date(item.changedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </time>
                              </div>
                              {item.note && (
                                <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
                              )}
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  )}
                </div>
                
                <div className="space-y-6 bg-muted/20 p-6 rounded-lg border border-border/40">
                  {complaint.incidentDate && (
                    <div>
                      <h4 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1 flex items-center gap-2">
                        <Clock className="h-3 w-3" /> Incident Date
                      </h4>
                      <p className="font-medium text-foreground">{new Date(complaint.incidentDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1 flex items-center gap-2">
                      <MapPin className="h-3 w-3" /> Location
                    </h4>
                    <p className="font-medium text-foreground">
                      {[complaint.districtName, complaint.talukName, (complaint as any).village].filter(Boolean).join(', ') || 'Not specified'}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1 flex items-center gap-2">
                      <Building className="h-3 w-3" /> Department
                    </h4>
                    <p className="font-medium text-foreground">
                      {complaint.departmentName || 'Not specified'}
                    </p>
                    {complaint.officeName && <p className="text-sm text-muted-foreground mt-1">{complaint.officeName}</p>}
                  </div>
                  
                  {complaint.categoryName && (
                    <div>
                      <h4 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">Category</h4>
                      <p className="font-medium text-foreground">
                        {complaint.categoryName}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
