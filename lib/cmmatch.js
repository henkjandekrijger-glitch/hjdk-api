// Clickmind-matching (20 nov 2026, Henkjan: "Maak voor ons ook een wetracked maar dan 100 x beter" en "Bouw voor ons").
//
// 1. Terugvinden: wie bij het afrekenen zijn e-mail invult, laat een versleutelde vingerafdruk achter (sha256 van het e-mailadres in kleine
//    letters, gemaakt door de shop; het adres zelf komt hier nooit). Komt er later een betaalde bestelling zonder kenmerk binnen met dezelfde
//    vingerafdruk (ander apparaat, terug via Google, link kwijt), dan hoort die bij de eerdere klik en telt hij alsnog voor die advertentie.
// 2. Betere herkenning: dezelfde vingerafdrukken (e-mail, telefoon) gaan mee met de melding aan TikTok en Meta, zodat die de koper ook
//    zonder klik-id herkennen (iPhone, adblocker).
// Alleen sha256-hashes (64 tekens hex) worden bewaard, 60 dagen. IP en browser gaan alleen door, nooit opgeslagen.

const HEX = /^[0-9a-f]{64}$/;
export const hashOk = s => { const h = String(s || '').trim().toLowerCase(); return HEX.test(h) ? h : ''; };
const K_EM = em => 'cm:em:' + em;
const K_PH = ph => 'cm:ph:' + ph;
const DAGEN = 60 * 86400;

// Leest de vingerafdrukken uit een pixel-aanroep of een bestelling uit de datapagina van de shop.
export function gebruikerVan(o) {
  if (!o) return {};
  const get = k => (typeof o.get === 'function' ? o.get(k) : o[k]);
  const em = hashOk(get('em') || get('email_sha256') || get('em_sha256'));
  const ph = hashOk(get('ph') || get('phone_sha256') || get('ph_sha256'));
  const ip = String(get('ip') || '').replace(/[^0-9a-fA-F:.]/g, '').slice(0, 45);
  const ua = String(get('ua') || '').replace(/[\r\n]/g, ' ').slice(0, 300);
  return { ...(em ? { em } : {}), ...(ph ? { ph } : {}), ...(ip ? { ip } : {}), ...(ua ? { ua } : {}) };
}

// Bewaart bij een klik welke vingerafdrukken erbij horen (alleen hashes).
export async function koppel(kv, code, u) {
  if (!code || !u) return;
  try {
    if (u.em) { await kv.set(K_EM(u.em), code, { ex: DAGEN }); await kv.set('cm:emzien', Date.now()); }
    if (u.ph) await kv.set(K_PH(u.ph), code, { ex: DAGEN });
  } catch (e) {}
}

// Zoekt de eerdere klik bij een bestelling zonder kenmerk. Geeft de klikcode of ''.
export async function zoek(kv, u) {
  if (!u) return '';
  try {
    if (u.em) { const c = await kv.get(K_EM(u.em)); if (c) return String(c); }
    if (u.ph) { const c = await kv.get(K_PH(u.ph)); if (c) return String(c); }
  } catch (e) {}
  return '';
}

// Bewaart de hashes op de klik zelf, zodat latere meldingen (betaald, retour) ze meesturen.
export function zetOpKlik(rec, u) {
  if (!rec || !u) return false;
  const oud = rec.u || {}; const nieuw = { ...oud, ...(u.em ? { em: u.em } : {}), ...(u.ph ? { ph: u.ph } : {}) };
  if (nieuw.em === oud.em && nieuw.ph === oud.ph) return false;
  rec.u = nieuw; return true;
}

// Teller voor het Clickmind-overzicht: hoeveel bestellingen we terugvonden of alleen met vingerafdruk konden melden.
export async function telMatch(kv, soort) {
  try { const dag = new Date().toISOString().slice(0, 10).replace(/-/g, ''); await kv.raw(['HINCRBY', 'cm:match:' + dag, soort, '1']); await kv.raw(['EXPIRE', 'cm:match:' + dag, String(90 * 86400)]); } catch (e) {}
}
