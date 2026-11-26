// WAM volgen staat los van een klacht. Clickmind meet pas na de bevestigde opslag.
// Geen automatische mail: toekomstige mail blijft langs de bestaande POST-controle lopen.
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { kv } from './db.js';
const JAAR = 365 * 86400;
// 26 nov 2026 (Henkjan: "En dan krijg je wekelijkse update van wat er bereikt is volledig transparant"): de toestemming noemt de weekupdate (stroom wam-week).
export const TOESTEMMING = 'WAM mag mij per e-mail informeren: elke week een open overzicht van wat er bereikt is, en bij nieuwe dossiers en bevestigde ontwikkelingen. Afmelden kan altijd.';
const hash = s => createHash('sha256').update(String(s)).digest('hex');
const SCOPE = new Set(['algemeen', 'blendle', 'anp', 'hosters', 'errezeta']);
export const volgScope = pad => SCOPE.has(String(pad).split('/').pop()) ? String(pad).split('/').pop() : 'algemeen';
export const lokaleDag = t => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Curacao', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(t));

export async function aanmelden(b, ip, db = kv, nu = Date.now(), pre = 'wmn:volg:') {
  const email = String(b?.email || '').trim().toLowerCase(), scope = String(b?.scope || 'algemeen');
  if (b?.toestemming !== true || !SCOPE.has(scope) || String(b?.website || '') || email.length > 254 || !/^[^\s@<>()[\],;:"]{1,64}@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,24}$/i.test(email)) return { ok: false, fout: 'Vul een geldig e-mailadres in.' };
  const rem = pre + 'rl:' + hash(ip || 'onbekend').slice(0, 24) + ':' + Math.floor(nu / 3600000);
  const n = Number(await db.incr(rem)); if (n === 1) await db.raw(['EXPIRE', rem, 3600]);
  if (n > 5) return { ok: false, fout: 'Probeer het later nog eens.' };
  const id = randomBytes(12).toString('hex'), tok = randomBytes(20).toString('hex'), zoek = pre + 'zoek:' + hash(email + '|' + scope);
  const waar = ['modal', 'knop', 'ikook', 'leger'].includes(b?.waar) ? b.waar : 'vast', arm = /^[a-z0-9-]{1,20}$/.test(String(b?.arm || '')) ? b.arm : 'a';
  const ref = /^[A-Za-z0-9_-]{6,16}$/.test(String(b?.ref || '')) ? String(b.ref) : '';
  const record = { email, scope, t: nu, waar, arm, ref, toestemming: TOESTEMMING, bewijs: hash(tok), mtok: randomBytes(20).toString('hex'), zoek }; // mtok: afmeldlink in mails (lib/wam-volgmail.js)
  const code = "if redis.call('EXISTS',KEYS[1])==1 then return 0 end; redis.call('ZREMRANGEBYSCORE',KEYS[3],'-inf',ARGV[4]); if redis.call('ZCARD',KEYS[3])>=10000 then return -1 end; redis.call('SET',KEYS[1],ARGV[1],'EX',ARGV[3]); redis.call('SET',KEYS[2],ARGV[2],'EX',ARGV[3]); redis.call('ZADD',KEYS[3],ARGV[5],ARGV[1]); redis.call('EXPIRE',KEYS[3],ARGV[3]); redis.call('HINCRBY',KEYS[4],ARGV[6],1); redis.call('EXPIRE',KEYS[4],5184000); return 1";
  const nieuw = Number(await db.raw(['EVAL', code, 4, zoek, pre + 'r:' + id, pre + 'lijst', pre + 'dag:' + lokaleDag(nu), id, JSON.stringify(record), JAAR, nu - JAAR * 1000, nu, waar + '|' + arm]));
  if (nieuw < 0) return { ok: false, fout: 'Aanmelden lukt nu niet. Probeer het later opnieuw.' };
  if (nieuw === 1) await db.raw(['HINCRBY', pre + 'scope', scope, 1]).catch(() => {}); // volgers per dossier, voor de Volg-knop (deelBlok)
  return { ok: true, nieuw: nieuw === 1, ...(nieuw === 1 ? { id, tok } : {}) };
}
export async function afmelden(b, db = kv, pre = 'wmn:volg:') {
  if (!/^[a-f0-9]{24}$/.test(String(b?.id || '')) || !/^[a-f0-9]{40}$/.test(String(b?.tok || ''))) return { ok: false, fout: 'Open je persoonlijke afmeldlink.' };
  const k = pre + 'r:' + b.id, r = await db.get(k);
  if (!r) return { ok: true };
  const a = Buffer.from(hash(b.tok)), c = Buffer.from(String(r.bewijs)), m1 = Buffer.from(String(b.tok)), m2 = Buffer.from(String(r.mtok || ''));
  const goed = (a.length === c.length && timingSafeEqual(a, c)) || (m1.length === m2.length && m2.length === 40 && timingSafeEqual(m1, m2));
  if (!goed) return { ok: false, fout: 'Deze afmeldlink klopt niet.' };
  await db.raw(['EVAL', "if redis.call('GET',KEYS[2])==ARGV[1] then redis.call('DEL',KEYS[2]) end; redis.call('DEL',KEYS[1]); redis.call('ZREM',KEYS[3],ARGV[1]); return 1", 3, k, r.zoek, pre + 'lijst', b.id]);
  if (r.scope) await db.raw(['HINCRBY', pre + 'scope', String(r.scope), -1]).catch(() => {});
  if (db === kv && r.email) await import('./mailmind.js').then(M => M.blokkeer(r.email)).catch(() => {}); // afgemeld = ook nergens meer mail via Mailmind
  return { ok: true };
}
// Volgers per dossier (Henkjan 25 nov 2026: "Zet aantal volgers erbij"). Teller wmn:volg:scope, +1 bij een nieuwe aanmelding, -1 bij afmelden.
// Bestaat de teller nog niet, dan wordt hij één keer opgebouwd uit de lijst met records (wmn:volg:scopeklaar).
export async function volgersStand(db = kv, pre = 'wmn:volg:') {
  const lees = async () => { const r = await db.raw(['HGETALL', pre + 'scope']); const o = Array.isArray(r) ? Object.fromEntries(Array.from({ length: r.length / 2 }, (_, i) => [r[2 * i], r[2 * i + 1]])) : (r || {}); return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.max(0, Number(v) || 0)])); };
  if (await db.get(pre + 'scopeklaar')) return lees();
  const ids = await db.raw(['ZRANGE', pre + 'lijst', 0, -1]).catch(() => []), tel = {};
  for (let i = 0; i < (ids || []).length; i += 200) { const deel = ids.slice(i, i + 200), rs = await db.raw(['MGET', ...deel.map(id => pre + 'r:' + id)]).catch(() => []); for (const x of rs || []) { try { const r = typeof x === 'string' ? JSON.parse(x) : x; if (r && r.scope) tel[r.scope] = (tel[r.scope] || 0) + 1; } catch {} } }
  await db.raw(['DEL', pre + 'scope']).catch(() => {}); for (const [k, n] of Object.entries(tel)) await db.raw(['HSET', pre + 'scope', k, n]).catch(() => {});
  await db.set(pre + 'scopeklaar', 1);
  return tel;
}
export async function aanmeldStand(d, db = kv) {
  const r = await db.raw(['HGETALL', 'wmn:volg:dag:' + d]);
  return Object.fromEntries(Array.isArray(r) ? Array.from({ length: r.length / 2 }, (_, i) => [r[2*i], Number(r[2*i+1])]) : Object.entries(r || {}).map(([k,v]) => [k, Number(v)]));
}
export async function aanmeldProef(db = kv) {
  const pre = 'wmn:volg:qa:' + randomBytes(6).toString('hex') + ':', sleutels = new Set(), controles = [];
  const k = x => { if (typeof x === 'string' && x.startsWith(pre)) sleutels.add(x); };
  const proefDb = { get: async x => { k(x); return db.get(x); }, incr: async x => { k(x); return db.incr(x); }, raw: async a => { a.forEach(k); return db.raw(a); } };
  const check = (naam, v) => { controles.push({ naam, ok: !!v }); if (!v) throw Error(naam); };
  try {
    const b = { email: 'qa@example.invalid', scope: 'algemeen', toestemming: true, waar: 'vast' };
    check('toestemming verplicht', !(await aanmelden({ ...b, toestemming: false }, 'qa', proefDb, Date.now(), pre)).ok);
    const r = await aanmelden(b, 'qa', proefDb, Date.now(), pre); check('opgeslagen', r.ok && r.nieuw && r.id && r.tok);
    const oud = await aanmelden(b, 'qa', proefDb, Date.now(), pre); check('dubbel telt niet opnieuw', oud.ok && !oud.nieuw);
    check('besloten record', (await proefDb.get(pre + 'r:' + r.id))?.email === b.email);
    check('verkeerde wislink geweigerd', !(await afmelden({ id: r.id, tok: '0'.repeat(40) }, proefDb, pre)).ok);
    check('afmelden werkt', (await afmelden(r, proefDb, pre)).ok && !await proefDb.get(pre + 'r:' + r.id));
    return { ok: true, controles, mailVerstuurd: false, alleenProefnaamruimte: true };
  } catch (e) { return { ok: false, controles, fout: e.message }; }
  finally { await db.del([...sleutels]); }
}

