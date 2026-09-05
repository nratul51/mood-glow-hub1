import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { todayKey, type CheckIn } from "@/lib/checkin";

export type UserSettings = {
  user_id: string;
  reminder_enabled: boolean;
  reminder_time: string;
  disclaimer_ack: boolean;
  timezone: string;
};

function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function useCheckIns(days = 28) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["check_ins", user?.id, days],
    enabled: !!user,
    queryFn: async (): Promise<CheckIn[]> => {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const { data, error } = await supabase
        .from("check_ins")
        .select("id, entry_date, mood, energy, sleep_hours, stress_tags, note")
        .gte("entry_date", todayKey(since))
        .order("entry_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CheckIn[];
    },
  });
}

export function useSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["user_settings", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<UserSettings> => {
      const tz = browserTimezone();
      const columns = "user_id, reminder_enabled, reminder_time, disclaimer_ack, timezone";
      const { data, error } = await supabase.from("user_settings").select(columns).maybeSingle();
      if (error) throw error;
      if (data) {
        const settings = data as UserSettings;
        if (settings.timezone !== tz) {
          await supabase.from("user_settings").update({ timezone: tz }).eq("user_id", user!.id);
          return { ...settings, timezone: tz };
        }
        return settings;
      }

      const { data: created, error: insertError } = await supabase
        .from("user_settings")
        .insert({ user_id: user!.id, timezone: tz })
        .select(columns)
        .single();
      if (insertError) throw insertError;
      return created as UserSettings;
    },
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<Omit<UserSettings, "user_id">>) => {
      const { error } = await supabase
        .from("user_settings")
        .update(patch)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_settings", user?.id] });
    },
  });

  return { ...query, update };
}

export function useSaveCheckIn() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: {
      mood: number;
      energy: number;
      sleep_hours: number | null;
      stress_tags: string[];
      note: string | null;
    }) => {
      const { error } = await supabase.from("check_ins").upsert(
        { ...entry, user_id: user!.id, entry_date: todayKey() },
        { onConflict: "user_id,entry_date" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["check_ins"] });
    },
  });
}
