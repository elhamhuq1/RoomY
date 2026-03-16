// Edge Function: push-chore-nudge
// Handles the nudge lifecycle: authenticate sender, validate chore is overdue
// and assigned to someone else, enforce 24h rate limit, insert nudge record,
// look up recipient push token + notification prefs, send Expo Push notification.
// Phases for diagnostic localization: auth, validation, rate_limit, insert, push.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Build a JSON response with CORS headers.
 */
function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed", phase: "request" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
      JSON.stringify({ phase: "config", error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" })
    );
    return jsonResponse({ error: "Server misconfigured", phase: "config" }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // --- Phase: auth ---
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse({ error: "Missing or malformed Authorization header", phase: "auth" }, 401);
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: authError } = await supabase.auth.getUser(token);

  if (authError || !userData?.user) {
    console.error(
      JSON.stringify({ phase: "auth", error: authError?.message ?? "No user returned" })
    );
    return jsonResponse({ error: "Invalid or expired token", phase: "auth" }, 401);
  }

  const senderId = userData.user.id;
  console.log(JSON.stringify({ phase: "auth", senderId }));

  // --- Phase: validation ---
  let body: { chore_id?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body", phase: "validation" }, 400);
  }

  const { chore_id } = body;
  if (!chore_id || typeof chore_id !== "string") {
    return jsonResponse({ error: "chore_id is required", phase: "validation" }, 400);
  }

  const { data: chore, error: choreError } = await supabase
    .from("chores")
    .select("id, name, is_active, next_due_at, current_assignee, household_id")
    .eq("id", chore_id)
    .single();

  if (choreError || !chore) {
    console.error(
      JSON.stringify({ phase: "validation", error: choreError?.message ?? "Chore not found", chore_id })
    );
    return jsonResponse({ error: "Chore not found", phase: "validation" }, 404);
  }

  if (!chore.is_active) {
    return jsonResponse({ error: "Chore is not active", phase: "validation" }, 400);
  }

  const now = new Date();
  const nextDue = new Date(chore.next_due_at);
  if (nextDue >= now) {
    return jsonResponse({ error: "Chore is not overdue", phase: "validation" }, 400);
  }

  if (!chore.current_assignee) {
    return jsonResponse({ error: "Chore has no assignee", phase: "validation" }, 400);
  }

  if (chore.current_assignee === senderId) {
    return jsonResponse({ error: "Cannot nudge yourself", phase: "validation" }, 400);
  }

  const recipientId = chore.current_assignee;
  console.log(
    JSON.stringify({ phase: "validation", chore_id, choreName: chore.name, recipientId })
  );

  // --- Phase: rate_limit ---
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const { data: existingNudge, error: rateLimitError } = await supabase
    .from("chore_nudges")
    .select("id")
    .eq("chore_id", chore_id)
    .eq("sender_id", senderId)
    .gte("created_at", twentyFourHoursAgo)
    .limit(1)
    .maybeSingle();

  if (rateLimitError) {
    console.error(
      JSON.stringify({ phase: "rate_limit", error: rateLimitError.message })
    );
    return jsonResponse({ error: "Failed to check rate limit", phase: "rate_limit" }, 500);
  }

  if (existingNudge) {
    console.log(JSON.stringify({ phase: "rate_limit", blocked: true, chore_id, senderId }));
    return jsonResponse(
      { error: "You already nudged about this chore in the last 24 hours", phase: "rate_limit" },
      429
    );
  }

  console.log(JSON.stringify({ phase: "rate_limit", blocked: false }));

  // --- Phase: insert ---
  const { error: insertError } = await supabase
    .from("chore_nudges")
    .insert({ chore_id, sender_id: senderId, recipient_id: recipientId });

  if (insertError) {
    console.error(
      JSON.stringify({ phase: "insert", error: insertError.message })
    );
    return jsonResponse({ error: "Failed to record nudge", phase: "insert" }, 500);
  }

  console.log(JSON.stringify({ phase: "insert", success: true, chore_id, senderId, recipientId }));

  // --- Phase: push ---
  // Fetch recipient push token
  const { data: recipientProfile, error: profileError } = await supabase
    .from("profiles")
    .select("expo_push_token, display_name")
    .eq("id", recipientId)
    .single();

  if (profileError) {
    console.error(
      JSON.stringify({ phase: "push", error: profileError.message, detail: "Failed to fetch recipient profile" })
    );
    // Nudge is already recorded — return success with note
    return jsonResponse(
      { success: true, nudge_recorded: true, push_sent: false, reason: "Failed to fetch recipient profile" },
      200
    );
  }

  // Check notification preferences (default true if no row)
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("chores_enabled")
    .eq("user_id", recipientId)
    .maybeSingle();

  const choresEnabled = prefs?.chores_enabled ?? true;

  if (!choresEnabled) {
    console.log(
      JSON.stringify({ phase: "push", skipped: true, reason: "chores_enabled=false", recipientId })
    );
    return jsonResponse(
      { success: true, nudge_recorded: true, push_sent: false, reason: "Recipient has chore notifications disabled" },
      200
    );
  }

  const pushToken = recipientProfile?.expo_push_token;
  if (!pushToken) {
    console.log(
      JSON.stringify({ phase: "push", skipped: true, reason: "no_push_token", recipientId })
    );
    return jsonResponse(
      { success: true, nudge_recorded: true, push_sent: false, reason: "Recipient has no push token registered" },
      200
    );
  }

  // Fetch sender display name
  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", senderId)
    .single();

  const senderName = senderProfile?.display_name ?? "A roommate";

  // Send Expo Push notification
  const pushPayload = {
    to: pushToken,
    title: "Gentle Nudge",
    body: `${senderName} thinks the ${chore.name} could use some love 🧹`,
    sound: "default" as const,
    data: { type: "nudge", choreId: chore_id },
    channelId: "chores",
  };

  try {
    const pushResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(pushPayload),
    });

    const pushResult = await pushResponse.json();
    console.log(
      JSON.stringify({ phase: "push", sent: true, recipientId, status: pushResponse.status, result: pushResult })
    );

    return jsonResponse(
      { success: true, nudge_recorded: true, push_sent: true },
      200
    );
  } catch (pushErr) {
    const errMsg = pushErr instanceof Error ? pushErr.message : String(pushErr);
    console.error(
      JSON.stringify({ phase: "push", error: errMsg, detail: "Expo Push API call failed" })
    );
    // Nudge is already recorded — push failure is non-fatal
    return jsonResponse(
      { success: true, nudge_recorded: true, push_sent: false, reason: "Push delivery failed" },
      200
    );
  }
});
