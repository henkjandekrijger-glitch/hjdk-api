// test lib/d51.js zonder netwerk: node scripts/test-d51.mjs
import * as X from '../lib/d51.js';

let ok = 0, fout = 0;
const ja = (c, t) => { if (c) { ok++; console.log('ok   ' + t); } else { fout++; console.log('FOUT ' + t); } };

function nepKv() {
  const m = new Map(), h = new Map();
  return { m, raw: async ([cmd, k, ...a]) => {
    if (cmd === 'GET') return m.has(k) ? m.get(k) : null;
    if (cmd === 'SET') { m.set(k, a[0]); return 'OK'; }
    if (cmd === 'INCR') { const n = (Number(m.get(k)) || 0) + 1; m.set(k, String(n)); return n; }
    if (cmd === 'EXPIRE') return 1;
    if (cmd === 'HINCRBY') { const o = h.get(k) || {}; o[a[0]] = (o[a[0]] || 0) + a[1]; h.set(k, o); return o[a[0]]; }
    if (cmd === 'HGETALL') { const o = h.get(k) || {}; return Object.entries(o).flat().map(String); }
    return null;
  } };
}

const c = { ua: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36', uah: { model: 'SM-A145F', pv: '14.0.0', fv: 'Google Chrome 131.0.6778.135, Chromium 131.0.6778.135' } };
const e = X.bewijs(c);
ja(e['sec-ch-ua-model'] === '"SM-A145F"' && e['sec-ch-ua-platform'] === '"Android"' && /"Google Chrome";v="131.0.6778.135"/.test(e['sec-ch-ua-full-version-list']), 'bewijs: client hints zoals headers');

let kreeg = null, keer = 0;
const nepFetch = async (url, o) => { keer++; kreeg = o; return { ok: true, json: async () => ({ device: { hardwarevendor: 'Samsung', hardwaremodel: 'SM-A145F', hardwarename: ['Galaxy A14'], devicetype: 'SmartPhone', releaseyear: '2023', iscrawler: 'False' } }) }; };
const kv = nepKv();
const r = await X.lees(kv, c, { fetchFn: nepFetch, sleutel: 'test' });
ja(r && r.v === 'Samsung' && r.n === 'Galaxy A14' && r.j === 2023 && r.cr === 0, 'antwoord teruggebracht tot merk, naam, jaar');
ja(kreeg.headers['X-51D-Resource-Key'] === 'test' && !/test/.test(kreeg.body), 'sleutel in de header, niet in de body of url');
await X.lees(kv, c, { fetchFn: nepFetch, sleutel: 'test' });
ja(keer === 1, 'tweede keer hetzelfde toestel uit het geheugen, geen nieuwe opvraag');
const f = X.voorspellers(r, new Date('2026-11-27'));
ja(f.toestel === 'samsung galaxy a14' && f.tjaar === '2-3 jaar oud' && f.ttype === 'smartphone' && !f.tcrawler, 'voorspellers: toestel, leeftijd, soort');
ja(X.voorspellers(X.velden({ device: { iscrawler: 'True', hardwarevendor: 'Unknown' } })).tcrawler === 'ja', 'crawler herkend, Unknown weggelaten');
ja(await X.lees(kv, c, { fetchFn: nepFetch, sleutel: '' }) === null, 'zonder sleutel niets');

const kv2 = nepKv(); kv2.m.set('mm:d51n:' + new Date().toISOString().slice(0, 7), String(X.D51.maand));
ja(await X.lees(kv2, { ua: 'x' }, { fetchFn: nepFetch, sleutel: 'test' }) === null && keer === 1, 'maandgrens: geen opvraag boven ' + X.D51.maand);

const kv3 = nepKv();
await X.lees(kv3, { ua: 'y' }, { fetchFn: async () => ({ ok: false, status: 403, text: async () => 'Resource key not valid' }), sleutel: 'test' });
const st = await X.stand(kv3);
ja(st.fout['403'] === 1 && /403 Resource key/.test(st.laatsteFout || ''), 'fout bewaard en zichtbaar in de stand');

console.log(fout ? fout + ' fout' : 'alles ok (' + ok + ')'); process.exit(fout ? 1 : 0);
