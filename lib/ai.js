// AI — één weg naar de Vercel AI Gateway voor het hele project (Henkjan 20 okt 2026: "maak overal alles token-efficiënt").
// - Elke aanroep krijgt de header ai-reporting-tags (project:hjdk-api,fn:<onderdeel>), zodat de kosten per onderdeel zichtbaar zijn.
// - Het model komt van de opruimlus (GET opruimlus.vercel.app/api/model?p=hjdk-api&m=<gewenst>): 5 minuten in geheugen, time-out 1,5 s,
//   bij een fout het gewenste model. Alleen op Vercel (process.env.VERCEL); uit te zetten met env OPRUIM=uit. Bij het Anthropic
//   /v1/messages-formaat telt alleen een anthropic/*-antwoord, bij chat/completions alleen een model van dezelfde aanbieder.
// - Vaste instructies gaan als systeemprompt met cache_control ephemeral (Anthropic hergebruikt ze binnen 5 minuten voor 10% van de prijs).
// - Antwoorden worden bewaard op (taak + hash van model en invoer) in Redis: dezelfde vraag gaat niet opnieuw naar AI. Alleen
//   bruikbare antwoorden (niet leeg, niet afgekapt, en door de eigen controle van de aanroeper) worden bewaard.
import { createHash } from 'node:crypto';
import { kv } from './db.js';

export const HAIKU = 'anthropic/claude-haiku-5.5';
export const SONNET = 'anthropic/claude-sonnet-5.5';
export const VALLEN = { // reserve als de gateway een model (nog) niet kent
  [HAIKU]: ['anthropic/claude-haiku-4.5'],
  [SONNET]: ['anthropic/claude-sonnet-5', 'anthropic/claude-sonnet-4.5']
};
const GW = 'https://ai-gateway.vercel.sh/v1';
const modellen = new Map();
const hash = s => createHash('sha256').update(s).digest('hex').slice(0, 24);
export const tags = fn => ({ 'ai-reporting-tags': 'project:hjdk-api,fn:' + String(fn || 'onbekend').replace(/[^a-z0-9_.-]/gi, '-').slice(0, 60) });
export const gatewaySleutel = oidc => process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || oidc || '';

export async function kiesModel(gewenst, formaat) {
  if (!process.env.VERCEL || String(process.env.OPRUIM || '').toLowerCase() === 'uit') return gewenst;
  const c = modellen.get(gewenst); if (c && Date.now() - c.at < 300000) return c.model;
  let model = gewenst;
  try {
    const r = await fetch('https://opruimlus.vercel.app/api/model?p=hjdk-api&m=' + encodeURIComponent(gewenst), { signal: AbortSignal.timeout(1500) });
    if (r.ok) { const j = await r.json(); const m = String((j && j.model) || '');
      const past = formaat === 'messages' ? m.startsWith('anthropic/') : m.split('/')[0] === String(gewenst).split('/')[0];
      if (m && past) model = m; }
  } catch (e) {}
  modellen.set(gewenst, { model, at: Date.now() }); return model;
}

function geldig(check, txt) { if (!check) return true; try { return !!check(txt); } catch (e) { return false; } }

