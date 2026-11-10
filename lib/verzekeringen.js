export const insuranceEscape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const insuranceDay = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone:'America/Curacao', year:'numeric', month:'2-digit', day:'2-digit' }).format(now);
export const insuranceBot = ua => /bot|crawl|spider|preview|inspection|headless/i.test(String(ua || ''));
export function insurancePrice(p) {
  if (!Number.isFinite(p.premium) || p.premium < 0 || !p.year) return 'Premie niet bronbevestigd';
  return new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(p.premium) + ' p/m (' + p.year + (p.year === 2026 ? ', referentie' : '') + ')';
}
export function insuranceSelection(data, ids) {
  const unique = [...new Set(ids)];
  if (unique.length > 4) return { ok:false, error:'Kies maximaal vier polissen.' };
  const selected = unique.map(id=>data.policies.find(p=>p.id===id));
  if (selected.some(p=>!p)) return {ok:false,error:'Onbekende polis.'};
  if (new Set(selected.map(p=>p.kind)).size>1) return {ok:false,error:'Vergelijk polissen uit dezelfde verzekeringssoort.'};
  return { ok:true, selected };
}
export function insuranceSource(data, policy) {
  const source = data.sources[policy.source];
  if (!source) return null;
  try { const u=new URL(source.url); return u.protocol==='https:' && !u.username && !u.password ? u.href : null; } catch { return null; }
}
export const insuranceOutPath = p => '/verzekeringen/bron/' + encodeURIComponent(p.id);
export function insuranceCsv(data) {
  const quote = x => '"' + String(x ?? '').replace(/"/g,'""') + '"';
  const fields = ['Id','Soort','Aanbieder','Product of variant','Polisjaar','Premie EUR per maand','Premiegrondslag','Bronstatus 2027','Dekking','Let op','Eigen risico','Maximum','Inhoud gecontroleerd','Bron'];
  return '\uFEFF' + [fields,...data.policies.map(p=>[p.id,p.kind,p.carrier,p.name,p.year,p.premium,p.premiumBasis,p.newYear,p.coverage,p.watch,p.excess,p.limit,p.reviewedAt,insuranceSource(data,p)])].map(r=>r.map(quote).join(';')).join('\r\n');
}
export function insuranceStats(data) { return { policies:data.policies.length,carriers:new Set(data.policies.map(p=>p.carrier)).size,kinds:new Set(data.policies.map(p=>p.kind)).size,sources:Object.keys(data.sources).length,confirmed2027:data.policies.filter(p=>p.year===2027&&p.newYear==='bevestigd').length,openDetails:data.policies.filter(p=>p.detailStatus).length,unknownPremiums:data.policies.filter(p=>!Number.isFinite(p.premium)).length,commercial:data.commercial }; }
export function insuranceSchema(data, faq) {
  const url='https://keuzehulp.best/verzekeringen';
  return {'@context':'https://schema.org','@graph':[
    {'@type':'Article','@id':url+'#article',headline:'Verzekeringen vergelijken: polissen en dekking in Nederland',description:'Redactioneel overzicht van Nederlandse verzekeringen met bronnen, polisjaar, uitsluitingen en controlepunten.',inLanguage:'nl-NL',datePublished:'2026-11-10',dateModified:data.reviewedAt,author:{'@type':'Organization',name:'Keuzehulp',url:'https://keuzehulp.best/'},publisher:{'@type':'Organization',name:'Keuzehulp',url:'https://keuzehulp.best/'},mainEntityOfPage:url},
    {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Keuzehulp',item:'https://keuzehulp.best/'},{'@type':'ListItem',position:2,name:'Verzekeringen',item:url}]},
    {'@type':'FAQPage',mainEntity:faq.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))}
  ]};
}
export function normalizeInsuranceSource(text) {
  return String(text).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,200000);
}
export function insuranceMonitorResult(previous, fetched, checkedAt) {
  const good=fetched.status>=200&&fetched.status<300;
  return {id:fetched.id,url:fetched.url,status:fetched.status,checkedAt,reachable:good,hash:good?fetched.hash:previous?.hash||null,changed:good&&!!previous?.hash&&previous.hash!==fetched.hash,yearsMentioned:good?fetched.yearsMentioned||[]:[],reviewRequired:good&&!!previous?.hash&&previous.hash!==fetched.hash,meaning:good?'Technische broncontrole; geen inhoudelijke goedkeuring of nieuwe premie.':'Bron niet succesvol opgehaald; bestaande inhoudelijke controle blijft ongewijzigd.'};
}
export const INSURANCE_EVENTS = new Set(['filter','search','shortlist','compare','source_click','helpful','not_helpful','missing_premium','missing_coverage','missing_provider']);
export function validInsuranceEvent(body, data, kinds) {
  if (!body || Array.isArray(body) || typeof body!=='object' || Object.keys(body).some(k=>!['event','policy','kind'].includes(k)) || !INSURANCE_EVENTS.has(body.event)) return false;
  if (body.policy && !data.policies.some(p=>p.id===body.policy)) return false;
  if (body.kind && !kinds.some(k=>k.id===body.kind)) return false;
  return true;
}
