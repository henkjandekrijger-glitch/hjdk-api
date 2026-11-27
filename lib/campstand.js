// Campagnestand voor het dashboard (Henkjan 27 nov 2026: "Ik merk dat dashboard niet op de hoogte is van campagnes laatste status zorg daarvoor").
// Het dashboard kende van campagnes alleen het kasboek en het werklog. Deze module haalt bij elk bezoek de live stand op en zet hem bij het
// project Campagnes en bij elk project dat vandaag campagnes heeft lopen, in de kaart en in ?vorm=tekst (regels "Campagnes: ...").
// Bronnen, dezelfde als de handover:
//   - propellerads-mcp /api/wachtlog?stand=1 (zelfde aanroep en sleutel als paStand in lib/handover.js; hier los, zodat het dashboard licht blijft): budget van vandaag per project en per netwerk (PropellerAds, Mondiad,
//     RichAds, MGID), kosten en omzet per campagne, starts (slots) en de tempowacht;
//   - de uurwacht van Clickmind (kv mm:wachtuur:laatst): aangekomen kliks per netwerk, kliks, aanmeldingen en kopen per project.
// Snel en veilig: de bron krijgt hooguit 4 seconden en het antwoord blijft 5 minuten in kv (mm:dash:camp), zodat een trage bron de pagina
// niet ophoudt. Lukt ophalen niet, dan toont het dashboard de laatste bewaarde stand met het tijdstip erbij; ouder dan 30 minuten of een
// netwerk dat niet meer meldt staat onder Opvallend. Alleen lezen: deze module verandert niets aan campagnes.
// Een campagne hoort bij een dashboardproject via zijn naam (NAAM hieronder), anders via de budgetsleutel (SLEUTEL), anders bij Campagnes.

const KEY = 'mm:dash:camp', VERS = 5 * 60e3, OUD = 30 * 60e3;
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const geld = n => '$' + (Math.round(N(n) * 100) / 100).toFixed(2).replace('.', ',');
const NET = { pa: 'PropellerAds', propeller: 'PropellerAds', mondiad: 'Mondiad', richads: 'RichAds', mgid: 'MGID', clickadu: 'Clickadu' };
// You and AI staat voor curacao: zijn campagnes heten TODAYIN AI ... (Henkjan 27 nov 2026: You and AI als eigen project op het dashboard).
const NAAM = [['kadoly', /shop-lus|kadoly/i], ['youandai', /todayin ai|you and ai|youandai/i], ['curacao', /todayin|cura[cç]ao/i], ['wam', /\bwam\b|we are many/i], ['keuzehulpen', /whichtobuy|kaufberater|keuzehulp/i],
  ['mylevel', /mylevel/i], ['nexy', /nexy/i], ['kdp', /\bkdp\b|lasting change|pit boss|apocrypha|enoch/i], ['tk', /\btk\b|tania/i], ['sealed', /sealed/i]];
