// Affiliatelinks buiten bol en Amazon, met ons eigen klik-ID (20 nov 2026, Henkjan: "Hebben we alle affiliate links nu toegevoegd die we hebben
// met postback ? ... moeten we wel op orde brengen"). Eén doorstuurlink voor alle netwerken: /api/keuze-tools?tool=aff&p=<programma>&s=<pagina>
// legt de klik vast (aff:k:<id>, 60 dagen) en stuurt door met het klik-ID als subId1 (impact) of clickref (Awin). Een verkoop komt terug via
// op=pb (terugmeld-URL die in impact of Awin wordt ingesteld, met de sleutel AFF_PB_KEY) en wordt aan de klik en de pagina gekoppeld.
// Alleen programma's waar we echt zijn toegelaten (gecontroleerd 20 nov 2026 met impact create_tracking_links). Stand: op=stand.
import { randomBytes } from 'node:crypto';
import { kv } from './db.js';

export const PROG = {
  'jackery-nl': { net: 'impact', merk: 'Jackery', land: 'nl', base: 'https://itjackery.pxf.io/c/3526280/1762660/20686', dom: /(^|\.)jackery\.com$/ },
  'anker-nl': { net: 'impact', merk: 'Anker SOLIX', land: 'nl', base: 'https://ankersolixnl.sjv.io/c/3526280/3085409/37985', dom: /(^|\.)ankersolix\.com$|(^|\.)anker\.com$/ },
  'bluetti-us': { net: 'impact', merk: 'BLUETTI', land: 'us', base: 'https://bluettius.sjv.io/c/3526280/1439830/17108', dom: /(^|\.)bluettipower\.com$|(^|\.)bluetti\.com$/ },
  'bluetti-de': { net: 'impact', merk: 'BLUETTI', land: 'de', base: 'https://bluettide.pxf.io/c/3526280/1438169/17092', dom: /(^|\.)bluettipower\.eu$|(^|\.)bluetti\.(de|eu|com)$/ },
  'zendure-de': { net: 'impact', merk: 'Zendure', land: 'de', base: 'https://zenduredegmbh.sjv.io/c/3526280/2853098/33101', dom: /(^|\.)zendure\.(de|com)$/ },
  'ecovacs-us': { net: 'impact', merk: 'ECOVACS', land: 'us', base: 'https://ecovacsroboticsinc.pxf.io/c/3526280/4028379/57598', dom: /(^|\.)amazon\.com$/ },
  // Awin (publisher AdsFair B.V. 3159915), toegelaten volgens de mails van Awin (18 tot 20 nov 2026)
  'coolblue-nl': { net: 'awin', merk: 'Coolblue', land: 'nl', base: 'https://www.awin1.com/cread.php?awinmid=85161&awinaffid=3159915', dom: /(^|\.)coolblue\.(nl|be)$/ },
  'tplink-nl': { net: 'awin', merk: 'TP-Link', land: 'nl', base: 'https://www.awin1.com/cread.php?awinmid=120541&awinaffid=3159915', dom: /(^|\.)tp-link\.com$/ },
  'narwal-eu': { net: 'awin', merk: 'Narwal', land: 'nl', base: 'https://www.awin1.com/cread.php?awinmid=131578&awinaffid=3159915', dom: /(^|\.)narwal\.com$|(^|\.)narwal\.(eu|nl|de)$/ },
  'allpowers-nl': { net: 'awin', merk: 'ALLPOWERS', land: 'nl', base: 'https://www.awin1.com/cread.php?awinmid=125964&awinaffid=3159915', dom: /(^|\.)allpowers\.(com|nl|eu)$/ },
  'partypro-nl': { net: 'awin', merk: 'PartyPro', land: 'nl', base: 'https://www.awin1.com/cread.php?awinmid=102231&awinaffid=3159915', dom: /(^|\.)partypro\.nl$/ },
  'yeedi-us': { net: 'impact', merk: 'yeedi', land: 'us', base: 'https://yeediamazonsellerus.pxf.io/c/3526280/4028859/57605', dom: /(^|\.)amazon\.com$/ },
};
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const dag = () => new Date().toISOString().slice(0, 10);
const kort = (t, n) => String(t == null ? '' : t).replace(/[^\w\-./:]/g, '').slice(0, n);

// link voor op de pagina (relatief, werkt op keuzehulp.best, whichtobuy.best en kaufberater.best)
export const affLink = (p, slug, u) => '/api/keuze-tools?tool=aff&p=' + encodeURIComponent(p) + '&s=' + encodeURIComponent(String(slug || '').slice(0, 80)) + (u ? '&u=' + encodeURIComponent(u) : '');

