# Secrets Manifest

**Milestone:** M002
**Generated:** 2026-03-15

### GEMINI_API_KEY

**Service:** Google AI Studio (Gemini API)
**Dashboard:** https://aistudio.google.com/app/apikey
**Format hint:** 39-char alphanumeric string, e.g. `AIzaSy...`
**Status:** collected
**Destination:** dotenv

1. Navigate to https://aistudio.google.com/app/apikey
2. Sign in with the Google account that has the Gemini Pro subscription
3. Click "Create API key" and select or create a Google Cloud project
4. Copy the generated API key
5. Verify the key works server-side by running: `curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=YOUR_KEY" -H "Content-Type: application/json" -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'`
6. The key will be set as a Supabase Edge Function secret via `supabase secrets set GEMINI_API_KEY=<key>`

### KROGER_CLIENT_ID

**Service:** Kroger Developer Platform
**Dashboard:** https://developer.kroger.com/manage/apps
**Format hint:** UUID format, e.g. `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
**Status:** skipped
**Destination:** dotenv

1. User has already enrolled RoomY on the Kroger Developer Platform with production environment credentials
2. Copy the "Client ID" from the app details page at https://developer.kroger.com/manage/apps
3. Will be collected via `secure_env_collect` and set as Supabase Edge Function secret during S04 execution

### KROGER_CLIENT_SECRET

**Service:** Kroger Developer Platform
**Dashboard:** https://developer.kroger.com/manage/apps
**Format hint:** alphanumeric string, ~32 characters
**Status:** collected
**Destination:** dotenv

1. User has already enrolled RoomY on the Kroger Developer Platform with production environment credentials
2. Copy the "Client Secret" from the same app details page
3. Will be collected via `secure_env_collect` and set as Supabase Edge Function secret during S04 execution
