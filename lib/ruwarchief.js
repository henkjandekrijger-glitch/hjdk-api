// Ruwe kliklog naar Vercel Blob (Henkjan 16 okt: "Ruwe log naar Vercel Blob"). De Redis-database (250 MB) liep vol: mm:raw:<dag>
// is per regel ~2 kB en met de Mondiad-kliks ~60 MB per dag. Alle data blijft bewaard (Henkjan 14 okt: "ALLE data"), maar
// in Blob (store clickmind-ruw, privé) in plaats van in Redis.
// Werking: elk uur verplaatst archiveer() de regels van mm:raw:<dag> en mm:rawp:<dag> in blokken van 5000 naar
// clickmind/<soort>/<dag>/<begin>-<eind>.jsonl.gz en haalt ze daarna uit Redis (LTRIM vanaf de kop). Van vandaag blijven de
// nieuwste 'houd' regels in Redis staan. De teller van wat al in Blob staat komt uit de bestandsnamen zelf (geen Redis-schrijf
// nodig, werkt dus ook als Redis vol is). Volgorde: eerst Blob, dan pas inkorten; gaat het inkorten mis, dan komt een blok
// hooguit dubbel in Blob, nooit kwijt.
// Lezen: leesRuwDag() geeft eerst de Blob-blokken en dan wat nog in Redis staat, in volgorde.
import { put, get, list } from '@vercel/blob';
import { gzipSync, gunzipSync } from 'zlib';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const SOORTEN = { raw: 'mm:raw:', rawp: 'mm:rawp:' };
const map = (soort, d) => 'clickmind/' + soort + '/' + d + '/';
const vandaag = () => new Date().toISOString().slice(0, 10);
export const blobKlaar = () => !!process.env.BLOB_READ_WRITE_TOKEN;

async function blokken(soort, d) {
  const uit = []; let cursor;
  do { const r = await list({ prefix: map(soort, d), cursor, limit: 1000 }); for (const b of r.blobs) { const m = /\/(\d+)-(\d+)\.jsonl\.gz$/.exec(b.pathname); if (m) uit.push({ pad: b.pathname, van: N(m[1]), tot: N(m[2]), grootte: b.size }); } cursor = r.hasMore ? r.cursor : null; } while (cursor);
  return uit.sort((a, b) => a.van - b.van);
}

