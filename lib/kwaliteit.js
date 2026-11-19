// Kwaliteitsronde per keuzehulpsite (Henkjan 21 okt: "meer links tussen de pagina's, de beste pagina's sterker maken, de dunste pagina's uit Google houden").
// Draait elke dag na de Search Console-ronde (api/gsc.js, op=dag) en schrijft kv hjdk:kw:<site> = { dag, sterk, wacht, dun, telling }.
// - sterk: pagina's met kliks of de meeste vertoningen (positie <= 40). Elke keuzehulp linkt naar hen in "Veel gezocht".
// - wacht: pagina's die Google wel kent maar nog niet heeft gelezen of opgenomen ("Gevonden - niet geïndexeerd", "onbekend").
//   Die krijgen extra links vanuit verwante keuzehulpen in dezelfde categorie, zodat Google ze sneller leest.
// - dun: (1) Google las de pagina en nam hem niet op ("Gecrawld - momenteel niet geïndexeerd"), 90 dagen geen enkele vertoning (paginatotalen, ook anonieme zoekvragen), ouder dan 21 dagen:
//   noindex,follow en uit de sitemap. (2) Dubbel onderwerp (zelfde zoekterm): de zwakste krijgt een canonical naar de sterkste en gaat uit de sitemap.
//   Een pagina komt terug zodra hij is bijgewerkt (updatedAt na de dag van uitsluiten). Hooguit 30% van de pagina's, nooit een sterke of een pagina in een lopende proef.
import { kv } from './db.js';

const DAG = () => new Date().toISOString().slice(0, 10);
const norm = x => String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const GELEZEN_NIET = /crawled.*not indexed|gecrawld.*niet ge/i;
const NOG_NIET = /discovered.*not indexed|gevonden.*niet ge|unknown to google|onbekend bij google/i;

