import { useEffect } from "react";
import { useSettings } from "@/hooks/useCheckIns";
import { useCheckIns } from "@/hooks/useCheckIns";
import { todayKey } from "@/lib/checkin";

const STORAGE_KEY = "cih:last-reminder";

/**
 * Fires a friendly local browser notification at the chosen time if today's
 * check-in is still missing. Runs while the app is open in a tab.
 */
export function ReminderScheduler() {
  const { data: settings } = useSettings();
  const { data: entries } = useCheckIns(7);

  const enabled = settings?.reminder_enabled ?? false;
  const time = settings?.reminder_time ?? "21:00";
  const doneToday = !!entries?.some((e) => e.entry_date === todayKey());

  useEffect(() => {
    if (!enabled || doneToday) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const tick = () => {
      if (Notification.permission !== "granted") return;
      const now = new Date();
      const [rawH, rawM] = time.split(":");
      const h = Number(rawH ?? 21);
      const m = Number(rawM ?? 0);
      const due = now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);

      if (!due) return;
      if (window.localStorage.getItem(STORAGE_KEY) === todayKey()) return;

      window.localStorage.setItem(STORAGE_KEY, todayKey());
      new Notification("How was your day?", {
        body: "Take 30 seconds to check in.",
        icon: "/favicon.ico",
      });
    };

    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [enabled, time, doneToday]);

  return null;
}
