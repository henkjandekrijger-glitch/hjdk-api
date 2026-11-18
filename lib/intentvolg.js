// Intentie volgen per persoon (Henkjan 18 nov 2026): "de lerende chat die dus engagement gaat leren te vinden bij mensen en hun intent blijft
// volgen voor ze en dan contact opneemt. Wij adviseren en verdienen er evt aan maar bouwen vooral DATA op over aankopen. Kijk bij WAM wat ik
// daar al geleerd heb." Van WAM overgenomen (lib/wam-overdracht.js): terugbereiken is het lek, dus de chat legt de intentie vast en koppelt
// die aan het volgkanaal dat de bezoeker zelf koos (de ochtendmail van lib/keuze-updates.js); geen koude berichten, één vraag tegelijk,
// en na een paar dagen een check-in zoals de WAM-check-in na 24 uur ("spraken jullie elkaar?"), hier: "is het gelukt, wat werd het?".
// Lerend: het moment van de check-in (na 2, 5 of 10 dagen) is een Thompson-proef op antwoorden per verstuurde check-in.
// Opslag (krap): iv:s:<sid> intentie van een chatsessie (3 dagen), iv:<abonnee-id> intenties van een abonnee (hoogstens 8),
// iv:t:<hash token> pointer voor de knoppen in de mail, iv:koop lijst met antwoorden (5.000), iv:d:<dag> tellers, iv:arm:<site>:<arm>:<sent|ant>.
// Geen e-mailadressen of IP-adressen in deze sleutels; de abonnee-id is de hash uit lib/keuze-updates.js.
import { createHash, randomBytes } from 'node:crypto';
import { kv } from './db.js';

const hash = s => createHash('sha256').update(String(s)).digest('hex');
const kort = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').replace(/\S+@\S+/g, ' ').replace(/(\+?\d[\d\s().-]{6,}\d)/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const dag = () => new Date().toISOString().slice(0, 10);
const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// chat-site (nl, us, de) naar updates-site (kz, us, de)
export const UPD = { nl: 'kz', us: 'us', de: 'de' };
const HOST = { kz: 'keuzehulp.best', us: 'whichtobuy.best', de: 'kaufberater.best' };
export const ARMEN = ['2', '5', '10']; // dagen tot de check-in
const MAX = 8;

const T = {
  kz: { kop: 'Wat we voor je volgen', zocht: 'Je zocht', voor: 'voor', budget: 'budget', vraag: 'Is het gelukt?', ja: 'Ja, gekocht', nog: 'Nog niet', niet: 'Niet meer nodig',
    dank: 'Dank je. Dit helpt ons andere mensen beter te adviseren.', wat: 'Wat werd het, en waar kocht je het?', watPh: 'Bijvoorbeeld: Philips airfryer XL bij bol, 129 euro', stuur: 'Versturen',
    nogT: 'Dan volgen we het nog even voor je. Over een week vragen we het nog eens.', nietT: 'Helder. Dan stoppen we met volgen voor dit onderwerp.', klaar: 'Opgeslagen. Dank je.', fout: 'Deze link werkt niet meer.' },
  us: { kop: 'What we keep an eye on for you', zocht: 'You were looking for', voor: 'for', budget: 'budget', vraag: 'Did it work out?', ja: 'Yes, I bought it', nog: 'Not yet', niet: 'No longer needed',
    dank: 'Thank you. This helps us advise other people better.', wat: 'What did you get, and where did you buy it?', watPh: 'For example: Ninja air fryer at Amazon, $129', stuur: 'Send',
    nogT: 'Then we keep watching it for you. We will ask again in a week.', nietT: 'Got it. We stop following this for you.', klaar: 'Saved. Thank you.', fout: 'This link no longer works.' },
  de: { kop: 'Was wir für dich verfolgen', zocht: 'Du hast gesucht', voor: 'für', budget: 'Budget', vraag: 'Hat es geklappt?', ja: 'Ja, gekauft', nog: 'Noch nicht', niet: 'Nicht mehr nötig',
    dank: 'Danke. Das hilft uns, andere besser zu beraten.', wat: 'Was ist es geworden, und wo hast du es gekauft?', watPh: 'Zum Beispiel: Philips Airfryer XL bei Amazon, 129 Euro', stuur: 'Senden',
    nogT: 'Dann verfolgen wir es noch etwas für dich. In einer Woche fragen wir noch einmal.', nietT: 'Alles klar. Dann hören wir für dieses Thema auf.', klaar: 'Gespeichert. Danke.', fout: 'Dieser Link funktioniert nicht mehr.' },
};

