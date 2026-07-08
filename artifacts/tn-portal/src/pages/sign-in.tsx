import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useLogin,
  getGetCurrentUserQueryKey,
} from "@workspace/api-client-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, Loader2 } from "lucide-react";

export default function SignInPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { isLoaded, isSignedIn, role } = useCurrentUser();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const login = useLogin({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetCurrentUserQueryKey(), data.user);
        queryClient.invalidateQueries();
        if (data.user.role && data.user.role !== "citizen") {
          setLocation("/admin/dashboard");
        } else {
          setLocation("/");
        }
      },
      onError: (err) => {
        const message =
          (err.data as { error?: string } | null)?.error ??
          "Sign in failed. Please try again.";
        setError(message);
      },
    },
  });

  useEffect(() => {
    if (isLoaded && isSignedIn && !login.isPending) {
      setLocation(role && role !== "citizen" ? "/admin/dashboard" : "/");
    }
  }, [isLoaded, isSignedIn, role, login.isPending, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) {
      setError("Please enter your email or mobile number and password.");
      return;
    }
    login.mutate({ data: { identifier: identifier.trim(), password } });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            Use your email or mobile number to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="identifier">Email or mobile number</Label>
              <Input
                id="identifier"
                data-testid="input-identifier"
                autoComplete="username"
                placeholder="you@example.com or 98765 43210"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                data-testid="input-password"
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" data-testid="text-signin-error">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={login.isPending}
              data-testid="button-sign-in"
            >
              {login.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sign in
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="font-medium text-primary hover:underline"
              data-testid="link-sign-up"
            >
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
