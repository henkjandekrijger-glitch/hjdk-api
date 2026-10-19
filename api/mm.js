// CLICKMIND (naam: Henkjan 14 okt 2026): leert van elke advertentieklik. Klikregister (/go), mensmeter, wissel (/w), leerronde,
// terugbetalingsdossier en lerende modal (/mmm.js) in één systeem.
// MENSMETER (Henkjan 14 okt 2026): zit er een echt mens achter een advertentieklik? Eén meting voor alle netwerken.
//   /mm.js               browserscript (insluiten op een landingspagina):
//                        <script src="https://whichtobuy.best/mm.js" data-net="mondiad" data-zone="[zoneid]" data-campaign="[campaignid]" data-subid="[clickid]" async></script>
//                        zonder data-attributen leest het de pagina-URL (src/net/utm_source, zone/z/zoneid, campaign/c/cid, subid/clickid/k, cr)
//   /api/mm/b            ontvanger van de beacons (POST text/plain JSON; testen: GET ?test=1&j=<json> met net=test)
//   /go                  klikregister voor Amazon (een advertentie heeft maar één link). Parameters:
//                        k=<zoekterm> of a=<ASIN> of u=<Amazon-URL>, m=com|de|co.uk|ca..., tag=<tag>, tag2=<tag voor de 302-variant>, split=<% naar 302, standaard 50 als tag2 er is>,
//                        n=<netwerk> c=<campagne> z=<zone> s=<klik-id netwerk> b=<advertentie> p=<voorvoegsel ascsubtag>
//                        Elke klik: klik-id (cid) en persoons-id (cookie mmp) alleen in ons register; naar Amazon gaat ascsubtag p-zone (nooit per klik, Associates §2(b)).
//                        Variant js: een lege meetpagina die in ~150 ms browsersignalen meet (vingerafdruk, WebGL, scherm, batterij, netwerk, ...) en doorstuurt.
//                        Variant 302: direct door. Per persoon vast, zodat de Associates-cijfers per tag de varianten eerlijk vergelijken.
//   /api/mm/proef?dagen=1               de /go-proef per campagne, variant en tag
//   /api/mm/export?dag=JJJJ-MM-DD&van=0 ruwe regels (alleen op de beschermde vercel.app-host)
//   /api/mm/persoon?pid=<16 hex>        alle kliks van één persoon (alleen op de beschermde vercel.app-host)
//   /w/<naam>?n=&c=&z=&s=&b=            DE WISSEL (lib/wissel.js): kiest per klik de bestemming (Amazon of eigen pagina), per persoon vast
//   /api/mm/uitkomst?cid=&soort=&waarde=&bron=   bestemming meldt echt, actie, aanmelding of koop (of POST JSON; /mmu.js doet het in de browser)
//   /api/mm/wissel[?naam=][&j=<json>]   instellingen bekijken of opslaan (beschermde host)
//   /api/mm/clickmind                    overzicht in gewone taal: netwerken, herkomst (sites/apps), zones, alle data (beschermde host)
//   /api/mm/rt                         cm.js: welke publieks-pixels mogen afgaan na echt gedrag (lib/retarget.js)
//   /api/mm/retarget[?j=<json>]        Clickmind-publiek: stand en instelling (beschermde host)
//   /api/mm/ctrtest?naam=[&j=<json>]   CTR-test per zoekterm: per advertentie (bannerid) een eigen zoekterm in /go met t=<naam> (lib/ctrtest.js, beschermde host)
//   /api/mm/mensgeld?dag=JJJJ-MM-DD   per uniek mens: kliks per mens, herhaalkliks, kosten per mens, dubbel betaald, per tag verdiend per mens (beschermde host)
//   /api/mm/overlap?dagen=3            welke zoektermen dezelfde mensen aanklikken (beschermde host)
//   /api/mm/gosplit?p=<voorvoegsel>&pct=0-100 meetpagina of direct door per voorvoegsel van /go-links, zonder de campagnelink aan te raken (beschermde host)
//   /api/mm/amazonmeter?dag=JJJJ-MM-DD   per Associates-tag betaalde kliks tegen door Amazon getelde kliks, artikelen en omzet (alleen meten; beschermde host)
//   /api/mm/amazon?dag=&tag=&kliks=&artikelen=&omzet=&verdiend=   Associates per tag per dag, van de dagronde (beschermde host)
//   /api/mm/amazon  POST { dag, bron, rijen: [{tag,kliks,artikelen,omzet,verdiend,markt}] }  hele dag in een keer (beschermde host)
//      markt=us|de|uk hoort erbij: -21 is zowel DE als UK en die converteren heel anders (ijkpunt van de stopregel)
//   /api/mm/tagstop?net=propeller        welke campagnes Clickmind stilzet en waarom (lib/tagstop.js; de lus leest dit elk uur)
//   /api/mm/tagstop?ronde=1[&droog=1]    de ronde nu draaien; ?stand=1 = voorstel plus wat er is uitgevoerd (beschermde host)
//   /api/mm/cc[?deel=voorstel|wachtrij][&dag=]   Creator Connections: stand, campagnevoorstellen en accepteerwachtrij (lib/cc.js, beschermde host)
//   /api/mm/cc  POST { soort, rijen }            de aanbiedingenlijst voeden vanuit de ingelogde Associates-pagina (beschermde host)
//   /api/mm/ccdag                                dagronde: Keepa-check + opbrengstcheck, kiest wat vandaag getest wordt (cron 06:40 UTC)
//   /api/mm/leer[?lees=1|droog=1]       leerronde (lib/leer.js; cron elk uur; lezen op de beschermde host)
//   /api/mm/blok?net=propeller          blokvoorstel van de leerronde (openbaar, alleen zone-nummers)
//   /api/mm/lookalike?project=todayin&land=us   lookalikes op uitkomst (lib/lookalike.js; openbaar, alleen zone-nummers)
//   /api/mm/verken?sleutel=todayin-us   voorstel witte lijst verkenningscampagne; POST /api/mm/verkengedaan (SHOP_SLEUTEL) = uitgevoerd
//   /api/mm/instelling[?j=<json>]       schakelaars, o.a. blokkeren aan/uit (beschermde host)
//   /api/mm/overzicht                   alles op één pagina (beschermde host)
//   /api/mm/terugbetaling?net=propeller&van=&tot=[&formaat=csv]   bewijs per klik voor een terugbetalingsverzoek (beschermde host; indienen alleen op Henkjans woord)
//   /api/mm/terugdag                    cron: elke dag het dossier van gisteren per netwerk
//   /cm.js                              CLICKMIND in één regel (uitkomsten, mensmeter bij betaald verkeer, lerende modal)
//   /mmm.js                             DE LERENDE MODAL (lib/modal.js): <script src="https://whichtobuy.best/mmm.js" data-site="<site>" async></script>; testen met ?mmm=<arm-id> in de pagina-URL
//   /api/mm/modal?site=&q=&c=&v=&mob=   beslissing per paginabezoek (e-mail, andere site of niets); /api/mm/modalev?mid=&e=toon|klik|sluit|hoofd; /api/mm/modalmail (POST)
//   /api/mm/modalbeheer[?site=][&j=<json>][&mail=<lijst>&formaat=csv]   instellingen, stand en adressen (beschermde host)
//   /api/mm/zones?net=mondiad&dagen=3   oordeel per zone (zelfde vorm als rereview /api/b/zones, leesbaar voor de Mondiad-wacht)
//   /api/mm/patronen?dagen=1            botfarms: vingerafdrukken in veel zones of netwerken
//   /api/mm/stand                       vandaag per netwerk, slechtste zones, datacenterlijst
// Regels, opslag en uitleg: lib/mensmeter.js.
import { kv } from '../lib/db.js';
import { echteTag, verwerkBeacon, verwerkKlik, amazonBouw, armVoor, nieuwId, serverSignalen, laterAf, schoon, tagOk, zones, patronen, stand, proef, exporteer, persoon, netNaam, ipInfo, dcVan, score } from '../lib/mensmeter.js';
import { leesWissel, bewaarWissel, alleWissels, kiesArm, soortPersoon, bestemming, wisselKlik, cidKoppel, uitkomst, amazonUitkomst, wisselStand } from '../lib/wissel.js';
import { leerRonde, instelling } from '../lib/leer.js';
import { dossier, naarCsv, dagDossiers } from '../lib/terug.js';
import { modalBeslis, modalEv, modalMail, leesModal, bewaarModal, alleModals, modalStand, catalogus, bewaarCatalogus } from '../lib/modal.js';
import { overdracht } from '../lib/overdracht.js';
import { RT_JS, RT_GO_JS, rtBeslis, leesRt, zetRt, rtStand } from '../lib/retarget.js';

