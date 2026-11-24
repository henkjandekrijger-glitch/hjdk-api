// De vraag uit de advertentie wordt de eerste pill in de chat (19 nov 2026, Henkjan: "JA doe dit moet JIJ leren en niet aan me vragen !
// Neem iedere dag het geleerde uit de chat mee IN de ad ."). De wissel stuurt de bezoeker door met b=<advertentie-id> (bannerid van
// PropellerAds). Staat die advertentie hieronder, dan zet de chat haar vraag als pill boven het invoerveld; één tik stelt die vraag in de
// chat (vraag() in lib/kzux.js), en is het een vraag uit de FAQ van de pagina dan komt het antwoord meteen. Een tik telt als dialoog,
// zodat de campagne leert op mensen die echt iets vragen. De dagelijkse campagneronde zet nieuwe advertenties hier bij, met als vraag
// bij voorkeur letterlijk een FAQ-vraag van de pagina (dan staat het antwoord er meteen) of een vraag die bezoekers zelf stelden.
// s = slug van de pagina waar de advertentie op landt, q = de pill.
export const AD_VRAAG = {
  // US UK CA 12182934 (dagkopie 24 nov van 12163190, wissel wtb-power; 12163190 was op na $30). Eruit 'Safe to use indoors?' en 'Jackery or EcoFlow?' (12,0% vraag per klik, laagst); erin FAQ Anker SOLIX en solar generator
  27809922: { s: 'best-portable-power-stations-for-home-backup-2026', q: 'What is the best portable power station in 2026?' },
  27809923: { s: 'best-portable-power-stations-for-home-backup-2026', q: 'Which Anker SOLIX power station should I buy?' },
  27809924: { s: 'best-portable-power-stations-for-home-backup-2026', q: 'What is the difference between a power station and a solar generator?' },
  27809925: { s: 'best-portable-power-stations-for-home-backup-2026', q: 'Can a portable power station run a CPAP all night?' },
  27809926: { s: 'best-portable-power-stations-for-home-backup-2026', q: 'Which portable power station is best for camping or an RV?' },
  27809927: { s: 'best-portable-power-stations-for-home-backup-2026', q: 'What size portable power station do I need for a fridge?' },
  27809928: { s: 'best-portable-power-stations-for-home-backup-2026', q: 'What is the best portable power station in 2026?' },
  27809929: { s: 'best-portable-power-stations-for-home-backup-2026', q: 'What is the best portable power station in 2026?' },
  // US UK CA 12169847 (20 nov, Henkjan: "Ja start chirurgie", wissel wtb-surgery, whichtobuy.best/surgery/hair-transplant-turkey); FAQ-vragen van de pagina waar het kan
  27791462: { s: 'chirurgie-pg-hair-transplant-turkey', q: 'Is a hair transplant in Turkey safe?' },
  27791463: { s: 'chirurgie-pg-hair-transplant-turkey', q: 'How much is a hair transplant in Turkey?' },
  27791464: { s: 'chirurgie-pg-hair-transplant-turkey', q: 'Who actually does the surgery?' },
  27791465: { s: 'chirurgie-pg-hair-transplant-turkey', q: 'Which checks should I do before I book?' },
  27791466: { s: 'chirurgie-pg-hair-transplant-turkey', q: 'What changed in Turkey in 2025?' },
  27791467: { s: 'chirurgie-pg-hair-transplant-turkey', q: 'How long do I need to stay in Turkey?' },
  27791468: { s: 'chirurgie-pg-hair-transplant-turkey', q: 'How do I check a clinic on HealthTurkiye?' },
  27791469: { s: 'chirurgie-pg-hair-transplant-turkey', q: 'What results should I ask the clinic for?' },
  // NL 12168044 (dagkopie 20 nov van 12163186, wissel kz-batterij); nieuw 27788686 en 27788690 uit de FAQ
  27788684: { s: 'stekkerbatterij', q: 'Wat is de beste thuisbatterij met stekker?' },
  27788685: { s: 'stekkerbatterij', q: 'Wat verandert er op 1 januari 2027?' },
  27788686: { s: 'stekkerbatterij', q: 'Hoeveel bespaart een stekkerbatterij per jaar?' },
  27788687: { s: 'stekkerbatterij', q: 'Welke stekkerbatterij heeft de meeste opslag?' },
  27788688: { s: 'stekkerbatterij', q: 'Is een stekkerbatterij veilig in een appartement of huis?' },
  27788689: { s: 'stekkerbatterij', q: 'Wat is de beste stekkerbatterij in Nederland?' },
  27788690: { s: 'stekkerbatterij', q: 'Werkt een stekkerbatterij tijdens een stroomstoring?' },
  27788691: { s: 'stekkerbatterij', q: 'Wat is de beste thuisbatterij met stekker?' },
  // DE 12168047 (dagkopie 20 nov van 12163188, wissel kb-speicher); nieuw 27788697 (FAQ) en 27788698 (letterlijk getypt: 'Etwa 5 kWh oder erweiterbar')
  27788694: { s: 'balkonkraftwerk-speicher-2026-vergleich-anker-zendure-ecoflow-marstek', q: 'Welcher Balkonkraftwerk-Speicher ist der beste?' },
  27788695: { s: 'balkonkraftwerk-speicher-2026-vergleich-anker-zendure-ecoflow-marstek', q: 'Darf ein Speicher mehr als 800 W einspeisen?' },
  27788696: { s: 'balkonkraftwerk-speicher-2026-vergleich-anker-zendure-ecoflow-marstek', q: 'Wie viel Speicher braucht ein Balkonkraftwerk?' },
  27788697: { s: 'balkonkraftwerk-speicher-2026-vergleich-anker-zendure-ecoflow-marstek', q: 'Was bedeutet 2000 W bei einem Balkonkraftwerk mit Speicher?' },
  27788698: { s: 'balkonkraftwerk-speicher-2026-vergleich-anker-zendure-ecoflow-marstek', q: 'Welcher Speicher hat etwa 5 kWh oder ist erweiterbar?' },
  27788699: { s: 'balkonkraftwerk-speicher-2026-vergleich-anker-zendure-ecoflow-marstek', q: 'Was sagt Stiftung Warentest zu Balkonkraftwerk-Speichern?' },
  27788700: { s: 'balkonkraftwerk-speicher-2026-vergleich-anker-zendure-ecoflow-marstek', q: 'Kann ich einen Speicher am Balkonkraftwerk nachrüsten?' },
  27788701: { s: 'balkonkraftwerk-speicher-2026-vergleich-anker-zendure-ecoflow-marstek', q: 'Welcher Balkonkraftwerk-Speicher ist der beste?' },
  // US UK CA 12168048 (dagkopie 20 nov van 12163190, wissel wtb-power); nieuw 27788706 (pill 'Whole home with a transfer panel', 50 tikken) en 27788707 (FAQ)
  27788702: { s: 'best-portable-power-stations-for-home-backup-2026', q: 'What is the best portable power station in 2026?' },
  27788703: { s: 'best-portable-power-stations-for-home-backup-2026', q: 'What size portable power station do I need for a fridge?' },
  27788704: { s: 'best-portable-power-stations-for-home-backup-2026', q: 'Jackery or EcoFlow: which is better?' },
  27788705: { s: 'best-portable-power-stations-for-home-backup-2026', q: 'Can a portable power station run a CPAP all night?' },
  27788706: { s: 'best-portable-power-stations-for-home-backup-2026', q: 'Which portable power station can run my whole home with a transfer panel?' },
  27788707: { s: 'best-portable-power-stations-for-home-backup-2026', q: 'What is the difference between a power station and a solar generator?' },
  27788708: { s: 'best-portable-power-stations-for-home-backup-2026', q: 'Which portable power station is best for camping or an RV?' },
  27788709: { s: 'best-portable-power-stations-for-home-backup-2026', q: 'What is the best portable power station in 2026?' },
  // NL 12163186 (wissel kz-batterij, keuzehulp.best/stekkerbatterij)
  27782273: { s: 'stekkerbatterij', q: 'Wat is de beste thuisbatterij met stekker?' },
  27782274: { s: 'stekkerbatterij', q: 'Welke stekkerbatterij heeft de meeste opslag?' },
  27782275: { s: 'stekkerbatterij', q: 'Wat is de beste stekkerbatterij in Nederland?' },
  27782276: { s: 'stekkerbatterij', q: 'Wat verandert er op 1 januari 2027?' },
  27782277: { s: 'stekkerbatterij', q: 'Is een stekkerbatterij veilig in een appartement of huis?' },
  27782278: { s: 'stekkerbatterij', q: 'Welke stekkerbatterij past bij 8 zonnepanelen?' },
  27782279: { s: 'stekkerbatterij', q: 'Wat is de beste thuisbatterij met stekker?' },
  27782280: { s: 'stekkerbatterij', q: 'Wat is de beste stekkerbatterij in Nederland?' },
  // DE 12163188 (wissel kb-speicher)
  27782282: { s: 'balkonkraftwerk-speicher-2026-vergleich-anker-zendure-ecoflow-marstek', q: 'Welcher Balkonkraftwerk-Speicher ist der beste?' },
  27782283: { s: 'balkonkraftwerk-speicher-2026-vergleich-anker-zendure-ecoflow-marstek', q: 'Kann ich einen Speicher am Balkonkraftwerk nachrüsten?' },
  27782284: { s: 'balkonkraftwerk-speicher-2026-vergleich-anker-zendure-ecoflow-marstek', q: 'Welches Balkonkraftwerk mit Speicher ist Testsieger?' },
  27782285: { s: 'balkonkraftwerk-speicher-2026-vergleich-anker-zendure-ecoflow-marstek', q: 'Was sagt Stiftung Warentest zu Balkonkraftwerk-Speichern?' },
  27782286: { s: 'balkonkraftwerk-speicher-2026-vergleich-anker-zendure-ecoflow-marstek', q: 'Darf ein Speicher mehr als 800 W einspeisen?' },
  27782287: { s: 'balkonkraftwerk-speicher-2026-vergleich-anker-zendure-ecoflow-marstek', q: 'Wie viel Speicher braucht ein Balkonkraftwerk?' },
  27782288: { s: 'balkonkraftwerk-speicher-2026-vergleich-anker-zendure-ecoflow-marstek', q: 'Muss ich den Speicher anmelden?' },
  27782289: { s: 'balkonkraftwerk-speicher-2026-vergleich-anker-zendure-ecoflow-marstek', q: 'Welcher Balkonkraftwerk-Speicher ist der beste?' },
  // US, UK, CA 12163190 (wissel wtb-power)
  27782291: { s: 'best-portable-power-stations-for-home-backup-2026', q: 'What is the best portable power station in 2026?' },
  27782292: { s: 'best-portable-power-stations-for-home-backup-2026', q: 'What size portable power station do I need for a fridge?' },
  27782293: { s: 'best-portable-power-stations-for-home-backup-2026', q: 'Jackery or EcoFlow: which is better?' },
  27782294: { s: 'best-portable-power-stations-for-home-backup-2026', q: 'Can a portable power station run a CPAP all night?' },
  27782295: { s: 'best-portable-power-stations-for-home-backup-2026', q: 'Can I use a portable power station indoors?' },
  27782296: { s: 'best-portable-power-stations-for-home-backup-2026', q: 'What is the best portable power station in 2026?' },
  27782297: { s: 'best-portable-power-stations-for-home-backup-2026', q: 'Which portable power station is best for camping or an RV?' },
  27782298: { s: 'best-portable-power-stations-for-home-backup-2026', q: 'What is the best portable power station in 2026?' },
  // NL Rotterdam alle bedrijven 12164987 (wissel rdam-alle, keuzehulp.best/rotterdam; chat-slug rotterdam). Henkjan 19 nov: "Niet tandarts gewoon alle bedrijven ook een campagne"
  27784796: { s: 'rotterdam', q: 'Welke loodgieter in Rotterdam is nu bereikbaar?' },
  27784797: { s: 'rotterdam', q: 'Wat is de beste kapper in Rotterdam?' },
  27784798: { s: 'rotterdam', q: 'Welke garage in Rotterdam heeft de beste reviews?' },
  27784799: { s: 'rotterdam', q: 'Welke elektricien in Rotterdam is vandaag bereikbaar?' },
  27784800: { s: 'rotterdam', q: 'Welke slotenmaker in Rotterdam is nu open?' },
  27784801: { s: 'rotterdam', q: 'Wat is de beste advocaat in Rotterdam?' },
  27784802: { s: 'rotterdam', q: 'Welke fysiotherapeut in Rotterdam heeft de beste reviews?' },
  27784803: { s: 'rotterdam', q: 'Welke verhuizer in Rotterdam is het best beoordeeld?' },
  // NL Rotterdam 12164111 (wissel rdam-tandarts, keuzehulp.best/rotterdam/tandarts; slug van de chat is rotterdam-<dienst>)
  27783509: { s: 'rotterdam-tandarts', q: 'Hoe vind ik een tandarts in Rotterdam die nieuwe patiënten aanneemt?' },
  27783510: { s: 'rotterdam-tandarts', q: 'Hoe vind ik een tandarts in Rotterdam die nieuwe patiënten aanneemt?' },
  27783511: { s: 'rotterdam-tandarts', q: 'Wat kost een tandarts in Rotterdam?' },
  27783512: { s: 'rotterdam-tandarts', q: 'Wat doe ik bij spoed buiten openingstijden?' },
  27783513: { s: 'rotterdam-tandarts', q: 'Welke tandarts in Rotterdam is nu open?' },
  27783514: { s: 'rotterdam-tandarts', q: 'Welke tandarts zit bij mij in de buurt?' },
  27783515: { s: 'rotterdam-tandarts', q: 'Welke tandarts in Rotterdam heeft de beste reviews?' },
  27783516: { s: 'rotterdam-tandarts', q: 'Wat doe ik bij spoed buiten openingstijden?' },
  // airfryer NL, campagne 12171454 (21 nov 2026): de vraag uit de advertentietitel is de eerste pill
  27794345: { s: 'airfryer', q: 'Welke airfryer past bij mij?' },
  27794346: { s: 'airfryer', q: 'Hoeveel liter heb ik nodig voor 4 personen?' },
  27794347: { s: 'airfryer', q: 'Is de Black Friday-prijs van een airfryer echt laag?' },
  27794348: { s: 'airfryer', q: 'Eén of twee lades: wat past bij mij?' },
  27794349: { s: 'airfryer', q: 'Welke maat airfryer moet ik nemen?' },
  27794350: { s: 'airfryer', q: 'Airfryer of combimagnetron: wat kies ik?' },
  27794351: { s: 'airfryer', q: 'Welke airfryer is goed voor 1 of 2 personen?' },
  27794352: { s: 'airfryer', q: 'Waar koop ik een airfryer: bol of Coolblue?' },
};

