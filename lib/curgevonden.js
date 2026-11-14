// Gevonden in Google, ChatGPT, Claude en Perplexity, per bedrijf (Henkjan 14 nov 2026: "Zet bij elk bedrijf x gevonden google x gevonden in
// chatgpt , claude etc . Zorg dat deze trigger er is voor de ondernemer ."). Drie bronnen, allemaal echt gemeten:
//  - Google: vertoningen in de zoekresultaten van de bedrijfspagina (Search Console, 28 dagen, alle talen samen). De dagronde van
//    /api/gsc?op=dag (02:40 UTC) schrijft ze met gscRonde() naar kv cur:gsc:gv.
//  - AI-assistenten: elke keer dat ChatGPT (ChatGPT-User, OAI-SearchBot), Claude (Claude-User, Claude-SearchBot, ClaudeBot), Perplexity of Gemini
//    de pagina ophaalt (telBotZaak in de route), plus elke bezoeker die vanuit een assistent of Google binnenkomt (verwijzer, telBezoek via hit()).
//    Per maand een hash cur:gv:<JJJJ-MM>; getoond wordt deze plus vorige maand. Pagina's staan een uur in de CDN-cache, dus de AI-telling is een
//    ondergrens.
// Nooit 0 tonen (Henkjan 11 nov 2026): een bron zonder telling valt weg, zonder enige telling geen blok.
import { kv } from './db.js';

const MAAND = (d = new Date()) => d.toISOString().slice(0, 7);
const VORIGE = () => { const d = new Date(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - 1); return MAAND(d); };
export const BRONNEN = ['google', 'chatgpt', 'claude', 'perplexity', 'gemini', 'copilot'];
const AI_UA = [['chatgpt', /ChatGPT-User|OAI-SearchBot/i], ['claude', /Claude-User|Claude-SearchBot|ClaudeBot/i], ['perplexity', /Perplexity/i], ['gemini', /Gemini-Deep-Research|GoogleAgent/i]];
const veilig = s => String(s || '').toLowerCase().replace(/[^a-z0-9/:-]/g, '').slice(0, 90);
export const sleutelGids = (cs, slug) => 'g:' + veilig(cs) + '/' + veilig(slug);
export const sleutelOnderwerp = (oid, bid) => 't:' + veilig(oid) + '/' + veilig(bid);
const sleutelSlug = slug => 's:' + veilig(slug).slice(0, 36);

async function erbij(veld) { const k = 'cur:gv:' + MAAND(); try { await kv.raw(['HINCRBY', k, veld, 1]); await kv.raw(['EXPIRE', k, 100 * 86400]); } catch (e) {} }
// in de route van een bedrijfspagina: telt alleen AI-assistenten
export async function telBotZaak(req, sleutel) { const ua = String((req.headers && req.headers['user-agent']) || ''); const b = AI_UA.find(x => x[1].test(ua)); if (b) await erbij(sleutel + '|' + b[0]); }
// uit hit(): k = gv-<bron>-<slug> (de pagina stuurt dit als de verwijzer Google of een assistent is)
export async function telBezoek(k) { const m = /^gv-(google|chatgpt|claude|perplexity|gemini|copilot)-([a-z0-9-]+)$/.exec(String(k || '')); if (m) await erbij(sleutelSlug(m[2]) + '|' + m[1] + '-b'); }
// script voor de bedrijfspagina: verwijzer naar bron
export const verwijzerJs = slug => '<script>try{var r=document.referrer||"",b=/chatgpt\\.com|chat\\.openai\\.com/.test(r)?"chatgpt":/claude\\.ai/.test(r)?"claude":/perplexity\\.ai/.test(r)?"perplexity":/gemini\\.google/.test(r)?"gemini":/copilot\\.microsoft|bing\\.com\\/chat/.test(r)?"copilot":/(^|\\.)google\\./.test(r.split("/")[2]||"")?"google":"";if(b&&window.__curHit)window.__curHit("gv-"+b+"-"+' + JSON.stringify(String(slug).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 36)) + ')}catch(e){}</script>';

const CACHE = { t: 0, p: null };
async function gscKaart() { if (CACHE.p && Date.now() - CACHE.t < 600e3) return CACHE.p; const d = await kv.get('cur:gsc:gv').catch(() => null); CACHE.p = (d && d.p) || {}; CACHE.t = Date.now(); return CACHE.p; }

// { google, chatgpt, claude, perplexity, gemini, copilot } alleen bronnen boven 0
export async function gevonden(sleutel, slug) {
  const velden = []; for (const b of BRONNEN) { velden.push(sleutel + '|' + b); if (slug) velden.push(sleutelSlug(slug) + '|' + b + '-b'); }
  const [a, v, g] = await Promise.all([kv.raw(['HMGET', 'cur:gv:' + MAAND(), ...velden]).catch(() => []), kv.raw(['HMGET', 'cur:gv:' + VORIGE(), ...velden]).catch(() => []), gscKaart()]);
  const uit = {}; velden.forEach((f, i) => { const n = (Number((a || [])[i]) || 0) + (Number((v || [])[i]) || 0); if (!n) return; const b = f.split('|')[1].replace(/-b$/, ''); uit[b] = (uit[b] || 0) + n; });
  const G = g[sleutel]; if (G && G.imp) uit.google = (uit.google || 0) + G.imp;
  return uit;
}

