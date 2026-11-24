// Alleen gesprekswoorden overslaan; bedragen, eigenschappen en ontkenningen blijven staan.
// Zelfstandig gehouden zodat dezelfde functie in de browser en de regressiecontrole draait.
export function frontSearchWords(value,market='nl'){
 const words=String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
 const fillers={
  nl:'ik wij we zoek zoeken zoekt naar een de het wil willen graag help helpt helpen je jij mij me mijn onze ons voor van welke welk wat past bij',
  us:'i we am are looking look search searching for a an the want would like please help me my our which what is fits',
  de:'ich wir suche suchen sucht nach ein eine einen einem einer der die das mochte mochten will wollen bitte hilf helfen mir mich mein meine meinen meinem meiner unser unsere welche welcher welches was passt fuer'
 };
 const ignore=new Set((fillers[market]||fillers.nl).split(' '));
 return [...new Set(words.filter(word=>!ignore.has(word)))];
}

// Bestaande losse hulpen horen ook in de zoeker, zonder een gids dubbel te tellen.
export function frontSearchEntries(items,additions,market='nl'){
 const found=new Map(items.map(item=>[item.slug,item]));
 const more={nl:'Meer hulpen',us:'More guides',de:'Weitere Ratgeber'};
 const gifts={nl:'Cadeaus',us:'Gifts',de:'Geschenke'};
 for(const item of additions){
  if(!item.slug||found.has(item.slug))continue;
  const gift=['cadeau-vinden','gift-finder','geschenk-finden'].includes(item.slug);
  found.set(item.slug,{...item,category:item.category||(gift?gifts[market]:more[market])});
 }
 return [...found.values()];
}
