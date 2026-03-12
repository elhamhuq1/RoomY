// Edge Function: push-expense
// Triggered by a Database Webhook on INSERT to the expenses table.
// Sends push notifications to household members when a new expense is created.
// Notification format: "{creatorName} added ${amount} for {description}"

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface WebhookPayload {
  type: "INSERT";
  table: string;
  record: {
    id: string;
    household_id: string;
    description: string;
    amount: number;
    paid_by: string;
    created_by: string;
  };
  schema: string;
}

Deno.serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json();
    const { record } = payload;

    // Validate payload
    if (!record?.household_id || !record?.created_by) {
      console.error("Invalid webhook payload: missing household_id or created_by");
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 200, // Return 200 to avoid webhook retry on bad data
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
      return new Response(JSON.stringify({ error: "Missing env vars" }), {
        status: 200,
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get household members excluding the expense creator
    const { data: members, error: membersError } = await supabase
      .from("household_members")
      .select("user_id")
      .eq("household_id", record.household_id)
      .neq("user_id", record.created_by);

    if (membersError) {
      console.error("Error fetching household members:", membersError.message);
      return new Response(JSON.stringify({ error: "Failed to fetch members" }), {
        status: 200,
      });
    }

    if (!members?.length) {
      return new Response(JSON.stringify({ message: "No recipients" }), {
        status: 200,
      });
    }

    const userIds = members.map((m) => m.user_id);

    // 2. Get push tokens for those users (only non-null tokens)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, expo_push_token, display_name")
      .in("id", userIds)
      .not("expo_push_token", "is", null);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError.message);
      return new Response(JSON.stringify({ error: "Failed to fetch profiles" }), {
        status: 200,
      });
    }

    if (!profiles?.length) {
      return new Response(JSON.stringify({ message: "No push tokens found" }), {
        status: 200,
      });
    }

    // 3. Check notification preferences (expenses_enabled)
    const { data: prefs, error: prefsError } = await supabase
      .from("notification_preferences")
      .select("user_id, expenses_enabled")
      .in("user_id", userIds);

    if (prefsError) {
      console.error("Error fetching notification preferences:", prefsError.message);
      // Continue anyway -- default is enabled
    }

    const prefsMap = new Map(
      (prefs ?? []).map((p) => [p.user_id, p])
    );

    // 4. Get creator's display name for the notification body
    const { data: creator } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", record.created_by)
      .single();

    const creatorName = creator?.display_name || "Someone";
    const amount = parseFloat(String(record.amount)).toFixed(2);

    // 5. Filter to users who have expenses_enabled (default true if no pref row)
    const tokens = profiles
      .filter((p) => {
        const pref = prefsMap.get(p.id);
        // Default is enabled -- only exclude if explicitly set to false
        return !pref || pref.expenses_enabled !== false;
      })
      .map((p) => p.expo_push_token)
      .filter(Boolean) as string[];

    if (!tokens.length) {
      return new Response(
        JSON.stringify({ message: "All recipients have expenses disabled" }),
        { status: 200 }
      );
    }

    // 6. Send push notifications via Expo Push API
    const notifications = tokens.map((token) => ({
      to: token,
      title: "New Expense",
      body: `${creatorName} added $${amount} for ${record.description}`,
      sound: "default" as const,
      data: { type: "expense", expenseId: record.id },
      channelId: "expenses",
    }));

    const pushResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(notifications),
    });

    const pushResult = await pushResponse.json();

    console.log(
      `Sent ${tokens.length} expense notification(s) for expense ${record.id}`
    );

    return new Response(JSON.stringify({ sent: tokens.length, result: pushResult }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error but return 200 to avoid blocking the webhook
    console.error("push-expense error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 200 }
    );
  }
});
