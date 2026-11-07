// Keuzehulpen op whichtobuy.best met de eigen KDP-boeken van Henkjan (7 nov 2026: "Ja zeker in keuzehulpen alle boeken opnemen .
// Goed idee en zorg voor SEO en LLM optimalisatie ."). Met de hand geschreven (de AI Gateway staat sinds 31 okt op 402).
// Regels: een echte keuzehulp, niet alleen ons boek. Ons boek is de keuze waar het past, met de vermelding dat wij het uitgeven;
// bij de andere antwoorden een eerlijke zoekopdracht op Amazon. Alleen feiten uit de Amazon-listing (titel, ISBN, prijs met datum),
// niets verzinnen over de inhoud. Link naar de winkel van het land van de bezoeker (amazon.com, .ca, .co.uk, .com.au), zonder tag.
// Geen gedachtestreepjes in de tekst.

const WINKEL = { us: 'www.amazon.com', ca: 'www.amazon.ca', gb: 'www.amazon.co.uk', au: 'www.amazon.com.au' };
export const BOEKEN = {
  teens: { asin: 'B0DJQLBM75', isbn: '9798342200967', naam: 'Stocking Stuffers For Teens: The Weirdest, Smartest, Most Hilarious 408 Facts You Will Ever Hear', kort: 'Stocking Stuffers For Teens (408 facts)', auteur: 'Elias Grant', prijs: '$9.99' },
  adults: { asin: 'B0DJQS1K5Z', isbn: '9798342207812', naam: 'Stocking Stuffers for Adults: Mind-Blowing Facts You Won’t Believe (But Totally Should)', kort: 'Stocking Stuffers for Adults (mind-blowing facts)', prijs: '$9.99' },
  dadjokes: { asin: 'B0DK3CSYXW', isbn: '9798343189766', naam: 'White Elephant Gifts for Men: Dad Jokes You Never Asked For: 400 Ways to Make Anyone Groan', kort: 'Dad Jokes You Never Asked For (400 jokes)', prijs: '$8.99' },
  bible: { asin: 'B0D2KZGWYJ', isbn: '9798323495467', naam: 'Bible Color By Number Book for Kids: Christ-Centered Scripture Stories With Hand-Drawn Coloring Pages for Boys and Girls', kort: 'Bible Color By Number Book for Kids', prijs: '$9.99' },
  apocrypha: { asin: 'B0DDBTXC9J', isbn: '9798334477070', naam: 'The Definitive Apocrypha: Collection of all books Rejected from the Bible', kort: 'The Definitive Apocrypha', prijs: '$13.99' },
  grill: { asin: 'B0BKRPL5JX', isbn: '9798360614098', naam: 'PIT BOSS Wood Pellet Grill and Smoker Cookbook: The Ultimate Pit Boss Bible with 1500 Amazing Mouthwatering BBQ Recipes', kort: 'PIT BOSS Wood Pellet Grill and Smoker Cookbook (1500 recipes)', prijs: '$17.04' }
};
const PRIJSDAG = '7 Nov 2026';
const landVan = l => { l = String(l || '').toLowerCase(); return WINKEL[l] ? l : (l === 'uk' ? 'gb' : 'us'); };
export const boekLink = (b, land) => 'https://' + WINKEL[landVan(land)] + '/dp/' + b.asin;
const antwoorden = (it, raw) => { const v = Array.isArray(raw) ? raw : String(raw || '').split('-'); return it.questions.map((q, i) => { const n = Number(v[i]); return Number.isInteger(n) && n >= 0 && n < q.options.length ? n : 0; }); };
const EIGEN = 'Full disclosure: we publish this book, so we are not neutral about it. We do not earn a commission on this link. Compare it with the other options before you buy.';
const prijsZin = (b, land) => landVan(land) === 'us' ? b.prijs + ' on Amazon US on ' + PRIJSDAG + '. Check the current price on Amazon.' : 'Check the current price in your Amazon store.';
const eigenKeuze = (b, land, o) => ({ eigen: true, asin: b.asin, link: boekLink(b, land), btn: 'See the book on Amazon', disc: EIGEN, budget: prijsZin(b, land), ...o });
const zoek = (query, o) => ({ query, ...o });

