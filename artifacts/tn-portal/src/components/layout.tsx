import { Link, useLocation } from "wouter";
import { useI18n } from "@/contexts/i18n";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useUser, useClerk } from "@clerk/react";
import { Moon, Sun, Languages, Menu, ShieldAlert, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'ta' : 'en');
  };

  const navLinks = [
    { href: "/", label: t("nav_home") },
    { href: "/submit", label: t("nav_submit") },
    { href: "/track", label: t("nav_track") },
    { href: "/complaints", label: t("nav_complaints") },
    { href: "/transparency", label: t("nav_transparency") },
    { href: "/directory", label: t("nav_directory") },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <ShieldAlert className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300" />
              <span className="font-serif font-bold text-lg hidden sm:inline-block tracking-tight text-foreground uppercase">
                {t("app_name")}
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button 
                    variant={location === link.href ? "secondary" : "ghost"} 
                    className="h-9 text-sm font-medium"
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleLanguage} className="h-9 w-9">
              <Languages className="h-4 w-4" />
              <span className="sr-only">Toggle Language</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-9 w-9"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle Theme</span>
            </Button>

            <div className="ml-2 pl-2 border-l border-border flex items-center gap-2">
              {isSignedIn ? (
                <>
                  <span className="hidden sm:inline-block text-sm font-medium text-muted-foreground max-w-[140px] truncate">
                    {user?.firstName || user?.primaryEmailAddress?.emailAddress || "Account"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() =>
                      signOut({
                        redirectUrl: import.meta.env.BASE_URL.replace(/\/$/, "") || "/",
                      })
                    }
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="sr-only">Sign Out</span>
                  </Button>
                </>
              ) : (
                <Link href="/sign-in">
                  <Button variant="outline" className="h-9" size="sm">Sign In</Button>
                </Link>
              )}
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden ml-2 h-9 w-9">
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
            &copy; {new Date().getFullYear()} {t("app_name")}. {t("footer_text")}
          </p>
        </div>
      </footer>
    </div>
  );
}
