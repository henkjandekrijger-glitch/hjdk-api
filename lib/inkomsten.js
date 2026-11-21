// Eén overzicht van alle affiliate-inkomsten (Henkjan 21 nov 2026: "We moeten 1 dashbord voor inkomsten maken").
// Bronnen: bol (orderrapport via /api/bol?op=report), Awin (transacties via AWIN_TOKEN, alle adverteerders). Later erbij: Daisycon, Impact, Amazon.
// Live: https://keuzehulp.best/api/bol?op=inkomsten&vorm=html (JSON zonder vorm). Bedragen zijn commissie, niet omzet.
import { kv } from './db.js';

const dag = t => new Date(t).toISOString().slice(0, 10);
const r2 = x => Math.round(x * 100) / 100;

async function bol(dagen) {
  const van = dag(Date.now() - (dagen - 1) * 864e5), tot = dag(Date.now());
  const r = await fetch('https://keuzehulp.best/api/bol?op=report&what=orders&from=' + van + '&to=' + tot, { signal: AbortSignal.timeout(25000) }).catch(() => null);
  const j = r && r.ok ? await r.json().catch(() => null) : null;
  if (!j || !j.ok) return { ok: false, fout: (j && j.error) || 'bol-rapport niet bereikbaar', perDag: {} };
  const perDag = {}; for (const [d, x] of Object.entries(j.byDay || {})) perDag[d] = { commissie: r2(x.commission || 0), orders: x.orders || 0, kliks: x.clicks || 0 };
  return { ok: true, perDag, totaal: r2((j.total || {}).commission || 0), orders: (j.total || {}).orders || 0 };
}

