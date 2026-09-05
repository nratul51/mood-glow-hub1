import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateWeeklySummary } from "./summary.server";

export const getWeeklySummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => generateWeeklySummary(context.supabase, context.userId));
