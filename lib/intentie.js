// Intentielog: elke vraag die iemand typt in de vraagbalk van een keuzehulp of in het zoekvak van de voorpagina.
// Henkjan 15 nov 2026: "Vanaf nu gaan we dus bouwen aan de 100k intenties ." Dit is de eerste bron van het intentiemodel naast
// Demand Radar en Search Console: wat echte bezoekers willen, in hun eigen woorden, per site (nl, us, de).
// Opslag (krap): kz:int:n:<site> hash vraag -> aantal (hoogstens 20.000 velden), kz:int:log lijst met de laatste 3.000 (vraag, site, pagina,
// beantwoord uit de FAQ ja/nee, versie van de proef), kz:int:d:<dag> per site het aantal. Geen e-mailadressen, telefoonnummers of IP-adressen.
import { createHash } from 'node:crypto';

const SITES = ['nl', 'us', 'de'];
const dag = () => new Date().toISOString().slice(0, 10);
export function schoon(q) {
  return String(q || '').replace(/[\u0000-\u001f]/g, ' ').replace(/\S+@\S+/g, ' ').replace(/(\+?\d[\d\s().-]{6,}\d)/g, ' ').replace(/https?:\/\/\S+/g, ' ')
    .replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 160);
}

export async function intentieLog(kv, b, req) {
  const site = SITES.includes(b && b.site) ? b.site : ''; const q = schoon(b && b.q);
  if (!site || q.length < 3) return { ok: false, fout: 'invoer' };
  const ip = String((req && (req.headers['x-forwarded-for'] || req.headers['x-real-ip'])) || '').split(',')[0].trim();
  const rk = 'kz:int:rate:' + createHash('sha256').update(ip + ':' + Math.floor(Date.now() / 600000)).digest('hex').slice(0, 20);
  try { const n = await kv.incr(rk); if (n === 1) await kv.raw(['EXPIRE', rk, '700']); if (n > 20) return { ok: true, te: 'veel' }; } catch (e) {}
  const rec = { q, site, slug: String(b.slug || '').replace(/[^a-z0-9-]/gi, '').slice(0, 90), bron: ['zoek', 'chat'].includes(b.bron) ? b.bron : 'vraag', m: b.m ? 1 : 0, v: /^[a-z]$/.test(String(b.v || '')) ? b.v : '', at: new Date().toISOString().slice(0, 16) };
  const nk = 'kz:int:n:' + site;
  try {
    const len = Number(await kv.raw(['HLEN', nk])) || 0; const bestaat = len >= 20000 ? Number(await kv.raw(['HEXISTS', nk, q])) : 1;
    await Promise.all([
      bestaat ? kv.raw(['HINCRBY', nk, q, 1]) : Promise.resolve(),
      kv.raw(['LPUSH', 'kz:int:log', JSON.stringify(rec)]).then(() => kv.raw(['LTRIM', 'kz:int:log', 0, 2999])),
      kv.raw(['HINCRBY', 'kz:int:d:' + dag(), site + ':' + rec.bron, 1]).then(() => kv.raw(['EXPIRE', 'kz:int:d:' + dag(), String(60 * 86400)])),
    ]);
  } catch (e) { return { ok: false, fout: 'opslag' }; }
  return { ok: true };
}

const paren = h => { if (!h) return {}; if (!Array.isArray(h)) return h; const o = {}; for (let i = 0; i + 1 < h.length; i += 2) o[String(h[i])] = h[i + 1]; return o; };
// stand: aantallen altijd; de vragen zelf alleen met vol=true (beschermde host), want bezoekers typen soms persoonlijke dingen
export async function intentieStand(kv, { vol = false, n = 40 } = {}) {
  const per = {};
  for (const s of SITES) {
    const h = paren(await kv.raw(['HGETALL', 'kz:int:n:' + s]).catch(() => null)); const rij = Object.entries(h).map(([q, c]) => [q, Number(c) || 0]).sort((a, b) => b[1] - a[1]);
    per[s] = { uniek: rij.length, totaal: rij.reduce((a, x) => a + x[1], 0), ...(vol ? { top: rij.slice(0, n).map(([q, c]) => ({ q, n: c })) } : {}) };
  }
  const dagen = []; for (let i = 0; i < 7; i++) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); dagen.push({ dag: d, ...paren(await kv.raw(['HGETALL', 'kz:int:d:' + d]).catch(() => null)) }); }
  let laatst = []; if (vol) { try { laatst = ((await kv.raw(['LRANGE', 'kz:int:log', 0, n - 1])) || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean); } catch (e) {} }
  return { ok: true, uitleg: 'Vragen van bezoekers uit de vraagbalk op elke keuzehulp en het zoekvak op de voorpagina. Bron voor het intentiemodel (100k intenties).', per, dagen, ...(vol ? { laatst } : {}) };
}
