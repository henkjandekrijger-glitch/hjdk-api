
const L={
 nl:['Samen helpen we anderen kiezen.','Help anderen kiezen','Jouw ervaring met','Deel je ervaring','Goede service|Slechte service|Garantie-ervaring|Lange wachttijd|Prijs en offerte'],
 en:['Together, help others choose.','Help others choose','Your experience with','Share your experience','Good service|Poor service|Warranty experience|Long waiting time|Price and quote'],
 de:['Gemeinsam anderen bei der Wahl helfen.','Hilf anderen bei der Wahl','Deine Erfahrung mit','Teile deine Erfahrung','Guter Service|Schlechter Service|Garantieerfahrung|Lange Wartezeit|Preis und Angebot'],
 es:['Ayudemos a otros a elegir.','Ayuda a otros a elegir','Tu experiencia con','Comparte tu experiencia','Buen servicio|Mal servicio|Garantía|Larga espera|Precio y presupuesto'],
 pt:['Vamos ajudar outros a escolher.','Ajude outros a escolher','Sua experiência com','Compartilhe sua experiência','Bom serviço|Mau serviço|Garantia|Longa espera|Preço e orçamento']
};
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const SB_SCRIPT='<script src="https://sharedby.ai/terug.js" async></script>';
export function sbBlock(lang,name,url=''){
 const t=String(lang||'en').slice(0,2),l=L[t]||L.en,n=String(name||'').trim();if(!n&&!url)return '';
 const topic=url||('on:'+n);
 return '<div data-sharedby="'+e(topic)+'" data-naam="'+e(n)+'" data-taal="'+e(t)+'" data-kop="'+e(url?l[0]:l[2]+' '+n)+'" data-knop="'+e(url?l[1]:l[3])+'" data-kleur="#172B7A" data-hoeken="'+e(l[4])+'"></div>';
}
