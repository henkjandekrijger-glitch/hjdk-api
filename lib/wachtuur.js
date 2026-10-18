// Clickmind-uurwacht (Henkjan 16 okt: "voer alles wat je kunt verbeteren door aan Clickmind, we laten dingen liggen!!").
// Elk uur op :47, alleen meten en melden (nooit stoppen, nooit bod, budget of targeting wijzigen):
//  1. Aankomst per netwerk en per campagne: wat het netwerk afrekent tegen wat er via /go binnenkomt (UTC-dag).
//     PropellerAds via de lus (propellerads-mcp /api/statistiek, die heeft de sleutel), Mondiad via de Mondiad-MCP.
//     Aanleiding 16-17 okt: van de PropellerAds-kliks op /go-campagnes kwam 71% aan (252 afgerekend, 180 bij /go,
//     00:00-01:20 UTC); bij Mondiad op 16 okt 24% (12.564 tegen 2.959, deels door de volle database van 06:00-14:00 UTC).
//     /go antwoordt in ±15 ms (Vercel, p50), dus het verlies zit niet in de snelheid van /go.
//  2. Geen-koper-alarm: geld vandaag naar tags die volgens de Associates-meter geen kopers geven (les ml-push-20:
//     15 okt 4.562 Amazon-kliks en minder dan 5 artikelen, 16 okt liep het de hele dag door: $27,77 en 6.966 kliks).
//  3. Verzadiging per tag (lib/termles.js).
//  4. Campagnes naar eigen pagina's (lib/eigenwacht.js): Yoors Shop per campagne en per uur, todayin met NL apart, MyLevel.
// Uitkomst in mm:wachtuur:laatst (overzicht, overdracht) en per nieuw alarm (één keer per dag) een Telegram-bericht aan Henkjan via
// het doorgeefluik van todayin-spel (/api/meld, sleutel MELD_SLEUTEL in beide projecten).
import { md } from './mdmcp.js';
import { tagGeenKoper, verzadiging } from './termles.js';
import { eigenPaginas } from './eigenwacht.js';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const r2 = x => Math.round(N(x) * 100) / 100;
const pct = (a, b) => (b ? Math.round(1000 * a / b) / 10 : null);
const rows = x => (Array.isArray(x) ? x : Array.isArray(x && x.data) ? x.data : Array.isArray(x && x.items) ? x.items : Array.isArray(x && x.rows) ? x.rows : Array.isArray(x && x.content) ? x.content : []);
export const GRENS = { netMinKliks: 300, netAlarm: 60, campMinKliks: 100, campLaag: 40, campKapotKliks: 50, geldMin: 0.5 };

// tag uit de campagnenaam: een overschreven tag ("| tag X") gaat voor, anders de laatste Amazon-tag in de naam
export function tagUitNaam(naam) {
  const s = String(naam || ''); const o = /\|\s*tag\s+([a-z0-9][a-z0-9-]{1,48}-2[0-2])\b/i.exec(s); if (o) return o[1].toLowerCase();
  const m = s.match(/\b[a-z0-9][a-z0-9-]{1,48}-2[0-2]\b/gi); return m ? m[m.length - 1].toLowerCase() : null;
}

// /go-kliks per netwerk|campagne voor een UTC-dag (zelfde bron als /api/mm/proef)
async function goPerCampagne(kv, d) {
  const uit = {}; let h = null; try { h = await kv.raw(['HGETALL', 'mm:arm:' + d]); } catch (e) { return { fout: String(e.message || e).slice(0, 120), m: uit }; }
  for (let i = 0; h && i < h.length; i += 2) {
    const p = String(h[i]).split('|'); if (p.length < 5 || p.slice(4).join('|') !== 'n') continue;
    const k = p[0] + '|' + p[1], x = uit[k] || (uit[k] = { n: 0, tags: {} }); x.n += N(h[i + 1]); x.tags[p[3]] = 1;
  }
  return { m: uit };
}

