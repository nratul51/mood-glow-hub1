import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DISCLAIMER } from "@/lib/checkin";
import { Leaf } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Check In Hub" },
      {
        name: "description",
        content:
          "Sign in to Check In Hub to log your daily mood, energy and sleep, and see your own wellness patterns over time.",
      },
      { property: "og:title", content: "Sign in · Check In Hub" },
      {
        property: "og:description",
        content: "Sign in to log your daily check-ins and follow your own wellness patterns.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
        if (mode === "signup") {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin },
          });
          if (error) throw error;
          if (data.session) {
            toast.success("Account created. Welcome in.");
          } else {
            toast.success(
              "Account created. Check your email to confirm, then sign in.",
            );
          }
        } else if (mode === "forgot") {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          });
          if (error) throw error;
          toast.success("Check your email for a password reset link.");
          setMode("signin");
        } else {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
        }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10 trend-glow">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-3xl bg-accent">
            <Leaf className="h-6 w-6 text-primary" strokeWidth={1.6} />
          </div>
          <h1 className="text-3xl">Check In Hub</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Thirty seconds a day. Your patterns, in your own words.
          </p>
        </div>

        <form onSubmit={submit} className="soft-card space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {mode !== "forgot" && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {mode === "signup"
              ? "Create account"
              : mode === "forgot"
                ? "Send reset link"
                : "Sign in"}
          </Button>
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setMode((m) =>
                  m === "signup" ? "signin" : m === "forgot" ? "signin" : "signup",
                )
              }
              className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              {mode === "signup"
                ? "Already have an account? Sign in"
                : "New here? Create an account"}
            </button>
            {mode === "signin" && (
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                Forgot password?
              </button>
            )}
          </div>
        </form>

        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">{DISCLAIMER}</p>
      </div>
    </div>
  );
}
