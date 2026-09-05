import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Bell, LogOut, ShieldQuestion } from "lucide-react";
import { Protected } from "@/components/Protected";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useCheckIns";
import { DISCLAIMER } from "@/lib/checkin";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Check In Hub" },
      {
        name: "description",
        content:
          "Turn the daily check-in reminder on or off, choose the reminder time, and review the Check In Hub wellness disclaimer.",
      },
      { property: "og:title", content: "Settings · Check In Hub" },
      {
        property: "og:description",
        content: "Manage your daily reminder time and review the wellness disclaimer.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <Protected>
      <SettingsPage />
    </Protected>
  ),
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: settings, update } = useSettings();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() =>
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported",
  );

  const enabled = settings?.reminder_enabled ?? false;
  const time = settings?.reminder_time ?? "21:00";

  const toggleReminder = async (next: boolean) => {
    // Email reminders always work. Browser notifications are a bonus — ask for
    // permission, but never block the toggle if it's denied or unavailable
    // (e.g. inside an embedded preview frame).
    if (next && permission === "default") {
      try {
        const result = await Notification.requestPermission();
        setPermission(result);
      } catch {
        // ignore: some embedded contexts reject the request outright
      }
    }
    update.mutate({ reminder_enabled: next });
    if (next) toast.success("Daily reminder on — we'll email you at your chosen time.");
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
      </header>

      <section className="soft-card space-y-4 p-5">
        <div className="flex items-start gap-3">
          <Bell className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.7} />
          <div className="min-w-0 flex-1">
            <p className="font-medium">Daily reminder</p>
            <p className="text-sm text-muted-foreground">
              A gentle nudge if you haven't checked in yet.
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={toggleReminder} className="shrink-0" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Reminder time</Label>
          <Input
            id="time"
            type="time"
            value={time}
            disabled={!enabled}
            onChange={(e) => update.mutate({ reminder_time: e.target.value })}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          You'll get an email reminder at this time if you haven't checked in — even when the app is
          closed.
          {permission === "granted"
            ? " Browser notifications also appear while a tab is open."
            : " Browser pop-up notifications are off, but that doesn't affect your email reminder."}
        </p>
      </section>

      <section className="soft-card space-y-2 p-5">
        <div className="flex items-center gap-2">
          <ShieldQuestion className="h-4 w-4 text-primary" strokeWidth={1.7} />
          <p className="font-medium">About this app</p>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{DISCLAIMER}</p>
      </section>

      <Button
        variant="outline"
        className="w-full"
        onClick={async () => {
          await signOut();
          navigate({ to: "/auth" });
        }}
      >
        <LogOut className="mr-2 h-4 w-4" /> Sign out
      </Button>
    </div>
  );
}