// Browserscript: klein, vanilla, alles in try/catch; vertraagt of breekt de pagina nooit.
const MM_JS = String.raw`/* mensmeter */(function(){var W=window,N=navigator,D=document,M={vid:'',lokaal:null};
function q(f){try{return f()}catch(e){return null}}
function h32(s){var h=0x811c9dc5;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return('0000000'+(h>>>0).toString(16)).slice(-8)}
function now(){return W.performance&&performance.now?performance.now():0}
function hex(a){var s='';for(var i=0;i<8;i++)s+=(a[i]+256).toString(16).slice(1);return s}
try{if(W.mensmeter&&W.mensmeter.vid)return;W.mensmeter=M;
var S=D.currentScript||q(function(){var a=D.querySelectorAll('script[src*="/mm.js"]');return a[a.length-1]}),A=function(k){return S&&S.getAttribute('data-'+k)||''},
U=q(function(){return new URL(location.href).searchParams}),
P=function(){for(var i=0;i<arguments.length;i++){var v=U&&U.get(arguments[i]);if(v)return v}return''},
O=q(function(){return new URL(S.src).origin})||location.origin,ua=N.userAgent||'',
vid=q(function(){var a=new Uint8Array(8);crypto.getRandomValues(a);return hex(a)})||h32(ua+Math.random())+h32(Date.now()+'.'+Math.random()),
d={v:1,vid:vid,net:A('net')||P('src','net','utm_source'),zone:A('zone')||P('zone','z','zoneid'),camp:A('campaign')||P('campaign','c','cid','campaignid'),sub:A('subid')||P('subid','clickid','k'),cr:A('cr')||P('cr','creativeid'),via:A('via'),pg:location.host+location.pathname,ref:q(function(){return D.referrer?new URL(D.referrer).host:''})||'',ua:ua},
b={t1:null,tp:null,ts:null,tk:null,nt:0,nk:0,nw:0,mm:0,sc:0,nu:0,sd:0},pts=[],vis=0,vs=D.visibilityState==='visible'?0:null,mo={n:0,s:0,s2:0},sent={};
M.vid=vid;
d.wd=N.webdriver===true?1:0;d.pl=q(function(){return N.plugins.length});
d.lg=q(function(){return(N.languages||[]).join(',')})||'';d.lg0=d.lg?0:1;d.lang=N.language||'';
d.ncr=/Chrome\/\d/.test(ua)&&!/; wv\)|SamsungBrowser|CriOS/.test(ua)&&!W.chrome?1:0;
d.ow0=W.outerWidth===0&&W.outerHeight===0?1:0;
var u2=N.userAgentData;if(u2)d.uad={m:u2.mobile?1:0,p:u2.platform||'',b:q(function(){return u2.brands.map(function(x){return x.brand+' '+x.version}).join(', ')})||''};
d.tz=q(function(){return Intl.DateTimeFormat().resolvedOptions().timeZone})||'';d.tzo=new Date().getTimezoneOffset();
d.scr=q(function(){return screen.width+'x'+screen.height+'x'+(W.devicePixelRatio||1)})||'';
d.hc=N.hardwareConcurrency||0;d.mem=N.deviceMemory||0;d.mtp=N.maxTouchPoints||0;d.plat=N.platform||'';
q(function(){if(W.Notification&&N.permissions&&N.permissions.query)N.permissions.query({name:'notifications'}).then(function(p){d.np=Notification.permission==='denied'&&p.state==='prompt'?1:0},function(){})});
function ev(k){return function(e){try{if(e.isTrusted===false){b.nu++;return}var t=Math.round(now());
if(k==='p'||k==='k'||k==='w'){if(b.t1==null)b.t1=t}
if(k==='p'){b.nt++;if(b.tp==null)b.tp=t;var x=e.touches&&e.touches[0]||e;if(pts.length<40)pts.push([x.clientX||0,x.clientY||0])}
else if(k==='s'){b.sc++;if(b.ts==null)b.ts=t;var h=D.documentElement,y=(W.pageYOffset||h.scrollTop||0)+W.innerHeight,H=Math.max(h.scrollHeight,D.body?D.body.scrollHeight:0)||1;b.sd=Math.max(b.sd,Math.min(100,Math.round(y/H*100)))}
else if(k==='w'){b.nw++;if(b.ts==null)b.ts=t}
else if(k==='k'){b.nk++;if(b.tk==null)b.tk=t}
else if(k==='m'){b.mm++;if(b.mm%4===1&&pts.length<40)pts.push([e.clientX||0,e.clientY||0])}}catch(x){}}}
var o={passive:true,capture:true};
q(function(){var pe=!!W.PointerEvent;D.addEventListener(pe?'pointerdown':'touchstart',ev('p'),o);if(!pe)D.addEventListener('mousedown',ev('p'),o);W.addEventListener('scroll',ev('s'),o);W.addEventListener('wheel',ev('w'),o);D.addEventListener('keydown',ev('k'),o);D.addEventListener('mousemove',ev('m'),o)});
q(function(){var DM=W.DeviceMotionEvent;if(!DM||typeof DM.requestPermission==='function'){d.mo=-1;return}
var f=function(e){var a=e.accelerationIncludingGravity;if(!a||a.x==null)return;var m=Math.sqrt(a.x*a.x+a.y*a.y+a.z*a.z);mo.n++;mo.s+=m;mo.s2+=m*m;if(mo.n>=300)W.removeEventListener('devicemotion',f)};W.addEventListener('devicemotion',f,{passive:true})});
function visT(){return vis+(vs!=null?now()-vs:0)}
function sd(){if(!mo.n)return 0;var m=mo.s/mo.n;return Math.sqrt(Math.max(0,mo.s2/mo.n-m*m))}
function spr(){var n=pts.length,i,sx=0,sy=0,v=0;if(n<2)return 0;for(i=0;i<n;i++){sx+=pts[i][0];sy+=pts[i][1]}sx/=n;sy/=n;for(i=0;i<n;i++)v+=Math.pow(pts[i][0]-sx,2)+Math.pow(pts[i][1]-sy,2);return Math.round(Math.sqrt(v/n))}
function est(){var p=50,i=b.nt||b.nk||b.nw||b.mm>=3,r=mo.n>=5&&sd()>0.001;
if(d.wd||/HeadlessChrome|PhantomJS/i.test(ua)||/SwiftShader|llvmpipe|softpipe|Mesa OffScreen/i.test((d.glr||'')+(d.glv||'')))return 0;
if(d.np)p-=30;if(d.lg0)p-=15;if(d.ncr)p-=15;if(d.ow0)p-=20;
if(((d.uad&&d.uad.m)||/Mobi|Android|iPhone|iPad/.test(ua))&&!d.mtp)p-=20;
if(visT()>=3000)p+=15;if(i)p+=20;if(i&&spr()>=10)p+=10;if(r)p+=10;if(b.nu&&!i)p-=30;if(!i&&!r)p-=10;
return Math.max(0,Math.min(100,p))}
function pak(f){var k;for(k in b)d[k]=b[k];d.f=f;d.t=Math.round(now());d.vis=Math.round(visT());d.sp=spr();d.npt=pts.length;if(d.mo!==-1){d.mo=mo.n;d.mov=Math.round(sd()*1e4)/1e4}M.lokaal=est();return JSON.stringify(d)}
function send(f){if(sent.b||sent[f])return;sent[f]=1;try{var x=pak(f),u=O+'/api/mm/b';if(!(N.sendBeacon&&N.sendBeacon(u,x))&&W.fetch)fetch(u,{method:'POST',body:x,keepalive:true,mode:'no-cors',credentials:'omit'})['catch'](function(){})}catch(e){}}
D.addEventListener('visibilitychange',function(){if(D.visibilityState==='visible'){if(vs==null)vs=now()}else{if(vs!=null){vis+=now()-vs;vs=null}send('b')}},true);
W.addEventListener('pagehide',function(){send('b')},true);
setTimeout(function(){
q(function(){var c=D.createElement('canvas'),g=c.getContext('webgl')||c.getContext('experimental-webgl');if(!g){d.glr='-';return}var e=g.getExtension('WEBGL_debug_renderer_info');d.glv=String(g.getParameter(e?e.UNMASKED_VENDOR_WEBGL:g.VENDOR)||'');d.glr=String(g.getParameter(e?e.UNMASKED_RENDERER_WEBGL:g.RENDERER)||'');var l=g.getExtension('WEBGL_lose_context');if(l)l.loseContext()});
q(function(){var c=D.createElement('canvas');c.width=240;c.height=40;var x=c.getContext('2d');x.textBaseline='top';x.font='15px Arial';x.fillStyle='#f60';x.fillRect(110,2,70,22);x.fillStyle='#069';x.fillText('Mensmeter é☃ 1.0',2,14);x.fillStyle='rgba(102,204,0,.7)';x.fillText('Mensmeter é☃ 1.0',4,16);d.cv=h32(c.toDataURL())});
var s=[d.cv,d.glv,d.glr,d.scr,d.tz,d.lg,d.hc,d.mem,d.plat].join('|');d.fp=h32(s)+h32('#'+s);d.fpz=1;
q(function(){crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)).then(function(r){d.fp=hex(new Uint8Array(r));d.fpz=0},function(){})});
M.lokaal=est()},30);
setTimeout(function(){send('a')},1500);setTimeout(function(){send('b')},15000);
}catch(e){}})();
`;

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
function leesJson(x) {
  if (x == null) return null; if (Buffer.isBuffer(x)) x = x.toString('utf8');
  if (typeof x === 'object') return x; const s = String(x); if (!s || s.length > 16000) return null;
  try { const j = JSON.parse(s); return j && typeof j === 'object' ? j : null; } catch (e) { return null; }
}
const cors = res => { res.setHeader('access-control-allow-origin', '*'); res.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS'); res.setHeader('access-control-allow-headers', 'content-type'); };

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://x'); const op = String(url.searchParams.get('op') || '').toLowerCase(); const q = k => url.searchParams.get(k);
  try {
    if (op === 'js') {
      res.setHeader('content-type', 'application/javascript; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=3600, s-maxage=3600'); cors(res);
      return res.status(200).send(MM_JS);
    }
    if (op === 'b') {
      cors(res); res.setHeader('cache-control', 'no-store');
      if (req.method === 'OPTIONS') return res.status(204).end();
      let c = null; const test = req.method === 'GET' && q('test') === '1';
      if (req.method === 'POST') c = leesJson(req.body);
      else if (test) { c = leesJson(q('j')); if (!c || netNaam(c.net) !== 'test') return res.status(400).json({ ok: false, fout: 'testbeacon alleen met net=test' }); }
      else return res.status(405).json({ ok: false, fout: 'POST' });
      if (!c) return res.status(204).end();
      const uit = await verwerkBeacon(kv, c, serverSignalen(req)).catch(e => (test ? { fout: String(e && e.message || e) } : null));
      return test ? res.status(200).json(Object.assign({ ok: !!uit && !uit.fout }, uit || { fout: 'ongeldige vid (16 hex)' })) : res.status(204).end();
    }
    if (op === 'go') return await goKlik(req, res, url, q);
    if (op === 'proef') { res.setHeader('cache-control', 'no-store'); return res.status(200).json(await proef(kv, { dagen: q('dagen'), camp: q('camp') || '' })); }
    if (op === 'export' || op === 'persoon') {
      res.setHeader('cache-control', 'no-store');
      if (!beschermd(req)) return res.status(403).json({ ok: false, fout: 'alleen via de beschermde vercel.app-host' });
      if (op === 'export') return res.status(200).json(await exporteer(kv, { d: q('dag'), van: q('van'), n: q('n'), soort: q('soort') || '' }));
      const p = await persoon(kv, q('pid')); return p ? res.status(200).json(p) : res.status(400).json({ ok: false, fout: 'pid = 16 hex' });
    }
    if (op === 'w') return await wisselRoute(req, res, url, q);
    if (op === 'mmu') { res.setHeader('content-type', 'application/javascript; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=3600, s-maxage=3600'); cors(res); return res.status(200).send(MMU_JS); }
    if (op === 'uitkomst') {
      cors(res); res.setHeader('cache-control', 'no-store');
      if (req.method === 'OPTIONS') return res.status(204).end();
      const j = req.method === 'POST' ? (leesJson(req.body) || {}) : { cid: q('cid') || q('mmc'), soort: q('soort'), waarde: q('waarde'), bron: q('bron') };
      const r = await uitkomst(kv, j).catch(e => ({ ok: false, fout: String(e && e.message || e).slice(0, 200) }));
      return req.method === 'POST' ? res.status(204).end() : res.status(r.ok ? 200 : 400).json(r);
    }
    if (op === 'mmm' || op === 'cm') { res.setHeader('content-type', 'application/javascript; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=300, s-maxage=300'); cors(res); return res.status(200).send(op === 'cm' ? CM_JS : MMM_JS); }
    // Clickmind-publiek (lib/retarget.js): cm.js vraagt na echt gedrag op de pagina welke publieks-pixels mogen afgaan
    if (op === 'rt') {
      cors(res); res.setHeader('cache-control', 'no-store');
      if (req.method === 'OPTIONS') return res.status(204).end();
      const srv = serverSignalen(req), d = dcVan(srv), sc = score({ c: null, s: Object.assign({}, srv, d) }), c = await leesRt(kv);
      const lok = q('lok') === '' || q('lok') == null ? null : Number(q('lok')), sec = Number(q('s')) || 0, act = Number(q('a')) || 0;
      const mens = sec >= c.minSeconden && act >= c.minActies && (lok == null || !Number.isFinite(lok) || lok >= c.minLokaal);
      const qid = /^[0-9a-f]{16}$/.test(String(q('q') || '')) ? String(q('q')) : '';
      const r = await rtBeslis(kv, { bron: 'pagina', site: String(q('site') || '').slice(0, 40), land: srv.land, dc: d.dc === true, bot: !!(sc.vlag && sc.vlag.hl), gpc: req.headers['sec-gpc'] === '1', uit: leesCookie(req, 'mmrt') === 'uit', mens, id: qid, seg: String(q('seg') || '').slice(0, 10) }).catch(() => ({ px: [] }));
      return res.status(200).json({ px: r.px || [] });
    }
    // afmelden voor het Clickmind-publiek (privacypagina): cookie mmrt=uit op dit domein, de pagina zet ook localStorage cmRtUit
    if (op === 'rtuit') {
      cors(res); res.setHeader('cache-control', 'no-store');
      res.setHeader('set-cookie', 'mmrt=uit; Max-Age=31536000; Path=/; Secure; SameSite=Lax');
      const c = leesCookie(req, 'mmp'); if (/^[0-9a-f]{16}$/.test(c)) { try { await kv.set('mm:rtuit:' + c, 1, { ex: 400 * 86400 }); } catch (e) {} }
      return res.status(200).json({ ok: true, afgemeld: true });
    }
    if (op === 'modal' || op === 'modalev' || op === 'modalmail') {
      cors(res); res.setHeader('cache-control', 'no-store');
      if (req.method === 'OPTIONS') return res.status(204).end();
      if (op === 'modal') {
        const c = leesCookie(req, 'mmp');
        const r = await modalBeslis(kv, { site: q('site'), pid: /^[0-9a-f]{16}$/.test(c) ? c : '', q: q('q'), mmc: q('c'), v: q('v'), mob: q('mob') === '1', abo: q('abo') === '1', test: q('test'), origin: String(req.headers.origin || ''), land: String(req.headers['x-vercel-ip-country'] || ''), net: q('net'), zone: q('zone'), ref: q('ref'), uur: q('uur'), hist: { g: q('g'), k: q('k') }, kw: q('kw'), geo: { stad: (() => { try { return decodeURIComponent(String(req.headers['x-vercel-ip-city'] || '')); } catch (x) { return ''; } })(), rg: String(req.headers['x-vercel-ip-country-region'] || ''), cc: String(req.headers['x-vercel-ip-country'] || ''), lat: String(req.headers['x-vercel-ip-latitude'] || ''), lon: String(req.headers['x-vercel-ip-longitude'] || '') } }).catch(e => { console.log('cm modal fout', String(e && e.message || e)); return { toon: false, reden: 'fout' }; });
        return res.status(200).json(r);
      }
      if (op === 'modalev') { const r = await modalEv(kv, { mid: q('mid'), e: q('e') }).catch(e => ({ ok: false })); return req.method === 'GET' ? res.status(r.ok ? 200 : 400).json(r) : res.status(204).end(); }
      if (req.method !== 'POST') return res.status(405).json({ ok: false, fout: 'POST' });
      const j = leesJson(req.body) || {}, srv = serverSignalen(req);
      const r = await modalMail(kv, { mid: j.mid, email: j.email, bewaar: j.bewaar !== false, ipNet: ipInfo(srv.ip).h || ipInfo(srv.ip).net, land: srv.land }).catch(e => ({ ok: false, fout: 'fout' }));
      return res.status(r.ok ? 200 : 400).json(r);
    }
    if (op === 'handoverzet') { // projecten sturen hun werking en stand naar de centrale overdracht (Henkjan 19 okt); gedeelde team-sleutel, ook via keuzehulp.best
      const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''); const given = [req.headers['x-hjdk-token'], bearer].filter(Boolean);
      const ok = [process.env.ZICHT_TOKEN, process.env.GADS_TOKEN, process.env.HJDK_TOKEN].filter(Boolean);
      if (req.method !== 'POST' || !given.some(g => ok.includes(g))) return res.status(401).json({ ok: false, fout: 'sleutel' });
      const H = await import('../lib/handover.js'); const b = leesJson(req.body) || {};
      return res.status(200).json(await H.zetProject(kv, b)); }
    if (op === 'handover') { // handover voor elke chat (Henkjan 17 okt): live stand, open punten en werklog; ?log=<tekst>&wie=<chat> schrijft bij, ?open=<JSON-lijst> zet de open punten
      if (!beschermd(req)) return res.status(403).send('alleen via de beschermde vercel.app-host');
      const H = await import('../lib/handover.js');
      if (q('log')) return res.status(200).json(await H.logBij(kv, { tekst: q('log'), wie: q('wie') || '' }));
      if (q('open')) { let l = null; try { l = JSON.parse(q('open')); } catch (e) {} return res.status(l ? 200 : 400).json(l ? await H.zetOpen(kv, l) : { ok: false, fout: 'open=<JSON-lijst>' }); }
      const t = await H.handover(kv); res.setHeader('cache-control', 'no-store');
      if (q('vorm') === 'json') return res.status(200).json(t.json);
      res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(t.tekst); }
    if (op === 'overdracht') { // levende overdracht voor andere chats (Todayin-chat, Yoors Shop-chat): elke keer opnieuw opgebouwd uit de live instellingen en cijfers
      if (!beschermd(req)) return res.status(403).send('alleen via de beschermde vercel.app-host');
      const t = await overdracht(kv, { project: q('project') || '' }); res.setHeader('content-type', 'text/plain; charset=utf-8'); res.setHeader('cache-control', 'no-store'); return res.status(200).send(t); }
    if (op === 'tiproef') { // bereikbaarheid van het todayin-formulier vanaf de server, zonder iemand aan te melden (ongeldig adres)
      if (!beschermd(req)) return res.status(403).json({ ok: false });
      const r = await fetch((process.env.TODAYIN_URL || 'https://todayin.email') + '/api/ti', { method: 'POST', body: new URLSearchParams({ email: 'geen-adres', src: 'clickmind', ts: '5000', website: '' }), headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': 'Clickmind/1 (+https://whichtobuy.best)' }, redirect: 'manual' }).catch(e => ({ status: 0, text: async () => String(e && e.message || e) }));
      const h = await r.text().catch(() => ''); return res.status(200).json({ ok: true, status: r.status, bereikbaar: r.status === 400 && /does not look right/i.test(h), begin: h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 200) }); }
    if (op === 'modalbeheer') {
      res.setHeader('cache-control', 'no-store');
      if (!beschermd(req)) return res.status(403).json({ ok: false, fout: 'alleen via de beschermde vercel.app-host' });
      if (q('catalogus')) { if (q('j')) { const r = await bewaarCatalogus(kv, JSON.parse(q('j'))); return res.status(r.ok ? 200 : 400).json(r); } return res.status(200).json({ catalogus: await catalogus(kv) }); }
      if (q('j') || req.method === 'POST') { const j = req.method === 'POST' ? leesJson(req.body) : leesJson(q('j')); const r = await bewaarModal(kv, j); return res.status(r.ok ? 200 : 400).json(r); }
      if (q('mail')) {
        const lijst = String(q('mail')).toLowerCase().replace(/[^a-z0-9-]/g, ''), h = await kv.raw(['HGETALL', 'mm:mail:' + lijst]);
        const rijen = []; if (Array.isArray(h)) { for (let i = 0; i + 1 < h.length; i += 2) rijen.push([String(h[i]), leesJson(h[i + 1]) || {}]); } else for (const [a, b] of Object.entries(h || {})) rijen.push([a, leesJson(b) || {}]);
        if (q('formaat') !== 'csv') return res.status(200).json({ lijst, aantal: rijen.length });
        const qq = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
        res.setHeader('content-type', 'text/csv; charset=utf-8'); res.setHeader('content-disposition', 'attachment; filename="lijst-' + lijst + '.csv"');
        return res.status(200).send(['email,datum,site,arm,netwerk,zone,campagne,land,toestemming,bevestigd'].concat(rijen.map(([e, x]) => [e, x.t, x.site, x.arm, x.net, x.zone, x.camp, x.land, x.toestemming, x.bevestigd ? 'ja' : 'nee'].map(qq).join(','))).join('\n'));
      }
      if (q('site')) { const m = await leesModal(kv, q('site'), true); if (!m) return res.status(404).json({ ok: false, fout: 'onbekende site' }); const st = await modalStand(kv, m, Number(q('dagen')) || 14); return res.status(200).json({ modal: m, stand: [...st], momenten: st.momenten, varianten: st.varianten, script: '<script src="https://whichtobuy.best/cm.js" data-site="' + m.site + '" async></script>' }); }
      return res.status(200).json({ modals: await alleModals(kv) });
    }
    if (op === 'blokgedaan') { // de uitvoerder in propellerads-mcp meldt wat hij uitsloot (gedeelde SHOP_SLEUTEL)
      const s = process.env.SHOP_SLEUTEL || ''; if (!s || req.headers['x-shop-sleutel'] !== s) return res.status(401).json({ ok: false });
      const b = leesJson(req.body) || {}; const net = netNaam(b.net || 'propeller');
      await kv.raw(['LPUSH', 'mm:blokgedaan:' + net, JSON.stringify({ t: new Date().toISOString(), geblokkeerd: Number(b.geblokkeerd) || 0, samenvatting: String(b.samenvatting || '').slice(0, 300), fouten: (b.fouten || []).slice(0, 5).map(x => String(x).slice(0, 200)), campagnes: (b.campagnes || []).slice(0, 40) })]);
      await kv.raw(['LTRIM', 'mm:blokgedaan:' + net, 0, 47]); return res.status(200).json({ ok: true }); }
    // lookalikes op uitkomst (lib/lookalike.js, Henkjan 18 okt): openbaar, alleen zone-nummers en aantallen; 1 uur in de cache
    if (op === 'lookalike') {
      res.setHeader('cache-control', 'no-store'); cors(res);
      const project = String(q('project') || 'todayin').replace(/[^a-z]/g, ''), land = String(q('land') || 'us').replace(/[^a-z]/g, '').slice(0, 2), ck = 'mm:lookalike:' + project + '-' + land;
      const oud = await kv.get(ck).catch(() => null);
      if (oud && q('vers') !== '1' && Date.now() - Date.parse(oud.bijgewerkt || 0) < 3600e3) return res.status(200).json(oud);
      const { lookalike } = await import('../lib/lookalike.js');
      try { const L = await lookalike(kv, { project, land }); await kv.set(ck, L, { ex: 2 * 86400 }); return res.status(200).json(L); } catch (e) { return res.status(oud ? 200 : 500).json(oud || { ok: false, fout: String(e && e.message || e).slice(0, 200) }); }
    }
    // verkenner: voorstel voor de witte lijst van de vaste verkenningscampagne (uitvoerder: propellerads-mcp app/api/verken)
    if (op === 'verken') { res.setHeader('cache-control', 'no-store'); cors(res); const { verkenVoorstel } = await import('../lib/lookalike.js'); try { return res.status(200).json(await verkenVoorstel(kv, String(q('sleutel') || 'todayin-us'))); } catch (e) { return res.status(500).json({ ok: false, fout: String(e && e.message || e).slice(0, 200) }); } }
    if (op === 'verkengedaan') { // de uitvoerder meldt de lijst die echt op de campagne staat (gedeelde SHOP_SLEUTEL)
      const s = process.env.SHOP_SLEUTEL || ''; if (!s || req.headers['x-shop-sleutel'] !== s) return res.status(401).json({ ok: false });
      const b = leesJson(req.body) || {}; const { verkenGedaan } = await import('../lib/lookalike.js');
      if (!Array.isArray(b.lijst) || !b.lijst.length) return res.status(400).json({ ok: false, fout: 'lege lijst' });
      return res.status(200).json(await verkenGedaan(kv, String(b.sleutel || 'todayin-us'), b.lijst.map(String).filter(z => /^\d{1,12}$/.test(z)).slice(0, 60), b.voorstel || null));
    }
    if (op === 'blok') { res.setHeader('cache-control', 'no-store'); cors(res); const net = netNaam(q('net') || 'propeller'); return res.status(200).json((await kv.get('mm:blok:' + net)) || { zones: [], wachtOpHenkjan: [], aan: false, bijgewerkt: null }); }
    // Clickmind grijpt in (lib/tagstop.js): welke campagnes moeten stil, per netwerk. Lezen mag iedereen die de lus draait
    // (zelfde vorm als blok); de uitvoerder meldt terug met tagstopgedaan (gedeelde SHOP_SLEUTEL).
    if (op === 'tagstopgedaan') {
      const s = process.env.SHOP_SLEUTEL || ''; if (!s || req.headers['x-shop-sleutel'] !== s) return res.status(401).json({ ok: false });
      const b = leesJson(req.body) || {}; const net = netNaam(b.net || 'propeller');
      await kv.raw(['LPUSH', 'mm:tagstopgedaan:' + net, JSON.stringify({ t: new Date().toISOString(), gestopt: Number(b.gestopt) || 0, samenvatting: String(b.samenvatting || '').slice(0, 300), fouten: (b.fouten || []).slice(0, 5).map(x => String(x).slice(0, 200)), campagnes: (b.campagnes || []).slice(0, 40) })]);
      await kv.raw(['LTRIM', 'mm:tagstopgedaan:' + net, 0, 47]); return res.status(200).json({ ok: true }); }
    if (op === 'tagstop') {
      res.setHeader('cache-control', 'no-store'); cors(res); const net = netNaam(q('net') || 'propeller');
      const m = await import('../lib/tagstop.js');
      if (q('ronde') === '1') { if (!beschermd(req)) return res.status(403).json({ ok: false, fout: 'alleen via de beschermde vercel.app-host' }); return res.status(200).json(await m.tagRonde(kv, { net, droog: q('droog') === '1' })); }
      if (q('stand') === '1') { if (!beschermd(req)) return res.status(403).json({ ok: false, fout: 'alleen via de beschermde vercel.app-host' }); return res.status(200).json(await m.tagStand(kv, { net })); }
      return res.status(200).json((await kv.get('mm:tagstop:' + net)) || { net, campagnes: [], aan: false, bijgewerkt: null });
    }
    // uurwacht (lib/wachtuur.js): aankomst per netwerk en campagne, geld naar tags zonder kopers, verzadiging. Elk uur op :47; alleen melden.
    if (op === 'wachtuur') {
      res.setHeader('cache-control', 'no-store');
      const isCron = (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET) || /vercel-cron/i.test(String(req.headers['user-agent'] || ''));
      if (!isCron && !beschermd(req)) return res.status(403).json({ ok: false, fout: 'alleen cron of de beschermde vercel.app-host' });
      if (q('lees') === '1') return res.status(200).json({ laatst: await kv.get('mm:wachtuur:laatst'), alarmen: ((await kv.raw(['LRANGE', 'mm:alarm:log', 0, 49]).catch(() => [])) || []).map(x => { try { return JSON.parse(x); } catch (e) { return x; } }), pauzes: ((await kv.raw(['LRANGE', 'mm:mdpauze', 0, 9]).catch(() => [])) || []).map(x => { try { return JSON.parse(x); } catch (e) { return x; } }) });
      const { wachtUur, meldTest } = await import('../lib/wachtuur.js'); if (q('test') === '1') return res.status(200).json(await meldTest());
      return res.status(200).json(await wachtUur(kv, { dag: q('dag'), droog: q('droog') === '1' }));
    }
    // ruwe kliklog naar Vercel Blob (elk uur via cron, of met de hand via de beschermde host); ruwstand = wat waar staat
    if (op === 'ruwarchief' || op === 'ruwstand') {
      res.setHeader('cache-control', 'no-store');
      const isCron = (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET) || /vercel-cron/i.test(String(req.headers['user-agent'] || ''));
      if (!isCron && !beschermd(req)) return res.status(403).json({ ok: false, fout: 'alleen cron of de beschermde vercel.app-host' });
      const { archiveer, archiefStand } = await import('../lib/ruwarchief.js');
      if (op === 'ruwstand') return res.status(200).json(await archiefStand(kv, { dagen: Number(q('dagen')) || 3 }));
      const d = q('dag'); const r = await archiveer(kv, { dagen: d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? [d] : null });
      return res.status(r.ok ? 200 : 500).json(r);
    }
    if (op === 'leer') {
      res.setHeader('cache-control', 'no-store');
      const isCron = (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET) || /vercel-cron/i.test(String(req.headers['user-agent'] || ''));
      if (!isCron && !beschermd(req)) return res.status(403).json({ ok: false, fout: 'alleen cron of de beschermde vercel.app-host' });
      if (q('lees') === '1') return res.status(200).json({ laatst: await kv.get('mm:leer:laatst'), log: ((await kv.raw(['LRANGE', 'mm:leerlog', 0, 47])) || []).map(String) });
      return res.status(200).json(await leerRonde(kv, { droog: q('droog') === '1' }));
    }
    if (op === 'terugdag') {
      res.setHeader('cache-control', 'no-store');
      const isCron = (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET) || /vercel-cron/i.test(String(req.headers['user-agent'] || ''));
      if (!isCron && !beschermd(req)) return res.status(403).json({ ok: false, fout: 'alleen cron of de beschermde vercel.app-host' });
      return res.status(200).json(await dagDossiers(kv));
    }
    if (['wissel', 'amazon', 'amazonmeter', 'venster', 'geheugen', 'termen', 'mdgo', 'mdpauze', 'gosplit', 'instelling', 'overzicht', 'clickmind', 'terugbetaling', 'voorspel', 'voorspelruw', 'mensgeld', 'overlap', 'retarget', 'ctrtest', 'zonetag', 'cc', 'ccdag'].includes(op)) {
      res.setHeader('cache-control', 'no-store');
      if (!beschermd(req)) return res.status(403).json({ ok: false, fout: 'alleen via de beschermde vercel.app-host' });
      if (op === 'gosplit') { const p = String(q('p') || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 8); if (!p) return res.status(400).json({ ok: false, fout: 'p' }); if (q('pct') != null && q('pct') !== '') { const v = Math.max(0, Math.min(100, Math.round(Number(q('pct'))))); if (!Number.isFinite(v)) return res.status(400).json({ ok: false, fout: 'pct 0-100' }); await kv.set('mm:gosplit:' + p, v); } return res.status(200).json({ ok: true, p, pct: await kv.get('mm:gosplit:' + p), uitleg: '0 = iedereen via de meetpagina (browsermeting), 100 = iedereen direct door, 50 = per persoon vast de helft' }); }
      // mdpauze: Mondiad-campagnes pauzeren, alleen op Henkjans woord (reden verplicht, staat in mm:mdpauze). Henkjan 16 okt: "Ja zet mondiad uit" (ml-push-20).
      // 19 okt: de schakelaar gaat twee kanten op (&aan=1 zet ze weer op RUNNING). Reden: die ochtend stond op "alles dicht" per ongeluk
      // ook MyLevel, todayin, SHOP-LUS en de spellen stil; ze een voor een terugzetten is te traag als het er honderd zijn.
      if (op === 'mdpauze') { const { md } = await import('../lib/mdmcp.js'); const ids = String(q('ids') || '').split(',').map(x => x.replace(/\D/g, '')).filter(Boolean).slice(0, 80); const reden = String(q('reden') || '').slice(0, 200); if (!ids.length || !reden) return res.status(400).json({ ok: false, fout: 'ids=1,2,3&reden=<Henkjans woord>' }); const t0 = Date.now(), uit = [];
        const aan = q('aan') === '1', doel = aan ? 'RUNNING' : 'PAUSED';
        for (const id of ids) { if (Date.now() - t0 > 50000) { uit.push({ id, status: 'nog niet (tijd op)' }); continue; } try { const r = await md('mondiad_update_campaign', { json: JSON.stringify({ id: Number(id), status: doel }) }); uit.push({ id, status: String((r && (r.status || (r.data && r.data.status))) || '?') }); } catch (e) { uit.push({ id, status: 'fout', fout: String(e.message || e).slice(0, 120) }); } }
        try { await kv.raw(['LPUSH', 'mm:mdpauze', JSON.stringify({ t: new Date().toISOString(), reden, doel, uit })]); await kv.raw(['LTRIM', 'mm:mdpauze', 0, 99]); } catch (e) {}
        return res.status(200).json({ ok: true, doel, gepauzeerd: uit.filter(x => /pause/i.test(x.status)).length, aangezet: uit.filter(x => /run/i.test(x.status)).length, uit }); }
      if (op === 'mdgo') { const { mondiadNaarGo } = await import('../lib/mdgo.js'); const ids = String(q('ids') || '').split(',').map(x => x.replace(/\D/g, '')).filter(Boolean).slice(0, 12); if (!ids.length) return res.status(400).json({ ok: false, fout: 'ids=1,2,3' }); const r = await mondiadNaarGo(kv, { ids, p: String(q('p') || 'mdus').replace(/[^A-Za-z0-9]/g, '').slice(0, 8), mal: q('mal') ? String(q('mal')).replace(/\D/g, '') : null, tag: /^[a-z0-9-]{2,30}-2[01]$/.test(String(q('tag') || '')) ? String(q('tag')) : null, droog: q('droog') === '1', forceer: q('forceer') === '1', zones: q('zones') === 'zwart' ? 'zwart' : '', zoneBudget: q('perzone') ? Number(q('perzone')) : null, label: q('label') || '' }); return res.status(r.ok ? 200 : 400).json(r); }
      if (op === 'termen') { const T = await import('../lib/termles.js'); if (q('k')) return res.status(200).json(await T.termPrijs(q('k'), q('m') || '')); if (q('tag')) return res.status(200).json(await T.tagGeenKoper(kv, q('tag'), { dagen: Number(q('dagen')) || 3 })); return res.status(200).json({ ok: true, lessen: T.LESSEN, grenzen: T.GRENS, verzadiging: await T.verzadiging(kv, { dag: q('dag') }) }); }
      // voorspellers (lib/voorspel.js): welke kenmerken van een klik voorspellen wat hij doet; voorspelruw vult dagen vóór de live tellers aan uit de ruwe log
      if (op === 'zonetag') { const m = await import('../lib/zonetag.js'); const j = q('j'); if (j) { let x = null; try { x = JSON.parse(j); } catch (e) { return res.status(400).json({ ok: false, fout: 'j moet JSON zijn' }); } return res.status(200).json(await m.zetZoneTag(kv, x)); } return res.status(200).json({ ok: true, zonetag: await m.leesZoneTag(kv, true) }); }
      if (op === 'ctrtest') { const m = await import('../lib/ctrtest.js'); const j = q('j'); if (j) { let x = null; try { x = JSON.parse(j); } catch (e) { return res.status(400).json({ ok: false, fout: 'j moet JSON zijn' }); } return res.status(200).json(await m.zetTest(kv, x)); } let pa = null; if (q('pa')) { try { pa = JSON.parse(q('pa')); } catch (e) {} } return res.status(200).json(await m.testStand(kv, q('naam'), { dagen: q('dagen') || 7, pa })); }
      if (op === 'retarget') { const j = q('j'); if (j) { let x = null; try { x = JSON.parse(j); } catch (e) { return res.status(400).json({ ok: false, fout: 'j moet JSON zijn' }); } return res.status(200).json(await zetRt(kv, x)); } return res.status(200).json(await rtStand(kv, { dagen: q('dagen') || 14 })); }
      if (op === 'mensgeld') { const { mensgeld } = await import('../lib/mensgeld.js'); return res.status(200).json(await mensgeld(kv, { dag: q('dag') })); }
      if (op === 'overlap') { const { termOverlap } = await import('../lib/mensgeld.js'); return res.status(200).json(await termOverlap(kv, { dagen: q('dagen') || 3, min: Number(q('min')) || 5 })); }
      if (op === 'voorspel') { const { voorspel } = await import('../lib/voorspel.js'); return res.status(200).json(await voorspel(kv, { dagen: q('dagen') || 7, min: Number(q('min')) || 30 })); }
      if (op === 'voorspelruw') { const { voorspelRuw } = await import('../lib/voorspel.js'); const r = await voorspelRuw(kv, q('dag'), { opnieuw: q('opnieuw') === '1' }); return res.status(r.ok ? 200 : 400).json(r); }
      if (op === 'geheugen') { const { geheugenPerGroep, geheugenPatroon } = await import('../lib/geheugen.js'); const m = String(q('match') || ''); return res.status(200).json(m ? await geheugenPatroon(kv, { match: m.slice(0, 60) }) : await geheugenPerGroep(kv)); }
      if (op === 'venster') { const { vensterPerZone } = await import('../lib/venster.js'); const r = await vensterPerZone(kv, { dag: q('dag') || new Date().toISOString().slice(0, 10), min: Number(q('min')) || 10 }); return res.status(r.ok ? 200 : 400).json(r); }
      if (op === 'amazonmeter') { const { amazonMeter } = await import('../lib/amzmeter.js'); const r = await amazonMeter(kv, { dag: q('dag'), tz: q('tz') || undefined }); return res.status(r.ok ? 200 : 400).json(r); }
      if (op === 'amazon') {
        // hele dagronde in één keer: POST { dag, bron, rijen: [{tag, kliks, artikelen, omzet, verdiend}] }
        if (req.method === 'POST') {
          const b = leesJson(req.body) || {}; if (!Array.isArray(b.rijen)) return res.status(400).json({ ok: false, fout: 'body { dag, rijen: [{tag,kliks,artikelen,omzet}] }' });
          const uit = []; for (const r of b.rijen.slice(0, 60)) uit.push(await amazonUitkomst(kv, { dag: b.dag, bron: b.bron, ...r }));
          return res.status(200).json({ ok: uit.every(x => x.ok), dag: b.dag, rijen: uit });
        }
        const r = await amazonUitkomst(kv, Object.fromEntries(url.searchParams)); return res.status(r.ok ? 200 : 400).json(r);
      }
      // Creator Connections (lib/cc.js): lijst voeden, dagronde draaien, voorstellen en accepteerwachtrij lezen
      if (op === 'cc' || op === 'ccdag') {
        const m = await import('../lib/cc.js');
        const sub = op === 'ccdag' ? 'dag' : String(q('op2') || q('deel') || '').toLowerCase();
        if (req.method === 'POST' || q('zet')) {
          const j = leesJson(req.method === 'POST' ? req.body : q('zet'));
          if (!j || !Array.isArray(j.rijen)) return res.status(400).json({ ok: false, fout: 'body { soort: geaccepteerd|open, rijen: [{asin,merk,titel,epc,prijs,term}] }' });
          return res.status(200).json(Object.assign({ ok: true }, await m.zet(j.soort, j.rijen)));
        }
        if (q('regels')) { const j = leesJson(q('regels')); if (!j) return res.status(400).json({ ok: false, fout: 'regels moet JSON zijn' }); return res.status(200).json({ ok: true, regels: await m.zetRegels(j) }); }
        if (sub === 'dag') { const r = await m.dagronde({ dag: q('dag'), tag: q('tag'), cc: q('cc') }); return res.status(200).json(Object.assign({ ok: true }, r)); }
        if (sub === 'wachtrij') { const s = await m.stand(q('dag')); return res.status(200).json({ ok: true, wachtrij: (s.laatsteRonde && s.laatsteRonde.wachtrij) || [] }); }
        if (sub === 'voorstel') { const s = await m.stand(q('dag')); return res.status(200).json({ ok: true, gekozen: (s.laatsteRonde && s.laatsteRonde.gekozen) || [] }); }
        return res.status(200).json(Object.assign({ ok: true }, await m.stand(q('dag'))));
      }
      if (op === 'instelling') {
        if (q('j')) { const j = leesJson(q('j')); if (!j) return res.status(400).json({ ok: false, fout: 'j moet JSON zijn' }); const oud = (await kv.get('mm:instelling')) || {}; const nw = { ...oud, ...j, bijgewerkt: new Date().toISOString() }; if ('blokkeren' in j) nw.blokkeren = j.blokkeren === true; await kv.set('mm:instelling', nw); return res.status(200).json({ ok: true, instelling: nw }); }
        return res.status(200).json(await instelling(kv));
      }
      if (op === 'wissel') {
        if (q('j') || req.method === 'POST') { const j = req.method === 'POST' ? leesJson(req.body) : leesJson(q('j')); const r = await bewaarWissel(kv, j); return res.status(r.ok ? 200 : 400).json(r); }
        if (q('naam')) { const w = await leesWissel(kv, q('naam'), true); if (!w) return res.status(404).json({ ok: false, fout: 'onbekende wissel' }); return res.status(200).json({ wissel: w, stand: await wisselStand(kv, w, Number(q('dagen')) || 7), link: 'https://whichtobuy.best/w/' + w.naam + '?n=propeller&c={campaignid}&z={zoneid}&s=${SUBID}&b={bannerid}' }); }
        return res.status(200).json({ wissels: await alleWissels(kv) });
      }
      if (op === 'overzicht') { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(200).send(await overzicht()); }
      if (op === 'clickmind') { const { clickmindKaart } = await import('../lib/kaart.js'); res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(200).send(await clickmindKaart(kv)); }
      if (op === 'terugbetaling') {
        const d = await dossier(kv, { net: netNaam(q('net') || 'propeller'), van: q('van'), tot: q('tot') });
        if (q('formaat') === 'csv') { res.setHeader('content-type', 'text/csv; charset=utf-8'); res.setHeader('content-disposition', 'attachment; filename="terugbetaling-' + d.netwerk + '-' + d.van + '_' + d.tot + '.csv"'); return res.status(200).send(naarCsv(d)); }
        return res.status(200).json(d);
      }
    }
    if (op === 'zones') { res.setHeader('cache-control', 'no-store'); return res.status(200).json(await zones(kv, { net: q('net') || '', dagen: q('dagen') })); }
    if (op === 'patronen') { res.setHeader('cache-control', 'no-store'); return res.status(200).json(await patronen(kv, { dagen: q('dagen') })); }
    if (op === 'stand') { res.setHeader('cache-control', 'no-store'); return res.status(200).json(await stand(kv)); }
    return res.status(200).json({ ok: true, naam: 'Clickmind', mensmeter: ['/mm.js', '/mmu.js', '/api/mm/b', '/go?k=<zoekterm>&tag=<tag>&tag2=<tag 302>&n=&c=&z=&s=&b=&p=', '/w/<wissel>?n=&c=&z=&s=&b=', '/api/mm/uitkomst?cid=&soort=', '/api/mm/zones?net=&dagen=3', '/api/mm/patronen?dagen=1', '/api/mm/stand', '/api/mm/proef?dagen=1', '/api/mm/blok?net=propeller'] });
  } catch (e) {
    if (op === 'go') { const d = noodDoel(q); if (d) { res.statusCode = 302; res.setHeader('location', d); return res.end(); } }
    if (op === 'w') { try { const w = await leesWissel(kv, q('w')); const a = w && w.armen.find(x => x.wie === 'alle' || x.wie === 'nieuw'); const d = a && bestemming(a, { cid: 'x', pid: 'x', net: netNaam(q('n')), zone: schoon(q('z')), camp: schoon(q('c')), sub: schoon(q('s'), 80), cr: schoon(q('b')), wissel: w.naam }); if (d) { res.statusCode = 302; res.setHeader('location', d); return res.end(); } } catch (x) {} }
    if (op === 'b') return res.status(204).end();
    return res.status(500).json({ ok: false, fout: String(e && e.message || e).slice(0, 300) });
  }
}

// export en persoon alleen via *.vercel.app: die host zit achter Vercel-inlog (ssoProtection all_except_custom_domains)
const beschermd = req => /\.vercel\.app$/i.test(String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]) && /\.vercel\.app$/i.test(String(req.headers.host || '').split(':')[0]);
const leesCookie = (req, naam) => { const m = new RegExp('(?:^|;\\s*)' + naam + '=([^;]+)').exec(String(req.headers.cookie || '')); return m ? decodeURIComponent(m[1]) : ''; };
// bij een fout altijd nog naar Amazon (met de eerste tag), nooit een kapotte klik
function noodDoel(q) { try { return amazonBouw({ k: q('k'), a: q('a'), u: q('u'), m: q('m'), tag: q('tag'), sub: (q('p') || 'go') + '-' + schoon(q('z')) }); } catch (e) { return null; } }

