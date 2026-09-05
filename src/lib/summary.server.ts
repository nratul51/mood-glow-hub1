import type { SupabaseClient } from "@supabase/supabase-js";

type Row = {
  entry_date: string;
  mood: number;
  energy: number;
  sleep_hours: number | null;
  stress_tags: string[];
  note: string | null;
};

const SYSTEM_PROMPT = `You write short, warm, observational weekly reflections for a general-wellness journaling app called Check In Hub.

STRICT RULES — these are non-negotiable:
- You are NOT a clinician. Never diagnose, never name or imply any medical or psychological condition (no "burnout", "depression", "anxiety disorder", "insomnia", etc.).
- Never recommend medication, supplements, or any treatment.
- Never use alarming, urgent, or clinical language. No risk scores, no severity levels.
- Only describe patterns that are actually visible in the logged numbers. Always frame as "your logged data shows...", "on days after...", "you logged...". Never "you are..." or "you have...".
- Suggestions must be gentle, general lifestyle nudges only: a short walk, a few slow breaths, an earlier bedtime, a screen-time break, stepping outside, a pause between tasks.
- Keep it calm, kind, and brief.

OUTPUT FORMAT (plain text, no markdown headers, no bullets characters other than "- "):
A one-sentence opening summary of the period.
Then 2-3 lines starting with "- " describing concrete observed patterns from the data.
Then one line starting with "Gentle nudge: " with one or two general lifestyle ideas.
Total under 130 words.`;

export async function generateWeeklySummary(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ summary: string; entryCount: number }> {
  const since = new Date();
  since.setDate(since.getDate() - 14);
  const sinceKey = since.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("check_ins")
    .select("entry_date, mood, energy, sleep_hours, stress_tags, note")
    .eq("user_id", userId)
    .gte("entry_date", sinceKey)
    .order("entry_date", { ascending: true });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Row[];
  if (rows.length < 3) {
    return {
      summary:
        "There isn't quite enough logged yet for a pattern summary. Check in on a few more days and a reflection of your own data will appear here.",
      entryCount: rows.length,
    };
  }

  const table = rows
    .map(
      (r) =>
        `${r.entry_date} | mood ${r.mood}/5 | energy ${r.energy}/5 | sleep ${
          r.sleep_hours ?? "not logged"
        }h | stress tags: ${r.stress_tags.length ? r.stress_tags.join(", ") : "none"}${
          r.note ? ` | note: ${r.note.slice(0, 160)}` : ""
        }`,
    )
    .join("\n");

  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Here are my logged check-ins for the last ${rows.length} entries. Reflect the patterns back to me.\n\n${table}`,
        },
      ],
    }),
  });

  if (res.status === 429) throw new Error("The summary service is busy right now. Please try again in a moment.");
  if (res.status === 402) throw new Error("AI usage limit reached for this workspace.");
  if (!res.ok) throw new Error(`Summary unavailable (${res.status}).`);

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const summary = json.choices?.[0]?.message?.content?.trim();
  if (!summary) throw new Error("Summary unavailable right now.");

  return { summary, entryCount: rows.length };
}
