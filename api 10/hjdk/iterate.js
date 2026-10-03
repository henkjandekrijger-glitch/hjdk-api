// AUTO-ITERATIE: draait elke nacht (Vercel cron) of handmatig (GET met header x-hjdk-token).
// 1) leest alle tellers uit KV  2) zet verliezers uit  3) laat Claude nieuwe uitdagers bedenken  4) schrijft de config.
// Werkt ZONDER geheimen: nieuwe uitdagers komen uit een ingebouwde, eerlijke tekstpool. Met ANTHROPIC_API_KEY (optioneel) bedenkt Claude ze.
// Zonder HJDK_TOKEN/CRON_SECRET is het endpoint open maar begrensd: max 1 run per 6 uur (KV-slot).
import { kv } from '../../lib/db.js';

const MIN_GROUP_IMP = 150;   // pas leren/genereren als een groep (kind+winkel+categorie+taal) zoveel vertoningen heeft
const MIN_ARM_IMP   = 100;   // een variant kan pas afvallen na zoveel vertoningen
const LOSER_RATIO   = 0.5;   // afvallen als CTR < 50% van de beste
const MAX_LIST      = 10;    // max varianten per lijst
const NEW_PER_LIST  = 3;     // nieuwe uitdagers per ronde
const MAX_GROUPS    = 12;    // max Claude-aanroepen per run (kostenrem)
const ORDER_WEIGHT  = 20;    // 1 order telt als 20 klikken

