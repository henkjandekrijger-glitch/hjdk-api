// Uitkomsten terug naar de klik (Henkjan 27 nov 2026: "Ja bouw 3"; gebouwd 28 nov 2026): Kadoly-bestellingen, gelezen en geklikte Mailmind-mail en
// Amazon-bestellingen komen bij de klik en zijn zone, zodat het model (lib/vmodel.js) koper tegen kijker leert. Alles blijft binnen Clickmind:
// er gaat niets naar een advertentienetwerk (geen postback, ook niet via uitkomst(): die loopt hier met binnen:true) en niets per klik naar Amazon.
// Opslag: mm:vfl:<cid> (voorspellers van een klik die al een aanmelding had, 30 d, alleen die klikken), mm:ut:<dag> (controle per bron, 14 d, een handvol velden),
// mm:zamz:<dag> (Amazon per zone, zwak bewijs, 40 d, hoogstens 60 zones per tag).
import { uitkomst } from './wissel.js';
import { telCmds, vfLees } from './voorspel.js';
import { TAG_ALIAS } from './mensmeter.js';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const dagStr = (o = 0) => new Date(Date.now() + o * 864e5).toISOString().slice(0, 10);
const CID = /^[0-9a-f]{8,24}$/;
export const BRONNEN = ['kadoly', 'mailopen', 'mailklik', 'amazon'];
const MAILSOORT = { open: 'mailopen', mailopen: 'mailopen', mailklik: 'mailklik', bevestigd: 'mailklik' }; // bevestigd = de lezer klikte of antwoordde ja op de mail (lib/mailmind.js zegJa)

// controle: per bron en dag hoeveel uitkomsten bij een klik kwamen (ok) en hoeveel niet en waarom (niet_<reden>)
export async function utTel(kv, bron, veld, n = 1) { try { const k = 'mm:ut:' + dagStr(); await kv.raw(['HINCRBY', k, bron + '|' + veld, n]); await kv.raw(['EXPIRE', k, 14 * 86400]); } catch (e) {} }

// voorspellers van een klik langer bewaren dan de 30 uur van mm:vf: alleen als die klik een aanmelding kreeg (een abonnee leest en klikt dagen later)
// of een verkoop; k = het klikrecord (een modal-beslissing verwijst met 'van' naar de advertentieklik waar de voorspellers bij horen)
export async function vfBewaar(kv, cid, k) {
  if (!CID.test(String(cid || ''))) return false;
  if (N(await kv.raw(['EXISTS', 'mm:vfl:' + cid]).catch(() => 0)) > 0) return true;
  // veld o = de omgevingsvoorspellers (koopkracht, weer, daglicht; lib/omgeving.js), enkele seconden na de klik geschreven
  let r = await kv.raw(['HMGET', 'mm:vf:' + cid, 'a', 'b', 't', 'o']).catch(() => null);
  if ((!r || !(r[0] || r[1])) && k && CID.test(String(k.van || ''))) r = await kv.raw(['HMGET', 'mm:vf:' + k.van, 'a', 'b', 't', 'o']).catch(() => null);
  if (!r || !(r[0] || r[1])) return false;
  await kv.raw(['HSET', 'mm:vfl:' + cid, 'a', r[0] || '', 'b', r[1] || '', 't', r[2] || '', 'o', r[3] || '']);
  await kv.raw(['EXPIRE', 'mm:vfl:' + cid, 30 * 86400]);
  return true;
}

