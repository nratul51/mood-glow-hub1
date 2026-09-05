import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useCheckIns, useSettings } from "@/hooks/useCheckIns";
import { trendIntensity } from "@/lib/checkin";
import { AppShell } from "./AppShell";
import { ReminderScheduler } from "./ReminderScheduler";
import { DisclaimerDialog } from "./DisclaimerDialog";

function LoadingScreen() {
  return (
    <div className="mx-auto w-full max-w-lg space-y-4 px-5 pt-16">
      <div className="h-8 w-40 animate-pulse rounded-full bg-muted" />
      <div className="h-32 w-full animate-pulse rounded-3xl bg-muted" />
      <div className="h-40 w-full animate-pulse rounded-3xl bg-muted" />
      <p className="pt-2 text-center text-sm text-muted-foreground">Loading your check-ins…</p>
    </div>
  );
}

export function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: entries } = useCheckIns(28);
  const { data: settings, update } = useSettings();
  const wasSignedIn = useRef(false);
  const [graceOver, setGraceOver] = useState(false);

  if (user) wasSignedIn.current = true;

  useEffect(() => {
    if (loading || user) return;
    // Give a brief grace period so a token refresh doesn't bounce the user out.
    const delay = wasSignedIn.current ? 1500 : 0;
    const id = window.setTimeout(() => setGraceOver(true), delay);
    return () => window.clearTimeout(id);
  }, [loading, user]);

  useEffect(() => {
    if (!loading && !user && graceOver) navigate({ to: "/auth" });
  }, [user, loading, graceOver, navigate]);

  if (!user) {
    return <LoadingScreen />;
  }


  const intensity = trendIntensity(entries ?? []);

  return (
    <div style={{ "--trend": intensity } as React.CSSProperties}>
      <AppShell>{children}</AppShell>
      <ReminderScheduler />
      <DisclaimerDialog
        open={settings ? !settings.disclaimer_ack : false}
        onAcknowledge={() => update.mutate({ disclaimer_ack: true })}
      />
    </div>
  );
}
