import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { I18nProvider } from "@/contexts/i18n";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";
import { useEffect } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

// Pages
import Home from "@/pages/home";
import Submit from "@/pages/submit";
import Track from "@/pages/track";
import Complaints from "@/pages/complaints";
import Transparency from "@/pages/transparency";
import Directory from "@/pages/directory";
import MyComplaints from "@/pages/my-complaints";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import SearchPage from "@/pages/search";
// Admin pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminComplaintDetail from "@/pages/admin/complaint-detail";
import AdminComplaintsList from "@/pages/admin/complaints-list";
import AdminUsers from "@/pages/admin/users";
import AdminAuditLogs from "@/pages/admin/audit-logs";
import AdminMasterData from "@/pages/admin/master-data";
import AdminAnalytics from "@/pages/admin/analytics";

const queryClient = new QueryClient();

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function Router() {
  return (
    <Switch>
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/complaints/:id" component={AdminComplaintDetail} />
      <Route path="/admin/complaints" component={AdminComplaintsList} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/audit-logs" component={AdminAuditLogs} />
      <Route path="/admin/master-data" component={AdminMasterData} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/submit" component={Submit} />
            <Route path="/track" component={Track} />
            <Route path="/complaints" component={Complaints} />
            <Route path="/transparency" component={Transparency} />
            <Route path="/directory" component={Directory} />
            <Route path="/my-complaints" component={MyComplaints} />
            <Route path="/search" component={SearchPage} />
            <Route path="/sign-in" component={SignInPage} />
            <Route path="/sign-up" component={SignUpPage} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

const CITIZEN_ROLE = "citizen";

/**
 * After sign-in, redirects officers/admins (any non-citizen role) to the
 * officer dashboard when they land on a non-admin route.
 */
function RoleRedirect() {
  const { isSignedIn, role } = useCurrentUser();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isSignedIn) return;
    const isOfficer = role && role !== CITIZEN_ROLE;
    const onAdminRoute = location.startsWith("/admin");
    const onAuthRoute =
      location.startsWith("/sign-in") || location.startsWith("/sign-up");
    if (isOfficer && !onAdminRoute && !onAuthRoute) {
      setLocation("/admin/dashboard");
    }
  }, [isSignedIn, role, location, setLocation]);

  return null;
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" forcedTheme="light" defaultTheme="light" enableSystem={false}>
          <I18nProvider>
            <TooltipProvider>
              <RoleRedirect />
              <Router />
              <Toaster />
            </TooltipProvider>
          </I18nProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}

export default App;