// één uitkomst bij de klik: zone, campagne en persoon via uitkomst() (zonder postback en shop-lus), en de voorspellers van die klik op de dag van de klik
export async function terugNaarKlik(kv, { cid, soort, waarde, bron, tel }) {
  cid = String(cid || '');
  if (!CID.test(cid)) { await utTel(kv, tel, 'niet_geen_klik_id'); return { ok: false, fout: 'cid' }; }
  // leven de voorspellers van de klik nog (30 uur)? Kijk naar de velden zelf: een late uitkomst kan de hash opnieuw aanmaken met alleen een markering (lib/omgeving.js)
  const vfNu = await kv.raw(['HMGET', 'mm:vf:' + cid, 'a', 'b']).then(v => !!(v && (v[0] || v[1]))).catch(() => false);
  const r = await uitkomst(kv, { cid, soort, waarde, bron, binnen: true });
  if (!r.ok) { await utTel(kv, tel, /^onbekende klik/.test(String(r.fout || '')) ? 'niet_klik_verlopen' : 'niet_soort'); return r; }
  if (r.dubbel) { await utTel(kv, tel, 'dubbel'); return r; }
  await utTel(kv, tel, 'ok');
  if (!r.zone || r.zone === '-') await utTel(kv, tel, 'zonder_zone');
  // uitkomst() telt de voorspellers zelf voor koop als mm:vf nog leeft (30 uur); mailopen en mailklik kent het niet, en daarna komt alleen mm:vfl nog in beeld
  if (soort !== 'koop' || !vfNu) {
    let a = null, b = null, t = 0, o = null;
    const l = await kv.raw(['HMGET', 'mm:vfl:' + cid, 'a', 'b', 't', 'o']).catch(() => null);
    if (l && (l[0] || l[1])) { a = l[0]; b = l[1]; t = N(l[2]); o = l[3]; } else if (vfNu) { const v = await kv.raw(['HMGET', 'mm:vf:' + cid, 'a', 'b', 't', 'o']).catch(() => null); if (v) { a = v[0]; b = v[1]; t = N(v[2]); o = v[3]; } }
    if (a || b) {
      if (!t) t = N(await kv.raw(['HGET', 'mm:cid:' + cid, 't']).catch(() => 0)) || Date.now();
      await Promise.all(telCmds(new Date(t).toISOString().slice(0, 10), 'g', Object.assign(vfLees(a), vfLees(b), vfLees(o)), { [soort]: 1 }).map(x => kv.raw(x)));
      await utTel(kv, tel, 'met_voorspellers');
    } else await utTel(kv, tel, 'zonder_voorspellers');
  }
  return r;
}

// Kadoly: betaalde bestelling (fn/shop.js pxVerwerk, Stripe en PayPal komen daar binnen als w=koop) is een koop bij de klik (mmc) en zijn zone.
// Het netwerk krijgt de verkoop al van de shop zelf (pxVerwerk); hier telt hij alleen binnen Clickmind (binnen:true), anders ging het twee keer.
export async function kadolyKoop(kv, { mmc, waarde, order }) {
  if (!mmc) { await utTel(kv, 'kadoly', 'niet_geen_mmc'); return { ok: false, fout: 'geen mmc' }; }
  return terugNaarKlik(kv, { cid: mmc, soort: 'koop', waarde, bron: 'kadoly:' + String(order || 'bestelling').slice(0, 20), tel: 'kadoly' });
}

// Mailmind en eigen lijsten: de mail werd geopend of er werd op geklikt (modalUitkomst in lib/modal.js geeft de beslissing door; mid = de klik die het adres opleverde)
export async function mailTerug(kv, mid, e) {
  const soort = MAILSOORT[String(e || '')]; if (!soort) return null;
  if (!CID.test(String(mid || ''))) return null;
  return terugNaarKlik(kv, { cid: mid, soort, bron: 'mail', tel: soort });
}