const SLEUTEL = { 'SHOP-LUS': 'kadoly', YOUANDAI: 'youandai', TODAYIN: 'curacao', WAM: 'wam', MYLEVEL: 'mylevel', KDP: 'kdp', AMAZON: 'kdp', NEXY: 'nexy', TK: 'tk' };
const UUR = { todayin: 'curacao', shop: 'kadoly', kz: 'keuzehulpen', keuzehulp: 'keuzehulpen' };
async function bron(ms) {
  const s = process.env.SHOP_SLEUTEL; if (!s) return null;
  const base = (process.env.WACHT_CENTRAAL_URL || 'https://propellerads-mcp.vercel.app').replace(/\/$/, '');
  try { const r = await fetch(base + '/api/wachtlog?stand=1', { headers: { 'x-shop-sleutel': s }, signal: AbortSignal.timeout(ms) }); return r.ok ? await r.json() : null; } catch (e) { return null; }
}
export function campProject(naam, sleutel) { const n = String(naam || ''); for (const [id, re] of NAAM) if (re.test(n)) return id; return SLEUTEL[String(sleutel || '').toUpperCase()] || 'campagnes'; }
const tijd = t => { const d = new Date(t); return Number.isFinite(d.getTime()) ? String(d.getUTCDate()) + ' ' + ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'][d.getUTCMonth()] + ' ' + d.toISOString().slice(11, 16) + ' UTC' : ''; };

// pa = antwoord van /api/wachtlog?stand=1, uur = mm:wachtuur:laatst, t = wanneer pa is opgehaald (ms)
export function campBouw(pa, uur, t = Date.now(), nu = Date.now()) {
  const b = (pa && pa.budget) || null; if (!b) return null;
  const projecten = {}; const P = id => projecten[id] || (projecten[id] = { kosten: 0, omzet: 0, campagnes: [], budget: null, kliks: 0, aanmelding: 0, koop: 0 });
  for (const c of Array.isArray(b.winst) ? b.winst : []) { const x = P(campProject(c.naam, c.project)); x.kosten += N(c.kosten); x.omzet += N(c.omzet); x.campagnes.push({ cid: String(c.cid || ''), naam: String(c.naam || ''), net: NET[c.net] || String(c.net || ''), kosten: N(c.kosten), omzet: N(c.omzet) }); }
  for (const [k, v] of Object.entries(b.projecten || {})) { const id = SLEUTEL[k.toUpperCase()]; if (id && v) P(id).budget = { sleutel: k, kosten: N(v.kosten), saldo: N(v.saldo), grens: v.grens != null ? N(v.grens) : (v.test ? 20 : null), test: !!v.test, dagen: v.dagen != null ? N(v.dagen) : null, afgelopen: !!v.afgelopen, open: !!v.open }; }
  const E = (uur && uur.eigen && uur.eigen.projecten) || {};
  for (const [k, v] of Object.entries(E)) { if (k.includes('|') || !v) continue; const x = P(UUR[k] || campProject(k, k)); x.kliks += N(v.kliks); x.aanmelding += N(v.aanmelding); x.koop += N(v.koop); }
  for (const x of Object.values(projecten)) { x.kosten = Math.round(x.kosten * 100) / 100; x.omzet = Math.round(x.omzet * 100) / 100; x.campagnes.sort((a, c) => c.kosten - a.kosten); }
  const netten = Object.entries(b.perNet || {}).map(([k, v]) => ({ net: NET[k] || k, kosten: N(v && v.kosten), omzet: N(v && v.omzet), gemeld: (v && v.gemeld) || '', oud: !!(v && v.oud) })).sort((a, c) => c.kosten - a.kosten);
  const aankomst = Object.entries((uur && uur.netten) || {}).map(([k, v]) => ({ net: NET[k] || k, kliks: N(v && v.kliks), aangekomen: N(v && v.aangekomen), pct: v && v.pct != null ? N(v.pct) : null })).filter(x => x.kliks > 0);
  const tempo = (Array.isArray(pa.tempo) ? pa.tempo : []).slice(0, 3).map(x => ({ t: x.t || '', cid: String(x.cid || ''), naam: String(x.naam || ''), waarom: String(x.waarom || '') }));
  return { ontvangen: new Date(t).toISOString(), oud: nu - t > OUD, dag: b.dag || '', budget: { kosten: N(b.kosten), omzet: N(b.omzet), saldo: N(b.saldo), grens: N(b.grens), stand: String(b.stand || '') },
    netten, aankomst, slots: pa.slots ? { gebruikt: N(pa.slots.gebruikt), grens: N(pa.slots.grens) } : null, tempo, projecten };
}

export async function campStand(kv, uur, nu = Date.now()) {
  const c = await kv.get(KEY).catch(() => null);
  if (c && c.pa && nu - N(c.t) < VERS) return campBouw(c.pa, uur, c.t, nu);
  const pa = await bron(4000);
  if (pa && pa.budget) { const klein = { budget: pa.budget, slots: pa.slots || null, tempo: (pa.tempo || []).slice(0, 5) }; await kv.set(KEY, { t: nu, pa: klein }).catch(() => null); return campBouw(klein, uur, nu, nu); }
  return c && c.pa ? campBouw(c.pa, uur, c.t, nu) : null;
}

// De regels voor één project op het dashboard; namen = { id: naam } van de projecten, extra = een regel erbij (Amazon Ads bij KDP).
export function campRegels(c, id, namen = {}, extra = '') {
  const r = []; const x = c && c.projecten[id];
  if (c && id === 'campagnes') {
    r.push('Vandaag: kosten ' + geld(c.budget.kosten) + ', gegarandeerde omzet ' + geld(c.budget.omzet) + ', per saldo ' + geld(c.budget.saldo) + ' van ' + geld(c.budget.grens) + (c.budget.stand && c.budget.stand !== 'ok' ? '. Budgetwacht: ' + c.budget.stand : '') + '.');
    if (c.netten.length) r.push('Per netwerk: ' + c.netten.map(n => n.net + ' ' + geld(n.kosten) + (n.oud ? ' (meldt niet meer)' : '')).join(' · ') + '.');
    const pr = Object.entries(c.projecten).filter(([, v]) => v.campagnes.length).sort((a, d) => d[1].kosten - a[1].kosten);
    if (pr.length) r.push('Per project: ' + pr.map(([k, v]) => (namen[k] || k) + ' ' + geld(v.kosten) + ' (' + v.campagnes.length + ')').join(' · ') + '.');
    if (c.aankomst.length) r.push('Aangekomen bij Clickmind: ' + c.aankomst.map(a => a.net + ' ' + a.aangekomen + ' van ' + a.kliks + ' kliks' + (a.pct != null ? ' (' + String(a.pct).replace('.', ',') + '%)' : '')).join(' · ') + '.');
    if (c.slots) r.push('Starts PropellerAds: ' + c.slots.gebruikt + ' van ' + c.slots.grens + ' gebruikt.');
    if (c.tempo[0]) r.push('Tempowacht, laatste rem: ' + tijd(c.tempo[0].t) + ', ' + c.tempo[0].cid + ' ' + c.tempo[0].naam.slice(0, 60) + '.');
  }
  if (x && (x.campagnes.length || x.budget || x.kliks)) {
    if (x.campagnes.length && id !== 'campagnes') r.push('Vandaag ' + x.campagnes.length + (x.campagnes.length === 1 ? ' campagne' : ' campagnes') + ' met kosten: ' + geld(x.kosten) + ', gegarandeerde omzet ' + geld(x.omzet) + '.');
    if (x.budget && x.budget.test) r.push('Testbudget ' + x.budget.sleutel + ': ' + geld(x.budget.saldo) + (x.budget.grens ? ' van ' + geld(x.budget.grens) : '') + ' vandaag' + (x.budget.dagen != null ? ', testdag ' + x.budget.dagen : '') + (x.budget.open ? ', regel open op jouw woord' : '') + (x.budget.afgelopen ? ', testperiode voorbij' : '') + '.');
    if (x.kliks) r.push('Clickmind vandaag: ' + x.kliks + ' kliks, ' + x.aanmelding + (x.aanmelding === 1 ? ' aanmelding' : ' aanmeldingen') + ', ' + x.koop + (x.koop === 1 ? ' koop' : ' kopen') + '.');
    for (const k of x.campagnes.slice(0, id === 'campagnes' ? 5 : 3)) r.push(k.net + ' ' + k.cid + ' ' + k.naam.replace(/\s+/g, ' ').slice(0, 70) + ': ' + geld(k.kosten) + (k.omzet ? ', omzet ' + geld(k.omzet) : '') + '.');
  }
  if (extra) r.push(extra);
  if (r.length && c) r.push('Stand van ' + tijd(c.ontvangen) + (c.oud ? ' (oud: de bron antwoordt niet)' : '') + '.');
  return r;
}

// Onder Opvallend: de stand is oud, een netwerk meldt niet meer of de budgetwacht staat niet op ok.
export function campOpvallend(c) {
  if (!c) return null;
  const stil = c.netten.filter(n => n.oud).map(n => n.net);
  const t = c.oud ? 'De campagnestand is ouder dan 30 minuten (' + tijd(c.ontvangen) + '): de bron antwoordt niet.' : stil.length ? stil.join(' en ') + (stil.length === 1 ? ' meldt' : ' melden') + ' geen kosten meer aan de budgetwacht.' : c.budget.stand && c.budget.stand !== 'ok' ? 'Budgetwacht staat op ' + c.budget.stand + ': per saldo ' + geld(c.budget.saldo) + ' van ' + geld(c.budget.grens) + '.' : '';
  return t ? { id: 'campagnes', naam: 'Campagnes', zwaar: 45, tekst: t, opdracht: 'Het dashboard meldt over de campagnes: ' + t + ' Lees https://hjdk-api-henq.vercel.app/api/mm/handover, zoek de oorzaak (wachten per netwerk, budgetwacht) en herstel wat in code of instelling kan; campagnes zelf alleen volgens de campagne-skill.' } : null;
}
