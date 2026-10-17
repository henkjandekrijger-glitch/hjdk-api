// Reviewed US guides, selected from Demand Radar signals. Search volume is not a product rating.
export const US_GUIDES = [
  {
    slug: 'best-space-heaters-for-small-rooms-and-apartments', decisionKind: 'heater', priority: 50,
    cat: 'Home & Kitchen', term: 'indoor electric space heater', title: 'Which space heater fits your room and running budget?',
    h1: 'Which space heater should you buy?', seoTitle: 'Space heater finder: room, comfort & running costs',
    metaDesc: 'Compare ceramic, oil-filled and personal heaters in three questions. Estimate electricity costs in dollars and check matching options on Amazon US.',
    intro: 'A cold home office, a quiet reading room or just cold feet? Match the heater to the job, then see what it could cost to run.',
    kort: 'For fast, occasional warmth, compare a ceramic fan heater. For quieter, longer sessions while you are awake, compare an oil-filled radiator. For one seated person, compare a low-wattage personal heater. Choose by controls, noise and safe placement, rather than promises of free heat.',
    questions: [
      { q: 'How big is the space?', options: [{label:'Under 100 sq ft'}, {label:'100–200 sq ft'}, {label:'Over 200 sq ft / open plan'}] },
      { q: 'What matters most?', options: [{label:'Warm up quickly'}, {label:'Less fan noise'}, {label:'Warm just me'}] },
      { q: 'What is your purchase budget?', options: [{label:'Under $50'}, {label:'$50–$100'}, {label:'Over $100'}] }
    ],
    guide: 'Ceramic fan heaters move warm air and suit short, attended sessions when you want warmth quickly. Oil-filled radiators usually avoid fan noise but take longer to warm up; their stored warmth is not free energy. Personal heaters focus on the area around one person. A low setting draws less power but also delivers less heat.\nA room area alone cannot tell you whether a heater will keep up. Drafts, insulation, ceiling height and outdoor temperature all matter. A typical plug-in unit is supplemental room heating; do not assume one unit will heat an open-plan apartment. Check the exact electrical rating and the manufacturer’s instructions for your outlet and circuit.\nBefore choosing a model, check its safety certification, thermostat, shutoff features and recall status. A certification or timer does not make it safe to run while sleeping. Keep a clear space around it, connect it to a suitable wall receptacle without an extension lead, and stop using it if the plug or receptacle becomes hot. Do not use an ordinary room heater in a bathroom.\nThe running-cost calculator uses watts divided by 1,000, multiplied by active heating hours and your electricity rate. Thermostat cycling can reduce actual active time. This is an electricity estimate, not a promise of lower total household bills.',
    mistakes: ['Buying an “eco” label without comparing watts and active heating time.', 'Expecting a single plug-in heater to warm a large, drafty apartment.', 'Using a heater while sleeping or leaving it running in an empty room.', 'Placing it within 3 feet of furniture, bedding or other things that can burn.'],
    faq: [
      {q:'Can I leave a portable space heater on while I sleep?',a:'Turn it off before sleeping, including an oil-filled model. A timer and automatic shutoff do not replace that precaution. See the CPSC guidance below.'},
      {q:'What does a 1,500-watt heater cost to run?',a:'At an example electricity rate of $0.20 per kWh, one hour of active heating costs $0.30. Four active hours per day for 30 days cost $36. Enter your own rate below.'},
      {q:'Is an oil-filled heater cheaper to run than ceramic?',a:'At the same electrical draw and active time, their electricity cost is the same. Thermostat behavior, chosen setting and how long you use them can change the bill.'},
      {q:'Which size heats a 200 sq ft room?',a:'There is no reliable guarantee from area alone. Compare the manufacturer’s intended use and consider insulation, ceiling height, drafts and the temperature difference. Avoid choosing from an advertised area alone.'}
    ],
    sources: [ ['CPSC: 2026 portable-heater precautions', 'https://www.cpsc.gov/Newsroom/News-Releases/2026/Keep-Warm-and-Safe-This-Winter-Tips-for-Using-Generators-Furnaces-and-Space-Heaters'], ['CPSC: check a model for recalls', 'https://www.cpsc.gov/Recalls'] ],
    publishAt:'2026-10-08', updatedAt:'2026-10-17'
  },
  {
    slug:'glass-air-fryer', decisionKind:'glass', priority:51, cat:'Home & Kitchen', term:'glass air fryer',
    title:'Glass air fryer or basket: which fits your kitchen?', h1:'Is a glass air fryer right for you?', seoTitle:'Glass air fryer finder: Crispi, larger glass or basket?',
    metaDesc:'Choose a glass air fryer for your portions, cooking style and kitchen space. Compare Ninja Crispi, larger glass systems and basket alternatives with Amazon US links.',
    intro:'See your food cooking, reheat leftovers or make two dishes at once. Three choices help you decide whether glass is worth the space in your kitchen.',
    kort:'A compact glass system is worth comparing for small meals and leftovers. Choose a larger glass unit for bigger batches, or compare a dual-zone unit when two foods need separate settings. A conventional basket remains a useful alternative if low cost and easy handling matter more than glass.',
    questions:[
      {q:'Who do you usually cook for?', options:[{label:'1 person'}, {label:'2 people'}, {label:'3–4 people / batch cooking'}]},
      {q:'What matters most?', options:[{label:'Glass cooking container'}, {label:'Two foods, separate settings'}, {label:'Keep the purchase cost down'}]},
      {q:'How will it live in your kitchen?', options:[{label:'Put away after cooking'}, {label:'Leave on the counter'}, {label:'Cook and store leftovers'}]}
    ],
    guide:'Start with the amount of food you cook in one layer, rather than the number of people printed on the box. Compare the usable cooking surface, not just the advertised quarts. If you often cook protein and a side with different settings, a single-container system means batches. Two containers in the box do not automatically mean simultaneous cooking.\nFor a compact glass option, the US Ninja Crispi FN101 system is a concrete candidate. Its listed bundle includes 4-quart and 6-cup containers. Check the exact bundle on the retailer page: accessories and sizes vary. A larger candidate is the Ninja Crispi Pro AS101 system, with a listed 6-quart and 2.5-quart bundle. The Pro has a countertop base; the compact model has a removable heating head. These are manufacturer specifications, not our cooking-test results.\nGlass is useful when you want to see the food and use approved containers for leftovers. It does not prove that every food-contact part is glass, or that a product has no coatings. Check the crisper plate, seals, lids and exact model documentation. Only use containers approved for the appliance; ordinary storage glass is not automatically air-fryer cookware.\nCompare lifting weight, washing instructions, replacement-container costs and storage space before paying more for glass. Keep the heating unit away from water and follow the exact model’s cooling, cleaning and food-storage instructions. The recommendation below is a shortlist to investigate, not a claim that a retailer listing has been inspected or is in stock.',
    mistakes:['Treating a window in a basket fryer as a glass cooking container.', 'Assuming two supplied bowls can cook at different temperatures simultaneously.', 'Assuming “glass” describes every food-contact component.', 'Buying extra bowls before checking model compatibility.'],
    faq:[
      {q:'Is a glass air fryer better than a basket air fryer?',a:'It depends on what you value. Glass lets you see the food, but weight, storage and usable cooking area may matter more. This guide compares practical fit; it does not claim better taste or healthier food.'},
      {q:'Can I use any glass dish in an air fryer?',a:'Use only cookware the appliance manufacturer approves. A storage dish, even one described as oven-safe, is not automatically suitable for direct use with an air-fryer heating head.'},
      {q:'Does the Ninja Crispi cook two containers at once?',a:'The compact single-head system cooks one container at a time. Compare a specifically dual-zone appliance if you need separate cooking settings simultaneously.'},
      {q:'Why are there no live prices here?',a:'We do not have a confirmed Amazon product offer for this shortlist. The links open matching Amazon US searches so you can check the exact bundle, seller, current price and delivery.'}
    ],
    sources:[['Ninja: US Crispi FN101 specifications','https://www.sharkninja.com/ninja-crispi-4-in-1-portable-glass-air-fryer-cooking-system-stone/FN101ST.html'],['Ninja: US Crispi Pro AS101 specifications','https://www.sharkninja.com/ninja-crispi-pro-6-in-1-countertop-glass-air-fryer-bone/AS101LG.html']],
    publishAt:'2026-10-17', updatedAt:'2026-10-17'
  }
];

