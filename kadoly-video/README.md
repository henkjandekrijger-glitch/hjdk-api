# kadoly-video

Apart Vercel-project (map `kadoly-video/` in de repo hjdk-api, root directory van het project kadoly-video). Henkjan 17 nov 2026: "moet hele NL dag niet om 1730 de hele dag natuurlijk . al via clickmind en lerend wat het doet" en "Zet dit door". Apart, zodat de shop (hjdk-api) geen videosoftware draagt.

Werking:
- Cron 04:10 en 04:40 UTC: `/api/maak` haalt het plan van vandaag op uit de shop (`keuzehulp.best/api/shop?op=videoplan`, keuze in `lib/kadolyvideoplan.js`: producten met minstens EUR 5 marge, op voorraad, levertijd tot 8 dagen, niet in de laatste 21 dagen in een video; soorten kleurkeuze, set en finds, volgorde lerend uit `kadoly/reels.json` > lerend > soorten).
- Rendert per plan-item een video van 12 s (1080x1920, productfoto's met zachte zoom, tekstregels als PNG-laag in Poppins Bold, merk kadoly.com) met ffmpeg-static, en zet hem in Vercel Blob `kadoly/video/<id>.mp4` (openbaar). Hooguit 200 s per ronde; de tweede cron maakt de rest af.
- `kadoly/lijst.json` in Blob is de wachtrij; `/api/lijst` geeft hem terug. De dagtaak social (`kadoly/taak-social.md`, stap 7b) zet nieuwe video's achteraan in `kadoly/reels.json` en plant ze over de hele dag op Instagram, Facebook, YouTube en TikTok (die twee zodra ze in Zernio staan).
- Renderen kan alleen via de cron of een beschermde deployment-URL; de vaste projectnaam geeft 404.

Vercel: project kadoly-video (prj_g9biV2AEp1vmAhFO0JW1uUdaE3G2), Blob-store kadoly-video (store_gA3hUWvh2mwRWyPU, openbaar, iad1), aangemaakt 17 nov 2026.
