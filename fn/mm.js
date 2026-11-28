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
//   /api/mm/stukken[?vorm=tekst|json][&run=1]   geheugen van alles wat de deur uit ging, met paspoort (medium, waarvoor, doel), oordeel en lessen; /api/mm/briefing?medium=&project=&doel= lezen vóór je iets maakt; /api/mm?op=stuk&j=<JSON> een stuk melden (lib/paspoort.js; beschermde host of team-sleutel)
//   /api/mm?op=trend[&j=<JSON>|&medium=|&vorm=tekst]   wat nu groot is per platform (lib/trend.js); /api/mm?op=voorstel[&j=<JSON>|&id=] nieuwe stukken die Henkjan eerst ziet (/voorstel?id=); /api/mm/stukken?lijst=1&project=&medium=&regel=1 stukken met hun oordeel opvragen
//   /api/mm?op=adbieb[&project=<id>|&vorm=json]   advertentiebibliotheken van buiten (lib/adbieb.js, Henkjan 27 nov 2026: "Ja bouw 4"): langlopers uit de Meta Ad Library (Zernio) en TikTok-hashtags, trendvideo's en benchmark per project; run=1 de dagronde (cron elk uur van 00:07 tot en met 05:07 UTC), POST of j=<JSON> melding van een chat die het met de MCP-tools ophaalde, zoek=<JSON> de zoektermen per project (beschermde host)
//   /api/mm/leer[?lees=1|droog=1]       leerronde (lib/leer.js; cron elk uur; lezen op de beschermde host)
//   /api/mm/blok?net=propeller          blokvoorstel van de leerronde (openbaar, alleen zone-nummers)
//   /api/mm/lookalike?project=todayin&land=us   lookalikes op uitkomst (lib/lookalike.js; openbaar, alleen zone-nummers)
//   /api/mm/puit (POST {vid, soort})    uitkomst van een paginabezoek (aanmelding, actie) voor het converteerdersprofiel
//   /api/mm/verken?sleutel=todayin-us   voorstel witte lijst verkenningscampagne; POST /api/mm/verkengedaan (SHOP_SLEUTEL) = uitgevoerd
//   /api/mm/bewezen[?sleutel=][&vers=1] bewezen zones per verkenner voor de aparte BEWEZEN-campagnes (80/20, 13 nov 2026; lib/lookalike.js)
//   /api/mm/instelling[?j=<json>]       schakelaars, o.a. blokkeren aan/uit (beschermde host)
//   /api/mm/overzicht                   alles op één pagina (beschermde host)
//   /api/mm/dashboard                   dashboard alle projecten: doel, voortgang, planning, overdracht, logboek (beschermde host; lib/dashboard.js)
//   /api/mm/terugbetaling?net=propeller&van=&tot=[&formaat=csv]   bewijs per klik voor een terugbetalingsverzoek (beschermde host; PropellerAds dient Clickmind sinds 13 nov zelf in, zie lib/terugauto.js)
//   /api/mm/terugdag                    cron: elke dag het dossier van gisteren per netwerk
//   /cm.js                              CLICKMIND in één regel (uitkomsten, mensmeter bij betaald verkeer, lerende modal)
//   /mmm.js                             DE LERENDE MODAL (lib/modal.js): <script src="https://whichtobuy.best/mmm.js" data-site="<site>" async></script>; testen met ?mmm=<arm-id> in de pagina-URL
//   /api/mm/modal?site=&q=&c=&v=&mob=   beslissing per paginabezoek (e-mail, andere site of niets); /api/mm/modalev?mid=&e=toon|klik|sluit|hoofd; /api/mm/modalmail (POST)
//   /api/mm/proefkies?site=&c=  beslissing per bezoeker voor alle onderdelen van de proef; /api/mm/proefev (POST) zie/stap; /api/mm/proefstand?site=[&vorm=tekst]; /api/mm/proefzet?site=&aan=&ronde=1&j= (beschermd) — lib/proef.js
//   /api/mm/modalbeheer[?site=][&j=<json>][&mail=<lijst>&formaat=csv][&site=&domein=<host> domein erbij]   instellingen, stand en adressen (beschermde host); &kort=1 alleen de tellers
//   /api/mm/zones?net=mondiad&dagen=3   oordeel per zone (zelfde vorm als rereview /api/b/zones, leesbaar voor de Mondiad-wacht)
//   /api/mm/patronen?dagen=1            botfarms: vingerafdrukken in veel zones of netwerken
//   /api/mm/stand                       vandaag per netwerk, slechtste zones, datacenterlijst
// Regels, opslag en uitleg: lib/mensmeter.js.
import { ritme } from '../lib/uurritme.js';
import { KOOPCHECK_JS } from '../lib/kadolykoopcheck.js';
import { VL_SITE_JS } from '../lib/verlanglijst.js'; // 27 nov 2026: verlanglijst op kadoly.com (menu, voorpagina, productpagina)
import { kv } from '../lib/db.js';
import { echteTag, verwerkBeacon, verwerkKlik, amazonBouw, armVoor, nieuwId, serverSignalen, laterAf, schoon, tagOk, zones, patronen, stand, proef, exporteer, persoon, netNaam, ipInfo, dcVan, score, netQ } from '../lib/mensmeter.js';
import { leesWissel, bewaarWissel, alleWissels, kiesArm, soortPersoon, bestemming, wisselKlik, cidKoppel, uitkomst, amazonUitkomst, wisselStand } from '../lib/wissel.js';
import { leerRonde, instelling } from '../lib/leer.js';
import { dossier, naarCsv, dagDossiers } from '../lib/terug.js';
import { modalBeslis, modalEv, modalMailEv, modalMail, modalGedrag, leesModal, bewaarModal, alleModals, modalStand, catalogus, bewaarCatalogus, zetModalAlias, VORMEN, modalUitkomst, modalPush, zetPushSw } from '../lib/modal.js';
import { overdracht } from '../lib/overdracht.js';
import { RT_JS, RT_GO_JS, rtBeslis, leesRt, zetRt, rtStand } from '../lib/retarget.js';
import { whPixelHtml } from '../lib/whop.js';

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
d={v:1,vid:vid,mmc:P('mmc')||'',net:A('net')||P('src','net','utm_source')||(P('gclid','gbraid','wbraid')?'google-ads':P('srsltid')?'google-shopping':''),zone:A('zone')||P('zone','z','zoneid'),camp:A('campaign')||P('campaign','c','cid','campaignid'),sub:A('subid')||P('subid','clickid','k')||P('gclid','gbraid','wbraid'),cr:A('cr')||P('cr','creativeid','bannerid','b'),via:A('via'),pg:location.host+location.pathname,ref:q(function(){return D.referrer?new URL(D.referrer).host:''})||'',ua:ua},
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
// stand van de lerende motor in gewone taal (lib/modalmotor.js stand), voor het uurrapport en Henkjan
function motorTekst(st) {
  if (!st || !st.ok) return 'Onbekend project.'; const L = ['Lerende modal en antwoordmotor ' + st.project + ': ' + st.oordeel + '.'];
  for (const x of st.sites || []) if (x.bestaat !== false) L.push(x.site + ' (7 dagen): ' + (x.aanvragen ? x.aanvragen.aanvraag + ' aanvragen van cm.js (sinds 25 nov), ' + x.beslissingen + ' beslissingen, ' : '') + x.getoond + ' keer getoond, ' + x.klik + ' kliks, ' + x.contact + ' keer chat of contact, ' + x.aanmeldingen + ' aanmeldingen, ' + x.bevestigd + ' bevestigd' + (x.aan ? '' : ', staat UIT') + '.');
  const t = st.tellers7d || {}; L.push('Push uit de modal: ' + (st.pushAbonnees || 0) + ' abonnees (een tik, geen e-mailadres; 7 dagen ' + (t.push || 0) + ' nieuw).');
  for (const x of st.sites || []) if (x.wegMeting && (x.wegMeting.weg10 || []).length) L.push(x.site + ', weg binnen 10 s na verschijnen (tegen de controlegroep, ' + x.wegMeting.nControleSchijn + ' schijnmomenten): ' + x.wegMeting.weg10.filter(y => y.n >= 20).map(y => y.key.replace(/^#/, 'vorm ').replace(/^%grootte=/, 'grootte ') + ' ' + Math.round(y.pct * 100) + ' tegen ' + Math.round(y.pctC * 100) + ' (' + y.n + ')').join(', ') + '.');
  L.push('Lijst: ' + st.abonnees + ' abonnees; 7 dagen ' + (t.aanvraag || 0) + ' aanvragen, ' + (t.bevestigd || 0) + ' bevestigd, ' + (t.af || 0) + ' afgemeld, ' + (t.voorkeur || 0) + ' keer voorkeur aangepast; ' + (t.in || 0) + ' mails binnen, ' + (t.antwoord || 0) + ' beantwoord.');
  L.push('Beloftes nu getoond: ' + Object.entries(st.beloftesWaar || {}).map(([k, v]) => k + (v ? '' : ' (uit)')).join(', ') + '. Laatste besteldag kerst: ' + (st.kerst && st.kerst.dag) + '.');
  for (const l of st.lekken || []) L.push('Lek: ' + l); L.push('Volgend oordeel: ' + st.volgendeOordeel + '.'); return L.join('\n');
}
const cors = res => { res.setHeader('access-control-allow-origin', '*'); res.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS'); res.setHeader('access-control-allow-headers', 'content-type'); };

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://x'); const op = String(url.searchParams.get('op') || '').toLowerCase(); const q = k => url.searchParams.get(k);
  // Todayin AI reports only a verified opt-in, with its server-only shared key.
  if (op === 'ai-welkom') { // You and AI: bevestigde abonnee naar de Mailmind-stroom youandai (26 nov 2026)
    res.setHeader('cache-control', 'no-store');
    const { welkom } = await import('../lib/youandai-stroom.js');
    const r = await welkom({ method: req.method, authorization: req.headers.authorization, body: leesJson(req.body), secret: process.env.CLICKMIND_AI_SECRET });
    return res.status(r.status).json(r.body);
  }
  if (op === 'ai-confirm') {
    res.setHeader('cache-control', 'no-store');
    const { confirmAIOptin } = await import('../lib/ai-confirm.js');
    const r = await confirmAIOptin({ kv, modalUitkomst, method: req.method, authorization: req.headers.authorization, body: leesJson(req.body), secret: process.env.CLICKMIND_AI_SECRET });
    return res.status(r.status).json(r.body);
  }
  if (op === 'cmradar') { // 21 nov 2026 (Henkjan: "Kijk naar clickmind"): Demand Radar leest mensen per zoekterm als eigen-vraag-meter; alleen project demand_radar (ondertekend Vercel OIDC-token)
    const { verifyVercelOidc } = await import('../lib/oidcverify.js');
    try { await verifyVercelOidc(String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''), { owner: 'henq', projects: ['demand_radar'] }); }
    catch (e) { return res.status(401).json({ ok: false, fout: 'alleen voor demand_radar (' + String(e.message).slice(0, 60) + ')' }); }
    const { kwRadar } = await import('../lib/mensgeld.js'); res.setHeader('cache-control', 'no-store'); return res.status(200).json(await kwRadar(kv));
  }
  if (op === 'gohome') { // 17 nov (Whop-pixelcheck: "Whop couldn't load go.kadoly.com"): go.kadoly.com/ geeft een echte pagina met de Whop-pixel in de head (zelfde toestemmingsregel als op kadoly.com) en stuurt door naar kadoly.com
    res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=300');
    return res.status(200).send('<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kadoly</title><meta name="robots" content="noindex"><link rel="canonical" href="https://kadoly.com/"><meta http-equiv="refresh" content="1;url=https://kadoly.com/">' + whPixelHtml() + '</head><body style="font-family:system-ui,sans-serif;padding:24px"><p><a href="https://kadoly.com/">Naar Kadoly</a></p></body></html>'); }
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
    if (op === 'geven' || op === 'gevenstand') { // geven: echte antwoorden op vragen over Curaçao (lib/geven.js, Henkjan 19 nov 2026)
      const G = await import('../lib/geven.js');
      if (op === 'gevenstand') return res.status(200).json(await G.stand(Math.min(14, Number(q('dagen')) || 3)));
      const isCron = (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET) || /vercel-cron/i.test(String(req.headers['user-agent'] || ''));
      const droog = !(isCron || beschermd(req)) || q('droog') === '1';
      return res.status(200).json(await G.ronde({ droog }));
    }
    if (op.startsWith('dist')) { // Clickmind distributie: gerichte reacties, korte links en wat werkt (lib/distlus.js, Henkjan 19 nov 2026)
      const D = await import('../lib/distlus.js'); res.setHeader('cache-control', 'no-store');
      if (op === 'distklik') return await D.klikAntwoord(req, res, q('c'));
      if (op === 'distmaak') return res.status(200).json(await D.maak({ project: q('project'), kanaal: q('kanaal'), plek: q('plek'), plekUrl: q('plekurl'), onderwerp: q('onderwerp'), taal: q('taal'), soort: q('soort'), doel: q('doel'), doelsoort: q('doelsoort'), haak: q('haak'), variant: q('variant'), trend: q('trend'), paar: q('paar'), tekst: q('tekst'), wie: q('wie'), geplaatst: q('geplaatst') === '1' }));
      if (op === 'distzet') return res.status(200).json(await D.zet(q('id'), { geplaatst: q('geplaatst') === '1', plekUrl: q('plekurl'), uitkomst: q('uitkomst'), n: q('n'), tekst: q('tekst'), haak: q('haak'), doelsoort: q('doelsoort'), variant: q('variant'), trend: q('trend'), paar: q('paar'), store: q('store'), stats: q('imp') != null ? { imp: q('imp'), likes: q('likes'), reacties: q('reacties'), delen: q('delen') } : null }));
      if (op === 'diststand') return res.status(200).json(await D.stand({ dagen: Math.min(90, Number(q('dagen')) || 30), project: q('project') || '' }));
    }
    if (op === 'stuk' || op === 'stukken' || op === 'briefing' || op === 'trend' || op === 'voorstel' || op === 'adbieb') { // paspoort en geheugen (lib/paspoort.js, Henkjan 27 nov 2026): één register voor alles wat de deur uit gaat, met medium, waarvoor en doel
      const P = await import('../lib/paspoort.js'); res.setHeader('cache-control', 'no-store'); cors(res);
      const isCron = (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET) || /vercel-cron/i.test(String(req.headers['user-agent'] || ''));
      const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''), given = [req.headers['x-hjdk-token'], bearer].filter(Boolean);
      const sleutel = given.some(g => [process.env.ZICHT_TOKEN, process.env.GADS_TOKEN, process.env.HJDK_TOKEN].filter(Boolean).includes(g)); /* andere projecten lezen en melden met de gedeelde team-sleutel */
      if (!(isCron || beschermd(req) || sleutel)) return res.status(403).json({ ok: false, fout: 'alleen de beschermde vercel.app-host of de team-sleutel' });
      if (op === 'briefing') { // lezen vóór je iets maakt: ?medium=&project=&doel=[&vorm=json]
        const b = await P.briefing({ medium: q('medium'), project: q('project'), doel: q('doel'), dagen: Math.min(180, Number(q('dagen')) || 90) }); if (!b.ok) return res.status(400).json(b);
        if (q('vorm') === 'json') return res.status(200).json(b);
        res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(b.tekst + '\n');
      }
      if (op === 'adbieb') { // advertentiebibliotheken van buiten (lib/adbieb.js): ronde, melding van een chat, zoektermen, stand
        const AB = await import('../lib/adbieb.js'), b = req.method === 'POST' ? leesJson(req.body) : leesJson(q('j'));
        if (q('run') === '1') { if (!(isCron || beschermd(req))) return res.status(403).json({ ok: false, fout: 'alleen cron of de beschermde vercel.app-host' }); return res.status(200).json(await AB.ronde({ forceer: q('forceer') === '1', alleen: q('project') ? AB.pid(q('project')) : '' })); }
        if (q('zoek')) { if (!beschermd(req)) return res.status(403).json({ ok: false, fout: 'alleen de beschermde vercel.app-host' }); const r = await AB.zetZoek(leesJson(q('zoek'))); return res.status(r.ok ? 200 : 400).json(r); }
        if (b) { const r = await AB.zet(b); return res.status(r.ok ? 200 : 400).json(r); }
        if (q('vorm') === 'json') return res.status(200).json(await AB.stand());
        res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send((await AB.tekst(q('project') ? AB.pid(q('project')) : '')) + '\n');
      }
      if (op === 'trend') { // wat nu groot is per platform (lib/trend.js, Henkjan 27 nov 2026): melden met j= of POST, lezen met medium= of vorm=tekst
        const TR = await import('../lib/trend.js'), b = req.method === 'POST' ? leesJson(req.body) : leesJson(q('j'));
        if (b) { const r = await TR.zetTrend(b); return res.status(r.ok ? 200 : 400).json(r); }
        if (q('medium')) return res.status(200).json(await TR.leesTrend(q('medium')));
        if (q('vorm') === 'json') return res.status(200).json(await TR.alleTrends());
        res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send((await TR.trendTekst()) + '\n');
      }
      if (op === 'voorstel') { // nieuwe stukken die Henkjan eerst ziet (lib/trend.js): oud naast nieuw op één link, niets live zonder zijn ja
        const TR = await import('../lib/trend.js'), b = req.method === 'POST' ? leesJson(req.body) : leesJson(q('j'));
        if (b) { const r = await TR.zetVoorstel(b); return res.status(r.ok ? 200 : 400).json(r); }
        if (q('id') && q('besluit')) { if (!beschermd(req)) return res.status(403).json({ ok: false, fout: 'alleen de beschermde vercel.app-host' }); const r = await TR.besluitVoorstel(q('id'), q('besluit'), { wie: q('wie'), notitie: q('notitie') }); return res.status(r.ok ? 200 : 400).json(r); }
        const v = q('id') ? await TR.leesVoorstel(q('id')) : null; if (q('id') && !v) return res.status(404).json({ ok: false, fout: 'onbekend voorstel' });
        if (v && q('vorm') === 'json') return res.status(200).json(v);
        if (v && q('vorm') === 'tekst') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(TR.voorstelTekst(v) + '\n'); }
        const { CSS } = await import('../lib/dashboard.js'); res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(200).send(TR.voorstelHtml(v, CSS, v ? [] : await TR.voorstellen(30)));
      }
      if (op === 'stuk') { // één stuk melden of lezen; ?campagne=<net>:<id>&doel= zet het doel van een hele campagne vast
        if (q('campagne')) { const r = await P.zetCampDoel(q('campagne'), q('doel')); return res.status(r.ok ? 200 : 400).json(r); }
        if (q('poort')) return res.status(200).json(await P.poortCheck(q('poort'))); /* uitkomstpoort: bestemming zonder gemeten aanmelding of verkoop? */
        const b = req.method === 'POST' ? leesJson(req.body) : leesJson(q('j'));
        if (!b && q('id')) return res.status(200).json((await P.lees(q('id'))) || { ok: false, fout: 'onbekend id' });
        if (!b) return res.status(400).json({ ok: false, fout: 'geef j=<JSON> of POST JSON: {"medium":"...","project":"...","doel":"...","titel":"...","tekst":"...","haak":"...","pagina":"https://...","plek":"...","publiek":"..."}', media: Object.keys(P.MEDIA), doelen: P.DOELEN });
        delete b.bron; const r = await P.zet(b, { streng: ['hand', 'ad', 'post', 'video', 'mail'] }); /* met de hand melden kan alleen met een volledig paspoort */
        return res.status(r.ok ? 200 : 400).json(r);
      }
      if (q('run') === '1') return res.status(200).json(await P.ronde({ dagen: Math.min(120, Number(q('dagen')) || 45) }));
      if (q('lijst') === '1') return res.status(200).json(await P.lijst({ project: q('project'), medium: q('medium'), bron: q('bron'), uitslag: q('uitslag'), variant: q('variant'), regel: q('regel') === '1', n: q('n') })); /* stukken met hun oordeel, voor een chat die nieuwe versies schrijft */
      if (q('uitstop') != null) { if (!beschermd(req)) return res.status(403).json({ ok: false, fout: 'alleen de beschermde vercel.app-host' }); return res.status(200).json(await P.zetUitStop(q('uitstop') === '1')); } /* noodrem op de uit-lijst van het geheugen */
      if (q('streng') != null) { if (!beschermd(req)) return res.status(403).json({ ok: false, fout: 'alleen de beschermde vercel.app-host' }); return res.status(200).json(await P.zetStreng(q('streng'))); }
      const st = await P.stand({ vers: q('vers') === '1' });
      if (q('vorm') === 'json') return res.status(200).json(st);
      if (q('vorm') === 'tekst') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(P.standTekst(st) + '\n'); }
      const { CSS } = await import('../lib/dashboard.js'); res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(200).send(P.standHtml(st, CSS));
    }
    if (op === 'kknl') { // koopkracht Nederland per PC4 (lib/kknl.js, 28 nov 2026, taak xwo1wj): stand, ophalen bij PDOK (run=1), ruwe vorm (proef=1), een PC4 nakijken (pc=)
      const KN = await import('../lib/kknl.js'); res.setHeader('cache-control', 'no-store'); cors(res);
      if (!beschermd(req)) return res.status(403).json({ ok: false, fout: 'alleen de beschermde vercel.app-host' });
      if (q('proef') === '1') return res.status(200).json(await KN.proef().catch(e => ({ ok: false, fout: String(e && e.message || e).slice(0, 200) })));
      if (q('run') === '1') { const r = await KN.bewaar(kv, await KN.haalNL().catch(e => ({ ok: false, fout: String(e && e.message || e).slice(0, 200) }))); if (r.ok) KN.zetGeheugen(r.tabel); return res.status(r.ok ? 200 : 502).json({ ok: r.ok, fout: r.fout, meta: r.meta, stand: await KN.stand(kv) }); }
      const pc = String(q('pc') || '').replace(/\D/g, '').slice(0, 4), st = await KN.stand(kv);
      if (pc.length === 4) { const OM = await import('../lib/omgeving.js'); return res.status(200).json({ ok: true, pc, vijfde: OM.koopkracht('nl', pc, { NL: await KN.laadNL(kv) }) || 'onbekend' }); }
      return res.status(200).json({ ok: true, stand: st, tekst: KN.standTekst(st) });
    }
    if (op === 'bronnen') { // databronnen van Clickmind (lib/pxcheck.js, Henkjan 27 nov 2026): stand, per zone, en de dagelijkse Radar-ronde
      const P = await import('../lib/pxcheck.js'); res.setHeader('cache-control', 'no-store'); cors(res);
      if (q('run') === '1') { const kk = await (await import('../lib/kknl.js')).zorgNL(kv, fetch, { tijd: 100000 }); const rr = await P.radarRonde(kv); return res.status(200).json(Object.assign({}, rr, { kknl: kk })); } /* NL-koopkracht ophalen als hij ontbreekt of ouder is dan 180 dagen, met eigen try/catch en tijdslimiet */
      const st = await P.bronnenStand(kv), zones = await P.pxZones(kv, 7);
      const UT = await import('../lib/uitkomstterug.js'), uts = await UT.terugStand(kv, Math.max(1, Math.min(14, Number(q('dagen')) || 1))).catch(() => null); // uitkomsten terug naar de klik (28 nov 2026): per bron vandaag gekoppeld en niet gekoppeld
      if (q('terug')) return res.status(200).json({ ok: true, terug: uts, amazonZones: (await UT.zoneAmazon(kv, 7).catch(() => [])).slice(0, 30) });
      if (q('zones')) return res.status(200).json({ ok: true, zones: zones.slice(0, 300) });
      if (q('json')) return res.status(200).json({ ok: true, bronnen: st, zones: zones.filter(z => z.oordeel !== 'te weinig').slice(0, 50) });
      const V = await import('../lib/vmodel.js'), M = await kv.get('mm:model:g').catch(() => null); // voorspelmodel per klik: voorspeld tegen echt
      if (q('model')) return res.status(200).json({ ok: true, model: M ? { t: M.t, p0: M.p0, kal: M.kal, raak: M.raak, raakKliks: M.raakKliks, mag: M.mag, voorspellers: Object.fromEntries(Object.entries(M.w || {}).map(([d, W]) => [d, Object.keys(W).length])) } : null });
      const D5 = await (await import('../lib/d51.js')).stand(kv).catch(() => null); // 51Degrees: opvragingen deze maand en fouten
      if (q('d51')) return res.status(200).json({ ok: true, d51: D5 });
      const d5t = D5 ? '51Degrees: ' + (D5.aan ? 'aan' : 'uit (geen D51_KEY)') + ', ' + D5.dezeMaand + ' van ' + D5.max + ' opvragingen deze maand' + (Object.keys(D5.fout).length ? ', fouten ' + JSON.stringify(D5.fout) + (D5.laatsteFout ? ' laatste: ' + D5.laatsteFout : '') : '') : '';
      const OM = await import('../lib/omgeving.js'), OS = await OM.stand(kv).catch(() => null); // omgevingsdata (koopkracht, weer, daglicht): dagtellers en pauze
      if (q('omgeving')) return res.status(200).json({ ok: true, omgeving: OS });
      const omt = OS ? OM.standTekst(OS) : '';
      const SG = await import('../lib/segment.js'), sgt = SG.segTekst(await SG.segStand(kv, 1).catch(() => null)); // koopkrachtscore en segmentpostbacks (28 nov 2026)
      res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(V.modelTekst(M) + '\n\n' + (d5t ? d5t + '\n\n' : '') + (omt ? omt + '\n\n' : '') + (sgt ? sgt + '\n\n' : '') + (uts ? UT.terugTekst(uts) + '\n\n' : '') + P.bronnenTekst(st, zones));
    }
    if (op === 'segment' || op === 'voorwie') { // segmenten per product (lib/segment.js, 28 nov 2026, taak dnhwt6): koopkrachtscore, segmentconversie, zoneprofiel per segment
      const S = await import('../lib/segment.js'); res.setHeader('cache-control', 'no-store'); cors(res);
      if (op === 'voorwie') { // tik "Voor wie zoek je?" op de klik (cid = mmc); inert: geen pagina stuurt hem tot Henkjan ja zegt
        if (req.method === 'OPTIONS') return res.status(204).end();
        const j = req.method === 'POST' ? (leesJson(req.body) || {}) : { cid: q('cid') || q('mmc'), w: q('w') };
        const r = await S.voorWie(kv, j).catch(e => ({ ok: false, fout: String(e && e.message || e).slice(0, 120) }));
        return req.method === 'POST' ? res.status(204).end() : res.status(r.ok ? 200 : 400).json(r);
      }
      const st = await S.segStand(kv, Number(q('dagen')) || 1);
      if (q('uitleg')) return res.status(200).json({ ok: true, KKS: S.KKS, punten: Object.fromEntries(Object.entries(S.PUNTEN).map(([k, v]) => [k, v instanceof RegExp ? String(v) : v])), segmenten: S.SEGMENTEN, uitleg: 'Punten per signaal (eerste hypothese, de lessen in /api/mm/voorspel moeten ze bevestigen); hoog vanaf ' + S.KKS.hoog + ', laag tot en met ' + S.KKS.laag + ', minstens ' + S.KKS.minSignalen + ' signalen.' });
      const pr = await S.zoneProfiel(kv, { dagen: q('dagen') ? Number(q('dagen')) : 14, prod: q('prod') || '', uit: q('uit') || 'echt', sub: q('sub') === '1', minKliks: Number(q('min')) || undefined });
      if (q('vorm') === 'json') return res.status(200).json({ ok: true, stand: st, profiel: pr });
      res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(S.segTekst(st) + '\n\n' + S.profielTekst(pr) + '\n');
    }
    if (op === 'gadslogin') { // Google Ads koppelen voor het campagne-archief (27 nov 2026): alleen Henkjan op de beschermde host; door naar de inlog van Google
      if (!beschermd(req)) return res.status(403).json({ ok: false, fout: 'alleen de beschermde vercel.app-host' });
      const r = await (await import('../lib/cmcamp.js')).gadsInlogLink().catch(e => ({ ok: false, fout: String(e && e.message || e).slice(0, 120) }));
      res.setHeader('cache-control', 'no-store');
      if (r && r.ok && /^https:\/\/(accounts\.google\.com\/|[a-z0-9.-]+\.vercel\.app\/api\/gads\/auth\/start\?n=[a-f0-9]{32}$)/.test(String(r.link || ''))) { /* de link gaat eerst langs propellerads-mcp (eenmalige nonce), die stuurt door naar Google */ res.setHeader('location', r.link); return res.status(302).end(); }
      return res.status(502).json({ ok: false, fout: (r && r.fout) || 'geen inloglink' });
    }
    if (op === 'campagnes') { // campagne-archief: alle data van de netwerken naast eigen uitkomsten (lib/cmcamp.js, Henkjan 26 nov 2026)
      const C = await import('../lib/cmcamp.js'); res.setHeader('cache-control', 'no-store'); cors(res);
      if (q('inhaal')) { // historie inhalen (lib/cmcamp.js inhaal): cron elke 5 minuten, starten op de beschermde host met &van=&tot=
        const isCron = (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET) || /vercel-cron/i.test(String(req.headers['user-agent'] || ''));
        if (!(isCron || beschermd(req))) return res.status(403).json({ ok: false, fout: 'alleen cron of de beschermde vercel.app-host' });
        const alleen = q('alleen') || ''; // één netwerk (bijv. mondiad) met eigen toestand cm:inhaal:<net>; de gewone cm:inhaal blijft onaangeroerd
        if (alleen && !C.NETTEN.includes(String(alleen).toLowerCase())) return res.status(400).json({ ok: false, fout: 'alleen = ' + C.NETTEN.join(' | ') });
        if (q('stand')) return res.status(200).json(await kv.get(alleen ? 'cm:inhaal:' + String(alleen).toLowerCase() : 'cm:inhaal').catch(() => null) || { ok: true, leeg: true });
        if (alleen || (q('van') && q('tot'))) return res.status(200).json(await C.inhaal({ van: q('van'), tot: q('tot'), alleen }));
        return res.status(200).json(await C.inhaalCron()); // cron: eerst de gewone inhaal, daarna de netwerk-inhaal die nog loopt
      }
      if (q('run') === '1') {
        const isCron = (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET) || /vercel-cron/i.test(String(req.headers['user-agent'] || ''));
        if (!(isCron || beschermd(req))) return res.status(403).json({ ok: false, fout: 'alleen cron of de beschermde vercel.app-host' });
        const cr = await C.ronde({ dag: q('dag'), alleen: q('alleen') || undefined });
        /* het geheugen loopt mee met deze cron (lib/paspoort.js): alle creatives, posts, video's en mails opnieuw inladen en oordelen */
        if (isCron && !q('alleen')) cr.geheugen = await import('../lib/paspoort.js').then(P => P.ronde({})).then(g => ({ stukken: g.stukken, nieuw: g.nieuw, raak: g.raak, mis: g.mis, fouten: g.fouten })).catch(e => ({ fout: String(e && e.message || e).slice(0, 160) }));
        if (isCron && !q('alleen')) cr.labelwacht = await C.labelWacht(); /* werklijst labels: open > 0 zonder open labeltaak = één lichte taak per dag (lib/cmcamp.js labelWacht) */
        return res.status(200).json(cr);
      }
      if (q('leg')) { if (!beschermd(req)) return res.status(403).json({ ok: false, fout: 'alleen de beschermde vercel.app-host' }); return res.status(200).json(await C.leg(q('leg'))); } // netwerk met de sleutel elders: data/camp-historie/<net>.json inleggen
      if (q('labelwerk') === '1') return res.status(200).json(await C.labelWerk(Number(q('n')) || 80, q('deel')));
      if (q('kort')) { if (!beschermd(req)) return res.status(403).json({ ok: false, fout: 'alleen de beschermde vercel.app-host' }); return res.status(200).json(await C.zetLabels(C.kortLabels(q('kort')))); }
      if (q('labels')) { if (!beschermd(req)) return res.status(403).json({ ok: false, fout: 'alleen de beschermde vercel.app-host' }); let o = null; try { o = JSON.parse(q('labels')); } catch (e) {} return res.status(200).json(await C.zetLabels(o)); }
      if (q('campagne')) return res.status(200).json(await C.campagne(q('campagne'), Number(q('dagen')) || 30));
      return res.status(200).json(await C.leer({ dagen: Number(q('dagen')) || 14, project: q('project') || '', net: q('net') || '' }));
    }
    if (op === 'buiten') { // data van buiten per project (lib/buiten.js, Henkjan 26 nov 2026: "data van buiten voor ieder merk en project")
      const B = await import('../lib/buiten.js'); res.setHeader('cache-control', 'no-store'); cors(res);
      if (q('run') === '1') {
        const isCron = (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET) || /vercel-cron/i.test(String(req.headers['user-agent'] || ''));
        if (!(isCron || beschermd(req))) return res.status(403).json({ ok: false, fout: 'alleen cron of de beschermde vercel.app-host' });
        return res.status(200).json(await B.ronde({ forceer: q('forceer') === '1', alleen: q('project') ? B.projectId(q('project')) : '' }));
      }
      return res.status(200).json(await B.stand(q('project') || ''));
    }
    if (op === 'vroeg' || op === 'vroeguit') { // vroege voorspeller (lib/vroeg.js, Henkjan 23 nov 2026: "Ja doe .")
      const V = await import('../lib/vroeg.js'); res.setHeader('cache-control', 'no-store'); cors(res);
      if (op === 'vroeguit') { // plus wat het geheugen hard 'mis' vindt binnen de eigen campagne (lib/paspoort.js uitAds, 27 nov 2026); zelfde vorm, de wacht van het netwerk houdt zijn eigen grenzen
        const net = netNaam(q('net') || 'propeller'), u = await V.uitLijst(kv, { net }), al = new Set((u.advertenties || []).map(x => x.campagne + '|' + x.advertentie));
        let extra = []; try { const P = await import('../lib/paspoort.js'); extra = (await P.uitAds(net)).filter(x => !al.has(x.campagne + '|' + x.advertentie)); } catch (e) {}
        if (extra.length) { u.advertenties = [...(u.advertenties || []), ...extra]; u.betrouwbaar = true; u.geheugen = extra.length; u.regelGeheugen = 'bron geheugen = binnen de eigen campagne aantoonbaar slechter op de conversies van het netwerk: hoogstens de helft van verwacht bij 3+ verwachte conversies en 100+ kliks, liep de laatste 3 dagen nog'; }
        return res.status(200).json(u);
      }
      if (q('run') === '1') {
        const isCron = (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET) || /vercel-cron/i.test(String(req.headers['user-agent'] || ''));
        if (!(isCron || beschermd(req))) return res.status(403).json({ ok: false, fout: 'alleen cron of de beschermde vercel.app-host' });
        const r = await V.ronde(kv, { tijd: 220000 }).catch(e => ({ ok: false, fout: String(e && e.message || e).slice(0, 300) }));
        return q('vorm') === 'tekst' ? res.status(200).send(V.tekst(r)) : res.status(200).json(r.ok ? { ok: true, t: r.t, volledig: r.volledig, rijen: r.rijen, tekst: V.tekst(r) } : r);
      }
      const v = await kv.get(V.VROEG).catch(() => null);
      if (q('vorm') === 'tekst') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(V.tekst(v)); }
      if (!beschermd(req)) return res.status(200).json({ ok: true, tekst: V.tekst(v) }); // details (gewichten, groepen) alleen op de beschermde host
      return res.status(200).json(v || { ok: false, fout: 'nog geen ronde' });
    }
    if (op === 'proef') { res.setHeader('cache-control', 'no-store'); return res.status(200).json(await proef(kv, { dagen: q('dagen'), camp: q('camp') || '' })); }
    if (op === 'export' || op === 'persoon') {
      res.setHeader('cache-control', 'no-store');
      if (!beschermd(req)) return res.status(403).json({ ok: false, fout: 'alleen via de beschermde vercel.app-host' });
      if (op === 'export') return res.status(200).json(await exporteer(kv, { d: q('dag'), van: q('van'), n: q('n'), soort: q('soort') || '' }));
      const p = await persoon(kv, q('pid')); return p ? res.status(200).json(p) : res.status(400).json({ ok: false, fout: 'pid = 16 hex' });
    }
    if (op === 'w') return await wisselRoute(req, res, url, q);
    if (op === 'mmu') { res.setHeader('content-type', 'application/javascript; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=3600, s-maxage=3600'); cors(res); return res.status(200).send(MMU_JS); }
    if (op === 'puit') { // uitkomst van een paginabezoek (mensmeter-vid) voor het profiel van wie converteert (lib/mensmeter.js paginaUitkomst)
      cors(res); res.setHeader('cache-control', 'no-store');
      if (req.method === 'OPTIONS') return res.status(204).end();
      const { paginaUitkomst } = await import('../lib/mensmeter.js');
      const j = req.method === 'POST' ? (leesJson(req.body) || {}) : { vid: q('vid'), soort: q('soort') };
      const r = await paginaUitkomst(kv, j).catch(e => ({ ok: false, fout: String(e && e.message || e).slice(0, 200) }));
      return req.method === 'POST' && j.antwoord !== true ? res.status(204).end() : res.status(r.ok ? 200 : 400).json(r);
    }
    if (op === 'bezoek') { // 25 nov 2026 (Henkjan: "Je hebt toch clickmind verdomme ?"): Clickmind volgt op kadoly.com ELKE bezoeker, niet alleen advertentieklikken.
      // cm.js stuurt per nieuw bezoek de herkomst (verwijzer-host, landingspad, utm, klik-id's, laatste mmc) en bij het afrekenen de sha256 van het e-mailadres.
      // Bewaard: cmv:<id> (eerste en laatste herkomst, 90 dagen) en cmv:em:<hash> -> id (90 dagen). Geen IP, geen adres, alleen hashes. lib/herkomst.js koppelt zo elke bestelling aan zijn bron.
      cors(res); res.setHeader('cache-control', 'no-store'); if (req.method === 'OPTIONS') return res.status(204).end();
      const ua = String(req.headers['user-agent'] || ''); if (/bot|crawl|spider|slurp|preview|lighthouse|headless/i.test(ua)) return res.status(204).end();
      const j = req.method === 'POST' ? (leesJson(req.body) || {}) : {}; const v = String(j.v || '').toLowerCase(); if (!/^[0-9a-f]{16}$/.test(v)) return res.status(204).end();
      const S = (x, n = 120) => String(x == null ? '' : x).replace(/[^\w .:/@+=~-]/g, '').slice(0, n);
      try {
        const k = 'cmv:' + v; let rec = null; try { rec = await kv.get(k); } catch (e) {} rec = rec && typeof rec === 'object' ? rec : { n: 0 };
        if (j.t && typeof j.t === 'object') { const t = { at: new Date().toISOString() }; for (const f of ['r', 'l', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'gclid', 'gbraid', 'wbraid', 'srsltid', 'ttclid', 'fbclid', 'wacid', 'epik', 'msclkid', 'hj', 'mmc']) if (j.t[f]) t[f] = S(j.t[f], f === 'l' ? 80 : 120);
          if (!rec.ft) rec.ft = t; if (t.r || Object.keys(t).some(x => x !== 'at' && x !== 'l' && x !== 'r') || !rec.lt) rec.lt = t; rec.n = (rec.n || 0) + 1; }
        if (/^[0-9a-f]{8,24}$/.test(String(j.c || ''))) rec.c = String(j.c);
        const em = String(j.em || '').toLowerCase(); if (/^[0-9a-f]{64}$/.test(em)) { rec.em = 1; await kv.set('cmv:em:' + em, v, { ex: 90 * 86400 }); }
        rec.at = Date.now(); await kv.set(k, rec, { ex: 90 * 86400 });
        try { await kv.raw(['HINCRBY', 'cmv:tel', new Date().toISOString().slice(0, 10) + '|' + (j.em ? 'em' : j.t ? 'bezoek' : 'anders'), '1']); await kv.raw(['EXPIRE', 'cmv:tel', String(60 * 86400)]); } catch (e) {}
      } catch (e) {}
      return res.status(204).end(); }
    if (op === 'uitkomst') {
      cors(res); res.setHeader('cache-control', 'no-store');
      if (req.method === 'OPTIONS') return res.status(204).end();
      const j = req.method === 'POST' ? (leesJson(req.body) || {}) : { cid: q('cid') || q('mmc'), soort: q('soort'), waarde: q('waarde'), bron: q('bron') };
      const r = await uitkomst(kv, j).catch(e => ({ ok: false, fout: String(e && e.message || e).slice(0, 200) }));
      return req.method === 'POST' ? res.status(204).end() : res.status(r.ok ? 200 : 400).json(r);
    }
    if (op === 'mmm' || op === 'cm') { res.setHeader('content-type', 'application/javascript; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800'); /* 23 nov (Henkjan: "Zorg dat clickmind noooooooit vertragend is"): de edge geeft cm.js altijd meteen (een nieuwe uitrol leegt de cache), nooit wachten op een koude functie (gemeten 929 ms) */ cors(res); return res.status(200).send(op === 'cm' ? CM_JS : MMM_JS); }
    // Clickmind-publiek (lib/retarget.js): cm.js vraagt na echt gedrag op de pagina welke publieks-pixels mogen afgaan
    if (op === 'rt') {
      cors(res); res.setHeader('cache-control', 'no-store');
      if (req.method === 'OPTIONS') return res.status(204).end();
      const srv = serverSignalen(req), d = dcVan(srv), sc = score({ c: null, s: Object.assign({}, srv, d) }), c = await leesRt(kv);
      const lok = q('lok') === '' || q('lok') == null ? null : Number(q('lok')), sec = Number(q('s')) || 0, act = Number(q('a')) || 0;
      const mens = sec >= c.minSeconden && act >= c.minActies && (lok == null || !Number.isFinite(lok) || lok >= c.minLokaal);
      const qid = /^[0-9a-f]{16}$/.test(String(q('q') || '')) ? String(q('q')) : '';
      const r = await rtBeslis(kv, { bron: 'pagina', site: String(q('site') || '').slice(0, 40), land: srv.land, dc: d.dc === true, bot: !!(sc.vlag && sc.vlag.hl), gpc: req.headers['sec-gpc'] === '1', uit: leesCookie(req, 'mmrt') === 'uit', mens, id: qid, seg: String(q('seg') || '').slice(0, 10), toestemming: q('tm') === '1' }).catch(() => ({ px: [] }));
      return res.status(200).json({ px: r.px || [] });
    }
    // afmelden voor het Clickmind-publiek (privacypagina): cookie mmrt=uit op dit domein, de pagina zet ook localStorage cmRtUit
    if (op === 'rtuit') {
      cors(res); res.setHeader('cache-control', 'no-store');
      res.setHeader('set-cookie', 'mmrt=uit; Max-Age=31536000; Path=/; Secure; SameSite=Lax');
      const c = leesCookie(req, 'mmp'); if (/^[0-9a-f]{16}$/.test(c)) { try { await kv.set('mm:rtuit:' + c, 1, { ex: 400 * 86400 }); } catch (e) {} }
      return res.status(200).json({ ok: true, afgemeld: true });
    }
    if (op === 'kadolychat') { // chat in de modal en op WhatsApp (lib/kadolychat.js, 11 nov)
      cors(res); res.setHeader('cache-control', 'no-store'); if (req.method === 'OPTIONS') return res.status(204).end(); if (req.method !== 'POST' && !beschermd(req)) return res.status(405).json({ ok: false });
      const b = req.method === 'POST' ? (leesJson(req.body) || {}) : { vraag: q('vraag'), keuze: q('keuze'), kanaal: q('kanaal'), ctx: { titel: q('titel') || '', levering: q('levering') || '' }, test: true }; /* GET alleen op de beschermde host, om te testen: telt niet mee */ const { kadolyAntwoord, kadolyHerstel, kadolyContact } = await import('../lib/kadolychat.js');
    if (req.method !== 'POST' && (q('min') || q('wisvraag'))) return res.status(200).json(await kadolyHerstel(kv, { min: q('min'), wisvraag: q('wisvraag') })); const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
      if (req.method === 'POST' && b.kontakt) return res.status(200).json(await kadolyContact(kv, { kontakt: b.kontakt, hist: b.hist, ctx: b.ctx, ip }).catch(() => ({ ok: false })));
      return res.status(200).json(await kadolyAntwoord(kv, { vraag: b.vraag, hist: b.hist, kanaal: b.kanaal, ctx: b.ctx, keuze: b.keuze, ip, test: b.test === true && req.method !== 'POST', oidc: String(req.headers['x-vercel-oidc-token'] || '') }).catch(() => ({ ok: false })));
    }
    if (op === 'modaluur') { // uurupdate van de modal (11 nov), beschermde host; ?droog=1 bewaart het vergelijkpunt niet
      if (!beschermd(req)) return res.status(403).json({ ok: false, fout: 'alleen via de beschermde vercel.app-host' });
      const { modalUur } = await import('../lib/modal.js'); const r = await modalUur(kv, q('site') || 'kadoly', { bewaar: q('droog') !== '1' });
      res.setHeader('cache-control', 'no-store'); if (q('vorm') === 'json') return res.status(200).json(r); res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(r.tekst || r.fout || 'fout');
    }
    if (op === 'proefkies' || op === 'proefev' || op === 'proefstand' || op === 'proefzet') { // Clickmind-proeven (lib/proef.js, 10 nov)
      cors(res); res.setHeader('cache-control', 'no-store'); if (req.method === 'OPTIONS') return res.status(204).end();
      const PF = await import('../lib/proef.js');
      if (op === 'proefkies') return res.status(200).json(await PF.proefBeslis(kv, { site: q('site'), ctx: q('c') }).catch(() => ({ ok: false })));
      if (op === 'proefev') { const b = req.method === 'POST' ? (leesJson(req.body) || {}) : Object.fromEntries(url.searchParams); return res.status(200).json(await PF.proefEv(kv, b).catch(() => ({ ok: false }))); }
      if (op === 'proefstand') { const s = await PF.proefStand(kv, q('site') || 'kadoly'); if (q('vorm') === 'tekst') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(PF.proefTekst(s)); } return res.status(200).json(s); }
      if (!beschermd(req)) return res.status(403).json({ ok: false, fout: 'alleen via de beschermde vercel.app-host' });
      return res.status(200).json(await PF.proefZet(kv, q('site') || 'kadoly', { aan: q('aan') == null ? null : q('aan') === '1', j: q('j') || (req.method === 'POST' ? leesJson(req.body) : null), ronde: q('ronde') === '1' }).catch(e => ({ ok: false, fout: String(e.message || e) })));
    }
    if (op === 'modal' || op === 'modalev' || op === 'modalmailev' || op === 'modalmail' || op === 'modalgedrag' || op === 'modalpush') {
      cors(res); res.setHeader('cache-control', 'no-store');
      if (req.method === 'OPTIONS') return res.status(204).end();
      if (op === 'modal') {
        const c = leesCookie(req, 'mmp');
        const r = await modalBeslis(kv, { site: q('site'), pid: /^[0-9a-f]{16}$/.test(c) ? c : '', q: q('q'), mmc: q('c'), v: q('v'), mob: q('mob') === '1', abo: q('abo') === '1', fb: q('fb') === '1', test: q('test'), origin: String(req.headers.origin || ''), land: String(req.headers['x-vercel-ip-country'] || ''), net: q('net'), zone: q('zone'), ref: q('ref'), uur: q('uur'), hist: { g: q('g'), k: q('k') }, kw: q('kw'), vo: q('vo'), pa: q('pa'), pt: q('pt'), warm: q('warm') === '1', kl: q('kl') === '1', pl: q('pl'), pu: q('pu') === '1', geo: { stad: (() => { try { return decodeURIComponent(String(req.headers['x-vercel-ip-city'] || '')); } catch (x) { return ''; } })(), rg: String(req.headers['x-vercel-ip-country-region'] || ''), cc: String(req.headers['x-vercel-ip-country'] || ''), lat: String(req.headers['x-vercel-ip-latitude'] || ''), lon: String(req.headers['x-vercel-ip-longitude'] || '') } }).catch(e => { console.log('cm modal fout', String(e && e.message || e)); return { toon: false, reden: 'fout' }; });
        return res.status(200).json(r);
      }
      if (op === 'modalev') { const r = await modalEv(kv, { mid: q('mid'), e: q('e') }).catch(e => ({ ok: false })); return req.method === 'GET' ? res.status(r.ok ? 200 : 400).json(r) : res.status(204).end(); }
      if (op === 'modalmailev') { const r = await modalMailEv(kv, { k: q('k'), e: q('e') }).catch(() => ({ ok: false })); return res.status(r.ok ? 200 : r.onbekend ? 404 : 400).json(r); } // welkomstmail van een eigen lijst (lib/modal.js modalMailEv)
      if (op === 'modalgedrag') { if (req.method !== 'POST') return res.status(405).end(); const b = leesJson(req.body) || {}; await modalGedrag(kv, { ...b, tm: b.tm === 1 || b.tm === true }).catch(() => null); return res.status(204).end(); }
      if (req.method !== 'POST') return res.status(405).json({ ok: false, fout: 'POST' });
      const j = leesJson(req.body) || {}, srv = serverSignalen(req);
      if (op === 'modalpush') { // push met één klik uit de modal (25 nov 2026): alleen bewaren, versturen doet de meldingenlijst van de site zelf
        let host = ''; try { host = new URL(String(req.headers.origin || '')).hostname; } catch (e) {}
        const r = await modalPush(kv, { mid: j.mid, endpoint: j.endpoint, host, ipNet: ipInfo(srv.ip).h || ipInfo(srv.ip).net }).catch(() => ({ ok: false, fout: 'fout' }));
        return res.status(r.ok ? 200 : 400).json(r); }
      const r = await modalMail(kv, { mid: j.mid, email: j.email, voornaam: j.naam, pagina: String(j.pg || '').slice(0, 300), bewaar: j.bewaar !== false, tel: j.tel !== false, ipNet: ipInfo(srv.ip).h || ipInfo(srv.ip).net, land: srv.land }).catch(e => ({ ok: false, fout: 'fout' }));
      return res.status(r.ok ? 200 : 400).json(r);
    }
    if (op === 'handoverzet') { // projecten sturen hun werking en stand naar de centrale overdracht (Henkjan 19 okt); gedeelde team-sleutel, ook via keuzehulp.best
      const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''); const given = [req.headers['x-hjdk-token'], bearer].filter(Boolean);
      const ok = [process.env.ZICHT_TOKEN, process.env.GADS_TOKEN, process.env.HJDK_TOKEN].filter(Boolean);
      if (req.method !== 'POST' || !given.some(g => ok.includes(g))) return res.status(401).json({ ok: false, fout: 'sleutel' });
      const H = await import('../lib/handover.js'); const b = leesJson(req.body) || {};
      return res.status(200).json(await H.zetProject(kv, b)); }
    if (op === 'lekketen') { // lekketen van advertentie tot betaling (lib/lekketen.js, Henkjan 19 okt): ?project=mylevel, ?vorm=tekst, ?vers=1
      // Op de beschermde host alles; elders (keuzehulp.best, voor het MyLevel-rapport en de leerlus) alleen de totalen per stap, zonder campagnes
      const L = await import('../lib/lekketen.js'); const vol = beschermd(req);
      const u0 = await L.lekketen(kv, { project: q('project') || 'mylevel', vers: vol && q('vers') === '1' });
      const u = vol ? u0 : Object.assign({}, u0, { campagnes: undefined, tekst: undefined });
      res.setHeader('cache-control', 'no-store');
      if (q('vorm') === 'tekst') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(L.tekst(u, { openbaar: !vol }).join('\n') + '\n'); }
      return res.status(200).json(u);
    }
    if (op === 'handover') { // handover voor elke chat (Henkjan 17 okt): live stand, open punten en werklog; ?log=<tekst>&wie=<chat> schrijft bij, ?open=<JSON-lijst> zet de open punten
      if (!beschermd(req)) return res.status(403).send('alleen via de beschermde vercel.app-host');
      const H = await import('../lib/handover.js');
      if (q('log')) return res.status(200).json(await H.logBij(kv, { tekst: q('log'), wie: q('wie') || '' }));
      if (q('open')) { let l = null; try { l = JSON.parse(q('open')); } catch (e) {} return res.status(l ? 200 : 400).json(l ? await H.zetOpen(kv, l) : { ok: false, fout: 'open=<JSON-lijst>' }); }
      const t = await H.handover(kv); res.setHeader('cache-control', 'no-store');
      if (q('vorm') === 'json') return res.status(200).json(t.json);
      res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(t.tekst); }
    if (op === 'oversight') { // Oversight (Henkjan 26 nov 2026): dagelijkse zoekwoordencheck op alle Amazon Ads-campagnes, zodat we nooit aan bleeders uitgeven; kort adres /oversight
      const O = await import('../lib/oversight.js'); res.setHeader('cache-control', 'no-store');
      if (req.method === 'POST' && !beschermd(req)) { const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''); const given = [req.headers['x-hjdk-token'], bearer].filter(Boolean);
        const ok = [process.env.ZICHT_TOKEN, process.env.GADS_TOKEN, process.env.HJDK_TOKEN].filter(Boolean); if (!given.some(g => ok.includes(g))) return res.status(401).json({ ok: false, fout: 'sleutel' });
        const b = leesJson(req.body) || {}; const u = await O.zetOversight(kv, b, b.wie || 'cloud'); return res.status(u.ok ? 200 : 400).json(u); }
      if (!beschermd(req)) return res.status(403).send('alleen via de beschermde vercel.app-host');
      if (req.method === 'POST') { const b = leesJson(req.body) || {}; const u = await O.zetOversight(kv, b, b.wie || ''); return res.status(u.ok ? 200 : 400).json(u); }
      if (q('zet')) { let b = null; try { b = JSON.parse(q('zet')); } catch (e) {} const u = b ? await O.zetOversight(kv, b, q('wie') || '') : { ok: false, fout: 'zet=<JSON>, zie ?vorm=tekst' }; return res.status(u.ok ? 200 : 400).json(u); }
      const s = await O.ovStand(kv, 14); s.bezoek = await O.ovBezoek(kv, 14).catch(() => null);
      if (q('vorm') === 'json') return res.status(200).json(s);
      if (q('vorm') === 'tekst') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(O.ovTekst(s) + '\n'); }
      const { CSS } = await import('../lib/dashboard.js'); res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(200).send(O.ovHtml(s, CSS)); }
    if (op === 'adsfair') { const A = await import('../lib/adsfair.js'); return A.adsfairHandler(req, res, kv, { beschermd, q, leesJson }); } // adsfair.xyz: pagina, weekupdate en goedkeuring (27 nov 2026, lib/adsfair.js)
    if (op === 'dashboard') { // dashboard voor alle projecten (Henkjan 25 nov 2026): doel, voortgang, planning, overdracht en logboek per project; ?zet=<JSON> werkt bij, ?vorm=json|tekst, ?project=<id>
      if (req.method === 'POST' && !beschermd(req)) { // projecten zetten hun eigen voortgang bij vanuit de cloud (Henkjan 25 nov: "onafh comp en account"): alleen zet, met de gedeelde team-sleutel
        const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''); const given = [req.headers['x-hjdk-token'], bearer].filter(Boolean);
        const ok = [process.env.ZICHT_TOKEN, process.env.GADS_TOKEN, process.env.HJDK_TOKEN].filter(Boolean);
        if (!given.some(g => ok.includes(g))) return res.status(401).json({ ok: false, fout: 'sleutel' });
        const D = await import('../lib/dashboard.js'); const b = leesJson(req.body) || {};
        const T = await import('../lib/taken.js'); // de takenlijst (27 nov 2026): zelfde ingang, eigen module
        return res.status(200).json(T.isTaken(b) && !b.project ? await T.zetTaken(kv, b, b.wie || 'project') : await D.zetDash(kv, b, b.wie || 'project')); }
      if (!beschermd(req)) return res.status(403).send('alleen via de beschermde vercel.app-host');
      const D = await import('../lib/dashboard.js'); res.setHeader('cache-control', 'no-store');
      const T = await import('../lib/taken.js'); // de takenlijst, Henkjans beslissingen en gewoontes (27 nov 2026)
      // wat Henkjan zelf op de pagina doet: taak typen, antwoorden, opruimen, gewoonte aan of uit. Altijd een POST-formulier (veld taak of doe=<JSON>), nooit een GET-link; daarna terug naar de pagina met een melding
      if (req.method === 'POST') { let fb = req.body; if (Buffer.isBuffer(fb)) fb = fb.toString('utf8'); if (!fb || typeof fb !== 'object') fb = /^\s*\{/.test(String(fb || '')) ? (leesJson(String(fb)) || {}) : Object.fromEntries(new URLSearchParams(String(fb || '')));
        // zijn toestel (beoordeling 27 nov 2026: "zijn ja is te vervalsen"): koppelen met een code uit zijn Telegram; elke actie die voor zijn ja telt, eist dat toestel
        const tid = (String(req.headers.cookie || '').match(/(?:^|; )dashhj=([a-f0-9]+)/) || [])[1] || '';
        const terug = (m, h = '#taken') => { res.statusCode = 303; res.setHeader('location', '/dashboard?' + new URLSearchParams(m).toString() + h); return res.end(); };
        if (fb.koppel != null) { const u = await T.koppelVraag(kv); return terug(u.ok ? { m: 'code' } : { f: u.fout }, '#koppel'); }
        if (fb.code != null) { const u = await T.koppelCode(kv, fb.code, String(req.headers['user-agent'] || '').slice(0, 80));
          if (u.ok) res.setHeader('set-cookie', 'dashhj=' + u.id + '; Max-Age=31536000; Path=/; HttpOnly; Secure; SameSite=Strict');
          return terug(u.ok ? { m: 'gekoppeld' } : { f: u.fout, k: '1' }, '#koppel'); }
        if ((fb.taak != null || fb.doe != null) && !(await T.toestelOk(kv, tid))) return terug({ f: 'Koppel eerst dit toestel: één keer, met een code uit je Telegram.' }, '#koppel');
        if (fb.taak != null || fb.doe != null) { let b = null;
          if (fb.taak != null) b = { taak: { tekst: String(fb.taak), project: fb.p, account: fb.acc, zwaarte: fb.zw } };
          else { try { b = JSON.parse(String(fb.doe)); } catch (e) {} if (b && b.antwoord && typeof b.antwoord === 'object' && fb.tekst) b.antwoord.tekst = String(fb.tekst); }
          const u = b && typeof b === 'object' && T.isTaken(b) ? await T.zetTaken(kv, b, 'Henkjan', undefined, { henkjan: true }) : { ok: false, fout: 'onbekende actie' };
          const m = !u.ok ? { f: fb.taak != null ? 'typ in een paar woorden wat er moet gebeuren' : String(u.fout || 'fout').slice(0, 160) } : b.taak ? { m: 'taak' } : u.weg ? { m: 'weg', ids: u.weg.join(',') } : u.terug ? { m: 'terug' } : b.antwoord ? { m: b.antwoord.weg ? 'weg1' : 'antw' } : b.terugdraai ? { m: 'terugdraai' } : { m: 'gewoon' };
          res.statusCode = 303; res.setHeader('location', '/dashboard?' + new URLSearchParams(m).toString() + (b && b.gewoonte ? '#geleerd' : '#taken')); return res.end(); } }
      if (req.method === 'POST') { const b = leesJson(req.body) || {}; if (b.leerprompt == null) return res.status(400).json({ ok: false, fout: 'leerprompt ontbreekt' }); const u = await D.zetLeerprompt(kv, b.leerprompt, 'Henkjan (dashboard)'); return res.status(u.ok ? 200 : 400).json(u); }
      if (q('leerprompt') === 'vorige') { const u = await D.vorigeLeerprompt(kv); if (!u.ok) return res.status(400).json(u); }
      if (q('vorm') === 'skill') { const t = D.skillTekst(String(q('naam') || '')); res.setHeader('content-type', 'text/markdown; charset=utf-8'); return t ? res.status(200).send(t) : res.status(404).send('skill niet gevonden; overzicht: ' + D.SKILLS.map(s => s.naam).join(', ')); }
      if (q('vorm') === 'leerprompt') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send((await D.leesLeerprompt(kv)).tekst + '\n'); }
      if (q('zet')) { let b = null; try { b = JSON.parse(q('zet')); } catch (e) {} const u = b && typeof b === 'object' ? (T.isTaken(b) && !b.project ? await T.zetTaken(kv, b, q('wie') || '') : await D.zetDash(kv, b, q('wie') || '')) : { ok: false, fout: 'zet=<JSON> met project en de velden die veranderen' }; return res.status(u.ok ? 200 : 400).json(u); }
      let melding = null; // archiveren en terugzetten met één tik op de pagina (Henkjan 25 nov)
      if (q('archiveer') || q('terug')) { const id = q('archiveer') || q('terug'); const u = await D.zetDash(kv, { project: id, archief: !!q('archiveer') }, 'dashboard'); if (!u.ok) return res.status(400).json(u); melding = { id, aan: !!q('archiveer') }; }
      const d = await D.dashData(kv, { dagen: q('dagen') || q('periode') });
      if (q('vorm') === 'json') return res.status(200).json(d);
      if (q('vorm') === 'output') { const O = await import('../lib/output.js'); res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(d.output ? O.outputTekst(d.output, q('project') || '') + '\n' : 'geen output\n'); }
      if (q('vorm') === 'tekst') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(D.dashTekst(d, q('project') || '')); }
      if (q('vorm') === 'aanzetlink') { const acc = /^claude-[12]$/.test(String(q('account') || '')) ? String(q('account')) : 'claude-1'; res.statusCode = 302; res.setHeader('location', 'https://claude.ai/new?q=' + encodeURIComponent(T.aanzetChat(acc))); return res.end(); } // de herinnering en Instellingen openen hiermee een nieuwe chat in het andere account
      if (q('vorm') === 'poort') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(T.poortTekst()); } // vraagpoort en mandaten, voor elke chat
      if (q('vorm') === 'ja') return res.status(200).json(T.jaStand(d.taken || { besluiten: [] }, q('id'))); // alleen telt:true is zijn ja (toestel of stil akkoord)
      if (q('vorm') === 'taken' || q('vorm') === 'vangnet' || q('vorm') === 'aanzetten') { res.setHeader('content-type', 'text/plain; charset=utf-8'); const acc = String(q('account') || ''); return res.status(200).send(q('vorm') === 'taken' ? T.takenTekst(d.taken, acc, d, String(q('taak') || '')) : q('vorm') === 'vangnet' ? T.vangnetTekst(d.taken, acc, d) : T.aanzetTekst(acc)); } // werkwijze voor de oppakker en het vangnet (geplande taken per account)
      if (q('vorm') === 'bij') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(D.bijTekst(d, String(q('project') || ''))); } // kort: waar Henkjan was gebleven, voor elke beurt van elke chat
      if (q('vorm') === 'start') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(D.startTekst(d) + '\n'); }
      if (melding) { const a = d.archief.find(x => x.id === melding.id), p = d.projecten.find(x => x.id === melding.id); melding = melding.aan ? { tekst: ((a && a.naam) || melding.id) + ' is gearchiveerd en staat niet meer in het overzicht.', terug: melding.id } : { tekst: ((p && p.naam) || melding.id) + ' staat weer in het overzicht.' }; }
      // waar Verder opent (Henkjan 27 nov 2026: "kiezen tussen chatgpt , claude browser of claude desktop"): ?ai=<keuze> zet het cookie dashai voor dit toestel
      const aiQ = String(q('ai') || ''), aiC = (String(req.headers.cookie || '').match(/(?:^|; )dashai=([a-z]+)/) || [])[1] || '';
      if (D.isAi(aiQ)) res.setHeader('set-cookie', 'dashai=' + aiQ + '; Max-Age=31536000; Path=/; SameSite=Lax; Secure');
      res.setHeader('content-type', 'text/html; charset=utf-8');
      if (q('vorm') === 'oud') return res.status(200).send(D.dashHtml(d, melding, D.isAi(aiQ) ? aiQ : aiC)); // het vorige dashboard: leerprompt wijzigen, skills, archief
      // het ene overzicht met de takenlijst (Henkjan 27 nov 2026: "Ja" op het ontwerp); melding na een tik op de pagina
      const MELD = { taak: 'Staat in je lijst. Een agent pakt het op.', antw: 'Je antwoord is doorgegeven.', weg1: 'Weggehaald.', terug: 'Teruggezet.', gewoon: 'Aangepast.', terugdraai: 'Staat in je lijst: een agent draait het terug.', code: 'Code gestuurd naar je Telegram. Vul hem hieronder in.', gekoppeld: 'Dit toestel is gekoppeld. Je kunt nu antwoorden.' }; let meld = null;
      if (melding) meld = { tekst: melding.tekst, link: melding.terug ? '/dashboard?terug=' + encodeURIComponent(melding.terug) : '', linkTekst: 'Zet terug' };
      else if (q('f')) meld = { tekst: 'Niet gelukt: ' + String(q('f')).slice(0, 200) };
      else if (q('m') === 'weg') { const ids = String(q('ids') || '').split(',').filter(Boolean).slice(0, 80); meld = { tekst: ids.length + ' opgeruimd.', terug: ids }; }
      else if (MELD[q('m')]) meld = { tekst: MELD[q('m')] };
      const tidG = (String(req.headers.cookie || '').match(/(?:^|; )dashhj=([a-f0-9]+)/) || [])[1] || '';
      const O = await import('../lib/overzicht.js'); return res.status(200).send(O.overzichtHtml(d, { ai: D.isAi(aiQ) ? aiQ : aiC, melding: meld, toestel: await T.toestelOk(kv, tidG), codeVeld: q('m') === 'code' || q('k') === '1' })); }
    if (op === 'overdracht') { // levende overdracht voor andere chats (Todayin-chat, Yoors Shop-chat): elke keer opnieuw opgebouwd uit de live instellingen en cijfers
      if (!beschermd(req)) return res.status(403).send('alleen via de beschermde vercel.app-host');
      const t = await overdracht(kv, { project: q('project') || '' }); res.setHeader('content-type', 'text/plain; charset=utf-8'); res.setHeader('cache-control', 'no-store'); return res.status(200).send(t); }
    if (op === 'tiproef') { // bereikbaarheid van het todayin-formulier vanaf de server, zonder iemand aan te melden (ongeldig adres)
      if (!beschermd(req)) return res.status(403).json({ ok: false });
      const r = await fetch((process.env.TODAYIN_URL || 'https://todayin.email') + '/api/ti', { method: 'POST', body: new URLSearchParams({ email: 'geen-adres', src: 'clickmind', ts: '5000', website: '' }), headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': 'Clickmind/1 (+https://whichtobuy.best)' }, redirect: 'manual' }).catch(e => ({ status: 0, text: async () => String(e && e.message || e) }));
      const h = await r.text().catch(() => ''); return res.status(200).json({ ok: true, status: r.status, bereikbaar: r.status === 400 && /does not look right/i.test(h), begin: h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 200) }); }
    if (op === 'modalknop') return modalKnop(req, res, q); // 5 nov: Henkjans eigen schakelaar (beschermde host)
    // ---- de lerende motor (lib/modalmotor.js, 25 nov 2026): modal + aanmelding + voorkeurencentrum + antwoordmotor per project ----
    if (op === 'motorin') { // Resend-webhook email.received (alle projecten; de motor kiest het project op het ontvangende domein)
      if (req.method !== 'POST') return res.status(405).end(); const MT = await import('../lib/modalmotor.js');
      const r = await MT.mailIn(leesJson(req.body) || {}).catch(e => ({ ok: false, fout: String(e && e.message || e).slice(0, 120) })); return res.status(200).json(r); }
    if (op === 'motorstand') { // controle: werkt het? (vertoningen, aanmeldingen, bevestigd, antwoorden, lekken met drempel). Openbaar alleen oordeel en totalen.
      res.setHeader('cache-control', 'no-store'); const MT = await import('../lib/modalmotor.js'); const st = await MT.stand(q('p') || 'kadoly');
      if (beschermd(req)) { if (q('vorm') === 'tekst') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(motorTekst(st)); } return res.status(200).json(st); }
      return res.status(st.ok ? 200 : 404).json({ ok: st.ok, project: st.project, oordeel: st.oordeel, lekken: (st.lekken || []).length, sites: (st.sites || []).map(x => ({ site: x.site, aan: x.aan, getoond: x.getoond, aanmeldingen: x.aanmeldingen, bevestigd: x.bevestigd })), volgendeOordeel: st.volgendeOordeel }); }
    if (op === 'motor') { // pagina's voor projecten zonder eigen site-route: ?p=<project>&stap=bevestig|voorkeur|af&t=<token>
      res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex'); res.setHeader('content-type', 'text/html; charset=utf-8');
      const MT = await import('../lib/modalmotor.js'); const cfg = await MT.project(q('p')); if (!cfg) return res.status(404).send('Niet gevonden');
      const t = String(q('t') || ''), stap = String(q('stap') || ''), pag = (c, ti, inh) => res.status(c).send(MT.paginaHtml(cfg, ti, '<div class="mv">' + inh + '</div>'));
      const body = req.method === 'POST' ? (typeof req.body === 'object' && req.body ? req.body : Object.fromEntries(new URLSearchParams(String(req.body || '')))) : {};
      if (stap === 'bevestig') { if (req.method === 'POST') { const s0 = await MT.bevestig(cfg.id, t); if (!s0) return pag(400, 'Link verlopen', '<h1>Deze link werkt niet meer</h1>'); return pag(200, 'Aangemeld', '<h1>' + (s0.al ? 'Je was al aangemeld' : 'Gelukt, je bent aangemeld') + '</h1><p><a href="' + cfg.paden.voorkeur + '&t=' + s0.vt + '">Kies hoe vaak en waarover</a></p>'); }
        const p0 = await MT.bevestigOpen(cfg.id, t); if (!p0) return pag(400, 'Link verlopen', '<h1>Deze link werkt niet meer</h1>'); return pag(200, 'Bevestig', '<h1>Nog één klik</h1><form method="post"><button class="mv-k" type="submit">Ja, meld me aan</button></form>'); }
      if (stap === 'af') { if (req.method === 'POST' && q('weer') !== '1') { await MT.afmelden(cfg.id, t); res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send('Afgemeld'); } const s0 = await MT.afmelden(cfg.id, t, req.method === 'POST'); if (!s0) return pag(400, 'Link werkt niet', '<h1>Deze afmeldlink werkt niet</h1>'); return pag(200, 'Afgemeld', s0.actief ? '<h1>Je bent weer aangemeld</h1>' : '<h1>Je bent afgemeld</h1><form method="post" action="?p=' + cfg.id + '&stap=af&weer=1&t=' + t + '"><button class="mv-k" type="submit">Toch weer aanmelden</button></form>'); }
      if (stap === 'voorkeur') { const r = req.method === 'POST' ? await MT.voorkeurZet(cfg.id, t, body) : await MT.voorkeurLees(cfg.id, t); if (!r) return pag(400, 'Link werkt niet', '<h1>Deze link werkt niet</h1>'); return res.status(200).send(MT.paginaHtml(cfg, 'Jouw mail', MT.voorkeurHtml(r.cfg, r.s, t, { opgeslagen: !!r.opgeslagen || !!r.af }))); }
      return res.status(404).send('Niet gevonden'); }
    if (op === 'motorbeheer') { // beschermde host: sjablonen naar kv, ontvangen aanzetten, beloftes waar/uit, kerstdag, nieuw project, testmail
      res.setHeader('cache-control', 'no-store'); if (!beschermd(req)) return res.status(403).json({ ok: false, fout: 'alleen via de beschermde vercel.app-host' });
      const MT = await import('../lib/modalmotor.js'), p = String(q('p') || 'kadoly').toLowerCase();
      if (q('cfg')) return res.status(200).json(await MT.zetProject(p, leesJson(q('cfg'))));
      if (q('zet') === '1') return res.status(200).json(await MT.zetModals(p));
      if (q('ontvang') === '1') return res.status(200).json(await MT.ontvangAan(p, q('haak') || undefined));
      if (q('waar') && /^[a-z0-9-]{2,20}$/.test(q('waar'))) { const v = Number(q('v')); if (![1, 0, -1].includes(v)) return res.status(400).json({ ok: false, fout: 'v=1 (waar), 0 (automatisch) of -1 (uit)' }); await kv.set('mm:motor:' + p + ':waar:' + q('waar'), v); if (q('tekst')) await kv.set('mm:motor:' + p + ':verzendtekst', String(q('tekst')).slice(0, 300)); return res.status(200).json({ ok: true, belofte: q('waar'), v, waar: await MT.waarStand(kv) }); }
      if (q('kerstdag')) { if (!/^\d{4}-\d{2}-\d{2}$/.test(q('kerstdag')) && q('kerstdag') !== 'auto') return res.status(400).json({ ok: false }); if (q('kerstdag') === 'auto') await kv.del(['mm:motor:' + p + ':kerstdag']); else await kv.set('mm:motor:' + p + ':kerstdag', q('kerstdag')); const cfg = await MT.project(p); return res.status(200).json({ ok: true, kerst: await MT.kerstDag(cfg) }); }
      if (q('ronde') === '1') return res.status(200).json(await MT.dagRonde(p, { droog: q('droog') !== '0' }));
      if (q('pushsw')) { const [hh, pad] = String(q('pushsw')).split(':'); return res.status(200).json(await zetPushSw(kv, hh, pad || '')); } // ?pushsw=kadoly.com:/sw.js zet push aan op een host met onze service worker, ?pushsw=kadoly.com zet hem uit
      return res.status(200).json({ ok: true, project: await MT.project(p), waar: await MT.waarStand(kv), stand: await MT.stand(p) }); }
    if (op === 'modalbeheer') {
      res.setHeader('cache-control', 'no-store');
      if (!beschermd(req)) return res.status(403).json({ ok: false, fout: 'alleen via de beschermde vercel.app-host' });
      if (q('catalogus')) { if (q('j')) { const r = await bewaarCatalogus(kv, JSON.parse(q('j'))); return res.status(r.ok ? 200 : 400).json(r); } return res.status(200).json({ catalogus: await catalogus(kv) }); }
      if (q('j') || req.method === 'POST') { const j = req.method === 'POST' ? leesJson(req.body) : leesJson(q('j')); const r = await bewaarModal(kv, j); return res.status(r.ok ? 200 : 400).json(q('stil') ? { ok: r.ok, fout: r.fout, versie: r.modal && r.modal.versie, armen: r.modal && (r.modal.armen || []).map(x => x.id + ':' + x.wie) } : r); } // stil=1: kort antwoord
      if (q('alias')) { const r = await zetModalAlias(kv, q('alias'), q('naar') || ''); return res.status(r.ok ? 200 : 400).json(r); } // ?alias=yoors&naar=kadoly (leeg naar = weg)
      if (q('site') && (q('aan') === '1' || q('aan') === '0')) { const m = await kv.get('mm:modal:' + String(q('site')).toLowerCase()); if (!m) return res.status(404).json({ ok: false, fout: 'onbekende site' }); const { model, leer, momLeer, vormLeer, varLeer, rem, ...rest } = m; const r = await bewaarModal(kv, { ...rest, uit: q('aan') !== '1' }); return res.status(r.ok ? 200 : 400).json({ ok: r.ok, site: m.site, uit: r.modal && r.modal.uit, fout: r.fout }); } // 5 nov: aan of uit in één tik
      if (q('site') && q('domein')) { const m = await kv.get('mm:modal:' + String(q('site')).toLowerCase()); if (!m) return res.status(404).json({ ok: false, fout: 'onbekende site' }); const { model, leer, momLeer, vormLeer, varLeer, rem, ...rest } = m; const d = String(q('domein')).toLowerCase().trim(); const r = await bewaarModal(kv, { ...rest, domeinen: [...new Set([d, ...(m.domeinen || [])])].slice(0, 6) }); return res.status(r.ok ? 200 : 400).json({ ok: r.ok, site: m.site, domeinen: r.modal && r.modal.domeinen, uit: r.modal && r.modal.uit, fout: r.fout }); } // 25 nov: domein erbij zonder de hele instelling te sturen (You and AI naar youandai.now)
      if (q('mail')) {
        const lijst = String(q('mail')).toLowerCase().replace(/[^a-z0-9-]/g, ''), h = await kv.raw(['HGETALL', 'mm:mail:' + lijst]);
        const rijen = []; if (Array.isArray(h)) { for (let i = 0; i + 1 < h.length; i += 2) rijen.push([String(h[i]), leesJson(h[i + 1]) || {}]); } else for (const [a, b] of Object.entries(h || {})) rijen.push([a, leesJson(b) || {}]);
        if (q('formaat') !== 'csv') return res.status(200).json({ lijst, aantal: rijen.length });
        const qq = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
        res.setHeader('content-type', 'text/csv; charset=utf-8'); res.setHeader('content-disposition', 'attachment; filename="lijst-' + lijst + '.csv"');
        return res.status(200).send(['email,datum,site,arm,netwerk,zone,campagne,land,toestemming,bevestigd'].concat(rijen.map(([e, x]) => [e, x.t, x.site, x.arm, x.net, x.zone, x.camp, x.land, x.toestemming, x.bevestigd ? 'ja' : 'nee'].map(qq).join(','))).join('\n'));
      }
      if (q('site')) { const m = await leesModal(kv, q('site'), true); if (!m) return res.status(404).json({ ok: false, fout: 'onbekende site' }); const st = await modalStand(kv, m, Number(q('dagen')) || 14);
        if (q('kort') === '1') { // kort (17 nov 2026): alleen de tellers, voor het uurrapport zonder het hele model
          const k = x => ({ n: x.n, toon: x.toon, klik: x.klik, aanmelding: x.aanmelding }), rij = (l, s) => (l || []).filter(x => x.n).map(x => ({ [s]: x[s], ...k(x) }));
          return res.status(200).json({ site: m.site, uit: !!m.uit, armen: [...st].filter(x => x.n).map(x => ({ id: x.id, ...k(x), hoofdTegenControle: x.hoofdTegenControle })), momenten: rij(st.momenten, 'moment'), vormen: rij(st.vormen, 'vorm'), stijlen: rij(st.stijlen, 'stijl'), varianten: Object.fromEntries(Object.entries(st.varianten || {}).map(([a, l]) => [a, (l || []).filter(v => v.n).map(v => ({ vid: v.vid, titel: v.titel, ...k(v) }))]).filter(([, l]) => l.length)) });
        }
        return res.status(200).json({ modal: m, stand: [...st], momenten: st.momenten, vormen: st.vormen, stijlen: st.stijlen, sluiten: st.sluiten, varianten: st.varianten, script: '<script src="https://whichtobuy.best/cm.js" data-site="' + m.site + '" async></script>', scriptEigenDomein: '<script src="https://go.<eigen domein>/cm.js" data-site="<meetsite>" data-modal="' + m.site + '" async></script>' }); }
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
      try { const L = await lookalike(kv, { project, land }); try { await kv.set(ck, L, { ex: 2 * 86400 }); } catch (e) {} return res.status(200).json(L); } catch (e) { return res.status(oud ? 200 : 500).json(oud || { ok: false, fout: String(e && e.message || e).slice(0, 200) }); }
    }
    // verkenner: voorstel voor de witte lijst van de vaste verkenningscampagne (uitvoerder: propellerads-mcp app/api/verken)
    if (op === 'verken') { res.setHeader('cache-control', 'no-store'); cors(res); const { verkenVoorstel } = await import('../lib/lookalike.js'); try { return res.status(200).json(await verkenVoorstel(kv, String(q('sleutel') || 'todayin-us'))); } catch (e) { return res.status(500).json({ ok: false, fout: String(e && e.message || e).slice(0, 200) }); } }
    // bewezen zones per verkenner (13 nov 2026, 80/20): lijsten voor de aparte BEWEZEN-campagnes; openbaar zoals lookalike (zone-nummers,
    // aantallen, kosten); 30 minuten in de cache, ?vers=1 rekent opnieuw, ?sleutel=<verkenner> alleen die
    if (op === 'bewezen') { res.setHeader('cache-control', 'no-store'); cors(res); const { bewezenVoorstellen } = await import('../lib/lookalike.js'); try { const sl = q('sleutel') ? String(q('sleutel')).split(',').map(s => s.replace(/[^a-z0-9-]/g, '')).filter(Boolean).slice(0, 20) : null; return res.status(200).json(await bewezenVoorstellen(kv, { sleutels: sl, vers: q('vers') === '1' })); } catch (e) { return res.status(500).json({ ok: false, fout: String(e && e.message || e).slice(0, 200) }); } }
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
    if (op === 'dbwacht') { // databasewacht (lib/dbwacht.js, Henkjan 29 okt: "Zorg dat dit niet meer volloopt"): openbaar lezen, opruimen alleen cron of beschermde host
      res.setHeader('cache-control', 'no-store');
      const { dbWacht, dbGebruik, K_DBWACHT } = await import('../lib/dbwacht.js');
      const isCron = (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET) || /vercel-cron/i.test(String(req.headers['user-agent'] || ''));
      if (!isCron && !beschermd(req)) return res.status(200).json({ ok: true, nu: await dbGebruik(kv), laatst: await kv.get(K_DBWACHT).catch(() => null) });
      const { logBij } = await import('../lib/handover.js');
      return res.status(200).json(await dbWacht(kv, { log: u => logBij(kv, { wie: 'dbwacht', tekst: (u.alarm ? 'ALARM database nog ' : 'database ') + u.voorPct + '% -> ' + u.naPct + '% (' + u.usedMB + ' van ' + u.maxMB + ' MB): ' + u.stappen.map(x => x.stap + ' ' + (x.weg || 0)).join(', ') }) }));
    }
    if (op === 'wachtuur') {
      res.setHeader('cache-control', 'no-store');
      const isCron = (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET) || /vercel-cron/i.test(String(req.headers['user-agent'] || ''));
      if (!isCron && !beschermd(req)) return res.status(403).json({ ok: false, fout: 'alleen cron of de beschermde vercel.app-host' });
      // Kadoly-lekketen van gisteren eenmaal per dag naar Nexy rond 07:00 NL (29 okt; alleen als NEXY_WEBHOOK_URL bestaat)
      if (new Date().getUTCHours() >= 6) { try { const { naarNexy } = await import('../lib/shopketen.js'); await naarNexy(kv, new Date(Date.now() - 86400e3).toISOString().slice(0, 10)); } catch (e) {} }
      // databasewacht eerst (29 okt): een volle database laat alle andere metingen mislukken
      try { const { dbWacht } = await import('../lib/dbwacht.js'); const { logBij } = await import('../lib/handover.js'); await dbWacht(kv, { tijd: 25000, log: u => logBij(kv, { wie: 'dbwacht', tekst: (u.alarm ? 'ALARM database nog ' : 'database ') + u.voorPct + '% -> ' + u.naPct + '% (' + u.usedMB + ' van ' + u.maxMB + ' MB): ' + u.stappen.map(x => x.stap + ' ' + (x.weg || 0)).join(', ') }) }); } catch (e) { console.log('dbwacht fout', String(e && e.message || e)); }
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
      if (op === 'ruwstand' && q('producten') === '1') { const { shcProducten } = await import('../lib/shcarchief.js'); return res.status(200).json(await shcProducten({ dagen: Number(q('dagen')) || 14 })); }
      if (op === 'ruwstand' && q('totaal') === '1') { const { shcTotaal } = await import('../lib/shcarchief.js'); return res.status(200).json(await shcTotaal()); }
      if (op === 'ruwstand') { const { shcStand } = await import('../lib/shcarchief.js'); return res.status(200).json({ ...(await archiefStand(kv, { dagen: Number(q('dagen')) || 3 })), shopKliks: await shcStand().catch(e => ({ fout: String(e.message || e).slice(0, 200) })) }); }
      // 5 nov (Henkjan: "We mogen geen data kruimel verliezen"): om 04 UTC (of met ?shc=1) de kliksporen van de shop naar Blob, de laatste 7 dagen (?dagen= tot 31)
      if (q('shc') === '1' || (isCron && new Date().getUTCHours() === 4)) { const { shcArchief } = await import('../lib/shcarchief.js'); const r = await shcArchief(kv, { dagen: Number(q('dagen')) || 7 }); return res.status(r.ok ? 200 : 500).json(r); }
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
    // terugbetaling zelf indienen (lib/terugauto.js, 13 nov): ?dag=&droog=1 rekent alleen; terugingediend markeert wat met de hand ging; resenddomeinen toont de afzenders
    if (op === 'terugindien' || op === 'terugingediend' || op === 'resenddomeinen') {
      res.setHeader('cache-control', 'no-store');
      const isCron = (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET);
      if (!isCron && !beschermd(req)) return res.status(403).json({ ok: false, fout: 'alleen de beschermde vercel.app-host' });
      const TA = await import('../lib/terugauto.js');
      if (op === 'resenddomeinen') return res.status(200).json(await TA.resendDomeinen(kv));
      if (op === 'terugingediend') return res.status(200).json(await TA.markeerIngediend(kv, { net: netNaam(q('net') || 'propeller'), dag: q('dag'), via: q('via') || 'hand', sterk: q('sterk') ? Number(q('sterk')) : null }));
      return res.status(200).json(await TA.indienAuto(kv, { net: netNaam(q('net') || 'propeller'), dag: q('dag'), droog: q('droog') === '1', opnieuw: q('opnieuw') === '1' }));
    }
    if (op === 'terugdag') {
      res.setHeader('cache-control', 'no-store');
      const isCron = (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET) || /vercel-cron/i.test(String(req.headers['user-agent'] || ''));
      if (!isCron && !beschermd(req)) return res.status(403).json({ ok: false, fout: 'alleen cron of de beschermde vercel.app-host' });
      return res.status(200).json(await dagDossiers(kv));
    }
    if (['wissel', 'amazon', 'amazonmeter', 'venster', 'geheugen', 'geheugenvol', 'opruim', 'opruimpersonen', 'opruimcid', 'termen', 'mdgo', 'mdpauze', 'gosplit', 'instelling', 'overzicht', 'clickmind', 'terugbetaling', 'voorspel', 'voorspelruw', 'mensgeld', 'overlap', 'retarget', 'ctrtest', 'zonetag', 'cc', 'ccdag'].includes(op)) {
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
      // 29 okt: advertentielessen per bron (nu bzz): wat zat er in elke advertentie en wat deed het; voor de volgende campagnes.
      if (op === 'advles') { const b = String(q('bron') || 'bzz').replace(/[^a-z]/g, '').slice(0, 20); const dg = /^\d{4}-\d{2}-\d{2}$/.test(String(q('dag') || '')) ? ':' + q('dag') : ''; const v = await kv.raw(['GET', 'mm:adv:' + b + dg]).catch(() => null); return res.status(200).json(v ? JSON.parse(v) : { advertenties: [], uitleg: 'nog niets opgehaald; de leerronde haalt elk uur' }); }
      if (op === 'termen') { const T = await import('../lib/termles.js'); if (q('k')) return res.status(200).json(await T.termPrijs(q('k'), q('m') || '')); if (q('tag')) return res.status(200).json(await T.tagGeenKoper(kv, q('tag'), { dagen: Number(q('dagen')) || 3 })); return res.status(200).json({ ok: true, lessen: T.LESSEN, grenzen: T.GRENS, verzadiging: await T.verzadiging(kv, { dag: q('dag') }) }); }
      // voorspellers (lib/voorspel.js): welke kenmerken van een klik voorspellen wat hij doet; voorspelruw vult dagen vóór de live tellers aan uit de ruwe log
      if (op === 'zonetag') { const m = await import('../lib/zonetag.js'); const j = q('j'); if (j) { let x = null; try { x = JSON.parse(j); } catch (e) { return res.status(400).json({ ok: false, fout: 'j moet JSON zijn' }); } return res.status(200).json(await m.zetZoneTag(kv, x)); } return res.status(200).json({ ok: true, zonetag: await m.leesZoneTag(kv, true) }); }
      if (op === 'ctrtest') { const m = await import('../lib/ctrtest.js'); const j = q('j'); if (j) { let x = null; try { x = JSON.parse(j); } catch (e) { return res.status(400).json({ ok: false, fout: 'j moet JSON zijn' }); } return res.status(200).json(await m.zetTest(kv, x)); } let pa = null; if (q('pa')) { try { pa = JSON.parse(q('pa')); } catch (e) {} } return res.status(200).json(await m.testStand(kv, q('naam'), { dagen: q('dagen') || 7, pa })); }
      if (op === 'retarget') { const j = q('j'); if (j) { let x = null; try { x = JSON.parse(j); } catch (e) { return res.status(400).json({ ok: false, fout: 'j moet JSON zijn' }); } return res.status(200).json(await zetRt(kv, x)); } return res.status(200).json(await rtStand(kv, { dagen: q('dagen') || 14 })); }
      if (op === 'mensgeld') { const { mensgeld } = await import('../lib/mensgeld.js'); return res.status(200).json(await mensgeld(kv, { dag: q('dag') })); }
      if (op === 'overlap') { const { termOverlap } = await import('../lib/mensgeld.js'); return res.status(200).json(await termOverlap(kv, { dagen: q('dagen') || 3, min: Number(q('min')) || 5 })); }
      if (op === 'voorspel') { const { voorspel } = await import('../lib/voorspel.js'); return res.status(200).json(await voorspel(kv, { dagen: q('dagen') || 7, min: Number(q('min')) || 30, bron: String(q('bron') || '').replace(/[^a-z]/g, '').slice(0, 10), uit: String(q('uit') || '').replace(/[^a-z]/g, '').slice(0, 12), n: Number(q('n')) || 40 })); }
      if (op === 'voorspelruw') { const { voorspelRuw } = await import('../lib/voorspel.js'); const r = await voorspelRuw(kv, q('dag'), { opnieuw: q('opnieuw') === '1' }); return res.status(r.ok ? 200 : 400).json(r); }
      if (op === 'geheugenvol') { const { geheugenVol } = await import('../lib/dbgeheugen.js'); return res.status(200).json(await geheugenVol(kv, { cursor: String(q('cursor') || '0') })); }
      if (op === 'opruimpersonen') { const { opruimPersonen } = await import('../lib/dbgeheugen.js'); return res.status(200).json(await opruimPersonen(kv, { echt: q('echt') === '1', cursor: String(q('cursor') || '0'), dagen: Number(q('dagen')) || 14 })); }
      if (op === 'opruimcid') { const { opruimCid } = await import('../lib/dbgeheugen.js'); return res.status(200).json(await opruimCid(kv, { echt: q('echt') === '1', cursor: String(q('cursor') || '0'), dagen: Number(q('dagen')) || 7 })); }
      if (op === 'opruim') { const { opruim } = await import('../lib/dbgeheugen.js'); return res.status(200).json(await opruim(kv, { match: String(q('match') || '').slice(0, 80), echt: q('echt') === '1', ttlDagen: Number(q('ttl')) || 0, zonderTtl: q('zonderttl') === '1', ouderDan: String(q('ouderdan') || '').slice(0, 10), cursor: String(q('cursor') || '0') })); }
      if (op === 'geheugen') { const { geheugenPerGroep, geheugenPatroon } = await import('../lib/dbgeheugen.js'); const m = String(q('match') || ''); return res.status(200).json(m ? await geheugenPatroon(kv, { match: m.slice(0, 60) }) : await geheugenPerGroep(kv, { alle: q('alle') === '1' })); }
      if (op === 'venster') { const { vensterPerZone } = await import('../lib/venster.js'); const r = await vensterPerZone(kv, { dag: q('dag') || new Date().toISOString().slice(0, 10), min: Number(q('min')) || 10 }); return res.status(r.ok ? 200 : 400).json(r); }
      if (op === 'amazonmeter') { const { amazonMeter } = await import('../lib/amzmeter.js'); const r = await amazonMeter(kv, { dag: q('dag'), tz: q('tz') || undefined }); return res.status(r.ok ? 200 : 400).json(r); }
      if (op === 'amzzone') { const r = await (await import('../lib/uitkomstterug.js')).amazonNaarZone(kv, { dag: q('dag') || new Date(Date.now() - 864e5).toISOString().slice(0, 10) }); return res.status(r.ok ? 200 : 400).json(r); } // Amazon per tag naar de zones van een dag opnieuw uitrekenen (schrijft per zone, dus herhalen is veilig)
      if (op === 'amazon') {
        // hele dagronde in één keer: POST { dag, bron, rijen: [{tag, kliks, artikelen, omzet, verdiend}] }
        if (req.method === 'POST') {
          const b = leesJson(req.body) || {}; if (!Array.isArray(b.rijen)) return res.status(400).json({ ok: false, fout: 'body { dag, rijen: [{tag,kliks,artikelen,omzet}] }' });
          const uit = []; for (const r of b.rijen.slice(0, 60)) uit.push(await amazonUitkomst(kv, { dag: b.dag, bron: b.bron, ...r }));
          const zone = uit.some(x => x.ok) ? await (await import('../lib/uitkomstterug.js')).amazonNaarZone(kv, { dag: b.dag }).catch(e => ({ ok: false, fout: String(e && e.message || e).slice(0, 100) })) : null; // 28 nov 2026: de artikelen per tag ook naar de zones (zwak bewijs, alleen binnen Clickmind)
          return res.status(200).json({ ok: uit.every(x => x.ok), dag: b.dag, rijen: uit, ...(zone ? { zones: zone } : {}) });
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
        const d = await dossier(kv, { net: netNaam(q('net') || 'propeller'), van: q('van'), tot: q('tot'), maxRijen: Math.max(1, Math.min(20000, Number(q('max')) || 5000)) }); // max= tot 20.000 rijen (13 nov: 12 nov had ~7.000 verdachte kliks)
        if (q('formaat') === 'csv') { res.setHeader('content-type', 'text/csv; charset=utf-8'); res.setHeader('content-disposition', 'attachment; filename="terugbetaling-' + d.netwerk + '-' + d.van + '_' + d.tot + '.csv"'); return res.status(200).send(naarCsv(d)); }
        return res.status(200).json(d);
      }
    }
    if (op === 'uurritme') { res.setHeader('cache-control', 'no-store'); return res.status(200).json(Object.assign({ ok: true }, await ritme(kv, { net: netNaam(q('net') || 'propeller'), camps: String(q('camps') || '').split(',').map(x => x.trim()).filter(x => /^[A-Za-z0-9_.:-]{1,40}$/.test(x)).slice(0, 300), tz: String(q('tz') || 'Europe/Amsterdam').slice(0, 40) }))); } // openbaar, alleen tellers: welk uur koopt minder in (lib/uurritme.js)
    // 13 nov: de volledige zonelijsten zijn het betaalde deel van Clickmind Zone Score; alleen op de beschermde host of met de gedeelde sleutel
    if ((op === 'zones' || op === 'patronen') && !beschermd(req) && !(process.env.SHOP_SLEUTEL && req.headers['x-shop-sleutel'] === process.env.SHOP_SLEUTEL)) return res.status(403).json({ ok: false, fout: 'alleen de beschermde host; gratis zone-check: https://whichtobuy.best/zone-score' });
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
      verwerkKlik(kv, { cid, pid, nieuw, arm, tag, net: q('n'), camp: q('c'), zone: q('z'), sub: q('s'), cr: q('b'), kw: kEff || q('a') || '', doel, p: pre, q: netQ(q) }, serverSignalen(req)),
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
  const variant = (arm.soort === 'amazon' || arm.soort === 'url') && arm.variant === 'js' ? 'js' : '302'; // url-arm met variant js: KDP-boeken (5 nov 2026)
  const prefetch = /prefetch|prerender/i.test(String(req.headers['sec-purpose'] || req.headers.purpose || ''));
  if ((req.method === 'GET' || req.method === 'HEAD') && !prefetch) {
    const werk = laterAf(Promise.all([
      verwerkKlik(kv, { cid, pid, nieuw, arm: variant, tag: arm.tag || arm.id, net: q('n'), camp: q('c'), zone: q('z'), sub: q('s'), cr: q('b'), kw: arm.k || arm.a || arm.id, doel, p: (arm.p || w.naam), q: netQ(q), w: w.naam }, srv), /* w: product voor het zoneprofiel per segment (lib/segment.js) */
      wisselKlik(kv, w, keuze, ctx)
    ]).catch(e => { console.log('mm wissel fout', String(e && e.message || e)); }));
    await Promise.race([werk, new Promise(r => setTimeout(r, 300))]);
  }
  if (variant === '302' || req.method === 'HEAD') { res.statusCode = 302; res.setHeader('location', doel); return res.end(); }
  res.setHeader('content-type', 'text/html; charset=utf-8');
  const mctx = { cid, pid, net: ctx.net, zone: ctx.zone, camp: ctx.camp, arm: 'js', tag: arm.tag || arm.id, cr: ctx.cr };
  // Clickmind-publiek op de meetpagina, zoals bij /go: alleen een bewezen mens, geen datacenter of bot; project uit de arm (rt), anders amazon
  try { const rc = await leesRt(kv); if (rc.aan && rc.go && !prefetch) { const dd = dcVan(srv); const mens = soortPersoon(persoonNu).has('mens'); const sc = score({ c: null, s: Object.assign({}, srv, dd) }); const uit = leesCookie(req, 'mmrt') === 'uit' || !!(await kv.get('mm:rtuit:' + pid).catch(() => null)); const r = await rtBeslis(kv, { bron: 'go', project: arm.rt, land: srv.land, dc: dd.dc === true, bot: !!(sc.vlag && sc.vlag.hl), gpc: req.headers['sec-gpc'] === '1', uit, mens, id: pid, browsercheck: arm.soort === 'url' }); if (r.px && r.px.length) { mctx.rt = r.px; if (!mens) mctx.rtb = 1; } } } catch (e) {}
  return res.status(200).send(meetPagina(doel, mctx));
}

// Script voor bestemmingen (spel, todayin, finds, MYLEVEL): onthoudt de klik-id (mmc) en meldt een uitkomst met mmUitkomst('aanmelding').
const MMU_JS = String.raw`/* clickmind uitkomst */(function(){var W=window,D=document;try{if(W.__cmU)return;W.__cmU=1;/* 5 nov: twee cm.js-regels op een pagina (oude whichtobuy-regel en go.kadoly.com) tellen maar één keer */var c='',u=new URL(location.href).searchParams.get('mmc')||'';
if(/^[0-9a-f]{8,24}$/.test(u)){c=u;try{sessionStorage.setItem('mmc',u);localStorage.setItem('mmc',u+'|'+Date.now())}catch(e){}}
if(!c){try{c=sessionStorage.getItem('mmc')||'';if(!c){var l=(localStorage.getItem('mmc')||'').split('|');if(l[0]&&Date.now()-Number(l[1]||0)<864e5)c=l[0]}}catch(e){}}
/* 25 nov (Henkjan: "Zorg dat je niets meer mist en altijd bron kan vinden"): op kadoly.com volgt Clickmind ELKE bezoeker. Eén id per toestel (cmv, 90 dagen), per nieuw bezoek de herkomst (verwijzer-host, landingspad, utm, klik-id's, laatste advertentieklik binnen 30 dagen) en bij het afrekenen alleen de sha256 van het e-mailadres. Zo vindt lib/herkomst.js de bron van elke bestelling, ook zonder kenmerk. */
if(/(^|\.)kadoly\.com$/.test(location.hostname)){try{var VB='https://whichtobuy.best/api/mm/bezoek',vz=function(o){try{var x=JSON.stringify(o);if(!(navigator.sendBeacon&&navigator.sendBeacon(VB,x))&&W.fetch)fetch(VB,{method:'POST',body:x,keepalive:true,mode:'no-cors'})}catch(e){}},vid=localStorage.getItem('cmv')||'';
if(!/^[0-9a-f]{16}$/.test(vid)){vid='';var ra=new Uint8Array(8);crypto.getRandomValues(ra);for(var ri=0;ri<8;ri++)vid+=('0'+ra[ri].toString(16)).slice(-2);localStorage.setItem('cmv',vid)}W.cmVid=vid;
var lc=(localStorage.getItem('mmc')||'').split('|'),lcc=lc[0]&&Date.now()-Number(lc[1]||0)<30*864e5?lc[0]:'';
var vr='';try{vr=D.referrer?new URL(D.referrer).hostname.toLowerCase():''}catch(e){}if(/(^|\.)kadoly\.com$/.test(vr))vr='';
var vp=new URL(location.href).searchParams,vt={l:location.pathname.slice(0,80)},vx=0;if(vr)vt.r=vr;['utm_source','utm_medium','utm_campaign','utm_content','gclid','gbraid','wbraid','srsltid','ttclid','fbclid','wacid','epik','msclkid','hj','mmc'].forEach(function(k){var v=vp.get(k);if(v){vt[k]=v.slice(0,120);vx=1}});
var vn=!sessionStorage.getItem('cmvs');sessionStorage.setItem('cmvs','1');if(vn||vr||vx)vz({v:vid,t:vt,c:lcc});
if(/\/checkout/.test(location.pathname)&&W.crypto&&crypto.subtle&&W.TextEncoder){var vem='',vh=function(){var e=D.getElementById('f-guest-email')||D.querySelector('input[type=email]'),m=e&&String(e.value||'').trim().toLowerCase();if(!m||!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(m)||m===vem)return;vem=m;crypto.subtle.digest('SHA-256',new TextEncoder().encode(m)).then(function(b){var h='',a=new Uint8Array(b);for(var i=0;i<a.length;i++)h+=('0'+a[i].toString(16)).slice(-2);vz({v:vid,em:h,c:lcc})})['catch'](function(){})};D.addEventListener('change',vh,true);D.addEventListener('focusout',vh,true);W.addEventListener('pagehide',vh)}
}catch(e){}}
var gehad={};W.mmUitkomst=function(soort,waarde){try{if(!c||gehad[soort])return;gehad[soort]=1;var x=JSON.stringify({cid:c,soort:soort,waarde:waarde||0,bron:location.host});
if(!(navigator.sendBeacon&&navigator.sendBeacon('https://whichtobuy.best/api/mm/uitkomst',x))&&W.fetch)fetch('https://whichtobuy.best/api/mm/uitkomst',{method:'POST',body:x,keepalive:true,mode:'no-cors'})}catch(e){}};
W.mmKlikId=c;
if(/(^|\.)kadoly\.com$/.test(location.hostname)){try{var dk=D.createElement('style');dk.textContent='[data-cm-zicht="drukte"]{display:none!important}'+
/* 12 nov (Henkjan: "Los op in je campagnes morgen"): op mobiel was Nu kopen de enige knop in beeld en stonden titel en prijs onder de vouw; mensen tikten om meer te zien en kregen een formulier. Nu: kleinere foto zonder strip, titel en prijs in beeld, koopbalk pas na de grote koopknop */
'@media (max-width:767px){html:not(.cmbb) .bb-sticky{display:none!important}.gal-strip{display:none!important}.gal-main img{max-height:30vh!important;object-fit:contain!important}}'+
/* afrekenen: de vaste betaalknop stond op de plek van Nu kopen (dubbele tik = rode e-mailfout); pas tonen als er een e-mailadres staat. Levertijd niet bovenaan, wel bij de bezorging */
'html:not(.cmpay) .co-sticky{display:none!important}#co-mini .cm-lev{display:none!important}';(D.head||D.documentElement).appendChild(dk)}catch(e){}
try{var bbz=function(){var b=D.getElementById('buy-btn');if(!b||!W.IntersectionObserver)return 0;new IntersectionObserver(function(es){es.forEach(function(x){D.documentElement.classList.toggle('cmbb',!x.isIntersecting&&x.boundingClientRect.top<0)})}).observe(b);return 1},nbz=0;if(!bbz()){var ibz=setInterval(function(){if(bbz()||++nbz>20)clearInterval(ibz)},500)}}catch(e){}
if(/\/checkout\//.test(location.pathname)){try{var cmp=function(){var e=D.getElementById('f-guest-email')||D.querySelector('input[type=email]');if(e&&/.+@.+\..+/.test(e.value))D.documentElement.classList.add('cmpay')},cml=function(){var m=D.getElementById('co-mini');if(!m||m.querySelector('.cm-lev'))return;var tw=D.createTreeWalker(m,4),n;while(n=tw.nextNode()){var i=n.nodeValue.search(/\s*\u00b7?\s*Thuisbezorgd in/);if(i>=0){var r=n.splitText(i),sp=D.createElement('span');sp.className='cm-lev';r.parentNode.insertBefore(sp,r);sp.appendChild(r);break}}};/* 12 nov (Henkjan: "Zoek uit wat hier mis gaat"): Orderchamp weigert bij het plaatsen ("Bestelling niet geplaatst: This item just sold out") terwijl de catalogus voorraad zei. Clickmind telt het (kuit), meldt het product (2 dagen uit campagnes, dagkeuze en gids) en zet de Engelse doodlopende melding om in Nederlands met een weg terug */var cmu=function(){if(W.__cmu)return;var b=D.querySelectorAll('div,p,span'),i,e,t;for(i=0;i<b.length;i++){e=b[i];if(e.children.length>2)continue;t=e.textContent||'';if(t.length>220||!/niet geplaatst/i.test(t))continue;W.__cmu=1;if(/sold out|uitverkocht|out of stock|no longer available/i.test(t)){var pp=(location.pathname.match(/\/checkout\/([\w~.-]+)/)||[])[1]||'';try{W.mmUitkomst('kuit')}catch(x){}try{fetch('https://whichtobuy.best/api/shop?op=uitverkocht&p='+encodeURIComponent(pp),{mode:'no-cors',keepalive:true})}catch(x){}e.innerHTML='<strong>Net uitverkocht bij de maker.</strong> De bestelling is niet geplaatst. <a href="/" style="font-weight:700;text-decoration:underline;color:inherit">Bekijk andere cadeaus</a>'}break}};D.addEventListener('click',function(){setTimeout(cmu,1500);setTimeout(cmu,4000);setTimeout(cmu,9000)},true);D.addEventListener('input',cmp,true);D.addEventListener('change',cmp,true);var ncm=0,icm=setInterval(function(){cmp();cml();cmu();if(++ncm>240)clearInterval(icm)},1000);cml()}catch(e){}}}
if(c&&/(^|\.)(yoo\.rs|yoors\.shop|kadoly\.com)$/.test(location.hostname)){W.mmUitkomst('geladen');var zt=0,z1=function(){if(zt||D.visibilityState!=='visible')return;zt=setTimeout(function(){if(D.visibilityState==='visible')W.mmUitkomst('zicht1');else zt=0},1000)};z1();D.addEventListener('visibilitychange',z1);
/* gedrag op de shop (Henkjan 21 okt: "Zorg dat clikmind alles meet"): tijd in beeld, scrollen, pagina's, winkelwagen, afrekenen, bundel, terugkomen */
var ss=function(k,v){try{if(v===undefined)return sessionStorage.getItem(k)||'';sessionStorage.setItem(k,v)}catch(e){return ''}};
if(!u&&!ss('mmc_s')){W.mmUitkomst('terug')}ss('mmc_s','1');
var np=Number(ss('mmnp'))+1;ss('mmnp',String(np));if(np>=2)W.mmUitkomst('p2');if(np>=4)W.mmUitkomst('p4');
var zs=function(v){try{var o=sessionStorage.getItem('cmSeg');if(o!=='heet')sessionStorage.setItem('cmSeg',v)}catch(e){}};
var pa=location.pathname.toLowerCase();if(/cart|winkelwagen|winkelmand|basket/.test(pa)){W.mmUitkomst('wpag');zs('warm')}if(/checkout|afreken|kassa|betal/.test(pa)){W.mmUitkomst('kpag');zs('heet')}
var acc=Number(ss('mmtz'))||0,vt=D.visibilityState==='visible'?Date.now():0,TT=[[5,'t5'],[15,'t15'],[30,'t30'],[60,'t60'],[180,'t180']],nu=function(){return acc+(vt?Date.now()-vt:0)};
var tk=function(){var n=nu();TT.forEach(function(x){if(n>=x[0]*1e3)W.mmUitkomst(x[1])});ss('mmtz',String(n));if(n>181e3)clearInterval(ti)},ti=setInterval(tk,1000);
D.addEventListener('visibilitychange',function(){if(D.visibilityState==='visible'){if(!vt)vt=Date.now()}else{if(vt){acc+=Date.now()-vt;vt=0}ss('mmtz',String(acc))}});
W.addEventListener('pagehide',function(){ss('mmtz',String(nu()))});
var sc=function(){var h=D.documentElement,m=h.scrollHeight-innerHeight;if(m<50)return;var p=(W.scrollY||h.scrollTop)/m;if(p>=.25)W.mmUitkomst('s25');if(p>=.5)W.mmUitkomst('s50');if(p>=.9)W.mmUitkomst('s90')};W.addEventListener('scroll',sc,{passive:true});
D.addEventListener('click',function(e){var dc=e.target&&e.target.closest&&e.target.closest('[data-cm]');if(dc)W.mmUitkomst(String(dc.getAttribute('data-cm')).slice(0,20));var g=e.target&&e.target.closest&&e.target.closest('img,picture,[class*=gal-],[class*=gallery],[class*=galerij],[class*=swiper],[class*=slide],[class*=lb-]');if(g&&!(g.closest&&g.closest('#bundle-card,[class*=ybun]')))W.mmUitkomst('fklik');var a=e.target&&e.target.closest&&e.target.closest('a,button,[role=button],input[type=submit],input[type=button]');if(!a)return;/* 14 nov: het winkelwagen-icoon bovenin (aria-label Winkelwagen, naar /cart) is geen mandje; In winkelwagen apart */if(a.tagName==='A'&&/(^|\/)cart\/?([?#]|$)/.test(a.getAttribute('href')||'')){W.mmUitkomst('wnav');return}if(a.id==='cart-add-btn')W.mmUitkomst('wkwag');var t=((a.innerText||a.value||'')+' '+(a.getAttribute('aria-label')||'')+' '+String(a.className||'')+' '+(a.id||'')+' '+(a.getAttribute('name')||'')+' '+(a.getAttribute('href')||'')).toLowerCase();
if(/btn-buy|buy-btn|sticky-buy|bundle-go|winkelwagen|winkelmand|in (de )?mand|add.?to.?cart|addtocart|bestel|kopen|koop nu/.test(t)){W.mmUitkomst('wklik');zs('warm')}if(/afreken|checkout|kassa|betalen/.test(t))W.mmUitkomst('kklik');if(/bundel|bundle|ybun/.test(t))W.mmUitkomst('bklik');
if(/bewaren|gal-save|save-btn|wishlist|favoriet/.test(t))W.mmUitkomst('bewaar');if(/vergelijk|compare|ycmp/.test(t))W.mmUitkomst('vergelijk');if(/share|delen/.test(t))W.mmUitkomst('deel');if(/ycp|chat|medewerker|vraag/.test(t))W.mmUitkomst('chat');if(/bb-var|variant|data-qty|bb-qty/.test(t+' '+(a.getAttribute('data-qty')!=null?'data-qty':'')))W.mmUitkomst('keuze')},true);
if(W.IntersectionObserver){var bo=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){W.mmUitkomst('bundel');bo.disconnect()}})},{threshold:.3}),zb=function(){var el=D.getElementById('bundle-card')||D.querySelector('[data-cm=bundel],[data-bundel],#bundel,#bundle,div[class*=bundel],div[class*=bundle]');if(el)bo.observe(el);return el},nb=0;if(!zb()){var ib=setInterval(function(){if(zb()||++nb>15)clearInterval(ib)},1000)};var zo=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){W.mmUitkomst(String(x.target.getAttribute('data-cm-zicht')).slice(0,20));zo.unobserve(x.target)}})},{threshold:.5}),gz=[],kz=function(){D.querySelectorAll('[data-cm-zicht]').forEach(function(el){if(gz.indexOf(el)<0){gz.push(el);zo.observe(el)}})},nz=0;kz();var iz=setInterval(function(){kz();if(++nz>20)clearInterval(iz)},1500)}
/* 14 nov (Henkjan: "Zoek dit nu uit ... waarom 16 van de 19 mandjes niet doorgingen naar de afrekenpagina"): op mobiel opent Nu kopen geen afrekenpagina maar een blad op de productpagina ("Waar mag het heen?": e-mail en adres, dan Verder naar betalen naar /checkout/?stap=2). Dat blad werd niet gemeten: open, e-mail, adres, Google, Verder, blijft hangen, dicht, weg */
try{var yb=D.getElementById('ybs');if(yb){var bto=0,bvd=0,bsec=function(){return bto?Math.round((Date.now()-bto)/1e3):0},bst=function(){var o=!yb.hidden;if(o&&!bto){bto=Date.now();bvd=0;W.mmUitkomst('bsopen')}else if(!o&&bto){if(!bvd)W.mmUitkomst('bsdicht',bsec());bto=0}};if(W.MutationObserver)new MutationObserver(bst).observe(yb,{attributes:true,attributeFilter:['hidden','class','style']});
yb.addEventListener('focusin',function(e){var t=e.target;if(!t||!/^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName))return;if(/mail/i.test((t.id||'')+' '+(t.name||'')+' '+(t.type||'')))W.mmUitkomst('bsmail');else W.mmUitkomst('bsadres')},true);
yb.addEventListener('click',function(e){var x=e.target;if(!x||!x.closest)return;if(x.closest('#ybs-next')){bvd=1;W.mmUitkomst('bsverder',bsec());setTimeout(function(){if(!yb.hidden&&D.visibilityState==='visible'){bvd=0;W.mmUitkomst('bsvast')}},4000)}else if(x.closest('#ybs-google'))W.mmUitkomst('bsgoogle')},true);
W.addEventListener('blur',function(){var f=D.activeElement;if(f&&f.tagName==='IFRAME'&&yb.contains(f))W.mmUitkomst('bsgoogle')});W.addEventListener('pagehide',function(){if(bto&&!bvd)W.mmUitkomst('bsweg',bsec())})}}catch(e){}
/* afrekenpagina (Henkjan 3 nov: "Ja daar maar Clickmind meten natuurlijk"): waar stoppen ze tussen afrekenpagina en betalen? tijd op de pagina, e-mailveld, adresvelden, betaalmethode, betaalknop in beeld, op betalen gedrukt, PayPal/Stripe-venster, formulierfout, weg zonder te betalen */
if(/\/checkout\/[\w~.-]+/.test(pa)){var kb=0,ks=function(s){W.mmUitkomst(s)};var kvz=0,kvt=D.visibilityState==='visible'?Date.now():0,kzt=function(){return kvz+(kvt?Date.now()-kvt:0)};D.addEventListener('visibilitychange',function(){if(D.visibilityState==='visible'){if(!kvt)kvt=Date.now()}else if(kvt){kvz+=Date.now()-kvt;kvt=0}});setTimeout(function(){if(D.visibilityState==='visible')ks('kt5')},5000);W.addEventListener('scroll',function(){var h=D.documentElement,m=h.scrollHeight-innerHeight;if(m>50&&(W.scrollY||h.scrollTop)/m>=.5)ks('kscroll')},{passive:true});D.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a,button');if(a&&/terug/i.test(a.innerText||''))ks('kterug')},true);setTimeout(function(){if(D.visibilityState==='visible')ks('kt20')},20000);setTimeout(function(){if(D.visibilityState==='visible')ks('kt60')},60000);
D.addEventListener('focusin',function(e){var t=e.target;if(!t||!t.tagName)return;var n=((t.name||'')+' '+(t.id||'')+' '+(t.type||'')+' '+(t.getAttribute&&t.getAttribute('autocomplete')||'')+' '+(t.placeholder||'')).toLowerCase();if(/mail/.test(n))ks('kmail');else if(/naam|name|straat|street|address|adres|postcode|postal|zip|plaats|city|huisnummer/.test(n))ks('kadres')},true);
D.addEventListener('change',function(e){var t=e.target;if(t&&(t.type==='radio'||t.tagName==='SELECT')){var n=((t.name||'')+' '+(t.value||'')+' '+(t.id||'')).toLowerCase();if(/pay|betaal|method|ideal|wero|paypal|card|kaart|klarna|bancontact|apple|google/.test(n))ks('kmeth')}},true);
D.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a,button,[role=button],input[type=submit],label,[data-method],[class*=pay-opt],[class*=method]');if(!a)return;var t=((a.innerText||a.value||'')+' '+(a.id||'')+' '+String(a.className||'')+' '+(a.getAttribute('data-method')||'')).toLowerCase();if(/ideal|wero|paypal|creditcard|betaalpas|klarna|bancontact|apple pay|google pay|andere betaal/.test(t)&&!/betalen\b|betaal\s*\u20ac/.test(t))ks('kmeth');if(a.tagName!=='LABEL'&&/betalen|betaal\s*\u20ac|pay now|bestelling plaatsen|place order/.test(t)&&!/snel afrekenen/.test(t)){kb=1;ks('kpay')}},true);
W.addEventListener('blur',function(){var f=D.activeElement;if(f&&f.tagName==='IFRAME'){var n=((f.src||'')+' '+(f.name||'')+' '+(f.title||'')).toLowerCase();if(/paypal/.test(n))ks('kpp');else if(/stripe|klarna/.test(n))ks('kmeth')}});
D.addEventListener('invalid',function(){ks('kfout')},true);W.addEventListener('pagehide',function(){if(!kb){ks('kweg');var z=kzt();ks(z<5000?'kweg5':z<20000?'kweg20':'kweglang')}});
var eur=function(t){var m=/(\d+)[.,](\d{2})/.exec(String(t||'').replace(/\s/g,''));return m?Number(m[1]+'.'+m[2]):0};setTimeout(function(){try{var tot=0,fee=0;[].slice.call(D.querySelectorAll('.sum-line,[class*=sum-total],[id*=total]')).forEach(function(r){var tx=(r.innerText||'');if(/totaal|total/i.test(tx))tot=eur(tx)||tot});var f=D.getElementById('sum-fee');if(f)fee=eur(f.innerText);if(tot)W.mmUitkomst('kprijs',tot);if(fee)W.mmUitkomst('kfee',fee)}catch(e){}},2500);
if(W.IntersectionObserver){var ko=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){ks('kknop');ko.disconnect()}})},{threshold:.6}),kn=0,kf=function(){var b=[].slice.call(D.querySelectorAll('button,input[type=submit],a[role=button]')).filter(function(x){return /betalen|betaal\s*\u20ac/i.test(x.innerText||x.value||'')&&x.offsetParent!==null})[0];if(b){ko.observe(b);return 1}};if(!kf()){var ki=setInterval(function(){if(kf()||++kn>20)clearInterval(ki)},1000)}}}
}
if(c&&!W.mmGeenAuto){var t0=Date.now(),ia=0,echt=function(){if(ia&&D.visibilityState==='visible'&&Date.now()-t0>=3000)W.mmUitkomst('echt')};
['pointerdown','touchstart','scroll','keydown'].forEach(function(e){D.addEventListener(e,function(){ia=1;echt()},{passive:true,capture:true})});setTimeout(echt,3100);
D.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[href],button,[role=button],input[type=submit]');if(a)W.mmUitkomst('actie')},true);
D.addEventListener('submit',function(e){var f=e.target,i=f&&f.querySelector&&f.querySelector('input[type=email],input[name*=mail]');if(i&&/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(i.value||'').trim()))W.mmUitkomst('aanmelding')},true)}
}catch(e){}})();`;

// De lerende modal in de browser (lib/modal.js): vraagt de server welke arm, meet de gewone klik naar buiten (ook bij de controlegroep),
// toont op het gekozen moment de gekozen vorm (midden, onder, hoek, balk, blok op een plek data-cm-plek, vol; schaduw-DOM, botst niet met
// de pagina), in de stijl van de site; sluiten met kruisje, 'nee', achtergrond of Escape. data-modal="<naam>" op de scriptregel kiest de
// modal-instelling (anders data-site). Meet ook veld, typ, hoe gesloten en, met toestemming, een gedragsrij; koop via data-cm-betaald.
const MMM_JS = String.raw`/* clickmind modal */(function(){var W=window,D=document,N=navigator;
function q(f){try{return f()}catch(e){return null}}
var PIJL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
try{if(W.mmModal)return;W.mmModal=1;if(N.webdriver===true)return;
var S=D.currentScript||q(function(){var a=D.querySelectorAll('script[src*="/cm.js"],script[src*="/mmm.js"]');return a[a.length-1]}),site=S&&(S.getAttribute('data-modal')||S.getAttribute('data-site'));if(!site)return;var kw=String((S&&S.getAttribute('data-interest'))||q(function(){var x=D.querySelector('meta[name="cm-interest"]');return x&&x.content})||'').slice(0,60);var vo=String((S&&S.getAttribute('data-volg'))||q(function(){var x=D.querySelector('meta[name="cm-volg"]');return x&&x.content})||'').replace(/[<>"{}]/g,'').slice(0,60);
var O=q(function(){return new URL(S.src).origin})||'https://whichtobuy.best',zelf=O===location.origin;
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,String(v))}catch(e){return null}}
function ss(k,v){try{if(v===undefined)return sessionStorage.getItem(k);sessionStorage.setItem(k,String(v))}catch(e){return null}}
function hex(n){var a=new Uint8Array(n),s='';q(function(){crypto.getRandomValues(a)});for(var i=0;i<n;i++)s+=(a[i]+256).toString(16).slice(1);return s}
var id=ls('mmq');if(!/^[0-9a-f]{16}$/.test(id||'')){id=hex(8);ls('mmq',id)}
var vk='mmqv:'+site,v=(+ls(vk)||0)+1;ls(vk,v);
var U=q(function(){return new URL(location.href).searchParams}),P=function(){for(var i=0;i<arguments.length;i++){var x=U&&U.get(arguments[i]);if(x)return x}return''};
var mmc=P('mmc');if(!/^[0-9a-f]{8,24}$/.test(mmc)){var l=(ls('mmc')||'').split('|');mmc=l[0]&&/^[0-9a-f]{8,24}$/.test(l[0])&&Date.now()-Number(l[1]||0)<864e5?l[0]:''}
var test=P('mmm'),mob=(/Mobi|Android|iPhone|iPad/i.test(N.userAgent||'')||q(function(){return matchMedia('(pointer:coarse)').matches}))?1:0,abo=(ls('mmqa:'+site)==='1'||ls('mmqa')==='1')?1:0;
var rh=q(function(){return D.referrer?new URL(D.referrer).hostname:''})||'',ref=!rh?'direct':rh===location.hostname?'intern':/(^|\.)(google|bing|duckduckgo|yahoo|ecosia|yandex|baidu|startpage|brave)\./.test(rh)?'zoek':/facebook|instagram|t\.co|x\.com|twitter|linkedin|reddit|tiktok|whatsapp|telegram|pinterest/.test(rh)?'social':'ander';
/* push kan hier (25 nov 2026): Notification, service worker en PushManager aanwezig en nog niets gekozen; op iOS alleen als web-app op het beginscherm */
var ios=/iPad|iPhone|iPod/.test(N.userAgent||'')||(N.platform==='MacIntel'&&N.maxTouchPoints>1),sa=N.standalone===true||!!q(function(){return matchMedia('(display-mode: standalone)').matches}),pu=('Notification' in W&&'serviceWorker' in N&&'PushManager' in W&&q(function(){return Notification.permission})==='default'&&(!ios||sa))?1:0;
var hist=q(function(){return JSON.parse(ls('cmh')||'{}')})||{};function hb(k){hist[k]=(+hist[k]||0)+1;ls('cmh',JSON.stringify(hist))}
var pgk='mmqp:'+site,pg=(+ss(pgk)||0)+1;ss(pgk,pg);
var pa=location.pathname||'/',pt=String((S&&S.getAttribute('data-pt'))||q(function(){return W.YSHOP_HERE&&W.YSHOP_HERE.p})||(/\/(product|p)\//.test(pa)?'product':pa==='/'?'home':/\/(shop|categorie|category|collectie|collection|zoek|search)(\/|$)/.test(pa)?'lijst':'ander')).toLowerCase().replace(/[^a-z]/g,'').slice(0,12);
/* toestemming voor statistiek of advertenties: alleen dan gaat er een gedragsrij per beslissing naar de server (nooit wat er getypt is) */
function tm(){return W.cmToestemming===true||/(?:^|; )yoors_consent=[^;]*(a1|m1)/.test(D.cookie||'')}
var B=null,wacht=[],getoond=0,uit=0,sch=0,kt=0,vis=0,vs=D.visibilityState==='visible'?Date.now():null,uitgeklikt=0,minMs=8000,typt=0,G={hoe:'',t0:0,sc:0,tp:0,fout:0},gs=0,host=null;
function visT(){return vis+(vs?Date.now()-vs:0)}
function bk(x,body){try{if(!(N.sendBeacon&&N.sendBeacon(x,body)))if(W.fetch)fetch(x,{method:'POST',body:body,keepalive:true,mode:'no-cors',credentials:'omit'})}catch(z){}}
function evMid(mid,e){if(/^[0-9a-f]{12}$/.test(mid||''))bk(O+'/api/mm/modalev?mid='+mid+'&e='+e)}
/* trechter na de beslissing (10 nov): op Nu kopen getikt, afrekenpagina open, 20 s of een veld daar; telt bij de laatste beslissing van de afgelopen 7 dagen, ook bij de controlegroep */
var evG={};function evL(e){if(evG[e])return;var l=(ls('mmqm')||'').split('|');if(/^[0-9a-f]{12}$/.test(l[0]||'')&&Date.now()-Number(l[1]||0)<7*864e5){evG[e]=1;evMid(l[0],e)}}
/* afrekenpaneel (11 nov, checkoutplan A6: Nu kopen opent op mobiel een paneel in plaats van de afrekenpagina): de shop zet data-cm-stap="kassa" op het paneel en roept cmStap('kassa') aan als het opengaat. Telt als afrekenpagina open; 20 s open of een veld erin telt als bewust afrekenen. De modal komt nooit over het paneel heen (stoor). */
W.cmStap=function(s){try{if(s!=='kassa')return;if(!/^\//.test(ls('cmKassa')||''))ls('cmKassa','#|'+Date.now());evL('kassa');setTimeout(function(){var p=D.querySelector('[data-cm-stap="kassa"]');if(p&&p.getClientRects().length)evL('bewust')},20000)}catch(e){}};
D.addEventListener('focusin',function(e){var t=e.target;if(t&&/^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)&&t.closest&&t.closest('[data-cm-stap="kassa"]')&&!/radio|checkbox|hidden|submit|button/.test(t.type||''))evL('bewust')},true);
function doeKnop(d){q(function(){if(d==='kassa'){var p=(ls('cmKassa')||'').split('|')[0];if(/^\/[^\/]/.test(p)){location.href=p;return}d='koop'}
if(d==='koop'){var el=D.querySelector('[data-cm-koop]');if(!el){var bs=D.querySelectorAll('button,a,[role=button]');for(var i=0;i<bs.length;i++){var b=bs[i];if(b.closest&&b.closest('[data-mmm]'))continue;var t=String(b.innerText||'').replace(/\s+/g,' ').trim().toLowerCase();if(/^(nu kopen|koop nu|bestellen|bestel nu|in (mijn |de )?(winkel)?(mand|mandje|wagen)|in winkelwagen)$/.test(t)&&b.getClientRects().length){el=b;break}}}if(el){el.click();return}}
var z=D.querySelector('[data-cm-zicht="'+d+'"],[data-cm="'+d+'"],[data-cm-plek="'+d+'"]');if(!z){var hs=D.querySelectorAll('h2,h3,h4,[class*=title],[class*=kop]');for(var j=0;j<hs.length;j++){if(/ook gekozen|anderen kozen|bekijk ook|vergelijkbare|misschien ook/i.test(hs[j].innerText||'')&&!(hs[j].closest&&hs[j].closest('[data-mmm]'))){z=hs[j];break}}}if(z&&z.scrollIntoView)z.scrollIntoView({behavior:'smooth',block:'start'});else if(d!=='koop')location.href='/'})}
function ev(e){if(!B){wacht.push(e);return}if(B.mid)evMid(B.mid,e)}
function gedrag(hoe){if(gs||!B||!B.mid||!getoond)return;gs=1;G.hoe=hoe||G.hoe||'weg';bk(O+'/api/mm/modalgedrag',JSON.stringify({mid:B.mid,tm:tm()?1:0,hoe:G.hoe,zicht:G.t0?Date.now()-G.t0:0,sc:G.sc,tp:G.tp,fout:G.fout,vw:W.innerWidth||0}))}
D.addEventListener('click',function(e){try{var a=e.target&&e.target.closest&&e.target.closest('a[href]');if(a){var h=new URL(a.href,location.href);if(/^https?:$/.test(h.protocol)&&h.host&&h.host!==location.host){uitgeklikt=1;ev('hoofd')}}
var b=e.target&&e.target.closest&&e.target.closest('a,button,[role=button],input[type=submit]');if(b&&!(b.closest&&b.closest('[data-mmm]'))){var t=((b.innerText||b.value||'')+' '+String(b.className||'')+' '+(b.id||'')).toLowerCase();if(/btn-buy|buy-btn|sticky-buy|winkelwagen|winkelmand|in (de )?mand|add.?to.?cart|nu kopen|koop nu|bestellen/.test(t)){ss('cmWarm','1');evL('mand')}}}catch(x){}},true);
D.addEventListener('submit',function(e){var f=e.target;if(f&&f.querySelector&&!(f.closest&&f.closest('[data-mmm]'))&&f.querySelector('input[type=email],input[name*=mail]'))ev('hoofd')},true);
D.addEventListener('focusin',function(e){var t=e.target;if(t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)&&!(t.closest&&t.closest('[data-mmm]')))typt=Date.now()},true);
D.addEventListener('visibilitychange',function(){if(D.visibilityState==='visible'){vs=Date.now();if(uitgeklikt&&B&&B.arm&&B.arm.moment==='exit')setTimeout(toon,400)}else if(vs){vis+=Date.now()-vs;vs=null}},true);
W.addEventListener('pageshow',function(e){if(e.persisted&&uitgeklikt&&B&&B.arm&&B.arm.moment==='exit'){vs=Date.now();setTimeout(toon,400)}},true);
/* weg binnen 10 s (25 nov 2026, "jaag niemand weg"): de pagina dicht of terug binnen 10 s nadat de modal verscheen (of na het schijnmoment van de controlegroep), zonder tik in de 3 s ervoor */
['click','keydown','submit'].forEach(function(t){D.addEventListener(t,function(e){if(t!=='keydown'||e.key==='Enter')kt=Date.now()},true)});
W.addEventListener('pagehide',function(){var t0=getoond?G.t0:sch;if(t0&&B&&B.mid&&Date.now()-t0<10000&&Date.now()-kt>3000)evMid(B.mid,'weg10');if(getoond&&!uit)gedrag('weg')},true);
/* slim: nooit over een ander venster heen, niet als iemand typt, niet op betaal-, inlog- of winkelwagenpagina's, niet bij een lage mensmeter-score; een blok in de pagina stoort niet, dus daar alleen pad en mensmeter */
function stoor(){if(W.cmGeenModal||D.documentElement.hasAttribute('data-cm-geen'))return 1;
if(/(checkout|betaal|pay(ment)?|kassa|cart|winkelwagen|login|signin|sign-in|inloggen|account|bestel)/i.test(location.pathname))return 1;
var mm=W.mensmeter;if(mm&&mm.lokaal!=null&&mm.lokaal<35)return 1;if(B&&B.arm&&B.arm.vorm==='blok')return 0;
if(D.visibilityState!=='visible')return 1;if(typt&&Date.now()-typt<15000)return 1;
var kp=D.querySelector('[data-cm-stap="kassa"]');if(kp&&kp.getClientRects().length)return 1;
var a=D.activeElement;if(a&&(/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)||a.isContentEditable)&&!(a.closest&&a.closest('[data-mmm]')))return 1;
var dl=D.querySelectorAll('dialog[open],[aria-modal="true"],[role="dialog"],[role="alertdialog"]');for(var i=0;i<dl.length;i++){var r=dl[i].getBoundingClientRect();if(r.width>0&&r.height>0&&!dl[i].closest('[data-mmm]'))return 1}
return 0}
/* niet midden in een beweging (11 nov, Henkjan: "geen klanten weg jagen"): nooit tonen binnen 1,5 s na scrollen, tikken of klikken; dan even later opnieuw */
var act=0,rt=0;['scroll','wheel','touchstart','touchmove','pointerdown','keydown'].forEach(function(t){W.addEventListener(t,function(){act=Date.now()},{passive:true,capture:true})});
function klaarVoor(){return !getoond&&!uit&&!sch&&B&&(B.toon||B.schijn)&&visT()>=minMs}
function toon(){if(!klaarVoor())return;if(!test&&stoor())return;if(!test&&B.arm&&B.arm.vorm!=='blok'&&B.arm.moment!=='exit'&&Date.now()-act<1500){if(!rt){rt=1;setTimeout(function(){rt=0;toon()},1600)}return}if(!B.toon){sch=Date.now();ev('schijn');return}/* controlegroep: hier zou de modal verschenen zijn; er verschijnt niets */getoond=1;var h=D.documentElement,m=Math.max(1,h.scrollHeight-innerHeight);G.t0=Date.now();G.sc=Math.round(Math.min(1,(W.pageYOffset||h.scrollTop||0)/m)*100);G.tp=Math.round(visT()/1000);ev('toon');hb('g');q(bouw)}
function plekEl(){var a=B&&B.arm;if(!a)return null;return a.plek&&D.querySelector('[data-cm-plek="'+a.plek+'"]')||D.querySelector('[data-cm-plek]')}
function plan(a){minMs=Math.max(0,(+B.min||0)*1000);
if(a.vorm==='blok'){minMs=0;var el=plekEl();if(!el)return;if(test){setTimeout(toon,300);return}if(W.IntersectionObserver){var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){toon();if(getoond)io.disconnect()}})},{threshold:.4});io.observe(el)}else toon();return}
var mo=String(a.moment||'exit');if(!test&&ref==='zoek'&&mob&&mo!=='exit')mo='scroll:80';var p=mo.split(':'),soort=p[0],n=+p[1]||0;
if(soort==='tijd'){var w=Math.max(minMs,(n||20)*1000),iv=setInterval(function(){if(getoond||uit||sch){clearInterval(iv);return}if(visT()>=w)toon()},1000)}
else if(soort==='pag'){if(pg>=(n||2)){var ip=setInterval(function(){if(getoond||uit||sch){clearInterval(ip);return}if(visT()>=minMs)toon()},1000)}}
else if(soort==='stil'){var ist=setInterval(function(){if(getoond||uit||sch){clearInterval(ist);return}if(visT()>=minMs&&Date.now()-Math.max(act,typt||0)>=(n||30)*1000)toon()},1000)}
else if(soort==='scroll'){var g=(n||60)/100;W.addEventListener('scroll',function(){var h=D.documentElement,y=(W.pageYOffset||h.scrollTop||0)+W.innerHeight,H=Math.max(h.scrollHeight,D.body?D.body.scrollHeight:0)||1;if(y/H>=g)toon()},{passive:true})}
else{D.addEventListener('mouseout',function(e){if(!e.relatedTarget&&e.clientY<=0)toon()},true);
var maxY=0,tMax=0;W.addEventListener('scroll',function(){var y=W.pageYOffset||0,t=Date.now();if(y>maxY){maxY=y;tMax=t}else if(maxY>W.innerHeight&&maxY-y>W.innerHeight*0.35&&t-tMax<900)toon()},{passive:true})}
if(test)setTimeout(toon,300)}
function kl(x,d){return /^#[0-9a-fA-F]{3,8}$/.test(x||'')?x:d}
function css(st){var f=/^[A-Za-z0-9 ,'-]{2,120}$/.test(st.font||'')?st.font+',':'',ro=st.ronding!=null?+st.ronding:14;
return ':host{all:initial}*{box-sizing:border-box}.w{--k:'+kl(st.knop,'#1a56db')+';--kt:'+kl(st.knopTekst,'#ffffff')+';--c:'+kl(st.kaart,'#ffffff')+';--t:'+kl(st.tekst,'#1d2433')+';--z:'+kl(st.zacht,'#4a5262')+';--r:'+kl(st.rand,'#c9cfdb')+';--bk:'+kl(st.balk,kl(st.kaart,'#ffffff'))+';--ro:'+ro+'px;font:16px/1.45 '+f+'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--t)}'+
'.bg{position:fixed;inset:0;background:rgba(15,20,30,.45);animation:op .2s ease}.k{position:fixed;z-index:1;background:var(--c);color:var(--t);border-radius:var(--ro);padding:22px 20px 14px;box-shadow:0 12px 40px rgba(0,0,0,.25);text-align:left;animation:op .22s ease}'+
'.t{font-weight:700;font-size:19px;line-height:1.3;margin:0 30px 6px 0}.s{margin:0 0 14px;color:var(--z)}.lg{display:block;height:28px;width:auto;margin:0 0 12px}.bd{display:block;width:100%;max-height:170px;object-fit:cover;border-radius:calc(var(--ro) - 4px);margin:0 0 14px}'+
'.b{display:block;width:100%;text-align:center;background:var(--k);color:var(--kt);border:0;border-radius:calc(var(--ro) - 4px);padding:13px 14px;font:inherit;font-weight:600;text-decoration:none;cursor:pointer}.b[disabled]{opacity:.6}'+
'input{display:block;width:100%;padding:12px;border:1px solid var(--r);border-radius:calc(var(--ro) - 4px);font:inherit;margin:0 0 10px;color:var(--t);background:#fff}input:focus{outline:2px solid var(--k);outline-offset:1px}'+
'.n{display:block;margin:8px auto 0;background:none;border:0;color:var(--z);font:inherit;font-size:14px;cursor:pointer;padding:6px}.x{position:absolute;top:8px;right:8px;width:34px;height:34px;border:0;background:none;color:var(--z);font-size:24px;line-height:34px;cursor:pointer;border-radius:50%}.x:hover{background:rgba(0,0,0,.06)}'+
'.kl{margin:8px 0 0;font-size:13px;color:var(--z)}.fo{margin:-4px 0 10px;font-size:14px;color:#b42318}'+
'.v-midden .k{left:50%;top:50%;transform:translate(-50%,-50%);width:min(92vw,400px)}'+
'@media (max-width:640px){.v-midden .bg{background:transparent;pointer-events:none}.v-midden .k{top:auto;bottom:0;left:0;transform:none;width:100%;border-radius:var(--ro) var(--ro) 0 0;padding-bottom:max(16px,env(safe-area-inset-bottom));box-shadow:0 -6px 30px rgba(0,0,0,.22)}}'+
'.v-onder .bg,.v-hoek .bg,.v-balk .bg,.v-blok .bg{display:none}.v-onder .k{left:0;right:0;bottom:0;margin:0 auto;width:min(100vw,520px);border-radius:var(--ro) var(--ro) 0 0;padding-bottom:max(16px,env(safe-area-inset-bottom));box-shadow:0 -6px 30px rgba(0,0,0,.22)}'+
'.v-hoek .k{bottom:16px;right:16px;width:min(calc(100vw - 32px),340px);padding:18px 16px 10px;box-shadow:0 10px 32px rgba(0,0,0,.22)}.v-hoek.links .k{right:auto;left:16px}.v-hoek .t{font-size:17px}.v-hoek .s{font-size:15px}'+
'.v-balk .k{left:0;right:0;width:100%;border-radius:0;padding:10px 48px 10px 16px;display:flex;align-items:center;gap:8px 14px;flex-wrap:wrap;background:var(--bk);box-shadow:0 -2px 14px rgba(0,0,0,.15)}.v-balk.onder .k{bottom:0;padding-bottom:max(10px,env(safe-area-inset-bottom))}.v-balk.boven .k{top:0;box-shadow:0 2px 14px rgba(0,0,0,.15)}'+
'.v-balk .t{font-size:16px;margin:0;flex:0 1 auto}.v-balk .s,.v-balk .n,.v-balk .kl,.v-balk .lg,.v-balk .bd{display:none}.v-balk .f{flex:1 1 300px}.v-balk form{display:flex;gap:8px;flex-wrap:wrap}.v-balk input{flex:1 1 180px;margin:0;padding:9px 11px}.v-balk .b{width:auto;padding:9px 16px;white-space:nowrap}.v-balk .fo{flex-basis:100%;margin:2px 0 0}@media (min-width:900px){.v-balk .k{padding-left:max(16px,calc((100vw - 760px) / 2));padding-right:max(48px,calc((100vw - 760px) / 2))}.v-balk .x{right:max(8px,calc((100vw - 760px) / 2 - 40px))}.v-balk .t{flex-basis:100%}}.v-balk .x{top:50%;transform:translateY(-50%)}'+
'.cl{max-height:240px;overflow:auto;margin:0 0 10px;display:flex;flex-direction:column;gap:6px}.mb{padding:8px 11px;border-radius:12px;font-size:15px;line-height:1.4;max-width:88%;white-space:pre-wrap}.mb.u{align-self:flex-end;background:var(--k);color:var(--kt)}.mb.k{align-self:flex-start;background:var(--c);color:var(--t);border:1px solid var(--r)}.ch{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}.pu{display:inline-block;margin-top:14px;color:var(--t);font-weight:700;text-decoration:underline;text-decoration-color:#E3A93B;text-decoration-thickness:2px;text-underline-offset:4px}.cp{border:1px solid var(--k);background:transparent;color:var(--t);border-radius:999px;padding:6px 11px;font:inherit;font-size:14px;cursor:pointer}.cf{display:flex;gap:8px}.cf input{margin:0;flex:1}.cf .b{width:auto;padding:0 14px}.cf .b.pl{flex:none;width:48px;height:48px;padding:0;border-radius:999px;display:flex;align-items:center;justify-content:center}.cf .b.pl svg{width:22px;height:22px}.wa{display:block;text-align:center;margin:10px 0 0;padding:11px;border-radius:calc(var(--ro) - 4px);background:#25D366;color:#000;text-decoration:none;font-weight:600}'+
'.v-blok .k{position:relative;width:100%;margin:16px 0;box-shadow:none;border:1px solid var(--r);animation:none}'+
'.v-vol .bg{background:var(--c);animation:op .2s ease}.v-vol .k{inset:0;width:100%;height:100%;border-radius:0;box-shadow:none;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:24px;overflow:auto}.v-vol .k>*:not(.x):not(.lg){width:min(100%,440px)}.v-vol .lg{align-self:center}.v-vol .t{font-size:26px;margin-right:0}.v-vol .x{top:14px;right:14px}'+
/* 25 nov 2026: grootte, lipje (tab), gidsen, zegelkaart, punten, ja/nee-stap, bewijs; zwart-wit, focus altijd zichtbaar */
/* nooit hoger dan het scherm (25 nov 2026, test van alle vormen en maten op 320x568 tot 1920x1080): de kaart scrolt zelf */
/* onder, hoek en tab dekken nooit meer dan 75% van het scherm af: de pagina erboven blijft zichtbaar en scrollbaar */
'.v-midden .k{max-height:calc(100vh - 32px);max-height:calc(100dvh - 32px);overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain}.v-hoek .k,.v-tab .k,.v-onder .k{max-height:75vh;max-height:75dvh;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain}@media (max-width:640px){.v-midden .k{max-height:calc(100vh - 12px);max-height:calc(100dvh - 12px)}}'+
/* grootte xs, s, m (standaard), l, xl voor elke vorm (25 nov 2026); invoer blijft altijd 16px (geen inzoomen op iOS) */
'.g-xs .t{font-size:16px}.g-s .t{font-size:18px}.g-l .t{font-size:23px}.g-xl .t{font-size:27px}.g-xs .s,.g-xs .pn{font-size:15px}.g-xl .s{font-size:17px}'+
'.g-xs.v-midden .k{width:min(92vw,300px)}.g-s.v-midden .k{width:min(92vw,340px)}.g-l.v-midden .k{width:min(92vw,480px)}.g-xl.v-midden .k{width:min(92vw,560px)}'+
'.g-xs.v-onder .k{width:min(100vw,400px)}.g-s.v-onder .k{width:min(100vw,460px)}.g-l.v-onder .k{width:min(100vw,640px)}.g-xl.v-onder .k{width:min(100vw,760px)}'+
'.g-xs.v-hoek .k,.g-xs.v-tab .k{width:min(calc(100vw - 32px),280px)}.g-s.v-hoek .k,.g-s.v-tab .k{width:min(calc(100vw - 32px),310px)}.g-l.v-hoek .k,.g-l.v-tab .k{width:min(calc(100vw - 32px),420px)}.g-xl.v-hoek .k,.g-xl.v-tab .k{width:min(calc(100vw - 32px),480px)}'+
'.g-xs.v-balk .k{padding-top:6px;padding-bottom:6px}.g-xl.v-balk .k{padding-top:16px;padding-bottom:16px}.g-xs.v-balk .t{font-size:15px}.g-l.v-balk .t{font-size:18px}.g-xl.v-balk .t{font-size:20px}'+
'.g-xs.v-blok .k{padding:14px 14px 10px}.g-xl.v-blok .k{padding:28px 26px 18px}'+
'.g-xs.v-vol .k>*:not(.x):not(.lg){width:min(100%,340px)}.g-s.v-vol .k>*:not(.x):not(.lg){width:min(100%,400px)}.g-l.v-vol .k>*:not(.x):not(.lg){width:min(100%,520px)}.g-xl.v-vol .k>*:not(.x):not(.lg){width:min(100%,600px)}.g-xs.v-vol .t{font-size:20px}.g-s.v-vol .t{font-size:22px}.g-l.v-vol .t{font-size:30px}.g-xl.v-vol .t{font-size:34px}'+
'.b{min-height:44px}.v-balk input{min-height:44px}'+
/* knop en veld eerst (25 nov 2026, test op 360x640): als kolom, en op een laag scherm komen de drie punten en de kleine letters onder de knop en valt het logo weg */
'.v-midden .k,.v-onder .k,.v-hoek .k,.v-tab .k,.v-blok .k{display:flex;flex-direction:column}.v-tab.dicht .k{display:none}.lg{align-self:flex-start}.v-midden .k>*,.v-onder .k>*,.v-hoek .k>*,.v-tab .k>*,.v-blok .k>*{flex:none}'+
'@media (max-height:820px){.v-midden .pn,.v-onder .pn,.v-hoek .pn,.v-tab .pn{order:5;margin:12px 0 0}.v-midden .n,.v-onder .n,.v-hoek .n,.v-tab .n{order:6}.v-onder .lg,.v-hoek .lg,.v-tab .lg,.v-midden .lg{display:none}.zk i{width:30px;height:30px}.zk{margin-bottom:10px}}'+
'.v-tab .bg{display:none}.v-tab .k{bottom:16px;right:16px;width:min(calc(100vw - 32px),360px);padding:18px 16px 10px;box-shadow:0 10px 32px rgba(0,0,0,.25)}.v-tab.dicht .k{display:none}.lip{position:fixed;right:16px;bottom:max(16px,env(safe-area-inset-bottom));z-index:1;min-height:44px;border:2px solid var(--k);background:var(--c);color:var(--t);border-radius:999px;padding:10px 18px;font:inherit;font-weight:700;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.2);animation:op .2s ease}.v-tab:not(.dicht) .lip{display:none}'+
'.gl{list-style:none;margin:0 0 12px;padding:0}.gl li{margin:0;border-top:1px solid var(--r)}.gl li:first-child{border-top:0}.gl a{display:block;padding:10px 0;color:var(--t);text-decoration:none;font-weight:700}.gl a span{display:block;font-weight:400;font-size:15px}.gl a:hover b,.gl a:focus b{text-decoration:underline}'+
'.zk{display:flex;gap:8px;margin:0 0 12px}.zk i{width:36px;height:36px;border:2px solid var(--t);border-radius:50%;display:flex;align-items:center;justify-content:center;font-style:normal;font-weight:700}.zk i.v{background:var(--t);color:var(--c)}'+
'.pn{margin:-6px 0 12px;padding-left:20px}.pn li{margin:0 0 4px}.bw{margin:0 0 10px;font-size:15px;font-weight:700}.jn{display:flex;gap:8px;flex-wrap:wrap}.jn .b{flex:1 1 140px}.jn .n2{flex:1 1 140px;display:block;text-align:center;background:var(--c);color:var(--t);border:2px solid var(--t);border-radius:calc(var(--ro) - 4px);padding:11px 14px;font:inherit;font-weight:600;cursor:pointer}'+
'button:focus-visible,a:focus-visible,input:focus-visible{outline:3px solid var(--t);outline-offset:2px}.x{min-width:44px;min-height:44px}'+
'@keyframes op{from{opacity:0}}@media (prefers-reduced-motion:reduce){.bg,.k{animation:none}}'}
function bouw(){var a=B.arm,vorm=a.vorm||'midden',st=a.stijl||{},el=vorm==='blok'?plekEl():null,fx=a.fx||{},voor=D.activeElement;if(vorm==='blok'&&!el)vorm='hoek';
host=D.createElement('div');host.setAttribute('data-mmm','1');host.style.cssText=el?'all:initial;display:block':'all:initial;position:fixed;left:0;top:0;width:0;height:0;z-index:2147483646';
var r=host.attachShadow?host.attachShadow({mode:'open'}):host,ov=vorm==='midden'||vorm==='vol';
r.innerHTML='<style>'+css(st)+'</style><div class="w v-'+vorm+(fx.grootte?' g-'+fx.grootte:'')+(vorm==='tab'?' dicht':'')+(vorm==='hoek'?' '+(st.kant==='links'?'links':'rechts'):'')+(vorm==='balk'?' '+(st.balkPlek==='boven'?'boven':'onder'):'')+'"><div class="bg"></div>'+(vorm==='tab'?'<button class="lip" type="button" aria-expanded="false"></button>':'')+'<div class="k" role="'+(ov?'dialog':'region')+'"'+(ov?' aria-modal="true"':'')+' aria-labelledby="mmt"><button class="x" type="button" aria-label="'+(a.taal==='nl'?'Sluiten':a.taal==='de'?'Schließen':'Close')+'">×</button><p class="t" id="mmt"></p><p class="s"></p><div class="f"></div><button class="n" type="button"></button></div></div>';
var $=function(s){return r.querySelector(s)},sluit=function(lees,hoe){if(uit)return;uit=1;if(lees){ev('sluit');hb('s');if(fx.herhaal)ls('mmqz:'+site,Date.now()+(+fx.herhaal)*864e5)}gedrag(hoe);q(function(){host.remove()});D.removeEventListener('keydown',esc,true);if(ov&&voor&&voor.focus)q(function(){voor.focus()})},
esc=function(e){if(e.key==='Escape'&&vorm!=='blok'){sluit(1,'esc');return}if(e.key==='Tab'&&ov){var fs=[].slice.call(r.querySelectorAll('button,a[href],input')).filter(function(x){return x.getClientRects().length&&!x.disabled});if(!fs.length)return;var hu=r.activeElement,i0=fs.indexOf(hu);if(e.shiftKey&&(i0<=0)){e.preventDefault();fs[fs.length-1].focus()}else if(!e.shiftKey&&(i0===fs.length-1||i0<0)){e.preventDefault();fs[0].focus()}}};
var kaart=$('.k'),plaatje=function(c,src){var im=D.createElement('img');im.className=c;im.alt='';im.onerror=function(){q(function(){im.remove()})};im.src=src;kaart.insertBefore(im,$('.t'))};if(/^https:\/\//.test(st.logo||''))plaatje('lg',st.logo);if(fx.beeld!=='geen'&&/^https:\/\//.test(a.beeld||''))plaatje('bd',a.beeld);
$('.t').textContent=a.titel||'';$('.s').textContent=a.tekst||'';if(!a.tekst||fx.tekst==='kort')$('.s').style.display='none';$('.n').textContent=a.nee||'No thanks';
if(fx.beeld==='ja'&&a.beeldSoort==='zegels'){var zk=D.createElement('div');zk.className='zk';zk.setAttribute('role','img');zk.setAttribute('aria-label','3 van de 5 zegels gestempeld');for(var zi=0;zi<5;zi++){var zz=D.createElement('i');if(zi<3){zz.className='v';zz.textContent='\u2713'}else zz.textContent=zi+1;zk.appendChild(zz)}kaart.insertBefore(zk,$('.t'))}
if(fx.tekst==='lang'&&a.punten&&a.punten.length){var pn=D.createElement('ul');pn.className='pn';a.punten.forEach(function(x){var li=D.createElement('li');li.textContent=x;pn.appendChild(li)});kaart.insertBefore(pn,$('.f'))}
if(vorm==='tab'){var lip=$('.lip'),wv=$('.w');lip.textContent=a.titel||'';lip.onclick=function(){wv.classList.remove('dicht');lip.setAttribute('aria-expanded','true');ev('open');q(function(){var x=$('.f input,.f a,.f button');if(x&&!mob)x.focus({preventScroll:true})})}}
$('.x').onclick=function(){sluit(1,'kruis')};$('.n').onclick=function(){sluit(1,getoond&&$('.n').getAttribute('data-klaar')?'klaar':'nee')};$('.bg').onclick=function(){sluit(1,'achter')};D.addEventListener('keydown',esc,true);
var f=$('.f'),focus=ov&&!mob;
if(a.soort==='gids'){var gl=D.createElement('ul');gl.className='gl';(a.gidsen||[]).forEach(function(g){var li=D.createElement('li'),ga=D.createElement('a'),gb=D.createElement('b');ga.href=g.url+(/\?/.test(g.url)?'&':'?')+'mmc='+(B.mid||'test');gb.textContent=g.titel;ga.appendChild(gb);if(g.sub){var gs=D.createElement('span');gs.textContent=g.sub;ga.appendChild(gs)}ga.onclick=function(){ev('klik');hb('k');G.hoe='knop'};li.appendChild(ga);gl.appendChild(li)});if(gl.childNodes.length)f.appendChild(gl);var ak=D.createElement('a');ak.className='b';ak.href=a.href;ak.textContent=a.knop;ak.onclick=function(){ev('klik');hb('k');G.hoe='knop'};f.appendChild(ak);if(focus)setTimeout(function(){q(function(){(gl.querySelector('a')||ak).focus({preventScroll:true})})},50)} /* gidsen die bij deze pagina passen (25 nov 2026) */
else if(a.soort==='site'){var k=D.createElement('a'),eigen=q(function(){return new URL(a.href).host===location.host});k.className='b';k.href=a.href;if(!eigen){k.target='_blank';k.rel='noopener'}k.textContent=a.knop;k.onclick=function(){ev('klik');hb('k');G.hoe='knop';setTimeout(function(){sluit(0,'knop')},200)};f.appendChild(k);if(focus)setTimeout(function(){q(function(){k.focus({preventScroll:true})})},50)}
else if(a.soort==='chat'&&a.corpus==='feedback'){var ff=D.createElement('form'),fi=D.createElement('input'),fbn=D.createElement('button'),fc=D.createElement('div'),gaf=0,stuur=function(v){if(gaf)return;gaf=1;ev('feedback');hb('k');G.hoe='klaar';ls('mmfb:'+site,String(Date.now()));q(function(){if(W.cwFeedback)W.cwFeedback(v,a.id)});fc.remove();ff.remove();var p=D.createElement('p');p.className='s';p.style.display='block';p.textContent=a.dank||'Thanks!';f.insertBefore(p,f.firstChild);$('.n').textContent='OK';$('.n').setAttribute('data-klaar','1')};fc.className='ch';fi.placeholder=a.veld||'';fi.setAttribute('aria-label',a.veld||'Feedback');fi.maxLength=400;fbn.className='b pl';fbn.type='submit';fbn.setAttribute('aria-label',a.knop||'Send');fbn.innerHTML=PIJL;ff.className='cf';(a.keuzes||[]).forEach(function(k){var b=D.createElement('button');b.type='button';b.className='cp';b.textContent=k.label;b.onclick=function(){stuur(k.label)};fc.appendChild(b)});ff.onsubmit=function(e){e.preventDefault();var v=String(fi.value||'').trim();if(v.length<2)return;stuur(v)};fi.addEventListener('focus',function(){ev('veld')});ff.appendChild(fi);ff.appendChild(fbn);if(fc.childNodes.length)f.appendChild(fc);f.appendChild(ff);if(a.link){var pl=D.createElement('a');pl.className='pu';pl.href=a.link;pl.textContent=(a.linkTekst||a.link)+' \u2192';pl.onclick=function(){ev('klik');ev('contact');hb('k');G.hoe='knop'};f.appendChild(pl)}if(focus)setTimeout(function(){q(function(){fi.focus({preventScroll:true})})},50)} /* feedback van wie terugkomt (curacao.day, 20 nov 2026) */
else if(a.soort==='chat'&&a.corpus==='site'){var sf=D.createElement('form'),si=D.createElement('input'),sb=D.createElement('button'),sc=D.createElement('div'),naar=function(v){ev('klik');ev('contact');hb('k');G.hoe='chat';sluit(0,'chat');setTimeout(function(){q(function(){if(W.cwVraag)W.cwVraag(v);else location.hash='#ama'})},150)};sc.className='ch';si.placeholder=a.veld||'Zeg of vraag iets';si.setAttribute('aria-label',a.veld||'Vraag');si.maxLength=280;sb.className='b pl';sb.type='submit';sb.setAttribute('aria-label',a.knop||'Ask');sb.innerHTML=PIJL;sf.className='cf';(a.keuzes||[]).forEach(function(k){var b=D.createElement('button');b.type='button';b.className='cp';b.textContent=k.label;b.onclick=function(){naar(k.label)};sc.appendChild(b)});sf.onsubmit=function(e){e.preventDefault();var v=String(si.value||'').trim();if(v.length<2)return;naar(v)};si.addEventListener('focus',function(){ev('veld')});sf.appendChild(si);sf.appendChild(sb);if(sc.childNodes.length)f.appendChild(sc);f.appendChild(sf);if(focus)setTimeout(function(){q(function(){si.focus({preventScroll:true})})},50)} /* chat van de pagina zelf (curacao.day, 18 nov 2026) */
else if(a.soort==='chat'){var cl=D.createElement('div'),chs=D.createElement('div'),cf=D.createElement('form'),ci=D.createElement('input'),cb=D.createElement('button'),hist=[],bezig=0,eerst=1,koopKnop=0,mailVak=0;cl.className='cl';chs.className='ch';cf.className='cf';ci.placeholder=a.veld||'Typ je vraag';ci.setAttribute('aria-label',a.veld||'Vraag');cb.className='b';cb.type='submit';cb.textContent=a.knop;
var cx=q(function(){var h=D.querySelector('h1'),t=(D.body&&D.body.innerText)||'',m=/[^\n.]{0,60}in huis[^\n.]{0,20}/i.exec(t),p=/€\s?\d+[.,]\d{2}/.exec(t);return{listingId:W.YP&&W.YP.listing?String(W.YP.listing.id||'').slice(0,80):'',titel:h?String(h.innerText).slice(0,120):'',prijs:p?p[0]:'',levering:m?m[0].trim():'',url:location.pathname.slice(0,160)}})||{};
var bel=function(w,t){var d=D.createElement('div');d.className='mb '+w;d.textContent=t;cl.appendChild(d);cl.scrollTop=cl.scrollHeight;return d},aan=function(h){if(eerst){eerst=0;ev('klik');ev('contact');hb('k')}G.hoe=h};
var vraag=function(o,label){if(bezig)return;bezig=1;aan('chat');bel('u',label);var w=bel('k','…');
fetch(O+'/api/mm/kadolychat',{method:'POST',body:JSON.stringify({site:site,kanaal:'site',keuze:o.keuze||'',vraag:o.vraag||'',hist:hist.slice(-6),ctx:cx}),credentials:'omit'}).then(function(x){return x.json()}).then(function(j){w.textContent=(j&&j.antwoord)||'Dat lukte even niet. Stel je vraag via WhatsApp.';hist.push(['u',label],['k',w.textContent]);if(!mailVak){mailVak=1;var mf=D.createElement('form'),mi=D.createElement('input'),mb=D.createElement('button'),ml=D.createElement('p');ml.className='s';ml.style.margin='8px 0 4px';ml.textContent='Persoonlijk antwoord van Henkjan? Laat je e-mail achter.';mf.className='cf';mi.type='email';mi.placeholder='Je e-mailadres';mi.setAttribute('aria-label','Je e-mailadres');mb.className='b';mb.type='submit';mb.textContent='Stuur';mf.appendChild(mi);mf.appendChild(mb);mf.onsubmit=function(e){e.preventDefault();var mv=String(mi.value||'').trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mv)){ml.textContent='Vul een geldig e-mailadres in.';return}mb.disabled=true;fetch(O+'/api/mm/kadolychat',{method:'POST',body:JSON.stringify({site:site,kontakt:mv,hist:hist.slice(-8),ctx:cx}),credentials:'omit'}).then(function(x){return x.json()}).then(function(j){if(j&&j.ok){ml.textContent=j.antwoord||'Dank je!';mf.remove()}else{ml.textContent=(j&&j.fout)||'Dat lukte even niet.';mb.disabled=false}})['catch'](function(){ml.textContent='Dat lukte even niet.';mb.disabled=false})};f.insertBefore(ml,cf.nextSibling);f.insertBefore(mf,ml.nextSibling)}if(!koopKnop&&pt==='product'){koopKnop=1;var kb=D.createElement('button');kb.type='button';kb.className='b';kb.style.marginBottom='10px';kb.textContent='Bestellen';kb.onclick=function(){sluit(0,'knop');setTimeout(function(){doeKnop('koop')},60)};f.insertBefore(kb,cf)}})['catch'](function(){w.textContent='Dat lukte even niet. Stel je vraag via WhatsApp.'}).then(function(){bezig=0})};
(a.keuzes||[]).forEach(function(k){var b=D.createElement('button');b.type='button';b.className='cp';b.textContent=k.label;b.onclick=function(){if(k.vraag)vraag({vraag:k.vraag},k.label);else vraag({keuze:k.id},k.label)};chs.appendChild(b)});
cf.onsubmit=function(e){e.preventDefault();var v=String(ci.value||'').trim();if(v.length<2)return;ci.value='';vraag({vraag:v},v)};cf.appendChild(ci);cf.appendChild(cb);f.appendChild(chs);f.appendChild(cl);f.appendChild(cf);
if(/^\d{8,15}$/.test(a.wa||'')){var wl=D.createElement('a');wl.className='wa';wl.href='https://wa.me/'+a.wa+'?text='+encodeURIComponent('Hoi Kadoly! Ik heb een vraag'+(cx.titel?' over '+cx.titel:'')+'.');wl.target='_blank';wl.rel='noopener';wl.textContent='Liever via WhatsApp';wl.onclick=function(){aan('whatsapp');q(function(){fetch(O+'/api/mm/kadolychat',{method:'POST',body:JSON.stringify({site:site,vraag:'__wa'}),credentials:'omit',keepalive:true})})};f.appendChild(wl)}}
else if(a.soort==='push'){var pk=D.createElement('button'),pm=D.createElement('p'),pkl=D.createElement('p'),nl=a.taal!=='en';pk.type='button';pk.className='b';pk.textContent=a.knop;pm.className='fo';pm.style.display='none';pm.setAttribute('role','status');pkl.className='kl';pkl.textContent=a.klein||'';
var k8=function(x){x=(x+'===='.slice((x.length+3)%4)).replace(/-/g,'+').replace(/_/g,'/');var r0=atob(x),u8=new Uint8Array(r0.length);for(var i=0;i<r0.length;i++)u8[i]=r0.charCodeAt(i);return u8},
pmis=function(t){G.fout++;pk.disabled=false;pm.textContent=t;pm.style.display='block'},
pdank=function(){G.hoe='klaar';f.innerHTML='';$('.s').style.display='none';var p=D.createElement('p');p.className='s';p.style.display='block';p.textContent=a.dank||'OK';f.appendChild(p);$('.n').style.display='';$('.n').textContent='OK';$('.n').setAttribute('data-klaar','1');if(vorm==='balk')setTimeout(function(){sluit(0,'klaar')},6000)};
/* push met één klik (25 nov 2026): de browser-vraag komt pas na deze tik, nooit eerder; geen e-mailadres */
pk.onclick=function(){ev('klik');hb('k');G.hoe='knop';pk.disabled=true;pm.style.display='none';
if(!('Notification' in W)||!('serviceWorker' in N)||!('PushManager' in W)||!a.sw||!a.vapid){pmis(nl?'Meldingen kunnen niet in deze browser.':'Notifications are not available in this browser.');return}
new Promise(function(ok){var x=Notification.requestPermission(ok);if(x&&x.then)x.then(ok)}).then(function(p){if(p!=='granted')throw p==='denied'?'nee':'dicht';return N.serviceWorker.register(a.sw,{scope:'/'})}).then(function(){return N.serviceWorker.ready}).then(function(reg){return reg.pushManager.getSubscription().then(function(s){return s||reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:k8(a.vapid)})})}).then(function(s){if(!B.mid)return {ok:true};return fetch(O+'/api/mm/modalpush',{method:'POST',body:JSON.stringify({mid:B.mid,endpoint:s.endpoint}),credentials:'omit'}).then(function(x){return x.json()})}).then(function(j){if(j&&j.ok)pdank();else pmis(nl?'Aanzetten lukte niet. Probeer het later nog eens.':'That did not work. Please try again later.')})['catch'](function(e){if(e==='nee'){pmis(nl?'Je browser blokkeert meldingen van deze site. Dat kun je in de instellingen van je browser veranderen.':'Your browser blocks notifications from this site.');setTimeout(function(){sluit(0,'nee')},5000)}else if(e==='dicht')pk.disabled=false;else pmis(nl?'Aanzetten lukte niet in deze browser.':'That did not work in this browser.')})};
f.appendChild(pk);f.appendChild(pm);if(a.klein)f.appendChild(pkl);if(focus)setTimeout(function(){q(function(){pk.focus({preventScroll:true})})},50)}
else if(a.soort==='knop'){var kn=D.createElement('button');kn.type='button';kn.className='b';kn.textContent=a.knop;kn.onclick=function(){ev('klik');hb('k');G.hoe='knop';var d=a.doel;sluit(0,'knop');setTimeout(function(){doeKnop(d)},60)};f.appendChild(kn);if(focus)setTimeout(function(){q(function(){kn.focus({preventScroll:true})})},50)}
else if(a.soort==='email'){var fm=D.createElement('form'),inp=D.createElement('input'),fo=D.createElement('p'),bt=D.createElement('button'),kp=D.createElement('p'),gv=0,gt=0,vn=null;fm.noValidate=true;
inp.type='email';inp.autocomplete='email';inp.setAttribute('inputmode','email');inp.placeholder=a.veld||'Your email';inp.setAttribute('aria-label',a.veld||'Email');fo.className='fo';fo.style.display='none';fo.setAttribute('role','alert');bt.className='b';bt.type='submit';bt.textContent=a.knop;kp.className='kl';kp.textContent=(fx.freq==='ja'&&a.freqTekst?a.freqTekst+' ':'')+(a.klein||'');
inp.addEventListener('focus',function(){if(!gv){gv=1;ev('veld')}});inp.addEventListener('input',function(){if(!gt&&inp.value){gt=1;ev('typ')}});
if(fx.velden==='2'){vn=D.createElement('input');vn.type='text';vn.autocomplete='given-name';vn.maxLength=30;vn.placeholder=a.taal==='nl'?'Je voornaam (mag leeg)':'First name (optional)';vn.setAttribute('aria-label',vn.placeholder);fm.appendChild(vn)}
if(a.bewijs){var bw=D.createElement('p');bw.className='bw';bw.textContent=a.bewijs;f.appendChild(bw)}
fm.appendChild(inp);fm.appendChild(fo);fm.appendChild(bt);fm.appendChild(kp);
if(fx.stap==='twee'&&a.vraag){var jn=D.createElement('div'),ja=D.createElement('button'),ne=D.createElement('button'),vq=D.createElement('p');vq.className='bw';vq.textContent=a.vraag;jn.className='jn';ja.type='button';ja.className='b';ja.textContent=a.taal==='nl'?'Ja, graag':'Yes please';ne.type='button';ne.className='n2';ne.textContent=a.nee||'Nee, dank je';
ja.onclick=function(){ev('veld');gv=1;jn.remove();vq.remove();f.appendChild(fm);q(function(){(vn||inp).focus({preventScroll:true})})};ne.onclick=function(){sluit(1,'nee')};jn.appendChild(ja);jn.appendChild(ne);f.appendChild(vq);f.appendChild(jn);$('.n').style.display='none';if(focus)setTimeout(function(){q(function(){ja.focus({preventScroll:true})})},50)} /* eerst een ja/nee-stap zonder veld (micro-commitment, 25 nov 2026); 'nee' is even groot */
else{f.appendChild(fm);if(focus)setTimeout(function(){q(function(){(vn||inp).focus({preventScroll:true})})},50)}
var dank=function(){ev('klik');hb('k');ls('mmqa:'+site,'1');ls('mmqa','1');G.hoe='klaar';fm.innerHTML='';$('.s').style.display='none';var p=D.createElement('p');p.className='s';p.style.display='block';p.textContent=a.dank||'Thanks!';fm.appendChild(p);$('.n').style.display='';$('.n').textContent='OK';$('.n').setAttribute('data-klaar','1');if(vorm==='balk')setTimeout(function(){sluit(0,'klaar')},6000)},
fout=function(t){G.fout++;bt.disabled=false;fo.textContent=t||'Something went wrong. Please try again.';fo.style.display='block'},
post=function(eigen,nieuw){if(!B.mid){dank();return}fetch(O+'/api/mm/modalmail',{method:'POST',body:JSON.stringify({mid:B.mid,email:inp.value,naam:vn?String(vn.value||'').trim().slice(0,30):'',bewaar:!eigen,tel:nieuw!==false,pg:String(location.href).slice(0,300)}),credentials:'omit'}).then(function(x){return x.json()}).then(function(j){if(j&&j.ok)dank();else fout(j&&j.fout)})['catch'](function(){fout()})};
fm.onsubmit=function(e){e.preventDefault();var m=String(inp.value||'').trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m)){fout(a.taal==='nl'?'Vul een geldig e-mailadres in.':a.taal==='de'?'Bitte eine gültige E-Mail-Adresse eingeben.':'Please enter a valid email address.');return}bt.disabled=true;fo.style.display='none';
if(a.doel==='todayin'||a.doel==='kadoly'||a.doel==='motor'){post(0)}else if(a.doel==='moonlighter'&&B.mid){fetch('https://moonlighter.email/api/cm-signup',{method:'POST',body:JSON.stringify({email:m,site:site,mid:B.mid}),credentials:'omit'}).then(function(x){return x.json()}).then(function(j){if(j&&j.ok)post(1);else fout(j&&j.error)})['catch'](function(){fout()})}
else if(typeof W.mmAanmelden==='function'){q(function(){Promise.resolve(W.mmAanmelden(m,{site:site,arm:a.id,volg:a.volg||'',mid:B.mid||''})).then(function(ok){if(ok&&(typeof ok!=='object'||ok.ok))post(1,typeof ok==='object'?ok.nieuw!==false:true);else fout()},function(){fout()})})}else post(0)}}
if(el)el.appendChild(host);else (D.body||D.documentElement).appendChild(host)}
/* betaald: op de bedankpagina zet de shop data-cm-betaald (bedrag); dan telt 'koop' bij de laatste beslissing van de afgelopen 7 dagen, ook bij de controlegroep */
var mk='mmqm';function koop(){if(!D.querySelector('[data-cm-betaald]'))return 0;q(function(){localStorage.removeItem('cmKassa')});var l=(ls(mk)||'').split('|');if(/^[0-9a-f]{12}$/.test(l[0]||'')&&Date.now()-Number(l[1]||0)<7*864e5&&l[2]!=='k'){evMid(l[0],'koop');ls(mk,l[0]+'|'+l[1]+'|k')}return 1}
function vraag(){var nk=0;if(!koop()){var ik=setInterval(function(){if(koop()||++nk>10)clearInterval(ik)},1500)}
if(!test&&(+ls('mmqz:'+site)||0)>Date.now())return; /* rust na sluiten (factor herhaal, 25 nov 2026): 1, 3 of 7 dagen geen nieuwe beslissing op dit toestel */
var pl=[];q(function(){[].forEach.call(D.querySelectorAll('[data-cm-plek]'),function(x){var n=String(x.getAttribute('data-cm-plek')||'').toLowerCase();if(/^[a-z0-9-]{1,30}$/.test(n)&&pl.indexOf(n)<0)pl.push(n)})});
var warm=ss('cmWarm')==='1'||/^(warm|heet|koper)$/.test(ss('cmSeg')||'')?1:0,kk=(ls('cmKassa')||'').split('|'),kl=kk[0]&&Date.now()-Number(kk[1]||0)<7*864e5?1:0;if(kl)warm=1;
if(/checkout|afreken|kassa/i.test(pa)){ls('cmKassa',location.pathname+location.search+'|'+Date.now());evL('kassa');var bz=0,bt=D.visibilityState==='visible'?Date.now():0,bw=function(){evL('bewust')};D.addEventListener('visibilitychange',function(){if(D.visibilityState==='visible'){if(!bt)bt=Date.now()}else if(bt){bz+=Date.now()-bt;bt=0}});var bi=setInterval(function(){if(bz+(bt?Date.now()-bt:0)>=20000){bw();clearInterval(bi)}},1000);D.addEventListener('focusin',function(e){var t=e.target;if(t&&/^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)&&!/radio|checkbox|hidden|submit|button/.test(t.type||'')&&!(t.closest&&t.closest('[data-mmm]')))bw()},true)}
/* verder (11 nov): een volgende pagina binnen 30 minuten na de beslissing telt bij die beslissing, ook bij de controlegroep; zo ziet de modal of hij mensen wegjaagt */
var vp=ss('cmPad'),vq=(ls(mk)||'').split('|');if(vp&&vp!==location.pathname&&/^[0-9a-f]{12}$/.test(vq[0]||'')&&Date.now()-Number(vq[1]||0)<18e5)evL('verder');
var u=O+'/api/mm/modal?site='+encodeURIComponent(site)+'&q='+id+'&c='+mmc+'&v='+v+'&mob='+mob+'&abo='+abo+'&fb='+((Date.now()-(+ls('mmfb:'+site)||0))<12096e5?1:0)+'&net='+encodeURIComponent((P('src','net','utm_source','n')||(/^(propeller|mondiad|mgid|richads|clickadu|galaksion)$/i.test(P('c'))?P('c'):'')).slice(0,20))+'&zone='+encodeURIComponent(P('zone','z','zoneid','widget').slice(0,40))+'&ref='+ref+'&uur='+new Date().getHours()+(kw?'&kw='+encodeURIComponent(kw):'')+(vo?'&vo='+encodeURIComponent(vo):'')+'&g='+(+hist.g||0)+'&k='+(+hist.k||0)+'&pa='+encodeURIComponent(pa.slice(0,120))+'&pt='+pt+'&warm='+warm+'&kl='+kl+'&pu='+pu+(pl.length?'&pl='+encodeURIComponent(pl.slice(0,8).join(',')):'')+(test?'&test='+encodeURIComponent(test):'');
fetch(u,{credentials:zelf?'include':'omit'}).then(function(x){return x.json()}).then(function(d){B=d||{};if(B.mid&&!B.weer){ls(mk,B.mid+'|'+Date.now());ss('cmPad',location.pathname)}var w=wacht;wacht=[];for(var i=0;i<w.length;i++)ev(w[i]);if(B.toon&&B.arm&&B.arm.soort!=='geen')plan(B.arm);else if(B.schijn&&B.mid&&B.arm&&B.arm.moment&&!test)plan(B.arm)})['catch'](function(){})}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',vraag);else vraag();
W.mmModalStand=function(){return{site:site,besluit:B,getoond:getoond,stoort:stoor(),toestemming:tm()}};
}catch(e){}})();
`;

// CLICKMIND in één regel voor elke eigen pagina: uitkomsten (automatisch echt, actie, aanmelding bij een klik-id), de mensmeter (alleen bij
// betaald verkeer: een zone, klik-id of mmc in de URL) en de lerende modal.  <script src="https://whichtobuy.best/cm.js" data-site="<site>" async></script>
const PF_JS = String.raw`/* clickmind proef: elke versie leert (10 nov, Henkjan: "maak alles daarvan lerend") */(function(){var W=window,D=document,N=navigator;
function q(f){try{return f()}catch(e){return null}}
try{if(W.cmPf)return;W.cmPf=1;var P=null,h=D.documentElement;W.cmProef=function(f){return P&&P.v&&P.v[f]||'a'};if(N.webdriver===true){h.classList.remove('cm-wacht');return}
var S=D.currentScript||q(function(){var a=D.querySelectorAll('script[src*="/cm.js"]');return a[a.length-1]}),site=S&&(S.getAttribute('data-proef')||S.getAttribute('data-modal')||S.getAttribute('data-site'));if(!site||site==='0'){h.classList.remove('cm-wacht');return}
var O=q(function(){return new URL(S.src).origin})||'https://whichtobuy.best',LK='cmpf';
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,String(v))}catch(e){return null}}
var ua=N.userAgent||'',ctx=/iPhone|iPad|iPod/.test(ua)||(/Macintosh/.test(ua)&&N.maxTouchPoints>1)?'i':/Android/.test(ua)?'a':'d';
var t0=+q(function(){return sessionStorage.getItem('cmpf0')})||0;if(!t0){t0=Date.now();q(function(){sessionStorage.setItem('cmpf0',String(t0))})}
P=q(function(){return JSON.parse(ls(LK)||'null')});if(P&&!(P.pid&&P.v&&Date.now()-(+P.t||0)<6*864e5))P=null;
var st=D.createElement('style');st.textContent='[data-cm-v][hidden]{display:none!important}';(D.head||h).appendChild(st);
var zien={},gestuurd={},gestart=0,tm=0;
function zet(){if(!P)return;var per={},els=D.querySelectorAll('[data-cm-v]');
[].forEach.call(els,function(el){var x=String(el.getAttribute('data-cm-v')).split(':');if(x.length===2)(per[x[0]]=per[x[0]]||{})[x[1]]=1});
for(var f in P.v)h.setAttribute('data-cm-'+f,P.v[f]);
[].forEach.call(els,function(el){var x=String(el.getAttribute('data-cm-v')).split(':'),k=P.v[x[0]];if(x.length!==2||k==null)return;var toon=per[x[0]][k]?k:'a';el.hidden=x[1]!==toon;if(!el.hidden)zien[x[0]]=toon});
[].forEach.call(D.querySelectorAll('[data-cm-proef]'),function(el){String(el.getAttribute('data-cm-proef')).split(/[\s,]+/).forEach(function(f){if(f&&P.v[f]!=null&&!zien[f])zien[f]=P.v[f]})});
h.classList.remove('cm-wacht')}
function stuur(e,x){if(!P)return;var b={site:site,pid:P.pid,d:P.d,r:P.r,e:e,c:ctx},k;for(k in x)b[k]=x[k];var body=JSON.stringify(b),u=O+'/api/mm/proefev';
if(e==='zie'&&W.fetch){fetch(u,{method:'POST',body:body,keepalive:true,credentials:'omit'}).then(function(r){return r.json()}).then(function(j){if(j&&(j.oud||j.uit)){ls(LK,null);if(j.uit){for(var f in P.v)P.v[f]='a';zet()}}})['catch'](function(){});return}
q(function(){if(!(N.sendBeacon&&N.sendBeacon(u,body))&&W.fetch)fetch(u,{method:'POST',body:body,keepalive:true,mode:'no-cors',credentials:'omit'})})}
function meld(){if(!P)return;zet();var v={},n=0,f;for(f in zien)if(!gestuurd[f]){gestuurd[f]=1;v[f]=zien[f];n++}if(n)stuur('zie',{v:v,sec:Math.round((Date.now()-t0)/1000)})}
function later(){clearTimeout(tm);tm=setTimeout(meld,250)}
function stappen(){var pa=location.pathname.toLowerCase(),kas=/checkout|afreken|kassa|betal/.test(pa),s={},stap=function(e,x){if(s[e])return;s[e]=1;stuur(e,x||{})};
var bet=function(){var el=D.querySelector('[data-cm-betaald]');if(el){stap('koop',{bedrag:parseFloat(String(el.getAttribute('data-cm-betaald')).replace(',','.'))||0});return 1}},nb=0;if(!bet()){var ib=setInterval(function(){if(bet()||++nb>10)clearInterval(ib)},1500)}
D.addEventListener('click',function(e){var m=e.target&&e.target.closest&&e.target.closest('[data-cm-stap]');if(m){var x=m.getAttribute('data-cm-stap');if(/^(veld|methode|betaal)$/.test(x))stap(x)}},true);
if(!kas)return;var vz=0,vt=D.visibilityState==='visible'?Date.now():0;D.addEventListener('visibilitychange',function(){if(D.visibilityState==='visible'){if(!vt)vt=Date.now()}else if(vt){vz+=Date.now()-vt;vt=0}});
var it=setInterval(function(){if(vz+(vt?Date.now()-vt:0)>=20000){stap('b20');clearInterval(it)}},1000);
D.addEventListener('focusin',function(e){var t=e.target;if(t&&/^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)&&!/radio|checkbox|hidden|submit|button/.test(t.type||''))stap('veld')},true);
D.addEventListener('change',function(e){var t=e.target;if(t&&(t.type==='radio'||t.tagName==='SELECT')){var n=((t.name||'')+' '+(t.value||'')+' '+(t.id||'')).toLowerCase();if(/pay|betaal|method|ideal|wero|paypal|card|kaart|klarna|bancontact|apple|google/.test(n))stap('methode')}},true);
D.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a,button,[role=button],input[type=submit],label,[data-method],[class*=pay-opt],[class*=method]');if(!a)return;var t=((a.innerText||a.value||'')+' '+(a.id||'')+' '+String(a.className||'')+' '+(a.getAttribute('data-method')||'')).toLowerCase();if(/ideal|wero|paypal|creditcard|betaalpas|klarna|bancontact|apple pay|google pay|andere betaal/.test(t)&&!/betalen\b/.test(t))stap('methode');if(a.tagName!=='LABEL'&&/betalen|pay now|bestelling plaatsen|place order/.test(t)&&!/snel afrekenen/.test(t))stap('betaal')},true);
W.addEventListener('blur',function(){var f=D.activeElement;if(f&&f.tagName==='IFRAME'){var n=((f.src||'')+' '+(f.name||'')+' '+(f.title||'')).toLowerCase();if(/paypal/.test(n))stap('betaal');else if(/stripe|klarna/.test(n))stap('methode')}})}
function start(){if(gestart)return;gestart=1;zet();var klaar=function(){meld();q(function(){D.dispatchEvent(new CustomEvent('cm:proef',{detail:P.v}))});if(W.MutationObserver){var mo=new MutationObserver(later);mo.observe(D.body||h,{childList:true,subtree:true});setTimeout(function(){mo.disconnect()},10000)}};if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',klaar);else klaar();stappen()}
if(P)start();else if(W.fetch){fetch(O+'/api/mm/proefkies?site='+encodeURIComponent(site)+'&c='+ctx,{credentials:'omit'}).then(function(r){return r.json()}).then(function(j){if(j&&j.ok&&j.aan&&j.pid){P={pid:j.pid,d:j.d,r:j.r,v:j.v,t:Date.now()};ls(LK,JSON.stringify(P));start()}else h.classList.remove('cm-wacht')})['catch'](function(){h.classList.remove('cm-wacht')})}
}catch(e){q(function(){document.documentElement.classList.remove('cm-wacht')})}})();`;
// Whop-pixel op kadoly.com (16 nov 2026, Kadoly op Meta via Whop Ads; lib/whop.js). Alleen op kadoly.com en pas na toestemming voor
// advertentiecookies (Google consent mode: ad_storage granted in dataLayer); zonder toestemming wordt er niets geladen.
const WH_JS = '(function(){try{if(!/(^|\\.)kadoly\\.com$/.test(location.hostname)||window.__whl)return;var B="' + (process.env.WHOP_BIZ_KADOLY || 'biz_gwtIgPUYUJOx2e') + '";function ok(){var d=window.dataLayer||[],g=null;for(var i=0;i<d.length;i++){var x=d[i];if(x&&x[0]==="consent"&&x[2]&&x[2].ad_storage)g=x[2].ad_storage}return g==="granted"}function laad(){if(window.__whl)return;window.__whl=1;!function(w,d,s,u,n,a,b){if(w[n])return;a=w[n]={q:[],t:+new Date,s:[],o:u,track:function(){a.q.push([+new Date].concat([].slice.call(arguments)))},setScope:function(){a.s=[].slice.call(arguments).filter(function(x){return typeof x==="string"});a.q.push([+new Date,"setScope"].concat(a.s))},scope:function(){var c=[].slice.call(arguments);return{track:function(){a.q.push([+new Date].concat([].slice.call(arguments)).concat([{__scope:c}]))}}}};b=d.createElement(s);b.async=1;b.src=u+"/s.js";d.getElementsByTagName(s)[0].parentNode.insertBefore(b,d.getElementsByTagName(s)[0])}(window,document,"script","https://t.whop.tw","whop");whop.setScope(B);whop.track("page")}if(ok())laad();else{var n=0,t=setInterval(function(){if(ok()){clearInterval(t);laad()}if(++n>180)clearInterval(t)},1000)}}catch(e){}})();';
// 17 nov 2026 (Henkjan: "Maak ook campagne voor Curacao day om in NL DE en CA abonnees te verzamelen ."): klik uit een Whop/Meta-advertentie
// (wacid) 7 dagen onthouden op curacao.day en de aanmeldpagina todayin.email/start/<taal> (en straks todayin surgery), en na een geslaagde aanmelding (POST /api/cw met actie mail of google, antwoord ok)
// één lead naar hjdk-api op=whlead, eenmaal per browser. Zelfde sleutel (cwwh) en klik-id (cwv) als het aanmeldblok in lib/cur.js, dus geen dubbele lead.
const WHL_JS = String.raw`(function(){try{var h=location.hostname.replace(/^www\./,""),P=h==="curacao.day"||(h==="todayin.email"&&/^\/(start|curacao)\b/.test(location.pathname))?"curacao":(h==="todayin.email"&&/^\/surgery/.test(location.pathname)?"surgery":"");if(!P||window.__whlh)return;window.__whlh=1;var WH=null;try{var q=new URLSearchParams(location.search);if(q.get("wacid")){WH={wacid:q.get("wacid"),wasid:q.get("wasid")||"",waid:q.get("waid")||"",fbclid:q.get("fbclid")||"",t:Date.now()};localStorage.setItem("cwwh",JSON.stringify(WH))}else{var o=JSON.parse(localStorage.getItem("cwwh")||"null");if(o&&Date.now()-o.t<6048e5)WH=o}}catch(x){}if(!WH)return;function eid(){var m=document.cookie.match(/cwv=([a-z0-9]+)/);if(m)return m[1];var v=localStorage.getItem("cwv")||localStorage.getItem("whv");if(!v){v=Math.random().toString(36).slice(2,12)+Date.now().toString(36).slice(-4);localStorage.setItem("whv",v)}return v}function lead(){try{if(localStorage.getItem("whlok"+P))return;localStorage.setItem("whlok"+P,"1");var u="https://whichtobuy.best/api/shop?op=whlead&p="+P+"&eid="+eid()+"&wacid="+encodeURIComponent(WH.wacid)+"&wasid="+encodeURIComponent(WH.wasid)+"&waid="+encodeURIComponent(WH.waid)+"&fbclid="+encodeURIComponent(WH.fbclid)+"&u="+encodeURIComponent(location.origin+location.pathname);if(!(navigator.sendBeacon&&navigator.sendBeacon(u)))(new Image()).src=u}catch(x){}}var f=window.fetch;if(!f)return;window.fetch=function(i,o){var p=f.apply(this,arguments);try{var url=typeof i==="string"?i:(i&&i.url)||"";if(/\/api\/(cw|tsc|surgery)/.test(url)&&o&&String(o.method||"").toUpperCase()==="POST"&&typeof o.body==="string"){var b=JSON.parse(o.body);if(b&&(b.actie==="mail"||b.actie==="google"||(b.email&&!b.actie))){p.then(function(r){return r.clone().json()}).then(function(j){if(j&&j.ok)lead()}).catch(function(){})}}}catch(x){}return p}}catch(e){}})();`;
const CM_JS = MMU_JS + '\n(function(){try{var cs=document.currentScript,u=new URL(location.href).searchParams;window.__cmMeet=!(cs&&cs.getAttribute("data-meet")==="0")&&((cs&&cs.getAttribute("data-meet")==="all")||!!(u.get("zone")||u.get("z")||u.get("zoneid")||u.get("subid")||u.get("clickid")||u.get("mmc")||u.get("gclid")||u.get("gbraid")||u.get("wbraid")||u.get("srsltid")||u.get("utm_source")))}catch(e){}})();\nif(window.__cmMeet){' + MM_JS + '}\n' + MMM_JS + '\n' + RT_JS + '\n' + PF_JS + '\n' + WH_JS + '\n' + WHL_JS + '\n' + KOOPCHECK_JS + '\n' + VL_SITE_JS;

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
  h += rij('Terugbetalingsdossier', idx.length > 0, idx.length ? 'laatste: ' + e(idx[0]) : 'eerste dossier vannacht 05:40 UTC', 'PropellerAds: elke ochtend zelf ingediend (Henkjan 13 nov).');
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
    h += '<p><b>Menszones</b> (zones met een actie, aanmelding, koop of lezer: nooit blokkeren)</p><div class="w">' + tabel(['netwerk', 'zone', 'bezoeken', 'echt', 'actie', 'aanmelding', 'koop'], (leer.menszones || []).map(m => [m.netwerk, m.zone, m.v, m.echt, m.actie, m.aanmelding, m.koop])) + '</div>';
    h += '<p><b>Lijkt op de winnaars</b> (kandidaten voor een eigen campagne of hoger bod, op jouw woord)</p><div class="w">' + tabel(['netwerk', 'zone', 'bezoeken', 'gelijkenis'], (leer.lijktOpWinnaar || []).slice(0, 15).map(m => [m.netwerk, m.zone, m.v, m.gelijkenis])) + '</div>';
    if (leer.voorspellers && leer.voorspellers.top) h += '<p><b>Wat een klik voorspelt</b> (' + e(leer.voorspellers.kliks) + ' kliks, ' + e(leer.voorspellers.bezoeken) + ' bezoeken, ' + e(leer.voorspellers.vondsten) + ' vondsten; alles op /api/mm/voorspel)</p><div class="w">' + tabel(['voorspeller'], leer.voorspellers.top.map(x => [x]).concat((leer.voorspellers.amazon || []).map(x => ['Amazon (zwak): ' + x]))) + '</div>';
    h += '<p><b>Botfarms</b>: ' + e(leer.botfarms.aantal) + ' vingerafdrukken. <b>Zelfde site via twee netwerken</b>: ' + e((leer.zelfdeSiteTweeNetwerken || []).length) + '</p>';
  }
  const idx = (((await kv.raw(['SMEMBERS', 'mm:terug:index']).catch(() => [])) || []).map(String)).sort().reverse().slice(0, 14);
  const dos = (await Promise.all(idx.map(k => kv.get('mm:terug:' + k).catch(() => null)))).filter(Boolean);
  h += '<h2>Terugbetaling (bewijs per klik; PropellerAds dient Clickmind elke ochtend zelf in)</h2><div class="w">' + tabel(['netwerk', 'dag', 'kliks via ons', 'verdacht', 'sterk bewijs', 'uiterlijk indienen', 'hoe', 'csv'], dos.map(x => [x.netwerk, x.van, x.kliksViaOns, x.verdacht + ' (' + x.pctVerdacht + '%)', x.sterkBewijs, x.uiterlijkIndienen || 'onbekend', x.indienen, '/api/mm/terugbetaling?net=' + x.netwerk + '&van=' + x.van + '&formaat=csv'])) + '</div>';
  h += '<h2>Leerlog</h2><div class="w">' + tabel(['ronde'], (log || []).map(x => [String(x)])) + '</div>';
  h += '<h2>Vandaag per netwerk (mensmeter)</h2><div class="w">' + tabel(['netwerk', 'bezoeken', 'via /go en /w', 'gemeten op pagina', 'mens', 'datacenter', 'headless'], Object.entries(st.netwerken || {}).map(([n, x]) => [n, x.bezoeken, x.viaGo, x.gemeten, p(x.mensPct), p(x.datacenterPct), p(x.headlessPct)])) + '</div>';
  return h + '</body></html>';
}