// Amazon meldt per tag per dag, nooit per klik of zone. Verdeel de artikelen van een tag over de zones naar hun aandeel in de kliks op die tag
// die dag (uit de ruwe log). Zwak bewijs: apart bewaard in mm:zamz:<dag>, nooit in de koop-tellers van een zone of het model, en de Amazon-dag (Pacific) valt niet
// precies samen met de UTC-dag van de log. Nooit een postback of een klik-id richting Amazon of een netwerk.
export async function amazonNaarZone(kv, { dag, tijd = 20000 } = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dag || ''))) return { ok: false, fout: 'dag JJJJ-MM-DD' };
  const h = await kv.raw(['HGETALL', 'mm:amz:' + dag]).catch(() => null), amz = {};
  for (let i = 0; h && i < h.length; i += 2) { try { amz[String(h[i]).toLowerCase()] = JSON.parse(h[i + 1]); } catch (e) {} }
  const tags = Object.keys(amz);
  if (!tags.length) { await utTel(kv, 'amazon', 'niet_geen_cijfers'); return { ok: false, fout: 'geen Associates-cijfers voor ' + dag }; }
  const { leesRuwDag } = await import('./ruwarchief.js'), K = {};
  const r = await leesRuwDag(kv, 'raw', dag, x => { if (x.ty !== 'go' || !x.tag || !x.zone || x.zone === '-' || !x.net) return; const t = String(x.tag).toLowerCase(), tg = amz[t] ? t : TAG_ALIAS[t] ? String(TAG_ALIAS[t]).toLowerCase() : t; if (!amz[tg]) return; const m = K[tg] || (K[tg] = {}), z = x.net + '|' + x.zone; m[z] = (m[z] || 0) + 1; }, { tijd }).catch(() => ({ volledig: false }));
  const zk = 'mm:zamz:' + dag, cmd = [], uit = { tags: 0, zonder_kliks: [], zones: 0 };
  for (const tag of tags) {
    const art = N(amz[tag].artikelen), z = Object.entries(K[tag] || {}), tot = z.reduce((s, x) => s + x[1], 0);
    if (!tot) { uit.zonder_kliks.push(tag); await utTel(kv, 'amazon', 'niet_tag_zonder_kliks_in_log'); continue; }
    uit.tags++; await utTel(kv, 'amazon', 'ok');
    for (const [zn, n] of z.sort((a, b) => b[1] - a[1]).slice(0, 60)) { if (n < 3) break; cmd.push(['HSET', zk, zn + '|' + tag + '|k', n], ['HSET', zk, zn + '|' + tag + '|a', Math.round(art * n / tot * 100)]); uit.zones++; }
  }
  if (cmd.length) { cmd.push(['EXPIRE', zk, 40 * 86400]); await Promise.all(cmd.map(c => kv.raw(c))); }
  if (!r.volledig) await utTel(kv, 'amazon', 'niet_log_onvolledig');
  return { ok: true, dag, ...uit, logVolledig: !!r.volledig, zwak: true };
}
// Amazon per zone over de laatste dagen: kliks op tags met cijfers en de verwachte artikelen (a is in honderdsten)
export async function zoneAmazon(kv, dagen = 7) {
  const Z = {};
  for (let i = 0; i < dagen; i++) { const h = await kv.raw(['HGETALL', 'mm:zamz:' + dagStr(-i)]).catch(() => null); for (let j = 0; h && j + 1 < h.length; j += 2) { const p = String(h[j]).split('|'); if (p.length < 4) continue; const z = p[0] + '|' + p[1], x = Z[z] || (Z[z] = { zone: z, kliks: 0, artikelen: 0 }); if (p[3] === 'k') x.kliks += N(h[j + 1]); else x.artikelen += N(h[j + 1]) / 100; } }
  return Object.values(Z).map(x => ({ ...x, artikelen: Math.round(x.artikelen * 100) / 100, per100: x.kliks ? Math.round(x.artikelen / x.kliks * 1e4) / 100 : 0 })).sort((a, b) => b.artikelen - a.artikelen);
}

// controle: per bron vandaag hoeveel uitkomsten bij een klik kwamen en hoeveel niet (en waarom); een bron op nul staat er met naam bij
export async function terugStand(kv, dagen = 1) {
  const uit = Object.fromEntries(BRONNEN.map(b => [b, { ok: 0, dubbel: 0, niet: {}, zonder_voorspellers: 0, zonder_zone: 0 }]));
  for (let i = 0; i < dagen; i++) {
    const h = await kv.raw(['HGETALL', 'mm:ut:' + dagStr(-i)]).catch(() => null);
    for (let j = 0; h && j + 1 < h.length; j += 2) { const [b, v] = String(h[j]).split('|'), x = uit[b]; if (!x) continue; const n = N(h[j + 1]); if (v === 'ok') x.ok += n; else if (v === 'dubbel') x.dubbel += n; else if (v === 'zonder_voorspellers') x.zonder_voorspellers += n; else if (v === 'zonder_zone') x.zonder_zone += n; else if (/^niet_/.test(v)) x.niet[v.slice(5)] = n; }
  }
  return { ok: true, dagen, bronnen: uit };
}
export function terugTekst(S) {
  const R = { kadoly: 'Kadoly-koop', mailopen: 'mail geopend', mailklik: 'mail geklikt of ja', amazon: 'Amazon per tag naar zone' };
  return 'Uitkomsten terug naar de klik (' + (S.dagen === 1 ? 'vandaag' : S.dagen + ' dagen') + '):\n' + BRONNEN.map(b => { const x = S.bronnen[b], n = Object.entries(x.niet).map(([r, v]) => v + ' niet (' + r.replace(/_/g, ' ') + ')').join(', ');
    return '- ' + R[b] + ': ' + x.ok + ' bij een klik' + (x.dubbel ? ', ' + x.dubbel + ' dubbel' : '') + (n ? ', ' + n : '') + (x.zonder_voorspellers ? ', ' + x.zonder_voorspellers + ' zonder voorspellers (te oud)' : '') + (x.zonder_zone ? ', ' + x.zonder_zone + ' zonder zone' : '') + (!x.ok && !x.dubbel && !n ? ' (nog geen melding: keten staat op nul)' : ''); }).join('\n');
}