// Ingebouwde standaardteksten van de engine (zelfde volgorde => zelfde ids i0,i1,...). Houd gelijk met de engine!
const DEFAULTS = {
  gen: {
    ban:  { bol:{ nl:['Bekijk bij bol →','Prijs van vandaag bij bol →','Bekijk de details bij bol →','Check de voorraad bij bol →','Vergelijk bij bol →','Lees de reviews bij bol →'] },
            amazon:{ nl:['Bekijk op Amazon →','Prijs van vandaag op Amazon →','Bekijk de details op Amazon →','Check de voorraad op Amazon →'],
                     en:['See it on Amazon →',"Today's price on Amazon →",'See the details on Amazon →','Check availability on Amazon →','Compare on Amazon →','Read the reviews on Amazon →'],
                     de:['Auf Amazon ansehen →','Heutiger Preis auf Amazon →','Details auf Amazon ansehen →'], fr:['Voir sur Amazon →','Prix du jour sur Amazon →'] } },
    hook: { bol:{ nl:['', 'Eerst even kijken, dan pas kopen:', 'Twijfel je nog? Kijk hier:'] },
            amazon:{ nl:['', 'Eerst even kijken, dan pas kopen:', 'Twijfel je nog? Kijk hier:'], en:['', 'Before you buy, take a quick look:', 'Still deciding? See it here:'], de:['', 'Vor dem Kauf kurz ansehen:'], fr:['', 'À voir avant d’acheter :'] } },
    mod:  { bol:{ nl:[ {eye:'Keuzehulp',h:'Bekijk dit bij bol',p:'prijs van vandaag bij bol',cta:'Bekijk bij bol →'},{eye:'Keuzehulp',h:'Twijfel je nog?',p:'bekijk de details bij bol voordat je kiest',cta:'Bekijk bij bol →'},{eye:'Nog even',h:'Wat de foto niet laat zien',p:'staat wél in de details bij bol',cta:'Bekijk de details bij bol →'},{eye:'Keuzehulp',h:'Voorkom een miskoop',p:'lees eerst de reviews bij bol',cta:'Lees de reviews bij bol →'} ] },
            amazon:{ nl:[ {eye:'Keuzehulp',h:'Bekijk dit op Amazon',p:'prijs op Amazon',cta:'Bekijk op Amazon →'},{eye:'Keuzehulp',h:'Twijfel je nog?',p:'bekijk de details op Amazon',cta:'Bekijk op Amazon →'} ],
                     en:[ {eye:'Buying guide',h:'See the price on Amazon',p:'price on Amazon',cta:'See it on Amazon →'},{eye:'Buying guide',h:'Still deciding?',p:'see the details on Amazon before you decide',cta:'See it on Amazon →'},{eye:'One more thing',h:'What the photo does not show',p:'is in the details on Amazon',cta:'See the details on Amazon →'},{eye:'Buying guide',h:'Avoid a bad buy',p:'read the reviews on Amazon first',cta:'Read the reviews on Amazon →'} ],
                     de:[ {eye:'Kaufberatung',h:'Auf Amazon ansehen',p:'Preis auf Amazon',cta:'Auf Amazon ansehen →'} ], fr:[ {eye:'Guide',h:'Voir sur Amazon',p:'prix sur Amazon',cta:'Voir sur Amazon →'} ] } }
  },
  home: {
    ban:  { bol:{ nl:['Bekijk bij bol →','Prijs van vandaag bij bol →','Check de maat bij bol →','Op voorraad bij bol →','Voorkom retour: check de maat bij bol →','Onze keuze — bekijk bij bol →'] },
            amazon:{ en:['See it on Amazon →',"Today's price on Amazon →",'Check the size on Amazon →','In stock on Amazon →','Avoid a return: check the size →','Our pick — see on Amazon →'], nl:['Bekijk op Amazon →','Check de maat op Amazon →'] } },
    hook: { bol:{ nl:['', 'Handig als je klein woont:', 'Past dit in jouw kleine ruimte?', 'Vandaag op voorraad bij bol:'] }, amazon:{ en:['', 'Handy if space is tight:', 'Does this fit your space?', 'In stock today on Amazon:'], nl:['', 'Handig als je klein woont:'] } },
    mod:  { bol:{ nl:[ {eye:'Keuzehulp',h:'Bekijk dit bij bol',p:'prijs van vandaag bij bol',cta:'Bekijk bij bol →'},{eye:'Keuzehulp',h:'Twijfel je over de maat?',p:'check maat én prijs bij bol',cta:'Check bij bol →'},{eye:'Onze keuze',h:'Voor kleine ruimtes',p:'past, en vandaag op voorraad bij bol',cta:'Prijs van vandaag bij bol →'} ] },
            amazon:{ en:[ {eye:'Buying guide',h:'See the price on Amazon',p:'price on Amazon',cta:'See it on Amazon →'},{eye:'Buying guide',h:'Not sure about the size?',p:'check size and price on Amazon',cta:'Check on Amazon →'},{eye:'Our pick',h:'For small spaces',p:'fits, and in stock today on Amazon',cta:"Today's price on Amazon →"} ] } }
  },
  beauty: {
    ban:  { bol:{ nl:['Bekijk bij bol →','Prijs van vandaag bij bol →','Bekijk maten en prijs bij bol →','Lees de reviews bij bol →','Check de voorraad bij bol →'] },
            amazon:{ en:['See it on Amazon →',"Today's price on Amazon →",'See sizes and price on Amazon →','Read the reviews on Amazon →','Check availability on Amazon →'], nl:['Bekijk op Amazon →','Lees de reviews op Amazon →'] } },
    hook: { bol:{ nl:['', 'Past dit bij jouw huid?', 'Vergelijk de maten voor je koopt:', 'Lees eerst wat anderen zeggen:'] }, amazon:{ en:['', 'Not sure it suits your skin?', 'Compare sizes before you buy:', 'See what others say first:'], nl:['', 'Past dit bij jouw huid?'] } },
    mod:  { bol:{ nl:[ {eye:'Huidverzorging',h:'Bekijk dit bij bol',p:'maten, prijs en reviews',cta:'Bekijk bij bol →'},{eye:'Huidverzorging',h:'Past het bij jouw huid?',p:'lees eerst de reviews bij bol',cta:'Lees de reviews bij bol →'} ] },
            amazon:{ en:[ {eye:'Skincare guide',h:'See it on Amazon',p:'sizes, price and reviews',cta:'See it on Amazon →'},{eye:'Skincare guide',h:'Not sure it suits your skin?',p:'read the reviews on Amazon first',cta:'Read the reviews on Amazon →'},{eye:'Skincare guide',h:'Which size is right?',p:'compare sizes and price on Amazon',cta:'Compare sizes on Amazon →'} ] } }
  },
  fashion: {
    ban:  { bol:{ nl:['Bekijk bij bol →','Check de maten bij bol →','Prijs van vandaag bij bol →','Lees de reviews bij bol →','Voorkom retour: check de maattabel →'] },
            amazon:{ en:['See it on Amazon →','Check sizes on Amazon →',"Today's price on Amazon →",'Read the reviews on Amazon →','Avoid a return: check the size chart →'], nl:['Bekijk op Amazon →','Check de maten op Amazon →'] } },
    hook: { bol:{ nl:['', 'Check de maattabel voor je bestelt:', 'Voorkom een retour:', 'Twijfel je over de maat?'] }, amazon:{ en:['', 'Check the size chart before you order:', 'Avoid a return:', 'Not sure about the size?'], nl:['', 'Check de maattabel voor je bestelt:'] } },
    mod:  { bol:{ nl:[ {eye:'Keuzehulp',h:'Bekijk dit bij bol',p:'maten, prijs en reviews',cta:'Bekijk bij bol →'},{eye:'Keuzehulp',h:'Twijfel je over de maat?',p:'check de maattabel bij bol',cta:'Check de maten bij bol →'} ] },
            amazon:{ en:[ {eye:'Buying guide',h:'See it on Amazon',p:'sizes, price and reviews',cta:'See it on Amazon →'},{eye:'Buying guide',h:'Not sure about the size?',p:'check the size chart on Amazon',cta:'Check sizes on Amazon →'} ] } }
  }
};
const KIND = { b:'ban', h:'hook', m:'mod' };
const LANGNAME = { nl:'Nederlands', en:'English', de:'Deutsch', fr:'Français' };
const CATNAME = { gen:'algemeen product', home:'huishouden / kleine ruimtes', beauty:'huidverzorging / beauty / parfum', fashion:'kleding / schoenen' };

