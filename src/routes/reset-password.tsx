import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password · Check In Hub" },
      {
        name: "description",
        content: "Set a new password for your Check In Hub account.",
      },
      { property: "og:title", content: "Reset password · Check In Hub" },
      {
        property: "og:description",
        content: "Set a new password for your Check In Hub account.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [validRecovery, setValidRecovery] = useState<boolean | null>(null);

  useEffect(() => {
    // The Supabase client may have already consumed the recovery hash and set
    // a session. Check the hash first, then fall back to a valid session.
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", "?"));
    if (params.get("type") === "recovery") {
      setValidRecovery(true);
      return;
    }
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setValidRecovery(!!data.session);
      })
      .catch(() => setValidRecovery(false));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. You can now sign in.");
      await supabase.auth.signOut();
      navigate({ to: "/auth" });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not reset password",
      );
    } finally {
      setBusy(false);
    }
  };

  if (validRecovery === null) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5 py-10 trend-glow">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-3xl bg-accent">
            <Leaf className="h-6 w-6 text-primary" strokeWidth={1.6} />
          </div>
          <h1 className="text-3xl">Check In Hub</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Checking your reset link...
          </p>
        </div>
      </div>
    );
  }

  if (validRecovery === false) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5 py-10 trend-glow">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-3xl bg-accent">
              <Leaf className="h-6 w-6 text-primary" strokeWidth={1.6} />
            </div>
            <h1 className="text-3xl">Check In Hub</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This password reset link is invalid or has expired.
            </p>
          </div>
          <div className="text-center">
            <Link
              to="/auth"
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10 trend-glow">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-3xl bg-accent">
            <Leaf className="h-6 w-6 text-primary" strokeWidth={1.6} />
          </div>
          <h1 className="text-3xl">Check In Hub</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a new password.
          </p>
        </div>

        <form onSubmit={submit} className="soft-card space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            Update password
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/auth"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
