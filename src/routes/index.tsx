import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Info, Sparkles, Check, RefreshCw } from "lucide-react";
import { Protected } from "@/components/Protected";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useCheckIns } from "@/hooks/useCheckIns";
import {
  MOOD_FACES,
  currentStreak,
  todayKey,
  trendIntensity,
  trendLabel,
} from "@/lib/checkin";
import { getWeeklySummary } from "@/lib/summary.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Check In Hub · Daily wellness check-ins" },
      {
        name: "description",
        content:
          "A calm daily check-in for mood, energy and sleep. See your own recent trend and a gentle weekly reflection of your logged patterns.",
      },
      { property: "og:title", content: "Check In Hub · Daily wellness check-ins" },
      {
        property: "og:description",
        content:
          "Log mood, energy and sleep in 30 seconds. See your recent trend and a gentle weekly reflection.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <Protected>
      <Dashboard />
    </Protected>
  ),
});

function Dashboard() {
  const { user } = useAuth();
  const { data: entries = [] } = useCheckIns(28);
  const summaryFn = useServerFn(getWeeklySummary);

  const intensity = trendIntensity(entries);
  const today = entries.find((e) => e.entry_date === todayKey());
  const streak = currentStreak(entries);
  const name = user?.email?.split("@")[0] ?? "there";

  const summary = useQuery({
    queryKey: ["weekly-summary", user?.id, entries.length],
    enabled: !!user,
    staleTime: 1000 * 60 * 30,
    retry: false,
    queryFn: () => summaryFn({ data: undefined }),
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="mt-1 text-3xl capitalize">Hi {name}</h1>
      </header>

      {/* Recent Trend */}
      <section className="trend-surface rounded-3xl border p-6">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-wide text-foreground/70 uppercase">
            Recent Trend
          </h2>
          <Tooltip>
            <TooltipTrigger aria-label="About Recent Trend">
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[240px] text-center">
              This reflects your recent check-in patterns, not a diagnosis.
            </TooltipContent>
          </Tooltip>
        </div>

        <p className="mt-3 font-display text-2xl leading-snug trend-ink">{trendLabel(intensity)}</p>

        <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-foreground/8">
          <div
            className="h-full rounded-full transition-[width,background-color] duration-1000 ease-out"
            style={{
              width: `${Math.max(8, intensity * 100)}%`,
              backgroundColor: "var(--trend-color)",
            }}
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Based on your last {entries.length} logged {entries.length === 1 ? "day" : "days"}. It
          eases back gradually as steadier days are logged.
        </p>
      </section>

      {/* Today */}
      <section className="soft-card p-6">
        {today ? (
          <div className="flex items-center gap-4">
            <span className="text-4xl">{MOOD_FACES[today.mood - 1]}</span>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 font-medium">
                <Check className="h-4 w-4 text-primary" /> Checked in today
              </p>
              <p className="text-sm text-muted-foreground">
                Mood {today.mood}/5 · Energy {today.energy}/5
                {today.sleep_hours != null ? ` · ${today.sleep_hours}h sleep` : ""}
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="ml-auto shrink-0">
              <Link to="/checkin">Edit</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-xl">How was your day?</h2>
            <p className="text-sm text-muted-foreground">Takes about 30 seconds.</p>
            <Button asChild className="w-full">
              <Link to="/checkin">Start today's check-in</Link>
            </Button>
          </div>
        )}
        {streak > 1 && (
          <p className="mt-4 text-xs text-muted-foreground">{streak} days in a row logged.</p>
        )}
      </section>

      {/* Weekly reflection */}
      <section className="soft-card p-6">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-wide text-foreground/70 uppercase">
            Weekly pattern reflection
          </h2>
          <button
            onClick={() => summary.refetch()}
            className="ml-auto text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Refresh reflection"
          >
            <RefreshCw className={`h-4 w-4 ${summary.isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>

        {summary.isLoading ? (
          <div className="space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        ) : summary.isError ? (
          <p className="text-sm text-muted-foreground">
            {summary.error instanceof Error ? summary.error.message : "Reflection unavailable."}
          </p>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/85">
            {summary.data?.summary}
          </p>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Generated from your logged data. Observations only — not medical advice.
        </p>
      </section>
    </div>
  );
}
