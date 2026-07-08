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
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (evidence.length === 0) {
    return (
      <Card className="bg-muted/20">
        <CardContent className="py-10 text-center">
          <Paperclip className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No evidence files attached to this complaint.
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
    <div className="space-y-4">
      {images.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Photos ({images.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => openLightbox(e.id)}
                className="group relative aspect-square rounded-md overflow-hidden border border-border/60 bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary"
                data-testid={`evidence-image-${e.id}`}
              >
                {brokenIds.has(e.id) ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1">
                    <ImageOff className="h-6 w-6" />
                    <span className="text-[10px]">Unavailable</span>
                  </div>
                ) : (
                  <img
                    src={evidenceFileUrl(e.fileUrl)}
                    alt={e.description ?? fileNameFromUrl(e.fileUrl)}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    onError={() =>
                      setBrokenIds((prev) => new Set(prev).add(e.id))
                    }
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-white truncate block">
                    {new Date(e.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Documents ({files.length})
          </h3>
          <div className="space-y-1.5">
            {files.map((e) => (
              <Card key={e.id} className="bg-muted/20">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {e.description ?? fileNameFromUrl(e.fileUrl)}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      {e.fileType && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1 py-0"
                        >
                          {e.fileType}
                        </Badge>
                      )}
                      <span>
                        Uploaded {new Date(e.uploadedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <a
                    href={evidenceFileUrl(e.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0"
                  >
                    <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                      <Download className="h-3.5 w-3.5" /> Open
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
        <DialogContent className="max-w-4xl p-2 sm:p-4">
          <DialogTitle className="sr-only">Evidence photo viewer</DialogTitle>
          {current && (
            <div className="space-y-2">
              <div className="relative flex items-center justify-center bg-black/5 rounded-md min-h-[300px] max-h-[70vh] overflow-hidden">
                <img
                  src={evidenceFileUrl(current.fileUrl)}
                  alt={current.description ?? fileNameFromUrl(current.fileUrl)}
                  className="max-h-[70vh] w-auto object-contain"
                />
                {images.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                      onClick={() =>
                        setLightboxIndex(
                          (lightboxIndex! - 1 + images.length) % images.length,
                        )
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                      onClick={() =>
                        setLightboxIndex((lightboxIndex! + 1) % images.length)
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="text-xs text-muted-foreground min-w-0">
                  <span className="truncate block">
                    {current.description ?? fileNameFromUrl(current.fileUrl)}
                  </span>
                  <span>
                    {images.length > 1 &&
                      `${lightboxIndex! + 1} of ${images.length} · `}
                    Uploaded {new Date(current.uploadedAt).toLocaleString()}
                  </span>
                </div>
                <a
                  href={evidenceFileUrl(current.fileUrl)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                    <Download className="h-3.5 w-3.5" /> Open Original
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