function norm(list){ return (list||[]).map((v,i)=> typeof v==='string' ? {id:'i'+i, t:v} : Object.assign({}, v, {id:(v&&v.id)||('i'+i)})); }
function getList(cfg, cat, kind, store, lang){
  const k = KIND[kind];
  if(cat!=='gen'){ const c=cfg.CATTXT&&cfg.CATTXT[cat]&&cfg.CATTXT[cat][k]&&cfg.CATTXT[cat][k][store]&&cfg.CATTXT[cat][k][store][lang]; if(c&&c.length) return norm(c);
                   const d=DEFAULTS[cat]&&DEFAULTS[cat][k]&&DEFAULTS[cat][k][store]&&DEFAULTS[cat][k][store][lang]; if(d&&d.length) return norm(d); }
  const top = kind==='b'?cfg.BAN:kind==='h'?cfg.HOOK:cfg.MOD;
  const c = top&&top[store]&&top[store][lang]; if(c&&c.length) return norm(c);
  const d = DEFAULTS.gen[k][store]&&DEFAULTS.gen[k][store][lang]; return d?norm(d):null;
}
function setList(cfg, cat, kind, store, lang, list){
  const k = KIND[kind];
  if(cat!=='gen'){ cfg.CATTXT=cfg.CATTXT||{}; cfg.CATTXT[cat]=cfg.CATTXT[cat]||{}; cfg.CATTXT[cat][k]=cfg.CATTXT[cat][k]||{}; cfg.CATTXT[cat][k][store]=cfg.CATTXT[cat][k][store]||{}; cfg.CATTXT[cat][k][store][lang]=list; return; }
  const key = kind==='b'?'BAN':kind==='h'?'HOOK':'MOD'; cfg[key]=cfg[key]||{}; cfg[key][store]=cfg[key][store]||{}; cfg[key][store][lang]=list;
}
function newId(){ return 'g'+Date.now().toString(36).slice(-5)+Math.random().toString(36).slice(2,5); }

async function readCounters(){
  const out={}; let cursor=0;
  do { const r=await kv.scan(cursor,{match:'c:hjdk6-*',count:1000}); cursor=Number(r[0]); const keys=r[1]||[];
       if(keys.length){ const vals=await kv.mget(...keys); keys.forEach((k,i)=>{ out[k.slice(2)]=Number(vals[i])||0; }); } } while(cursor!==0);
  return out;
}
function aggregate(counters){
  // groups[kind|store|cat|lang][id] = {imp, clk, ord}
  const groups={}, ord={}, outs={};
  for(const [k,v] of Object.entries(counters)){
    const p=k.split('-');
    if(p[1]==='ord'){ ord[`${p[3]}|${p[2]}|${p.slice(4).join('-')}`]=v; continue; }      // hjdk6-ord-store-kind-id
    if(p[1]==='out'){ outs[`${p[3]}|${p[2]}|${p.slice(4).join('-')}`]=v; continue; }     // hjdk6-out-store-kind-id
    if(p[1]==='mb') continue;
    if(!KIND[p[1]] || p.length<7) continue;                                             // hjdk6-kind-store-seg-cat-id-metric
    const kind=p[1], store=p[2], seg=p[3], cat=p[4], metric=p[p.length-1], id=p.slice(5,p.length-1).join('-');
    const lang=seg.slice(2,4); const g=`${kind}|${store}|${cat}|${lang}`;
    groups[g]=groups[g]||{}; groups[g][id]=groups[g][id]||{imp:0,clk:0,ord:0};
    if(metric==='imp') groups[g][id].imp+=v; else if(metric==='clk') groups[g][id].clk+=v;
  }
  for(const g of Object.keys(groups)){ const [kind,store]=g.split('|'); for(const id of Object.keys(groups[g])){ groups[g][id].ord=ord[`${kind}|${store}|${id}`]||0; } }
  return {groups, outs};
}
function rate(a){ const s=a.clk+ORDER_WEIGHT*a.ord; return a.imp>0 ? Math.min(s,a.imp)/a.imp : 0; }