// Klein script achter de chat: leest b= uit de URL en zet de vraag van die advertentie als pill boven het invoerveld (alleen voor deze pagina).
export function adVraagJs(slug) {
  const m = {}; for (const [id, v] of Object.entries(AD_VRAAG)) if (v.s === slug) m[id] = v.q;
  if (!Object.keys(m).length) return '';
  return '<script>(function(){try{var A=' + JSON.stringify(m).replace(/</g, '\\u003c') + ',b=(location.search.match(/[?&]b=(\\d+)/)||[])[1],q=b&&A[b];if(!q)return;'
    + 'function zet(){if(window.__kxAdq)return;var f=document.getElementById("kxf"),i=document.getElementById("kxq");var e0=document.querySelector(".kx-adq");if(e0){e0.hidden=false;return}if(!f||!i)return;var p=document.createElement("p");p.className="kx-ps kx-adq";'
    + 'var x=document.createElement("button");x.type="button";x.setAttribute("data-v",q);x.textContent=q;x.addEventListener("click",function(){window.__kxAdq=1;p.remove();i.value=q;try{if(f.requestSubmit)f.requestSubmit();else f.dispatchEvent(new Event("submit",{cancelable:true}))}catch(e){}});'
    + 'p.appendChild(x);f.parentNode.insertBefore(p,f)}setTimeout(zet,900);setTimeout(zet,2500)}catch(e){}})();</script>';
}
