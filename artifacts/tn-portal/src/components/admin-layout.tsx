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
    <div className="admin-theme font-sans text-foreground bg-background flex min-h-[100dvh]">
      {/* Desktop sidebar - Command Center Brutalist */}
      <aside className="hidden md:flex w-64 shrink-0 border-r-4 border-stone-800 bg-stone-950 text-stone-300 flex-col">
        <div className="p-6 border-b border-stone-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-primary flex items-center justify-center border-2 border-stone-700 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold uppercase tracking-widest text-stone-100 font-serif">
                CorruptionFreeTN
              </div>
              <div className="text-[10px] uppercase tracking-wider text-primary font-bold truncate">
                Command Center
              </div>
            </div>
          </div>
          <div className="bg-stone-900 border border-stone-800 p-3 flex flex-col gap-1">
            <div className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">Active Officer</div>
            <div className="text-xs text-stone-200 truncate">{user?.email || "Unknown"}</div>
            <div className="text-xs font-mono text-primary truncate mt-1">[{ROLE_LABELS[role] ?? role}]</div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-3 pl-2">Operations</div>
          {visibleItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-10 text-sm font-bold rounded-none border border-transparent transition-all",
                    active
                      ? "bg-stone-800 text-stone-100 border-l-4 border-l-primary"
                      : "text-stone-400 hover:text-stone-100 hover:bg-stone-900 hover:border-stone-700",
                  )}
                >
                  {item.icon}
                  <span className="uppercase tracking-wider text-xs">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-stone-800 bg-stone-950">
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs uppercase font-bold tracking-widest bg-stone-900 border-stone-700 text-stone-300 hover:bg-stone-800 hover:text-white rounded-none"
            >
              ← Public Portal
            </Button>
          </Link>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col relative">
        {/* Mobile top nav */}
        <div className="md:hidden sticky top-0 z-20 border-b-2 border-stone-800 bg-stone-950 px-2 py-2 overflow-x-auto shadow-md">
          <div className="flex items-center gap-2 min-w-max">
            {visibleItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-9 gap-1.5 text-xs font-bold uppercase tracking-wider rounded-none border border-transparent transition-all",
                      active
                        ? "bg-stone-800 text-stone-100 border-b-2 border-b-primary"
                        : "text-stone-400 hover:text-stone-100 hover:bg-stone-900",
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

        <main className="flex-1 overflow-auto bg-background p-4 md:p-8">
          <div className="max-w-[1600px] mx-auto">
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
        <div className="animate-spin rounded-none h-8 w-8 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!roles.includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4 admin-theme bg-background min-h-[100dvh]">
        <div className="border-4 border-destructive p-8 bg-card shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] max-w-md w-full">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-black uppercase tracking-wider mb-2 font-serif">Clearance Denied</h2>
          <div className="h-1 w-16 bg-destructive mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm mb-6">
            Insufficient clearance level. Your current designation is{" "}
            <span className="font-mono text-destructive bg-destructive/10 px-1 py-0.5 font-bold">[{ROLE_LABELS[role] ?? role}]</span>.
          </p>
          <Link href="/">
            <Button variant="default" size="lg" className="uppercase font-bold tracking-widest rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
              Return to Base
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
