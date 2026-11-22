// Gegevenskwaliteit van de hele bedrijvengids. Een importdatum is geen broncontrole.
import { createHash } from 'node:crypto';
export const DAGEN = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const normNaam = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/cura[cç]ao/g, '').replace(/[^a-z0-9]/g, '');
export const identiteit = x => x.place_id ? 'p:' + x.place_id : x.cid ? 'c:' + x.cid : 'n:' + normNaam(x.naam) + '|' + normNaam(x.adres);
export const bronDatum = x => String(x.bronDatum || x.bijgewerkt || '').slice(0, 10).match(/^\d{4}-\d{2}-\d{2}$/)?.[0] || null;
export const eigenSite = u => { try { return /(^|\.)(curacao\.day|todayin\.email|keuzehulp\.best|whichtobuy\.best|kaufberater\.best)$/.test(new URL(u).hostname); } catch { return false; } };
export function siteVeilig(u) { if (!u) return null; try { const x = new URL(String(u).trim()); return /^https?:$/.test(x.protocol) ? x.href : null; } catch { return null; } }
export function naamNetjes(s) {
  s = String(s || '').trim().replace(/\s+/g, ' '); const letters = s.replace(/[^\p{L}]/gu, '');
  if (!letters || (letters !== letters.toUpperCase() && letters !== letters.toLowerCase())) return s;
  const klein = new Set(['de', 'het', 'een', 'van', 'en', 'the', 'and', 'of', 'del', 'di', 'da']);
  const afk = new Set(['KFC', 'MCB', 'ATM', 'DHL', 'CIBC', 'ABN', 'AMRO', 'NAPA', 'BBC', 'CNN', 'TUI', 'KLM', 'BV', 'NV', 'VIP']);
  return s.split(' ').map((w, i) => afk.has(w.toUpperCase()) ? w.toUpperCase() : !i || !klein.has(w.toLowerCase()) ? w.toLowerCase().replace(/(^|[-/('])(\p{L})/gu, (_, a, c) => a + c.toUpperCase()) : w.toLowerCase()).join(' ');
}
export function tijdvakken(s, bewezen24 = false) {
  const t = String(s || '').trim(); if (!t || /^(closed|gesloten|dicht|cerrado|fechado|geschlossen)$/i.test(t)) return [];
  if (/^open 24 hours$|^24\s*(uur|hours|h)$/i.test(t)) return bewezen24 ? [[0, 1440]] : [];
  const re = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[-–—]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/gi; const r = []; let m;
  while ((m = re.exec(t))) {
    const min = (h, mm, ap, eind) => { h = Number(h); mm = Number(mm || 0); if (mm > 59 || h > 24 || (h === 24 && (!eind || mm !== 0 || ap))) return null; if (ap) { if (h < 1 || h > 12) return null; h = h % 12 + (ap.toLowerCase() === 'pm' ? 12 : 0); } return h * 60 + mm; };
    const a = min(m[1], m[2], m[3], false), b = min(m[4], m[5], m[6], true);
    if (a == null || b == null || a === b || (a === 0 && b === 1440 && !bewezen24)) continue;
    r.push([a, b <= a ? b + 1440 : b]);
  }
  return r;
}
export const hm = x => x === 1440 ? '24:00' : String(Math.floor((x % 1440) / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0');
export function urenNetjes(uren, bewezen24 = false) {
  if (!uren || typeof uren !== 'object') return null; const out = {};
  for (const k of DAGEN) { const t = uren[k]; const v = tijdvakken(t, bewezen24); if (v.length) out[k] = v.map(([a, b]) => hm(a) + '-' + hm(b)).join(', '); else if (/^(closed|gesloten|dicht|cerrado|fechado|geschlossen)$/i.test(String(t || '').trim()) || t === '') out[k] = 'closed'; }
  return Object.values(out).some(v => v !== 'closed') ? out : null;
}
export function normaliseerBedrijf(x, bewijs = null) {
  if (!x) return x;
  const y = { ...x, naam: naamNetjes(x.naam), site: siteVeilig(x.site), bronDatum: bronDatum(x) };
  const sluiting = /closed_forever|temporarily_closed/.test(String(x.status || ''));
  const bevestigd = bewijs && bewijs.datum && bewijs.url && bewijs.velden;
  if (bevestigd) { Object.assign(y, bewijs.velden); y.veldBron = { ...(x.veldBron || {}) }; for (const k of Object.keys(bewijs.velden)) y.veldBron[k] = { url: bewijs.url, datum: bewijs.datum }; }
  const altijd = !!(bewijs?.open24 || x.open24Bevestigd || (x.periods || []).some(p => p.open && !p.close));
  y.uren = sluiting && !bewijs?.velden?.uren ? null : urenNetjes(y.uren, altijd);
  y.statusOnzeker = sluiting && !bewijs?.velden?.uren;
  if (y.tel) { const t = String(y.tel).trim().replace(/[\s().-]/g, ''); y.tel = /^\+\d{7,15}$/.test(t) ? t : /^5999\d{7}$/.test(t) ? '+' + t : /^\d{7}$/.test(t) ? t : null; }
  return y;
}
export function afstand(a, b) {
  if (![a?.lat, a?.lng, b?.lat, b?.lng].every(x => typeof x === 'number' && Number.isFinite(x))) return null;
  const r = Math.PI / 180, p = (b.lat - a.lat) * r, q = (b.lng - a.lng) * r;
  return 6371000 * 2 * Math.asin(Math.min(1, Math.sqrt(Math.sin(p / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(q / 2) ** 2)));
}
const domein = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
export function vindBedrijf(v, rows) {
  if (!v) return { reden: 'geen item', zaak: null };
  const urls = [v.url, ...(v.bronnen || []), ...(v.scores || []).map(x => x.bron)].filter(x => typeof x === 'string');
  const pid = v.place_id || urls.map(u => { try { return new URL(u).searchParams.get('query_place_id') || u.match(/place_id[:=]([^&/]+)/)?.[1]; } catch { return null; } }).find(Boolean);
  const cid = v.cid || urls.map(u => { try { return new URL(u).hostname.match(/(^|\.)google\./) && new URL(u).searchParams.get('cid'); } catch { return null; } }).find(Boolean);
  const ids = rows.filter(x => (pid && x.place_id === pid) || (cid && String(x.cid) === String(cid)));
  if (ids.length === 1) return { reden: 'id', zaak: ids[0] };
  const pad = [v.url, ...(v.bronnen || []), ...(v.scores || []).map(x => x.bron)].filter(Boolean).map(u => { try { const x = new URL(u); return eigenSite(u) && x.pathname.match(/\/(?:bedrijven|businesses|firmen|empresas|negocios)\/([^/]+)\/([^/]+)\/?$/); } catch { return null; } }).filter(Boolean);
  for (const p of pad) { const r = rows.filter(x => x.cs === p[1] && x.slug === p[2]); if (r.length === 1 && (normNaam(v.naam) === normNaam(r[0].naam) || normNaam(v.id) === normNaam(r[0].slug))) return { reden: 'bestaande gidslink', zaak: r[0] }; }
  const naam = normNaam(v.naam), naamHits = rows.filter(x => normNaam(x.naam) === naam && naam.length >= 5);
  const tel = String(v.tel || '').replace(/\D/g, ''), sites = urls.filter(u => !eigenSite(u) && !/google\.|tripadvisor\.|booking\.|expedia\.|hotels\.|facebook\.|instagram\./.test(domein(u))).map(domein).filter(Boolean);
  const sterk = naamHits.filter(x => { const m = afstand(v, x); return (m != null && m <= 150) || (tel && tel === String(x.tel || '').replace(/\D/g, '')) || (sites.includes(domein(x.site))); });
  if (sterk.length === 1) return { reden: 'naam en onafhankelijke plaats/site/telefoon', zaak: sterk[0] };
  return { reden: naamHits.length ? 'identiteit onvoldoende of meer vestigingen' : 'niet gekoppeld', zaak: null, kandidaten: naamHits.slice(0, 4).map(x => ({ cs: x.cs, slug: x.slug, naam: x.naam })) };
}
export function stabieleSlugs(items, oud, slugify) {
  const perId = new Map((oud || []).map(x => [identiteit(x), x.slug])); const used = new Set();
  const out = items.map(x => ({ ...x }));
  for (const x of out) { const s = perId.get(identiteit(x)); if (s && !used.has(s)) { x.slug = s; used.add(s); } else delete x.slug; }
  for (const x of out) if (!x.slug) { const basis = slugify(x.naam) || 'bedrijf'; let s = basis, n = 2; while (used.has(s)) s = basis + '-' + n++; x.slug = s; used.add(s); }
  return out;
}
export function gegevensHash(x) {
  return createHash('sha256').update(JSON.stringify(Object.fromEntries(['naam', 'cat', 'adres', 'tel', 'site', 'lat', 'lng', 'score', 'aantal', 'uren', 'status', 'prijs', 'beschrijving', 'veldBron'].map(k => [k, x[k] ?? null])))).digest('hex').slice(0, 20);
}
export const innameHash = pages => createHash('sha256').update(JSON.stringify(pages)).digest('hex').slice(0, 20);
export function valideerInname(pages, state, vorigAantal = 0) {
  if (!state?.done || !state.n || pages.length !== state.n) throw new Error('broninname niet compleet');
  for (let i = 0; i < pages.length; i++) if (!pages[i] || pages[i].n !== i || !Array.isArray(pages[i].items)) throw new Error('bronpagina ontbreekt: ' + i);
  const rows = pages.flatMap(x => x.items).filter(x => x && x.naam && (x.land === 'CW' || (!x.land && x.lat > 11.95 && x.lat < 12.45 && x.lng > -69.2 && x.lng < -68.7)));
  if (vorigAantal && rows.length < vorigAantal * 0.95) throw new Error('verdachte krimp; vorige gids behouden');
  if (state.total && rows.length < state.total * 0.95) throw new Error('bronomvang wijkt af');
  return rows;
}
export function controleRecords(rows, vandaag = new Date().toISOString().slice(0, 10)) {
  const s = { totaal: rows.length, naamHersteld: 0, tijdenHersteld: 0, sluitstatusZonderOpenmelding: 0, zonderBronDatum: 0, ouderDan30Dagen: 0, onveiligeSite: 0, conflicterendeIds: 0 };
  const ids = new Set();
  for (const x of rows) { const y = normaliseerBedrijf(x); s.naamHersteld += y.naam !== x.naam; s.tijdenHersteld += JSON.stringify(y.uren) !== JSON.stringify(x.uren || null); s.sluitstatusZonderOpenmelding += !!y.statusOnzeker; s.zonderBronDatum += !y.bronDatum; s.ouderDan30Dagen += !!y.bronDatum && Date.parse(vandaag) - Date.parse(y.bronDatum) > 30 * 864e5; s.onveiligeSite += !!x.site && !y.site; const id = identiteit(x); if (ids.has(id)) s.conflicterendeIds++; ids.add(id); }
  return s;
}