export async function klik({ p, s, u, mmc, ua, host }) {
  const pr = PROG[p]; if (!pr) return null;
  let doel = '';
  if (u) { try { const x = new URL(String(u)); if (x.protocol === 'https:' && pr.dom.test(x.hostname)) doel = x.toString(); } catch (e) {} }
  const id = randomBytes(6).toString('hex'), slug = kort(s, 80);
  await kv.raw(['SET', 'aff:k:' + id, JSON.stringify({ p, s: slug, t: Date.now(), host: kort(host, 40), mmc: kort(mmc, 40), bot: /bot|crawl|spider|preview|headless/i.test(String(ua || '')) ? 1 : 0 }), 'EX', String(60 * 86400)]).catch(() => null);
  await kv.raw(['HINCRBY', 'aff:d:' + dag(), p + ':klik', '1']).catch(() => null); await kv.raw(['HINCRBY', 'aff:d:' + dag(), p + '|' + slug + ':klik', '1']).catch(() => null); await kv.raw(['EXPIRE', 'aff:d:' + dag(), String(120 * 86400)]).catch(() => null);
  const q = pr.net === 'impact' ? 'subId1=' + id + '&subId2=' + encodeURIComponent(slug) + (doel ? '&u=' + encodeURIComponent(doel) : '') : 'clickref=' + id + (doel ? '&ued=' + encodeURIComponent(doel) : '');
  return pr.base + (pr.base.includes('?') ? '&' : '?') + q;
}

// terugmelding van een netwerk: koppelt de verkoop aan klik, pagina en programma (dubbel = één keer, op actie-ID)
export async function terug({ key, net, sub, bedrag, commissie, actie, status }) {
  if (!process.env.AFF_PB_KEY || key !== process.env.AFF_PB_KEY) return { ok: false, fout: 'sleutel' };
  const id = kort(sub, 24), aid = kort(actie || sub + ':' + bedrag, 60);
  const nieuw = await kv.raw(['SET', 'aff:a:' + aid, '1', 'NX', 'EX', String(400 * 86400)]).catch(() => null); if (nieuw !== 'OK') return { ok: true, dubbel: true };
  let k = null; try { k = JSON.parse((await kv.raw(['GET', 'aff:k:' + id])) || 'null'); } catch (e) {}
  const rij = { t: Date.now(), net: kort(net, 12), id, p: k ? k.p : '', s: k ? k.s : '', mmc: k ? k.mmc : '', bedrag: N(bedrag), commissie: N(commissie), status: kort(status, 20) };
  await kv.raw(['LPUSH', 'aff:conv', JSON.stringify(rij)]).catch(() => null); await kv.raw(['LTRIM', 'aff:conv', '0', '999']).catch(() => null);
  await kv.raw(['HINCRBY', 'aff:d:' + dag(), (rij.p || 'onbekend') + ':verkoop', '1']).catch(() => null);
  await kv.raw(['HINCRBYFLOAT', 'aff:d:' + dag(), (rij.p || 'onbekend') + ':commissie', String(rij.commissie)]).catch(() => null);
  return { ok: true, gekoppeld: !!k };
}

export async function stand() {
  const dagen = [];
  for (let i = 0; i < 14; i++) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); const r = await kv.raw(['HGETALL', 'aff:d:' + d]).catch(() => null); const o = {}; if (Array.isArray(r)) for (let j = 0; j + 1 < r.length; j += 2) o[r[j]] = N(r[j + 1]); else if (r) Object.entries(r).forEach(([a, b]) => { o[a] = N(b); }); if (Object.keys(o).length) dagen.push({ dag: d, ...o }); }
  const conv = ((await kv.raw(['LRANGE', 'aff:conv', '0', '49']).catch(() => [])) || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean);
  return { ok: true, programmas: Object.fromEntries(Object.entries(PROG).map(([k, v]) => [k, { net: v.net, merk: v.merk, land: v.land }])), terugmelden: !!process.env.AFF_PB_KEY, dagen, verkopen: conv };
}

// blok "direct bij de fabrikant" voor whichtobuy.best en kaufberater.best (it.hersteller = ['zendure-de', ...])
const HT = { de: { kop: 'Direkt beim Hersteller', noot: 'Werbelink: Kaufst du dort, bekommen wir eine Provision. Der Preis bleibt gleich.', shop: m => m + ' Shop' },
  us: { kop: 'Buy direct from the maker', noot: 'Affiliate link: if you buy there we may earn a commission, at no cost to you.', shop: m => m + ' store' },
  nl: { kop: 'Direct bij de fabrikant', noot: 'Advertentielink: koop je daar, dan krijgen wij een vergoeding. De prijs blijft hetzelfde.', shop: m => 'Webshop van ' + m } };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function herstellerBlok(taal, slug, lijst) {
  const t = HT[taal] || HT.us, l = (lijst || []).filter(p => PROG[p]); if (!l.length) return '';
  return '<div class="box"><h2>' + esc(t.kop) + '</h2><div class="kz-pills">' + l.map(p => '<a class="pill" data-aff="' + esc(p) + '" rel="sponsored nofollow noopener" target="_blank" href="' + esc(affLink(p, slug)) + '">' + esc(t.shop(PROG[p].merk)) + ' →</a>').join(' ') + '</div><p class="kz-meta">' + esc(t.noot) + '</p></div>';
}
