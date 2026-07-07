import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { ClerkProvider, useAuth } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { dark } from "@clerk/themes";
import { I18nProvider } from "@/contexts/i18n";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";
import { useEffect, useRef } from "react";
import { usePostAuthSession, useGetCurrentUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";

// Pages
import Home from "@/pages/home";
import Submit from "@/pages/submit";
import Track from "@/pages/track";
import Complaints from "@/pages/complaints";
import Transparency from "@/pages/transparency";
import Directory from "@/pages/directory";
import MyComplaints from "@/pages/my-complaints";
import Rti from "@/pages/rti";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
// Admin pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminComplaintDetail from "@/pages/admin/complaint-detail";
import AdminComplaintsList from "@/pages/admin/complaints-list";
import AdminUsers from "@/pages/admin/users";
import AdminAuditLogs from "@/pages/admin/audit-logs";
import AdminMasterData from "@/pages/admin/master-data";

const queryClient = new QueryClient();

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// REQUIRED — resolves the key from window.location.hostname so the same
// build serves multiple Clerk custom domains.
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// Empty in dev (Clerk hits dev FAPI directly), auto-set in prod.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

// Clerk passes full paths to routerPush/routerReplace, but wouter's
// setLocation prepends the base — strip it to avoid doubling.
function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

function Router() {
  return (
    <Switch>
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/complaints/:id" component={AdminComplaintDetail} />
      <Route path="/admin/complaints" component={AdminComplaintsList} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/audit-logs" component={AdminAuditLogs} />
      <Route path="/admin/master-data" component={AdminMasterData} />
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
            <Route path="/rti" component={Rti} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

/**
 * Fires POST /auth/session exactly once per Clerk session (survives page
 * reloads within the same session) to record the login event in the audit log.
 * Dedupes via sessionStorage keyed on the Clerk session ID.
 */
function AuthSessionLogger() {
  const { isSignedIn, sessionId } = useAuth();
  const { mutate: recordSession } = usePostAuthSession();
  const firedRef = useRef(false);

  useEffect(() => {
    if (!isSignedIn || !sessionId || firedRef.current) return;
    const storageKey = `auth_session_logged_${sessionId}`;
    if (sessionStorage.getItem(storageKey)) return;
    firedRef.current = true;
    sessionStorage.setItem(storageKey, "1");
    recordSession();
  }, [isSignedIn, sessionId, recordSession]);

  return null;
}

const CITIZEN_ROLE = "citizen";

/**
 * After sign-in, redirects the user to the role-appropriate dashboard:
 * - Officers/admins (any non-citizen role) → /admin/dashboard
 * - Citizens → stay on current route (citizen portal)
 * Only fires once per mount when the user is signed in and on a non-admin path.
 */
function RoleRedirect() {
  const { isSignedIn } = useAuth();
  const [location, setLocation] = useLocation();
  const { data: profile } = useGetCurrentUser({
    query: { enabled: !!isSignedIn, queryKey: getGetCurrentUserQueryKey() },
  });

  useEffect(() => {
    if (!isSignedIn || !profile) return;
    const isOfficer = profile.role && profile.role !== CITIZEN_ROLE;
    const onAdminRoute = location.startsWith("/admin");
    if (isOfficer && !onAdminRoute) {
      setLocation("/admin/dashboard");
    }
  }, [isSignedIn, profile, location, setLocation]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      appearance={{
        theme: dark,
        cssLayerName: "clerk",
        variables: { colorPrimary: "#e11d48" }
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <I18nProvider>
            <TooltipProvider>
              <AuthSessionLogger />
              <RoleRedirect />
              <Router />
              <Toaster />
            </TooltipProvider>
          </I18nProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