async function goKlik(req, res, url, q) {
  res.setHeader('cache-control', 'no-store, private'); res.setHeader('x-robots-tag', 'noindex, nofollow'); res.setHeader('referrer-policy', 'origin');
  const tag1 = echteTag(q('tag')), tag2 = tagOk(q('tag2')) ? echteTag(q('tag2')) : '';
  if (!tagOk(tag1) || !(q('k') || q('a') || q('u'))) { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(400).send('Ongeldige link: nodig zijn tag=<Amazon-tag> en k=<zoekterm>, a=<ASIN> of u=<Amazon-URL>.'); }
  let pid = leesCookie(req, 'mmp'); const nieuw = !/^[0-9a-f]{16}$/.test(pid); if (nieuw) pid = nieuwId(8);
  const cid = nieuwId(6), z = schoon(q('z')), pre = String(q('p') || 'go').replace(/[^A-Za-z0-9]/g, '').slice(0, 8) || 'go';
  let split = tag2 ? (q('split') == null || q('split') === '' ? 50 : Number(q('split'))) : (q('v') === '302' ? 100 : 0);
  // variant per voorvoegsel op de server te wisselen zonder de campagnelink aan te raken (mm:gosplit:<p> = 0 meetpagina .. 100 direct)
  try { const ov = await kv.get('mm:gosplit:' + pre); if (ov != null && Number.isFinite(Number(ov))) split = Number(ov); } catch (e) {}
  const arm = armVoor(pid, split); let tag = arm === '302' && tag2 ? tag2 : tag1;
  // tag per zonegroep (lib/zonetag.js): zodat Associates per zonegroep laat zien wie koopt; zonder instelling ongewijzigd
  try { const { tagVoorZone } = await import('../lib/zonetag.js'); tag = await tagVoorZone(kv, netNaam(q('n')), tag, z); } catch (e) {}
  // ascsubtag per zone en advertentie, nooit per klik of persoon (Associates Program Policies §2(b)); de klik-id staat alleen in ons eigen register
  // CTR-test (lib/ctrtest.js): met t=<test> kiest de advertentie (b={bannerid}) haar eigen zoekterm, zodat één campagne termen eerlijk vergelijkt
  const cr0 = schoon(q('b'), 14), tNaam = String(q('t') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20);
  let kEff = q('k'); if (tNaam && cr0 && cr0 !== '-') { try { const { termVoorAdvertentie } = await import('../lib/ctrtest.js'); const a = await termVoorAdvertentie(kv, tNaam, cr0); if (a && a.k) kEff = a.k; } catch (e) {} }
  const doel = amazonBouw({ k: kEff, a: q('a'), u: q('u'), m: q('m'), tag, sub: pre + '-' + (z === '-' ? 'x' : z) + (cr0 && cr0 !== '-' ? '-' + cr0 : '') });
  if (!doel) { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(400).send('Ongeldige doel-URL of markt.'); }
  res.setHeader('set-cookie', 'mmp=' + pid + '; Max-Age=15552000; Path=/; Secure; HttpOnly; SameSite=Lax');
  const ctx = { cid, pid, net: netNaam(q('n')), zone: z, camp: schoon(q('c')), arm, tag, cr: schoon(q('b')) };
  const prefetch = /prefetch|prerender/i.test(String(req.headers['sec-purpose'] || req.headers.purpose || ''));
  if ((req.method === 'GET' || req.method === 'HEAD') && !prefetch) {
    const werk = laterAf(Promise.all([
      verwerkKlik(kv, { cid, pid, nieuw, arm, tag, net: q('n'), camp: q('c'), zone: q('z'), sub: q('s'), cr: q('b'), kw: kEff || q('a') || '', doel, p: pre }, serverSignalen(req)),
      tNaam ? import('../lib/ctrtest.js').then(m => Promise.all(m.telCmds(tNaam, new Date().toISOString().slice(0, 10), cr0, pid).map(c => kv.raw(c)))).catch(() => {}) : null,
      cidKoppel(kv, { cid, pid, arm, tag, net: ctx.net, zone: ctx.zone, camp: ctx.camp })
    ]).catch(e => { console.log('mm go fout', String(e && e.message || e)); }));
    await Promise.race([werk, new Promise(r => setTimeout(r, 300))]);
  }
  if (arm === '302' || req.method === 'HEAD') { res.statusCode = 302; res.setHeader('location', doel); return res.end(); }
  // Clickmind-publiek: op de meetpagina alleen voor iemand die eerder bewees een mens te zijn (mm:p echt/actie/aanmelding/koop), zonder datacenter
  try { const rc = await leesRt(kv); if (rc.aan && rc.go && !prefetch) { const srv = serverSignalen(req), dd = dcVan(srv); const h = await kv.raw(['HGETALL', 'mm:p:' + pid]).catch(() => null); const p = {}; for (let i = 0; h && i < h.length; i += 2) p[h[i]] = h[i + 1]; const mens = soortPersoon(p).has('mens'); const sc = score({ c: null, s: Object.assign({}, srv, dd) }); const uit = leesCookie(req, 'mmrt') === 'uit' || !!(await kv.get('mm:rtuit:' + pid).catch(() => null)); const r = await rtBeslis(kv, { bron: 'go', land: srv.land, dc: dd.dc === true, bot: !!(sc.vlag && sc.vlag.hl), gpc: req.headers['sec-gpc'] === '1', uit, mens, id: pid }); if (r.px && r.px.length) ctx.rt = r.px; } } catch (e) {}
  res.setHeader('content-type', 'text/html; charset=utf-8');
  return res.status(200).send(meetPagina(doel, ctx));
}