// Elke gids: de eerste vraag bepaalt de route; de andere vragen geven alleen een passende aanvulling.
export const KDP_GUIDES = [
  {
    slug: 'stocking-stuffers-for-teens', decisionKind: 'boek', priority: 60, cat: 'Books & Gifts', term: 'stocking stuffers for teens',
    title: 'Which stocking stuffer fits your teen?', h1: 'Stocking stuffers for teens: what to give this Christmas?',
    seoTitle: 'Stocking stuffers for teens: pick by what they love',
    metaDesc: 'Weird facts, puzzles or something to write in? Three questions point you to a stocking stuffer your teen will actually use, with Amazon links.',
    intro: 'Teens are hard to buy for, and a stocking stuffer has to be small, cheap and still feel like a real gift. Start from what your teen already enjoys.',
    kort: 'For a teen who likes to make people laugh, a pocket book of weird facts works well: they read it aloud and quote it for weeks. For a quiet thinker, choose a puzzle or brain teaser book. For a creative teen, a guided journal or sketchbook. All three fit in a stocking and cost around $10 to $15.',
    questions: [
      { q: 'What does your teen enjoy most?', options: [{ label: 'Weird facts and making people laugh' }, { label: 'Puzzles and brain teasers' }, { label: 'Writing or drawing' }] },
      { q: 'When will they use it?', options: [{ label: 'Christmas morning, with family' }, { label: 'On the go, a few minutes at a time' }, { label: 'Quiet time alone' }] },
      { q: 'What is your budget?', options: [{ label: 'Under $10' }, { label: '$10 to $20' }, { label: 'Over $20' }] }
    ],
    routes: [
      ['teens', { title: 'A book of short, weird facts', why: 'Your teen likes to surprise and amuse people. Short facts can be read in any order, read aloud on Christmas morning and quoted at school. Our pick: Stocking Stuffers For Teens, 408 weird, smart and funny facts in a small paperback.', note: 'It is screen free and needs no setup. Look at the sample pages on Amazon to check the humor fits your teen.', tradeoff: 'It is a fact book, not a story or a game. A teen who wants a challenge will enjoy a puzzle book more.' }],
      [null, zoek('brain teaser puzzle book for teens', { title: 'A puzzle or brain teaser book', why: 'A teen who likes to figure things out gets more from a book that asks something of them: logic puzzles, riddles or brain teasers with answers in the back.', note: 'Check the age range and the difficulty in the description; many puzzle books are written for younger kids.', tradeoff: 'Puzzle books are used alone; they are less of a shared Christmas morning moment.' })],
      [null, zoek('guided journal for teens', { title: 'A guided journal or sketchbook', why: 'A creative teen will use a journal with prompts or a good sketchbook long after Christmas.', note: 'Prompts work better than blank pages for teens who do not write every day.', tradeoff: 'It is personal: pick a style close to their taste, or let them choose.' })]
    ],
    tips: ['Stocking stuffers that get used are the ones that match a habit the teen already has.', 'Books with short entries suit teens with little free time: they can read two pages and stop.', 'Write a short note inside the cover; teens keep those.'],
    faq: [
      { q: 'What is a good stocking stuffer for a teenager?', a: 'Something small that matches what they already enjoy: a book of weird facts for the class clown, a brain teaser book for a puzzler, a guided journal for a creative teen. Most cost around $10 to $15.' },
      { q: 'Are fact books good gifts for teens?', a: 'Yes, for teens who like to share what they learn. Short entries can be read in any order and read aloud, which also makes them fun on Christmas morning.' },
      { q: 'What can I put in a teen boy’s stocking?', a: 'A funny fact book, a puzzle book, a small game or a gift card. Pick by interest, not by age alone.' },
      { q: 'Who publishes the fact book you recommend?', a: 'We do. That is why we say so next to the link and show other options for teens who are not into facts.' }
    ],
    publishAt: '2026-11-07', updatedAt: '2026-11-07'
  },
  {
    slug: 'funny-stocking-stuffers-for-adults', decisionKind: 'boek', priority: 61, cat: 'Books & Gifts', term: 'funny stocking stuffers for adults',
    title: 'Which funny stocking stuffer fits them?', h1: 'Funny stocking stuffers for adults: what to give?',
    seoTitle: 'Funny stocking stuffers for adults and dads',
    metaDesc: 'Dad jokes, mind-blowing facts or a white elephant swap? Three questions help you pick a funny stocking stuffer for an adult, with Amazon links.',
    intro: 'A funny stocking stuffer for an adult works when it fits their kind of humor: groan-worthy jokes, surprising facts or a gag for an office swap.',
    kort: 'For a dad or grandpa who loves bad puns, give a dad joke book. For someone who loves trivia and conversation starters, a book of surprising facts. For an office white elephant swap, choose something everyone can enjoy and pass around.',
    questions: [
      { q: 'Who is it for?', options: [{ label: 'A dad or grandpa who loves bad jokes' }, { label: 'Someone who loves trivia' }, { label: 'An office white elephant swap' }] },
      { q: 'How will it be used?', options: [{ label: 'Read aloud at the table' }, { label: 'Kept on a nightstand or in the bathroom' }, { label: 'Passed around at a party' }] },
      { q: 'What is your budget?', options: [{ label: 'Under $10' }, { label: '$10 to $20' }, { label: 'Over $20' }] }
    ],
    routes: [
      ['dadjokes', { title: 'A dad joke book', why: 'Some people live for the groan. Our pick: Dad Jokes You Never Asked For, 400 jokes in a small paperback that fits a stocking.', note: 'Look at the sample pages on Amazon to check the style of humor.', tradeoff: 'Puns are an acquired taste. For someone who prefers to learn something, pick the fact book.' }],
      ['adults', { title: 'A book of mind-blowing facts', why: 'For a trivia lover, surprising facts become conversation starters. Our pick: Stocking Stuffers for Adults, mind-blowing facts in a small paperback.', note: 'Short entries can be read in any order, a few at a time.', tradeoff: 'It is a fact book, not a quiz. For a competitive person, a trivia game may land better.' }],
      ['adults', { title: 'Something everyone at the swap can enjoy', why: 'In a white elephant swap the gift gets passed around, so pick something anyone can pick up and laugh at. A book of surprising facts works for most people; our pick is Stocking Stuffers for Adults.', note: 'Check the spending limit of the swap first; this costs about $10.', tradeoff: 'A joke book is funnier for some, but not everyone likes puns.' }]
    ],
    tips: ['A funny gift lands when it fits the person’s own humor, not yours.', 'For a swap, stay within the agreed limit and pick something nobody has to explain.'],
    faq: [
      { q: 'What is a good funny stocking stuffer for adults?', a: 'A dad joke book for the pun lover, a book of surprising facts for the trivia fan, or a small gag gift for an office swap. Most cost around $10.' },
      { q: 'What is a good white elephant gift under $10?', a: 'Something anyone can enjoy and pass around, like a book of surprising facts or a joke book.' },
      { q: 'Who publishes the books you recommend here?', a: 'We publish both books on this page, and we say so next to every link.' }
    ],
    publishAt: '2026-11-07', updatedAt: '2026-11-07'
  },
  {
    slug: 'bible-coloring-books-for-kids', decisionKind: 'boek', priority: 62, cat: 'Books & Gifts', term: 'bible coloring book for kids',
    title: 'Which Bible activity book fits your child?', h1: 'Bible coloring and activity books for kids: which one?',
    seoTitle: 'Bible coloring books for kids: which one fits?',
    metaDesc: 'Color by number, stickers or a story Bible? Three questions help you choose a Bible activity book for your child, with Amazon links.',
    intro: 'A Bible activity book should fit how your child likes to spend quiet time: coloring, puzzles and stickers, or listening to and reading the stories.',
    kort: 'For a child who loves to color, a Bible color by number book combines a calm activity with a Bible story on each page. For a child who likes stickers and puzzles, choose a Bible activity book. For reading together, a children’s story Bible.',
    questions: [
      { q: 'What does your child like most?', options: [{ label: 'Coloring' }, { label: 'Stickers and puzzles' }, { label: 'Listening to stories' }] },
      { q: 'How old is your child?', options: [{ label: '4 to 6' }, { label: '7 to 9' }, { label: '10 to 12' }] },
      { q: 'Where will it be used?', options: [{ label: 'At home' }, { label: 'Sunday school or church' }, { label: 'As a gift' }] }
    ],
    routes: [
      ['bible', { title: 'A Bible color by number book', why: 'Coloring by number is calm and gives a finished picture every time, with a Bible story on each page. Our pick: Bible Color By Number Book for Kids, Christ-centered scripture stories with hand-drawn coloring pages.', note: 'Color by number asks a child to match numbers to colors. Look at the sample pages on Amazon to check it suits your child’s age.', tradeoff: 'It is a coloring book, not a full story Bible. For reading together, add a children’s story Bible.' }],
      [null, zoek('bible activity book for kids stickers puzzles', { title: 'A Bible activity book with stickers and puzzles', why: 'Mazes, word searches and stickers keep active kids busy while they learn the stories.', note: 'Check the age on the cover; word searches need confident readers.', tradeoff: 'Sticker books are used up quickly.' })],
      [null, zoek('children’s story bible illustrated', { title: 'An illustrated children’s story Bible', why: 'For listening and reading together, a story Bible with pictures tells the stories in order.', note: 'Read a sample page aloud on Amazon to hear whether the language fits your child.', tradeoff: 'It is for reading, not for a quiet activity on their own.' })]
    ],
    tips: ['Color by number suits children who can recognize numbers; younger children may need help.', 'For Sunday school, pick a book with one story per page so each child can work on their own story.'],
    faq: [
      { q: 'What is a good Bible coloring book for kids?', a: 'For a calm activity with a story on each page, a Bible color by number book. For active kids, a Bible activity book with stickers and puzzles.' },
      { q: 'What age is a Bible color by number book for?', a: 'Most children who can recognize numbers can do color by number, roughly from age 5. Look at the sample pages to judge the detail.' },
      { q: 'Who publishes the coloring book you recommend?', a: 'We do, and we say so next to the link.' }
    ],
    publishAt: '2026-11-07', updatedAt: '2026-11-07'
  },
  {
    slug: 'apocrypha-book', decisionKind: 'boek', priority: 63, cat: 'Books & Gifts', term: 'apocrypha book',
    title: 'Which Apocrypha book should you buy?', h1: 'Which Apocrypha book should you buy?',
    seoTitle: 'Which Apocrypha book should you buy?',
    metaDesc: 'Read the books left out of the Bible, study them with notes, or get a Bible that includes them? Three questions point you to the right Apocrypha book.',
    intro: 'The Apocrypha are the books that appear in some Bibles and not in others, such as Tobit, Judith and the books of Maccabees. Which book you need depends on why you want to read them.',
    kort: 'To simply read the books left out of most Protestant Bibles in one volume, choose a collected Apocrypha edition. For study with notes and a scholarly translation, choose a study edition. If you want them inside your Bible, a Catholic or Orthodox Bible already includes several of these books.',
    questions: [
      { q: 'Why do you want to read the Apocrypha?', options: [{ label: 'To read the books left out, all in one book' }, { label: 'To study them with notes' }, { label: 'I want a Bible that includes them' }] },
      { q: 'How do you like to read?', options: [{ label: 'Large print paperback' }, { label: 'Any paperback' }, { label: 'Kindle or ebook' }] },
      { q: 'Is it for you or a gift?', options: [{ label: 'For me' }, { label: 'A gift' }] }
    ],
    routes: [
      ['apocrypha', { title: 'A collected Apocrypha edition', why: 'You want to read the books that were left out, in one place. Our pick: The Definitive Apocrypha, a collection of the books rejected from the Bible, with a foreword and introductions by Edward Whelan according to the Amazon listing.', note: 'Look at the table of contents in the Amazon preview to see exactly which books are included.', tradeoff: 'It is a reading edition, not a scholarly study edition with notes.' }],
      [null, zoek('apocrypha study edition with notes', { title: 'A study edition with notes', why: 'For study, notes and an introduction to each book help more than the text alone.', note: 'Check which translation it uses and whether the notes cover every book you want.', tradeoff: 'Study editions are larger and cost more.' })],
      [null, zoek('catholic bible deuterocanonical books', { title: 'A Bible that includes these books', why: 'Catholic and Orthodox Bibles include several of these books in the Old Testament, so you read them in context.', note: 'Catholic and Orthodox Bibles do not include exactly the same books; check the contents.', tradeoff: 'A full Bible is bigger than a separate Apocrypha book.' })]
    ],
    tips: ['Apocrypha, deuterocanonical books and pseudepigrapha are not the same list; check the contents before you buy.', 'If you already own a Catholic Bible, you may have many of these books already.'],
    faq: [
      { q: 'What books are in the Apocrypha?', a: 'It depends on the edition. Common ones are Tobit, Judith, Wisdom of Solomon, Sirach, Baruch and 1 and 2 Maccabees. Check the table of contents of the edition you buy.' },
      { q: 'Do Catholic Bibles include the Apocrypha?', a: 'Catholic Bibles include several of these books as deuterocanonical books in the Old Testament.' },
      { q: 'Who publishes the edition you recommend?', a: 'We do, and we say so next to the link.' }
    ],
    publishAt: '2026-11-07', updatedAt: '2026-11-07'
  },
  {
    slug: 'pellet-grill-cookbook', decisionKind: 'boek', priority: 64, cat: 'Books & Gifts', term: 'pellet grill cookbook',
    title: 'Which pellet grill cookbook fits you?', h1: 'Which pellet grill cookbook should you buy?',
    seoTitle: 'Pellet grill cookbook: which one fits your grill?',
    metaDesc: 'Pit Boss, Traeger or another pellet grill? Lots of recipes or learning to smoke? Three questions point you to the right pellet grill cookbook.',
    intro: 'A pellet grill cookbook is most useful when it matches your grill and what you want from it: lots of recipes to try, or learning to smoke meat properly.',
    kort: 'For a Pit Boss owner who wants a long list of recipes to try, choose a Pit Boss cookbook with many recipes. For a Traeger, a Traeger cookbook uses the same settings as your grill. To learn smoking itself, choose a book about technique rather than recipes.',
    questions: [
      { q: 'Which grill do you have?', options: [{ label: 'Pit Boss' }, { label: 'Traeger' }, { label: 'Another pellet grill' }] },
      { q: 'What do you want from the book?', options: [{ label: 'Lots of recipes to try' }, { label: 'Learn to smoke meat properly' }, { label: 'Quick weeknight meals' }] },
      { q: 'Is it for you or a gift?', options: [{ label: 'For me' }, { label: 'A gift' }] }
    ],
    routes: [
      ['grill', { title: 'A Pit Boss cookbook with many recipes', why: 'Our pick: PIT BOSS Wood Pellet Grill and Smoker Cookbook, with 1500 BBQ recipes according to the title, so there is always something new to try.', note: 'Look at the sample pages on Amazon to see the style of the recipes.', tradeoff: 'A big recipe collection is not a technique course. To learn the basics of smoking, add a technique book.' }],
      [null, zoek('traeger grill cookbook', { title: 'A Traeger cookbook', why: 'A book written for your grill uses the same settings and terms.', note: 'Check that it covers your model and wood pellets.', tradeoff: 'Brand books may repeat recipes from the app.' })],
      [null, zoek('pellet grill smoker cookbook beginners', { title: 'A general pellet grill cookbook', why: 'For another brand, a general pellet grill book explains temperatures that work on any pellet grill.', note: 'Check the reviews for your brand.', tradeoff: 'Settings may differ a little from your grill’s manual.' })]
    ],
    tips: ['Match the book to your grill first, then to the kind of cooking you want to do.', 'For a gift, a book with many recipes is a safer pick than a technique course.'],
    faq: [
      { q: 'What is the best cookbook for a Pit Boss pellet grill?', a: 'For lots of recipes to try, a Pit Boss cookbook with a large recipe collection. To learn smoking, a book about technique.' },
      { q: 'Can I use a Traeger cookbook on a Pit Boss?', a: 'Mostly yes: pellet grills work the same way. Temperatures and times may need small changes for your grill.' },
      { q: 'Who publishes the Pit Boss cookbook you recommend?', a: 'We do, and we say so next to the link.' }
    ],
    publishAt: '2026-11-07', updatedAt: '2026-11-07'
  }
];