export async function archiveer(kv, { dagen = null, houd = 300, blok = 5000, tijd = 45000 } = {}) {
  if (!blobKlaar()) return { ok: false, fout: 'BLOB_READ_WRITE_TOKEN ontbreekt (Blob-store clickmind-ruw niet gekoppeld of nog niet uitgerold)' };
  const t0 = Date.now(), uit = [];
  // welke dagen: opgegeven, anders alle mm:raw*-sleutels die er nog zijn
  let D = Array.isArray(dagen) && dagen.length ? dagen : null;
  if (!D) { const s = new Set(); let cu = '0'; do { const [c, keys] = await kv.scan(cu, { match: 'mm:raw*:20*', count: 1000 }); cu = String(c); for (const k of keys) { const m = /(\d{4}-\d{2}-\d{2})$/.exec(k); if (m) s.add(m[1]); } } while (cu !== '0'); D = [...s].sort(); }
  for (const d of D) for (const [soort, pre] of Object.entries(SOORTEN)) {
    const k = pre + d; let len = N(await kv.raw(['LLEN', k]).catch(() => 0)); if (!len) continue;
    const bl = await blokken(soort, d); let basis = bl.length ? bl[bl.length - 1].tot : 0;
    const r = { dag: d, soort, inRedis: len, alInBlob: basis, verplaatst: 0, blokken: 0 };
    const bewaar = d === vandaag() ? houd : 0;
    while (len - bewaar > 0) {
      if (Date.now() - t0 > tijd) { r.nogNiet = true; break; }
      const n = Math.min(blok, len - bewaar);
      const rijen = (await kv.raw(['LRANGE', k, 0, n - 1])) || []; if (!rijen.length) break;
      const pad = map(soort, d) + String(basis).padStart(7, '0') + '-' + String(basis + rijen.length).padStart(7, '0') + '.jsonl.gz';
      await put(pad, gzipSync(Buffer.from(rijen.join('\n'))), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/gzip' });
      await kv.raw(['LTRIM', k, rijen.length, -1]);
      basis += rijen.length; len -= rijen.length; r.verplaatst += rijen.length; r.blokken++;
    }
    r.inBlobNu = basis; r.nogInRedis = len; uit.push(r);
  }
  return { ok: true, seconden: Math.round((Date.now() - t0) / 100) / 10, dagen: D, uit };
}

async function leesBlok(pad) {
  const r = await get(pad, { access: 'private' }); if (!r || !r.stream) return [];
  const delen = []; const rd = r.stream.getReader(); for (;;) { const { value, done } = await rd.read(); if (done) break; delen.push(Buffer.from(value)); }
  return gunzipSync(Buffer.concat(delen)).toString('utf8').split('\n').filter(Boolean);
}

// alle regels van één dag: eerst uit Blob, dan wat nog in Redis staat. cb krijgt de geparste regel. Geeft het aantal terug.
export async function leesRuwDag(kv, soort, d, cb, { tijd = 40000 } = {}) {
  const t0 = Date.now(); let n = 0, volledig = true;
  if (blobKlaar()) for (const b of await blokken(soort, d).catch(() => [])) {
    if (Date.now() - t0 > tijd) { volledig = false; break; }
    for (const x of await leesBlok(b.pad)) { try { cb(JSON.parse(x)); n++; } catch (e) {} }
  }
  const k = SOORTEN[soort] + d, tot = N(await kv.raw(['LLEN', k]).catch(() => 0));
  for (let van = 0; van < tot; van += 2000) {
    if (Date.now() - t0 > tijd) { volledig = false; break; }
    const l = (await kv.raw(['LRANGE', k, van, van + 1999])) || [];
    for (const x of l) { try { cb(JSON.parse(x)); n++; } catch (e) {} }
  }
  return { n, volledig };
}

// stand: per dag hoeveel in Blob en hoeveel nog in Redis
export async function archiefStand(kv, { dagen = 3 } = {}) {
  const D = Array.from({ length: Math.max(1, Math.min(60, dagen)) }, (_, i) => new Date(Date.now() - i * 864e5).toISOString().slice(0, 10));
  const uit = [];
  for (const d of D) for (const soort of Object.keys(SOORTEN)) {
    const bl = blobKlaar() ? await blokken(soort, d).catch(() => []) : [];
    uit.push({ dag: d, soort, inBlob: bl.length ? bl[bl.length - 1].tot : 0, blobMB: Math.round(bl.reduce((a, b) => a + b.grootte, 0) / 10485.76) / 100, inRedis: N(await kv.raw(['LLEN', SOORTEN[soort] + d]).catch(() => 0)) });
  }
  return { ok: true, blob: blobKlaar(), uit };
}

// bereik [van, van+n) over Blob + Redis samen (voor /api/mm/export)
export async function leesRuwBereik(kv, soort, d, van, n) {
  const bl = blobKlaar() ? await blokken(soort, d).catch(() => []) : [], inBlob = bl.length ? bl[bl.length - 1].tot : 0;
  const k = SOORTEN[soort] + d, inRedis = N(await kv.raw(['LLEN', k]).catch(() => 0)), rijen = [];
  for (const b of bl) { if (rijen.length >= n) break; if (b.tot <= van + rijen.length) continue; const l = await leesBlok(b.pad); const start = Math.max(0, van + rijen.length - b.van); rijen.push(...l.slice(start, start + n - rijen.length)); }
  if (rijen.length < n) { const s = Math.max(0, van + rijen.length - inBlob); const l = (await kv.raw(['LRANGE', k, s, s + (n - rijen.length) - 1])) || []; rijen.push(...l); }
  return { totaal: inBlob + inRedis, inBlob, rijen };
}
