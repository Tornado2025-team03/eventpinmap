AI Fill (Supabase Edge Function)

Location
- Path in this repo: eventpinmap/supabase/functions/ai-fill

Overview
- Mirrors eventpinmap/ai-server/main.py as a Deno/TypeScript Edge Function.
- Prefers Gemini (GEMINI_API_KEY); falls back to OpenAI (OPENAI_API_KEY).
- Optionally geocodes with GOOGLE_MAPS_KEY to return latitude/longitude and a normalized address.

Secrets
- GEMINI_API_KEY: Google Generative Language API key (Gemini)
- GEMINI_MODEL (optional): default "gemini-1.5-flash"
- OPENAI_API_KEY (optional): if set and GEMINI_API_KEY not set, uses OpenAI
- OPENAI_MODEL (optional): default "gpt-4o-mini"
- GOOGLE_MAPS_KEY (optional): if set, server-side geocoding is performed

Local dev
1) Install Supabase CLI: https://supabase.com/docs/guides/cli
2) Set secrets:
   supabase secrets set GEMINI_API_KEY=... [GOOGLE_MAPS_KEY=...] [OPENAI_API_KEY=...]
3) Serve the function:
   supabase functions serve ai-fill --no-verify-jwt
   # Endpoint (example): http://localhost:54321/functions/v1/ai-fill

Deploy
   supabase functions deploy ai-fill --no-verify-jwt
   # Public URL: https://<project-ref>.functions.supabase.co/ai-fill

Expo app config
- Set EXPO_PUBLIC_AI_FILL_ENDPOINT to the function URL in eventpinmap/native/.env, e.g.:
  EXPO_PUBLIC_AI_FILL_ENDPOINT=https://<project-ref>.functions.supabase.co/ai-fill

Request/Response
- POST JSON body:
  { text: string, tz?: string (default Asia/Tokyo), now_iso?: string, locale?: string, hint_city?: string }
- Response JSON:
  { what?, where_text?, start_iso?, end_iso?, latitude?, longitude? }

