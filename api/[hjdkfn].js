// Proef voor één Vercel-functie in hjdk-api (Henkjan 21 nov 2026: "Dicht alle lekken"; zelfde aanpak als todayin bzz/api/[bzzfn].js).
// Deze dynamische route vangt alleen /api/<naam> waar geen bestand voor bestaat. Nu alleen /api/routergezond; de volgende commit
// zet de eindpunten erachter (scripts/router-maak.mjs).
export default function handler(req, res) {
  if (/[?&]hjdkfn=routergezond(&|$)/.test(req.url || '')) {
    res.setHeader('cache-control', 'no-store');
    return res.status(200).json({ ok: true, proef: true, methode: req.method, url: req.url, query: req.query });
  }
  return res.status(404).send('Not found');
}