// De meetpagina: leeg wit scherm, meet in ~150 ms wat de browser over zichzelf zegt, stuurt dat met sendBeacon en gaat door naar Amazon.
// Alles in try/catch; een vangnet stuurt na 600 ms hoe dan ook door, en zonder JavaScript doet de noscript-refresh het.
function meetPagina(doel, ctx) {
  const J = x => JSON.stringify(x).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, '');
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="origin"><meta name="robots" content="noindex,nofollow"><title>Amazon</title>'
    + '<noscript><meta http-equiv="refresh" content="0;url=' + esc(doel) + '"></noscript>'
    + '<style>html,body{margin:0;background:#fff}p{font:15px system-ui,-apple-system,sans-serif;color:#666;padding:24px;opacity:0;animation:z .2s 1.2s forwards}@keyframes z{to{opacity:1}}a{color:#06c}</style></head>'
    + '<body><p>Opening Amazon&hellip; <a href="' + esc(doel) + '">Continue</a></p>'
    + '<script>var DOEL=' + J(doel) + ',CTX=' + J(ctx) + ';try{setTimeout(function(){location.replace(DOEL)},600)}catch(e){}</script>'
    + (ctx.rt && ctx.rt.length ? '<script>' + RT_GO_JS + '</script>' : '')
    + '<script>' + GO_JS + '</script></body></html>';
}
const GO_JS = String.raw`(function(){var W=window,N=navigator,D=document,P=W.performance,t0=P&&P.now?P.now():0,klaar=0,d,wacht=0;
function q(f){try{return f()}catch(e){return null}}
function now(){return P&&P.now?P.now():0}
function h32(s){var h=0x811c9dc5;s=String(s);for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul?Math.imul(h,16777619):(h*16777619)|0}return('0000000'+(h>>>0).toString(16)).slice(-8)}
function stuur(){try{d.t=Math.round(now()-t0);d.wacht=wacht;var x=JSON.stringify(d);if(!(N.sendBeacon&&N.sendBeacon('/api/mm/b',x))&&W.fetch)fetch('/api/mm/b',{method:'POST',body:x,keepalive:true,credentials:'omit'})['catch'](function(){})}catch(e){}}
function weg(){if(klaar)return;klaar=1;stuur();try{location.replace(DOEL)}catch(e){location.href=DOEL}}
try{
d={v:2,via:'go',f:'a',vid:CTX.cid,pid:CTX.pid,net:CTX.net,zone:CTX.zone,camp:CTX.camp,arm:CTX.arm,tag:CTX.tag,cr:CTX.cr,pg:location.host+location.pathname};
var ua=N.userAgent||'';d.ua=ua;d.tnav=Math.round(t0);
d.wd=N.webdriver===true?1:0;d.pl=q(function(){return N.plugins.length});d.mt=q(function(){return N.mimeTypes.length});
d.lg=q(function(){return(N.languages||[]).join(',')})||'';d.lg0=d.lg?0:1;d.lang=N.language||'';d.plat=N.platform||'';d.vend=N.vendor||'';
d.hc=N.hardwareConcurrency||0;d.mem=N.deviceMemory||0;d.mtp=N.maxTouchPoints||0;d.touch='ontouchstart' in W?1:0;
d.pdf=q(function(){return N.pdfViewerEnabled?1:0});d.ck=N.cookieEnabled?1:0;d.dnt=N.doNotTrack||'';d.gpc=N.globalPrivacyControl?1:0;d.onl=N.onLine?1:0;
d.ncr=/Chrome\/\d/.test(ua)&&!/; wv\)|SamsungBrowser|CriOS|EdgiOS/.test(ua)&&!W.chrome?1:0;d.chk=q(function(){return W.chrome?Object.keys(W.chrome).join(','):''});
d.ownN=q(function(){return Object.getOwnPropertyNames(N).length});
d.wdg=q(function(){var g=Object.getOwnPropertyDescriptor(Navigator.prototype,'webdriver');return !g?2:(g.get&&/\[native code\]/.test(Function.prototype.toString.call(g.get))?0:1)});
d.ev=q(function(){return eval.toString().length});
d.mth=q(function(){return h32([Math.tan(-1e300),Math.sinh(1),Math.expm1(1),Math.cbrt(100),Math.atanh(0.5),Math.log1p(10)].join(','))});
d.err=q(function(){try{null[0]()}catch(e){return h32(e.message)+'.'+String(e.stack||'').split('\n').length}});
d.tz=q(function(){return Intl.DateTimeFormat().resolvedOptions().timeZone})||'';d.tzo=new Date().getTimezoneOffset();
d.intl=q(function(){var o=Intl.DateTimeFormat().resolvedOptions();return[o.locale,o.numberingSystem,o.calendar,o.hourCycle||''].join('|')});
d.scr=q(function(){return screen.width+'x'+screen.height+'x'+(W.devicePixelRatio||1)})||'';d.avl=q(function(){return screen.availWidth+'x'+screen.availHeight});d.cd=q(function(){return screen.colorDepth});
d.or=q(function(){return screen.orientation?screen.orientation.type:String(W.orientation)});d.win=W.innerWidth+'x'+W.innerHeight;d.out=W.outerWidth+'x'+W.outerHeight;d.ow0=W.outerWidth===0&&W.outerHeight===0?1:0;
d.mq=q(function(){var m=function(x){return W.matchMedia&&W.matchMedia(x).matches?1:0};return''+m('(prefers-color-scheme: dark)')+m('(pointer: coarse)')+m('(hover: none)')+m('(display-mode: standalone)')+m('(prefers-reduced-motion: reduce)')+m('(any-pointer: fine)')+m('(dynamic-range: high)')});
d.con=q(function(){var c=N.connection;return c?[c.effectiveType,c.rtt,c.downlink,c.saveData?1:0,c.type||''].join('|'):''});
d.hl=q(function(){return history.length});d.ref=q(function(){return D.referrer?new URL(D.referrer).host:''})||'';d.vis=D.visibilityState||'';d.foc=q(function(){return D.hasFocus()?1:0});d.opn=W.opener?1:0;d.top=W.top===W?1:0;
d.nav=q(function(){var e=P.getEntriesByType('navigation')[0];return e?[e.type,e.redirectCount,e.nextHopProtocol,Math.round(e.responseStart),Math.round(e.domInteractive||0),e.transferSize||0].join('|'):''});
var g0=now();
q(function(){var c=D.createElement('canvas'),g=c.getContext('webgl')||c.getContext('experimental-webgl');if(!g){d.glr='-';return}var e=g.getExtension('WEBGL_debug_renderer_info');d.glv=String(g.getParameter(e?e.UNMASKED_VENDOR_WEBGL:g.VENDOR)||'');d.glr=String(g.getParameter(e?e.UNMASKED_RENDERER_WEBGL:g.RENDERER)||'');d.glx=g.getParameter(g.MAX_TEXTURE_SIZE);d.gle=(g.getSupportedExtensions()||[]).length;var l=g.getExtension('WEBGL_lose_context');if(l)l.loseContext()});
q(function(){var c=D.createElement('canvas');c.width=240;c.height=40;var x=c.getContext('2d');x.textBaseline='top';x.font='15px Arial';x.fillStyle='#f60';x.fillRect(110,2,70,22);x.fillStyle='#069';x.fillText('Mensmeter é☃ 1.0',2,14);x.fillStyle='rgba(102,204,0,.7)';x.fillText('Mensmeter é☃ 1.0',4,16);d.cv=h32(c.toDataURL())});
d.tg=Math.round(now()-g0);
var s=[d.cv,d.glv,d.glr,d.scr,d.tz,d.lg,d.hc,d.mem,d.plat].join('|');d.fp=h32(s)+h32('#'+s);
var open=0;function af(){open--;if(open<=0)setTimeout(weg,0)}
function bij(p,f){try{if(!p||!p.then)return;open++;wacht++;p.then(function(v){q(function(){f(v)});af()},function(){af()})}catch(e){}}
var u2=N.userAgentData;if(u2){d.uad={m:u2.mobile?1:0,p:u2.platform||'',b:q(function(){return u2.brands.map(function(x){return x.brand+' '+x.version}).join(', ')})||''};
bij(q(function(){return u2.getHighEntropyValues(['model','platformVersion','architecture','bitness','fullVersionList','wow64','formFactors'])}),function(v){d.uah={model:v.model||'',pv:v.platformVersion||'',arch:v.architecture||'',bit:v.bitness||'',wow:v.wow64?1:0,ff:(v.formFactors||[]).join(','),fv:q(function(){return v.fullVersionList.map(function(x){return x.brand+' '+x.version}).join(', ')})||''}})}
bij(q(function(){return N.getBattery&&N.getBattery()}),function(b){d.bat=[Math.round(b.level*100),b.charging?1:0,b.chargingTime,b.dischargingTime].join('|')});
bij(q(function(){return N.storage&&N.storage.estimate&&N.storage.estimate()}),function(e){d.quota=Math.round((e.quota||0)/1048576)});
bij(q(function(){return N.mediaDevices&&N.mediaDevices.enumerateDevices&&N.mediaDevices.enumerateDevices()}),function(l){var a=0,o=0,v=0;for(var i=0;i<l.length;i++){if(l[i].kind==='audioinput')a++;else if(l[i].kind==='audiooutput')o++;else if(l[i].kind==='videoinput')v++}d.dev=a+'|'+o+'|'+v});
bij(q(function(){return N.permissions&&N.permissions.query&&N.permissions.query({name:'notifications'})}),function(p){d.nps=p.state;d.np=W.Notification&&Notification.permission==='denied'&&p.state==='prompt'?1:0;d.ntf=W.Notification?Notification.permission:''});
if(!open)setTimeout(weg,0);
setTimeout(weg,Math.max(20,150-(now()-t0)));
}catch(e){try{if(d){d.jsfout=String(e&&e.message||e).slice(0,120)}}catch(x){}weg()}
})();`;

