// Beslisgids "welke huisrobot kun je nu echt kopen" op whichtobuy.best. Zelfde vorm als lib/wtb-dienst.js (decisionKind 'dienst':
// geen Amazon-producten, één eerste keus per situatie, knoppen naar de fabrikant of de officiële bron, geen affiliate-links).
// Waarom (Henkjan 19 nov 2026: "mensen gaan nu robots kopen ? daar moet een keuzehulp voor komen"): Demand Radar 19 nov, "humanoid robot" (VS):
// vier AI's noemden elk een andere winkel (RobotShop, RobotLAB, Robots USA), geen vaste eerste keus; wat mensen intypen is koopgericht
// ("humanoid robot for sale", "humanoid robot price", "humanoid robots for home"). Een humanoïde haalt de Amazon- en bol-toets niet, dus met de hand.
// Elk feit heeft een bron in sources (gelezen op GELEZEN); prijzen zijn die van de fabrikant op die dag. Geen gedachtestreepjes.

const GELEZEN = '2026-11-19';

const ROBOT = {
  slug: 'humanoid-robot-for-home-which-one-can-you-buy-now', decisionKind: 'dienst', priority: 55, cat: 'Electronics', term: 'humanoid robot for sale',
  title: 'Humanoid robot for home: which one can you buy now?',
  h1: 'Humanoid robot for sale: which one you can actually buy for your home, and what it costs',
  seoTitle: 'Humanoid robot for sale: which can you buy now?',
  metaDesc: 'Humanoid robot for sale: Unitree R1 ships from $4,900, 1X NEO is a $200 pre-order for $20,000 or $499 a month. Which fits you, and when to wait.',
  intro: 'You can order a humanoid robot today, but the two you can really get do very different things. One walks, talks and shows off. The other is meant to help around the house and is still a pre-order. Three questions to see which one fits, or whether you should wait.',
  kort: 'If you want a humanoid robot at home now, the Unitree R1 is the one to order: Unitree lists it from $4,900 and its store shows it in stock. It is a robot to explore and show, not a housekeeper. If you want help with chores, the 1X NEO is the only home humanoid with a public price: a $200 refundable deposit, then $20,000 for Early Access or $499 a month, with first deliveries planned for US homes in 2026. If you mainly want less housework today, a robot vacuum does one real chore for a fraction of the price.',
  questions: [
    { q: 'What are you looking for?', options: [{ label: 'Humanoid robot for sale now' }, { label: 'Home robot that does chores' }, { label: 'Humanoid robot for developers' }, { label: 'Just less housework' }] },
    { q: 'Where do you live?', options: [{ label: 'United States' }, { label: 'Europe' }, { label: 'Somewhere else' }] },
    { q: 'What is your budget?', options: [{ label: 'Under $6,000' }, { label: '$6,000 to $20,000' }, { label: 'About $499 a month' }] }
  ],
  routes: [
    { title: 'Order the Unitree R1 from Unitree', why: 'It is the humanoid you can actually receive now. Unitree lists the R1 AIR at $4,900 and the R1 at $5,900, tax and shipping excluded, and its store shows the R1 in stock. It stands 1.23 m tall, weighs about 27 to 29 kg and has a built-in model for voice and images, so you can talk to it.', note: 'Good if you want to own and explore a real walking humanoid, for yourself, a classroom or an event.', tradeoff: 'It does not do household chores. The R1 AIR and R1 have no dexterous hands, and only the EDU version supports your own software.', links: [['Unitree R1 on unitree.com', 'https://www.unitree.com/R1'], ['Unitree store', 'https://shop.unitree.com/products/unitree-r1']] },
    { title: 'Pre-order the 1X NEO with the refundable deposit', why: '1X NEO is built for the home and is the only home humanoid with a public price. You reserve one with a $200 deposit. Early Access costs $20,000 and includes priority delivery in 2026; the subscription is $499 a month and ships later. 1X says first orders ship to consumer homes in 2026, mainly in the United States.', note: 'Good if chores are the goal and you are fine being an early user. The deposit keeps your place without committing the full amount.', tradeoff: 'It is a pre-order, not a product on a shelf. 1X has said a staff member can look along and guide the robot remotely to help it learn, so read the privacy terms before you order.', links: [['Order NEO at 1X', 'https://www.1x.tech/order'], ['1X: NEO pricing and availability', 'https://1x.tech/discover/neo-home-robot']] },
    { title: 'Ask Unitree for the R1 EDU', why: 'Only the EDU version of the R1 supports your own software, which Unitree calls secondary development. Unitree asks you to contact sales for the price. It has 26 to 40 joints against 20 on the R1 AIR, and a dexterous hand is optional.', note: 'Good for labs, schools and developers who want to program a humanoid rather than only control it.', tradeoff: 'It costs clearly more than the standard R1, and you need the skills and time to program it.', links: [['Unitree R1 versions', 'https://www.unitree.com/R1']] },
    { title: 'Wait on a humanoid and buy a robot vacuum now', why: 'No humanoid you can receive today does housework on its own. A robot vacuum with a mop does one real chore every day, costs a few hundred dollars and is in stock everywhere.', note: 'Good if the goal is a cleaner home this month, not owning a humanoid.', tradeoff: 'It only does floors. For laundry, dishes or tidying you still wait for home humanoids to mature.', links: [['Which robot vacuum to buy', 'https://whichtobuy.best/roborock-vs-dreame-vs-ecovacs-robot-vacuum-2026']] }
  ],
  extra2: ['In the US, add shipping and import costs to Unitree\'s price: its store lists shipping of $300 to $1,200 and leaves customs duties and taxes to the buyer. RobotShop sells the R1 from a US warehouse for $8,990 with tariffs included.', 'From Europe, check delivery before you order: 1X plans to start in the United States in 2026 and expand to other markets in 2027. Unitree ships worldwide, with duties and taxes for the buyer.', 'Outside the US and Europe, 1X is not yet an option. For Unitree, ask the store for shipping to your country and count on import duties.'],
  extra3: ['Under $6,000 only the Unitree R1 fits, before shipping and import costs.', 'In this range the choice is a Unitree R1 with money to spare, or saving toward the $20,000 for 1X NEO Early Access.', 'A monthly budget points to the 1X NEO subscription at $499 a month, which ships later than Early Access.'],
  picks: [
    ['Humanoid robot for sale now', 'Unitree R1, from $4,900', 'R1 AIR $4,900, R1 $5,900 on unitree.com; the store shows it in stock.'],
    ['Home robot that does chores', '1X NEO, $200 refundable pre-order', '$20,000 Early Access or $499 a month; first US homes in 2026.'],
    ['Humanoid robot for developers', 'Unitree R1 EDU', 'The only R1 version open to your own software; contact Unitree sales.'],
    ['Just less housework', 'A robot vacuum with mop', 'Does one real chore today for a few hundred dollars.']
  ],
  guide: 'Start with what you want it to do. The robots you can order split into two kinds. The Unitree R1 is a small, light humanoid that walks and reacts to voice and images, sold through Unitree\'s own store. The 1X NEO is designed to work in a home and is sold as a pre-order.\nCount the full price. Unitree\'s price excludes tax and shipping; its store lists shipping of $300 to $1,200 and makes the buyer responsible for customs duties and taxes. That is why a US reseller such as RobotShop lists the same robot for $8,990 with tariffs included.\nKnow what early access means. With NEO you pay a $200 deposit, then get an invitation to buy or subscribe. Early Access buyers are first in line for 2026. The $499 subscription ships later.\nBe realistic about chores. A home humanoid in 2026 is still learning. Buy one because you want to be early, not because you expect a finished housekeeper.',
  mistakes: ['Expecting the Unitree R1 to do housework: the R1 AIR and R1 have no dexterous hands.', 'Comparing Unitree\'s list price with a US reseller price without adding shipping and import duties.', 'Paying $20,000 upfront for NEO when the $200 deposit already holds your place.', 'Assuming every humanoid in the news can be ordered: check for a public price and an order page first.'],
  aiMiss: ['AI answers name different robot shops each time and no first choice. For a robot you can receive now it is the Unitree R1; for chores it is a 1X NEO pre-order.', 'Many answers mix factory robots with robots you can buy for a home. Only a few have a public price and an order page.', 'The extra costs are rarely mentioned: Unitree adds $300 to $1,200 shipping plus duties, and NEO starts with a $200 deposit.'],
  faq: [
    { q: 'I\'m looking for: humanoid robot for sale. What do you recommend, and where is the best place in the United States to buy, book or sign up for it? Name specific names.', a: 'For a humanoid you can receive now, order the Unitree R1 from Unitree\'s own store (from $4,900 plus shipping and duties) or from RobotShop in the US ($8,990 with tariffs included). For a robot meant to help at home, pre-order the 1X NEO at 1x.tech with a $200 refundable deposit; it costs $20,000 or $499 a month and first ships to US homes in 2026.' },
    { q: 'Can you buy a humanoid robot for your home?', a: 'Yes. The Unitree R1 is sold from $4,900 and Unitree\'s store shows it in stock. The 1X NEO can be pre-ordered with a $200 deposit, with first deliveries to US homes planned for 2026.' },
    { q: 'How much does a humanoid robot cost?', a: 'The cheapest one with a public price is the Unitree R1, from $4,900 before shipping and taxes. The 1X NEO home robot costs $20,000 for Early Access or $499 a month on subscription.' },
    { q: 'Can a humanoid robot do household chores?', a: 'Not on its own yet. The Unitree R1 is not built for chores. The 1X NEO is designed for them, but it is an early product and 1X has said staff can guide it remotely while it learns.' },
    { q: 'Where can I buy the Unitree R1 in the US?', a: 'Directly from Unitree\'s store, where you pay shipping of $300 to $1,200 plus customs duties and taxes, or from RobotShop, which lists it for $8,990 with tariffs included.' },
    { q: 'When does the 1X NEO ship?', a: '1X says first orders ship to consumer homes in 2026, starting mainly in the United States, with other markets from 2027. Early Access buyers get priority; the subscription ships later.' }
  ],
  sources: [
    ['Unitree: R1 product page (prices, versions, size and weight)', 'https://www.unitree.com/R1'],
    ['Unitree store: R1 (in stock, shipping cost, duties, EDU only for own software)', 'https://shop.unitree.com/products/unitree-r1'],
    ['RobotShop: Unitree R1 Humanoid Robot (US price with tariffs)', 'https://www.robotshop.com/products/unitree-r1-humanoid-robot'],
    ['1X: NEO Home Robot, pricing and availability (October 28, 2025)', 'https://1x.tech/discover/neo-home-robot'],
    ['1X: pre-order terms (deposit, order invitation)', 'https://www.1x.tech/legal'],
    ['Robotics 24/7: NEO pre-order details, $200 deposit, US first (November 5, 2025)', 'https://www.robotics247.com/article/video_1x_announces_neo_consumer_ready_humanoid_robot_pre_order_details_with_200_deposit'],
    ['VRT NWS: 1X starts selling home robot NEO, staff can look along (October 29, 2025)', 'https://www.vrt.be/vrtnws/nl/2025/10/29/1x-neo-robot-helpt-met-huishoudelijke-taken/']
  ],
  disc: 'We do not earn money from the links on this page and no robot maker or shop paid to be named.',
  gelezen: GELEZEN, publishAt: '2026-11-19', updatedAt: '2026-11-19'
};

export const ROBOT_GUIDES = { us: [ROBOT], de: [] };