export async function kwaliteitRonde(id, host, its, rs, beschermd = new Set(), opt = {}) { // rs = paginatotalen over 90 dagen (lib/gsc.js pageRows); opt.qrows = pagina x zoekvraag over 28 dagen (lib/gsc.js rows), opt.proef = niets opslaan
  const pad = u => { try { return new URL(u).pathname.replace(/^\/(keuzehulp\/)?/, '').replace(/\/$/, ''); } catch { return ''; } };
  const P = {}; (rs || []).forEach(r => { const s = pad(r.page); const x = P[s] || (P[s] = { imp: 0, clicks: 0, posW: 0 }); x.imp += r.imp; x.clicks += r.clicks; x.posW += r.pos * r.imp; });
  const imp = s => (P[s] || {}).imp || 0, pos = s => P[s] && P[s].imp ? P[s].posW / P[s].imp : 99;
  const slugs = new Set(its.map(i => i.slug));
  const sterk = Object.keys(P).filter(s => slugs.has(s) && (P[s].clicks > 0 || pos(s) <= 40)).sort((a, b) => P[b].clicks - P[a].clicks || P[b].imp - P[a].imp).slice(0, 8);
  const map = (await kv.get('hjdk:gsc:index:' + id + ':map').catch(() => null)) || {};
  const oud = (await kv.get('hjdk:kw:' + id).catch(() => null)) || {};
  const staat = s => { const m = map['https://' + host + '/' + s]; return m ? String(m.s || m.v || '') : ''; };
  const bySlug = Object.fromEntries(its.map(i => [i.slug, i]));
  const vandaag = DAG(), grens = new Date(Date.now() - 21 * 864e5).toISOString().slice(0, 10);
  // Curaçao en andere meertalige pagina's (slug met /) vallen erbuiten: zelfde onderwerp in een andere taal is geen dubbel
  const vrij = s => !s.includes('/') && !/curacao|curazao/.test(s) && !sterk.includes(s) && !beschermd.has('https://' + host + '/' + s);
  const dun = {};
  // 16 nov 2026 (ZICHT-dagcontrole): seizoenspagina's niet uit Google halen voor hun piek. Google neemt een pagina zonder vraag vaak nog niet op
  // ('Gecrawld - niet geïndexeerd'); kaufberater had zo cyber-monday-2026 (1 nov), raclette-fondue-set-silvester-2026 en tien kerstcadeaupagina's
  // op noindex staan, weken voor de vraag komt. Regel 1 slaat ze over zolang hun seizoen loopt; dubbel en kannibaal gelden wel. Proef seizoen-niet-dun-1116.
  const sz = seizoen(vandaag);
  // eerder uitgesloten pagina's blijven uit, tenzij ze sindsdien zijn bijgewerkt of nu wel vertoningen hebben
  for (const [s, d] of Object.entries(oud.dun || {})) { const it = bySlug[s]; if (!it || !vrij(s) || imp(s) > 0 || d.regel !== 2) continue; if (it.updatedAt && it.updatedAt > d.dag) continue; if (d.reden === 'gelezen-niet-opgenomen' && sz(it)) continue; dun[s] = d; }
  // (1) gelezen en niet opgenomen
  for (const it of its) { const s = it.slug; if (dun[s] || !vrij(s) || imp(s) > 0 || sz(it)) continue; if (String(it.publishAt || '2000-01-01') > grens) continue; if (GELEZEN_NIET.test(staat(s))) dun[s] = { dag: vandaag, reden: 'gelezen-niet-opgenomen', regel: 2 }; }
  // (2) dubbel onderwerp: zelfde zoekterm
  // alleen echt dubbel: zelfde zoekterm én (bijna) dezelfde woorden in het adres (wasmachine / wasmachine-kiezen), niet laptop / laptop-school of cadeaus voor verschillende mensen
  const STOP = new Set(['kiezen', 'kopen', 'beste', 'best', 'welke', 'de', 'het', 'een', 'voor', 'van', 'met', 'en', 'the', 'for', 'and', 'kaufen', 'der', 'die', 'das', 'fur', 'und', '2026', '2027']);
  const woorden = i => new Set(norm(i.slug).split(' ').filter(w => w && !STOP.has(w)));
  const lijkt = (a, b) => { const A = woorden(a), B = woorden(b); const n = [...A].filter(w => B.has(w)).length; return n / Math.max(1, new Set([...A, ...B]).size); };
  const perTerm = {}; its.forEach(i => { const t = norm(i.term); if (t.length >= 3 && !i.slug.includes('/')) (perTerm[t] = perTerm[t] || []).push(i); });
  for (const groep of Object.values(perTerm)) { if (groep.length < 2) continue;
    const best = groep.slice().sort((a, b) => imp(b.slug) - imp(a.slug) || (GELEZEN_NIET.test(staat(a.slug)) ? 1 : 0) - (GELEZEN_NIET.test(staat(b.slug)) ? 1 : 0) || String(a.publishAt || '').localeCompare(String(b.publishAt || '')))[0];
    groep.forEach(i => { if (i.slug !== best.slug && vrij(i.slug) && imp(i.slug) === 0 && !dun[i.slug] && lijkt(i, best) >= 0.99) dun[i.slug] = { dag: vandaag, reden: 'dubbel', naar: best.slug, regel: 2 }; }); }
  // (2c) 19 nov 2026 (onderzoek vindbaarheid: kinderfiets-20-inch-24-inch-kiezen naast kinderfiets-24-inch-20-inch-kiezen): dezelfde woorden in een andere volgorde,
  // zelfde categorie, ook bij een andere zoekterm: de zwakste (0 vertoningen) is een dubbel van de sterkste. Doublures zijn een doorway-signaal voor Google.
  { const perW = {}; its.forEach(i => { if (i.slug.includes('/')) return; const k = [...woorden(i)].sort().join(' '); if (k.split(' ').length >= 2) (perW[k] = perW[k] || []).push(i); });
    for (const g of Object.values(perW)) { if (g.length < 2) continue; const best = g.slice().sort((a, b) => imp(b.slug) - imp(a.slug) || String(a.publishAt || '').localeCompare(String(b.publishAt || '')))[0];
      g.forEach(i => { if (i.slug !== best.slug && i.cat === best.cat && vrij(i.slug) && imp(i.slug) === 0 && !dun[i.slug]) dun[i.slug] = { dag: vandaag, reden: 'dubbel', via: 'woorden', naar: best.slug, regel: 2 }; }); } }
  // (2b) 15 nov 2026 (ZICHT-dagcontrole): Google geeft de zoekterm van een pagina al aan een andere eigen pagina (strijkplank-kleine-ruimte heeft 0 vertoningen,
  // terwijl /strijkplank op 'strijkplank kleine ruimte' op plek 11 staat). Dan is de zwakke pagina een dubbel: canonical naar de pagina die Google kiest, uit de sitemap.
  // Voorwaarden: zwakke pagina 0 vertoningen in 90 dagen, ouder dan 21 dagen, zelfde categorie, zijn zoekterm staat letterlijk in de zoekvragen van de sterke pagina, of beide hebben dezelfde zoekterm en de woorden van zijn adres vormen samen een zoekvraag van de sterke pagina. Proef kz-dubbel-zoekvraag-1115.
  if (Array.isArray(opt.qrows) && opt.qrows.length) {
    const QS = {}; opt.qrows.forEach(r => { const s = pad(r.page); if (!bySlug[s] || s.includes('/')) return; (QS[s] = QS[s] || new Set()).add(norm(r.q)); });
    if (opt.proef && opt.kijk) opt.twee = [Object.keys(QS).length + ' paginas met zoekvragen', ...its.filter(i => i.slug.startsWith(opt.kijk)).map(i => i.slug + ' term=' + i.term + ' cat=' + i.cat + ' imp=' + imp(i.slug) + ' q=' + [...(QS[i.slug] || [])].slice(0, 6).join('|'))];
    // zelfde zoekterm als de sterke pagina en alle woorden van het adres staan samen in één zoekvraag van de sterke pagina (strijkplank-kleine-ruimte en 'strijkplank kleine ruimte')
    const dekt = (x, it, t) => QS[x].has(t) || (norm(bySlug[x].term) === t && (() => { const W = [...woorden(it)]; return W.length >= 2 && [...QS[x]].some(q => { const Q2 = new Set(q.split(' ')); return W.every(w => Q2.has(w)); }); })());
    for (const it of its) { const s = it.slug, t = norm(it.term);
      if (opt.proef && t.length >= 3 && imp(s) === 0) { const bij = Object.keys(QS).filter(x => x !== s && dekt(x, it, t)); if (bij.length) (opt.twee = opt.twee || []).push(s + ' -> ' + bij.join(',') + (dun[s] ? ' (al uit)' : !vrij(s) ? ' (beschermd of sterk)' : String(it.publishAt || '2000-01-01') > grens ? ' (jonger dan 21 dagen)' : bij.some(x => bySlug[x].cat === it.cat) ? '' : ' (andere categorie)')); }
      if (t.length < 3 || dun[s] || !vrij(s) || imp(s) > 0 || String(it.publishAt || '2000-01-01') > grens) continue;
      const naar = Object.keys(QS).filter(x => x !== s && dekt(x, it, t) && bySlug[x].cat === it.cat && !dun[x]).sort((a, b) => imp(b) - imp(a))[0];
      if (naar) dun[s] = { dag: vandaag, reden: 'dubbel', via: 'zoekvraag', naar, regel: 2 }; } }
  // (3) kannibalisatie (14 nov 2026, Henkjan: "hoe ga je dat verbeteren? Aan het werk"): twee eigen pagina's die Google voor dezelfde zoekvragen toont,
  // delen hun signalen en blijven allebei op pagina 2 tot 5 hangen (strijkplank had er vier). De zwakste op die gedeelde zoekvragen (vertoningen gewogen naar positie)
  // gaat met een 301 naar de sterkste (api/kz.js; whichtobuy en kaufberater: canonical). Voorwaarden: zelfde categorie, minstens 2 gedeelde zoekvragen,
  // de gedeelde zoekvragen zijn minstens de helft van de vertoningen van de zwakste, de zwakste had 0 kliks in 90 dagen, geen ketens.
  // Een besluit blijft staan (na de 301 verdwijnt de overlap vanzelf uit Search Console), tot de pagina wordt bijgewerkt of het doel verdwijnt.
  const kannibaal = [];
  for (const [s, d] of Object.entries(oud.dun || {})) { const it = bySlug[s]; if (d.regel !== 3 || dun[s] || !it || !bySlug[d.naar] || (P[s] || {}).clicks > 0) continue; if (it.updatedAt && it.updatedAt > d.dag) continue; dun[s] = d; }
  if (Array.isArray(opt.qrows) && opt.qrows.length) {
    const Q = {}; opt.qrows.forEach(r => { const s = pad(r.page); if (!bySlug[s] || s.includes('/')) return; const k = norm(r.q); const x = (Q[s] = Q[s] || {}); x[k] = { imp: (x[k] ? x[k].imp : 0) + r.imp, pos: r.pos }; });
    const tot = s => Object.values(Q[s] || {}).reduce((t, x) => t + x.imp, 0);
    const kand = Object.keys(Q); const paren = [];
    for (let i = 0; i < kand.length; i++) for (let j = i + 1; j < kand.length; j++) { const a = kand[i], b = kand[j];
      const gedeeld = Object.keys(Q[a]).filter(q => Q[b][q]); if (gedeeld.length && opt.proef) (opt.overlap = opt.overlap || []).push(a + ' + ' + b + ': ' + gedeeld.slice(0, 3).join(', ') + (bySlug[a].cat !== bySlug[b].cat ? ' (andere categorie)' : '')); if (gedeeld.length < 2 || bySlug[a].cat !== bySlug[b].cat) continue;
      const sc = s => gedeeld.reduce((t, q) => t + Q[s][q].imp * (100 - Math.min(99, Q[s][q].pos)), 0);
      const [S, W] = sc(a) >= sc(b) ? [a, b] : [b, a]; const deel = gedeeld.reduce((t, q) => t + Q[W][q].imp, 0) / Math.max(1, tot(W));
      if (deel >= 0.5) paren.push({ naar: S, van: W, gedeeld: gedeeld.length, deel: Math.round(deel * 100), voorbeeld: gedeeld.slice(0, 4) }); }
    paren.sort((x, y) => y.gedeeld - x.gedeeld);
    for (const p of paren) { if (!vrij(p.van) || dun[p.van] || dun[p.naar] || (P[p.van] || {}).clicks > 0) continue; if (Object.values(dun).some(d => d.naar === p.van)) continue;
      dun[p.van] = { dag: vandaag, reden: 'kannibaal', naar: p.naar, regel: 3, gedeeld: p.gedeeld }; kannibaal.push(p); }
  }
  // nooit meer dan 30% uitsluiten: de oudste besluiten blijven
  const max = Math.floor(its.length * 0.3); const lijst = Object.entries(dun).sort((a, b) => a[1].dag.localeCompare(b[1].dag)).slice(0, max);
  const dunUit = Object.fromEntries(lijst);
  const wacht = its.filter(i => !dunUit[i.slug] && !sterk.includes(i.slug) && (NOG_NIET.test(staat(i.slug)) || !staat(i.slug))).sort((a, b) => String(a.publishAt || '').localeCompare(String(b.publishAt || ''))).map(i => i.slug).slice(0, 80);
  const uit = { dag: vandaag, site: id, sterk, wacht, dun: dunUit, telling: { paginas: its.length, sterk: sterk.length, wacht: wacht.length, dun: Object.keys(dunUit).length, gelezenNiet: Object.values(dunUit).filter(d => d.reden === 'gelezen-niet-opgenomen').length, dubbel: Object.values(dunUit).filter(d => d.reden === 'dubbel').length, kannibaal: Object.values(dunUit).filter(d => d.reden === 'kannibaal').length, indexBekend: Object.keys(map).length } };
  if (opt.proef) return Object.assign({}, uit.telling, { nieuwKannibaal: kannibaal, alleKannibaal: Object.entries(dunUit).filter(([, d]) => d.reden === 'kannibaal').map(([s, d]) => s + ' -> ' + d.naar), zoekvraagRijen: (opt.qrows || []).length, dubbelViaZoekvraag: (opt.twee || []).slice(0, 40), overlap: (opt.overlap || []).slice(0, 40) });
  await kv.set('hjdk:kw:' + id, uit);
  return Object.assign({}, uit.telling, kannibaal.length ? { nieuwKannibaal: kannibaal.map(p => p.van + ' -> ' + p.naar) } : {});
}