// ---- DE WISSEL: één link per advertentie, de wissel kiest de bestemming ----
async function wisselRoute(req, res, url, q) {
  res.setHeader('cache-control', 'no-store, private'); res.setHeader('x-robots-tag', 'noindex, nofollow'); res.setHeader('referrer-policy', 'origin');
  const w = await leesWissel(kv, q('w')).catch(() => null);
  if (!w) { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(404).send('Onbekende wissel.'); }
  let pid = leesCookie(req, 'mmp'); const nieuw = !/^[0-9a-f]{16}$/.test(pid); if (nieuw) pid = nieuwId(8);
  let persoonNu = null; if (!nieuw) { try { const h = await kv.raw(['HGETALL', 'mm:p:' + pid]); const o = {}; if (Array.isArray(h)) for (let i = 0; i + 1 < h.length; i += 2) o[h[i]] = h[i + 1]; else Object.assign(o, h || {}); persoonNu = o; } catch (e) {} }
  // staat de wissel uit, dan krijgt iedereen de eerste arm voor iedereen (geen klik gaat verloren), en het wordt gewoon vastgelegd
  let keuze = w.uit ? { arm: w.armen.find(a => a.wie === 'alle' || a.wie === 'nieuw'), soort: [...soortPersoon(persoonNu)], vast: true } : kiesArm(w, persoonNu, pid);
  if (!keuze || !keuze.arm) keuze = { arm: w.armen[0], soort: [...soortPersoon(persoonNu)], vast: true };
  const cid = nieuwId(6), srv = serverSignalen(req);
  const ctx = { cid, pid, net: netNaam(q('n')), zone: schoon(q('z')), camp: schoon(q('c')), sub: schoon(q('s'), 80), cr: schoon(q('b')), wissel: w.naam, land: srv.land };
  const arm = keuze.arm, doel = bestemming(arm, ctx);
  if (!doel) { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(500).send('Bestemming van de wissel klopt niet.'); }
  res.setHeader('set-cookie', 'mmp=' + pid + '; Max-Age=15552000; Path=/; Secure; HttpOnly; SameSite=Lax');
  const variant = arm.soort === 'amazon' && arm.variant === 'js' ? 'js' : '302';
  const prefetch = /prefetch|prerender/i.test(String(req.headers['sec-purpose'] || req.headers.purpose || ''));
  if ((req.method === 'GET' || req.method === 'HEAD') && !prefetch) {
    const werk = laterAf(Promise.all([
      verwerkKlik(kv, { cid, pid, nieuw, arm: variant, tag: arm.tag || arm.id, net: q('n'), camp: q('c'), zone: q('z'), sub: q('s'), cr: q('b'), kw: arm.k || arm.a || arm.id, doel, p: (arm.p || w.naam) }, srv),
      wisselKlik(kv, w, keuze, ctx)
    ]).catch(e => { console.log('mm wissel fout', String(e && e.message || e)); }));
    await Promise.race([werk, new Promise(r => setTimeout(r, 300))]);
  }
  if (variant === '302' || req.method === 'HEAD') { res.statusCode = 302; res.setHeader('location', doel); return res.end(); }
  res.setHeader('content-type', 'text/html; charset=utf-8');
  return res.status(200).send(meetPagina(doel, { cid, pid, net: ctx.net, zone: ctx.zone, camp: ctx.camp, arm: 'js', tag: arm.tag, cr: ctx.cr }));
}

