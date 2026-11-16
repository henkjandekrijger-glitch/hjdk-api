import { COUNTRY_CODES } from './tsc-country-picker.js';
// Short-lived first-party form receipts and bounded campaign labels; no raw URL or email in aggregate metrics.
export const ACQUISITION_VERSION='visible-form-v2-2026-11-16';
const safe=s=>/@|https?:|token|password/i.test(String(s||''))?'':String(s||'').normalize('NFKC').replace(/[^a-zA-Z0-9_.-]/g,'').slice(0,72);
export function attribution(raw={}) {
 const out={};for(const key of ['source','medium','campaign','content']){const value=safe(raw[key]);if(value)out[key]=value;}
 if(!out.source)out.source='direct';return out;
}
export const campaignKey=a=>[a.source||'direct',a.medium||'none',a.campaign||'none',a.content||'none'].join(':');
export const validView=s=>/^[a-f0-9]{24,64}$/.test(String(s||''));
export function normaliseCountry(value,fallback='other') {
 const code=String(value||'').toUpperCase();return code==='UK'?'GB':COUNTRY_CODES.includes(code)?code:fallback;
}
export const exposureCohort=(language,topic)=>'v2:'+language+':'+topic;
export const browserCampaignScript=`function campaign(){var u=new URL(location.href),a={};['source','medium','campaign','content'].forEach(function(k){var v=u.searchParams.get('utm_'+k)||'';v=v.normalize('NFKC').replace(/[^a-zA-Z0-9_.-]/g,'').slice(0,72);if(v)a[k]=v});if(!a.source)a.source=u.searchParams.get('bron')==='mail'?'mail':document.referrer?function(){try{return /google\\./i.test(new URL(document.referrer).hostname)?'google':/bing|duckduckgo/i.test(new URL(document.referrer).hostname)?'search':'referral'}catch(e){return 'direct'}}():'direct';return a}`;