export function guideAnswers(it, raw) {
  const values=Array.isArray(raw)?raw:String(raw||'').split('-');
  return it.questions.map((q,i)=>{const n=Number(values[i]);return Number.isInteger(n)&&n>=0&&n<q.options.length?n:0;});
}
export function runningCost(watts,hours,rate,days=30) {
  const v=[watts,hours,rate,days].map(Number);
  if(v.some(n=>!Number.isFinite(n)||n<0)||v[0]>1500||v[1]>24||v[2]>5||v[3]>366)return null;
  const hourly=v[0]/1000*v[2];return {hourly,daily:hourly*v[1],total:hourly*v[1]*v[3]};
}
export function guideDecision(it, raw) {
  const [room,need,limit]=guideAnswers(it,raw);
  if(it.decisionKind==='heater') {
    const choices=[
      ['Compare a ceramic fan heater','A fan-assisted heater is a practical starting point for quick, attended warm-up.','indoor ceramic space heater thermostat tip over overheat protection'],
      ['Compare an oil-filled radiator','A fanless radiator is worth comparing when less fan noise matters and you can wait for it to warm up.','oil filled electric radiator thermostat safety shutoff'],
      ['Compare a low-wattage personal heater','Focus on your seated area instead of trying to warm the whole room. Use a clear, stable position that follows the instructions.','low wattage personal electric heater thermostat safety shutoff']
    ][need];
    return {title:choices[0],why:choices[1],query:choices[2],note:room===2?'Your room may be too large or open for one portable unit. Treat this as supplemental or personal warmth, not whole-apartment heating.':room===1?'Compare the actual model’s room guidance. Floor area alone does not guarantee enough heat.':'A smaller room does not remove the need for safe clearance and a suitable outlet.',tradeoff:need===1?'Slower warm-up and more weight; stored heat does not reduce energy use at the same watts and active time.':need===2?'Lower power also means less heat. Keep it away from feet, clothing and furniture as instructed.':'Expect fan noise. A higher purchase price does not mean more heat at the same wattage.',budget:['Your target is under $50. Filter by price on Amazon, then check safety features; no matching price is confirmed.','Your target is $50–$100. Compare controls and noise before paying for extras; no matching price is confirmed.','Your target is over $100. Compare useful controls and build, rather than efficiency slogans; no matching price is confirmed.'][limit]};
  }
  if(it.decisionKind!=='glass')return null;
  if(need===2)return {title:'Compare a conventional basket first',why:'Keeping the purchase cost down matters more to you than having a glass container. Compare a straightforward basket appliance before paying for a glass system.',query:room===2?'air fryer large basket':'compact basket air fryer',note:'No price or stock is confirmed. Compare current offers, usable cooking area and cleaning instructions.',tradeoff:'This alternative does not have a glass cooking container.',budget:limit===0?'Check stored dimensions and weight before you buy.':'Check the space around the appliance required by its instructions.'};
  if(need===1)return {title:'Compare a dual-zone air fryer',why:'Two foods with separate settings are your priority. A single heating head with two supplied bowls will still cook one bowl at a time.',query:'dual zone air fryer',note:'If glass is also essential, check that both actual cooking containers are glass. A viewing window is different.',tradeoff:'Two zones usually need more space. Compare each zone’s usable size, not just the combined capacity.',budget:limit===0?'Your wish to put it away conflicts with a larger dual-zone footprint. Measure the cupboard before ordering.':'Check the exact model’s simultaneous-cooking controls and counter clearances.'};
  if(room===2)return {title:'Compare a larger glass system',why:'For bigger portions, start by comparing a larger cooking surface. Ninja Crispi Pro AS101 is one concrete candidate, with a listed 6-qt and 2.5-qt bundle.',query:'Ninja Crispi Pro AS101 glass air fryer',note:'This is a model-family search, not a verified Amazon offer. Check the bundle, condition, US electrical version and seller.',tradeoff:'A larger single-container system still cooks one dish at a time; portion count depends on the food.',budget:limit===0?'The Pro has a countertop base. Your put-away preference may be a poor fit: check its weight and stored dimensions.':'Check counter clearances and replacement-container costs.'};
  return {title:'Compare a compact glass system',why:'For smaller portions, Ninja Crispi FN101 is one concrete starting point. The listed US bundle has a 4-qt and 6-cup container; compare the cooking area with your meals.',query:'Ninja Crispi FN101 glass air fryer 4 qt',note:'This is a model-family search, not a verified Amazon offer. Check the exact bundle, condition, US version and delivery.',tradeoff:'The removable heating head cooks one bowl at a time. Glass and extra containers still take cupboard space.',budget:limit===2?'Use only compatible containers and follow the food-storage and cooling instructions.':'Check the full set’s storage footprint and how comfortable the glass is to lift.'};
}