// Script voor bestemmingen (spel, todayin, finds, MYLEVEL): onthoudt de klik-id (mmc) en meldt een uitkomst met mmUitkomst('aanmelding').
const MMU_JS = String.raw`/* clickmind uitkomst */(function(){var W=window,D=document;try{var c='',u=new URL(location.href).searchParams.get('mmc')||'';
if(/^[0-9a-f]{8,24}$/.test(u)){c=u;try{sessionStorage.setItem('mmc',u);localStorage.setItem('mmc',u+'|'+Date.now())}catch(e){}}
if(!c){try{c=sessionStorage.getItem('mmc')||'';if(!c){var l=(localStorage.getItem('mmc')||'').split('|');if(l[0]&&Date.now()-Number(l[1]||0)<864e5)c=l[0]}}catch(e){}}
var gehad={};W.mmUitkomst=function(soort,waarde){try{if(!c||gehad[soort])return;gehad[soort]=1;var x=JSON.stringify({cid:c,soort:soort,waarde:waarde||0,bron:location.host});
if(!(navigator.sendBeacon&&navigator.sendBeacon('https://whichtobuy.best/api/mm/uitkomst',x))&&W.fetch)fetch('https://whichtobuy.best/api/mm/uitkomst',{method:'POST',body:x,keepalive:true,mode:'no-cors'})}catch(e){}};
W.mmKlikId=c;
if(c&&!W.mmGeenAuto){var t0=Date.now(),ia=0,echt=function(){if(ia&&D.visibilityState==='visible'&&Date.now()-t0>=3000)W.mmUitkomst('echt')};
['pointerdown','touchstart','scroll','keydown'].forEach(function(e){D.addEventListener(e,function(){ia=1;echt()},{passive:true,capture:true})});setTimeout(echt,3100);
D.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[href],button,[role=button],input[type=submit]');if(a)W.mmUitkomst('actie')},true);
D.addEventListener('submit',function(e){var f=e.target;if(f&&f.querySelector&&f.querySelector('input[type=email],input[name*=mail]'))W.mmUitkomst('aanmelding')},true)}
}catch(e){}})();`;

// De lerende modal in de browser (lib/modal.js): vraagt de server welke arm, meet de gewone klik naar buiten (ook bij de controlegroep),
// toont op het gekozen moment een kaart (schaduw-DOM, botst niet met de pagina), sluiten met kruisje, 'nee', achtergrond of Escape.
const MMM_JS = String.raw`/* clickmind modal */(function(){var W=window,D=document,N=navigator;
function q(f){try{return f()}catch(e){return null}}
try{if(W.mmModal)return;W.mmModal=1;if(N.webdriver===true)return;
var S=D.currentScript||q(function(){var a=D.querySelectorAll('script[src*="/cm.js"],script[src*="/mmm.js"]');return a[a.length-1]}),site=S&&S.getAttribute('data-site');if(!site)return;var kw=String((S&&S.getAttribute('data-interest'))||q(function(){var x=D.querySelector('meta[name="cm-interest"]');return x&&x.content})||'').slice(0,60);
var O=q(function(){return new URL(S.src).origin})||'https://whichtobuy.best',zelf=O===location.origin;
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,String(v))}catch(e){return null}}
function hex(n){var a=new Uint8Array(n),s='';q(function(){crypto.getRandomValues(a)});for(var i=0;i<n;i++)s+=(a[i]+256).toString(16).slice(1);return s}
var id=ls('mmq');if(!/^[0-9a-f]{16}$/.test(id||'')){id=hex(8);ls('mmq',id)}
var vk='mmqv:'+site,v=(+ls(vk)||0)+1;ls(vk,v);
var U=q(function(){return new URL(location.href).searchParams}),P=function(){for(var i=0;i<arguments.length;i++){var x=U&&U.get(arguments[i]);if(x)return x}return''};
var mmc=P('mmc');if(!/^[0-9a-f]{8,24}$/.test(mmc)){var l=(ls('mmc')||'').split('|');mmc=l[0]&&/^[0-9a-f]{8,24}$/.test(l[0])&&Date.now()-Number(l[1]||0)<864e5?l[0]:''}
var test=P('mmm'),mob=(/Mobi|Android|iPhone|iPad/i.test(N.userAgent||'')||q(function(){return matchMedia('(pointer:coarse)').matches}))?1:0,abo=(ls('mmqa:'+site)==='1'||ls('mmqa')==='1')?1:0;
var rh=q(function(){return D.referrer?new URL(D.referrer).hostname:''})||'',ref=!rh?'direct':rh===location.hostname?'intern':/(^|\.)(google|bing|duckduckgo|yahoo|ecosia|yandex|baidu|startpage|brave)\./.test(rh)?'zoek':/facebook|instagram|t\.co|x\.com|twitter|linkedin|reddit|tiktok|whatsapp|telegram|pinterest/.test(rh)?'social':'ander';
var hist=q(function(){return JSON.parse(ls('cmh')||'{}')})||{};function hb(k){hist[k]=(+hist[k]||0)+1;ls('cmh',JSON.stringify(hist))}
var B=null,wacht=[],getoond=0,uit=0,vis=0,vs=D.visibilityState==='visible'?Date.now():null,uitgeklikt=0,minMs=8000,typt=0;
function visT(){return vis+(vs?Date.now()-vs:0)}
function ev(e){if(!B){wacht.push(e);return}if(!B.mid)return;var x=O+'/api/mm/modalev?mid='+B.mid+'&e='+e;try{if(!(N.sendBeacon&&N.sendBeacon(x))&&W.fetch)fetch(x,{method:'POST',keepalive:true,mode:'no-cors',credentials:'omit'})}catch(z){}}
D.addEventListener('click',function(e){try{var a=e.target&&e.target.closest&&e.target.closest('a[href]');if(!a)return;var h=new URL(a.href,location.href);if(/^https?:$/.test(h.protocol)&&h.host&&h.host!==location.host){uitgeklikt=1;ev('hoofd')}}catch(x){}},true);
D.addEventListener('submit',function(e){var f=e.target;if(f&&f.querySelector&&!(f.closest&&f.closest('[data-mmm]'))&&f.querySelector('input[type=email],input[name*=mail]'))ev('hoofd')},true);
D.addEventListener('focusin',function(e){var t=e.target;if(t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)&&!(t.closest&&t.closest('[data-mmm]')))typt=Date.now()},true);
D.addEventListener('visibilitychange',function(){if(D.visibilityState==='visible'){vs=Date.now();if(uitgeklikt&&B&&B.arm&&B.arm.moment==='exit')setTimeout(toon,400)}else if(vs){vis+=Date.now()-vs;vs=null}},true);
W.addEventListener('pageshow',function(e){if(e.persisted&&uitgeklikt&&B&&B.arm&&B.arm.moment==='exit'){vs=Date.now();setTimeout(toon,400)}},true);
// slim: nooit over een ander venster heen, niet als iemand typt, niet op betaal-, inlog- of winkelwagenpagina's, niet bij een lage mensmeter-score
function stoor(){if(W.cmGeenModal||D.documentElement.hasAttribute('data-cm-geen'))return 1;
if(/(checkout|betaal|pay(ment)?|kassa|cart|winkelwagen|login|signin|sign-in|inloggen|account|bestel)/i.test(location.pathname))return 1;
if(D.visibilityState!=='visible')return 1;if(typt&&Date.now()-typt<15000)return 1;
var a=D.activeElement;if(a&&(/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)||a.isContentEditable)&&!(a.closest&&a.closest('[data-mmm]')))return 1;
var dl=D.querySelectorAll('dialog[open],[aria-modal="true"],[role="dialog"],[role="alertdialog"]');for(var i=0;i<dl.length;i++){var r=dl[i].getBoundingClientRect();if(r.width>0&&r.height>0&&!dl[i].closest('[data-mmm]'))return 1}
var mm=W.mensmeter;if(mm&&mm.lokaal!=null&&mm.lokaal<35)return 1;return 0}
function klaarVoor(){return !getoond&&!uit&&B&&B.toon&&visT()>=minMs}
function toon(){if(!klaarVoor())return;if(!test&&stoor())return;getoond=1;ev('toon');hb('g');q(bouw)}
function plan(a){minMs=Math.max(0,(+B.min||0)*1000);var mo=String(a.moment||'exit');if(!test&&ref==='zoek'&&mob&&mo!=='exit')mo='scroll:80';var p=mo.split(':'),soort=p[0],n=+p[1]||0;
if(soort==='tijd'){var w=Math.max(minMs,(n||20)*1000),iv=setInterval(function(){if(getoond||uit){clearInterval(iv);return}if(visT()>=w)toon()},1000)}
else if(soort==='scroll'){var g=(n||60)/100;W.addEventListener('scroll',function(){var h=D.documentElement,y=(W.pageYOffset||h.scrollTop||0)+W.innerHeight,H=Math.max(h.scrollHeight,D.body?D.body.scrollHeight:0)||1;if(y/H>=g)toon()},{passive:true})}
else{D.addEventListener('mouseout',function(e){if(!e.relatedTarget&&e.clientY<=0)toon()},true);
var maxY=0,tMax=0;W.addEventListener('scroll',function(){var y=W.pageYOffset||0,t=Date.now();if(y>maxY){maxY=y;tMax=t}else if(maxY>W.innerHeight&&maxY-y>W.innerHeight*0.35&&t-tMax<900)toon()},{passive:true})}
if(test)setTimeout(toon,300)}
function bouw(){var a=B.arm,host=D.createElement('div');host.setAttribute('data-mmm','1');host.style.cssText='all:initial;position:fixed;left:0;top:0;width:0;height:0;z-index:2147483646';
var r=host.attachShadow?host.attachShadow({mode:'open'}):host;
r.innerHTML='<style>*{box-sizing:border-box}.bg{position:fixed;inset:0;background:rgba(15,20,30,.45)}.k{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(92vw,400px);background:#fff;color:#1d2433;border-radius:14px;padding:22px 20px 14px;box-shadow:0 12px 40px rgba(0,0,0,.25);font:16px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:left}@media (max-width:640px){.bg{background:transparent;pointer-events:none}.k{top:auto;bottom:0;left:0;transform:none;width:100%;border-radius:16px 16px 0 0;padding-bottom:max(16px,env(safe-area-inset-bottom));box-shadow:0 -6px 30px rgba(0,0,0,.22)}}.t{font-weight:700;font-size:19px;line-height:1.3;margin:0 30px 6px 0}.s{margin:0 0 14px;color:#4a5262}.b{display:block;width:100%;text-align:center;background:#1a56db;color:#fff;border:0;border-radius:10px;padding:13px 14px;font:600 16px system-ui,-apple-system,sans-serif;text-decoration:none;cursor:pointer}.b[disabled]{opacity:.6}input{width:100%;padding:12px;border:1px solid #c9cfdb;border-radius:10px;font:16px system-ui,-apple-system,sans-serif;margin:0 0 10px;color:#1d2433;background:#fff}.n{background:none;border:0;color:#6b7385;font:14px system-ui,-apple-system,sans-serif;margin:8px auto 0;display:block;cursor:pointer;padding:6px}.x{position:absolute;right:6px;top:4px;background:none;border:0;font-size:28px;line-height:1;color:#6b7385;cursor:pointer;padding:6px 10px}.kl{font-size:12px;color:#7a8294;margin:8px 0 0}.fo{color:#b42318;font-size:14px;margin:0 0 8px}</style><div class="bg"></div><div class="k" role="dialog" aria-modal="true" aria-labelledby="t"><button class="x" type="button" aria-label="Close">&times;</button><p class="t" id="t"></p><p class="s"></p><div class="f"></div><button class="n" type="button"></button></div>';
var $=function(s){return r.querySelector(s)},sluit=function(lees){if(uit)return;uit=1;if(lees){ev('sluit');hb('s')}q(function(){host.remove()});D.removeEventListener('keydown',esc,true)},esc=function(e){if(e.key==='Escape')sluit(1)};
$('.t').textContent=a.titel||'';$('.s').textContent=a.tekst||'';if(!a.tekst)$('.s').style.display='none';$('.n').textContent=a.nee||'No thanks';
$('.x').onclick=function(){sluit(1)};$('.n').onclick=function(){sluit(1)};$('.bg').onclick=function(){sluit(1)};D.addEventListener('keydown',esc,true);
var f=$('.f');
if(a.soort==='site'){var k=D.createElement('a');k.className='b';k.href=a.href;k.target='_blank';k.rel='noopener';k.textContent=a.knop;k.onclick=function(){ev('klik');hb('k');setTimeout(function(){sluit(0)},200)};f.appendChild(k);setTimeout(function(){q(function(){k.focus()})},50)}
else if(a.soort==='email'){var fm=D.createElement('form'),inp=D.createElement('input'),fo=D.createElement('p'),bt=D.createElement('button'),kl=D.createElement('p');
inp.type='email';inp.required=true;inp.autocomplete='email';inp.placeholder=a.veld||'Your email';inp.setAttribute('aria-label',a.veld||'Email');fo.className='fo';fo.style.display='none';bt.className='b';bt.type='submit';bt.textContent=a.knop;kl.className='kl';kl.textContent=a.klein||'';
fm.appendChild(inp);fm.appendChild(fo);fm.appendChild(bt);fm.appendChild(kl);f.appendChild(fm);setTimeout(function(){q(function(){inp.focus()})},50);
var dank=function(){ev('klik');hb('k');ls('mmqa:'+site,'1');ls('mmqa','1');fm.innerHTML='';$('.s').style.display='none';var p=D.createElement('p');p.className='s';p.textContent=a.dank||'Thanks!';fm.appendChild(p);$('.n').textContent='OK'},
fout=function(t){bt.disabled=false;fo.textContent=t||'Something went wrong. Please try again.';fo.style.display='block'},
post=function(eigen){if(!B.mid){dank();return}fetch(O+'/api/mm/modalmail',{method:'POST',body:JSON.stringify({mid:B.mid,email:inp.value,bewaar:!eigen}),credentials:'omit'}).then(function(x){return x.json()}).then(function(j){if(j&&j.ok)dank();else fout(j&&j.fout)})['catch'](function(){fout()})};
fm.onsubmit=function(e){e.preventDefault();var m=String(inp.value||'').trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m)){fout(a.veld||'Email?');return}bt.disabled=true;fo.style.display='none';
if(a.doel==='todayin'){post(0)}else if(a.doel==='moonlighter'&&B.mid){fetch('https://moonlighter.email/api/cm-signup',{method:'POST',body:JSON.stringify({email:m,site:site,mid:B.mid}),credentials:'omit'}).then(function(x){return x.json()}).then(function(j){if(j&&j.ok)post(1);else fout(j&&j.error)})['catch'](function(){fout()})}
else if(typeof W.mmAanmelden==='function'){q(function(){Promise.resolve(W.mmAanmelden(m,{site:site,arm:a.id})).then(function(ok){if(ok)post(1);else fout()},function(){fout()})})}else post(0)}}
(D.body||D.documentElement).appendChild(host)}
var u=O+'/api/mm/modal?site='+encodeURIComponent(site)+'&q='+id+'&c='+mmc+'&v='+v+'&mob='+mob+'&abo='+abo+'&net='+encodeURIComponent(P('src','net','utm_source','n').slice(0,20))+'&zone='+encodeURIComponent(P('zone','z','zoneid','widget').slice(0,40))+'&ref='+ref+'&uur='+new Date().getHours()+(kw?'&kw='+encodeURIComponent(kw):'')+'&g='+(+hist.g||0)+'&k='+(+hist.k||0)+(test?'&test='+encodeURIComponent(test):'');
fetch(u,{credentials:zelf?'include':'omit'}).then(function(x){return x.json()}).then(function(d){B=d||{};var w=wacht;wacht=[];for(var i=0;i<w.length;i++)ev(w[i]);if(B.toon&&B.arm&&B.arm.soort!=='geen')plan(B.arm)})['catch'](function(){});
W.mmModalStand=function(){return{site:site,besluit:B,getoond:getoond,stoort:stoor()}};
}catch(e){}})();
`;

