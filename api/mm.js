// MENSMETER (Henkjan 14 okt 2026): zit er een echt mens achter een advertentieklik? Eén meting voor alle netwerken.
//   /mm.js               browserscript (insluiten op een landingspagina):
//                        <script src="https://whichtobuy.best/mm.js" data-net="mondiad" data-zone="[zoneid]" data-campaign="[campaignid]" data-subid="[clickid]" async></script>
//                        zonder data-attributen leest het de pagina-URL (src/net/utm_source, zone/z/zoneid, campaign/c/cid, subid/clickid/k, cr)
//   /api/mm/b            ontvanger van de beacons (POST text/plain JSON; testen: GET ?test=1&j=<json> met net=test)
//   /go                  klikregister voor Amazon (een advertentie heeft maar één link). Parameters:
//                        k=<zoekterm> of a=<ASIN> of u=<Amazon-URL>, m=com|de|co.uk|ca..., tag=<tag>, tag2=<tag voor de 302-variant>, split=<% naar 302, standaard 50 als tag2 er is>,
//                        n=<netwerk> c=<campagne> z=<zone> s=<klik-id netwerk> b=<advertentie> p=<voorvoegsel ascsubtag>
//                        Elke klik: klik-id (cid) in de ascsubtag (p-cid-zone), persoons-id in eigen cookie (mmp), alle serversignalen naar het register.
//                        Variant js: een lege meetpagina die in ~150 ms browsersignalen meet (vingerafdruk, WebGL, scherm, batterij, netwerk, ...) en doorstuurt.
//                        Variant 302: direct door. Per persoon vast, zodat de Associates-cijfers per tag de varianten eerlijk vergelijken.
//   /api/mm/proef?dagen=1               de /go-proef per campagne, variant en tag
//   /api/mm/export?dag=JJJJ-MM-DD&van=0 ruwe regels (alleen op de beschermde vercel.app-host)
//   /api/mm/persoon?pid=<16 hex>        alle kliks van één persoon (alleen op de beschermde vercel.app-host)
//   /api/mm/zones?net=mondiad&dagen=3   oordeel per zone (zelfde vorm als rereview /api/b/zones, leesbaar voor de Mondiad-wacht)
//   /api/mm/patronen?dagen=1            botfarms: vingerafdrukken in veel zones of netwerken
//   /api/mm/stand                       vandaag per netwerk, slechtste zones, datacenterlijst
// Regels, opslag en uitleg: lib/mensmeter.js.
import { kv } from '../lib/db.js';
import { verwerkBeacon, verwerkKlik, amazonBouw, armVoor, nieuwId, serverSignalen, laterAf, schoon, tagOk, zones, patronen, stand, proef, exporteer, persoon, netNaam } from '../lib/mensmeter.js';

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
      if (op === 'export') return res.status(200).json(await exporteer(kv, { d: q('dag'), van: q('van'), n: q('n') }));
      const p = await persoon(kv, q('pid')); return p ? res.status(200).json(p) : res.status(400).json({ ok: false, fout: 'pid = 16 hex' });
    }
    if (op === 'zones') { res.setHeader('cache-control', 'no-store'); return res.status(200).json(await zones(kv, { net: q('net') || '', dagen: q('dagen') })); }
    if (op === 'patronen') { res.setHeader('cache-control', 'no-store'); return res.status(200).json(await patronen(kv, { dagen: q('dagen') })); }
    if (op === 'stand') { res.setHeader('cache-control', 'no-store'); return res.status(200).json(await stand(kv)); }
    return res.status(200).json({ ok: true, mensmeter: ['/mm.js', '/api/mm/b', '/go?k=<zoekterm>&tag=<tag>&tag2=<tag 302>&n=&c=&z=&s=&b=&p=', '/api/mm/zones?net=&dagen=3', '/api/mm/patronen?dagen=1', '/api/mm/stand', '/api/mm/proef?dagen=1'] });
  } catch (e) {
    if (op === 'go') { const d = noodDoel(q); if (d) { res.statusCode = 302; res.setHeader('location', d); return res.end(); } }
    if (op === 'b') return res.status(204).end();
    return res.status(500).json({ ok: false, fout: String(e && e.message || e).slice(0, 300) });
  }
}

