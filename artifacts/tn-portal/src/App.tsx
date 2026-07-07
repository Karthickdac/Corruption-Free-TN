import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { ClerkProvider } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { dark } from "@clerk/themes";
import { I18nProvider } from "@/contexts/i18n";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";

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
