// Snelheid van de productpagina zoals een Nederlandse telefoon die krijgt (Henkjan 29 okt 2026: "Staan de zware scripts ed aangegeven ?").
// Meet: de omleidingen tot de pagina, de HTML zelf, elk extern script en stylesheet (grootte, tijd, blokkerend of niet, van wie),
// de inline scripts samen en de eerste beelden. Alleen lezen, geen bezoekersdata. Bewaard 6 uur; ?vers=1 meet opnieuw.
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const KOP = { 'user-agent': UA, 'accept-language': 'nl-NL,nl;q=0.9', accept: 'text/html,*/*' };
const WIE = [
  [/googletagmanager|google-analytics|gtag/i, 'Google Tag Manager / Analytics'], [/googleads|doubleclick|googlesyndication/i, 'Google Ads'],
  [/hotjar/i, 'Hotjar'], [/clarity\.ms/i, 'Microsoft Clarity'], [/facebook|fbevents|connect\.facebook/i, 'Meta-pixel'], [/tiktok/i, 'TikTok-pixel'],
  [/stripe/i, 'Stripe'], [/paypal/i, 'PayPal'], [/mollie/i, 'Mollie'], [/cookiebot|onetrust|cookieyes|consent/i, 'Cookiemelding'],
  [/intercom|crisp|tawk|zendesk|livechat|tidio/i, 'Chat'], [/trustpilot|kiyoh|webwinkelkeur|trustedshops/i, 'Reviews'],
  [/fonts\.googleapis|fonts\.gstatic/i, 'Google Fonts'], [/sentry/i, 'Sentry'], [/jquery/i, 'jQuery'], [/hjdk-api|keuzehulp\.best|\/cm\.js/i, 'Clickmind-meting'],
];
const wie = (u, eigen) => { for (const [re, n] of WIE) if (re.test(u)) return n; try { const h = new URL(u).hostname; return eigen.some(d => h === d || h.endsWith('.' + d)) ? 'Kadoly zelf' : h; } catch (e) { return 'onbekend'; } };
const haal = async (u, ms = 8000) => { const t0 = Date.now(); try { const r = await fetch(u, { headers: KOP, redirect: 'manual', signal: AbortSignal.timeout(ms) }); const b = await r.arrayBuffer(); return { status: r.status, ms: Date.now() - t0, kb: Math.round(b.byteLength / 102.4) / 10, location: r.headers.get('location'), type: r.headers.get('content-type') || '', body: b }; } catch (e) { return { status: 0, ms: Date.now() - t0, kb: 0, fout: String(e && e.name || e) }; } };
const attr = (tag, a) => { const m = tag.match(new RegExp('\\b' + a + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i')); return m ? (m[1] ?? m[2] ?? m[3]) : null; };

export async function meetSnelheid(pid) {
  const start = Date.now();
  let u = 'https://kadoly.com/product/' + encodeURIComponent(pid) + '?lang=nl'; const hops = []; let r;
  for (let i = 0; i < 5; i++) { r = await haal(u, 15000); hops.push({ url: u.replace('https://kadoly.com', ''), status: r.status, ms: r.ms }); if (r.status >= 300 && r.status < 400 && r.location) { u = new URL(r.location, u).href; continue; } break; }
  const html = r && r.body ? new TextDecoder().decode(r.body) : '';
  const kopEind = html.search(/<\/head>/i); const inKop = i => kopEind < 0 || i < kopEind;
  const eigen = ['kadoly.com', 'yoo.rs', 'yoors.shop'];
  const scripts = [], css = [], beelden = []; let inlineN = 0, inlineKb = 0;
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const tag = '<script' + m[1] + '>', src = attr(tag, 'src');
    if (!src) { const t = (attr(tag, 'type') || '').toLowerCase(); if (t && /json|template/.test(t)) continue; inlineN++; inlineKb += m[2].length / 1024; continue; }
    const abs = new URL(src, u).href; const blok = inKop(m.index) && !/\b(async|defer)\b/i.test(m[1]) && !/type\s*=\s*["']?module/i.test(m[1]);
    scripts.push({ url: abs, wie: wie(abs, eigen), blokkeert: blok, async: /\basync\b/i.test(m[1]), defer: /\bdefer\b/i.test(m[1]) });
  }
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) { const rel = (attr(m[0], 'rel') || '').toLowerCase(); const href = attr(m[0], 'href'); if (!href || !/stylesheet/.test(rel)) continue; const abs = new URL(href, u).href; css.push({ url: abs, wie: wie(abs, eigen), blokkeert: inKop(m.index) && !/media\s*=\s*["']?print/i.test(m[0]) }); }
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) { if (beelden.length >= 6) break; const src = attr(m[0], 'src') || attr(m[0], 'data-src'); if (!src || src.startsWith('data:')) continue; beelden.push({ url: new URL(src, u).href, lazy: /loading\s*=\s*["']?lazy/i.test(m[0]), breedte: attr(m[0], 'width') }); }
  const iframes = [...html.matchAll(/<iframe\b[^>]*>/gi)].map(m => attr(m[0], 'src')).filter(Boolean).slice(0, 5);
  const meet = async lijst => Promise.all(lijst.slice(0, 30).map(async x => { const g = await haal(x.url); return Object.assign({}, x, { kb: g.kb, ms: g.ms, status: g.status, type: g.type ? g.type.split(';')[0] : undefined }); }));
  const [S, C, B] = await Promise.all([meet(scripts), meet(css), meet(beelden.slice(0, 4))]);
  const som = l => Math.round(l.reduce((a, x) => a + (x.kb || 0), 0));
  const perWie = {}; for (const x of S) { const p = perWie[x.wie] || (perWie[x.wie] = { wie: x.wie, scripts: 0, kb: 0, blokkeert: 0 }); p.scripts++; p.kb += x.kb || 0; if (x.blokkeert) p.blokkeert++; }
  return {
    ok: true, at: Date.now(), pid, duur: Date.now() - start,
    omleidingen: hops, eindUrl: u.replace('https://kadoly.com', ''), htmlKb: r ? r.kb : 0, htmlMs: r ? r.ms : 0,
    totaal: { scripts: S.length, scriptsKb: som(S), blokkerendeScripts: S.filter(x => x.blokkeert).length, css: C.length, cssKb: som(C), inlineScripts: inlineN, inlineKb: Math.round(inlineKb), beeldenKb: som(B), iframes: iframes.length },
    perWie: Object.values(perWie).map(p => Object.assign(p, { kb: Math.round(p.kb) })).sort((a, b) => b.kb - a.kb),
    zwaarste: S.concat(C.map(x => Object.assign({ css: true }, x))).sort((a, b) => (b.kb || 0) - (a.kb || 0)).slice(0, 12).map(x => ({ url: x.url.replace(/^https:\/\/(www\.)?/, '').slice(0, 90), wie: x.wie, kb: x.kb, ms: x.ms, blokkeert: !!x.blokkeert, soort: x.css ? 'css' : 'script' })),
    beelden: B.map(x => ({ url: x.url.replace(/^https:\/\//, '').slice(0, 90), kb: x.kb, ms: x.ms, lazy: x.lazy, type: x.type })), iframes,
  };
}
export async function snelheid(kv, pid, vers) {
  const k = 'hjdk:shop:snelheid:' + pid;
  try { const c = await kv.get(k); if (c && Date.now() - c.at < (vers ? 600e3 : 6 * 3600e3)) return c; } catch (e) {}
  const o = await meetSnelheid(pid); try { await kv.set(k, o, { ex: 2 * 86400 }); } catch (e) {} return o;
}