// export en persoon alleen via *.vercel.app: die host zit achter Vercel-inlog (ssoProtection all_except_custom_domains)
const beschermd = req => /\.vercel\.app$/i.test(String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]) && /\.vercel\.app$/i.test(String(req.headers.host || '').split(':')[0]);
const leesCookie = (req, naam) => { const m = new RegExp('(?:^|;\\s*)' + naam + '=([^;]+)').exec(String(req.headers.cookie || '')); return m ? decodeURIComponent(m[1]) : ''; };
// bij een fout altijd nog naar Amazon (met de eerste tag), nooit een kapotte klik
function noodDoel(q) { try { return amazonBouw({ k: q('k'), a: q('a'), u: q('u'), m: q('m'), tag: q('tag'), sub: (q('p') || 'go') + '-x-' + schoon(q('z')) }); } catch (e) { return null; } }

async function goKlik(req, res, url, q) {
  res.setHeader('cache-control', 'no-store, private'); res.setHeader('x-robots-tag', 'noindex, nofollow'); res.setHeader('referrer-policy', 'no-referrer');
  const tag1 = q('tag'), tag2 = tagOk(q('tag2')) ? q('tag2') : '';
  if (!tagOk(tag1) || !(q('k') || q('a') || q('u'))) { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(400).send('Ongeldige link: nodig zijn tag=<Amazon-tag> en k=<zoekterm>, a=<ASIN> of u=<Amazon-URL>.'); }
  let pid = leesCookie(req, 'mmp'); const nieuw = !/^[0-9a-f]{16}$/.test(pid); if (nieuw) pid = nieuwId(8);
  const split = tag2 ? (q('split') == null || q('split') === '' ? 50 : Number(q('split'))) : (q('v') === '302' ? 100 : 0);
  const arm = armVoor(pid, split), tag = arm === '302' && tag2 ? tag2 : tag1;
  const cid = nieuwId(6), z = schoon(q('z')), pre = String(q('p') || 'go').replace(/[^A-Za-z0-9]/g, '').slice(0, 8) || 'go';
  const doel = amazonBouw({ k: q('k'), a: q('a'), u: q('u'), m: q('m'), tag, sub: pre + '-' + cid + '-' + (z === '-' ? 'x' : z) });
  if (!doel) { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(400).send('Ongeldige doel-URL of markt.'); }
  res.setHeader('set-cookie', 'mmp=' + pid + '; Max-Age=15552000; Path=/; Secure; HttpOnly; SameSite=Lax');
  const ctx = { cid, pid, net: netNaam(q('n')), zone: z, camp: schoon(q('c')), arm, tag, cr: schoon(q('b')) };
  const prefetch = /prefetch|prerender/i.test(String(req.headers['sec-purpose'] || req.headers.purpose || ''));
  if ((req.method === 'GET' || req.method === 'HEAD') && !prefetch) {
    const werk = laterAf(verwerkKlik(kv, { cid, pid, nieuw, arm, tag, net: q('n'), camp: q('c'), zone: q('z'), sub: q('s'), cr: q('b'), kw: q('k') || q('a') || '', doel, p: pre }, serverSignalen(req)).catch(e => { console.log('mm go fout', String(e && e.message || e)); }));
    await Promise.race([werk, new Promise(r => setTimeout(r, 300))]);
  }
  if (arm === '302' || req.method === 'HEAD') { res.statusCode = 302; res.setHeader('location', doel); return res.end(); }
  res.setHeader('content-type', 'text/html; charset=utf-8');
  return res.status(200).send(meetPagina(doel, ctx));
}

// De meetpagina: leeg wit scherm, meet in ~150 ms wat de browser over zichzelf zegt, stuurt dat met sendBeacon en gaat door naar Amazon.
// Alles in try/catch; een vangnet stuurt na 600 ms hoe dan ook door, en zonder JavaScript doet de noscript-refresh het.
function meetPagina(doel, ctx) {
  const J = x => JSON.stringify(x).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, '');
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><meta name="robots" content="noindex,nofollow"><title>Amazon</title>'
    + '<noscript><meta http-equiv="refresh" content="0;url=' + esc(doel) + '"></noscript>'
    + '<style>html,body{margin:0;background:#fff}p{font:15px system-ui,-apple-system,sans-serif;color:#666;padding:24px;opacity:0;animation:z .2s 1.2s forwards}@keyframes z{to{opacity:1}}a{color:#06c}</style></head>'
    + '<body><p>Opening Amazon&hellip; <a href="' + esc(doel) + '" rel="noreferrer">Continue</a></p>'
    + '<script>var DOEL=' + J(doel) + ',CTX=' + J(ctx) + ';try{setTimeout(function(){location.replace(DOEL)},600)}catch(e){}</script>'
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
