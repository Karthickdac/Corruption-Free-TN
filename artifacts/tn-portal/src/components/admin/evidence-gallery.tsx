import { useState } from "react";
import {
  useListEvidence,
  getListEvidenceQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Paperclip,
} from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

export function evidenceFileUrl(fileUrl: string): string {
  return `${API_BASE}/storage${fileUrl}`;
}

function isImage(fileType: string | null | undefined): boolean {
  return !!fileType && fileType.startsWith("image/");
}

function fileNameFromUrl(fileUrl: string): string {
  const parts = fileUrl.split("/");
  return parts[parts.length - 1] || fileUrl;
}

export function EvidenceGallery({ complaintId }: { complaintId: number }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [brokenIds, setBrokenIds] = useState<Set<number>>(new Set());

  const { data: evidence = [], isLoading } = useListEvidence(complaintId, {
    query: {
      enabled: !!complaintId && !isNaN(complaintId),
      queryKey: getListEvidenceQueryKey(complaintId),
    },
  });

  const images = evidence.filter((e) => isImage(e.fileType));
  const files = evidence.filter((e) => !isImage(e.fileType));

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (evidence.length === 0) {
    return (
      <Card className="bg-muted/30 border-dashed shadow-none">
        <CardContent className="py-12 text-center flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Paperclip className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No attachments</p>
          <p className="text-xs text-muted-foreground mt-1">
            No evidence files attached to this complaint yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const openLightbox = (evidenceId: number) => {
    const idx = images.findIndex((e) => e.id === evidenceId);
    if (idx >= 0) setLightboxIndex(idx);
  };

  const current = lightboxIndex != null ? images[lightboxIndex] : null;

  return (
    <div className="space-y-8">
      {images.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            Photographic Evidence <Badge variant="secondary" className="rounded-full px-2 py-0">{images.length}</Badge>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => openLightbox(e.id)}
                className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-muted/30 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all hover:shadow-md"
                data-testid={`evidence-image-${e.id}`}
              >
                {brokenIds.has(e.id) ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                    <ImageOff className="h-6 w-6 opacity-50" />
                    <span className="text-xs font-medium">Unavailable</span>
                  </div>
                ) : (
                  <img
                    src={evidenceFileUrl(e.fileUrl)}
                    alt={e.description ?? fileNameFromUrl(e.fileUrl)}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={() =>
                      setBrokenIds((prev) => new Set(prev).add(e.id))
                    }
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-medium text-white/90 truncate block drop-shadow-md">
                    {new Date(e.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            Documents <Badge variant="secondary" className="rounded-full px-2 py-0">{files.length}</Badge>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {files.map((e) => (
              <Card key={e.id} className="group overflow-hidden transition-all hover:shadow-md hover:border-border">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate text-foreground">
                      {e.description ?? fileNameFromUrl(e.fileUrl)}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1.5">
                      {e.fileType && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 font-normal rounded bg-muted text-muted-foreground"
                        >
                          {e.fileType.split('/')[1]?.toUpperCase() ?? 'FILE'}
                        </Badge>
                      )}
                      <span className="truncate">
                        {new Date(e.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <a
                    href={evidenceFileUrl(e.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0"
                  >
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary">
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog
        open={lightboxIndex != null}
        onOpenChange={(open) => !open && setLightboxIndex(null)}
      >
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/50">
          <DialogTitle className="sr-only">Evidence photo viewer</DialogTitle>
          {current && (
            <div className="flex flex-col h-[85vh]">
              <div className="relative flex-1 flex items-center justify-center bg-black/5 overflow-hidden p-4">
                <img
                  src={evidenceFileUrl(current.fileUrl)}
                  alt={current.description ?? fileNameFromUrl(current.fileUrl)}
                  className="max-h-full max-w-full w-auto object-contain rounded-lg shadow-2xl"
                />
                {images.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg opacity-70 hover:opacity-100"
                      onClick={() =>
                        setLightboxIndex(
                          (lightboxIndex! - 1 + images.length) % images.length,
                        )
                      }
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg opacity-70 hover:opacity-100"
                      onClick={() =>
                        setLightboxIndex((lightboxIndex! + 1) % images.length)
                      }
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}
              </div>
              <div className="p-4 bg-background border-t border-border flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold truncate text-foreground">
                    {current.description ?? fileNameFromUrl(current.fileUrl)}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                    {images.length > 1 && (
                      <span className="bg-muted px-1.5 py-0.5 rounded font-medium">
                        {lightboxIndex! + 1} of {images.length}
                      </span>
                    )}
                    Uploaded {new Date(current.uploadedAt).toLocaleString()}
                  </p>
                </div>
                <a
                  href={evidenceFileUrl(current.fileUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0"
                >
                  <Button variant="outline" size="sm" className="h-9 gap-2 rounded-lg font-medium shadow-sm">
                    <Download className="h-4 w-4" /> Download Original
                  </Button>
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
