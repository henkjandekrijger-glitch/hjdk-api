// Verlanglijst om door te sturen (Henkjan 27 nov 2026: "Voer alles door", voorstel 2 van de 10 organische voorstellen).
// Iemand kiest Kadoly-producten voor zijn verlanglijst (Sinterklaas tot en met 5 december, daarna Kerst) en stuurt de lijst via WhatsApp naar
// familie. Wie de lijst opent, tikt Koop dit cadeau: dat zet het cadeau 48 uur vast (anderen zien "Iemand koopt dit al", de maker ziet niets) en
// opent de winkel via Clickmind (/o?k=wa&p=<pid>&c=vl<code>). Onderaan: "Maak je eigen verlanglijst" (de lijst verspreidt zich zelf).
// Trend achter dit idee: YouTube-video's met Wishlist plus Christmas/Santa in de titel ruim 90 mln weergaven (Google Holiday Shopping Trends 2026).
// 27 nov 2026, tweede ronde (Henkjan: "Na zoeken moet ik weer hele lijst zien oid  Zet ux team hierop en nu echt goed maken . En voor kadoly
// look design beter door ."), op advies van een UX-team (interactie, gedrag en conversie, Kadoly-huisstijl):
// - Kadoly-look: kop met merkteken, Inter, knoppen #111827 met hoek 12px en hoogte 52px, lijnen #E6E8EB, één tekstmaat 16px, nooit grijs.
// - Zoeken: eerst in de geladen producten, bij minder dan 4 treffers in de hele winkel (/api/shop/lijst?zoek=); woorden vanaf 5 letters zonder
//   -en, -s, -jes, -tjes (kaarsen vindt geurkaars). Tijdens zoeken vervangt één regel de categorieën: '3 voor "theepot"' met de knop Toon alles;
//   na een keuze '... staat op je lijst'. Toon alles en Alles wissen het zoekwoord; gekozen producten staan dan vooraan.
// - Niets gevonden (pas na het antwoord van de winkel): 'Niets voor "x". Kadoly zoekt mee:' en de chat eronder stelt de vraag zelf (bij Enter of na 1,5 s).
// - De lerende chat van Kadoly (lib/kzux.js, slug verlanglijst) staat na de eerste 8 producten; bij een categorie of zoekwoord is hij weg.
// - Naam pas bij versturen: Stuur je lijst opent in de balk het veld Je voornaam, de groene knop Stuur via WhatsApp en Kopieer de link.
//   De lijst wordt dan al aangemaakt (code plus sleutel, de sleutel blijft op het toestel); latere wijzigingen en de naam gaan met de sleutel mee.
// - Familiepagina: één knop per cadeau, voortgang, vertrouwensregel, og-voorbeeld voor WhatsApp, "Zelf iets wensen?"; de maker ziet hoe vaak
//   zijn lijst geopend is.
// Opslag: kd:vl:<code> { naam, feest, pids, at, van, sl (hash van de sleutel), zie, gekocht: { pid: tijd } } 120 dagen.
// Tellers sh-vl-maak, sh-vl-view, sh-vl-koop, sh-vl-b-<ev> (zoek, cat, alles, chat, chatadd, wa, kopieer).
// Paden: go.kadoly.com/verlanglijst (maken) en go.kadoly.com/verlanglijst/<code> (bekijken), via op=lijst in fn/shop.js; aanroepen vanuit de
// pagina via /api/shop/lijst en /o (go.kadoly.com stuurt andere paden door naar kadoly.com, vercel.json).
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const num = x => Number(x) || 0;
const eur = n => '€ ' + num(n).toFixed(2).replace('.', ',');
export const VL_MAX = 12;
export const VAST_UREN = 48; // zo lang staat een cadeau vast na Koop dit cadeau
export function feestNu(t = new Date()) { return t.getUTCMonth() === 10 || (t.getUTCMonth() === 11 && t.getUTCDate() < 6) ? 'Sinterklaas' : 'Kerst'; }
export const prijsVan = i => Math.round((num(i.p) + (num(i.vk) || 0)) * 100) / 100;
const CATNAAM = { wonen: 'Wonen', hobby: 'Hobby', kids: 'Kinderen', tech: 'Tech', beauty: 'Beauty', mode: 'Mode', keuken: 'Keuken', cadeaus: 'Cadeaus', dieren: 'Dieren', buiten: 'Buiten en sport', eten: 'Eten en drinken', overig: 'Overig' };
export const catVan = i => { const c = String((i && i.c) || 'overig').toLowerCase().trim(); return c === 'sport' || c === 'tuin' ? 'buiten' : CATNAAM[c] ? c : 'overig'; };
export const stam = w => { if (w.length >= 5) { w = w.replace(/(tjes|jes)$/, ''); if (w.length >= 5) w = w.replace(/(en|s)$/, ''); } return w; };
const woorden = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
const basisOk = i => i && i.id && i.img && i.t && i.vr !== false;