// Ingebouwde pool van eerlijke uitdagers (geen nep-schaarste, geen verzonnen prijzen). Per categorie/kind/winkel/taal.
const POOL = {
  ban: {
    bol: { nl: ['Bekijk de maten bij bol →','Zie de prijs van vandaag bij bol →','Check of hij op voorraad is →','Lees de reviews bij bol →','Vergelijk de kleuren bij bol →','Bekijk de afmetingen bij bol →','Naar bol: prijs en levertijd →','Bekijk de productfoto\'s bij bol →','Kijk of hij past: maten bij bol →','Morgen in huis? Check bij bol →','Bekijk deze bij bol →','Alle details bij bol →'] },
    amazon: { en: ['See today\'s price on Amazon →','Check sizes on Amazon →','Read the reviews on Amazon →','See it on Amazon →','Compare colors on Amazon →','Check delivery on Amazon →','See the details on Amazon →','View photos on Amazon →','Is it in stock? Check Amazon →','Compare sizes before you buy →'], nl: ['Bekijk op Amazon →','Prijs van vandaag op Amazon →','Lees de reviews op Amazon →'] }
  },
  hook: {
    bol: { nl: ['Even checken voor je bestelt:','Twijfel je nog? Kijk hier:','Past het? Check de maat:','Zo weet je zeker dat het klopt:','Kijk eerst, kies dan:','Vandaag bij bol:','Voorkom een retour:','Dit helpt bij het kiezen:'] },
    amazon: { en: ['Before you order, check this:','Still deciding? Look here:','Does it fit? Check the size:','Take a quick look first:','Today on Amazon:','Avoid a return:','This helps you choose:'] }
  },
  mod: {
    bol: { nl: [
      {eye:'Keuzehulp',h:'Nog even kijken?',p:'de maten en de prijs staan bij bol',cta:'Bekijk bij bol →'},
      {eye:'Voor je gaat',h:'Past het in jouw ruimte?',p:'check de afmetingen bij bol',cta:'Check de maten bij bol →'},
      {eye:'Tip',h:'Lees eerst wat anderen zeggen',p:'reviews en foto\'s staan bij bol',cta:'Lees de reviews bij bol →'},
      {eye:'Keuzehulp',h:'Zeker weten dat het klopt?',p:'alle details staan bij bol',cta:'Bekijk de details bij bol →'},
      {eye:'Snel besteld',h:'Morgen in huis?',p:'levertijd en voorraad zie je bij bol',cta:'Check bij bol →'},
      {eye:'Keuzehulp',h:'Vergelijk even',p:'kleuren en maten naast elkaar bij bol',cta:'Vergelijk bij bol →'}
    ] },
    amazon: { en: [
      {eye:'Buying guide',h:'One more look?',p:'sizes and price are on Amazon',cta:'See it on Amazon →'},
      {eye:'Before you go',h:'Does it fit your space?',p:'check the dimensions on Amazon',cta:'Check sizes on Amazon →'},
      {eye:'Tip',h:'Read what others say first',p:'reviews and photos are on Amazon',cta:'Read the reviews on Amazon →'},
      {eye:'Buying guide',h:'Want to be sure?',p:'all the details are on Amazon',cta:'See the details on Amazon →'},
      {eye:'Fast delivery',h:'Need it soon?',p:'delivery and stock are on Amazon',cta:'Check on Amazon →'}
    ] }
  }
};
function fromPool(kind, store, lang, existing, used){
  const k = KIND[kind]; const list = (POOL[k]&&POOL[k][store]&&POOL[k][store][lang])||[];
  const ex = new Set((existing||[]).map(t=>String(t).toLowerCase())); const out=[];
  for(const v of list){ const key = (kind==='m'? v.h : v).toLowerCase(); if(ex.has(key)||used.has(key)) continue; out.push(kind==='m'? Object.assign({},v) : {t:v}); if(out.length>=NEW_PER_LIST) break; }
  return out;
}