export function boekDecision(it, raw, land) {
  const a = antwoorden(it, raw); const [key, d] = it.routes[a[0]] || it.routes[0];
  const budget = it.questions[2] && /budget/i.test(it.questions[2].q) ? ['Fits a small budget.', 'Leaves room to add a small extra.', 'Add something to go with it, like a card or a treat.'][a[2]] || '' : '';
  if (key && BOEKEN[key]) { const b = BOEKEN[key]; return eigenKeuze(b, land, { ...d, budget: prijsZin(b, land) + (budget ? ' ' + budget : ''), query: it.term }); }
  return { ...d, budget: budget || 'Compare current prices and the sample pages on Amazon.' };
}

export function boekSections(it, esc) {
  const eigen = [...new Set(it.routes.map(r => r[0]).filter(Boolean))].map(k => BOEKEN[k]);
  return `<section class="box"><h2>Tips</h2><ul>${(it.tips || []).map(t => '<li>' + esc(t) + '</li>').join('')}</ul></section><section class="box"><h2>How we choose, and what we publish</h2><p>We choose by fit: what the person already enjoys, how they will use it and your budget. We publish ${eigen.length === 1 ? 'one of the books' : 'some of the books'} on this page and say so next to every link to ${eigen.length === 1 ? 'it' : 'them'}: ${eigen.map(b => esc(b.kort)).join('; ')}. We do not earn a commission on those links. For the other answers we link to an Amazon search so you can compare. Prices were checked on ${esc(PRIJSDAG)}.</p></section>`;
}

export function boekLd(it) {
  return [...new Set(it.routes.map(r => r[0]).filter(Boolean))].map(k => { const b = BOEKEN[k]; return { '@type': 'Book', name: b.naam, isbn: b.isbn, bookFormat: 'https://schema.org/Paperback', inLanguage: 'en', ...(b.auteur ? { author: { '@type': 'Person', name: b.auteur } } : {}), url: boekLink(b, 'us') }; });
}
