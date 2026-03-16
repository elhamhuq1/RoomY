// Edge Function: import-recipe
// Extracts recipe ingredients from a YouTube video URL (via caption extraction + Gemini)
// or raw text (direct to Gemini). Returns { title, ingredients: [{ name, quantity, unit }] }.
// Phases for diagnostic localization: url-parse, page-fetch, caption-extract, duration-guard,
// config, gemini-call, parse, success.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

interface RecipeResult {
  title: string | null;
  ingredients: Ingredient[];
}

const RECIPE_PROMPT = `You are a recipe ingredient extraction assistant. Analyze the following text (which may be a video transcript or manually entered ingredient list) and extract the recipe ingredients.

Rules:
1. Extract ONLY recipe ingredients — ignore sponsor segments, personal anecdotes, equipment lists, and off-topic commentary.
2. For each ingredient, extract: name (the ingredient itself), quantity (numeric amount as a string, e.g. "2", "1/2"), and unit (measurement unit, e.g. "cups", "tsp", "lbs", or empty string if unitless like "3 eggs").
3. Normalize quantities to standard measurements where clear (e.g. "a couple of" → "2").
4. If the text contains NO recipe or ingredients, return { "title": null, "ingredients": [] }.
5. Extract or infer the recipe title from context. If unclear, use a brief descriptive name.

Return ONLY valid JSON with this exact schema (no other text):
{
  "title": "recipe name",
  "ingredients": [
    { "name": "flour", "quantity": "2", "unit": "cups" }
  ]
}`;

/**
 * Extract a YouTube video ID from various URL formats.
 * Handles: youtube.com/watch?v=, youtu.be/, youtube.com/shorts/, m.youtube.com/watch?v=
 * Returns null if the URL is not a recognized YouTube format.
 */
