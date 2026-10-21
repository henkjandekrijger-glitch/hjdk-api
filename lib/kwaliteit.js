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

export async function kwaliteitRonde(id, host, its, rs, beschermd = new Set()) { // rs = paginatotalen over 90 dagen (lib/gsc.js pageRows)
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
  // eerder uitgesloten pagina's blijven uit, tenzij ze sindsdien zijn bijgewerkt of nu wel vertoningen hebben
  for (const [s, d] of Object.entries(oud.dun || {})) { const it = bySlug[s]; if (!it || !vrij(s) || imp(s) > 0 || d.regel !== 2) continue; if (it.updatedAt && it.updatedAt > d.dag) continue; dun[s] = d; }
  // (1) gelezen en niet opgenomen
  for (const it of its) { const s = it.slug; if (dun[s] || !vrij(s) || imp(s) > 0) continue; if (String(it.publishAt || '2000-01-01') > grens) continue; if (GELEZEN_NIET.test(staat(s))) dun[s] = { dag: vandaag, reden: 'gelezen-niet-opgenomen', regel: 2 }; }
  // (2) dubbel onderwerp: zelfde zoekterm
  // alleen echt dubbel: zelfde zoekterm én (bijna) dezelfde woorden in het adres (wasmachine / wasmachine-kiezen), niet laptop / laptop-school of cadeaus voor verschillende mensen
  const STOP = new Set(['kiezen', 'kopen', 'beste', 'best', 'welke', 'de', 'het', 'een', 'voor', 'van', 'met', 'en', 'the', 'for', 'and', 'kaufen', 'der', 'die', 'das', 'fur', 'und', '2026', '2027']);
  const woorden = i => new Set(norm(i.slug).split(' ').filter(w => w && !STOP.has(w)));
  const lijkt = (a, b) => { const A = woorden(a), B = woorden(b); const n = [...A].filter(w => B.has(w)).length; return n / Math.max(1, new Set([...A, ...B]).size); };
  const perTerm = {}; its.forEach(i => { const t = norm(i.term); if (t.length >= 3 && !i.slug.includes('/')) (perTerm[t] = perTerm[t] || []).push(i); });
  for (const groep of Object.values(perTerm)) { if (groep.length < 2) continue;
    const best = groep.slice().sort((a, b) => imp(b.slug) - imp(a.slug) || (GELEZEN_NIET.test(staat(a.slug)) ? 1 : 0) - (GELEZEN_NIET.test(staat(b.slug)) ? 1 : 0) || String(a.publishAt || '').localeCompare(String(b.publishAt || '')))[0];
    groep.forEach(i => { if (i.slug !== best.slug && vrij(i.slug) && imp(i.slug) === 0 && !dun[i.slug] && lijkt(i, best) >= 0.99) dun[i.slug] = { dag: vandaag, reden: 'dubbel', naar: best.slug, regel: 2 }; }); }
  // nooit meer dan 30% uitsluiten: de oudste besluiten blijven
  const max = Math.floor(its.length * 0.3); const lijst = Object.entries(dun).sort((a, b) => a[1].dag.localeCompare(b[1].dag)).slice(0, max);
  const dunUit = Object.fromEntries(lijst);
  const wacht = its.filter(i => !dunUit[i.slug] && !sterk.includes(i.slug) && (NOG_NIET.test(staat(i.slug)) || !staat(i.slug))).sort((a, b) => String(a.publishAt || '').localeCompare(String(b.publishAt || ''))).map(i => i.slug).slice(0, 80);
  const uit = { dag: vandaag, site: id, sterk, wacht, dun: dunUit, telling: { paginas: its.length, sterk: sterk.length, wacht: wacht.length, dun: Object.keys(dunUit).length, gelezenNiet: Object.values(dunUit).filter(d => d.reden === 'gelezen-niet-opgenomen').length, dubbel: Object.values(dunUit).filter(d => d.reden === 'dubbel').length, indexBekend: Object.keys(map).length } };
  await kv.set('hjdk:kw:' + id, uit);
  return uit.telling;
}

// lezen met 10 minuten geheugen per proces
const C = {};
export async function kwaliteit(id) { const c = C[id]; if (c && Date.now() - c.t < 600000) return c.v; let v = null; try { v = await kv.get('hjdk:kw:' + id); } catch {} v = v || { sterk: [], wacht: [], dun: {} }; C[id] = { t: Date.now(), v }; return v; }