// seizoenen (maand-dag, van tot en met; over de jaarwisseling mag): adres of zoekterm met een van deze woorden is in seizoen
const SEIZOENEN = [
  { re: /halloween/, van: '08-15', tot: '11-01' },
  { re: /kerst|weihnacht|christmas|xmas|advent|nikolaus|sinterklaas|schoencadeau|wichtel|stocking|geschenk|cadeau|gift|black friday|cyber monday|thanksgiving|silvester|oud en nieuw|new year|oliebol|gourmet|raclette|fondue/, van: '09-01', tot: '01-07' },
];
export function seizoen(dag = DAG()) { const md = String(dag).slice(5, 10);
  const loopt = s => s.van <= s.tot ? md >= s.van && md <= s.tot : md >= s.van || md <= s.tot;
  const actief = SEIZOENEN.filter(loopt); return it => { const t = norm((it && it.slug) + ' ' + (it && it.term)); return actief.some(s => s.re.test(t)); }; }

// lezen met 10 minuten geheugen per proces
const C = {};
export async function kwaliteit(id) { const c = C[id]; if (c && Date.now() - c.t < 600000) return c.v; let v = null; try { v = await kv.get('hjdk:kw:' + id); } catch {} v = v || { sterk: [], wacht: [], dun: {} }; C[id] = { t: Date.now(), v }; return v; }
