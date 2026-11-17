// Stand per 4 uur over alle keuzehulpen (17 nov 2026, Henkjan: "iedere 4 wil ik update van verkeer ERGENS op keuzehulp. Aantal modals getoond
// en geconverteerd. En wat in chats en zoeken gebeurt"). Leest alleen bestaande tellers:
//   bezoek per bron: c:<P>-hv-<dag>-<bron> (lib/kleur.js measureTag, UTC-dag; P = kz, wtbus, wtbde, nexy; zorg telt mee onder kz)
//   winkelkliks: c:<P>-hcs-<dag>-<bron>
//   aanmeldblok en lerende modal: updates:day:<dag>:<site>:<veld> en updates:modal:<dag>:<site> (lib/keuze-updates.js, Curaçao-dag)
//   chats: kz:chat:d:<dag> en kz:chat:log (lib/kzchat.js); zoeken: kz:int:log met bron zoek (lib/intentie.js)
// Met zet=1 wordt deze stand de vergelijking voor de volgende keer (kz:stand4:vorige), zodat "sinds vorige keer" klopt.
import { kv } from './db.js';
import { BRONNEN } from './kleur.js';
import { usageDay } from './guide-usage.js';

const SITES = { kz: 'keuzehulp.best', wtbus: 'whichtobuy.best', wtbde: 'kaufberater.best', nexy: 'nexy.help' };
const UPD = { kz: 'kz', wtbus: 'us', wtbde: 'de' };
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const paren = h => { if (!h) return {}; if (!Array.isArray(h)) return h; const o = {}; for (let i = 0; i + 1 < h.length; i += 2) o[String(h[i])] = h[i + 1]; return o; };
const lijst = async (k, n) => ((await kv.raw(['LRANGE', k, '0', String(n - 1)]).catch(() => [])) || []).map(x => { try { return typeof x === 'string' ? JSON.parse(x) : x; } catch (e) { return null; } }).filter(Boolean);

export async function stand4({ zet = false, uren = 4 } = {}) {
  const nu = Date.now(), d = new Date(nu).toISOString().slice(0, 10), ud = usageDay(), sinds = nu - uren * 3600000;
  const out = { at: new Date(nu).toISOString(), dag: d, sites: {}, totaal: { bezoek: 0, zoek: 0, ai: 0, winkel: 0, blokGezien: 0, modalGezien: 0, aanvraag: 0, bevestigd: 0, chat: 0, zoekvragen: 0 } };
  for (const [p, host] of Object.entries(SITES)) {
    const vals = await kv.mget(...BRONNEN.map(b => 'c:' + p + '-hv-' + d + '-' + b), ...BRONNEN.map(b => 'c:' + p + '-hcs-' + d + '-' + b)).catch(() => []);
    const per = {}; let winkel = 0; BRONNEN.forEach((b, i) => { const n = N(vals[i]); if (n) per[b] = n; winkel += N(vals[BRONNEN.length + i]); });
    const bezoek = Object.values(per).reduce((a, b) => a + b, 0);
    const s = { host, bezoek, perBron: per, winkel };
    if (UPD[p]) {
      const u = UPD[p], v = await kv.mget(...['cta', 'focus', 'request', 'confirmed'].map(k => 'updates:day:' + ud + ':' + u + ':' + k)).catch(() => []);
      const m = paren(await kv.raw(['HGETALL', 'updates:modal:' + ud + ':' + u]).catch(() => null));
      s.aanmeld = { gezien: N(v[0]), veld: N(v[1]), aanvraag: N(v[2]), bevestigd: N(v[3]) };
      s.modal = { gezien: N(m.cta), veld: N(m.focus), aanvraag: N(m.request), bevestigd: N(m.confirmed) };
      out.totaal.blokGezien += s.aanmeld.gezien; out.totaal.modalGezien += s.modal.gezien; out.totaal.aanvraag += s.aanmeld.aanvraag; out.totaal.bevestigd += s.aanmeld.bevestigd;
    }
    out.sites[p] = s; out.totaal.bezoek += bezoek; out.totaal.winkel += winkel;
    out.totaal.zoek += N(per.google) + N(per.bing) + N(per.duckduckgo); out.totaal.ai += N(per.chatgpt) + N(per.perplexity) + N(per.copilot) + N(per.gemini);
  }
  out.chatDag = paren(await kv.raw(['HGETALL', 'kz:chat:d:' + d]).catch(() => null));
  const chats = (await lijst('kz:chat:log', 300)).filter(r => N(r.t) >= sinds);
  out.chats = chats.map(r => ({ tijd: new Date(r.t).toISOString().slice(11, 16), site: r.site, pagina: r.s, vraag: String(r.v || '').slice(0, 160), beantwoord: !!r.weet, doorverwezen: r.p || '', samen: !!r.samen, wat: r.i && r.i.wat || '' }));
  out.totaal.chat = chats.length;
  const zoek = (await lijst('kz:int:log', 500)).filter(r => r.bron === 'zoek' && Date.parse(String(r.at || '') + ':00Z') >= sinds);
  out.zoekvragen = zoek.map(r => ({ tijd: String(r.at || '').slice(11, 16), site: r.site, zoek: String(r.q || '').slice(0, 100), gevonden: !!r.m }));
  out.totaal.zoekvragen = zoek.length;
  let vorige = null; try { vorige = await kv.get('kz:stand4:vorige'); } catch (e) {}
  if (vorige && vorige.totaal) { const zelfde = vorige.dag === d; out.sindsVorige = { vanaf: vorige.at, ...Object.fromEntries(Object.keys(out.totaal).map(k => [k, zelfde && !['chat', 'zoekvragen'].includes(k) ? out.totaal[k] - N(vorige.totaal[k]) : out.totaal[k]])) }; }
  if (zet) { try { await kv.set('kz:stand4:vorige', { at: out.at, dag: d, totaal: out.totaal }, { ex: 3 * 86400 }); } catch (e) {} }
  return out;
}

