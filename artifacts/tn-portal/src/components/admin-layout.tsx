import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Users,
  ClipboardList,
  Settings,
  Shield,
  AlertCircle,
  BarChart2,
  LogOut
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/constants/complaint-workflow";

interface NavItem {
  href: string;
  label: string;
  shortLabel?: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    href: "/admin/complaints",
    label: "All Complaints",
    shortLabel: "Complaints",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: <BarChart2 className="h-4 w-4" />,
  },
  {
    href: "/admin/users",
    label: "User Management",
    shortLabel: "Users",
    icon: <Users className="h-4 w-4" />,
    adminOnly: true,
  },
  {
    href: "/admin/audit-logs",
    label: "Audit Logs",
    shortLabel: "Audit",
    icon: <ClipboardList className="h-4 w-4" />,
    adminOnly: true,
  },
  {
    href: "/admin/master-data",
    label: "Master Data",
    shortLabel: "Master",
    icon: <Settings className="h-4 w-4" />,
    superAdminOnly: true,
  },
];

function useVisibleNavItems() {
  const { isAdmin, isSuperAdmin } = useCurrentUser();
  return navItems.filter((item) => {
    if (item.superAdminOnly) return isSuperAdmin;
    if (item.adminOnly) return isAdmin;
    return true;
  });
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, role } = useCurrentUser();
  const visibleItems = useVisibleNavItems();

  const isActive = (href: string) =>
    location === href || location.startsWith(href + "/");

  return (
    <div className="admin-theme font-sans text-foreground bg-stone-50 flex min-h-[100dvh]">
      {/* Desktop sidebar - Premium Modern Dark */}
      <aside className="hidden md:flex w-64 shrink-0 bg-[#2C1318] text-stone-300 flex-col border-r border-[#3d1a22] shadow-xl relative z-10">
        <div className="p-6 border-b border-[#3d1a22]">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-primary/20 text-primary flex items-center justify-center rounded-xl border border-primary/30 shadow-inner">
              <Shield className="h-5 w-5 text-red-300" />
            </div>
            <div className="min-w-0">
              <div className="text-base font-semibold tracking-tight text-white">
                TN Portal
              </div>
              <div className="text-[11px] font-medium tracking-wide text-red-300/80 uppercase truncate">
                Admin Console
              </div>
            </div>
          </div>
          
          <div className="bg-[#1f0d11] rounded-xl border border-[#3d1a22] p-4 flex flex-col gap-1.5 shadow-inner">
            <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Signed In</div>
            <div className="text-sm font-medium text-stone-200 truncate">{user?.email || "Unknown User"}</div>
            <div className="inline-flex items-center mt-1">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-red-300 border border-primary/30 font-medium truncate">
                {ROLE_LABELS[role] ?? role}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] uppercase font-semibold text-stone-500 tracking-wider mb-4 px-2">Navigation</div>
          {visibleItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-10 text-sm font-medium rounded-lg transition-all border border-transparent",
                    active
                      ? "bg-[#3d1a22] text-white border-[#4d212b] shadow-sm"
                      : "text-stone-400 hover:text-stone-100 hover:bg-[#3d1a22]/50",
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#3d1a22] bg-[#2C1318]">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs font-medium bg-[#1f0d11] text-stone-400 hover:bg-[#3d1a22] hover:text-white rounded-lg border border-[#3d1a22]"
            >
              <LogOut className="h-3.5 w-3.5 mr-2" />
              Exit to Public Portal
            </Button>
          </Link>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col relative bg-background">
        {/* Mobile top nav */}
        <div className="md:hidden sticky top-0 z-20 border-b border-border/50 bg-background/95 backdrop-blur-sm px-2 py-2 overflow-x-auto shadow-sm">
          <div className="flex items-center gap-2 min-w-max">
            {visibleItems.map((item) => {
              const active = isActive(item.href);
              return (
               <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-9 gap-1.5 text-xs font-medium rounded-full transition-all border",
                      active
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50",
                    )}
                  >
                    {item.icon}
                    {item.shortLabel ?? item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>

        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function RoleGate({
  roles,
  children,
}: {
  roles: string[];
  children: React.ReactNode;
}) {
  const { role, isLoaded } = useCurrentUser();

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center py-24 admin-theme bg-background min-h-[100dvh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!roles.includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4 admin-theme bg-background min-h-[100dvh]">
        <div className="max-w-md w-full bg-card rounded-2xl shadow-xl border border-border/50 p-8 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2 text-foreground">Access Restricted</h2>
          <p className="text-muted-foreground text-sm mb-6">
            You do not have the required authorization level to view this console. Your current designation is{" "}
            <span className="font-medium text-foreground">{ROLE_LABELS[role] ?? role}</span>.
          </p>
          <Link href="/">
            <Button variant="default" size="lg" className="w-full rounded-xl">
              Return to Public Portal
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
