import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Protected } from "@/components/Protected";
import { useCheckIns } from "@/hooks/useCheckIns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trends")({
  head: () => ({
    meta: [
      { title: "Trends · Check In Hub" },
      {
        name: "description",
        content:
          "See your logged mood, energy and sleep over the past two to four weeks as simple charts. No scores, just your own data.",
      },
      { property: "og:title", content: "Trends · Check In Hub" },
      {
        property: "og:description",
        content: "Simple charts of your logged mood, energy and sleep over recent weeks.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <Protected>
      <TrendsPage />
    </Protected>
  ),
});

const RANGES = [14, 21, 28] as const;

function TrendsPage() {
  const [range, setRange] = useState<(typeof RANGES)[number]>(14);
  const { data: entries = [], isLoading } = useCheckIns(28);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - range);
  const data = entries
    .filter((e) => new Date(e.entry_date) >= cutoff)
    .map((e) => ({
      date: new Date(e.entry_date).toLocaleDateString(undefined, {
        month: "numeric",
        day: "numeric",
      }),
      mood: e.mood,
      energy: e.energy,
      sleep: e.sleep_hours ?? null,
    }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl">Trends</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Just your logged entries over time. No scores, no ratings of you.
        </p>
      </header>

      <div className="flex gap-2">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm transition-colors",
              range === r
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-secondary",
            )}
          >
            {r} days
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="soft-card h-64 animate-pulse" />
      ) : data.length === 0 ? (
        <div className="soft-card p-8 text-center text-sm text-muted-foreground">
          No check-ins logged in this window yet.
        </div>
      ) : (
        <>
          <section className="soft-card p-5">
            <h2 className="mb-4 text-sm font-semibold tracking-wide text-foreground/70 uppercase">
              Mood &amp; energy
            </h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ left: -22, right: 8, top: 4 }}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                  <RTooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="mood"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2.4}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="energy"
                    stroke="var(--color-chart-2)"
                    strokeWidth={2.4}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-full bg-chart-1" /> Mood
              </span>
              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-full bg-chart-2" /> Energy
              </span>
            </div>
          </section>

          <section className="soft-card p-5">
            <h2 className="mb-4 text-sm font-semibold tracking-wide text-foreground/70 uppercase">
              Sleep hours
            </h2>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ left: -22, right: 8, top: 4 }}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                  <RTooltip
                    cursor={{ fill: "var(--color-secondary)" }}
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="sleep" fill="var(--color-chart-3)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
