// Edge Function: push-chore-reminder
// Invoked by a cron schedule (daily). Sends morning push reminders for chores due today.
// Cron setup: Supabase Dashboard > Edge Functions > Schedule
// Recommended cron expression: "0 13 * * *" (1 PM UTC = ~8 AM EST)
// Notification format: "{choreName} is due today"

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (_req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
      return new Response(JSON.stringify({ error: "Missing env vars" }), {
        status: 200,
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get today's date range in UTC
    const now = new Date();
    const todayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)
    );
    const todayEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999)
    );

    // 2. Query active chores due today
    const { data: chores, error: choresError } = await supabase
      .from("chores")
      .select("id, name, current_assignee, household_id")
      .eq("is_active", true)
      .gte("next_due_at", todayStart.toISOString())
      .lte("next_due_at", todayEnd.toISOString());

    if (choresError) {
      console.error("Error fetching chores:", choresError.message);
      return new Response(JSON.stringify({ error: "Failed to fetch chores" }), {
        status: 200,
      });
    }

    if (!chores?.length) {
      console.log("No chores due today");
      return new Response(JSON.stringify({ message: "No chores due today", sent: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Collect all assignee user IDs (de-duplicate)
    const assigneeIds = [...new Set(
      chores
        .map((c) => c.current_assignee)
        .filter(Boolean) as string[]
    )];

    if (!assigneeIds.length) {
      console.log("No assignees for due chores");
      return new Response(
        JSON.stringify({ message: "No assignees for due chores", sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Get push tokens for all assignees
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, expo_push_token")
      .in("id", assigneeIds)
      .not("expo_push_token", "is", null);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError.message);
      return new Response(JSON.stringify({ error: "Failed to fetch profiles" }), {
        status: 200,
      });
    }

    const tokenMap = new Map(
      (profiles ?? []).map((p) => [p.id, p.expo_push_token as string])
    );

    // 5. Check notification preferences (chores_enabled)
    const { data: prefs, error: prefsError } = await supabase
      .from("notification_preferences")
      .select("user_id, chores_enabled")
      .in("user_id", assigneeIds);

    if (prefsError) {
      console.error("Error fetching notification preferences:", prefsError.message);
      // Continue anyway -- default is enabled
    }

    const prefsMap = new Map(
      (prefs ?? []).map((p) => [p.user_id, p])
    );

    // 6. Build notification list -- one per chore-assignee pair
    type PushNotification = {
      to: string;
      title: string;
      body: string;
      sound: "default";
      data: { type: string; choreId: string };
      channelId: string;
    };

    const notifications: PushNotification[] = [];

    for (const chore of chores) {
      const assignee = chore.current_assignee;
      if (!assignee) continue;

      const token = tokenMap.get(assignee);
      if (!token) continue;

      // Check if user has chores_enabled (default true if no pref row)
      const pref = prefsMap.get(assignee);
      if (pref && pref.chores_enabled === false) continue;

      notifications.push({
        to: token,
        title: "Chore Reminder",
        body: `${chore.name} is due today`,
        sound: "default",
        data: { type: "chore", choreId: chore.id },
        channelId: "chores",
      });
    }

    if (!notifications.length) {
      console.log("No notifications to send (all filtered by preferences or missing tokens)");
      return new Response(
        JSON.stringify({ message: "No notifications after filtering", sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 7. Batch send all notifications via Expo Push API
    const pushResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(notifications),
    });

    const pushResult = await pushResponse.json();

    console.log(`Sent ${notifications.length} chore reminder(s) for ${chores.length} chore(s)`);

    return new Response(
      JSON.stringify({
        sent: notifications.length,
        chores_due: chores.length,
        result: pushResult,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    // Log error but return 200 to avoid cron retry issues
    console.error("push-chore-reminder error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 200 }
    );
  }
});