export async function paPerCampagne(d) {
  const s = process.env.SHOP_SLEUTEL || ''; if (!s) return { fout: 'geen SHOP_SLEUTEL', rijen: [] };
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 28000);
  try {
    const r = await fetch((process.env.PA_LUS_URL || 'https://propellerads-mcp.vercel.app') + '/api/statistiek', { method: 'POST', headers: { 'content-type': 'application/json', 'x-shop-sleutel': s }, body: JSON.stringify({ perCampagne: true, dag: d, tz: '+0000' }), signal: ac.signal });
    const j = await r.json().catch(() => ({})); if (!j || !j.ok) return { fout: String((j && j.fout) || 'HTTP ' + r.status).slice(0, 120), rijen: [] };
    return { rijen: (j.rijen || []).map(x => ({ camp: String(x.camp), naam: String(x.naam || ''), kliks: N(x.kliks), kosten: N(x.kosten) })) };
  } catch (e) { return { fout: String(e.message || e).slice(0, 120), rijen: [] }; } finally { clearTimeout(t); }
}

export async function mdPerCampagne(d) {
  try {
    const per = {};
    for (const r of rows(await md('mondiad_campaign_report', { startDate: d, endDate: d, breakdown: 'CAMPAIGN', size: 1000 }))) {
      const id = String(r.campaignId || ''); if (!id) continue; const x = per[id] || (per[id] = { camp: id, naam: String(r.campaignName || ''), kliks: 0, kosten: 0 });
      x.kliks += N(r.clicks); x.kosten += N(r.spent);
    }
    return { rijen: Object.values(per) };
  } catch (e) { return { fout: String(e.message || e).slice(0, 120), rijen: [] }; }
}

const isGoNaam = n => /\|\s*go\s*$/i.test(String(n || '')) || /\bGO\b/.test(String(n || ''));

async function telegram(tekst) {
  // eerst het doorgeefluik van todayin-spel (daar staat de Telegram-koppeling van Henkjan), anders een eigen bot als die hier staat
  const s = process.env.MELD_SLEUTEL;
  if (s) { try { const r = await fetch((process.env.MELD_URL || 'https://spel.todayin.email') + '/api/meld', { method: 'POST', headers: { 'content-type': 'application/json', 'x-meld-sleutel': s }, body: JSON.stringify({ bron: 'Clickmind', tekst: tekst.slice(0, 3400) }), signal: AbortSignal.timeout(10000) }); const j = await r.json().catch(() => ({})); if (j && j.ok) return true; } catch (e) {} }
  const tok = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID; if (!tok || !chat) return false;
  try { const r = await fetch('https://api.telegram.org/bot' + tok + '/sendMessage', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: chat, text: tekst.slice(0, 3900), disable_web_page_preview: true }), signal: AbortSignal.timeout(8000) }); return r.ok; } catch (e) { return false; }
}

// proefbericht via het doorgeefluik (beschermde host: /api/mm/wachtuur?test=1)
export async function meldTest() { return { ok: await telegram('Proef: Clickmind-alarmen komen voortaan hier binnen (aankomst per netwerk, geld naar tags zonder kopers, verzadiging). Eén bericht per nieuw alarm per dag.') }; }

