// Kliksporen van de shop blijvend in Vercel Blob (Henkjan 5 nov 2026: "Zorg dat CM nog beter wordt !!!!! We mogen geen data kruimel verliezen .").
// Waarom: elk klikrecord hjdk:shc:<code> (advertentie, plek, apparaat, alle gedragsvlaggen y*, mandje/afrekenen/betaald px, persoon mp)
// verviel na 7 dagen uit Redis (30 met een kassastap), en de kassalog hield alleen de laatste 3000 gebeurtenissen. Daarmee verdwenen de
// patronen over weken (welke plek, welk uur, welk apparaat kocht). Nu gaat alles per dag naar Blob (store clickmind-ruw, privé):
//   clickmind/shc/<dag>.jsonl.gz       één regel per klik, met code; dag = dag (UTC) waarop de klik binnenkwam
//   clickmind/kassalog/<dag>.jsonl.gz  één regel per kassagebeurtenis (dag van de gebeurtenis)
// Elke dag om 04 UTC schrijft de ruwarchief-cron de laatste 7 dagen opnieuw. Een record wordt nog tot 7 dagen bijgewerkt (later mandje,
// betaling), dus elke dag krijgt 7 kansen en de laatste stand wint. Samenvoegen gaat per code: wat al in Blob staat blijft staan, ook als
// het in Redis verlopen is. Een onvolledige scan schrijft niets (nooit een kleiner bestand over een groter heen).
import { put, get, list } from '@vercel/blob';
import { gzipSync, gunzipSync } from 'zlib';

const dagVan = ms => new Date(Number(ms)).toISOString().slice(0, 10);
const pad = (soort, d) => 'clickmind/' + soort + '/' + d + '.jsonl.gz';
export const blobKlaar = () => !!process.env.BLOB_READ_WRITE_TOKEN;

async function lees(p) {
  try { const r = await get(p, { access: 'private' }); if (!r || !r.stream) return [];
    const delen = []; for await (const c of r.stream) delen.push(Buffer.from(c));
    return gunzipSync(Buffer.concat(delen)).toString('utf8').split('\n').filter(Boolean); } catch (e) { return []; }
}
const schrijf = (p, rijen) => put(p, gzipSync(Buffer.from(rijen.join('\n'))), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/gzip' });

// samenvoegen per sleutel: oud blijft, nieuw (laatste stand uit Redis) wint
async function voegSamen(p, nieuw, sleutel) {
  const m = new Map(); for (const r of await lees(p)) { try { m.set(sleutel(JSON.parse(r)), r); } catch (e) {} }
  const voor = m.size; for (const r of nieuw) { try { m.set(sleutel(JSON.parse(r)), r); } catch (e) {} }
  if (!m.size) return { regels: 0, was: voor };
  await schrijf(p, [...m.values()]); return { regels: m.size, was: voor };
}

export async function shcArchief(kv, { dagen = 7, tijd = 40000 } = {}) {
  if (!blobKlaar()) return { ok: false, fout: 'BLOB_READ_WRITE_TOKEN ontbreekt' };
  const t0 = Date.now(), nu = Date.now(), D = new Set();
  for (let i = 0; i <= Math.max(1, Math.min(31, dagen)); i++) D.add(dagVan(nu - i * 864e5));
  const per = {}; D.forEach(d => { per[d] = []; });
  let cur = '0', gezien = 0, af = true;
  do { const [cc, keys] = await kv.scan(cur, { match: 'hjdk:shc:*', count: 1000 }); cur = String(cc);
    for (let i = 0; i < keys.length; i += 200) { const ks = keys.slice(i, i + 200); const vals = await kv.mget(...ks); gezien += vals.length;
      vals.forEach((r, j) => { if (!r || !r.at) return; const d = dagVan(r.at); if (per[d]) per[d].push(JSON.stringify({ code: ks[j].slice(9), ...r })); }); }
    if (Date.now() - t0 > tijd) { af = false; break; }
  } while (cur !== '0');
  if (!af) return { ok: false, fout: 'scan niet af binnen de tijd, niets geschreven', gezien };
  const uit = { ok: true, gezien, shc: {}, kassalog: {} };
  for (const d of Object.keys(per).sort()) if (per[d].length) uit.shc[d] = await voegSamen(pad('shc', d), per[d], o => o.code);
  // kassalog: alle gebeurtenissen per dag van de gebeurtenis
  const ruw = await kv.raw(['LRANGE', 'hjdk:shop:kassalog', '0', '-1']).catch(() => []); const kp = {};
  for (const x of (Array.isArray(ruw) ? ruw : [])) { let o = null; try { o = typeof x === 'string' ? JSON.parse(x) : x; } catch (e) {} if (!o || !o.c) continue;
    const d = dagVan(o.t || o.at || nu); (kp[d] = kp[d] || []).push(JSON.stringify(o)); }
  for (const d of Object.keys(kp).sort()) uit.kassalog[d] = await voegSamen(pad('kassalog', d), kp[d], o => o.c + '|' + o.soort + '|' + (o.t || 0));
  uit.duurMs = Date.now() - t0; return uit;
}

// lezen voor analyses: alle klikrecords van een dag (Blob, aangevuld met wat nog in Redis staat gebeurt in shcArchief zelf)
export async function leesShcDag(d, soort = 'shc') { return (await lees(pad(soort, d))).map(r => { try { return JSON.parse(r); } catch (e) { return null; } }).filter(Boolean); }

export async function shcStand() {
  if (!blobKlaar()) return { ok: false, fout: 'BLOB_READ_WRITE_TOKEN ontbreekt' };
  const uit = { ok: true, shc: [], kassalog: [] };
  for (const s of ['shc', 'kassalog']) { let cursor; do { const r = await list({ prefix: 'clickmind/' + s + '/', cursor, limit: 1000 }); for (const b of r.blobs) uit[s].push({ dag: b.pathname.slice(-19, -9), kB: Math.round(b.size / 1024) }); cursor = r.hasMore ? r.cursor : null; } while (cursor); }
  return uit;
}
