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
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 border-r border-border/60 bg-card/60 flex-col py-4">
        <div className="px-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Officer Portal
              </div>
              <div className="text-[11px] text-primary font-medium truncate">
                {ROLE_LABELS[role] ?? role}
              </div>
            </div>
          </div>
          {user?.email && (
            <div className="text-[11px] text-muted-foreground truncate px-0.5">
              {user.email}
            </div>
          )}
        </div>

        <nav className="flex-1 px-2 space-y-0.5">
          {visibleItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2.5 h-9 text-sm font-medium rounded-md",
                    active
                      ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.icon}
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 pt-4 border-t border-border/60">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs text-muted-foreground"
            >
              ← Back to Portal
            </Button>
          </Link>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top nav */}
        <div className="md:hidden sticky top-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur px-2 py-1.5 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {visibleItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 gap-1.5 text-xs whitespace-nowrap",
                      active
                        ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                        : "text-muted-foreground",
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

        <main className="flex-1 overflow-auto bg-background">{children}</main>
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
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!roles.includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          You don't have permission to access this section. Your current role is{" "}
          <strong>{ROLE_LABELS[role] ?? role}</strong>.
        </p>
        <Link href="/" className="mt-6">
          <Button variant="outline" size="sm">
            Return to Home
          </Button>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
