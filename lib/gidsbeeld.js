// Beelden voor gids.kadoly.com (25 nov 2026, Henkjan: "Zet bij al je gidsen en alles wat je maakte plaatjes want is heel erg saai nu .
// Relevante plaatjes ALTIJD geoptimaliseerd voor google afbeeldingen .").
// Eén hoofdbeeld per pagina, op een eigen adres met een beschrijvende naam: /beeld/<slug>.jpg (ook .webp en .avif, ?w= voor kleinere maten).
// - gids met producten: collage van de eerste keuzes (echte productfoto's uit de winkel)
// - binnenkort-pagina zonder product: een getekend voorbeeld van het product (sterrenkaart, geboorteposter, canvas), duidelijk als illustratie
// - artikel van de redactie: collage van de producten uit het artikel, anders een titelkaart
// Regels (ZICHT, les foto-eigen-adres en beelden-vindbaar): eigen adres, width/height, <picture> met AVIF en WebP, alt met de inhoud,
// ImageObject in de JSON-LD, image:image in de sitemap, versie in de URL zodat een lange cache veilig is.
import sharp from 'sharp';
import { ImageResponse } from '@vercel/og';
import { INTER_500, INTER_800 } from './pinfont.js';

export const BW = 1200, BH = 675; // 16:9, wat Google Discover en Afbeeldingen graag zien (minstens 1200 breed)
export const MATEN = [480, 800, 1200];
const FONTS = [{ name: 'Inter', data: Buffer.from(INTER_500, 'base64'), weight: 500, style: 'normal' }, { name: 'Inter', data: Buffer.from(INTER_800, 'base64'), weight: 800, style: 'normal' }];
const el = (type, style, children) => ({ type, props: { style: Object.assign({ display: 'flex' }, style), children } });
const ACHTER = '#f3ece3';

// productfoto via de eigen beeldroute van de shop (die haalt hem zoals een browser op en levert een vierkante JPEG op wit)
async function foto(pid) {
  try { const r = await fetch('https://go.kadoly.com/api/shop/beeld/' + encodeURIComponent(pid) + '/sq.jpg', { signal: AbortSignal.timeout(9000) }); if (!r.ok) return null; const b = Buffer.from(await r.arrayBuffer()); return b.length > 2000 ? b : null; } catch (e) { return null; }
}
const vak = (buf, w, h) => sharp(buf).flatten({ background: '#ffffff' }).resize(w, h, { fit: 'contain', background: '#ffffff' }).jpeg({ quality: 90 }).toBuffer();

// collage: 1 foto groot, 2 of 3 = groot links en twee rechts
export async function collage(pids) {
  const bufs = []; for (const p of (pids || []).slice(0, 6)) { if (bufs.length >= 3) break; const b = await foto(p); if (b) bufs.push(b); }
  if (!bufs.length) return null;
  const m = 30, groot = BH - 2 * m;
  const lagen = [];
  if (bufs.length === 1) lagen.push({ input: await vak(bufs[0], groot, groot), left: Math.round((BW - groot) / 2), top: m });
  else {
    lagen.push({ input: await vak(bufs[0], groot, groot), left: m, top: m });
    const rw = BW - groot - 3 * m, rh = bufs.length === 2 ? groot : Math.round((groot - m) / 2);
    lagen.push({ input: await vak(bufs[1], rw, rh), left: groot + 2 * m, top: m });
    if (bufs[2]) lagen.push({ input: await vak(bufs[2], rw, rh), left: groot + 2 * m, top: m * 2 + rh });
  }
  return sharp({ create: { width: BW, height: BH, channels: 3, background: ACHTER } }).composite(lagen).png().toBuffer();
}

