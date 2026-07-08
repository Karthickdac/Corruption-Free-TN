import { Link, useLocation } from "wouter";
import { useI18n } from "@/contexts/i18n";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useLogout } from "@workspace/api-client-react";
import { Languages, Menu, LogOut, Shield } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import NotificationBell from "@/components/notification-bell";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const [location, setLocation] = useLocation();
  const { isSignedIn, user, isOfficer } = useCurrentUser();
  const queryClient = useQueryClient();
  const logout = useLogout({
    mutation: {
      onSettled: () => {
        queryClient.clear();
        setLocation("/");
      },
    },
  });

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'ta' : 'en');
  };

  const navLinks = [
    { href: "/", label: t("nav_home") },
    { href: "/submit", label: t("nav_submit") },
    { href: "/track", label: t("nav_track") },
    { href: "/complaints", label: t("nav_complaints") },
    { href: "/transparency", label: t("nav_transparency") },
    { href: "/search", label: "Search" },
    { href: "/directory", label: t("nav_directory") },
    { href: "/my-complaints", label: t("nav_my_complaints") },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full relative bg-gradient-to-r from-rose-700 via-orange-600 to-amber-600 text-white shadow-lg shadow-orange-900/20">
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-300 via-lime-400 to-emerald-400" />
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="relative flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-8 w-8 text-white fill-white" />
                <span className="absolute font-black text-sm leading-none text-orange-600 pb-0.5">!</span>
              </span>
              <span className="hidden sm:block w-0.5 h-9 bg-white/60 rounded-full" />
              <span className="hidden sm:flex flex-col leading-tight">
                <span className="font-sans font-extrabold text-lg tracking-tight text-white whitespace-nowrap">
                  Corruption Free TN
                </span>
                <span className="text-[11px] text-orange-100 -mt-0.5 whitespace-nowrap">
                  ஊழல் இல்லாத தமிழ்நாடு
                </span>
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button 
                    variant="ghost"
                    className={`h-9 text-sm font-medium rounded-full px-4 no-default-hover-elevate ${
                      location === link.href
                        ? "bg-white/20 text-white hover:bg-white/25"
                        : "text-orange-50 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
              {isOfficer && (
                <Link href="/admin/dashboard">
                  <Button
                    variant="ghost"
                    className={`h-9 text-sm font-medium gap-1.5 rounded-full px-4 no-default-hover-elevate text-amber-100 font-semibold hover:text-white hover:bg-white/10 ${
                      location.startsWith("/admin") ? "bg-white/20" : ""
                    }`}
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Officer Portal
                  </Button>
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />

            <Button variant="ghost" size="icon" onClick={toggleLanguage} className="h-9 w-9 text-orange-100 hover:text-white hover:bg-white/10 no-default-hover-elevate">
              <Languages className="h-4 w-4" />
              <span className="sr-only">Toggle Language</span>
            </Button>
            
            <div className="ml-2 pl-2 border-l border-white/25 flex items-center gap-2">
              {isSignedIn ? (
                <>
                  <span className="hidden sm:inline-block text-sm font-medium text-orange-100 max-w-[140px] truncate">
                    {user?.name || user?.email || user?.phone || "Account"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-orange-100 hover:text-white hover:bg-white/10 no-default-hover-elevate"
                    disabled={logout.isPending}
                    onClick={() => logout.mutate()}
                    data-testid="button-sign-out"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="sr-only">Sign Out</span>
                  </Button>
                </>
              ) : (
                <Link href="/sign-in">
                  <Button className="h-9 bg-white text-orange-700 hover:bg-orange-50 border-0 font-semibold no-default-hover-elevate" size="sm">Sign In</Button>
                </Link>
              )}
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden ml-2 h-9 w-9 text-orange-100 hover:text-white hover:bg-white/10 no-default-hover-elevate">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                <nav className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) => (
                    <Link key={link.href} href={link.href}>
                      <span className={`block px-2 py-1 text-lg font-medium transition-colors hover:text-primary ${location === link.href ? "text-primary" : "text-muted-foreground"}`}>
                        {link.label}
                      </span>
                    </Link>
                  ))}
                  {isOfficer && (
                    <Link href="/admin/dashboard">
                      <span className="block px-2 py-1 text-lg font-medium text-primary">
                        Officer Portal
                      </span>
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="py-6 md:py-8 border-t border-border/40 bg-muted/20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Corruption Free TN &middot; ஊழல் இல்லாத தமிழ்நாடு. {t("footer_text")}
          </p>
        </div>
      </footer>
    </div>
  );
}