export function stand4Tekst(o) {
  const t = o.totaal, r = ['Keuzehulpen, stand ' + o.at.slice(0, 16).replace('T', ' ') + ' UTC (vandaag tot nu)'];
  for (const s of Object.values(o.sites)) {
    const bron = Object.entries(s.perBron).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => k + ' ' + v).join(', ');
    let x = s.host + ': ' + s.bezoek + ' bezoeken' + (bron ? ' (' + bron + ')' : '') + (s.winkel ? ', ' + s.winkel + ' naar de winkel' : '');
    if (s.aanmeld) x += '; aanmeldblok ' + s.aanmeld.gezien + ' keer gezien, ' + s.aanmeld.aanvraag + ' aanmeldingen, ' + s.aanmeld.bevestigd + ' bevestigd; modal ' + s.modal.gezien + ' keer getoond, ' + s.modal.aanvraag + ' aangemeld';
    r.push(x);
  }
  if (o.sindsVorige) r.push('Sinds vorige stand (' + String(o.sindsVorige.vanaf).slice(11, 16) + ' UTC): ' + o.sindsVorige.bezoek + ' bezoeken, ' + o.sindsVorige.zoek + ' uit Google/Bing, ' + o.sindsVorige.ai + ' uit AI, ' + o.sindsVorige.modalGezien + ' modals getoond, ' + o.sindsVorige.aanvraag + ' aanmeldingen');
  r.push('Chats laatste 4 uur: ' + o.chats.length + (o.chats.length ? ' (' + o.chats.filter(c => c.beantwoord).length + ' beantwoord)' : ''));
  o.chats.slice(0, 12).forEach(c => r.push('  ' + c.tijd + ' ' + c.site + '/' + c.pagina + ': ' + c.vraag + (c.beantwoord ? '' : ' [nog geen antwoord]')));
  r.push('Zoekvragen laatste 4 uur: ' + o.zoekvragen.length);
  o.zoekvragen.slice(0, 12).forEach(z => r.push('  ' + z.tijd + ' ' + z.site + ': ' + z.zoek + (z.gevonden ? '' : ' [geen keuzehulp]')));
  return r.join('\n');
}
