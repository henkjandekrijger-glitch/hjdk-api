// Alleen voor offline tests: productie-renderer en JSON-data zijn echt; opslag,
// externe foto's en niet onderzochte tourmodules krijgen vaste IO-dubbels.
const modules = {
  'db.js': 'export const kv = new Proxy({}, {get:()=>async()=>null});',
  'curfooter.js': 'export const renderCurFooter=()=>"<footer></footer>";',
  'cursocial.js': 'export const socialHtml=()=>"";',
  'curnieuws.js': 'export const nieuwsHtml=()=>""; export const nieuwsTekst=()=>""; export const NIEUWS_CSS="";',
  'curtours.js': 'export const renderTours=()=>null, TOURS_CSS="", tourFotos=async()=>({}), tourFotoTest=()=>null, boekVan=()=>null;',
  'curtourbeeld.js': 'export const tourOnderhoud=()=>null, tourStand=()=>null, tourBeeld=()=>null, tourKeuze=()=>null, tourBlad=()=>null, maakKeuze=()=>null, tourKenmerk=()=>null;',
  'keuzelijst.js': 'export const SELECT_TERUGVAL={};',
  'autohuur-curacao.js': 'export const AUTOHUUR={id:"autohuur",slug:{nl:"auto-huren",en:"car-rental"},label:{nl:"Auto huren",en:"Car rental"}}, AUTOHUUR_DATA={verhuurders:[],faq:[],tips:[]}, verhuurders=[]; export function reviewScore(v){let s=0,n=0;for(const r of v.scores||[]){if(r.aantal&&r.score){s+=r.score/(r.max||5)*5*r.aantal;n+=r.aantal}}return n?{gemiddeld:s/n,aantal:n}:null;}',
};
export async function resolve(spec, context, next) {
  const name=spec.split('/').pop();
  if (/\/lib\/(cur|curbedrijf|curgevonden|curkh)\.js$/.test(context.parentURL || '') && modules[name]) return {url:'curstub:'+name,shortCircuit:true};
  if (spec==='@vercel/blob') return {url:'curstub:blob',shortCircuit:true};
  return next(spec,context);
}
export async function load(url, context, next) {
  if (url==='curstub:blob') return {format:'module',shortCircuit:true,source:'export async function get(p){const x=globalThis.__CUR_FIXTURES?.[p];return x?{stream:new Blob([JSON.stringify(x)]).stream()}:null} export async function put(){throw Error("test may not write")};'};
  if (url.startsWith('curstub:')) return {format:'module',shortCircuit:true,source:modules[url.slice(8)]};
  return next(url,context);
}
