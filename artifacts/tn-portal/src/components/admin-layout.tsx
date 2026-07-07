import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Users,
  ClipboardList,
  Settings,
  ChevronRight,
  Shield,
  AlertCircle,
  BarChart2,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";

interface NavItem {
  href: string;
  label: string;
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
    icon: <FileText className="h-4 w-4" />,
  },
  {
    href: "/admin/users",
    label: "User Management",
    icon: <Users className="h-4 w-4" />,
    adminOnly: true,
  },
  {
    href: "/admin/audit-logs",
    label: "Audit Logs",
    icon: <ClipboardList className="h-4 w-4" />,
    adminOnly: true,
  },
  {
    href: "/admin/master-data",
    label: "Master Data",
    icon: <Settings className="h-4 w-4" />,
    superAdminOnly: true,
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: <BarChart2 className="h-4 w-4" />,
  },
];

const ROLE_LABELS: Record<string, string> = {
  citizen: "Citizen",
  village_officer: "Village Officer",
  taluk_officer: "Taluk Officer",
  district_officer: "District Officer",
  department_officer: "Department Officer",
  ministry_officer: "Ministry Officer",
  state_administrator: "State Administrator",
  super_admin: "Super Admin",
  investigation_officer: "Investigation Officer",
  moderator: "Moderator",
  auditor: "Auditor",
  legal_officer: "Legal Officer",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, role, isAdmin, isSuperAdmin } = useCurrentUser();

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="w-56 shrink-0 border-r border-border/40 bg-muted/20 flex flex-col py-4">
        <div className="px-4 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Officer Portal
            </span>
          </div>
          <div className="text-xs text-primary font-medium">
            {ROLE_LABELS[role] ?? role}
          </div>
          {user?.email && (
            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          )}
        </div>

        <nav className="flex-1 px-2 space-y-0.5">
          {navItems
            .filter((item) => {
              if (item.superAdminOnly) return isSuperAdmin;
              if (item.adminOnly) return isAdmin;
              return true;
            })
            .map((item) => {
              const active =
                location === item.href || location.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={active ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2 h-9 text-sm font-medium",
                      active && "text-foreground",
                      !active && "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.icon}
                    {item.label}
                    {active && <ChevronRight className="h-3 w-3 ml-auto" />}
                  </Button>
                </Link>
              );
            })}
        </nav>

        <div className="px-4 pt-4 border-t border-border/40">
          <Link href="/">
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground">
              ← Back to Portal
            </Button>
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
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
