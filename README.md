# HJDK API (Vercel) — config + tellers + AUTO-ITERATIE voor de yoo.rs affiliate-engine

## Deployen (één keer)
1. `npx vercel login` (bevestig in browser) → `npx vercel` (projectnaam hjdk-api)
2. Vercel-dashboard: project → Storage → Create → KV → Connect to project
3. Settings → Environment Variables:
   - `HJDK_TOKEN`      = zelfgekozen geheim woord (config schrijven / iterate handmatig starten)
   - `ANTHROPIC_API_KEY` = Claude API-sleutel (console.anthropic.com) — nodig voor de nachtelijke auto-iteratie
   - `CRON_SECRET`     = willekeurige lange string (Vercel stuurt die mee bij de cron-aanroep)
   - `ANTHROPIC_MODEL` = optioneel (standaard claude-sonnet-4-5)
4. `npx vercel --prod`

## Endpoints
- `GET  /api/hjdk/config`                 → config (JSON)
- `POST /api/hjdk/config` + `x-hjdk-token` → config vervangen
- `GET  /api/hjdk/stats/hit/{key}` / `get/{key}` / `list?prefix=hjdk6-`
- `GET  /api/hjdk/iterate`                → auto-iteratie (cron 03:17 UTC dagelijks; handmatig met `x-hjdk-token`; `?dry=1` = alleen kijken)

## Auto-iteratie
Per groep (soort tekst × winkel × categorie × taal) met genoeg data: verliezers (CTR < 50% van de beste) gaan uit,
Claude bedenkt 3 nieuwe eerlijke uitdagers, de lijst gaat in de config. De engine leest de config elke 5 min.
Orders tellen 20x zo zwaar als klikken (voer orders in via de engine: ?hjdk_feed=...).