export function volgBlok(pad, titel = '') {
  const scope = volgScope(pad), onderwerp = { blendle: 'Blendle', anp: 'ANP', hosters: 'hosting', errezeta: 'Errezeta Publishing' }[scope];
  return '<section class="volg" id="volgen" aria-labelledby="volg-kop" data-cm-plek="volgen"><h2 id="volg-kop">' + (titel || (onderwerp ? 'Volg het dossier over ' + onderwerp + '.' : 'Hoor het als er iets verandert.')) + '</h2><p>Elke week een open overzicht van wat er bereikt is, en een mail bij elke nieuwe stap.</p><form class="volg-form" method="post" action="/api/wam?op=daanmelden" data-scope="' + scope + '" data-cm-proef="volgknop"><label class="sr-only" for="volg-email">Je e-mailadres</label><div class="composer"><input id="volg-email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254" placeholder="Je e-mailadres"><button type="submit" class="primary"><span data-cm-v="volgknop:a">Houd me op de hoogte</span><span data-cm-v="volgknop:b" hidden>Ik blijf betrokken</span><span aria-hidden="true"> →</span></button></div><label class="trap" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label><p class="consent-note">Met aanmelden geef je toestemming voor de weekupdate en de dossiermails. <a href="/privacy#updates">Afmelden en privacy</a>.</p></form><p class="msg" role="status"></p></section>';
}

