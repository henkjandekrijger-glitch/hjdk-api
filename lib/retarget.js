// Clickmind-publiek: retargeting van echte mensen (Henkjan 17 okt: "Ja retargeting is heel interessant, doe daar uitgebreide studie
// naar! En voeg toe."). Een betaalde klik van een echt mens is een keer gekocht; met een publiek bij het advertentienetwerk kunnen we
// diezelfde mens later opnieuw bereiken (Black Friday, Sinterklaas, nieuwe producten) zonder opnieuw op het hele netwerk te zoeken.
//
// Hoe: het netwerk kent de mens aan zijn eigen cookie of apparaat-id. Wij laten de publieks-pixel van het netwerk alleen afgaan bij
// bezoekers die Clickmind als mens ziet, dus nooit voor bots, datacenters of snelle herhaalklikkers:
//   - eigen pagina's (cm.js): pas na echt gedrag op de pagina (zichtbaar, minstens 8 s, scrollen of tikken, mensmeter niet laag);
//   - /go-meetpagina: alleen voor iemand die eerder bewees een mens te zijn (mm:p echt/actie/aanmelding/koop), geen datacenter.
// Toestemming: in de EU, het VK en Zwitserland mag een advertentiepixel van een ander pas na toestemming (ePrivacy art. 5(3)); daar
// gaat niets af tot er een toestemmingsvraag is. In de VS: niets bij Global Privacy Control of Do Not Track (CCPA/CPRA "share").
// Amazon krijgt hier niets van: de pixel gaat naar het advertentienetwerk, op onze eigen pagina's; geen Amazon-gegevens in het publiek.
// Instelling in mm:retarget (beschermde host /api/mm/retarget, ?j=<json> om te zetten). Tellers per dag in mm:rt:<dag>, unieke mensen
// per publiek in mm:rtp:<dag>:<net>|<publiek> (HyperLogLog), één keer per mens per publiek per dag (mm:rtz:<dag>:<net>|<publiek>:<id>).

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const dagStr = (o = 0) => new Date(Date.now() + o * 864e5).toISOString().slice(0, 10);
const KEY = 'mm:retarget';
// landen waar een advertentiepixel van een ander zonder voorafgaande toestemming niet mag (EU/EER, VK, Zwitserland)
export const TOESTEMMING = new Set('at be bg hr cy cz dk ee fi fr de gr hu ie it lv lt lu mt nl pl pt ro sk si es se is li no gb ch'.split(' '));
export const STANDAARD = {
  aan: false,
  landen: ['us'],                // waar het zonder toestemmingsvraag mag; EU-landen worden altijd geweigerd tot er toestemming is
  minSeconden: 8, minActies: 2, minLokaal: 60,   // eigen pagina: zo lang zichtbaar, zo vaak gescrold of getikt, mensmeter niet lager
  go: true,                      // ook op de /go-meetpagina, alleen voor mensen die eerder bewezen echt te zijn
  sites: ['whichtobuy', 'go'],   // alleen sites waarvan de privacypagina het publiek noemt en de afmeldknop heeft (whichtobuy.best/privacy)
  netwerken: {
    // per netwerk: pixel-sjabloon ({id} = publieks-id van het netwerk, {rnd} = willekeurig) en per publiek het id.
    // publiek = <project>-<land>, met * als joker: amazon-us, shop-nl, todayin-us, *-us, amazon-*, *
    // PropellerAds Audiences (help.propellerads.com 1954798 en 4240694): pixel van my.rtmark.net, f=sync voegt toe, f=off sluit uit,
    // partner = id van het publiek uit het dashboard (Audiences, Create Audience, Get code). 90 dagen, hoogstens 15 publieken per account.
    propeller: { aan: false, soort: 'img', url: 'https://my.rtmark.net/img.gif?f=sync&lr=1&partner={id}', publieken: {} },
    mondiad: { aan: false, soort: 'img', url: '', publieken: {} },
    mgid: { aan: false, soort: 'img', url: '', publieken: {} },
    richads: { aan: false, soort: 'img', url: '', publieken: {} },
    clickadu: { aan: false, soort: 'img', url: '', publieken: {} }
  }
};
let CACHE = { at: 0, v: null };
export async function leesRt(kv, vers = false) {
  if (!vers && CACHE.v && Date.now() - CACHE.at < 60000) return CACHE.v;
  let v = null; try { v = await kv.get(KEY); } catch (e) {}
  const c = JSON.parse(JSON.stringify(STANDAARD)); if (v && typeof v === 'object') { for (const k of Object.keys(c)) if (k !== 'netwerken' && v[k] !== undefined) c[k] = v[k]; for (const [n, x] of Object.entries(v.netwerken || {})) c.netwerken[n] = Object.assign({}, c.netwerken[n] || { aan: false, soort: 'img', url: '', publieken: {} }, x); }
  CACHE = { at: Date.now(), v: c }; return c;
}
const urlOk = u => { try { const x = new URL(String(u).replace(/\{(id|rnd)\}/g, 'x')); return x.protocol === 'https:' && !x.username && !x.password; } catch (e) { return false; } };
export async function zetRt(kv, j) {
  const c = await leesRt(kv, true);
  if (typeof j.aan === 'boolean') c.aan = j.aan;
  if (Array.isArray(j.landen)) c.landen = j.landen.map(x => String(x).toLowerCase().replace(/[^a-z]/g, '').slice(0, 2)).filter(x => x && !TOESTEMMING.has(x));
  for (const k of ['minSeconden', 'minActies', 'minLokaal']) if (j[k] != null && Number.isFinite(Number(j[k]))) c[k] = Math.max(0, Math.min(600, Number(j[k])));
  if (typeof j.go === 'boolean') c.go = j.go;
  if (Array.isArray(j.sites)) c.sites = j.sites.map(x => String(x).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30)).filter(Boolean);
  for (const [n, x] of Object.entries(j.netwerken || {})) {
    const naam = String(n).toLowerCase().replace(/[^a-z]/g, '').slice(0, 20); if (!naam) continue; const o = c.netwerken[naam] || { aan: false, soort: 'img', url: '', publieken: {} };
    if (typeof x.aan === 'boolean') o.aan = x.aan; if (x.soort === 'img' || x.soort === 'script') o.soort = x.soort;
    if (x.url != null) { if (x.url === '' || urlOk(x.url)) o.url = String(x.url).slice(0, 400); else return { ok: false, fout: 'url moet https zijn (' + naam + ')' }; }
    for (const [p, id] of Object.entries(x.publieken || {})) { const pk = String(p).toLowerCase().replace(/[^a-z0-9*-]/g, '').slice(0, 30); if (!pk) continue; if (id === null || id === '') delete o.publieken[pk]; else o.publieken[pk] = String(id).replace(/[^A-Za-z0-9_.:-]/g, '').slice(0, 80); }
    c.netwerken[naam] = o;
  }
  await kv.set(KEY, c); CACHE = { at: 0, v: null };
  return { ok: true, instelling: c };
}
// project van een eigen site of /go
export function projectVanSite(site) {
  const s = String(site || '').toLowerCase();
  if (s === 'go' || /whichtobuy|wtb|kaufberater|amazon/.test(s)) return 'amazon';
  if (/yoors|shop|yoo\.rs/.test(s)) return 'shop';
  if (/todayin|moonlight|finds/.test(s)) return 'todayin';
  if (/mylevel/.test(s)) return 'mylevel';
  if (/keuzehulp/.test(s)) return 'keuzehulp';
  if (/spel|praisy/.test(s)) return 'spel';
  return s.replace(/[^a-z0-9]/g, '').slice(0, 12) || 'ander';
}
function publiekId(pub, project, land) { for (const k of [project + '-' + land, '*-' + land, project + '-*', '*']) if (pub[k]) return { sleutel: k, id: pub[k] }; return null; }