async function askClaude(kind, store, cat, lang, winners, losers, existing){
  const key=process.env.ANTHROPIC_API_KEY; if(!key) throw new Error('ANTHROPIC_API_KEY ontbreekt');
  const model=process.env.ANTHROPIC_MODEL||'claude-sonnet-4-5';
  const storeName = store==='bol' ? 'bol' : 'Amazon';
  const what = kind==='b' ? `knopteksten (max 45 tekens, eindigend op " →", noem "${storeName}")`
             : kind==='h' ? `korte hook-zinnen boven een productknop (max 45 tekens, eindigend op ":")`
             : `exit-modal varianten als JSON-objecten {eye (label, max 16 tekens), h (kop, max 40), p (subregel, max 60), cta (knoptekst max 40, eindigend op " →", noem "${storeName}")}`;
  const prompt = `Je schrijft conversie-teksten voor een affiliate-pagina die doorlinkt naar ${storeName}. Taal: ${LANGNAME[lang]||lang}. Categorie: ${CATNAME[cat]||cat}.
Regels: eerlijk en concreet, geen nep-schaarste, geen verzonnen reviews/prijzen/kortingen, geen hoofdletters-geschreeuw, geen uitroeptekens, natuurlijk ${LANGNAME[lang]||lang}. De tekst moet kloppen voor elk product in deze categorie.
Winnende varianten tot nu toe (hoogste klikratio eerst): ${JSON.stringify(winners)}
Verliezende varianten (vermijd deze richting): ${JSON.stringify(losers)}
Bestaande varianten (niet herhalen): ${JSON.stringify(existing)}
Bedenk ${NEW_PER_LIST} NIEUWE ${what}, duidelijk anders van invalshoek dan de bestaande (bijv. zekerheid, gemak, vergelijken, details, reviews, timing). Antwoord met ALLEEN een JSON-array, zonder uitleg.`;
  const r = await fetch('https://api.anthropic.com/v1/messages', { method:'POST', headers:{ 'x-api-key':key, 'anthropic-version':'2023-06-01', 'content-type':'application/json' },
    body: JSON.stringify({ model, max_tokens: 800, messages:[{ role:'user', content: prompt }] }) });
  if(!r.ok) throw new Error('Anthropic '+r.status+' '+(await r.text()).slice(0,200));
  const j = await r.json(); const text = (j.content||[]).map(c=>c.text||'').join('');
  const m = text.match(/\[[\s\S]*\]/); if(!m) throw new Error('geen JSON in antwoord');
  const arr = JSON.parse(m[0]); if(!Array.isArray(arr)) throw new Error('geen array');
  return arr.slice(0, NEW_PER_LIST).map(v => kind==='m' ? {eye:String(v.eye||'').slice(0,16), h:String(v.h||'').slice(0,40), p:String(v.p||'').slice(0,60), cta:String(v.cta||'').slice(0,40)} : {t:String(typeof v==='string'?v:(v.t||v.text||'')).slice(0,60)})
            .filter(v => kind==='m' ? (v.h&&v.cta) : v.t);
}

