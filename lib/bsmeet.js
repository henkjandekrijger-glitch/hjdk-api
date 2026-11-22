// Meetscript en bronnen voor bookstuffers.com en lastingchange.works (zonder imports, zodat pagina's en tests het los kunnen laden).
export const ORGANISCH = ['google', 'bing', 'duckduckgo', 'chatgpt', 'perplexity', 'copilot', 'gemini', 'pinterest'];
export const BRON_OK = /^(google|bing|duckduckgo|chatgpt|perplexity|copilot|gemini|pinterest|social|mail|push|betaald|direct|overig|intern)$/;

// Meetscript voor de pagina (geen cookies, geen persoonsgegevens): bron uit utm of verwijzer, één tel per paginabezoek,
// en de bron mee op elke klik naar /go/ zodat we weten welk organisch kanaal tot Amazon komt.
export const meetJs = (site, telUrl) => `(function(){try{if(navigator.webdriver)return;var D=document,q=new URLSearchParams(location.search),u=(q.get('utm_source')||'').toLowerCase(),r=D.referrer||'',h='';try{h=r?new URL(r).hostname.replace(/^www\\./,''):''}catch(e){}
var s=/pinterest/.test(u)?'pinterest':/chatgpt/.test(u)?'chatgpt':/perplexity/.test(u)?'perplexity':(q.get('zoneid')||q.get('clickid'))?'betaald':/mail/.test(u)?'mail':!h?'direct':h===location.hostname?'intern':/gemini\\.google/.test(h)?'gemini':/(^|\\.)google\\./.test(h)?'google':/bing\\./.test(h)?'bing':/duckduckgo/.test(h)?'duckduckgo':/chatgpt|openai/.test(h)?'chatgpt':/perplexity/.test(h)?'perplexity':/copilot/.test(h)?'copilot':/pinterest/.test(h)?'pinterest':/facebook|instagram|^t\\.co$|x\\.com|twitter|linkedin|reddit|tiktok|whatsapp/.test(h)?'social':'overig';
try{if(s==='intern'){s=sessionStorage.getItem('bsbron')||'intern'}else{sessionStorage.setItem('bsbron',s)}}catch(e){}
var t=${JSON.stringify(telUrl)}+'&site=${site}&s='+s+'&p='+encodeURIComponent(location.pathname+(location.search.indexOf('p=')>-1?location.search.split('p=')[1].split('&')[0]:''));if(navigator.sendBeacon)navigator.sendBeacon(t);else fetch(t,{method:'POST',keepalive:true});
D.addEventListener('click',function(e){var a=e.target.closest('a[href*="/go/"],a[href*="op=go&a="]');if(a&&a.href.indexOf('s=')<0)a.href+=(a.href.indexOf('?')>-1?'&':'?')+'s='+s},true)}catch(e){}})();`;