function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, "");

    // youtu.be/VIDEO_ID
    if (hostname === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      return id || null;
    }

    // youtube.com or m.youtube.com
    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      // /shorts/VIDEO_ID
      const shortsMatch = parsed.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]+)/);
      if (shortsMatch) {
        return shortsMatch[1];
      }

      // /watch?v=VIDEO_ID
      const v = parsed.searchParams.get("v");
      if (v) {
        return v;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Decode common HTML entities found in YouTube caption XML.
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

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

  try {
    const body = await req.json();
    const { mode } = body;

    // --- Check Gemini API key early ---
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error(JSON.stringify({ phase: "config", error: "GEMINI_API_KEY not set" }));
      return jsonResponse({ error: "Gemini API key not configured", phase: "config" }, 500);
    }

    let transcriptText: string;

    if (mode === "text") {
      // --- Text mode: validate and use directly ---
      const { text } = body;
      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return jsonResponse(
          { error: "Text is required and must be a non-empty string", phase: "request" },
          400
        );
      }
      if (text.length > 15000) {
        return jsonResponse(
          { error: "Text must be 15,000 characters or fewer", phase: "request" },
          400
        );
      }
      transcriptText = text.trim();
    } else if (mode === "youtube") {
      // --- YouTube mode: extract captions ---
      const { url } = body;
      if (!url || typeof url !== "string") {
        return jsonResponse(
          { error: "URL is required for YouTube mode", phase: "request" },
          400
        );
      }

      // Step 2: Extract video ID
      const videoId = extractVideoId(url);
      if (!videoId) {
        console.error(JSON.stringify({ phase: "url-parse", error: "Could not extract video ID", url }));
        return jsonResponse(
          { error: "Could not parse YouTube URL. Please check the link and try again.", phase: "url-parse" },
          400
        );
      }

      // Step 3: Fetch YouTube watch page
      let pageHtml: string;
      try {
        const pageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
            "Cookie": "SOCS=CAISNQgDEitib3FfaWRlbnRpdHlmcm9udGVuZHVpc2VydmVyXzIwMjMwODI5LjA3X3AxGgJlbiACGgYIgJnPpwY; CONSENT=PENDING+999",
          },
        });
        pageHtml = await pageResponse.text();
        if (!pageResponse.ok) {
          console.error(
            JSON.stringify({ phase: "page-fetch", error: "YouTube page fetch failed", status: pageResponse.status, videoId, bodySnippet: pageHtml.substring(0, 200) })
          );
          return jsonResponse(
            { error: "Could not fetch YouTube video page. The video may be private or unavailable.", phase: "page-fetch" },
            502
          );
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(
          JSON.stringify({ phase: "page-fetch", error: errMsg, videoId })
        );
        return jsonResponse(
          { error: "Could not fetch YouTube video page. Please try again.", phase: "page-fetch" },
          502
        );
      }

      // Step 3b: Extract ytInitialPlayerResponse
      const playerMatch = pageHtml.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/s);
      if (!playerMatch) {
        console.error(JSON.stringify({ phase: "caption-extract", error: "ytInitialPlayerResponse not found", videoId }));
        return jsonResponse(
          {
            error: "Could not extract video data. Try pasting the recipe text manually instead.",
            phase: "caption-extract",
          },
          400
        );
      }

      let playerData: Record<string, unknown>;
      try {
        playerData = JSON.parse(playerMatch[1]);
      } catch {
        console.error(JSON.stringify({ phase: "caption-extract", error: "Failed to parse ytInitialPlayerResponse", videoId }));
        return jsonResponse(
          {
            error: "Could not parse video data. Try pasting the recipe text manually instead.",
            phase: "caption-extract",
          },
          400
        );
      }

      // Step 4a: Duration guard
      const videoDetails = playerData.videoDetails as Record<string, unknown> | undefined;
      const lengthSeconds = parseInt(String(videoDetails?.lengthSeconds ?? "0"), 10);
      if (lengthSeconds > 1800) {
        const minutes = Math.round(lengthSeconds / 60);
        console.log(JSON.stringify({ phase: "duration-guard", videoId, lengthSeconds, minutes }));
        return jsonResponse(
          {
            error: `This video is ${minutes} minutes long. For best results, please use videos under 30 minutes or paste the recipe text manually.`,
            phase: "duration-guard",
          },
          400
        );
      }

      // Step 4b: Extract caption tracks
      // deno-lint-ignore no-explicit-any
      const captions = (playerData as any)?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (!Array.isArray(captions) || captions.length === 0) {
        console.error(JSON.stringify({ phase: "caption-extract", error: "No caption tracks available", videoId }));
        return jsonResponse(
          {
            error: "This video has no captions available. Try pasting the recipe text manually instead.",
            phase: "caption-extract",
          },
          400
        );
      }

      // Prefer English, fall back to first track
      const englishTrack = captions.find(
        (t: { languageCode?: string }) => t.languageCode?.startsWith("en")
      );
      const track = englishTrack || captions[0];
      const captionUrl = String(track.baseUrl).replace(/\\u0026/g, "&");

      // Step 5: Fetch and clean transcript XML
      let transcriptXml: string;
      try {
        const captionResponse = await fetch(captionUrl);
        if (!captionResponse.ok) {
          console.error(
            JSON.stringify({ phase: "caption-extract", error: "Caption fetch failed", status: captionResponse.status, videoId })
          );
          return jsonResponse(
            {
              error: "Could not fetch video captions. Try pasting the recipe text manually instead.",
              phase: "caption-extract",
            },
            502
          );
        }
        transcriptXml = await captionResponse.text();
      } catch (err) {
        console.error(
          JSON.stringify({ phase: "caption-extract", error: err instanceof Error ? err.message : String(err), videoId })
        );
        return jsonResponse(
          {
            error: "Could not fetch video captions. Try pasting the recipe text manually instead.",
            phase: "caption-extract",
          },
          502
        );
      }

      // Strip XML tags, decode entities, collapse whitespace
      let cleaned = transcriptXml.replace(/<[^>]+>/g, " ");
      cleaned = decodeHtmlEntities(cleaned);
      cleaned = cleaned.replace(/\s+/g, " ").trim();

      // Truncate to 15K characters
      if (cleaned.length > 15000) {
        console.log(
          JSON.stringify({ phase: "caption-extract", event: "truncated", originalLength: cleaned.length, videoId })
        );
        cleaned = cleaned.substring(0, 15000);
      }

      transcriptText = cleaned;
    } else {
      return jsonResponse(
        { error: "Invalid mode. Use 'youtube' or 'text'.", phase: "request" },
        400
      );
    }

    // --- Gemini call (shared between both modes) ---
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const fullPrompt = `${RECIPE_PROMPT}\n\nText to analyze:\n${transcriptText}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
      }),
    });

    if (!geminiResponse.ok) {
      const status = geminiResponse.status;
      const errBody = await geminiResponse.text();
      console.error(JSON.stringify({ phase: "gemini-call", error: errBody, status }));

      if (status === 429) {
        return jsonResponse(
          { error: "Rate limit exceeded. Please try again in a moment.", phase: "gemini-call" },
          429
        );
      }

      return jsonResponse(
        { error: "Recipe extraction failed. Please try again.", phase: "gemini-call" },
        502
      );
    }

    // --- Parse Gemini response ---
    const geminiResult = await geminiResponse.json();
    const rawText = geminiResult?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!rawText) {
      console.error(
        JSON.stringify({
          phase: "parse",
          error: "Empty response from Gemini",
          candidates: geminiResult?.candidates?.length ?? 0,
        })
      );
      return jsonResponse(
        { error: "Could not extract recipe ingredients. Please try again.", phase: "parse" },
        400
      );
    }

    // Strip markdown code fences if present
    const cleanedJson = rawText
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "")
      .trim();

    let parsed: RecipeResult;
    try {
      parsed = JSON.parse(cleanedJson);
    } catch {
      console.error(
        JSON.stringify({
          phase: "parse",
          error: "JSON parse failed",
          rawText: rawText.substring(0, 500),
        })
      );
      return jsonResponse(
        { error: "Could not extract recipe ingredients. Please try again.", phase: "parse" },
        400
      );
    }

    // Validate structure
    if (!Array.isArray(parsed.ingredients)) {
      console.error(
        JSON.stringify({
          phase: "parse",
          error: "Invalid response structure",
          hasIngredients: Array.isArray(parsed.ingredients),
        })
      );
      return jsonResponse(
        { error: "Could not extract recipe ingredients. Please try again.", phase: "parse" },
        400
      );
    }

    // Success
    console.log(
      JSON.stringify({
        phase: "success",
        mode,
        title: parsed.title,
        ingredient_count: parsed.ingredients.length,
      })
    );

    return jsonResponse(
      { title: parsed.title, ingredients: parsed.ingredients },
      200
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        phase: "unknown",
        error: error instanceof Error ? error.message : String(error),
      })
    );
    return jsonResponse(
      { error: "An unexpected error occurred", phase: "unknown" },
      500
    );
  }
});