export default async function handler(req, res){
  if(req.method==='OPTIONS') return res.status(204).end();
  const auth=req.headers['authorization']||'', cron=process.env.CRON_SECRET;
  const okCron = cron && auth===`Bearer ${cron}`; const okTok = process.env.HJDK_TOKEN && req.headers['x-hjdk-token']===process.env.HJDK_TOKEN;
  const noSecrets = !cron && !process.env.HJDK_TOKEN;
  // Vercel Cron stuurt user-agent "vercel-cron/1.0"; zonder CRON_SECRET accepteren we die, maar wel met de 6-uurs rem hieronder.
  const isVercelCron = !cron && /vercel-cron/i.test(String(req.headers['user-agent']||''));
  const dryOnly = String(req.query.dry||'')==='1'; // dry=1 wijzigt niets: mag altijd (alleen lezen)
  if(!okCron && !okTok && !noSecrets && !isVercelCron && !dryOnly) return res.status(401).json({error:'unauthorized'});
  if((noSecrets || isVercelCron) && !dryOnly){ try { const last = await kv.get('hjdk:iterate:last'); if(last && last.at && (Date.now()-Date.parse(last.at)) < 6*3600*1000) return res.status(200).json({ ok:true, skipped:'rate-limit', lastAt:last.at }); } catch(e){} }
  const dry = String(req.query.dry||'')==='1';
  const log=[]; let calls=0;
  try {
    const cfg = (await kv.get('hjdk:config')) || {};
    const counters = await readCounters();
    const {groups, outs} = aggregate(counters);
    const newOuts=[];
    for(const g of Object.keys(groups)){
      const [kind,store,cat,lang]=g.split('|'); const arms=groups[g];
      const totalImp=Object.values(arms).reduce((a,x)=>a+x.imp,0); if(totalImp<MIN_GROUP_IMP) continue;
      let list = getList(cfg,cat,kind,store,lang); if(!list) continue;
      const stats = list.map(v=>({v, a:arms[v.id]||{imp:0,clk:0,ord:0}}));
      const withData = stats.filter(s=>s.a.imp>=MIN_ARM_IMP); if(withData.length<2) continue;
      const best = withData.reduce((m,s)=> rate(s.a)>rate(m.a)?s:m, withData[0]); const bestRate=rate(best.a);
      const losers = withData.filter(s=> s!==best && rate(s.a) < LOSER_RATIO*bestRate && !outs[`${kind}|${store}|${s.v.id}`]);
      for(const l of losers){ newOuts.push(`c:hjdk6-out-${store}-${kind}-${l.v.id}`); }
      const loserIds = new Set(losers.map(l=>l.v.id)); Object.keys(outs).forEach(k=>{ const [kk,ss,id]=k.split('|'); if(kk===kind&&ss===store&&outs[k]>0) loserIds.add(id); });
      const keep = list.filter(v=>!loserIds.has(v.id));
      let added=[];
      if(calls<MAX_GROUPS && losers.length>0 && keep.length<MAX_LIST){
        const winTxt = withData.filter(s=>!loserIds.has(s.v.id)).sort((x,y)=>rate(y.a)-rate(x.a)).slice(0,3).map(s=>kind==='m'?{h:s.v.h,cta:s.v.cta,ctr:+(rate(s.a)*100).toFixed(2)+'%'}:{t:s.v.t,ctr:+(rate(s.a)*100).toFixed(2)+'%'});
        const loseTxt = losers.map(s=>kind==='m'?{h:s.v.h,cta:s.v.cta}:{t:s.v.t});
        const existing = keep.map(v=>kind==='m'?v.h:v.t);
        cfg._used = cfg._used || {}; const usedKey = `${kind}|${store}|${lang}`; const used = new Set(cfg._used[usedKey]||[]);
        loserIds.forEach(id=>{ const lv = list.find(v=>v.id===id); if(lv) used.add(String(kind==='m'? lv.h : lv.t).toLowerCase()); });
        let gen = [];
        if(process.env.ANTHROPIC_API_KEY){ try { calls++; gen = await askClaude(kind,store,cat,lang,winTxt,loseTxt,existing); } catch(e){ log.push(`claude fout ${g}: ${e.message}`); } }
        if(!gen.length){ gen = fromPool(kind,store,lang,existing,used); }
        added = gen.map(v=>Object.assign({id:newId()},v));
        cfg._used[usedKey] = Array.from(used);
      }
      const finalList = keep.concat(added).slice(0, MAX_LIST);
      if(losers.length||added.length){ setList(cfg,cat,kind,store,lang,finalList); log.push(`${g}: uit=${losers.map(l=>l.v.id).join(',')||'-'} nieuw=${added.length} lijst=${finalList.length}`); }
    }
    if(!dry){ for(const k of newOuts){ await kv.set(k,1); } cfg.updatedAt=new Date().toISOString(); await kv.set('hjdk:config',cfg); await kv.set('hjdk:iterate:last',{at:cfg.updatedAt, log}); }
    return res.status(200).json({ ok:true, dry, claudeCalls:calls, changes:log });
  } catch(e){ return res.status(500).json({ error:String(e&&e.message||e), log }); }
}