// CLICKMIND in één regel voor elke eigen pagina: uitkomsten (automatisch echt, actie, aanmelding bij een klik-id), de mensmeter (alleen bij
// betaald verkeer: een zone, klik-id of mmc in de URL) en de lerende modal.  <script src="https://whichtobuy.best/cm.js" data-site="<site>" async></script>
const CM_JS = MMU_JS + '\n(function(){try{var cs=document.currentScript,u=new URL(location.href).searchParams;window.__cmMeet=!(cs&&cs.getAttribute("data-meet")==="0")&&!!(u.get("zone")||u.get("z")||u.get("zoneid")||u.get("subid")||u.get("clickid")||u.get("mmc"))}catch(e){}})();\nif(window.__cmMeet){' + MM_JS + '}\n' + MMM_JS + '\n' + RT_JS;

// ---- status bovenaan het overzicht: draait alles, en wat wordt per klik (nog) niet gemeten ----
async function statusBlok({ e, leer, inst, st }) {
  const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
  const nu = Date.now(), min = t => t ? Math.round((nu - Date.parse(t)) / 60000) : null, ago = m => m == null ? 'nooit' : m < 90 ? m + ' min geleden' : Math.round(m / 60) + ' uur geleden';
  const pil = (ok, t) => '<span class="k ' + (ok ? '' : 'u') + '">' + e(t) + '</span>';
  const rij = (wat, ok, stand, toel) => '<tr><td><b>' + e(wat) + '</b></td><td>' + pil(ok, ok ? 'goed' : 'let op') + '</td><td>' + stand + '</td><td>' + e(toel || '') + '</td></tr>';
  const nets = st && st.netwerken ? Object.entries(st.netwerken).filter(([n]) => n !== 'test') : [];
  const viaGo = nets.reduce((a, [, x]) => a + N(x.viaGo), 0), gemeten = nets.reduce((a, [, x]) => a + N(x.gemeten), 0), bezoek = nets.reduce((a, [, x]) => a + N(x.bezoeken), 0);
  const laatsteKlik = st && st.laatste && st.laatste[0] ? st.laatste[0].t : null;
  const mds = await alleModals(kv).catch(() => []); const modAan = mds.filter(m => !m.uit).map(m => m.site);
  const idx = (((await kv.raw(['SMEMBERS', 'mm:terug:index']).catch(() => [])) || []).map(String)).sort().reverse();
  let dir = null, meet = null, dv = 0; try { const sd = await import('../lib/shopdirect.js'); dir = await sd.directInst(kv); meet = await sd.shopMeet(kv); const d8 = new Date().toISOString().slice(0, 10).replace(/-/g, ''); dv = (await kv.mget(...['pa', 'md', 'ra', 'ca'].map(n => 'c:sh-d' + d8 + '-' + n + '-dv'))).reduce((a, v) => a + N(v), 0); } catch (x) {}
  const lm = leer ? min(leer.bijgewerkt) : null, ak = leer && leer.aankomst ? leer.aankomst : {};
  const zo = st && st.oordelen ? st.oordelen : {}, zTot = N(zo.zwart) + N(zo.verdacht) + N(zo.wit) + N(zo.onbekend);
  let h = '<h2>Status</h2><div class="w"><table><tr><th>onderdeel</th><th></th><th>stand</th><th>toelichting</th></tr>';
  h += rij('Klikregister (/go, /w, shop)', min(laatsteKlik) != null && min(laatsteKlik) < 120, 'laatste klik ' + ago(min(laatsteKlik)) + '; vandaag ' + bezoek + ' bezoeken, waarvan ' + viaGo + ' via het klikregister', 'Server per klik: netwerk (ASN), datacenter, TLS-vingerafdruk, land, stad, tijdzone, app, terugkerende persoon.');
  h += rij('Mensmeter in de browser', gemeten > 0, gemeten + ' van ' + bezoek + ' bezoeken gemeten in de browser (' + (bezoek ? Math.round(gemeten / bezoek * 100) : 0) + '%)', 'Alleen waar een eigen pagina laadt. Directe doorsturen naar Amazon en naar de Yoors-shop meten alleen op de server.');
  h += rij('Leerronde (elk uur)', lm != null && lm < 75, 'laatste ronde ' + ago(lm), 'Zoneprofielen, botfarms, wissels, modal-modellen, blokvoorstel.');
  h += rij('Betaald tegen aangekomen (PropellerAds)', !!ak.propellerSleutel && !ak.fout, ak.propellerSleutel ? (ak.fout ? 'fout: ' + e(ak.fout) : 'werkt') : 'nog niet', 'Per zone: kliks die PropellerAds rekent tegen kliks die bij ons aankomen. Komt via de PropellerAds-lus.');
  h += rij('Zone-oordeel', N(zo.onbekend) < 0.8 * zTot, (zTot - N(zo.onbekend)) + ' van ' + zTot + ' zones beoordeeld (' + N(zo.zwart) + ' zwart, ' + N(zo.wit) + ' wit)', 'Zonder browsermeting kan Clickmind een zone wel als bot herkennen, maar nooit als mens.');
  let bg = null; try { const l = await kv.raw(['LRANGE', 'mm:blokgedaan:propeller', 0, 0]); bg = l && l[0] ? JSON.parse(l[0]) : null; } catch (x) {}
  h += rij('Blokkeren door Clickmind', !!inst.blokkeren && (!bg || !(bg.fouten || []).length), inst.blokkeren ? 'aan' + (bg ? '; laatste uitvoering ' + ago(min(bg.t)) + ': ' + e(bg.samenvatting) : '; eerste uitvoering om :20') : 'uit (alleen voorstel)', 'PropellerAds: elk uur om :20 voegt de PropellerAds-lus de zones toe aan de uitsluitlijst van de campagnes waar ze kliks hadden. Nooit de grootste bron van een campagne, nooit zones met echte uitkomsten, nooit iets eraf.');
  h += rij('Terugbetalingsdossier', idx.length > 0, idx.length ? 'laatste: ' + e(idx[0]) : 'eerste dossier vannacht 03:40 UTC', 'Indienen alleen op Henkjans woord.');
  h += rij('Lerende modal', true, modAan.length ? 'aan op ' + e(modAan.join(', ')) + '; uit op ' + (mds.length - modAan.length) + ' sites' : 'overal uit', '');
  if (dir) h += rij('Yoors Shop: direct naar de productpagina', !!(meet && meet.aan), dir.pct + '% direct; vandaag ' + dv + ' aangekomen; cm.js op yoo.rs: ' + (meet && meet.aan ? 'meet' : 'nog niet'), 'Zonder cm.js op yoo.rs: geen eerste tik als conversie voor het netwerk en geen mensoordeel per zone.');
  return h + '</table></div>';
}