async function tel(site, ev, n = 1) { const d = dag(); try { await kv.raw(['HINCRBY', 'iv:d:' + d, site + ':' + ev, String(n)]); await kv.raw(['EXPIRE', 'iv:d:' + d, String(120 * 86400)]); } catch (e) {} }

function gamma(k) { if (k < 1) return gamma(k + 1) * Math.pow(Math.random(), 1 / k); const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d); for (;;) { let x, v; do { x = Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random()); v = 1 + c * x; } while (v <= 0); v = v * v * v; const u = Math.random(); if (u < 1 - 0.0331 * x * x * x * x || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v; } }
const beta = (a, b) => { const x = gamma(a), y = gamma(b); return x / (x + y); };
async function kiesArm(site) {
  const ks = ARMEN.flatMap(a => ['iv:arm:' + site + ':' + a + ':sent', 'iv:arm:' + site + ':' + a + ':ant']);
  let v = []; try { v = await kv.mget(...ks); } catch (e) {}
  let best = ARMEN[0], top = -1;
  ARMEN.forEach((a, i) => { const s = N(v[i * 2]), an = Math.min(N(v[i * 2 + 1]), s); const x = beta(1 + an, 1 + s - an); if (x > top) { top = x; best = a; } });
  return best;
}

const leeg = i => !(i && (i.wat || i.voorWie || i.budget || i.wanneer));
function schoonI(i) { return { wat: kort(i && i.wat, 60), voorWie: kort(i && i.voorWie, 40), budget: kort(i && i.budget, 30), wanneer: kort(i && i.wanneer, 30) }; }
// nieuwe velden vullen lege velden aan; een nieuw 'wat' vervangt het oude alleen als het niet leeg is
function voegSamen(a, b) { const o = Object.assign({}, a || {}); for (const k of ['wat', 'voorWie', 'budget', 'wanneer']) if (b[k]) o[k] = b[k]; return o; }

async function abonnee(vt, updSite) {
  if (!/^[a-f0-9]{48}$/.test(vt || '')) return null;
  const p = await kv.get('updates:volg:' + hash(vt)).catch(() => null);
  return p && p.site === updSite ? p.id : null;
}

async function zetBijAbonnee(id, updSite, slug, i, samen) {
  const key = 'iv:' + id; const r = (await kv.get(key).catch(() => null)) || { site: updSite, l: [] };
  const nu = Date.now(); let x = r.l.find(y => y.slug === slug && !y.klaar);
  if (x) { Object.assign(x, voegSamen(x, i)); x.t = nu; if (samen) x.samen = true; }
  else { const arm = await kiesArm(updSite); x = { k: randomBytes(6).toString('hex'), slug, ...i, samen: !!samen, t: nu, arm, due: nu + N(arm) * 864e5 }; r.l.push(x); r.l = r.l.slice(-MAX); await tel(updSite, 'gevolgd'); }
  await kv.set(key, r, { ex: 120 * 86400 });
  return x;
}

