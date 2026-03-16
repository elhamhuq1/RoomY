/**
 * Client-side YouTube transcript extraction.
 *
 * Uses a two-step approach matching the youtube-transcript-api library:
 * 1. Fetch watch page to get the INNERTUBE_API_KEY
 * 2. Call the innertube player API with ANDROID client to get caption tracks
 * 3. Fetch the caption XML from the track URL
 *
 * The ANDROID client via innertube reliably returns caption data including
 * working caption URLs, unlike direct watch page parsing which is subject to
 * anti-scraping measures (xowf, empty caption responses).
 *
 * The extracted transcript is then sent to the import-recipe Edge Function via
 * text mode for Gemini ingredient extraction.
 */

const MAX_DURATION_SECONDS = 1800; // 30 minutes
const MAX_TRANSCRIPT_LENGTH = 15_000;

const INNERTUBE_CONTEXT = {
  client: { clientName: "ANDROID", clientVersion: "20.10.38" },
};

export interface YouTubeTranscriptResult {
  transcript: string;
  title: string | null;
}

export interface YouTubeTranscriptError {
  error: string;
  phase: "url-parse" | "page-fetch" | "caption-extract" | "duration-guard";
}

type ExtractionResult =
  | { ok: true; data: YouTubeTranscriptResult }
  | { ok: false; error: YouTubeTranscriptError };

/**
 * Extract a YouTube video ID from various URL formats.
 * Handles: youtube.com/watch?v=, youtu.be/, youtube.com/shorts/, m.youtube.com/watch?v=
 */
