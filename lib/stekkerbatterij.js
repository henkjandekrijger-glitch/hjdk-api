export const BATTERY_DATE='2026-10-17';
export const BATTERY_URL='https://keuzehulp.best/stekkerbatterij';
export const BATTERY_SOURCES=[
 ['Rijksoverheid: einde salderen op 1 januari 2027','https://www.rijksoverheid.nl/themas/klimaat-milieu-en-natuur/energie-thuis/salderingsregeling'],
 ['RVO: registratie van batterijsystemen','https://www.rvo.nl/onderwerpen/netcongestie/registreer-uw-batterijsysteem'],
 ['HomeWizard: installatie en benodigde meter','https://helpdesk.homewizard.com/nl/articles/10124308-plaatsing-en-installatie-van-de-plug-in-battery'],
 ['HomeWizard: Plug-In Battery','https://www.homewizard.com/nl/plug-in-battery/'],
 ['Anker: Solarbank 3 E2700 Pro','https://www.ankersolix.com/nl/collections/solarbank-3-pro-serie'],
 ['Anker: aansluiting, laden en compatibiliteit','https://www.ankersolix.com/nl/balkonkraftwerk-mit-speicher/solarbank3-a17c5'],
 ['Zendure: SolarFlow 800 Pro','https://www.zendure.nl/products/solarflow-800-pro'],
 ['EcoFlow: STREAM AC Pro','https://nl.ecoflow.com/products/stream-ac-pro-ac'],
 ['Marstek: Venus E Gen 3.0','https://marstekenergy.com/nl-nl/products/marstek-venus-e-gen-3'],
 ['Tesla: Powerwall 3 technische documentatie','https://energylibrary.tesla.com/docs/Public/EnergyStorage/Powerwall/3/InstallManual/BackupGateway/2/nl-nl/GUID-77BFC6C0-346E-4838-8578-26A5E60C8D83.html'],
 ['Sessy: productdocumentatie 5 kWh','https://www.sessy.nl/wp-content/uploads/2025/09/Sessy-Datasheet-Sessy-2.0-5-kWh.pdf']
];
export const BATTERY_MODELS=[
 {id:'anker',name:'Anker SOLIX Solarbank 3 E2700 Pro',storage:'2,688 kWh nominaal',fit:'Opslag combineren met een uitbreidbaar Solarbank-systeem.',check:'AC-koppeling of directe PV-aansluiting, geschikte meting en de precieze bundel.',source:4,query:'Anker SOLIX Solarbank 3 E2700 Pro'},
 {id:'zendure',name:'Zendure SolarFlow 800 Pro',storage:'Controleer capaciteit en batterijbundel',fit:'Zonnestroom opslaan of laadmomenten via de app plannen.',check:'800 Pro is een andere uitvoering dan Pro 2; controleer meegeleverde accu en meting.',source:6,query:'Zendure SolarFlow 800 Pro thuisbatterij'},
 {id:'homewizard',name:'HomeWizard Plug-In Battery',storage:'2,7 kWh per batterij',fit:'Eigen zonnestroom gebruiken met HomeWizard-meting.',check:'Slimme meter, HomeWizard P1- of kWh-meter en geschikte plaatsing.',source:3,query:'HomeWizard Plug In Battery thuisbatterij'},
 {id:'ecoflow',name:'EcoFlow STREAM AC Pro',storage:'1,92 kWh per unit',fit:'AC-opslag vergelijken binnen de STREAM-productlijn.',check:'AC, AC Pro en Ultra hebben verschillende aansluitingen; vergelijk de exacte uitvoering.',source:7,query:'EcoFlow STREAM AC Pro thuisbatterij'},
 {id:'marstek',name:'Marstek Venus E Gen 3.0',storage:'Controleer de regionale datasheet',fit:'Een alternatief vergelijken op capaciteit en totale aanschafkosten.',check:'Generatie, meetaccessoire, toegestane vermogensinstelling en Nederlandse ondersteuning.',source:8,query:'Marstek Venus E 3.0 thuisbatterij'},
 {id:'tesla',name:'Tesla Powerwall 3',storage:'13,5 kWh nominaal',fit:'Een vast geïnstalleerd energiesysteem vergelijken.',check:'Offerte inclusief installatie, meting, aansluitvermogen en eventuele back-upvoorziening.',source:9,installed:true},
 {id:'sessy',name:'Sessy 2.0 5 kWh',storage:'5 kWh modelklasse',fit:'Vaste thuisopslag met een installateur onderzoeken.',check:'Exacte uitvoering, bruikbare energie en complete installatieofferte.',source:10,installed:true}
];
export const BATTERY_QUESTIONS=[
 {q:'Heb je zonnepanelen?',options:['Ja, met een bestaande omvormer','Nee','Nog niet / ik weet mijn overschot niet']},
 {q:'Wat wil je vooral?',options:['Zonnestroom later zelf gebruiken','Goedkope stroom later gebruiken','Stroom houden bij een storing']},
 {q:'Hoe wil je aansluiten?',options:['Via een geschikte stopcontactaansluiting','Een installateur mag het systeem aansluiten','Aansluiting en veilige plek zijn nog onbekend']}
];
export const BATTERY_FAQ=[
 ['Wat is de beste stekkerbatterij in Nederland?','Er is geen universele winnaar. Vergelijk voor bestaand zonnepaneelgebruik onder meer HomeWizard Plug-In Battery, Anker SOLIX Solarbank en Zendure SolarFlow. Kies op meetcompatibiliteit, bruikbare capaciteit, toegestaan vermogen en complete aanschafkosten. Een zoekvolumepiek is geen producttest.'],
 ['Anker SOLIX of Zendure: wat is het belangrijkste verschil?','Vergelijk het exacte model en de bundel. Solarbank 3 E2700 Pro heeft volgens Anker 2,688 kWh nominale opslag. Zendure SolarFlow kent verschillende uitvoeringen en uitbreidingsaccu’s. Controleer de meting, koppeling met bestaande zonnepanelen en appfuncties voordat je op merk kiest.'],
 ['Wat verandert er op 1 januari 2027?','De salderingsregeling eindigt. Je mag teruggeleverde zonnestroom dan niet meer jaarlijks wegstrepen tegen netafname. Er blijft een terugleververgoeding. Daardoor kan later zelf gebruiken waardevoller worden, maar een batterij verdient zich niet automatisch terug.'],
 ['Kan een thuisbatterij zonder zonnepanelen werken?','Bij sommige systemen kun je via het net laden en later ontladen. Of dit financieel iets oplevert hangt af van all-in tarieven, laadverliezen, abonnementen en aansturing. Controleer of het specifieke model dit in Nederland ondersteunt.'],
 ['Is 800 watt hetzelfde als 2,7 kWh?','Nee. Watt is het vermogen op een moment; kWh is een hoeveelheid energie. Een batterij met 2,7 kWh kan theoretisch ongeveer 3,4 uur 800 W leveren voordat je rekening houdt met reserves en verliezen. Je krijgt met meer opslag niet vanzelf meer vermogen.'],
 ['Mag iedere stekkerbatterij in ieder stopcontact?','Nee. De fabrikantvoorwaarden, groep, bekabeling, beveiliging, andere bronnen en aangesloten apparaten bepalen de geschiktheid. Een sticker met 800 W is geen algemene toestemming. Laat de aansluiting bij twijfel beoordelen en gebruik geen geïmproviseerde stekkerdoosopstelling.'],
 ['Moet ik een stekkerbatterij aanmelden?','RVO deelt batterijsystemen vanaf 0,8 kW tot 1 MW in als type A. Voor een thuisbatterij van dit type is registratie via Energieleveren.nl de route. Controleer de actuele aanwijzingen van je netbeheerder voor jouw systeem.'],
 ['Werkt een stekkerbatterij tijdens een stroomstoring?','Een netgekoppeld systeem voedt je huis niet automatisch bij netuitval. Een apart off-grid stopcontact is iets anders dan back-up voor de woning. Controleer toegestane apparaten, omschakeling en de aanvullende hardware die de fabrikant voorschrijft.'],
 ['Is Tesla Powerwall hetzelfde als een stekkerbatterij?','Nee. Powerwall 3 is een vast energiesysteem met 13,5 kWh nominale opslag. Voor een vergelijking heb je de volledige installatieofferte nodig. Alleen de losse accucapaciteit of een Amazon-zoekresultaat is geen vergelijkbare totaaloplossing.'],
 ['Waar kan ik een stekkerbatterij kopen: bol of Amazon?','Bij de compacte modellen staan zoeklinks naar bol en Amazon.nl. Die bevestigen geen voorraad of laagste prijs. Controleer of je een volledige batterij koopt, welke meter en kabel erbij zitten, de verkoper en de garantieafhandeling. Voor vaste systemen vergelijk je installatieoffertes.'],
 ['Hoeveel bespaart een stekkerbatterij per jaar?','Bereken de werkelijk verplaatste energie maal het prijsverschil, na laadverliezen. Trek misgelopen terugleververgoeding, sluimerverbruik en overige kosten af. De rekenhulp toont met jouw aannames een eenvoudige verhouding tot de aanschafprijs, geen voorspeld beleggingsrendement.']
];
export const BATTERY_SECTIONS=[
 ['wat-is-een-stekkerbatterij','Wat is een stekkerbatterij?',[
  'Een stekkerbatterij, ook plug-in thuisbatterij of thuisaccu met stekker genoemd, slaat stroom op en geeft die op een later moment terug aan de elektrische installatie binnen de mogelijkheden van het systeem. Je verschuift energie in de tijd. Je maakt geen extra stroom en je bewaart niet zomaar je zomeroverschot voor de winter.',
  'Een draagbaar powerstation is een andere productsoort. Dat kan eigen uitgangen voor apparaten hebben, maar mag niet zonder daarvoor ontworpen aansluiting terugvoeden op de woninginstallatie. Een losse uitbreidingsaccu, P1-meter of aansluitservice is evenmin een complete thuisbatterij.'
 ]],
 ['beste-stekkerbatterij','Welke stekkerbatterij past bij jouw situatie?',[
  'Heb je al zonnepanelen met een werkende omvormer? Onderzoek eerst een AC-gekoppelde oplossing: de batterij hoeft daarvoor niet rechtstreeks aan dezelfde panelen te hangen. Controleer of het gekozen systeem de teruglevering goed kan meten en op jouw installatie kan reageren. Alleen een P1-poort op de slimme meter is geen bewijs dat iedere batterij ermee samenwerkt.',
  'Bij een nieuw systeem met rechtstreeks aangesloten panelen tellen ook omvormer, toegestane paneelspanning en PV-ingangen mee. Neem daarvoor de exacte fabrikantconfiguratie als uitgangspunt. Vergelijk capaciteit, laadvermogen en ontlaadvermogen afzonderlijk; een opvallend groot PV-getal is geen bewijs dat datzelfde vermogen via jouw stopcontact mag lopen.'
 ]],
 ['anker-solix-zendure','Anker SOLIX, Zendure of HomeWizard?',[
  'De Anker SOLIX Solarbank 3 E2700 Pro is een concreet uitbreidbaar systeem met 2,688 kWh nominale basisopslag. De fabrikant beschrijft ook laden vanuit een bestaande PV-installatie via AC wanneer geschikte meting aanwezig is. Bekijk welk model, meetapparaat en welke accessoires daadwerkelijk in jouw bundel zitten.',
  'Zendure beschrijft voor de SolarFlow 800 Pro laden vanuit het net via de app en een afzonderlijke off-grid aansluiting. Dat betekent niet dat je woning zonder extra voorzieningen blijft werken tijdens netuitval. Haal de 800 Pro, 800 Pro 2 en andere SolarFlow-modellen niet door elkaar; de naam SolarFlow alleen zegt te weinig over het complete systeem.',
  'HomeWizard noemt voor de Plug-In Battery 2,7 kWh en 800 W per batterij. De installatie-informatie noemt zonnepanelen, een slimme meter en een HomeWizard P1- of kWh-meter als benodigdheden. Controleer eerst of je die route wilt gebruiken. Vergelijk bij EcoFlow de STREAM-uitvoering en bij Marstek de generatie en meetmodule; een merknaam is geen specificatie.'
 ]],
 ['salderen-2027','Is een stekkerbatterij na het einde van salderen rendabel?',[
  'Vanaf 1 januari 2027 stopt salderen volgens de Rijksoverheid. Terugleveren blijft mogelijk tegen een vergoeding. Later je eigen stroom gebruiken kan daardoor anders uitpakken dan nu. Gebruik in een berekening het contract dat in jouw rekenperiode geldt; behandel 2026 en 2027 niet alsof het dezelfde situatie is.',
  'Begin met direct zelf gebruiken: bijvoorbeeld een verbruiksmoment naar een zonnig uur verschuiven als dat praktisch past. Vergelijk daarna hoeveel extra een batterij nog kan verplaatsen. Je kunt niet dezelfde kWh tegelijk als direct verbruik én als batterijbesparing meetellen.',
  'Een batterij levert niet elke dag een volledige cyclus. In de winter is er minder zonnestroom; in de zomer kun je na laden te weinig avondverbruik hebben om hem leeg te maken. Gebruik maand- of kwartierdata en kies een voorzichtig aantal effectieve gebruiksdagen. Een thuisbatterij kan technisch passen en financieel toch weinig opleveren.'
 ]],
 ['capaciteit-vermogen','Hoeveel kWh en hoeveel watt heb je nodig?',[
  'De kleinere modellen in de vergelijking zitten rond enkele kWh per unit. Dat is een startpunt om met je gegevens te vergelijken, geen aanbevolen maat voor ieder huis. Kijk hoeveel energie je na direct verbruik kunt laden én later weer zelf kunt afnemen. Het kleinste van die twee begrenst wat je dagelijks nuttig verschuift.',
  'Voorbeeld: je kunt op een gebruiksdag 3 kWh laden, maar hebt later slechts 1,5 kWh passende vraag. Dan kun je niet 3 kWh vermeden netafname boeken. Het toegestane ontlaadvermogen kan de dekking verder beperken bij kortdurende zware apparaten. Inductiekoken, een auto laden of een warmtepomp vraagt een afzonderlijke vermogensbeoordeling.'
 ]],
 ['installatie-registratie','Aansluiten en aanmelden: controleer dit vóór aankoop',[
  'Laat bepalen of groep, stopcontact, beveiliging en plaatsingsruimte geschikt zijn voor de concrete batterij. Volg de handleiding voor ondergrond, temperatuur, vrije ruimte en aansluiting. Een plug-in ontwerp betekent niet dat je de elektrische beoordeling kunt overslaan. Kies de vermogensinstelling niet uitsluitend op basis van het maximum op de doos.',
  'RVO noemt vanaf 0,8 kW tot 1 MW de categorie type A. Voor thuisbatterijen in deze categorie kun je registreren via Energieleveren.nl. Dit is iets anders dan bevestiging dat elke denkbare aansluiting technisch geschikt is. Bij vragen over jouw opstelling vraag je de netbeheerder en een deskundige installateur.'
 ]],
 ['noodstroom-powerwall-sessy','Noodstroom, Tesla Powerwall en Sessy: wanneer verder kijken?',[
  'Wil je de woning bij netuitval blijven voeden, vergelijk dan complete back-upontwerpen. Een batterij met een aparte uitgang voor enkele apparaten biedt niet automatisch back-up voor groepen in de meterkast. Vraag welke apparatuur blijft werken, hoe omschakeling gebeurt en welke installatie erbij hoort.',
  'Tesla Powerwall en Sessy horen bij de vergelijking van vaste energiesystemen. Powerwall 3 heeft volgens Tesla 13,5 kWh nominale accu-energie; Sessy documenteert onder meer een 5 kWh-uitvoering. Dat is een andere schaal en aansluitwijze dan een compacte stekkerbatterij. Een lager zoekvolume zegt niets beslissends over geschiktheid, service of systeemprestaties.'
 ]],
 ['kopen-totaalprijs','Waar koop je een stekkerbatterij en wat moet de prijs bevatten?',[
  'Vergelijk de volledige batterij met de noodzakelijke meting, kabels, communicatie, uitbreidingen en eventuele installatie. Een goedkope losse accu zonder geschikte omvormer of een aansluitservice zonder batterij kan bovenaan een winkelzoekopdracht staan. Onze productselectie sluit zulke duidelijke accessoires en diensten uit; controleer alsnog de volledige aanbieding.',
  'Bol- en Amazon-links zijn startpunten voor de precieze modelnaam. Wij claimen geen laagste prijs en geen bevestigde voorraad. Een productprijs uit de bol-bron krijgt het controlemoment erbij. Amazon-prijzen tonen we hier pas na een geschikte bevestigde productbron. Voor geïnstalleerde systemen is een complete offerte bruikbaarder dan een zoeklink.'
 ]],
 ['werkwijze','Hoe deze keuzehulp tot stand komt',[
  'Deze gids is samengesteld door Henkjan de Krijger van AdsFair B.V. We vergelijken het gebruiksdoel, koppeling, energie en vermogen, totale kosten en de hieronder gekoppelde fabrikant- en overheidsinformatie. We hebben de batterijen niet zelf in een laboratorium of woning getest. De tabel geeft vergelijkingskandidaten, geen testwinnaar.',
  'De aanleiding was groeiende interesse in stekkerbatterijen. Zoekvolumes en voorspellingen meten belangstelling, geen verkoop, storingskans of rendement. Daarom bepalen ze niet de winnaar in het advies. De broncontrole heeft een datum; winkelprijzen, firmware, bundels en regelgeving kunnen veranderen.'
 ]]
];
export function batteryItem(){return {slug:'stekkerbatterij',title:'Welke stekkerbatterij past bij jouw huis?',h1:'Beste stekkerbatterij kiezen: Anker SOLIX, Zendure of een alternatief?',seoTitle:'Stekkerbatterij kiezen: Anker SOLIX, Zendure, kosten & 2027',metaDesc:'Vergelijk stekkerbatterijen van Anker SOLIX, Zendure, HomeWizard, EcoFlow en Marstek. Keuzehulp, rekenhulp na salderen en bol- en Amazon.nl-links.',cat:'Klussen',term:'stekkerbatterij',intro:'Kies op jouw zonnepanelen, stroomgebruik en aansluiting. Vergelijk modellen en reken met je eigen stroomtarieven.',kort:'Voor bestaande zonnepanelen: vergelijk eerst een passende AC-opslag met geschikte meting. Kies capaciteit op werkelijk laadoverschot en later verbruik. Noodstroom voor het huis vraagt een afzonderlijk systeemontwerp; meer zoekvolume maakt een batterij niet automatisch beter.',uitleg:BATTERY_SECTIONS.map(([id,h,ps])=>h+'\n'+ps.join('\n')).join('\n\n')+'\n\nBronnen: '+BATTERY_SOURCES.map(s=>s.join(': ')).join('\n'),questions:BATTERY_QUESTIONS.map(q=>({q:q.q,options:q.options.map(label=>({label}))})),faq:BATTERY_FAQ.map(([q,a])=>({q,a})),fouten:['Een aansluitservice, uitbreiding of powerstation aanzien voor een complete netgekoppelde batterij.','Meer kWh verwarren met meer watt.','Een gegarandeerde terugverdientijd aannemen zonder eigen contract en gebruiksdata.'],verwant:['thuisbatterij','laadpaal','verwarmen-met-mobiele-airco'],publishAt:BATTERY_DATE,updatedAt:BATTERY_DATE,priority:100,tool:true};}
export function batteryRoute(raw){const a=Array.isArray(raw)?raw:String(raw||'').split('-');return [0,1,2].map(i=>Number.isInteger(Number(a[i]))&&Number(a[i])>=0&&Number(a[i])<3?Number(a[i]):0);}
export function batteryAdvice(raw){const [solar,goal,install]=batteryRoute(raw);
 if(goal===2)return {title:'Begin met een passend noodstroomontwerp',text:'Een gewone netgekoppelde stekkerbatterij houdt je woning niet vanzelf aan bij stroomuitval. Bepaal of je enkele losse apparaten of groepen in huis wilt voeden.',check:'Vergelijk een toegestane off-grid uitgang met een volledig geïnstalleerde back-upoplossing. Vraag naar omschakeling, vermogen en extra hardware.',ids:[],kind:'backup'};
 if(install===2)return {title:'Controleer eerst aansluiting en meetgegevens',text:'De veilige plek en aansluiting zijn nog onbekend. Koop nog niet op basis van een merk- of wattageclaim.',check:'Laat de groep en plaatsing beoordelen. Verzamel gegevens over overschot en later verbruik; bepaal daarna capaciteit en vermogensinstelling.',ids:[],kind:'measure'};
 if(solar!==0&&goal===0)return {title:solar===1?'Zonder zonnestroom past dit gebruiksdoel nog niet':'Meet eerst hoeveel stroom je kunt verschuiven',text:solar===1?'Je koos later eigen zonnestroom gebruiken, maar hebt geen zonnepanelen. Koop hiervoor nog geen batterij.':'Zonder bekend overschot kun je de nuttige batterijgrootte nog niet kiezen.',check:'Wil je goedkope netstroom opslaan, kies dan dat gebruiksdoel en reken met alle tarieven, verliezen en kosten.',ids:[],kind:'measure'};
 if(install===1)return {title:'Vergelijk een complete installatie met een compacte oplossing',text:'Omdat installatie mogelijk is, kun je zowel een compacte AC-opslag als een vast systeem vergelijken. Vraag dezelfde capaciteit, meetfunctie en gebruikswens uit.',check:'Gebruik totaaloffertes. Vergelijk Sessy en Tesla niet op losse batterijprijs met een stekkermodel.'+(goal===1?' Reken ook de all-in tarieven en laadverliezen door.':''),ids:goal===1?['anker','zendure','ecoflow']:['anker','zendure','homewizard'],kind:'installed'};
 if(goal===1)return {title:'Vergelijk regelbare opslag en reken het tariefverschil door',text:'Anker Solarbank, Zendure SolarFlow en EcoFlow STREAM zijn kandidaten om op ondersteunde laadplanning en meetkoppeling te vergelijken.',check:'Controleer de Nederlandse uitvoering, software, all-in tarieven, laadverliezen en kosten. Winst uit prijsverschillen is niet gegarandeerd.',ids:['anker','zendure','ecoflow'],kind:'dynamic'};
 return {title:'Vergelijk compacte AC-opslag voor je bestaande zonnepanelen',text:'HomeWizard Plug-In Battery, Anker Solarbank 3 en Zendure SolarFlow zijn concrete vergelijkingskandidaten. De beste keuze hangt af van je meting, bruikbare energie en complete prijs.',check:'Begin met je werkelijk verschuifbare kWh; controleer de aansluiting en de juiste meter voor het model. De grootste accu is niet automatisch de beste.',ids:['homewizard','anker','zendure'],kind:'solar'};
}
export function batteryEconomics(v){
 const {mode,capacity,days,efficiency,buy,charge,investment,fees,standby}=v;
 const a=[capacity,days,efficiency,buy,charge,investment,fees,standby].map(Number),[k,d,e,p,c,i,f,w]=a;
 if(!['solar','dynamic'].includes(mode)||a.some(n=>!Number.isFinite(n))||k<=0||k>100||d<0||d>366||e<1||e>100||p<0||p>5||c< -1||c>5||i<0||i>100000||f<0||f>10000||w<0||w>1000)return null;
 const input=k*d,output=input*e/100,avoided=output*p,charging=input*c,standbyCost=w/1000*24*365*p;
 const gross=avoided-charging,net=gross-f-standbyCost;
 return {input,output,avoided,charging,gross,standbyCost,net,payback:net>0&&i>0?i/net:null};
}
export function bolBatteryLink(query,subid){const dest='https://www.bol.com/nl/nl/s/?searchtext='+encodeURIComponent(query);return 'https://partner.bol.com/click/click?p=1&t=url&s=1547300&f=TXL&url='+encodeURIComponent(dest)+'&subid='+encodeURIComponent(subid);}
export function amazonBatteryLink(query,tag){return 'https://www.amazon.nl/s?k='+encodeURIComponent(query)+'&tag='+encodeURIComponent(tag);}
export function isCompleteBatteryProduct(p,id){
 const t=String(p?.title||'');if(/laten aansluiten|aansluitservice|installatieservice|zoofy|uitbreidings|expansion|extension battery|losse accu|accukabel|verlengkabel|alleen.{0,12}(meter|kabel)|\bBP(?:1600|2700)\b|(?:smart\s*meter|slimme\s*meter|P1[- ]?meter|kabel|muurbeugel)\s*(?:voor|geschikt)/i.test(t))return false;
 const tests={anker:/\bAnker\b.*(?:solarbank\s*3|e2700)/i,zendure:/\bZendure\b.*solarflow\s*800\s*pro(?!\s*2)/i,homewizard:/homewizard.*(?:plug.?in\s*battery|thuisbatterij)/i,ecoflow:/ecoflow.*stream\s*ac\s*pro/i,marstek:/marstek.*venus\s*e.*(?:3[.,]0|v3)/i};
 return !!tests[id]?.test(t)&&/^https:\/\/(www\.)?bol\.com\//i.test(String(p?.url||''));
}
