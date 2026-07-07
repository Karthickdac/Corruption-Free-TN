import { useI18n } from "@/contexts/i18n";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  ShieldAlert, 
  AlertOctagon, 
  FileSearch, 
  EyeOff, 
  FileText, 
  Activity, 
  Database,
  ArrowRight,
  Search,
  Landmark,
  Megaphone,
  CheckCircle2,
  MapPin,
  Building2
} from "lucide-react";
import { useGetPublicStats } from "@workspace/api-client-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

export default function Home() {
  const { t, isTa } = useI18n();
  const { data: stats, isLoading } = useGetPublicStats();

  return (
    <div className="w-full flex flex-col bg-background selection:bg-primary/30">
      {/* 1. Hero Section */}
      <section className="relative min-h-[90vh] flex items-center border-b border-border/40 overflow-hidden bg-background">
        {/* Background Texture & Glows */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute inset-0 bg-noise opacity-[0.15] mix-blend-overlay pointer-events-none" />

        <div className="container relative z-10 mx-auto px-4 md:px-8 py-20 flex flex-col md:flex-row items-center justify-between gap-12">
          <motion.div 
            initial="hidden" animate="visible" variants={staggerContainer}
            className="flex-1 space-y-8"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center rounded-sm border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs md:text-sm font-medium text-primary tracking-widest uppercase">
              <ShieldAlert className="mr-2 h-4 w-4" />
              {t("hero_badge")}
            </motion.div>
            
            <motion.h1 variants={fadeUp} className={`font-serif tracking-tight text-foreground ${isTa ? 'text-4xl md:text-5xl lg:text-6xl font-medium leading-[1.3]' : 'text-5xl md:text-6xl lg:text-7xl font-bold uppercase leading-[1.1]'}`}>
              {t("hero_title")}
            </motion.h1>
            
            <motion.p variants={fadeUp} className={`max-w-2xl text-muted-foreground font-medium border-l-2 border-primary/50 pl-6 ${isTa ? 'text-lg md:text-xl leading-relaxed' : 'text-xl md:text-2xl leading-snug'}`}>
              {t("hero_subtitle")}
            </motion.p>
            
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 pt-6 w-full">
              <Link href="/submit">
                <Button size="lg" className="w-full sm:w-auto text-base md:text-lg h-14 px-8 font-medium tracking-wide shadow-[0_0_30px_-10px_rgba(204,163,96,0.4)] hover:shadow-[0_0_40px_-10px_rgba(204,163,96,0.6)] transition-all duration-300">
                  <Megaphone className="mr-2 h-5 w-5" />
                  {t("cta_report")}
                </Button>
              </Link>
              <Link href="/track">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base md:text-lg h-14 px-8 font-medium tracking-wide border-2 hover:bg-secondary transition-all duration-300">
                  <Search className="mr-2 h-5 w-5" />
                  {t("cta_track")}
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 hidden lg:flex justify-end items-center"
          >
            <div className="relative w-full max-w-md aspect-square rounded-full border border-primary/20 flex items-center justify-center p-12 bg-card/30 backdrop-blur-sm shadow-2xl">
              <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
              <div className="relative z-10 text-primary opacity-90 flex flex-col items-center">
                <Landmark className="w-32 h-32 mb-6" strokeWidth={1} />
                <div className="h-[1px] w-16 bg-primary/40 mb-6" />
                <p className="text-sm tracking-[0.2em] uppercase font-serif text-center">{t("hero_emblem")}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. Live Statistics Section */}
      <section className="py-24 bg-card relative z-10 border-b border-border/40">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8"
          >
            <motion.div variants={fadeUp} className="flex flex-col items-start p-6 md:p-8 bg-background border-l-2 border-primary/30 group hover:border-primary transition-colors">
              <FileSearch className="h-8 w-8 text-primary mb-6 opacity-70 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-4xl md:text-5xl font-black font-serif tracking-tight text-foreground">{isLoading ? "—" : stats?.totalComplaints || 0}</h3>
              <p className="text-muted-foreground mt-2 uppercase tracking-widest text-xs font-bold">{t("stats_total")}</p>
            </motion.div>
            
            <motion.div variants={fadeUp} className="flex flex-col items-start p-6 md:p-8 bg-background border-l-2 border-emerald-500/30 group hover:border-emerald-500 transition-colors">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-6 opacity-70 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-4xl md:text-5xl font-black font-serif tracking-tight text-foreground">{isLoading ? "—" : stats?.resolved || 0}</h3>
              <p className="text-muted-foreground mt-2 uppercase tracking-widest text-xs font-bold">{t("stats_resolved")}</p>
            </motion.div>
            
            <motion.div variants={fadeUp} className="flex flex-col items-start p-6 md:p-8 bg-background border-l-2 border-amber-500/30 group hover:border-amber-500 transition-colors">
              <Activity className="h-8 w-8 text-amber-500 mb-6 opacity-70 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-4xl md:text-5xl font-black font-serif tracking-tight text-foreground">{isLoading ? "—" : stats?.underInvestigation || 0}</h3>
              <p className="text-muted-foreground mt-2 uppercase tracking-widest text-xs font-bold">{t("stats_under_investigation")}</p>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-col items-start p-6 md:p-8 bg-background border-l-2 border-border group hover:border-foreground/50 transition-colors">
              <ShieldAlert className="h-8 w-8 text-muted-foreground mb-6 opacity-70 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-4xl md:text-5xl font-black font-serif tracking-tight text-foreground">{isLoading ? "—" : stats?.pending || 0}</h3>
              <p className="text-muted-foreground mt-2 uppercase tracking-widest text-xs font-bold">{t("stats_pending")}</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 3. How It Works Section */}
      <section className="py-32 bg-background relative overflow-hidden">
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-border/40 hidden md:block" />
        
        <div className="container mx-auto px-4 md:px-8">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="mb-20 text-center max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-6xl font-black font-serif uppercase tracking-tight mb-6">{t("home_how_it_works")}</h2>
            <div className="w-24 h-1 bg-primary mx-auto" />
          </motion.div>

          <div className="grid md:grid-cols-2 gap-16 md:gap-24 relative">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="md:pr-12 md:text-right flex flex-col md:items-end">
              <div className="h-16 w-16 bg-muted text-foreground flex items-center justify-center font-black font-serif text-2xl rounded-sm mb-6 border border-border">01</div>
              <h3 className="text-2xl font-bold uppercase tracking-tight mb-4">{t("home_step1_title")}</h3>
              <p className="text-muted-foreground text-lg">{t("home_step1_desc")}</p>
            </motion.div>
            
            <div className="hidden md:block" /> {/* Spacer */}
            <div className="hidden md:block" /> {/* Spacer */}

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="md:pl-12 flex flex-col items-start">
              <div className="h-16 w-16 bg-primary/10 text-primary flex items-center justify-center font-black font-serif text-2xl rounded-sm mb-6 border border-primary/20">02</div>
              <h3 className="text-2xl font-bold uppercase tracking-tight mb-4">{t("home_step2_title")}</h3>
              <p className="text-muted-foreground text-lg">{t("home_step2_desc")}</p>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="md:pr-12 md:text-right flex flex-col md:items-end">
              <div className="h-16 w-16 bg-muted text-foreground flex items-center justify-center font-black font-serif text-2xl rounded-sm mb-6 border border-border">03</div>
              <h3 className="text-2xl font-bold uppercase tracking-tight mb-4">{t("home_step3_title")}</h3>
              <p className="text-muted-foreground text-lg">{t("home_step3_desc")}</p>
            </motion.div>

            <div className="hidden md:block" /> {/* Spacer */}
            <div className="hidden md:block" /> {/* Spacer */}

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="md:pl-12 flex flex-col items-start">
              <div className="h-16 w-16 bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black font-serif text-2xl rounded-sm mb-6 border border-emerald-500/20">04</div>
              <h3 className="text-2xl font-bold uppercase tracking-tight mb-4">{t("home_step4_title")}</h3>
              <p className="text-muted-foreground text-lg">{t("home_step4_desc")}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Top Districts & Departments Section */}
      <section className="py-24 bg-card border-y border-border/40">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-2 gap-12 md:gap-24">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="space-y-8">
              <div className="flex items-center gap-4 border-b border-border/50 pb-4">
                <MapPin className="h-8 w-8 text-primary" />
                <h3 className="text-3xl font-black font-serif uppercase tracking-tight">{t("home_top_districts")}</h3>
              </div>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-12 bg-muted/50 rounded-sm animate-pulse" />
                    ))}
                  </div>
                ) : (
                  stats?.topDistricts?.slice(0, 5).map((district, i) => (
                    <div key={district.name} className="flex items-center justify-between p-4 bg-background border border-border/40 hover:border-primary/30 transition-colors rounded-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground font-mono font-bold">{i + 1}.</span>
                        <span className="font-bold">{district.name}</span>
                      </div>
                      <span className="font-mono text-primary font-bold bg-primary/10 px-3 py-1 rounded-sm">{district.count}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="space-y-8">
              <div className="flex items-center gap-4 border-b border-border/50 pb-4">
                <Building2 className="h-8 w-8 text-primary" />
                <h3 className="text-3xl font-black font-serif uppercase tracking-tight">{t("home_top_departments")}</h3>
              </div>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-12 bg-muted/50 rounded-sm animate-pulse" />
                    ))}
                  </div>
                ) : (
                  stats?.topDepartments?.slice(0, 5).map((dept, i) => (
                    <div key={dept.name} className="flex items-center justify-between p-4 bg-background border border-border/40 hover:border-primary/30 transition-colors rounded-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground font-mono font-bold">{i + 1}.</span>
                        <span className="font-bold truncate max-w-[200px] sm:max-w-[300px]">{dept.name}</span>
                      </div>
                      <span className="font-mono text-primary font-bold bg-primary/10 px-3 py-1 rounded-sm">{dept.count}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
          
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mt-12 text-center">
             <Link href="/directory">
               <Button variant="outline" className="font-bold uppercase tracking-wider h-12 px-8">
                 {t("home_view_directory")}
               </Button>
             </Link>
          </motion.div>
        </div>
      </section>

      {/* 4. Tools for Accountability */}
      <section className="py-32 bg-muted/30 border-b border-border/40">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-black font-serif uppercase tracking-tight mb-6">{t("home_features_title")}</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="bg-card p-8 border border-border/50 hover:border-primary/50 transition-colors">
              <EyeOff className="h-10 w-10 text-primary mb-6" />
              <h3 className="text-xl font-bold uppercase mb-3">{t("home_feature1_title")}</h3>
              <p className="text-muted-foreground">{t("home_feature1_desc")}</p>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="bg-card p-8 border border-border/50 hover:border-primary/50 transition-colors">
              <FileText className="h-10 w-10 text-primary mb-6" />
              <h3 className="text-xl font-bold uppercase mb-3">{t("home_feature2_title")}</h3>
              <p className="text-muted-foreground">{t("home_feature2_desc")}</p>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="bg-card p-8 border border-border/50 hover:border-primary/50 transition-colors">
              <Activity className="h-10 w-10 text-primary mb-6" />
              <h3 className="text-xl font-bold uppercase mb-3">{t("home_feature3_title")}</h3>
              <p className="text-muted-foreground">{t("home_feature3_desc")}</p>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="bg-card p-8 border border-border/50 hover:border-primary/50 transition-colors">
              <Database className="h-10 w-10 text-primary mb-6" />
              <h3 className="text-xl font-bold uppercase mb-3">{t("home_feature4_title")}</h3>
              <p className="text-muted-foreground">{t("home_feature4_desc")}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 5. Interstitial Manifesto */}
      <section className="py-40 bg-foreground text-background relative overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-10 mix-blend-overlay pointer-events-none" />
        <div className="container mx-auto px-4 md:px-8 relative z-10 text-center">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="max-w-4xl mx-auto space-y-8"
          >
            <Landmark className="h-16 w-16 mx-auto opacity-50 mb-8" />
            <h2 className="text-4xl md:text-6xl font-black font-serif uppercase tracking-tight">{t("home_manifesto_title")}</h2>
            <p className="text-2xl md:text-3xl font-medium leading-relaxed opacity-80">
              "{t("home_manifesto_text")}"
            </p>
          </motion.div>
        </div>
      </section>

      {/* 6. CTA Section */}
      <section className="py-32 bg-primary relative overflow-hidden text-primary-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-black/40 via-transparent to-transparent pointer-events-none" />
        
        <div className="container mx-auto px-4 md:px-8 relative z-10 text-center">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="max-w-3xl mx-auto space-y-10"
          >
            <h2 className="text-5xl md:text-7xl font-black font-serif uppercase tracking-tighter drop-shadow-lg">{t("home_cta_title")}</h2>
            <p className="text-xl md:text-2xl font-medium opacity-90">
              {t("home_cta_desc")}
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/submit">
                <Button size="lg" className="w-full sm:w-auto text-xl h-16 px-12 font-bold tracking-wide uppercase bg-background text-foreground hover:bg-background/90 transition-all">
                  {t("cta_report")}
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
