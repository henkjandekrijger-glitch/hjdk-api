// Dagelijkse premiecheck (Henkjan 17 nov 2026: wijzigingen mailen). Leest elke ochtend de premiepagina's uit data/zorg/basis-2027.json
// (veld bron, alleen sites van verzekeraars) en kijkt of de bekende premie 2027 er nog op staat. Staat een premie er niet meer op, dan komt er
// een signaal in KV zorg:check (met de bedragen die nu op de pagina staan). Signalen gaan nooit vanzelf de mail in: Claude kijkt ze na in de
// nachtronde, zet een echte wijziging in basis-2027.json en updates.json en commit. Gratis (gewone fetch), hooguit 40 pagina's per ronde.
import { kv } from './db.js';
import { data } from './zorg.js';

const bedragen = t => [...new Set((t.match(/\d{2,3}[.,]\d{2}/g) || []).map(x => Number(x.replace(',', '.'))).filter(n => n > 50 && n < 400))];
export async function check() {
  const ps = (data().basis.polissen || []).filter(p => typeof p.premie2027 === 'number' && p.bron && p.bronSoort === 'verzekeraar');
  const perBron = {}; ps.forEach(p => (perBron[p.bron] = perBron[p.bron] || []).push(p));
  const out = { dag: new Date().toISOString().slice(0, 10), paginas: 0, ok: 0, signalen: [], onbereikbaar: [] };
  const urls = Object.keys(perBron).slice(0, 40);
  await Promise.all(urls.map(async u => {
    try {
      const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; keuzehulp.best premiecheck)', 'accept-language': 'nl-NL' }, signal: AbortSignal.timeout(15000) });
      if (!r.ok || /pdf/i.test(r.headers.get('content-type') || '')) { out.onbereikbaar.push({ u, status: r.status }); return; }
      const t = (await r.text()).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ');
      out.paginas++; const nu = bedragen(t);
      const weg = perBron[u].filter(p => !nu.some(n => Math.abs(n - p.premie2027) < 0.006));
      if (!weg.length) { out.ok++; return; }
      if (nu.length < 1) { out.onbereikbaar.push({ u, status: 'geen bedragen (pagina laadt met script?)' }); return; }
      out.signalen.push({ bron: u, label: perBron[u][0].label, mist: weg.map(p => p.polis + ' ' + p.premie2027), opPagina: nu.slice(0, 20) });
    } catch (e) { out.onbereikbaar.push({ u, status: String(e.message || e).slice(0, 60) }); }
  }));
  await kv.set('zorg:check', { ...out, at: new Date().toISOString() });
  if (out.signalen.length) await kv.set('zorg:check:' + out.dag, out, { ex: 60 * 86400 });
  return out;
}
