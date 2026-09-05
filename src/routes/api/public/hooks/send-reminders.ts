import { createFileRoute } from "@tanstack/react-router";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

/** Returns { date: "YYYY-MM-DD", minutes: minutes-since-midnight } for a timezone. */
function localNow(timeZone: string): { date: string; minutes: number } | null {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    const hour = Number(get("hour") === "24" ? "0" : get("hour"));
    return {
      date: `${get("year")}-${get("month")}-${get("day")}`,
      minutes: hour * 60 + Number(get("minute")),
    };
  } catch {
    return null;
  }
}

function parseTime(value: string): number {
  const [h, m] = value.split(":");
  return Number(h ?? 21) * 60 + Number(m ?? 0);
}

async function sendReminder(email: string, from: string, appUrl: string) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const resendKey = process.env["RESEND_API_KEY"];
  if (!lovableKey || !resendKey) throw new Error("Email credentials are not configured");

  const response = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": resendKey,
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "How was your day?",
      html: `
        <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#2f3a34">
          <h1 style="font-size:20px;font-weight:600;margin:0 0 12px">How was your day?</h1>
          <p style="font-size:15px;line-height:1.6;margin:0 0 20px">
            Take 30 seconds to check in — a quick note on your mood, energy and sleep is all it takes.
          </p>
          <a href="${appUrl}/checkin" style="display:inline-block;background:#6b8f7a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-size:15px">
            Check in
          </a>
          <p style="font-size:12px;line-height:1.6;color:#8a938d;margin:24px 0 0">
            Check In Hub is for general wellness tracking only. It is not a substitute for professional
            medical or mental health care. You can turn these reminders off in Settings.
          </p>
        </div>`,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Resend request failed [${response.status}]: ${errorBody}`);
    throw new Error(`Resend request failed [${response.status}]: ${errorBody}`);
  }
}

export const Route = createFileRoute("/api/public/hooks/send-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expectedKey =
          process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
        const providedKey =
          request.headers.get("apikey") ??
          request.headers.get("authorization")?.replace("Bearer ", "");
        if (!expectedKey || providedKey !== expectedKey) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const from = process.env["REMINDER_FROM_EMAIL"] ?? "Check In Hub <onboarding@resend.dev>";
        const appUrl = new URL(request.url).origin;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: settings, error } = await supabaseAdmin
          .from("user_settings")
          .select("user_id, reminder_time, timezone, last_reminder_sent")
          .eq("reminder_enabled", true);

        if (error) {
          console.error("Failed to load reminder settings", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        let sent = 0;
        for (const row of settings ?? []) {
          const now = localNow(row.timezone ?? "UTC");
          if (!now) continue;
          if (row.last_reminder_sent === now.date) continue;
          if (now.minutes < parseTime(row.reminder_time)) continue;

          const { data: existing } = await supabaseAdmin
            .from("check_ins")
            .select("id")
            .eq("user_id", row.user_id)
            .eq("entry_date", now.date)
            .maybeSingle();
          if (existing) continue;

          const { data: userResult } = await supabaseAdmin.auth.admin.getUserById(row.user_id);
          const email = userResult?.user?.email;
          if (!email) continue;

          try {
            await sendReminder(email, from, appUrl);
            sent += 1;
          } catch (sendError) {
            console.error(`Reminder email failed for ${row.user_id}`, sendError);
            continue;
          }

          await supabaseAdmin
            .from("user_settings")
            .update({ last_reminder_sent: now.date })
            .eq("user_id", row.user_id);
        }

        return new Response(JSON.stringify({ success: true, sent }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