// ---- alles op één pagina (beschermde host) ----
async function overzicht() {
  const e = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const [pr, ws, leer, log, inst, st] = await Promise.all([proef(kv, { dagen: 2 }), alleWissels(kv), kv.get('mm:leer:laatst'), kv.raw(['LRANGE', 'mm:leerlog', 0, 23]).catch(() => []), instelling(kv), stand(kv)]);
  const tabel = (kop, rijen) => '<table><tr>' + kop.map(k => '<th>' + e(k) + '</th>').join('') + '</tr>' + (rijen.length ? rijen.map(r => '<tr>' + r.map(c => '<td>' + e(c) + '</td>').join('') + '</tr>').join('') : '<tr><td colspan="' + kop.length + '">nog niets</td></tr>') + '</table>';
  const p = (x) => (x == null ? '' : x + '%');
  let h = '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Clickmind</title><style>body{font:15px/1.45 system-ui,-apple-system,sans-serif;margin:0;padding:16px;color:#1d2433;background:#f6f7fb}h1{font-size:22px;margin:0 0 4px}h2{font-size:17px;margin:26px 0 8px}p.s{color:#5b6475;margin:0 0 12px}table{border-collapse:collapse;background:#fff;width:100%;margin:6px 0;font-size:13px}th,td{border-bottom:1px solid #e6e8ef;padding:6px 8px;text-align:left;vertical-align:top}th{background:#eef0f6;font-weight:600}.k{display:inline-block;padding:2px 8px;border-radius:10px;font-size:12px;background:#e7f6ec;color:#16653a}.u{background:#fdecea;color:#9b1c1c}.w{overflow-x:auto}code{background:#eef0f6;padding:1px 5px;border-radius:4px;font-size:12px}</style></head><body>';
  h += '<h1>Clickmind</h1><p class="s">Leert van elke klik: klikregister /go, wissel /w, leerronde, terugbetaling en lerende modal.</p><p class="s">Bijgewerkt ' + e(new Date().toISOString().slice(0, 16).replace('T', ' ')) + ' UTC. Blokkeren door de leerronde: <span class="k ' + (inst.blokkeren ? '' : 'u') + '">' + (inst.blokkeren ? 'aan' : 'uit') + '</span></p>';
  h += await statusBlok({ e, leer, inst, st });
  try { const w = await kv.get('mm:wachtuur:laatst'); if (w) { const al = (w.alarmen || []).filter(a => a.soort !== 'meting'); h += '<h2>Uurwacht ' + e(String(w.bijgewerkt).slice(11, 16)) + ' UTC</h2>' + (al.length ? '<ul>' + al.map(a => '<li><b>' + e(a.soort) + '</b>: ' + e(a.tekst) + '</li>').join('') + '</ul>' : '<p class="s">Geen alarm.</p>') + '<p class="s">Aankomst vandaag (UTC), afgerekend tegen aangekomen bij /go: ' + Object.entries(w.netten || {}).map(([n, x]) => e(n) + ' ' + x.aangekomen + ' van ' + x.kliks + ' (' + p(x.pct) + ')').join(', ') + (Object.keys(w.laatsteUur || {}).length ? '. Laatste uur: ' + Object.entries(w.laatsteUur).map(([n, x]) => e(n) + ' ' + x.aangekomen + ' van ' + x.kliks + ' (' + p(x.pct) + ')').join(', ') : '') + '.</p>'; } } catch (x) {}
  try { const w = await kv.get('mm:wachtuur:laatst'); const P = (w && w.eigen && w.eigen.projecten) || {}; const naam = { shop: 'Yoors Shop', todayin: 'todayin', spel: 'deeltest', mylevel: 'MyLevel', overig: 'overig' }; const rij = []; for (const k of ['shop', 'shop|NL', 'todayin', 'todayin|NL', 'todayin|rest', 'spel', 'mylevel']) { const t = P[k]; if (t) rij.push([naam[k.split('|')[0]] + (k.endsWith('|NL') ? ' NL' : k.endsWith('|rest') ? ' buiten NL' : ''), t.campagnes, t.kliks, t.bezoek + ' (' + p(t.aankomst) + ')', (t.mens == null ? 'zie shoptrechter' : t.mens + ' (' + p(t.mensPct) + ')'), t.actie, t.aanmelding, t.koop, '$' + t.kosten, t.perLid == null ? '' : '$' + t.perLid]); } const wk = w && w.eigen && w.eigen.winkel; if (rij.length || wk) h += '<h2>Eigen pagina\'s vandaag (UTC)</h2><div class="w">' + tabel(['project', 'campagnes', 'kliks', 'aangekomen', 'echt mens', 'acties', 'aanmeldingen', 'verkoop', 'kosten', 'per lid'], rij) + '</div>' + (wk && wk.dag ? '<p class="s">Yoors Shop vandaag (shoptrechter): ' + wk.dag.paKliks + ' betaalde PropellerAds-kliks, ' + wk.dag.paAangekomen + ' daarvan aangekomen (' + (wk.dag.pctAan == null ? '-' : wk.dag.pctAan + '%') + '), ' + wk.dag.echt + ' echte mensen, ' + wk.dag.cart + ' winkelwagen, ' + wk.dag.afreken + ' afrekenen, ' + wk.dag.betaal + ' betaling, ' + wk.dag.koop + ' verkoop' + (P.shop && P.shop.meetgat ? '. Let op: Clickmind telt per campagne minder bezoeken dan de shoptrechter, de aankomst per campagne is te laag geteld' : '') + '.</p>' : ''); } catch (x) {}
  try { const w = await kv.get('mm:wachtuur:laatst'); const m = w && w.mensgeld; const zz = (m && m.zinnen) || []; const sch = t => String(t).replace(/[&<>"]/g, ''); if (zz.length || (m && m.totaal && m.totaal.kliks)) h += '<h2>Per uniek mens vandaag (UTC)</h2><p class="s">Voor Amazon telt per mens één cookie van 24 uur. ' + (m.totaal ? '$' + m.totaal.dubbelGeld + ' van $' + m.totaal.kosten + ' aan /go-kliks ging vandaag naar mensen die we die dag al hadden.' : '') + '</p>' + (zz.length ? '<p class="s">' + zz.map(sch).join('<br>') + '</p>' : '') + '<p class="s">Alles: /api/mm/mensgeld?dag=, welke termen dezelfde mensen delen: /api/mm/overlap</p>'; } catch (x) {}
  try { const { rtStand } = await import('../lib/retarget.js'); const r = await rtStand(kv, { dagen: 14 }); const c = r.instelling || {}; const pub = []; for (const [n, x] of Object.entries(c.netwerken || {})) for (const [p, id] of Object.entries(x.publieken || {})) pub.push(n + ' ' + p + (x.aan ? '' : ' (netwerk uit)')); const sch = t => String(t).replace(/[&<>"]/g, ''); h += '<h2>Clickmind-publiek (retargeting)</h2><p class="s">' + (c.aan ? 'Aan' : 'Uit') + ' · landen: ' + sch((c.landen || []).join(', ')) + ' · sites: ' + sch((c.sites || []).join(', ')) + ' · publieken: ' + (pub.length ? sch(pub.join(', ')) : 'nog geen (publieks-id uit het PropellerAds-dashboard nodig)') + '</p>' + ((r.publieken || []).length ? '<p class="s">' + r.publieken.map(x => sch(x.publiek) + ': ' + (x.uniekeMensen == null ? x.gevuurd : x.uniekeMensen) + ' mensen in 14 dagen').join('<br>') + '</p>' : ''); } catch (x) {}
  h += '<h2>/go-proef, vandaag en gisteren</h2><div class="w">' + tabel(['campagne', 'variant', 'tag', 'kliks', 'personen', 'terug', 'herhaalklik 10 min', 'meting gelukt', 'datacenter', 'mobiel'], pr.rijen.filter(r => r.netwerk !== 'test').map(r => [r.campagne, r.variant, r.tag, r.n, r.personen, p(r.pct.terug), p(r.pct.herhaalklik10min), p(r.pct.js), p(r.pct.dc), p(r.pct.mobiel)])) + '</div>';
  h += '<h2>Wissels</h2>';
  if (!ws.length) h += '<p class="s">Nog geen wissels.</p>';
  for (const w of ws) {
    const sta = await wisselStand(kv, w, 7);
    h += '<p><b>' + e(w.naam) + '</b> <span class="k ' + (w.uit ? 'u' : '') + '">' + (w.uit ? 'uit' : 'aan') + '</span> modus ' + e(w.modus) + ', doel ' + e(w.doel) + (w.notitie ? '. ' + e(w.notitie) : '') + (w.regels && w.regels.length ? '<br>Regels: ' + w.regels.map(r => e(r.als) + ' &rarr; ' + e(r.arm)).join(', ') : '') + '<br>Link: <code>https://whichtobuy.best/w/' + e(w.naam) + '?n=propeller&amp;c={campaignid}&amp;z={zoneid}&amp;s=${SUBID}&amp;b={bannerid}</code></p>';
    h += '<div class="w">' + tabel(['arm', 'voor wie', 'bestemming', 'gewicht', 'geleerd', 'kliks 7 d', 'nieuw', 'terug', 'echt', 'actie', 'aanmelding', 'koop', 'Amazon: artikelen / verdiend'], w.armen.map(a => { const x = sta.find(y => y.id === a.id) || {}; return [a.id, a.wie, a.soort === 'amazon' ? (a.k || a.a) + ' (' + a.tag + ', ' + a.variant + ')' : a.url.replace(/\?.*/, ''), a.gewicht, w.leer && w.leer[a.id] != null ? w.leer[a.id] + '%' : '', x.n, x.nieuw, x.terug, x.echt, x.actie, x.aanmelding, x.koop, x.amazon && x.amazon.dagen ? x.amazon.artikelen + ' / $' + Math.round(x.amazon.verdiend * 100) / 100 : '']; })) + '</div>';
  }
  const mds = await alleModals(kv).catch(() => []);
  h += '<h2>Lerende modal</h2>';
  if (!mds.length) h += '<p class="s">Nog geen modals.</p>';
  for (const m of mds) {
    const mm2 = await leesModal(kv, m.site, true) || m; const sta = await modalStand(kv, mm2, 14);
    h += '<p><b>' + e(m.site) + '</b> <span class="k ' + (m.uit ? 'u' : '') + '">' + (m.uit ? 'uit' : 'aan') + '</span> op ' + e(m.domeinen.join(', ')) + ', modus ' + e(m.modus) + ', controlegroep minstens ' + Math.round(m.controle * 100) + '%, hoogstens 1 keer per ' + e(m.cap) + ' uur. Waarde (cent): gewone klik ' + e(m.waarde.hoofd) + ', klik in modal ' + e(m.waarde.klik) + ', aanmelding ' + e(m.waarde.aanmelding) + '.<br>Script: <code>&lt;script src="https://whichtobuy.best/cm.js" data-site="' + e(m.site) + '" async&gt;&lt;/script&gt;</code><br>Model per bezoeker: ' + (m.model && m.model.arms ? Object.keys(m.model.arms).length + ' armen (bijgewerkt ' + e(String(m.model.at || '').slice(0, 16).replace('T', ' ')) + ')' : 'nog te weinig data') + '. Moment: ' + (m.momLeer ? Object.entries(m.momLeer).sort((a, b) => b[1] - a[1]).map(([k, v]) => e(k) + ' ' + v + '%').join(', ') : 'nog aan het verkennen') + '. Geremd: ' + (m.rem && Object.keys(m.rem).length ? Object.entries(m.rem).map(([k, v]) => e(k) + ' (' + e(v.reden) + ')').join('; ') : 'niets') + '. Teksten van Claude: ' + Object.values(m.varianten || {}).flat().filter(v => v.bron === 'claude').length + '.</p>';
    h += '<div class="w">' + tabel(['arm', 'soort', 'moment', 'gewicht', 'geleerd', 'bezoekers 14 d', 'getoond', 'klik', 'aanmelding', 'gewone klik', 'gewone klik tegen controle', '$ per 1.000 bezoekers'], sta.map(x => { const a = (mm2.alleArmen || m.armen).find(y => y.id === x.id) || {}; return [x.id, x.soort, x.moment, a.gewicht, m.leer && m.leer['*'] && m.leer['*'][x.id] != null ? m.leer['*'][x.id] + '%' : '', x.n, p(x.pctToon), x.klik, x.aanmelding, p(x.pctHoofd), x.hoofdTegenControle == null ? '' : (x.hoofdTegenControle > 0 ? '+' : '') + x.hoofdTegenControle + ' pt', x.dollarPer1000 == null ? '' : '$' + x.dollarPer1000]; })) + '</div>';
  }
  h += '<h2>Leerronde (elk uur)</h2>';
  if (!leer) h += '<p class="s">Nog niet gedraaid.</p>';
  else {
    h += '<p class="s">Laatste ronde ' + e(String(leer.bijgewerkt).slice(0, 16).replace('T', ' ')) + ' UTC. Zones gezien: ' + e(leer.zones.totaal) + '. PropellerAds-sleutel voor aankomst: ' + (leer.aankomst.propellerSleutel ? 'ja' : 'nee') + (leer.aankomst.fout ? ' (' + e(leer.aankomst.fout) + ')' : '') + '.</p>';
    for (const [net, b] of Object.entries(leer.blokvoorstel || {})) h += '<p><b>Blokvoorstel ' + e(net) + '</b>: ' + b.klaar.length + ' klaar, ' + b.wacht.length + ' wachten op jouw woord</p><div class="w">' + tabel(['zone', 'waarom', 'let op'], b.details.slice(0, 40).map(d => [d.zone, d.waarom, d.wacht || ''])) + '</div>';
    h += '<p><b>Aankomst (betaald tegen aangekomen, vandaag)</b></p><div class="w">' + tabel(['zone', 'betaald', 'aangekomen', 'aankomst'], (leer.aankomst.laagste || []).slice(0, 15).map(a => [a.zone, a.betaald, a.aangekomen, p(a.pct)])) + '</div>';
    h += '<p><b>Menszones</b> (zones met echte uitkomsten: nooit blokkeren)</p><div class="w">' + tabel(['netwerk', 'zone', 'bezoeken', 'echt', 'actie', 'aanmelding', 'koop'], (leer.menszones || []).map(m => [m.netwerk, m.zone, m.v, m.echt, m.actie, m.aanmelding, m.koop])) + '</div>';
    h += '<p><b>Lijkt op de winnaars</b> (kandidaten voor een eigen campagne of hoger bod, op jouw woord)</p><div class="w">' + tabel(['netwerk', 'zone', 'bezoeken', 'gelijkenis'], (leer.lijktOpWinnaar || []).slice(0, 15).map(m => [m.netwerk, m.zone, m.v, m.gelijkenis])) + '</div>';
    if (leer.voorspellers && leer.voorspellers.top) h += '<p><b>Wat een klik voorspelt</b> (' + e(leer.voorspellers.kliks) + ' kliks, ' + e(leer.voorspellers.bezoeken) + ' bezoeken, ' + e(leer.voorspellers.vondsten) + ' vondsten; alles op /api/mm/voorspel)</p><div class="w">' + tabel(['voorspeller'], leer.voorspellers.top.map(x => [x]).concat((leer.voorspellers.amazon || []).map(x => ['Amazon (zwak): ' + x]))) + '</div>';
    h += '<p><b>Botfarms</b>: ' + e(leer.botfarms.aantal) + ' vingerafdrukken. <b>Zelfde site via twee netwerken</b>: ' + e((leer.zelfdeSiteTweeNetwerken || []).length) + '</p>';
  }
  const idx = (((await kv.raw(['SMEMBERS', 'mm:terug:index']).catch(() => [])) || []).map(String)).sort().reverse().slice(0, 14);
  const dos = (await Promise.all(idx.map(k => kv.get('mm:terug:' + k).catch(() => null)))).filter(Boolean);
  h += '<h2>Terugbetaling (bewijs per klik, indienen alleen op jouw woord)</h2><div class="w">' + tabel(['netwerk', 'dag', 'kliks via ons', 'verdacht', 'sterk bewijs', 'uiterlijk indienen', 'hoe', 'csv'], dos.map(x => [x.netwerk, x.van, x.kliksViaOns, x.verdacht + ' (' + x.pctVerdacht + '%)', x.sterkBewijs, x.uiterlijkIndienen || 'onbekend', x.indienen, '/api/mm/terugbetaling?net=' + x.netwerk + '&van=' + x.van + '&formaat=csv'])) + '</div>';
  h += '<h2>Leerlog</h2><div class="w">' + tabel(['ronde'], (log || []).map(x => [String(x)])) + '</div>';
  h += '<h2>Vandaag per netwerk (mensmeter)</h2><div class="w">' + tabel(['netwerk', 'bezoeken', 'via /go en /w', 'gemeten op pagina', 'mens', 'datacenter', 'headless'], Object.entries(st.netwerken || {}).map(([n, x]) => [n, x.bezoeken, x.viaGo, x.gemeten, p(x.mensPct), p(x.datacenterPct), p(x.headlessPct)])) + '</div>';
  return h + '</body></html>';
}
