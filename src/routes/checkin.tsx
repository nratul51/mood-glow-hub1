import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Protected } from "@/components/Protected";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useCheckIns, useSaveCheckIn } from "@/hooks/useCheckIns";
import { ENERGY_FACES, MOOD_FACES, STRESS_TAGS, todayKey } from "@/lib/checkin";

export const Route = createFileRoute("/checkin")({
  head: () => ({
    meta: [
      { title: "Daily check-in · Check In Hub" },
      {
        name: "description",
        content:
          "Log today's mood, energy, sleep hours and stress tags in about thirty seconds.",
      },
      { property: "og:title", content: "Daily check-in · Check In Hub" },
      {
        property: "og:description",
        content: "Log today's mood, energy, sleep and stress tags in about thirty seconds.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <Protected>
      <CheckInPage />
    </Protected>
  ),
});

function Scale({
  value,
  onChange,
  faces,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  faces: string[];
  label: string;
}) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-medium">{label}</legend>
      <div className="grid grid-cols-5 gap-2">
        {faces.map((face, i) => {
          const v = i + 1;
          const active = value === v;
          return (
            <button
              key={v}
              type="button"
              aria-label={`${label} ${v} of 5`}
              aria-pressed={active}
              onClick={() => onChange(v)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl border py-3 text-2xl transition-all duration-200",
                active
                  ? "scale-[1.04] border-primary bg-accent"
                  : "border-border bg-card hover:bg-secondary",
              )}
            >
              <span>{face}</span>
              <span className="text-[10px] text-muted-foreground">{v}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function CheckInPage() {
  const navigate = useNavigate();
  const { data: entries } = useCheckIns(7);
  const save = useSaveCheckIn();

  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [sleep, setSleep] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const existing = entries?.find((e) => e.entry_date === todayKey());

  useEffect(() => {
    if (existing && !hydrated) {
      setMood(existing.mood);
      setEnergy(existing.energy);
      setSleep(existing.sleep_hours != null ? String(existing.sleep_hours) : "");
      setTags(existing.stress_tags);
      setNote(existing.note ?? "");
      setHydrated(true);
    }
  }, [existing, hydrated]);

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hours = sleep.trim() === "" ? null : Number(sleep);
    if (hours != null && (Number.isNaN(hours) || hours < 0 || hours > 24)) {
      toast.error("Sleep hours should be between 0 and 24.");
      return;
    }
    try {
      await save.mutateAsync({
        mood,
        energy,
        sleep_hours: hours,
        stress_tags: tags,
        note: note.trim().slice(0, 1000) || null,
      });
      toast.success("Logged. Thanks for checking in.");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save your check-in.");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-7">
      <header>
        <h1 className="text-3xl">Today's check-in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {existing ? "Updating today's entry." : "Quick and low-effort. Nothing here is a test."}
        </p>
      </header>

      <div className="soft-card space-y-6 p-5">
        <Scale label="Mood" faces={MOOD_FACES} value={mood} onChange={setMood} />
        <Scale label="Energy" faces={ENERGY_FACES} value={energy} onChange={setEnergy} />
      </div>

      <div className="soft-card space-y-2 p-5">
        <Label htmlFor="sleep">Sleep last night (hours)</Label>
        <Input
          id="sleep"
          type="number"
          inputMode="decimal"
          step="0.5"
          min="0"
          max="24"
          placeholder="7.5"
          value={sleep}
          onChange={(e) => setSleep(e.target.value)}
        />
      </div>

      <div className="soft-card space-y-3 p-5">
        <Label>What added stress today?</Label>
        <div className="flex flex-wrap gap-2">
          {STRESS_TAGS.map((t) => {
            const active = tags.includes(t.value);
            return (
              <button
                key={t.value}
                type="button"
                aria-pressed={active}
                onClick={() => toggleTag(t.value)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-secondary",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="soft-card space-y-2 p-5">
        <Label htmlFor="note">Anything to note? (optional)</Label>
        <Textarea
          id="note"
          rows={3}
          maxLength={1000}
          placeholder="A line or two, if you feel like it."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={save.isPending}>
        {save.isPending ? "Saving…" : existing ? "Update check-in" : "Save check-in"}
      </Button>
    </form>
  );
}