// Aansluiten bij We Are Many zelf, in het eerste scherm van de voorkant (Henkjan 26 nov 2026: "Ze kunnen ook algemeen We are many volgen en bij het leger
// gaan horen wat werkelijk dingen gaat veranderen hoe organisaties met klanten om gaan"). Kop, belofte en knop leren elk los (Clickmind-proef wmn,
// factoren lkop, lbelofte, lknop; waarde tik 1, aanmelding 100). Scope algemeen: weekupdate plus elke nieuwe stap in elk dossier.
export const LEGER = {
  lkop: ['Sluit je aan. Samen staan we sterker.', 'Eén klacht negeren ze. Honderd niet.', 'Jij bent niet de enige. Doe mee.'], // 26 nov: b en c vervangen (0 aanmeldingen), nu kracht, onrecht, herkenning
  lbelofte: ['Elke week een open overzicht: wat we bereikten, wat bedrijven antwoordden en wat nog openstaat.', 'Eén mail per week met de echte cijfers, ook als het tegenzit. Afmelden met een klik.'],
  lknop: ['Ik doe mee', 'Sluit me aan', 'Stuur me de weekupdate']
};
const varianten = (f, l, el = 'span') => l.map((t, i) => '<' + el + ' data-cm-v="' + f + ':' + 'abcd'[i] + '"' + (i ? ' hidden' : '') + '>' + t + '</' + el + '>').join('');
export function legerBlok() {
  return '<section class="volg leger" id="aansluiten" aria-labelledby="leger-kop"><h2 id="leger-kop">' + varianten('lkop', LEGER.lkop) + '</h2><p>' + varianten('lbelofte', LEGER.lbelofte) + '</p>'
    + '<form class="volg-form leger-form" method="post" action="/api/wam?op=daanmelden" data-scope="algemeen" data-waar="leger" data-cm-proef="lknop"><label class="sr-only" for="leger-email">Je e-mailadres</label><div class="composer"><input id="leger-email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254" placeholder="Je e-mailadres"><button type="submit" class="primary">' + varianten('lknop', LEGER.lknop) + '<span aria-hidden="true"> →</span></button></div><label class="trap" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label><p class="consent-note">Weekupdate en een mail bij elke nieuwe stap. Afmelden kan altijd. <a href="/privacy#updates">Privacy</a>.</p></form><p class="msg" role="status"></p></section>';
}