// Keuze voor de maakpagina: leverbaar, met foto, marge vanaf € 5, all-in € 10 tot € 80, hooguit 2 per merk.
// Volgorde: trend eerst, dan wat all-in € 10 tot € 40 kost (een dure eerste rij wekt wantrouwen, advies UX-team), dan marge.
export function kiesProducten(items, trendPids = [], n = 120) {
  const trend = new Set(trendPids || []), perMerk = {};
  const ok = (items || []).filter(i => basisOk(i) && num(i.mg) >= 5 && prijsVan(i) >= 10 && prijsVan(i) <= 80);
  const sc = i => (trend.has(i.id) ? 1000 : 0) + (prijsVan(i) <= 40 ? 100 : 0) + Math.min(num(i.mg), 99);
  ok.sort((a, b) => sc(b) - sc(a));
  const uit = []; for (const i of ok) { const m = String(i.b || '-'); if ((perMerk[m] || 0) >= 2) continue; perMerk[m] = (perMerk[m] || 0) + 1; uit.push(i); if (uit.length >= n) break; }
  return uit;
}
// Zoeken in de hele winkel: elk zoekwoord (zonder meervoud) moet in titel, merk of soort staan; titel telt zwaarder. All-in € 5 tot € 250.
export function zoekProducten(items, q, n = 24) {
  const qw = woorden(q).map(stam).filter(w => w.length >= 2).slice(0, 6); if (!qw.length) return [];
  const uit = [];
  for (const i of items || []) {
    if (!basisOk(i)) continue; const pr = prijsVan(i); if (pr < 5 || pr > 250) continue;
    const tw = woorden(i.t), rest = woorden([i.b, i.c, i.s].filter(Boolean).join(' ')), past = x => w => x === w || (w.length >= 4 && x.includes(w)); let s = 0, alle = true;
    for (const w of qw) { const inT = tw.some(x => past(x)(w)), inR = rest.some(x => past(x)(w)); if (inT) s += 3; else if (inR) s += 1; else alle = false; }
    if (alle && s) uit.push({ i, s });
  }
  uit.sort((a, b) => b.s - a.s || num(b.i.mg) - num(a.i.mg));
  return uit.slice(0, n).map(x => kaartData(x.i));
}
export const kaartData = i => ({ id: i.id, t: i.t, img: i.img, p: prijsVan(i), c: catVan(i), z: woorden([i.t, i.b, i.c, i.s].filter(Boolean).join(' ')).join(' ') });
export function schoonLijst(b, items) {
  const bekend = new Set((items || []).map(i => i.id)); const pids = [...new Set((Array.isArray(b && b.pids) ? b.pids : []).map(String))].filter(p => bekend.has(p)).slice(0, VL_MAX);
  const naam = String((b && b.naam) || '').replace(/[<>"]/g, '').trim().slice(0, 24);
  const van = String((b && b.van) || '').replace(/[^a-z0-9]/gi, '').slice(0, 8);
  return { pids, naam, van };
}
export const vastNu = (lijst, pid, nu = Date.now()) => { const t = num(lijst && lijst.gekocht && lijst.gekocht[pid]); return t > 0 && nu - t < VAST_UREN * 3600e3; };

// ---------- Kadoly-look (gemeten van kadoly.com: Inter, #0B0D12, knoppen #111827, lijnen #E6E8EB, hoek 12px, merkteken #1D9BF0) ----------
const MERK = '<svg width="32" height="32" viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="9" fill="#1D9BF0"/><path d="M9 13h14M19 9l4 4-4 4" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M25 21H11M15 25l-4-4 4-4" stroke="#D6ECFC" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';
const ZOEKICOON = '<svg class="zi" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
const WA_ICOON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z"/></svg>';
const CSS = `:root{--tx:#0B0D12;--p:#111827;--ph:#262F3F;--ln:#E6E8EB;--ln2:#D4D7DD;--s1:0 1px 2px rgba(16,24,40,.05);--s2:0 10px 28px -10px rgba(16,24,40,.22)}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;background:#fff;color:var(--tx);font:400 16px/1.5 Inter,-apple-system,"Segoe UI",Roboto,sans-serif}
.wrap{max-width:560px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
.kk{position:sticky;top:0;z-index:10;background:#fff;border-bottom:1px solid var(--ln)}.km{display:inline-flex;align-items:center;gap:8px;height:60px;font-size:20px;font-weight:700;letter-spacing:-.02em;color:var(--tx);text-decoration:none}
.vl{padding-top:20px;padding-bottom:120px}h1{font-size:26px;line-height:1.2;font-weight:700;letter-spacing:-.02em;margin:0 0 8px;text-wrap:balance}h2{font-size:20px;line-height:1.25;font-weight:700;margin:0 0 8px}p{margin:0 0 12px}
.uitleg{margin:0 0 16px}a{color:var(--tx)}:focus-visible{outline:2px solid var(--p);outline-offset:2px}
.naam,.zk{display:block;width:100%;height:52px;border:1.5px solid var(--p);border-radius:12px;padding:0 14px;font:inherit;font-weight:700;color:var(--tx);background:#fff;box-shadow:var(--s1);-webkit-appearance:none;appearance:none}
.naam::placeholder,.zk::placeholder{color:var(--p);font-weight:400;opacity:1}.zk::-webkit-search-cancel-button{display:none}
.zv{position:relative;margin:0 0 12px}.zv .zk{padding-left:44px}.zv .zi{position:absolute;left:14px;top:16px;pointer-events:none}
.cats{display:flex;gap:8px;overflow-x:auto;padding:2px 0 14px;scrollbar-width:none}.cats::-webkit-scrollbar{display:none}
.cats button,.pil{flex:0 0 auto;min-height:40px;padding:0 16px;border:1px solid var(--ln2);border-radius:999px;background:#fff;color:var(--tx);font:inherit;cursor:pointer;white-space:nowrap}.cats button.aan,.pil.zw{background:var(--p);border-color:var(--p);color:#fff;font-weight:700}
.st{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:40px;margin:2px 0 14px}.st span{font-weight:700;min-width:0}
.pg{display:grid;grid-template-columns:1fr 1fr;gap:12px}.pc{position:relative;display:flex;flex-direction:column;border:1px solid var(--ln);border-radius:12px;box-shadow:var(--s1);background:#fff;overflow:hidden;text-align:left;padding:0;font:inherit;color:var(--tx);cursor:pointer}
.pc img{display:block;width:100%;aspect-ratio:1/1;object-fit:cover;background:#fff}.pt{display:-webkit-box;padding:10px 12px 0;line-height:1.35;min-height:calc(2.7em + 10px);-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.pp{display:block;padding:4px 12px 12px;font-weight:700}
.pc .v,.vl-add i{position:absolute;top:8px;right:8px;width:32px;height:32px;border-radius:50%;border:1.5px solid var(--p);background:#fff;color:var(--p);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;font-style:normal;box-shadow:var(--s1)}
.pc.aan{border-color:var(--p);box-shadow:0 0 0 1px var(--p),var(--s2)}.pc.aan .v{background:var(--p);color:#fff}
.vchat{grid-column:1/-1;margin:20px 0;padding:24px 0;border-top:1px solid var(--ln);border-bottom:1px solid var(--ln)}.vchat .kx{margin:0}.vchat .kx-s:empty{display:none}
.vchat .kx-h{font-size:20px!important;font-weight:700!important;color:var(--tx)!important}.vchat p.kx-s{font-size:16px!important;font-weight:400!important;color:var(--tx)!important}
.vchat .kx-ps button,.vchat .kx-cp button,.vchat .kx-cp a{min-height:40px!important;padding:0 16px!important;border:1px solid var(--ln2)!important;border-radius:999px!important;background:#fff!important;color:var(--tx)!important;font-size:16px!important;font-weight:400!important}
#vchat #kx form.kx-f{height:52px!important;border:1.5px solid var(--p)!important;border-radius:12px!important;padding:4px 4px 4px 14px!important;box-shadow:var(--s1)!important}#vchat #kx form.kx-f input{font-size:16px!important;color:var(--tx)!important}#vchat #kx form.kx-f input::placeholder{color:var(--p)!important;opacity:1!important}
#vchat #kx form.kx-f button{width:44px!important;height:44px!important;border-radius:8px!important;background:var(--p)!important}
.vchat .kx-pr{border:1px solid var(--ln)!important;border-radius:12px!important;box-shadow:var(--s1)!important}.vchat .kx-ik{background:var(--p)!important;color:#fff!important}
.vl-add{position:relative;display:grid!important;grid-template-columns:56px 1fr;gap:12px;align-items:center;width:100%;min-height:76px;padding:10px 56px 10px 12px!important;border:0;border-top:1px solid var(--ln);background:#fff;font:inherit;color:var(--tx)!important;text-align:left;cursor:pointer}.vl-add:first-child{border-top:0}
.vl-add img,.vl-add .kx-pi{width:56px!important;height:56px!important;border-radius:8px;object-fit:cover;background:#fff}.vl-add b{display:block;font-weight:400!important;font-size:16px!important}.vl-add small{display:block;font-size:16px!important;font-weight:700!important;color:var(--tx)!important}.vl-add i{top:50%;margin-top:-16px;right:12px}
.vl-add.aan{box-shadow:inset 0 0 0 2px var(--p)}.vl-add.aan i{background:var(--p);color:#fff}
.balk{position:fixed;left:0;right:0;bottom:0;z-index:20;background:#fff;border-top:1px solid var(--ln);box-shadow:0 -10px 28px -10px rgba(16,24,40,.22);padding:12px 0;padding-bottom:max(12px,env(safe-area-inset-bottom,0px))}.balk .wrap{display:flex;flex-direction:column;gap:10px}
.knop,.rand{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;height:52px;padding:0 20px;border-radius:12px;font:inherit;font-weight:700;text-decoration:none;cursor:pointer}
.knop{border:0;background:var(--p);color:#fff}.knop:hover{background:var(--ph)}.knop.wa{background:#25D366;color:var(--tx)}.rand{border:1.5px solid var(--p);background:#fff;color:var(--p)}
.links{display:flex;justify-content:space-between;gap:12px}.lk{border:0;background:none;padding:6px 0;font:inherit;font-weight:700;color:var(--tx);text-decoration:underline;cursor:pointer}
.stand{font-weight:700;margin:0}.vb{height:6px;border-radius:999px;background:var(--ln);margin:8px 0 16px}.vb i{display:block;height:100%;border-radius:inherit;background:var(--p)}
.rij{display:grid;grid-template-columns:88px 1fr;gap:12px;padding:12px;margin:0 0 12px;border:1px solid var(--ln);border-radius:12px;box-shadow:var(--s1);background:#fff}.rij img{width:88px;height:88px;border-radius:8px;object-fit:cover;background:#fff}
.rij .t{margin:0 0 4px;line-height:1.35}.rij .k{grid-column:1/-1}.al{font-weight:700;margin:4px 0 0}
.fam .vl{padding-bottom:24px}.fam .vt{padding-bottom:max(28px,env(safe-area-inset-bottom,0px))}.zelf{margin:24px 0 0;padding:24px 0 0;border-top:1px solid var(--ln)}.vt{border-top:1px solid var(--ln);padding:28px 0 calc(110px + env(safe-area-inset-bottom,0px))}.vt p{margin:0 0 8px}
.bl{display:flex;flex-wrap:wrap;gap:8px;list-style:none;padding:0;margin:12px 0}.bl li{height:32px;padding:0 10px;display:flex;align-items:center;border:1px solid var(--ln);border-radius:8px;font-weight:700}
.vk{display:inline-flex;align-items:center;gap:6px;font-weight:700;text-decoration:none}[hidden]{display:none!important}`;
const kop = (titel, extraHead = '', bodyKlas = '') => `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#ffffff"><title>${esc(titel)} | Kadoly</title>${extraHead}<link rel="icon" type="image/svg+xml" href="https://cdn.kadoly.com/icon/shop/shop-mark.svg?v=1"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap"><style>${CSS}</style><script src="/cm.js" data-site="kadolylijst" async></script></head><body${bodyKlas ? ` class="${bodyKlas}"` : ''}><header class="kk"><div class="wrap"><a class="km" href="https://kadoly.com/shop">${MERK}Kadoly</a></div></header>`;
const VINK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>';
const voet = `<footer class="vt"><div class="wrap"><p><b>Bijzondere spullen en cadeaus, veilig besteld.</b></p><p><a class="vk" href="https://www.webwinkelkeur.nl/webshop/Kadoly_1226796" target="_blank" rel="noopener">${VINK}Gekeurd door WebwinkelKeur</a></p><ul class="bl"><li>iDEAL | Wero</li><li>PayPal</li><li>Klarna</li><li>Creditcard</li></ul><p>Kadoly by AdsFair B.V. · KvK 60126035 · Gouda · <a href="https://kadoly.com/shop/privacy">Privacy</a></p></div></footer>`;

// ---------- maakpagina ----------
const MAAK_JS = String.raw`(function(){var C=window.__VL,gekozen=[],CAT='',Q='',code='',sl='',DK='vl-concept',zt=0,at=0,zq='',vroeg={},laatst='',wacht=false,pg=document.getElementById('pg'),zk=document.getElementById('zk'),cats=document.getElementById('cats'),st=document.getElementById('st'),stt=document.getElementById('stt'),ch=document.getElementById('vchat'),bLeeg=document.getElementById('b0'),bKies=document.getElementById('b1'),bOpen=document.getElementById('b2'),s=document.getElementById('s'),wa=document.getElementById('wa'),n=document.getElementById('n');
function b(e){try{navigator.sendBeacon('/api/shop/lijst?b='+e,'')}catch(x){}}
function esc(t){return String(t).replace(/[&<>"]/g,function(x){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[x]})}
function eur(v){return '€ '+Number(v||0).toFixed(2).replace('.',',')}
function stam(w){if(w.length>=5){w=w.replace(/(tjes|jes)$/,'');if(w.length>=5)w=w.replace(/(en|s)$/,'')}return w}
function ws(t){return String(t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(function(x){return x.length>=2})}
function bewaar(){try{localStorage.setItem(DK,JSON.stringify({p:gekozen,n:n.value,code:code,sl:sl,t:Date.now()}))}catch(x){}}
function kaart(x,voor){var k=document.createElement('button');k.type='button';k.className='pc';k.setAttribute('data-p',x.id);k.setAttribute('data-c',x.c||'');k.setAttribute('data-z',x.z||ws(x.t).join(' '));k.innerHTML='<img src="'+esc(x.img||'')+'" alt="" loading="lazy" width="300" height="300"><span class="v" aria-hidden="true">+</span><span class="pt">'+esc(x.t)+'</span><span class="pp">'+esc(x.pt||eur(x.p))+'</span>';if(voor)pg.insertBefore(k,pg.firstChild);else pg.insertBefore(k,null);if(gekozen.indexOf(x.id)>=0)zetK(k,true);return k}
function zetK(k,on){k.classList.toggle('aan',on);k.querySelector('.v').textContent=on?'✓':'+';k.setAttribute('aria-pressed',on?'true':'false')}
function naamVan(p){var k=pg.querySelector('.pc[data-p="'+p+'"] .pt');return k?k.textContent:''}
function balk(){var g=gekozen.length;if(!bOpen.hidden&&g)return;bOpen.hidden=true;bLeeg.hidden=!!g;bKies.hidden=!g;s.textContent='Stuur je lijst ('+g+')'}
function wissel(p,aan){var i=gekozen.indexOf(p),k=pg.querySelector('.pc[data-p="'+p+'"]');if(i>=0&&aan!==true){gekozen.splice(i,1);if(k)zetK(k,false)}else if(i<0&&aan!==false){if(gekozen.length>=C.max){stt.textContent='Je lijst is vol: hooguit '+C.max+' cadeaus';st.hidden=false;return false}gekozen.push(p);if(k)zetK(k,true);if(Q)laatst=p}ververs();if(Q)status();return true}
function ververs(){[].forEach.call(document.querySelectorAll('.vl-add'),function(a){var on=gekozen.indexOf(a.getAttribute('data-p'))>=0;a.classList.toggle('aan',on);var i=a.querySelector('i');if(i)i.textContent=on?'✓':'+'});balk();bewaar()}
pg.addEventListener('click',function(e){var k=e.target.closest('.pc');if(k)wissel(k.getAttribute('data-p'))});
function zichtbaar(){var qw=ws(Q).map(stam),aantal=0;[].forEach.call(pg.querySelectorAll('.pc'),function(k){var z=' '+(k.getAttribute('data-z')||''),ok=(!CAT||k.getAttribute('data-c')===CAT)&&qw.every(function(x){return x.length>=4?z.indexOf(x)>=0:z.indexOf(' '+x)>=0});k.hidden=!ok;if(ok)aantal++});return aantal}
function chatPlek(aantal){if(!ch)return;if(Q){ch.hidden=!(aantal===0&&!wacht);if(!ch.hidden)pg.insertBefore(ch,pg.firstChild);return}if(CAT){ch.hidden=true;return}ch.hidden=false;var zk2=[].filter.call(pg.querySelectorAll('.pc'),function(k){return !k.hidden});var na=zk2[Math.min(7,zk2.length-1)];if(na&&na.nextSibling!==ch)pg.insertBefore(ch,na.nextSibling)}
function status(){var aantal=zichtbaar();chatPlek(aantal);if(!Q){st.hidden=true;if(cats)cats.hidden=false;return aantal}if(cats)cats.hidden=true;st.hidden=false;if(laatst&&gekozen.indexOf(laatst)>=0)stt.textContent=naamVan(laatst)+' staat op je lijst';else if(aantal)stt.textContent=aantal+' voor "'+Q+'"';else stt.textContent=wacht?'Zoeken in de hele winkel...':'Niets voor "'+Q+'". Kadoly zoekt mee:';return aantal}
function vooraan(){for(var i=gekozen.length-1;i>=0;i--){var k=pg.querySelector('.pc[data-p="'+gekozen[i]+'"]');if(k)pg.insertBefore(k,pg.firstChild)}}
function vraagChat(){if(!Q||vroeg[Q]||!window.__kx)return;vroeg[Q]=1;b('chat');try{window.__kx.vraag('Ik zoek '+Q+' voor mijn verlanglijst')}catch(x){}}
function zoek(){Q=zk.value.trim();laatst='';clearTimeout(zt);clearTimeout(at);wacht=false;var aantal=status();if(Q.length<3||aantal>=4||Q===zq)return;wacht=true;status();zt=setTimeout(function(){var q=Q;zq=q;b('zoek');fetch('/api/shop/lijst?zoek='+encodeURIComponent(q)).then(function(r){return r.json()}).then(function(j){if(Q!==q)return;(j&&j.items||[]).forEach(function(x){if(!pg.querySelector('.pc[data-p="'+x.id+'"]'))kaart(x)})}).catch(function(){}).then(function(){if(Q!==q)return;wacht=false;var a=status();if(!a)at=setTimeout(vraagChat,1500)})},350)}
function alles(){zk.value='';Q='';zq='';laatst='';CAT='';wacht=false;if(cats)[].forEach.call(cats.children,function(x){x.classList.toggle('aan',!x.getAttribute('data-c'))});vooraan();status();b('alles');try{window.scrollTo({top:Math.max(0,pg.getBoundingClientRect().top+window.pageYOffset-140),behavior:'smooth'})}catch(x){}}
zk.addEventListener('input',zoek);zk.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();zk.blur();if(!wacht&&!zichtbaar()){clearTimeout(at);vraagChat()}}});
document.getElementById('alles').addEventListener('click',alles);
if(cats)cats.addEventListener('click',function(e){var c=e.target.closest('button');if(!c)return;CAT=c.getAttribute('data-c')||'';[].forEach.call(cats.children,function(x){x.classList.toggle('aan',x===c)});if(zk.value){zk.value='';Q=''}vooraan();status();b('cat')});
bLeeg.addEventListener('click',function(){try{window.scrollTo({top:Math.max(0,pg.getBoundingClientRect().top+window.pageYOffset-140),behavior:'smooth'})}catch(x){}});
window.__kxNa=function(el,j){[].forEach.call(el.querySelectorAll('a.kx-pk'),function(a){var m=(a.getAttribute('href')||'').match(/\/naar\/([^?&#]+)/);if(!m)return;var p=decodeURIComponent(m[1]),x=(j.producten||[]).filter(function(y){return y.u===a.getAttribute('href')})[0]||{},k=document.createElement('button');k.type='button';k.className='kx-pk vl-add';k.setAttribute('data-p',p);k.innerHTML=a.innerHTML;var i=k.querySelector('i');if(!i){i=document.createElement('i');k.appendChild(i)}i.textContent='+';i.setAttribute('aria-label','Op mijn lijst');k.addEventListener('click',function(){if(!pg.querySelector('.pc[data-p="'+p+'"]'))kaart({id:p,t:x.n||'',img:x.i||'',pt:String(x.p||'').split(' incl')[0],c:'',z:ws(x.n).join(' ')},true).hidden=!!(Q||CAT);if(wissel(p)!==false)b('chatadd')});a.parentNode.replaceChild(k,a)});ververs()};
function bewaarLijst(cb){var body=JSON.stringify({pids:gekozen,naam:n.value,van:C.van,code:code||undefined,sl:sl||undefined});fetch('/api/shop/lijst',{method:'POST',headers:{'content-type':'application/json'},body:body}).then(function(r){return r.json()}).then(function(j){if(!j||!j.ok)throw 0;code=j.code;if(j.sl)sl=j.sl;try{localStorage.setItem('vl-eigen-'+code,'1');localStorage.setItem('vl-naam',n.value||'')}catch(x){}bewaar();cb&&cb(j)}).catch(function(){wa.textContent='Opnieuw proberen';wa.removeAttribute('href')})}
function url(){return location.origin+'/verlanglijst/'+code}
function waTekst(f){return 'Dit is mijn verlanglijstje voor '+f+'. Tik op wat jij geeft, dan koopt niemand hetzelfde en blijft het een verrassing: '+url()}
s.addEventListener('click',function(){if(!gekozen.length)return;bKies.hidden=true;bOpen.hidden=false;wa.removeAttribute('href');wa.innerHTML='Even geduld...';try{if(!n.value)n.value=localStorage.getItem('vl-naam')||''}catch(x){}bewaarLijst(function(j){wa.href='https://wa.me/?text='+encodeURIComponent(waTekst(j.feest||C.feest));wa.innerHTML=C.waIcoon+'Stuur via WhatsApp';document.getElementById('zie').href='/verlanglijst/'+code})});
wa.addEventListener('click',function(e){if(!wa.getAttribute('href')){e.preventDefault();if(wa.textContent==='Opnieuw proberen')s.click();return}b('wa');try{localStorage.setItem('vl-naam',n.value||'');navigator.sendBeacon('/api/shop/lijst',new Blob([JSON.stringify({pids:gekozen,naam:n.value,van:C.van,code:code,sl:sl})],{type:'text/plain'}))}catch(x){}document.getElementById('zie').hidden=false});
document.getElementById('kop').addEventListener('click',function(){var k=this;if(!code)return;b('kopieer');try{navigator.clipboard.writeText(url()).then(function(){k.textContent='Gekopieerd'},function(){k.textContent=url()})}catch(x){k.textContent=url()}});
document.getElementById('terug').addEventListener('click',function(){bOpen.hidden=true;balk()});
var oud=null;try{oud=JSON.parse(localStorage.getItem(DK)||'null')}catch(x){}if(oud&&Date.now()-oud.t<14*864e5){code=oud.code||'';sl=oud.sl||'';if(oud.n)n.value=oud.n;(oud.p||[]).forEach(function(p){if(pg.querySelector('.pc[data-p="'+p+'"]'))wissel(p,true)})}
C.start.forEach(function(p){wissel(p,true)});vooraan();status();balk()})();`;

export function maakPagina({ items = [], van = '', feest = feestNu(), start = [], chat = '' }) {
  const kaart = i => { const d = kaartData(i); return `<button type="button" class="pc" data-p="${esc(d.id)}" data-c="${esc(d.c)}" data-z="${esc(d.z)}" aria-pressed="false"><img src="${esc(d.img)}" alt="" loading="lazy" width="300" height="300"><span class="v" aria-hidden="true">+</span><span class="pt">${esc(d.t)}</span><span class="pp">${esc(eur(d.p))}</span></button>`; };
  const tel = {}; for (const i of items) { const c = catVan(i); tel[c] = (tel[c] || 0) + 1; }
  const cats = Object.entries(tel).filter(([c, n]) => n >= 3 && c !== 'overig').sort((a, b) => b[1] - a[1]).map(([c]) => c);
  const cfg = JSON.stringify({ van, feest, start: start || [], max: VL_MAX, waIcoon: WA_ICOON }).replace(/</g, '\\u003c');
  return kop('Maak je verlanglijstje voor ' + feest) + `<div class="wrap vl" role="main">
<h1>Maak je verlanglijstje voor ${esc(feest)}</h1>
<p class="uitleg">Tik op + bij wat je wilt en stuur je lijst via WhatsApp. Wat je familie koopt, zie jij niet.</p>
<div class="zv">${ZOEKICOON}<input class="zk" id="zk" type="search" enterkeyhint="search" placeholder="Zoek, bijvoorbeeld kaars of koken" maxlength="60" autocomplete="off" aria-label="Zoek in de winkel"></div>
${cats.length ? `<div class="cats" id="cats"><button type="button" class="aan" data-c="">Alles</button>${cats.map(c => `<button type="button" data-c="${esc(c)}">${esc(CATNAAM[c])}</button>`).join('')}</div>` : ''}
<div class="st" id="st" hidden><span id="stt" aria-live="polite"></span><button type="button" class="pil zw" id="alles">Toon alles</button></div>
<div class="pg" id="pg">${items.map(kaart).join('')}${chat ? `<div class="vchat" id="vchat">${chat}</div>` : ''}</div>
</div>
<div class="balk"><div class="wrap">
<button type="button" class="rand" id="b0">Tik op + bij wat je wilt</button>
<div id="b1" hidden><button type="button" class="knop" id="s">Stuur je lijst</button></div>
<div id="b2" hidden style="display:flex;flex-direction:column;gap:10px"><input class="naam" id="n" placeholder="Je voornaam" maxlength="24" autocomplete="given-name" aria-label="Je voornaam"><a class="knop wa" id="wa">Stuur via WhatsApp</a><div class="links"><button type="button" class="lk" id="terug">Nog iets kiezen</button><button type="button" class="lk" id="kop">Kopieer de link</button><a class="lk" id="zie" hidden>Bekijk je lijst</a></div></div>
</div></div>
${voet}
<script>window.__VL=${cfg};${MAAK_JS}</script></body></html>`;
}

// ---------- familiepagina ----------
export function lijstPagina({ lijst, items = [], code = '', host = 'go.kadoly.com', nu = Date.now() }) {
  const per = Object.fromEntries(items.map(i => [i.id, i])); const alle = (lijst.pids || []).map(p => per[p]).filter(Boolean);
  const vast = i => vastNu(lijst, i.id, nu);
  const rijen = alle.filter(i => !vast(i)).concat(alle.filter(vast)); // al gekozen naar achteren
  const naam = lijst.naam || '', feest = lijst.feest || 'Sinterklaas';
  const titel = 'Verlanglijstje' + (naam ? ' van ' + naam : '') + ' voor ' + feest;
  const nVast = alle.filter(vast).length;
  const prijzen = alle.map(prijsVan).sort((a, b) => a - b);
  const ogBeschr = alle.length ? alle.length + (alle.length === 1 ? ' cadeau van ' + eur(prijzen[0]) : ' cadeaus van ' + eur(prijzen[0]) + ' tot ' + eur(prijzen[prijzen.length - 1])) + '. Tik op wat jij geeft, ' + (naam || 'de maker') + ' ziet het niet.' : 'Tik op wat jij geeft.';
  const og = `<meta property="og:type" content="website"><meta property="og:title" content="${esc(titel)}"><meta property="og:description" content="${esc(ogBeschr)}"><meta property="og:url" content="https://${esc(host)}/verlanglijst/${esc(code)}">${alle[0] ? `<meta property="og:image" content="${esc(alle[0].img)}">` : ''}<meta name="twitter:card" content="summary_large_image">`;
  const rij = i => { const al = vast(i);
    return `<div class="rij" data-p="${esc(i.id)}"><img src="${esc(i.img)}" alt="" loading="lazy" width="88" height="88"><div><p class="t">${esc(i.t)}</p><b>${esc(eur(prijsVan(i)))}</b>${al ? `<p class="al">${VINK} Iemand koopt dit al</p>` : ''}</div>${al ? '' : `<div class="k"><a class="knop koop" href="/o?k=wa&amp;p=${encodeURIComponent(i.id)}&amp;c=vl${esc(code)}">Koop dit cadeau</a></div>`}</div>`; };
  return kop(titel, og, 'fam') + `<div class="wrap vl" role="main">
<h1>${esc(titel)}</h1>
<p class="uitleg" id="uitleg">Tik op Koop dit cadeau bij wat jij geeft. Dan zien de anderen dat het al gekozen is, en ${esc(naam || 'de maker')} ziet niets.</p>
${nVast ? `<div id="stand"><p class="stand">${nVast} van de ${alle.length} ${alle.length === 1 ? 'cadeau' : 'cadeaus'} ${nVast === 1 ? 'is' : 'zijn'} al gekozen</p><div class="vb"><i style="width:${Math.round(100 * nVast / Math.max(1, alle.length))}%"></i></div></div>` : ''}
<div id="eigen" hidden><p class="stand" id="geopend" hidden></p><a class="knop wa" id="wa" href="#">${WA_ICOON}Stuur je lijst via WhatsApp</a><div class="links"><span></span><button type="button" class="lk" id="kop">Kopieer de link</button></div><p></p></div>
${rijen.map(rij).join('')}
<p>Je bestelt zelf bij Kadoly. Prijzen zijn inclusief verzending. Betalen met iDEAL, PayPal of Klarna, 14 dagen retour.</p>
<div class="zelf"><h2>Zelf iets wensen?</h2><p>Maak in een minuut je eigen lijstje en stuur het door.</p><a class="knop" href="/verlanglijst?van=${esc(code)}">Maak je eigen verlanglijst</a></div>
</div>${voet}
<script>(function(){var C=${JSON.stringify(code)},Z=${num(lijst.zie)},eigen=false;try{eigen=!!localStorage.getItem('vl-eigen-'+C)}catch(x){}
if(eigen){[].forEach.call(document.querySelectorAll('.k,.al'),function(e){e.hidden=true});var sd=document.getElementById('stand');if(sd)sd.hidden=true;document.getElementById('uitleg').textContent='Dit is jouw lijst. Wat je familie kiest, zie jij niet.';var zf=document.querySelector('.zelf');if(zf)zf.hidden=true;
var u=location.origin+location.pathname,e=document.getElementById('eigen');e.hidden=false;if(Z>0){var g=document.getElementById('geopend');g.textContent='Je lijst is '+Z+' keer geopend. Stuur hem ook naar wie hem nog niet heeft.';g.hidden=false}
document.getElementById('wa').href='https://wa.me/?text='+encodeURIComponent('Dit is mijn verlanglijstje. Tik op wat jij geeft, dan koopt niemand hetzelfde en blijft het een verrassing: '+u);var kp=document.getElementById('kop');kp.addEventListener('click',function(){try{navigator.clipboard.writeText(u).then(function(){kp.textContent='Gekopieerd'},function(){kp.textContent=u})}catch(x){kp.textContent=u}})}
else{try{navigator.sendBeacon('/api/shop/lijst?l='+C+'&zie=1','')}catch(x){}}
[].forEach.call(document.querySelectorAll('a.koop'),function(a){a.addEventListener('click',function(){var p=a.closest('.rij').getAttribute('data-p');try{navigator.sendBeacon('/api/shop/lijst?l='+C+'&koop='+encodeURIComponent(p),'')}catch(x){}})})})();</script></body></html>`;
}