// Mag het, en welke pixels? x = { bron: 'pagina'|'go', site, land, dc, bot, gpc, mens (bewezen of gemeten), id (persoon of cm-id) }
export async function rtBeslis(kv, x) {
  const c = await leesRt(kv); const land = String(x.land || '').toLowerCase();
  if (!c.aan) return { px: [], reden: 'uit' };
  if (x.bot || x.dc) return { px: [], reden: 'bot of datacenter' };
  if (x.gpc) return { px: [], reden: 'Global Privacy Control of Do Not Track' };
  if (x.uit) return { px: [], reden: 'afgemeld' };
  if (!(c.sites || []).includes(x.bron === 'go' ? 'go' : String(x.site || '').toLowerCase())) return { px: [], reden: 'site ' + (x.bron === 'go' ? 'go' : x.site) + ' staat niet aan (privacypagina eerst)' };
  if (TOESTEMMING.has(land)) return { px: [], reden: 'toestemming nodig (' + land + ')' };
  if (!c.landen.includes(land)) return { px: [], reden: 'land ' + (land || '?') + ' staat niet aan' };
  if (!x.mens) return { px: [], reden: 'niet als mens bewezen' };
  if (x.bron === 'go' && !c.go) return { px: [], reden: 'meetpagina staat uit' };
  const project = x.bron === 'go' ? 'amazon' : projectVanSite(x.site), D = dagStr(), id = String(x.id || '').replace(/[^a-f0-9]/g, '').slice(0, 32);
  const px = [], cmd = []; let al = 0;
  for (const [net, o] of Object.entries(c.netwerken)) {
    if (!o.aan || !o.url) continue; const p = publiekId(o.publieken || {}, project, land); if (!p) continue;
    const sl = net + '|' + p.sleutel;
    if (id) { let nieuw = true; try { const r = await kv.raw(['SET', 'mm:rtz:' + D + ':' + sl + ':' + id, '1', 'NX', 'EX', 90000]); nieuw = r === 'OK' || r === true; } catch (e) {} if (!nieuw) { al++; continue; } cmd.push(['PFADD', 'mm:rtp:' + D + ':' + sl, id], ['EXPIRE', 'mm:rtp:' + D + ':' + sl, 120 * 86400]); }
    px.push({ net, publiek: p.sleutel, soort: o.soort === 'script' ? 'script' : 'img', url: String(o.url).replace(/\{id\}/g, encodeURIComponent(p.id)).replace(/\{rnd\}/g, String(Math.floor(Math.random() * 1e9))) });
    cmd.push(['HINCRBY', 'mm:rt:' + D, sl + '|' + (x.bron === 'go' ? 'go' : 'pagina'), 1]);
  }
  if (cmd.length) { cmd.push(['EXPIRE', 'mm:rt:' + D, 120 * 86400]); try { await Promise.all(cmd.map(k => kv.raw(k))); } catch (e) {} }
  return { px, reden: px.length ? 'ok' : al ? 'vandaag al toegevoegd' : 'geen publiek voor ' + project + '-' + land };
}
// stand per publiek: toegevoegde mensen per dag (uniek) en per bron
export async function rtStand(kv, { dagen = 14 } = {}) {
  const c = await leesRt(kv, true); const D = Array.from({ length: Math.max(1, Math.min(60, N(dagen) || 14)) }, (_, i) => dagStr(-i));
  const per = {};
  for (const d of D) {
    let h = null; try { h = await kv.raw(['HGETALL', 'mm:rt:' + d]); } catch (e) {}
    for (let i = 0; h && i < h.length; i += 2) { const f = String(h[i]), j = f.lastIndexOf('|'), sl = f.slice(0, j), bron = f.slice(j + 1); const x = per[sl] || (per[sl] = { publiek: sl, gevuurd: 0, perBron: {}, perDag: {} }); x.gevuurd += N(h[i + 1]); x.perBron[bron] = N(x.perBron[bron]) + N(h[i + 1]); x.perDag[d] = N(x.perDag[d]) + N(h[i + 1]); }
  }
  for (const x of Object.values(per)) { try { x.uniekeMensen = N(await kv.raw(['PFCOUNT', ...D.map(d => 'mm:rtp:' + d + ':' + x.publiek)])); } catch (e) { x.uniekeMensen = null; } }
  return { ok: true, dagen: D.length, instelling: c, publieken: Object.values(per).sort((a, b) => b.gevuurd - a.gevuurd) };
}