async function awin(dagen) {
  const token = process.env.AWIN_TOKEN; if (!token) return { ok: false, fout: 'geen AWIN_TOKEN', perDag: {} };
  const f = d => d.toISOString().slice(0, 19), tot = new Date(), van = new Date(Date.now() - Math.min(31, dagen) * 864e5);
  const r = await fetch('https://api.awin.com/publishers/3159915/transactions/?startDate=' + f(van) + '&endDate=' + f(tot) + '&timezone=UTC', { headers: { authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(20000) }).catch(() => null);
  if (!r || !r.ok) return { ok: false, fout: 'awin ' + (r ? r.status : 'geen antwoord'), perDag: {} };
  const lijst = await r.json().catch(() => []);
  const namen = (await kv.get('ink:awin:namen').catch(() => null)) || {};
  const perDag = {}, perMerk = {}, perStatus = {};
  for (const t of Array.isArray(lijst) ? lijst : []) {
    const d = String(t.transactionDate || t.clickDate || '').slice(0, 10) || '?', c = Number((t.commissionAmount || {}).amount) || 0, st = String(t.commissionStatus || '?');
    if (st === 'declined') { perStatus[st] = r2((perStatus[st] || 0) + c); continue; }
    const x = perDag[d] || (perDag[d] = { commissie: 0, orders: 0 }); x.commissie = r2(x.commissie + c); x.orders++;
    const m = namen[t.advertiserId] || ('Awin ' + t.advertiserId); perMerk[m] = r2((perMerk[m] || 0) + c);
    perStatus[st] = r2((perStatus[st] || 0) + c);
  }
  return { ok: true, perDag, perMerk, perStatus, totaal: r2(Object.values(perDag).reduce((s, x) => s + x.commissie, 0)) };
}

export async function inkomsten(dagen = 30) {
  dagen = Math.max(1, Math.min(31, Number(dagen) || 30));
  const [b, a] = await Promise.all([bol(dagen).catch(e => ({ ok: false, fout: String(e.message || e), perDag: {} })), awin(dagen).catch(e => ({ ok: false, fout: String(e.message || e), perDag: {} }))]);
  const bronnen = { bol: b, awin: a };
  const dagenLijst = [...Array(dagen)].map((_, i) => dag(Date.now() - i * 864e5));
  const rijen = dagenLijst.map(d => { const x = { dag: d, totaal: 0 }; for (const [n, s] of Object.entries(bronnen)) { const v = ((s.perDag || {})[d] || {}).commissie || 0; x[n] = v; x.totaal = r2(x.totaal + v); } return x; });
  const som = n => r2(rijen.slice(0, n).reduce((s, x) => s + x.totaal, 0));
  return { ok: true, at: new Date().toISOString(), dagen, vandaag: som(1), week: som(7), maand: som(dagen), perBron: Object.fromEntries(Object.entries(bronnen).map(([n, s]) => [n, { ok: s.ok, totaal: s.totaal || 0, fout: s.fout }])), awinPerMerk: a.perMerk || {}, awinStatus: a.perStatus || {}, rijen };
}

const eu = x => '€ ' + Number(x || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Pagina: max contrast, geen grijs, gewone tekst 16 px. Nullen niet tonen: een dag zonder inkomsten krijgt een lege cel.
export function inkomstenHtml(x) {
  const bron = Object.keys(x.perBron);
  const cel = v => v ? eu(v) : '';
  const tegel = (l, v) => '<div class="t"><div class="l">' + l + '</div><div class="v">' + eu(v) + '</div></div>';
  const merken = Object.entries(x.awinPerMerk).sort((a, b) => b[1] - a[1]);
  const fouten = Object.entries(x.perBron).filter(([, s]) => !s.ok).map(([n, s]) => n + ': ' + s.fout);
  return '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Inkomsten AdsFair</title><style>'
    + 'body{margin:0;font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111113;background:#fff}main{max-width:900px;margin:auto;padding:24px 18px 60px}h1{font-size:30px;margin:0 0 4px}h2{font-size:18px;margin:32px 0 10px}'
    + '.r{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:20px 0}.t{border:1px solid #D7DCE8;border-radius:16px;padding:16px}.l{font-size:13px;font-weight:700;text-transform:uppercase}.v{font-size:24px;font-weight:700}'
    + 'table{border-collapse:separate;border-spacing:0;width:100%;border:1px solid #D7DCE8;border-radius:16px;overflow:hidden}th,td{text-align:left;padding:12px 16px;border-bottom:1px solid #D7DCE8}th{font-size:13px}tr:last-child td{border-bottom:0}td.n,th.n{text-align:right}.f{border:2px solid #111113;border-radius:16px;padding:12px 16px;margin:16px 0}'
    + '</style></head><body><main><h1>Inkomsten</h1><p>Commissie per dag uit ' + bron.join(' en ') + '. Bijgewerkt ' + esc(new Date(x.at).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })) + '.</p>'
    + (fouten.length ? '<div class="f">Niet opgehaald: ' + esc(fouten.join('; ')) + '</div>' : '')
    + '<div class="r">' + tegel('Vandaag', x.vandaag) + tegel('7 dagen', x.week) + tegel(x.dagen + ' dagen', x.maand) + '</div>'
    + '<h2>Per bron, ' + x.dagen + ' dagen</h2><table><tr><th>Bron</th><th class="n">Commissie</th></tr>' + bron.map(n => '<tr><td>' + esc(n) + '</td><td class="n">' + eu(x.perBron[n].totaal) + '</td></tr>').join('') + '</table>'
    + (merken.length ? '<h2>Awin per adverteerder</h2><table><tr><th>Adverteerder</th><th class="n">Commissie</th></tr>' + merken.map(([m, v]) => '<tr><td>' + esc(m) + '</td><td class="n">' + eu(v) + '</td></tr>').join('') + '</table>' : '')
    + '<h2>Per dag</h2><table><tr><th>Dag</th>' + bron.map(n => '<th class="n">' + esc(n) + '</th>').join('') + '<th class="n">Totaal</th></tr>' + x.rijen.map(r => '<tr><td>' + r.dag + '</td>' + bron.map(n => '<td class="n">' + cel(r[n]) + '</td>').join('') + '<td class="n"><strong>' + cel(r.totaal) + '</strong></td></tr>').join('') + '</table>'
    + '</main></body></html>';
}

// Namen van Awin-adverteerders (id -> naam) eens per dag bijwerken uit de lijst met toegelaten programma's.
export async function awinNamen() {
  const token = process.env.AWIN_TOKEN; if (!token) return { ok: false };
  const r = await fetch('https://api.awin.com/publishers/3159915/programmes?relationship=joined', { headers: { authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(20000) }).catch(() => null);
  const l = r && r.ok ? await r.json().catch(() => []) : [];
  const m = Object.fromEntries((Array.isArray(l) ? l : []).map(p => [p.id, p.name]));
  if (Object.keys(m).length) await kv.set('ink:awin:namen', m, { ex: 7 * 86400 }).catch(() => {});
  return { ok: true, n: Object.keys(m).length };
}