// vanuit de chat: intentie van deze sessie bijwerken en, als de bezoeker al volgt, meteen aan de abonnee hangen
export async function chatIntentie({ site, slug, sid, vt, intentie, samen }) {
  const updSite = UPD[site]; if (!updSite || !/^[a-z0-9-]{1,90}$/.test(slug || '')) return { ok: false };
  const i = schoonI(intentie); if (leeg(i)) return { ok: true, leeg: true };
  if (/^[a-z0-9]{12,40}$/.test(sid || '')) { const k = 'iv:s:' + hash(sid).slice(0, 32); const s = (await kv.get(k).catch(() => null)) || {}; s[slug] = { ...voegSamen(s[slug], i), samen: !!(samen || (s[slug] && s[slug].samen)), site: updSite }; await kv.set(k, s, { ex: 3 * 86400 }).catch(() => null); }
  const id = await abonnee(vt, updSite); if (!id) return { ok: true, gekoppeld: false };
  await zetBijAbonnee(id, updSite, slug, i, samen); return { ok: true, gekoppeld: true };
}

// na volgen of aanmelden: de intenties van deze chatsessie aan de abonnee hangen
export async function koppel({ sid, vt, site }) {
  if (!/^[a-z0-9]{12,40}$/.test(sid || '')) return { ok: false };
  const s = await kv.get('iv:s:' + hash(sid).slice(0, 32)).catch(() => null); if (!s) return { ok: true, n: 0 };
  let n = 0;
  for (const [slug, x] of Object.entries(s)) { const updSite = x.site || UPD[site]; const id = await abonnee(vt, updSite); if (!id) continue; await zetBijAbonnee(id, updSite, slug, schoonI(x), x.samen); n++; }
  return { ok: true, n };
}

// blok voor de ochtendmail: wat we volgen, en bij wie het tijd is een check-in met drie knoppen
export async function mailBlok(site, id) {
  const r = await kv.get('iv:' + id).catch(() => null); if (!r || !r.l || !r.l.length) return null;
  const t = T[site] || T.kz; const nu = Date.now(); const open = r.l.filter(x => !x.klaar); if (!open.length) return null;
  const regel = x => esc(t.zocht + ' ' + (x.wat || x.slug.replace(/-/g, ' ')) + (x.voorWie ? ' ' + t.voor + ' ' + x.voorWie : '') + (x.budget ? ', ' + t.budget + ' ' + x.budget : ''));
  const due = open.find(x => !x.sent && x.due <= nu);
  const knoppen = [];
  let html = '<div class="k" style="margin:0 0 20px"><p style="margin:0 0 6px"><strong>' + esc(t.kop) + '</strong></p>' + open.slice(0, 4).map(x => '<p style="margin:2px 0">' + regel(x) + '</p>').join('');
  if (due) {
    const tok = randomBytes(24).toString('hex'); await kv.set('iv:t:' + hash(tok), { id, k: due.k, site }, { ex: 45 * 86400 });
    const u = a => 'https://' + HOST[site] + '/api/keuze-tools?tool=intentie&op=koop&t=' + tok + '&a=' + a;
    html += '<p style="margin:12px 0 6px"><strong>' + regel(due) + '. ' + esc(t.vraag) + '</strong></p><p style="margin:0"><a class="button" href="' + u('ja') + '">' + esc(t.ja) + '</a> <a href="' + u('nog') + '" style="margin-left:10px">' + esc(t.nog) + '</a> <a href="' + u('niet') + '" style="margin-left:10px">' + esc(t.niet) + '</a></p>';
    knoppen.push(due.k);
  }
  html += '</div>';
  return { html, checkin: knoppen };
}
// na een gelukte verzending: de check-in als verstuurd markeren (telt mee in de proef)
export async function markeer(site, id, ks) {
  if (!ks || !ks.length) return; const r = await kv.get('iv:' + id).catch(() => null); if (!r) return;
  for (const x of r.l) if (ks.includes(x.k) && !x.sent) { x.sent = Date.now(); await kv.raw(['INCR', 'iv:arm:' + site + ':' + x.arm + ':sent']).catch(() => null); await tel(site, 'checkin'); }
  await kv.set('iv:' + id, r, { ex: 120 * 86400 });
}

