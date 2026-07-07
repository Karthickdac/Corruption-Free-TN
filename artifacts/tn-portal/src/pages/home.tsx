import { useI18n } from "@/contexts/i18n";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ShieldAlert, AlertOctagon, Scale, FileSearch } from "lucide-react";
import { useGetPublicStats } from "@workspace/api-client-react";

export default function Home() {
  const { t, isTa } = useI18n();
  const { data: stats, isLoading } = useGetPublicStats();

  return (
    <div className="w-full flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/40 bg-background pt-24 pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        
        <div className="container relative z-10 mx-auto px-4 flex flex-col items-center text-center space-y-8">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
            <AlertOctagon className="mr-2 h-4 w-4" />
            Tamil Nadu Citizens' Portal
          </div>
          
          <h1 className="max-w-4xl text-5xl md:text-7xl font-serif font-bold tracking-tighter uppercase text-foreground leading-[1.1]">
            {t("hero_title")}
          </h1>
          
          <p className="max-w-2xl text-xl text-muted-foreground">
            {t("hero_subtitle")}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full justify-center">
            <Link href="/submit">
              <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 font-semibold">
                {t("cta_report")}
              </Button>
            </Link>
            <Link href="/track">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8 font-semibold">
                {t("cta_track")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center justify-center p-8 bg-card border border-border/40 rounded-lg shadow-sm hover-elevate">
              <FileSearch className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-4xl font-bold font-serif">{isLoading ? "..." : stats?.totalComplaints || 0}</h3>
              <p className="text-muted-foreground mt-2 uppercase tracking-wider text-sm font-semibold">{t("stats_total")}</p>
            </div>
            <div className="flex flex-col items-center justify-center p-8 bg-card border border-border/40 rounded-lg shadow-sm hover-elevate">
              <Scale className="h-10 w-10 text-emerald-500 mb-4" />
              <h3 className="text-4xl font-bold font-serif">{isLoading ? "..." : stats?.resolved || 0}</h3>
              <p className="text-muted-foreground mt-2 uppercase tracking-wider text-sm font-semibold">{t("stats_resolved")}</p>
            </div>
            <div className="flex flex-col items-center justify-center p-8 bg-card border border-border/40 rounded-lg shadow-sm hover-elevate">
              <ShieldAlert className="h-10 w-10 text-amber-500 mb-4" />
              <h3 className="text-4xl font-bold font-serif">{isLoading ? "..." : stats?.pending || 0}</h3>
              <p className="text-muted-foreground mt-2 uppercase tracking-wider text-sm font-semibold">{t("stats_pending")}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