export async function wachtUur(kv, { dag, droog = false } = {}) {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(String(dag || '')) ? dag : new Date().toISOString().slice(0, 10);
  const [go, pa, mo] = await Promise.all([goPerCampagne(kv, d), paPerCampagne(d), mdPerCampagne(d)]);
  const bron = { propeller: pa, mondiad: mo }, alarmen = [], netten = {}, campagnes = [];

  // 1. aankomst
  for (const net of ['propeller', 'mondiad']) {
    const b = bron[net]; if (b.fout) { alarmen.push({ soort: 'meting', sleutel: 'meting|' + net, tekst: net + ': netwerkcijfers niet op te halen (' + b.fout + ')' }); continue; }
    let k = 0, a = 0, kosten = 0;
    for (const r of b.rijen) {
      const g = go.m[net + '|' + r.camp]; const viaGo = !!g || (net === 'mondiad' && isGoNaam(r.naam) && r.kliks > 0);
      if (!viaGo) continue;
      const n = g ? g.n : 0; k += r.kliks; a += n; kosten += r.kosten;
      const c = { net, camp: r.camp, naam: r.naam.slice(0, 80), kliks: r.kliks, aangekomen: n, pct: pct(n, r.kliks), kosten: r2(r.kosten) };
      campagnes.push(c);
      if (r.kliks >= GRENS.campKapotKliks && n === 0) alarmen.push({ soort: 'aankomst', sleutel: 'kapot|' + net + '|' + r.camp, tekst: net + ' ' + r.camp + ': ' + r.kliks + ' kliks afgerekend en 0 aangekomen bij /go. Link kapot of alles nep? (' + c.naam + ')' });
    }
    netten[net] = { kliks: k, aangekomen: a, pct: pct(a, k), kosten: r2(kosten) };
    if (k >= GRENS.netMinKliks && pct(a, k) < GRENS.netAlarm) alarmen.push({ soort: 'aankomst', sleutel: 'net|' + net, tekst: net + ': van ' + k + ' afgerekende kliks op /go-campagnes kwamen er ' + a + ' aan (' + pct(a, k) + '%) vandaag (UTC).' });
  }
  campagnes.sort((x, y) => N(x.pct) - N(y.pct));

  // aankomst in het laatste uur: verschil met de vorige meting van dezelfde dag
  let vorige = null; try { const l = await kv.raw(['LRANGE', 'mm:aankomst:log', 0, 0]); vorige = l && l[0] ? JSON.parse(l[0]) : null; } catch (e) {}
  const uur = {};
  if (vorige && vorige.dag === d) for (const net of Object.keys(netten)) { const v = (vorige.netten || {})[net]; if (!v) continue; const dk = netten[net].kliks - N(v.kliks), da = netten[net].aangekomen - N(v.aangekomen); if (dk > 0) uur[net] = { kliks: dk, aangekomen: da, pct: pct(da, dk), sinds: vorige.t }; }

  // 2. geld vandaag naar tags zonder kopers
  const perTag = {};
  for (const net of ['propeller', 'mondiad']) for (const r of bron[net].rijen) {
    if (r.kosten <= 0) continue; const g = go.m[net + '|' + r.camp]; const tags = g ? Object.keys(g.tags) : [tagUitNaam(r.naam)].filter(Boolean);
    for (const t of tags) { const x = perTag[t] || (perTag[t] = { tag: t, kosten: 0, kliks: 0, campagnes: 0, netten: {} }); x.kosten += r.kosten / tags.length; x.kliks += r.kliks / tags.length; x.campagnes++; x.netten[net] = 1; }
  }
  const tagLijst = Object.values(perTag).filter(x => x.kosten >= GRENS.geldMin).sort((a, b) => b.kosten - a.kosten).slice(0, 60);
  const geenKoper = [];
  for (const x of tagLijst) {
    const g = await tagGeenKoper(kv, x.tag).catch(() => null); if (!g || !g.geenKoper) continue;
    const y = { tag: x.tag, kostenVandaag: r2(x.kosten), kliksVandaag: Math.round(x.kliks), campagnes: x.campagnes, netwerken: Object.keys(x.netten), waarom: g.waarom };
    geenKoper.push(y);
    alarmen.push({ soort: 'geenkoper', sleutel: 'geenkoper|' + x.tag, tekst: 'Tag ' + x.tag + ' kost vandaag $' + y.kostenVandaag + ' in ' + y.campagnes + ' campagnes (' + y.netwerken.join(', ') + '), maar gaf geen kopers: ' + g.waarom + '. Stoppen kan op jouw woord.' });
  }

  // 3. verzadiging
  const verz = await verzadiging(kv).catch(() => null);
  for (const v of (verz && verz.verzadigd) || []) alarmen.push({ soort: 'verzadiging', sleutel: 'verz|' + v.tag + '|' + verz.dag, tekst: 'Tag ' + v.tag + ' op ' + verz.dag + ': kliks ' + (v.kliksPct >= 0 ? '+' : '') + v.kliksPct + '%, artikelen ' + (v.artikelenPct >= 0 ? '+' : '') + v.artikelenPct + '%' + (v.omzetPct == null ? '' : ', omzet ' + (v.omzetPct >= 0 ? '+' : '') + v.omzetPct + '%') + '. Meer kliks van dezelfde mensen, niet meer kopers.' });

  // 4. campagnes naar eigen pagina's: Yoors Shop, todayin (ook NL apart), MyLevel (lib/eigenwacht.js)
  const eigen = await eigenPaginas(kv, d, { pa: pa.rijen || [], mo: mo.rijen || [] }).catch(e => ({ fout: String(e.message || e).slice(0, 120), alarmen: [] }));
  for (const a of eigen.alarmen || []) alarmen.push(a);
  // 4b. ingrijpen in plaats van alleen melden (lib/tagstop.js, Henkjan 18 okt: "Kan CM niet proactief naar de campagne
  // sturen want dit is niet goed en kost geld" + "die grijpt in op alle projecten"). De blanket op Associates-tags, de
  // andere projecten op hun eigen uitkomsten. PropellerAds haalt het voorstel elk uur op; Mondiad pauzeren we zelf.
  let ingreep = null;
  try { const { ingreepRonde } = await import('./tagstop.js'); ingreep = await ingreepRonde(kv, { camps: eigen.campagnes || [], paRijen: pa.rijen || [], moRijen: mo.rijen || [], droog }); }
  catch (e) { ingreep = { fout: String(e.message || e).slice(0, 160) }; }
  for (const [net, s] of Object.entries((ingreep && ingreep.netten) || {})) if (s.campagnes) alarmen.push({ soort: 'ingreep', sleutel: 'ingreep|' + net + '|' + d + '|' + s.campagnes, tekst: 'Clickmind zet ' + s.campagnes + ' campagnes stil op ' + net + ': ' + s.samenvatting });
  // zonder Associates-cijfers kan de blanket niet beoordeeld worden; dan liever één keer per dag een melding dan stil blijven
  const vo = ingreep && ingreep.voeding;
  if (vo && !vo.aanwezig) alarmen.push({ soort: 'voeding', sleutel: 'voeding|' + vo.laatsteHeleDag, tekst: 'Associates-cijfers van ' + vo.laatsteHeleDag + ' ontbreken in Clickmind. De blanket wordt nu op oudere dagen beoordeeld; de dagtaak heeft ze niet ingeschoten.' });
  // 5. per uniek mens (lib/mensgeld.js): kliks per mens, herhaalkliks en geld naar mensen die we die dag al hadden
  let mensgeld = null; try { const { mensgeld: mg } = await import('./mensgeld.js'); const m = await mg(kv, { dag: d, pa, mo }); mensgeld = { totaal: m.totaal, zinnen: m.zinnen, netLand: m.netLand, tags: m.tags.slice(0, 15) }; } catch (e) { mensgeld = { fout: String(e.message || e).slice(0, 120) }; }
  const uit = { ok: true, bijgewerkt: new Date().toISOString(), dag: d, grenzen: GRENS, netten, laatsteUur: uur, laagsteCampagnes: campagnes.filter(c => c.kliks >= GRENS.campMinKliks).slice(0, 25), geenKoper, mensgeld, verzadiging: verz, eigen: { projecten: eigen.projecten, winkel: eigen.winkel, campagnes: eigen.campagnes, fout: eigen.fout || null }, ingreep, alarmen, goFout: go.fout || null };
  if (droog) return uit;
  try { await kv.set('mm:wachtuur:laatst', uit, { ex: 3 * 86400 }); } catch (e) {}
  try { const { deployLog } = await import('./handover.js'); await deployLog(kv); } catch (e) {}
  try { await kv.raw(['LPUSH', 'mm:aankomst:log', JSON.stringify({ t: uit.bijgewerkt, dag: d, netten })]); await kv.raw(['LTRIM', 'mm:aankomst:log', 0, 71]); } catch (e) {}
  // nieuw alarm: één keer per dag melden
  const nieuw = [];
  for (const a of alarmen) { if (a.soort === 'meting') continue; let n = 0; try { n = N(await kv.raw(['SADD', 'mm:alarm:gemeld:' + d, a.sleutel])); if (n) await kv.raw(['EXPIRE', 'mm:alarm:gemeld:' + d, 3 * 86400]); } catch (e) {} if (n) nieuw.push(a); }
  if (nieuw.length) {
    try { for (const a of nieuw) await kv.raw(['LPUSH', 'mm:alarm:log', JSON.stringify({ t: uit.bijgewerkt, ...a })]); await kv.raw(['LTRIM', 'mm:alarm:log', 0, 199]); } catch (e) {}
    uit.telegram = await telegram('Clickmind ' + d + '\n' + nieuw.map(a => '- ' + a.tekst).join('\n'));
  }
  uit.nieuw = nieuw.length;
  return uit;
}