// ---- Henkjans schakelaar voor een modal (Henkjan 5 nov: "ik wil de modal ook op Kadoly.com zelf kunnen activeren") ----
// /api/mm/modalknop?site=kadoly op de beschermde vercel.app-host (Vercel-login): aan/uit, vormen aan/uit, voorbeeld per vorm op de echte site,
// en de cijfers van 14 dagen. Elke knop is een gewone link; na de wijziging terug naar dezelfde pagina.
async function modalKnop(req, res, q) {
  res.setHeader('cache-control', 'no-store');
  if (!beschermd(req)) return res.status(403).send('alleen via de beschermde vercel.app-host');
  const site = String(q('site') || 'kadoly').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30), terug = '/api/mm/modalknop?site=' + site;
  let m0 = await kv.get('mm:modal:' + site);
  if (!m0) return res.status(404).send('onbekende modal: ' + site);
  const { model, leer, momLeer, vormLeer, varLeer, rem, ...rest } = m0; let melding = '';
  if (q('aan') === '1' || q('aan') === '0') { const r = await bewaarModal(kv, { ...rest, uit: q('aan') !== '1' }); melding = r.ok ? (q('aan') === '1' ? 'Staat nu aan.' : 'Staat nu uit.') : 'Lukt niet: ' + r.fout; }
  else if (q('vorm') && VORMEN.includes(q('vorm')) && (q('v') === '1' || q('v') === '0')) {
    const nu = new Set(rest.vormen || ['midden']); if (q('v') === '1') nu.add(q('vorm')); else nu.delete(q('vorm'));
    if (!nu.size) melding = 'Minstens één vorm moet aan blijven.'; else { const r = await bewaarModal(kv, { ...rest, vormen: VORMEN.filter(v => nu.has(v)) }); melding = r.ok ? 'Vormen bijgewerkt.' : 'Lukt niet: ' + r.fout; }
  }
  if (melding) { res.statusCode = 302; res.setHeader('location', terug + '&m=' + encodeURIComponent(melding)); return res.end(); }
  const m = await leesModal(kv, site, true), st = await modalStand(kv, m, 14).catch(() => null), klaar = site !== 'kadoly' || !!(await kv.get('gk:nb:mailklaar').catch(() => 0));
  const e = esc, dom = m.domeinen[0], arm1 = (m.armen.find(a => a.soort !== 'geen') || {}).id || '';
  const voorbeeld = v => 'https://' + dom + (dom === 'kadoly.com' ? '/product/oc_4174004347453441' : '/') + '?mmc=1&mmm=' + encodeURIComponent(arm1 + '~v0~' + v);
  const getal = x => Number(x || 0).toLocaleString('nl-NL');
  const armRijen = (st || []).map(x => '<tr><td>' + e(x.soort === 'geen' ? 'niets tonen (controle)' : (m.armen.find(a => a.id === x.id) || {}).titel || x.id) + '</td><td>' + getal(x.n) + '</td><td>' + getal(x.toon) + '</td><td>' + getal(x.aanmelding) + '</td><td>' + getal(x.bevestigd) + '</td><td>' + getal(x.koop) + '</td></tr>').join('');
  const vormNaam = { midden: 'Midden', onder: 'Onderaan', hoek: 'Hoek', balk: 'Balk', blok: 'Blok in de pagina', vol: 'Volledig scherm' };
  const vormRijen = VORMEN.map(v => { const aan = (m.vormen || ['midden']).includes(v), x = st && st.vormen ? st.vormen.find(y => y.vorm === v) || {} : {};
    return '<tr><td><b>' + vormNaam[v] + '</b>' + (v === 'blok' ? '<br><small>alleen waar een plek staat</small>' : '') + '</td><td>' + getal(x.toon) + '</td><td>' + getal(x.aanmelding) + '</td><td><a class="k ' + (aan ? 'a' : 'u') + '" href="' + terug + '&vorm=' + v + '&v=' + (aan ? 0 : 1) + '">' + (aan ? 'Aan' : 'Uit') + '</a></td><td><a href="' + e(voorbeeld(v)) + '" target="_blank" rel="noopener">Bekijk</a></td></tr>'; }).join('');
  const status = m.uit ? 'UIT' : klaar ? 'AAN' : 'AAN, maar wacht';
  const html = '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Modal ' + e(site) + '</title><style>'
    + 'body{margin:0;background:#fff;color:#0f172a;font:16px/1.5 Inter,system-ui,-apple-system,sans-serif}main{max-width:720px;margin:0 auto;padding:24px 16px 48px}h1{font-size:26px;margin:0 0 4px}h2{font-size:18px;margin:32px 0 10px}'
    + '.st{display:inline-block;padding:4px 12px;border-radius:999px;font-weight:700;font-size:14px}.st.aan{background:#dcfce7;color:#166534}.st.uit{background:#fee2e2;color:#991b1b}.st.wacht{background:#fef3c7;color:#92400e}'
    + '.groot{display:block;text-align:center;margin:18px 0 6px;padding:16px;border-radius:12px;font-weight:700;font-size:18px;text-decoration:none;color:#fff;background:#1D9BF0}.groot.uitzet{background:#0f172a}'
    + '.m{background:#e0f2fe;border-radius:10px;padding:10px 14px;margin:14px 0}.w{background:#fef3c7;border-radius:10px;padding:10px 14px;margin:14px 0}'
    + 'table{width:100%;border-collapse:collapse;font-size:15px}td,th{padding:9px 6px;border-bottom:1px solid #e2e8f0;text-align:left;vertical-align:top}th{font-size:13px;color:#334155}td:nth-child(n+2),th:nth-child(n+2){text-align:right}'
    + 'a{color:#1D9BF0}.k{display:inline-block;min-width:44px;text-align:center;padding:4px 10px;border-radius:8px;font-weight:700;text-decoration:none}.k.a{background:#1D9BF0;color:#fff}.k.u{background:#fff;color:#0f172a;border:1px solid #cbd5e1}small{color:#475569}code{background:#f1f5f9;padding:2px 6px;border-radius:6px;font-size:13px;word-break:break-all}'
    + '</style></head><body><main>'
    + '<h1>Modal ' + e(site) + '</h1><span class="st ' + (m.uit ? 'uit' : klaar ? 'aan' : 'wacht') + '">' + status + '</span> <small>op ' + e(m.domeinen.join(', ')) + '</small>'
    + (q('m') ? '<p class="m">' + e(q('m')) + '</p>' : '')
    + (!klaar ? '<p class="w">Het verzendadres post.kadoly.com is nog niet bevestigd bij Resend. Tot dan toont de modal niets, ook als hij aan staat (anders kan de bevestigingsmail niet weg).</p>' : '')
    + '<a class="groot ' + (m.uit ? '' : 'uitzet') + '" href="' + terug + '&aan=' + (m.uit ? 1 : 0) + '">' + (m.uit ? 'Zet de modal aan' : 'Zet de modal uit') + '</a><small>Werkt binnen een minuut op de hele site. Altijd 15% van de bezoekers ziet niets, zodat je ziet of de modal verkoop kost.</small>'
    + '<h2>Vormen</h2><p><small>Tik op Aan of Uit. De modal leert zelf welke vorm het best werkt, per telefoon en computer. "Bekijk" toont die vorm meteen op ' + e(dom) + ', zonder dat het meetelt.</small></p>'
    + '<table><tr><th>Vorm</th><th>Getoond</th><th>Aanmeldingen</th><th></th><th></th></tr>' + vormRijen + '</table>'
    + '<h2>Laatste 14 dagen</h2><table><tr><th>Aanbod</th><th>Bezoekers</th><th>Getoond</th><th>Aangemeld</th><th>Bevestigd</th><th>Gekocht</th></tr>' + (armRijen || '<tr><td colspan="6">Nog geen bezoekers.</td></tr>') + '</table>'
    + '<h2>Op de site</h2><p><small>Deze regel in de &lt;head&gt; van elke pagina (bij Kadoly mag hij ook in het blok global_head in de admin):</small><br><code>&lt;script src="https://go.' + e(dom) + '/cm.js" data-site="yoors" data-modal="' + e(site) + '" async&gt;&lt;/script&gt;</code></p>'
    + '<p><small>Teksten, kleuren, momenten of pagina’s waar hij nooit komt wijzigen: zeg het Claude in de chat.</small></p>'
    + '</main></body></html>';
  res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(200).send(html);
}