// vaste pseudo-willekeur, zodat hetzelfde voorbeeld elke keer hetzelfde beeld geeft
function rnd(seed) { let s = 0; for (const c of String(seed)) s = (s * 31 + c.charCodeAt(0)) >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

function sterrenSvg(d, seed) {
  const r = rnd(seed), c = d / 2; let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${d}" height="${d}" viewBox="0 0 ${d} ${d}"><circle cx="${c}" cy="${c}" r="${c - 4}" fill="#0b1630" stroke="#d8c08a" stroke-width="4"/>`;
  for (let k = 1; k <= 3; k++) s += `<circle cx="${c}" cy="${c}" r="${(c - 4) * k / 4}" fill="none" stroke="#24345c" stroke-width="1"/>`;
  const pts = []; for (let i = 0; i < 260; i++) { const a = r() * Math.PI * 2, rr = Math.sqrt(r()) * (c - 14); const x = c + Math.cos(a) * rr, y = c + Math.sin(a) * rr, g = r(); pts.push([x, y]); s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(g > 0.97 ? 3.2 : g > 0.85 ? 2 : 1.1).toFixed(1)}" fill="#ffffff" opacity="${(0.55 + g * 0.45).toFixed(2)}"/>`; }
  for (let k = 0; k < 5; k++) { const o = pts[Math.floor(r() * pts.length)]; const l = pts.slice().sort((p, q) => Math.hypot(p[0] - o[0], p[1] - o[1]) - Math.hypot(q[0] - o[0], q[1] - o[1])).slice(0, 5).sort((p, q) => p[0] - q[0]); s += `<polyline points="${l.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="#d8c08a" stroke-width="1.2" opacity="0.7"/>`; }
  return 'data:image/svg+xml;base64,' + Buffer.from(s + '</svg>').toString('base64');
}
function landschapSvg(w, h) {
  const s = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6b26b"/><stop offset="0.55" stop-color="#f9d9a8"/><stop offset="1" stop-color="#cfe3f0"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#l)"/><circle cx="${w * 0.68}" cy="${h * 0.42}" r="${h * 0.12}" fill="#fff4d6"/><path d="M0 ${h * 0.7} Q ${w * 0.25} ${h * 0.55} ${w * 0.5} ${h * 0.68} T ${w} ${h * 0.62} V ${h} H 0 Z" fill="#7a9a74"/><path d="M0 ${h * 0.82} Q ${w * 0.35} ${h * 0.7} ${w * 0.7} ${h * 0.82} T ${w} ${h * 0.8} V ${h} H 0 Z" fill="#4e6b4c"/></svg>`;
  return 'data:image/svg+xml;base64,' + Buffer.from(s).toString('base64');
}

// getekend voorbeeld van een product dat er nog niet is; tekst onderin zegt dat het een illustratie is
export async function illustratie(soort, titel) {
  let kaart;
  if (soort === 'sterren') kaart = el('div', { width: BW, height: BH, background: '#1b2238', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter' }, [
    el('div', { width: 470, height: 610, background: '#0b1630', border: '14px solid #d8c08a', flexDirection: 'column', alignItems: 'center', padding: '26px 20px' }, [
      { type: 'img', props: { src: sterrenSvg(380, titel), width: 380, height: 380 } },
      el('div', { color: '#f3ece3', fontSize: 26, fontWeight: 800, marginTop: 26 }, 'Onze trouwdag'),
      el('div', { color: '#d8c08a', fontSize: 18, fontWeight: 500, marginTop: 10 }, '14 februari 2026 · 21.30 uur'),
      el('div', { color: '#d8c08a', fontSize: 18, fontWeight: 500, marginTop: 4 }, 'Utrecht · 52,09° N  5,12° O')]),
    el('div', { position: 'absolute', bottom: 18, right: 26, color: '#aab3c9', fontSize: 18, fontWeight: 500 }, 'Voorbeeld (illustratie) · Kadoly gids')]);
  else if (soort === 'geboorte') kaart = el('div', { width: BW, height: BH, background: '#efe6da', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter' }, [
    el('div', { width: 450, height: 600, background: '#ffffff', border: '16px solid #2b2b2b', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 30 }, [
      el('div', { width: 120, height: 120, borderRadius: 60, background: '#e8d5c4', alignItems: 'center', justifyContent: 'center', color: '#8a5a44', fontSize: 52, fontWeight: 800 }, 'E'),
      el('div', { color: '#1f1f1f', fontSize: 64, fontWeight: 800, marginTop: 28 }, 'Emma'),
      el('div', { color: '#555555', fontSize: 22, fontWeight: 500, marginTop: 18 }, '12 maart 2026 · 08.14 uur'),
      el('div', { color: '#555555', fontSize: 22, fontWeight: 500, marginTop: 8 }, '3.420 gram · 51 cm'),
      el('div', { color: '#8a5a44', fontSize: 18, fontWeight: 500, marginTop: 22 }, 'Leiden')]),
    el('div', { position: 'absolute', bottom: 18, right: 26, color: '#6b6b6b', fontSize: 18, fontWeight: 500 }, 'Voorbeeld (illustratie) · Kadoly gids')]);
  else if (soort === 'canvas') kaart = el('div', { width: BW, height: BH, background: '#e9e4dc', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter', flexDirection: 'column' }, [
    el('div', { width: 720, height: 450, boxShadow: '18px 22px 30px rgba(0,0,0,0.28)', borderRight: '14px solid #c9b8a0' }, [{ type: 'img', props: { src: landschapSvg(706, 450), width: 706, height: 450 } }]),
    el('div', { width: 880, height: 70, background: '#b8a58c', marginTop: 60, borderRadius: 6 }, []),
    el('div', { position: 'absolute', bottom: 18, right: 26, color: '#6b6b6b', fontSize: 18, fontWeight: 500 }, 'Voorbeeld (illustratie) · Kadoly gids')]);
  else kaart = el('div', { width: BW, height: BH, background: ACHTER, flexDirection: 'column', justifyContent: 'center', padding: '0 90px', fontFamily: 'Inter' }, [
    el('div', { color: '#8a5a44', fontSize: 30, fontWeight: 800, marginBottom: 24 }, 'Kadoly gids'),
    el('div', { color: '#111111', fontSize: String(titel).length > 60 ? 54 : 66, fontWeight: 800, lineHeight: 1.12 }, String(titel).slice(0, 110))]);
  return Buffer.from(await new ImageResponse(kaart, { width: BW, height: BH, fonts: FONTS }).arrayBuffer());
}

export async function codeer(png, x = 'jpg', w = BW) {
  const breed = MATEN.includes(Number(w)) ? Number(w) : BW; const s = sharp(png).resize(breed, Math.round(breed * BH / BW));
  if (x === 'avif') return { buf: await s.avif({ quality: 55 }).toBuffer(), type: 'image/avif' };
  if (x === 'webp') return { buf: await s.webp({ quality: 80 }).toBuffer(), type: 'image/webp' };
  return { buf: await s.jpeg({ quality: 84, mozjpeg: true, progressive: true }).toBuffer(), type: 'image/jpeg' };
}

// HTML van het hoofdbeeld: <picture> met AVIF, WebP en JPEG in drie maten, vaste maat tegen verspringen, bovenaan dus fetchpriority high
export function figuurHtml(slug, v, alt, onderschrift) {
  const q = 'v=' + encodeURIComponent(v || '1'), set = x => MATEN.map(w => `/beeld/${slug}.${x}?w=${w}&amp;${q} ${w}w`).join(', '), sz = '(max-width: 760px) 100vw, 760px';
  return `<figure class="gb" style="margin:18px 0 22px"><picture><source type="image/avif" srcset="${set('avif')}" sizes="${sz}"><source type="image/webp" srcset="${set('webp')}" sizes="${sz}"><img src="/beeld/${slug}.jpg?${q}" srcset="${set('jpg')}" sizes="${sz}" width="${BW}" height="${BH}" alt="${alt}" fetchpriority="high" decoding="async" style="width:100%;height:auto;border-radius:10px;display:block"></picture>${onderschrift ? `<figcaption style="font-size:13px;color:#000;margin-top:6px">${onderschrift}</figcaption>` : ''}</figure>`;
}
export function beeldLd(host, slug, v, naam, onderschrift) {
  return { '@context': 'https://schema.org', '@type': 'ImageObject', contentUrl: `${host}/beeld/${slug}.jpg?v=${encodeURIComponent(v || '1')}`, url: `${host}/beeld/${slug}.jpg?v=${encodeURIComponent(v || '1')}`, width: BW, height: BH, name: naam, caption: onderschrift, representativeOfPage: true, creditText: 'Kadoly', creator: { '@type': 'Organization', name: 'Kadoly' }, copyrightNotice: 'Kadoly', acquireLicensePage: host + '/', license: host + '/' };
}