// antwoord op de check-in (knop in de mail) en daarna de vrije tekst "wat werd het"
export async function koop(tok, a, wat) {
  if (!/^[a-f0-9]{48}$/.test(tok || '')) return { ok: false };
  const p = await kv.get('iv:t:' + hash(tok)).catch(() => null); if (!p) return { ok: false };
  const r = await kv.get('iv:' + p.id).catch(() => null); const x = r && r.l.find(y => y.k === p.k); if (!x) return { ok: false };
  const site = p.site; const nu = Date.now();
  if (['ja', 'nog', 'niet'].includes(a) && !x.ant) {
    x.ant = a; x.antT = nu; await kv.raw(['INCR', 'iv:arm:' + site + ':' + x.arm + ':ant']).catch(() => null); await tel(site, 'ant_' + a);
    if (a === 'nog') { x.ant = ''; x.sent = 0; x.due = nu + 7 * 864e5; x.nog = N(x.nog) + 1; if (x.nog >= 3) x.klaar = true; }
    if (a === 'niet') x.klaar = true;
    if (a === 'ja') x.klaar = true;
    await kv.raw(['LPUSH', 'iv:koop', JSON.stringify({ t: nu, site, s: x.slug, i: { wat: x.wat, voorWie: x.voorWie, budget: x.budget, wanneer: x.wanneer }, samen: !!x.samen, arm: x.arm, dagen: Math.round((nu - x.t) / 864e5), a })]).catch(() => null);
    await kv.raw(['LTRIM', 'iv:koop', '0', '4999']).catch(() => null);
  }
  if (wat) { x.gekocht = kort(wat, 160); await tel(site, 'koop_wat'); await kv.raw(['LPUSH', 'iv:koop', JSON.stringify({ t: nu, site, s: x.slug, i: { wat: x.wat, voorWie: x.voorWie, budget: x.budget }, a: 'wat', gekocht: x.gekocht })]).catch(() => null); }
  await kv.set('iv:' + p.id, r, { ex: 120 * 86400 });
  return { ok: true, site, a, x };
}

export function koopPagina(site, tok, res) {
  const t = T[site] || T.kz;
  if (!res || !res.ok) return '<p>' + esc(t.fout) + '</p>';
  if (res.a === 'ja' && !res.x.gekocht) return '<p>' + esc(t.dank) + '</p><form method="post" action="/api/keuze-tools?tool=intentie&op=koop&t=' + esc(tok) + '&a=wat"><p><label>' + esc(t.wat) + '<br><input name="wat" maxlength="160" style="width:100%;font-size:16px;padding:10px;border:1px solid #d6d3d1;border-radius:10px" placeholder="' + esc(t.watPh) + '"></label></p><p><button class="button" type="submit">' + esc(t.stuur) + '</button></p></form>';
  if (res.a === 'nog') return '<p>' + esc(t.nogT) + '</p>';
  if (res.a === 'niet') return '<p>' + esc(t.nietT) + '</p>';
  return '<p>' + esc(t.klaar) + '</p>';
}

// stand voor het uuroverzicht en de overdracht: tellers per dag en de proef; met vol ook de laatste antwoorden
export async function volgStand(vol) {
  const paren = h => { if (!h) return {}; if (!Array.isArray(h)) return h; const o = {}; for (let i = 0; i + 1 < h.length; i += 2) o[String(h[i])] = N(h[i + 1]); return o; };
  const dagen = []; for (let i = 0; i < 7; i++) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); dagen.push({ dag: d, ...paren(await kv.raw(['HGETALL', 'iv:d:' + d]).catch(() => null)) }); }
  const proef = {}; for (const s of ['kz', 'us', 'de']) { proef[s] = {}; for (const a of ARMEN) { const [se, an] = await kv.mget('iv:arm:' + s + ':' + a + ':sent', 'iv:arm:' + s + ':' + a + ':ant').catch(() => [0, 0]); proef[s]['na ' + a + ' dagen'] = { verstuurd: N(se), antwoord: N(an) }; } }
  const uit = { ok: true, dagen, proef };
  if (vol) uit.antwoorden = ((await kv.raw(['LRANGE', 'iv:koop', '0', '49']).catch(() => [])) || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean);
  return uit;
}