// Anthropic /v1/messages via de gateway. o: { fn, model, system, user, max, cacheTtl, check, think, oidc, directKey, timeout }
// system: tekst (wordt één gecachet blok) of een lijst blokken. Antwoord: { txt, model, stop, usage: { in, uit, cacheLees }, cache }
export async function berichten(o) {
  const gewenst = o.model || SONNET; const ck = o.cacheTtl ? 'ai:c:' + o.fn + ':' + hash(JSON.stringify([gewenst, o.system, o.user, o.max])) : null;
  if (ck) { const c = await kv.get(ck).catch(() => null); if (c && c.txt) return Object.assign({ usage: { in: 0, uit: 0, cacheLees: 0 } }, c, { cache: true }); }
  const sleutel = gatewaySleutel(o.oidc); const direct = !sleutel && o.directKey;
  if (!sleutel && !direct) throw new Error('geen toegang tot AI: geen AI Gateway (OIDC) en geen eigen sleutel');
  const eerste = direct ? gewenst : await kiesModel(gewenst, 'messages');
  const lijst = [...new Set([eerste, ...(VALLEN[gewenst] || [])])];
  const system = typeof o.system === 'string' ? (o.system ? [{ type: 'text', text: o.system, cache_control: { type: 'ephemeral' } }] : null) : o.system;
  let last = '', status = 0;
  for (const model of lijst) {
    let think = o.think !== false;
    for (let poging = 0; poging < 2; poging++) {
      const body = { model: direct ? model.replace(/^anthropic\//, '').replace(/\./g, '-') : model, max_tokens: o.max || 2000, messages: [{ role: 'user', content: o.user }] };
      if (system) body.system = system; if (think) body.thinking = { type: 'disabled' };
      const r = await fetch(direct ? 'https://api.anthropic.com/v1/messages' : GW + '/messages', { method: 'POST',
        headers: Object.assign({ 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, direct ? { 'x-api-key': o.directKey } : Object.assign({ authorization: 'Bearer ' + sleutel }, tags(o.fn))),
        body: JSON.stringify(body), signal: o.timeout ? AbortSignal.timeout(o.timeout) : undefined });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        const txt = (Array.isArray(j.content) ? j.content : []).filter(c => c.type === 'text').map(c => c.text).join('') || (typeof j.content === 'string' ? j.content : '');
        const u = j.usage || {}; const uit = { txt, model, stop: j.stop_reason || null, usage: { in: (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0), uit: u.output_tokens || 0, cacheLees: u.cache_read_input_tokens || 0 }, blokken: Array.isArray(j.content) ? j.content.map(c => c.type).join(',') : typeof j.content };
        if (ck && txt.trim() && uit.stop !== 'max_tokens' && geldig(o.check, txt)) await kv.set(ck, { txt, model, stop: uit.stop }, { ex: o.cacheTtl }).catch(() => {});
        return uit;
      }
      status = r.status; last = r.status + ' ' + ((j.error && j.error.message) || JSON.stringify(j).slice(0, 120));
      if (think && r.status === 400 && /thinking/i.test(last)) { think = false; continue; } // model kent 'thinking: disabled' niet
      break;
    }
    if (!(status === 404 || ((status === 400 || status === 422) && /model/i.test(last)))) break; // alleen bij een onbekend model het volgende proberen
  }
  const e = new Error(last.slice(0, 200)); e.status = status; throw e;
}

// OpenAI-formaat /v1/chat/completions via de gateway (o.a. Perplexity voor metingen). o: { fn, model, messages, max, cacheTtl, oidc, timeout }
// Geeft het volledige antwoord (JSON) terug, zoals de gateway het stuurt.
export async function chat(o) {
  const ck = o.cacheTtl ? 'ai:c:' + o.fn + ':' + hash(JSON.stringify([o.model, o.messages, o.max])) : null;
  if (ck) { const c = await kv.get(ck).catch(() => null); if (c && c.choices) return c; }
  const sleutel = gatewaySleutel(o.oidc); if (!sleutel) throw new Error('geen AI Gateway');
  const model = await kiesModel(o.model, 'chat');
  const r = await fetch(GW + '/chat/completions', { method: 'POST', headers: Object.assign({ authorization: 'Bearer ' + sleutel, 'content-type': 'application/json' }, tags(o.fn)),
    body: JSON.stringify({ model, max_tokens: o.max || 700, messages: o.messages }), signal: o.timeout ? AbortSignal.timeout(o.timeout) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(model + ' ' + r.status + ' ' + String((j.error && (j.error.message || j.error)) || '').slice(0, 120));
  if (ck && j.choices) await kv.set(ck, j, { ex: o.cacheTtl }).catch(() => {});
  return j;
}

// invoer kleiner maken: lijsten afkappen, getallen afronden, lange teksten inkorten (voor data die als JSON naar AI gaat)
export function compact(v, n = 12, diepte = 0) {
  if (v == null) return v;
  if (typeof v === 'number') return Number.isInteger(v) ? v : Math.round(v * 100) / 100;
  if (typeof v === 'string') return v.length > 160 ? v.slice(0, 160) : v;
  if (Array.isArray(v)) return v.slice(0, n).map(x => compact(x, n, diepte + 1));
  if (typeof v === 'object') { if (diepte > 4) return undefined; const o = {}; for (const [k, x] of Object.entries(v)) { const c = compact(x, n, diepte + 1); if (c !== undefined && c !== null && !(Array.isArray(c) && !c.length)) o[k] = c; } return o; }
  return v;
}
