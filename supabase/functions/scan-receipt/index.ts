// Edge Function: scan-receipt
// Receives a base64-encoded receipt image, calls Gemini Vision to extract
// structured line items (name, quantity, price, total), returns JSON.
// Gemini is instructed to expand store abbreviations into readable names.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

interface ReceiptResult {
  items: ReceiptItem[];
  total: number;
}

const PROMPT = `You are a receipt OCR assistant. Analyze this grocery receipt image and extract every line item.

Rules:
1. For each item, extract: name, quantity, and price (unit price × quantity = line total; use the line total as "price").
2. If quantity is not explicitly shown on the receipt, set it to 1.
3. Expand store abbreviations into full, human-readable product names. For example:
   - "GV WHL MLK 1GL" → "Great Value Whole Milk 1 Gallon"
   - "KR BNLS CHKN BR" → "Kroger Boneless Chicken Breast"
   - "ORG BRN EGGS 12" → "Organic Brown Eggs 12 Count"
   Use your knowledge of common grocery store product abbreviations.
4. Return the receipt subtotal or total as the "total" field. If both are shown, prefer the subtotal (before tax).
5. Do NOT include tax lines, bag fees, or payment lines as items.

Return ONLY valid JSON with this exact schema (no other text):
{
  "items": [
    { "name": "string", "quantity": 1, "price": 0.00 }
  ],
  "total": 0.00
}`;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed", phase: "request" }),
      {
        status: 405,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // 1. Parse request body
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64 || !mimeType) {
      return new Response(
        JSON.stringify({
          error: "Missing imageBase64 or mimeType in request body",
          phase: "request",
        }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Check for Gemini API key
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error(JSON.stringify({ phase: "config", error: "GEMINI_API_KEY not set" }));
      return new Response(
        JSON.stringify({
          error: "Gemini API key not configured",
          phase: "config",
        }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    // 3. Call Gemini Vision
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: imageBase64,
                },
              },
              { text: PROMPT },
            ],
          },
        ],
      }),
    });

    if (!geminiResponse.ok) {
      const status = geminiResponse.status;
      const body = await geminiResponse.text();
      console.error(
        JSON.stringify({ phase: "gemini-call", error: body, status })
      );

      if (status === 429) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded. Please try again in a moment.",
            phase: "gemini-call",
          }),
          {
            status: 429,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: "Receipt processing failed",
          phase: "gemini-call",
        }),
        {
          status: 502,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    // 4. Parse Gemini response
    const geminiResult = await geminiResponse.json();

    const rawText =
      geminiResult?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!rawText) {
      console.error(
        JSON.stringify({
          phase: "parse",
          error: "Empty response from Gemini",
          candidates: geminiResult?.candidates?.length ?? 0,
        })
      );
      return new Response(
        JSON.stringify({
          error: "Could not extract receipt items. Please try a clearer photo.",
          phase: "parse",
        }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    // Strip markdown code fences if present
    const cleaned = rawText
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "")
      .trim();

    let parsed: ReceiptResult;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error(
        JSON.stringify({
          phase: "parse",
          error: "JSON parse failed",
          rawText: rawText.substring(0, 500),
        })
      );
      return new Response(
        JSON.stringify({
          error: "Could not extract receipt items. Please try a clearer photo.",
          phase: "parse",
        }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    // Validate structure
    if (
      !Array.isArray(parsed.items) ||
      typeof parsed.total !== "number"
    ) {
      console.error(
        JSON.stringify({
          phase: "parse",
          error: "Invalid response structure",
          hasItems: Array.isArray(parsed.items),
          hasTotal: typeof parsed.total,
        })
      );
      return new Response(
        JSON.stringify({
          error: "Could not extract receipt items. Please try a clearer photo.",
          phase: "parse",
        }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    // 5. Return success
    console.log(
      JSON.stringify({
        phase: "success",
        item_count: parsed.items.length,
        total: parsed.total,
      })
    );

    return new Response(
      JSON.stringify({ items: parsed.items, total: parsed.total }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        phase: "unknown",
        error: error instanceof Error ? error.message : String(error),
      })
    );
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred",
        phase: "unknown",
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }
});
