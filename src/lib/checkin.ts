export type StressTag = "work" | "social" | "physical" | "sleep" | "other";

export const STRESS_TAGS: { value: StressTag; label: string }[] = [
  { value: "work", label: "Work" },
  { value: "social", label: "Social" },
  { value: "physical", label: "Physical" },
  { value: "sleep", label: "Sleep" },
  { value: "other", label: "Other" },
];

export const MOOD_FACES = ["😞", "🙁", "😐", "🙂", "😄"];
export const ENERGY_FACES = ["🪫", "🔅", "🔆", "⚡", "🚀"];

export type CheckIn = {
  id: string;
  entry_date: string;
  mood: number;
  energy: number;
  sleep_hours: number | null;
  stress_tags: string[];
  note: string | null;
};

export const DISCLAIMER =
  "Check In Hub is for general wellness tracking only. It is not a substitute for professional medical or mental health care. If you're in crisis, please contact a mental health professional or crisis line.";

/** Local (not UTC) YYYY-MM-DD */
export function todayKey(d = new Date()): string {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

/** A day counts as "lower" when the average of mood and energy is under 3. */
export const LOW_THRESHOLD = 3;

export function isLowerDay(entry: Pick<CheckIn, "mood" | "energy">) {
  return (entry.mood + entry.energy) / 2 < LOW_THRESHOLD;
}

/**
 * Rolling trend intensity in [0, 1].
 * 0 = calm/normal. 1 = fully warm.
 *
 * - Three consecutive lower days push intensity to full warmth.
 * - Each subsequent steadier day fades it by 1/3, so it takes 3 good days
 *   to return to calm (gradual interpolation, never an instant snap-back).
 */
export function trendIntensity(entriesAsc: CheckIn[]): number {
  let intensity = 0;
  let lowRun = 0;

  for (const entry of entriesAsc) {
    if (isLowerDay(entry)) {
      lowRun += 1;
      intensity = lowRun >= 3 ? 1 : Math.min(1, intensity + 0.2);
    } else {
      lowRun = 0;
      intensity = Math.max(0, intensity - 1 / 3);
    }
  }

  return Math.round(intensity * 100) / 100;
}

export function trendLabel(intensity: number): string {
  if (intensity >= 0.75) return "Your recent check-ins have trended lower";
  if (intensity >= 0.34) return "Your check-ins are easing back up";
  if (intensity > 0) return "Nearly back to your usual range";
  return "Your recent check-ins look steady";
}

export function currentStreak(entriesAsc: CheckIn[]): number {
  const dates = new Set(entriesAsc.map((e) => e.entry_date));
  let streak = 0;
  const cursor = new Date();
  while (dates.has(todayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