export const VOLG_JS = String.raw`(function(){
var W=window,D=document,scope=D.querySelector('.volg-form');
/* doorsturen meten (26 nov 2026): r=<tok> uit de doorstuurlink bewaren en het bezoek een keer melden */
try{var rr=new URLSearchParams(location.search).get('r');if(rr&&/^[A-Za-z0-9_-]{6,16}$/.test(rr)){sessionStorage.setItem('wmnr',rr);localStorage.setItem('wmnr',rr);if(!sessionStorage.getItem('wmnr-m')){sessionStorage.setItem('wmnr-m','1');fetch('/api/wam?op=dref',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({r:rr}),keepalive:true}).catch(function(){})}}}catch(x){}
function meet(e){try{var p=JSON.parse(localStorage.getItem('cmpf')||'null');if(p&&p.pid&&p.v)fetch('/api/mm/proefev',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({site:'wmn',pid:p.pid,d:p.d,r:p.r,e:e,c:/iPhone|iPad/.test(navigator.userAgent)?'i':/Android/.test(navigator.userAgent)?'a':'d'}),keepalive:true}).catch(function(){})}catch(x){}}
function uitkomst(soort){try{if(typeof W.mmUitkomst==='function')W.mmUitkomst(soort)}catch(x){}var n=0;async function stuur(){var m=W.mensmeter;if(++n>12)return;if(m&&/^[a-f0-9]{8,24}$/.test(m.vid||'')){try{var r=await fetch('/api/mm/puit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({vid:m.vid,soort:soort,antwoord:true}),keepalive:true}),j=await r.json();if(j&&j.ok)return;if(j&&j.fout&&j.fout!=='onbekend bezoek')return}catch(x){}}setTimeout(stuur,500)}stuur()}
W.wamMeetActie=function(){uitkomst('actie')};
W.wamSlaOp=function(email,ctx){return slaOp(email,ctx||{waar:'ikook'})};W.wamUitkomst=uitkomst;W.wamMeet=meet;
async function slaOp(email,ctx){var r=await fetch('/api/wam?op=daanmelden',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ref:(function(){try{return sessionStorage.getItem('wmnr')||localStorage.getItem('wmnr')||''}catch(x){return ''}})(),email:email,scope:ctx.scope||(scope?scope.dataset.scope:'algemeen'),toestemming:true,website:ctx.website||'',waar:ctx.waar,arm:ctx.arm||'a'})}),j=await r.json();if(!r.ok||!j.ok)throw Error(j.fout||'Aanmelden lukt nu niet. Probeer het later opnieuw.');try{localStorage.setItem('mmqa:wmn','1')}catch(x){}if(j.nieuw){uitkomst('aanmelding');meet('aanmelding')}return j}
W.mmAanmelden=async function(email,ctx){try{var j=await slaOp(email,{waar:'modal',arm:ctx&&ctx.arm});toonWis(j,D.querySelector('.volg .msg'));return {ok:!!j.ok,nieuw:j.nieuw}}catch(x){return false}};
function toonWis(j,m){if(!m)return;m.textContent='Je aanmelding is opgeslagen. ';if(j.id&&j.tok){var a=D.createElement('a');a.href='/afmelden#'+j.id+'.'+j.tok;a.textContent='Bewaar je persoonlijke afmeldlink.';m.appendChild(a)}}
D.querySelectorAll('.volg-form').forEach(function(f){f.addEventListener('submit',async function(e){e.preventDefault();var b=f.querySelector('button'),m=f.parentElement.querySelector('[role=status]'),v=new FormData(f);b.disabled=true;m.textContent='Even opslaan…';try{var pf=f.dataset.cmProef||'volgknop',j=await slaOp(v.get('email'),{waar:f.dataset.waar||'vast',scope:f.dataset.scope,arm:pf+'-'+(typeof W.cmProef==='function'?W.cmProef(pf)||'a':'a'),website:v.get('website')});f.hidden=true;toonWis(j,m)}catch(x){m.textContent=x.message;b.disabled=false}})});
function kanMelden(){return ('serviceWorker' in navigator)&&('PushManager' in W)&&('Notification' in W)&&Notification.permission!=='denied'}
function b64(s){var p='='.repeat((4-s.length%4)%4),r=atob((s+p).replace(/-/g,'+').replace(/_/g,'/')),o=new Uint8Array(r.length);for(var i=0;i<r.length;i++)o[i]=r.charCodeAt(i);return o}
function meldVolg(b,blok){var sc=scope?scope.dataset.scope:'algemeen';return Promise.resolve(Notification.requestPermission()).then(function(p){if(p!=='granted')return false;return Promise.all([navigator.serviceWorker.register('/sw.js').then(function(){return navigator.serviceWorker.ready}),fetch('/api/wam?op=dvapid').then(function(r){return r.json()})]).then(function(x){var reg=x[0];return reg.pushManager.getSubscription().then(function(s){return s||reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64(x[1].k)})}).then(function(s){return fetch('/api/wam?op=dpushvolg',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({sub:s.toJSON(),scope:sc})}).then(function(r){return r.json()}).then(function(j){if(!j.ok)return false;if(j.nieuw){uitkomst('aanmelding');meet('aanmelding')}
var m=D.createElement('p');m.className='msg volg-klaar';m.setAttribute('role','status');m.textContent='Je volgt dit dossier. Je krijgt één melding bij elke nieuwe stap.';blok.parentNode.insertBefore(m,blok.nextSibling);b.querySelector('span').textContent='Je volgt';
try{reg.showNotification('Je volgt dit dossier',{body:'Je krijgt hier één melding bij elke nieuwe stap.',icon:'/api/wam?op=beeld&h=regelaar&t=en&v=icon'})}catch(e){}return true})})})}).catch(function(){return false})}
W.wamKanMelden=kanMelden;W.wamMeld=meldVolg;
D.querySelectorAll('.leger-form input[type=email]').forEach(function(x){x.addEventListener('focus',function(){if(x.dataset.t)return;x.dataset.t='1';meet('tik');uitkomst('actie')})});
/* 25 nov 2026 (Henkjan: "aanmelden optimaliseren"): de Volg-knop bovenaan opent het e-mailveld op de plek zelf, in plaats van naar het formulier onderaan te springen (betaalde bezoekers zijn binnen seconden weg). Aanmelding telt als waar=knop. De knop in de kop (geen .deel) springt nog naar onderen. */
D.querySelectorAll('[data-volg]').forEach(function(b){b.addEventListener('click',function(ev){var f=D.querySelector('.volg-form'),blok=b.closest&&b.closest('.deel');if(!f)return;ev.preventDefault();meet('tik');uitkomst('actie');
if(!blok){f.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});f.querySelector('input[type=email]').focus({preventScroll:true});return}
var i=D.getElementById('volg-hier');if(i){var ii=i.querySelector('input');if(ii)ii.focus();return}
/* één tik: browsermelding als de browser het kan (Android, desktop; iPhone alleen als app op het beginscherm), anders het e-mailveld */
if(kanMelden()&&!b.dataset.geenPush){b.disabled=true;meldVolg(b,blok).then(function(ok){b.disabled=false;if(!ok){b.dataset.geenPush='1';b.click()}});return}
i=D.createElement('form');i.id='volg-hier';i.className='volg-hier';i.setAttribute('novalidate','');i.innerHTML='<label class="sr-only" for="volg-hier-email">Je e-mailadres</label><div class="composer"><input id="volg-hier-email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254" placeholder="Je e-mailadres"><button type="submit" class="primary">Volg</button></div><p class="consent-note">Weekupdate en een mail bij elke nieuwe stap. Afmelden kan altijd. <a href="/privacy#updates">Privacy</a>.</p><p class="msg" role="status"></p>';
blok.parentNode.insertBefore(i,blok.nextSibling);var e=i.querySelector('input');e.focus();
i.addEventListener('submit',async function(x){x.preventDefault();var k=i.querySelector('button'),m=i.querySelector('[role=status]'),v=String(e.value||'').trim();if(!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)){m.textContent='Vul een geldig e-mailadres in.';e.focus();return}k.disabled=true;m.textContent='Even opslaan…';
try{await slaOp(v,{waar:'knop',arm:'a'});i.querySelector('.composer').hidden=true;i.querySelector('.consent-note').hidden=true;m.textContent='Gelukt. Je krijgt een mail van Henkjan met hoe je dit dossier sterker maakt.'}catch(y){m.textContent=y.message;k.disabled=false}})})});
})();`;
export function afmeldPagina() { return { pad: '/afmelden', noindex: true, titel: 'Afmelden voor WAM', desc: 'Verwijder je aanmelding voor dossierupdates.', body: '<main id="inhoud"><h1>Afmelden voor updates.</h1><p>Met je persoonlijke link verwijderen we je e-mailadres en je aanmelding.</p><button class="primary" id="afmelden" hidden>Verwijder mijn aanmelding</button><p id="afmeld-status" role="status"></p></main>', script: String.raw`(function(){var b=document.getElementById('afmelden'),m=document.getElementById('afmeld-status'),a=location.hash.slice(1).split('.');if(!/^[a-f0-9]{24}$/.test(a[0]||'')||!/^[a-f0-9]{40}$/.test(a[1]||'')){m.textContent='Open de persoonlijke afmeldlink die je bij het aanmelden kreeg.';return}b.hidden=false;b.onclick=async function(){b.disabled=true;try{var r=await fetch('/api/wam?op=dafmelden',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:a[0],tok:a[1]})}),j=await r.json();if(!j.ok)throw Error(j.fout);b.hidden=true;m.textContent='Je bent afgemeld. Je e-mailadres is verwijderd.';history.replaceState(null,'','/afmelden')}catch(x){m.textContent=x.message||'Afmelden lukt nu niet. Probeer het later opnieuw.';b.disabled=false}}})();` }; }
