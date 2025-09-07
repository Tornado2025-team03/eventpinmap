AI Fill Edge Function (ai-fill)

Overview
- Extracts what/where/when from Japanese free text using Gemini (fallback OpenAI).
- Optionally geocodes `where_text` with `GOOGLE_MAPS_KEY`.
- Always returns JSON. On errors, returns 5xx + `{ error }` or, with `SOFT_FAIL=true`, returns 200 with all fields null and an `error` message.

Environment Variables (Functions > ai-fill > Settings)
- GEMINI_API_KEY: required to use Gemini (preferred)
- GEMINI_MODEL: default `gemini-1.5-pro`
- OPENAI_API_KEY: optional fallback
- GOOGLE_MAPS_KEY: optional, for server-side geocoding
- SOFT_FAIL: optional. `true` to return 200 + null JSON on LLM errors

Deploy
1) From repository root:
   npx supabase functions deploy ai-fill --project-ref ejccfisshgflntmhvimv --use-api

2) Configure environment variables in Supabase Dashboard.

Test (Unix curl)
curl -i -X POST \
  https://ejccfisshgflntmhvimv.functions.supabase.co/ai-fill \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "apikey: <ANON_KEY>" \
  -d '{"text":"明日の夜 渋谷でボドゲ","tz":"Asia/Tokyo","now_iso":"2025-09-07T12:00:00Z","locale":"ja-JP"}'

Test (PowerShell)
$anon = "<ANON_KEY>"
$body = @{ text = "明日の夜 渋谷でボドゲ"; tz = "Asia/Tokyo"; now_iso = "2025-09-07T12:00:00Z"; locale = "ja-JP" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "https://ejccfisshgflntmhvimv.functions.supabase.co/ai-fill" \
  -ContentType "application/json" -Headers @{ Authorization = "Bearer $anon"; apikey = $anon } -Body $body

Action Endpoints (compat)
- Title generation:
  POST /ai-fill { "action":"generate_title", "input": { what, when_iso, where, tags, capacity, fee } }
  -> { "title": string|null }
- Icon pick:
  POST /ai-fill { "action":"icon_pick", "input": { what } }
  -> { "icon": string }

Expected JSON (main)
{ "what": string|null, "where_text": string|null, "start_iso": string|null, "end_iso": string|null, "latitude": number|null, "longitude": number|null }

Client (Expo)
- Set in `eventpinmap/native/.env`:
  EXPO_PUBLIC_AI_FILL_ENDPOINT=https://ejccfisshgflntmhvimv.functions.supabase.co/ai-fill
  EXPO_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
  EXPO_PUBLIC_DEBUG_AI=1

Start Expo
cd eventpinmap/native
npx expo start

Logs
- Supabase Dashboard → Functions → ai-fill → Logs should show:
  [ai-fill] request start and [ai-fill] body
  Errors with console.error