export function extractVideoId(url: string): string | null {
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
      const shortsMatch = parsed.pathname.match(
        /^\/shorts\/([a-zA-Z0-9_-]+)/
      );
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
 * Check if a URL looks like a YouTube video URL.
 */
export function isYouTubeUrl(url: string): boolean {
  return extractVideoId(url) !== null;
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
 * Extract the INNERTUBE_API_KEY from YouTube watch page HTML.
 * Falls back to the well-known default key if not found.
 */
function extractInnertubeApiKey(html: string): string {
  const match = html.match(/"INNERTUBE_API_KEY":\s*"([a-zA-Z0-9_-]+)"/);
  return match ? match[1] : "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
}

/**
 * Extract transcript text from a YouTube video URL.
 *
 * Uses the innertube ANDROID player API to reliably get caption tracks,
 * then fetches and cleans the transcript XML.
 *
 * Returns either the transcript + title, or a structured error with phase.
 */
export async function extractYouTubeTranscript(
  url: string
): Promise<ExtractionResult> {
  // 1. Extract video ID
  const videoId = extractVideoId(url);
  if (!videoId) {
    return {
      ok: false,
      error: {
        error:
          "Could not parse YouTube URL. Please check the link and try again.",
        phase: "url-parse",
      },
    };
  }

  // 2. Fetch watch page to get innertube API key
  let apiKey: string;
  try {
    const pageResponse = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
          Cookie:
            "SOCS=CAISNQgDEitib3FfaWRlbnRpdHlmcm9udGVuZHVpc2VydmVyXzIwMjMwODI5LjA3X3AxGgJlbiACGgYIgJnPpwY; CONSENT=PENDING+999",
        },
      }
    );
    if (!pageResponse.ok) {
      return {
        ok: false,
        error: {
          error:
            "Could not fetch YouTube video page. The video may be private or unavailable.",
          phase: "page-fetch",
        },
      };
    }
    const html = await pageResponse.text();
    apiKey = extractInnertubeApiKey(html);
  } catch {
    return {
      ok: false,
      error: {
        error: "Could not fetch YouTube video page. Please try again.",
        phase: "page-fetch",
      },
    };
  }

  // 3. Call innertube player API with ANDROID client
  let playerData: Record<string, any>;
  try {
    const innertubeResponse = await fetch(
      `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "com.google.android.youtube/20.10.38 (Linux; U; Android 12; US) gzip",
        },
        body: JSON.stringify({
          context: INNERTUBE_CONTEXT,
          videoId,
        }),
      }
    );

    if (!innertubeResponse.ok) {
      return {
        ok: false,
        error: {
          error:
            "Could not fetch video data. Try pasting the recipe text manually instead.",
          phase: "caption-extract",
        },
      };
    }

    playerData = await innertubeResponse.json();
  } catch {
    return {
      ok: false,
      error: {
        error:
          "Could not fetch video data. Try pasting the recipe text manually instead.",
        phase: "caption-extract",
      },
    };
  }

  // Check playability
  const playabilityStatus = playerData?.playabilityStatus?.status;
  if (playabilityStatus !== "OK") {
    const reason =
      playerData?.playabilityStatus?.reason ?? "Video is unavailable";
    return {
      ok: false,
      error: {
        error: reason,
        phase: "caption-extract",
      },
    };
  }

  // 4. Duration guard
  const videoDetails = playerData.videoDetails as
    | Record<string, any>
    | undefined;
  const lengthSeconds = parseInt(
    String(videoDetails?.lengthSeconds ?? "0"),
    10
  );
  if (lengthSeconds > MAX_DURATION_SECONDS) {
    const minutes = Math.round(lengthSeconds / 60);
    return {
      ok: false,
      error: {
        error: `This video is ${minutes} minutes long. For best results, please use videos under 30 minutes or paste the recipe text manually.`,
        phase: "duration-guard",
      },
    };
  }

  const title = videoDetails?.title ? String(videoDetails.title) : null;

  // 5. Extract caption tracks
  const captions =
    playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!Array.isArray(captions) || captions.length === 0) {
    return {
      ok: false,
      error: {
        error:
          "This video has no captions available. Try pasting the recipe text manually instead.",
        phase: "caption-extract",
      },
    };
  }

  // Prefer non-ASR English track, then any English, then first available
  const manualEnglish = captions.find(
    (t: { languageCode?: string; kind?: string }) =>
      t.languageCode?.startsWith("en") && t.kind !== "asr"
  );
  const anyEnglish = captions.find(
    (t: { languageCode?: string }) => t.languageCode?.startsWith("en")
  );
  const track = manualEnglish || anyEnglish || captions[0];
  const captionUrl = String(track.baseUrl).replace(/\\u0026/g, "&");

  // 6. Fetch transcript XML
  let transcriptXml: string;
  try {
    const captionResponse = await fetch(captionUrl);
    if (!captionResponse.ok) {
      return {
        ok: false,
        error: {
          error:
            "Could not fetch video captions. Try pasting the recipe text manually instead.",
          phase: "caption-extract",
        },
      };
    }
    transcriptXml = await captionResponse.text();

    if (!transcriptXml || transcriptXml.length < 10) {
      return {
        ok: false,
        error: {
          error:
            "Video captions appear to be empty. Try pasting the recipe text manually instead.",
          phase: "caption-extract",
        },
      };
    }
  } catch {
    return {
      ok: false,
      error: {
        error:
          "Could not fetch video captions. Try pasting the recipe text manually instead.",
        phase: "caption-extract",
      },
    };
  }

  // 7. Clean transcript: strip XML tags, decode entities, collapse whitespace
  let cleaned = transcriptXml.replace(/<[^>]+>/g, " ");
  cleaned = decodeHtmlEntities(cleaned);
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  // Truncate to 15K characters
  if (cleaned.length > MAX_TRANSCRIPT_LENGTH) {
    console.log(
      `[youtube] Transcript truncated: ${cleaned.length} → ${MAX_TRANSCRIPT_LENGTH} chars`
    );
    cleaned = cleaned.substring(0, MAX_TRANSCRIPT_LENGTH);
  }

  return {
    ok: true,
    data: {
      transcript: cleaned,
      title,
    },
  };
}