// browserdeel voor cm.js: wacht op echt gedrag, vraagt de server welke pixels mogen en laat ze afgaan. ES5, alles in try/catch.
export const RT_JS = String.raw`/* clickmind publiek */(function(){var W=window,D=document,N=navigator;
function q(f){try{return f()}catch(e){return null}}
try{if(W.cmRt)return;W.cmRt=1;if(N.webdriver===true)return;var gpc=(N.globalPrivacyControl===true||N.doNotTrack==='1'||W.doNotTrack==='1')?1:0;if(gpc)return;
var S=D.currentScript||q(function(){var a=D.querySelectorAll('script[src*="/cm.js"]');return a[a.length-1]}),site=S&&S.getAttribute('data-site');if(!site||(S&&S.getAttribute('data-publiek')==='0'))return;if(q(function(){return localStorage.getItem('cmRtUit')})==='1')return;
var O=q(function(){return new URL(S.src).origin})||'https://whichtobuy.best',U=q(function(){return new URL(location.href).searchParams});
function P(){for(var i=0;i<arguments.length;i++){var x=U&&U.get(arguments[i]);if(x)return x}return''}
var id=q(function(){return localStorage.getItem('mmq')})||'',t0=Date.now(),zicht=D.visibilityState==='visible'?Date.now():0,ms=0,act=0,klaar=0,iv;
function zt(){return ms+(zicht?Date.now()-zicht:0)}
D.addEventListener('visibilitychange',function(){if(D.visibilityState==='visible')zicht=Date.now();else if(zicht){ms+=Date.now()-zicht;zicht=0}},true);
var lastY=0;function a(e){if(e&&e.type==='scroll'){var y=W.pageYOffset||0;if(Math.abs(y-lastY)<80)return;lastY=y}act++}
['scroll','pointerdown','keydown','touchstart'].forEach(function(e){D.addEventListener(e,a,{passive:true,capture:true})});
function vuur(px){for(var i=0;i<px.length;i++)q(function(){var p=px[i];if(!p||!/^https:/.test(p.url))return;if(p.soort==='script'){var s=D.createElement('script');s.async=true;s.src=p.url;(D.head||D.documentElement).appendChild(s)}else{var im=new Image();im.referrerPolicy='no-referrer-when-downgrade';im.src=p.url}})}
function probeer(){if(klaar)return;if(Date.now()-t0>600000){clearInterval(iv);return}if(D.visibilityState!=='visible')return;
var mm=W.mensmeter,lok=mm&&mm.lokaal!=null?mm.lokaal:'';if(zt()<8000||act<2)return;if(lok!==''&&lok<60)return;klaar=1;clearInterval(iv);
var u=O+'/api/mm/rt?site='+encodeURIComponent(site)+'&q='+encodeURIComponent(id)+'&c='+encodeURIComponent(P('mmc'))+'&net='+encodeURIComponent(P('src','net','utm_source','n').slice(0,20))+'&lok='+lok+'&s='+Math.round(zt()/1000)+'&a='+act;
fetch(u,{credentials:'omit'}).then(function(x){return x.json()}).then(function(j){if(j&&j.px&&j.px.length)vuur(j.px)})['catch'](function(){})}
iv=setInterval(probeer,2000);
}catch(e){}})();
`;
// zelfde voor de /go-meetpagina: de server besliste al (CTX.rt); alleen nog Global Privacy Control nakijken en zonder te wachten afvuren
export const RT_GO_JS = String.raw`(function(){try{var N=navigator;if(!CTX||!CTX.rt||!CTX.rt.length||N.webdriver===true||N.globalPrivacyControl===true||N.doNotTrack==='1')return;try{if(localStorage.getItem('cmRtUit')==='1')return}catch(e){}for(var i=0;i<CTX.rt.length;i++){var p=CTX.rt[i];if(!p||!/^https:/.test(p.url))continue;if(p.soort==='script'){var s=document.createElement('script');s.async=true;s.src=p.url;document.head.appendChild(s)}else if(window.fetch){fetch(p.url,{mode:'no-cors',credentials:'include',keepalive:true})['catch'](function(){})}else{new Image().src=p.url}}}catch(e){}})();`;