const NAAM = { google: 'Google', chatgpt: 'ChatGPT', claude: 'Claude', perplexity: 'Perplexity', gemini: 'Gemini', copilot: 'Copilot' };
const GT = {
  nl: { kop: 'Zo vaak gevonden', sinds: d => 'sinds ' + d, uitleg: 'Google: keer getoond in de zoekresultaten (28 dagen). ChatGPT, Claude en Perplexity: keer dat de assistent deze pagina las voor iemand of een bezoeker doorstuurde.', eig: 'Is dit jouw zaak? Zie je cijfers en claim gratis →' },
  en: { kop: 'Found this many times', sinds: d => 'since ' + d, uitleg: 'Google: times shown in search results (28 days). ChatGPT, Claude and Perplexity: times the assistant read this page for someone or sent a visitor here.', eig: 'Is this your business? See your numbers and claim for free →' },
  de: { kop: 'So oft gefunden', sinds: d => 'seit ' + d, uitleg: 'Google: Einblendungen in den Suchergebnissen (28 Tage). ChatGPT, Claude und Perplexity: wie oft der Assistent diese Seite für jemanden gelesen oder einen Besucher geschickt hat.', eig: 'Ist das dein Unternehmen? Zahlen ansehen und kostenlos übernehmen →' },
  es: { kop: 'Encontrado tantas veces', sinds: d => 'desde ' + d, uitleg: 'Google: veces mostrado en los resultados de búsqueda (28 días). ChatGPT, Claude y Perplexity: veces que el asistente leyó esta página para alguien o envió un visitante.', eig: '¿Es tu negocio? Ver tus cifras y reclamar gratis →' },
  pt: { kop: 'Encontrado tantas vezes', sinds: d => 'desde ' + d, uitleg: 'Google: vezes exibido nos resultados de busca (28 dias). ChatGPT, Claude e Perplexity: vezes que o assistente leu esta página para alguém ou enviou um visitante.', eig: 'É o seu negócio? Ver seus números e reivindicar grátis →' },
};
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const GV_CSS = '.gv{margin:18px 0;padding:14px 16px;border-radius:14px;background:#EEF1FC}.gv .gv-k{margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#2A3566}.gv ul{display:flex;flex-wrap:wrap;gap:8px 18px;list-style:none;margin:0;padding:0}.gv li{font-size:16px;color:#111113}.gv li b{font-size:20px}.gv .gv-u{margin:8px 0 0;font-size:12.5px;color:#2A3566}.gv a{font-weight:700}@media(prefers-color-scheme:dark){.gv{background:#18224A}.gv li{color:#F4F6FC}.gv .gv-k,.gv .gv-u{color:#C9D3F5}}';
// blok voor de bedrijfspagina en de eigenaarspagina; eigUrl = link naar de eigenaarspagina (de trigger voor de ondernemer)
export function gevondenBlok(m, g, { locale = 'en-US', eigUrl = '' } = {}) {
  const t = GT[m] || GT.en, rij = BRONNEN.filter(b => g && g[b] > 0);
  if (!rij.length) return '';
  const d = new Date(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - 1); const sinds = d.toLocaleDateString(locale, { day: 'numeric', month: 'long' });
  return '<style>' + GV_CSS + '</style><section class="gv"><p class="gv-k">' + esc(t.kop) + ' · ' + esc(t.sinds(sinds)) + '</p><ul>' + rij.map(b => '<li><b>' + Number(g[b]).toLocaleString(locale) + '×</b> ' + esc(NAAM[b]) + '</li>').join('') + '</ul><p class="gv-u">' + esc(t.uitleg) + '</p>' + (eigUrl ? '<p style="margin:8px 0 0"><a href="' + esc(eigUrl) + '" rel="nofollow" data-out="eig-gv">' + esc(t.eig) + '</a></p>' : '') + '</section>';
}

// dagronde (api/gsc.js op=dag): vertoningen en kliks per bedrijfspagina van curacao.day, alle talen samen
export async function gscRonde(pageRows, prop, oidc, { GIDS_PAD, ONDERWERPEN }) {
  const rows = await pageRows(prop, 28, oidc); const p = {}, padG = new Set(Object.values(GIDS_PAD)), slugO = {};
  for (const o of ONDERWERPEN) for (const s of Object.values(o.slug || {})) slugO[s] = o.id;
  for (const r of rows) {
    let u; try { u = new URL(r.page); } catch (e) { continue; }
    const s = u.pathname.split('/').filter(Boolean); let k = '';
    if (s.length >= 4 && padG.has(s[s.length - 3])) k = sleutelGids(s[s.length - 2], s[s.length - 1]);
    else if (s.length >= 3 && slugO[s[s.length - 2]]) k = sleutelOnderwerp(slugO[s[s.length - 2]], s[s.length - 1]);
    if (!k || !r.imp) continue; const x = p[k] = p[k] || { imp: 0, kl: 0 }; x.imp += r.imp; x.kl += r.clicks || 0;
  }
  await kv.set('cur:gsc:gv', { t: Date.now(), p }).catch(() => {});
  return { paginas: Object.keys(p).length, vertoningen: Object.values(p).reduce((a, x) => a + x.imp, 0) };
}
