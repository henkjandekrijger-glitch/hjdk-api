// Keuzehulpen op whichtobuy.best met de eigen KDP-boeken van Henkjan (7 nov 2026: "Ja zeker in keuzehulpen alle boeken opnemen .
// Goed idee en zorg voor SEO en LLM optimalisatie ."). Met de hand geschreven (de AI Gateway staat sinds 31 okt op 402).
// Regels: een echte keuzehulp, niet alleen ons boek. Ons boek is de keuze waar het past, met de vermelding dat wij het uitgeven;
// bij de andere antwoorden een eerlijke zoekopdracht op Amazon. Alleen feiten uit de Amazon-listing (titel, ISBN, prijs met datum),
// niets verzinnen over de inhoud. Link naar de winkel van het land van de bezoeker (amazon.com, .ca, .co.uk, .com.au), zonder tag.
// Geen gedachtestreepjes in de tekst.

const WINKEL = { us: 'www.amazon.com', ca: 'www.amazon.ca', gb: 'www.amazon.co.uk', au: 'www.amazon.com.au' };
// Prijzen en paginatallen: Keepa (Amazon.com) op 14 nov 2026. Titels, ISBN en auteur zoals op de Amazon-listing.
export const BOEKEN = {
  teens: { asin: 'B0DJQLBM75', isbn: '9798342200967', naam: 'Stocking Stuffers For Teens: The Weirdest, Smartest, Most Hilarious 408 Facts You Will Ever Hear', kort: 'Stocking Stuffers For Teens (408 facts)', auteur: 'Elias Grant', prijs: '$9.99', usd: 9.99, paginas: 147 },
  adults: { asin: 'B0DJQS1K5Z', isbn: '9798342207812', naam: 'Stocking Stuffers for Adults: Mind-Blowing Facts You Won’t Believe (But Totally Should)', kort: 'Stocking Stuffers for Adults (mind-blowing facts)', auteur: 'Elias Grant', prijs: '$9.99', usd: 9.99, paginas: 142 },
  dadjokes: { asin: 'B0DK3CSYXW', isbn: '9798343189766', naam: 'White Elephant Gifts for Men: Dad Jokes You Never Asked For: 400 Ways to Make Anyone Groan', kort: 'Dad Jokes You Never Asked For (400 jokes)', auteur: 'Elias Grant', prijs: '$8.99', usd: 8.99, paginas: 103 },
  wtt: { asin: 'B0HRFY3TLB', isbn: '9798142060990', naam: 'Wait, That’s True?!: 1,000 Weird, Funny & Mind-Blowing Facts Nobody Told You: Trivia Gift Book for Teens and Adults', kort: 'Wait, That’s True?! (1,000 facts)', auteur: 'Elias Grant', prijs: '$14.99', usd: 14.99 },
  formen: { asin: 'B0HRGNJ7CY', isbn: '9798142091680', naam: 'Wait, That’s True?! For Men: 800 Unusual Facts & Rare Knowledge for Men Who Have Everything', kort: 'Wait, That’s True?! For Men (800 facts)', auteur: 'Elias Grant', prijs: '$14.99', usd: 14.99 },
  bible: { asin: 'B0D2KZGWYJ', isbn: '9798323495467', naam: 'Bible Color By Number Book for Kids: Christ-Centered Scripture Stories With Hand-Drawn Coloring Pages for Boys and Girls', kort: 'Bible Color By Number Book for Kids', prijs: '$9.94', usd: 9.94, paginas: 43 },
  bibleverse: { asin: 'B0D4LPN8YB', isbn: '9798325952210', naam: 'Bible Memory Verse Coloring Book for Kids: Easy and Short Scriptures Every Child Should Know, With Hand-Drawn Coloring Pages for Boys and Girls', kort: 'Bible Memory Verse Coloring Book for Kids', prijs: '$7.99', usd: 7.99 },
  apocrypha: { asin: 'B0DDBTXC9J', isbn: '9798334477070', naam: 'The Definitive Apocrypha: Collection of all books Rejected from the Bible', kort: 'The Definitive Apocrypha', prijs: '$13.99', usd: 13.99, paginas: 396 },
  enoch: { asin: 'B0B5KV79N1', isbn: '9798834320760', naam: 'Books Of Enoch: A Complete Collection of 3 Books: 1 The Ethiopian Book of Enoch, 2 The Book of the Secrets of Enoch, 3 The Hebrew Book of Enoch', kort: 'Books of Enoch: A Complete Collection of 3 Books', prijs: '$15.99', usd: 15.99 },
  grill: { asin: 'B0BKRPL5JX', isbn: '9798360614098', naam: 'PIT BOSS Wood Pellet Grill and Smoker Cookbook: The Ultimate Pit Boss Bible with 1500 Amazing Mouthwatering BBQ Recipes', kort: 'PIT BOSS Wood Pellet Grill and Smoker Cookbook (1500 recipes)', auteur: 'Alec Poole', prijs: '$17.04', usd: 17.04, paginas: 279 },
  traeger: { asin: 'B0C4WXBN21', isbn: '9798394335938', naam: 'Traeger Grill Cookbook: The Ultimate Traeger Bible', kort: 'Traeger Grill Cookbook: The Ultimate Traeger Bible', auteur: 'Alec Poole', prijs: '$12.68', usd: 12.68 },
  griddle: { asin: 'B0CHL3MH5Q', isbn: '9798861047647', naam: 'The Outdoor Griddle Bible: Unlock Effortless Outdoor Culinary Excellence', kort: 'The Outdoor Griddle Bible', auteur: 'Alec Poole', prijs: '$24.93', usd: 24.93 },
  crockpot: { asin: 'B09X4MCHCM', isbn: '9798449178503', naam: 'Crock Pot Cookbook for Beginners: Easy and Tasty Everyday Slow Cooker Recipes with Simple to Follow Instructions for Beginners', kort: 'Crock Pot Cookbook for Beginners', auteur: 'Alec Poole', prijs: '$17.97', usd: 17.97 },
  lasting: { asin: 'B0F1SM1L5J', isbn: '9798314012383', naam: 'Lasting Change Workbook: The Anti-Boring Playbook to Rewire Your Habits, Upgrade Your Identity, and Stay Consistent for Life', kort: 'Lasting Change Workbook', auteur: 'John Warrior', prijs: '$24.99', usd: 24.99 },
  momws: { asin: 'B0CZRWNZBB', isbn: '9798321691984', naam: 'Mom’s Word Search: Large Print Puzzles for Relaxation and Happiness: 1000 Words Puzzle Book for Adults, Women, and Seniors', kort: 'Mom’s Word Search (large print, 1000 words)', prijs: '$8.99', usd: 8.99 },
  golden: { asin: 'B0GYZGW9J7', isbn: '9798321693094', naam: 'Golden Memories: Large Print Word Search for Adults and Seniors: A Nostalgic Journey through 50s, 60s, 70s & 80s', kort: 'Golden Memories (large print, 50s to 80s)', prijs: '$7.99', usd: 7.99 },
  bathroomws: { asin: 'B0DNQCYTBZ', isbn: '9798300380007', naam: 'Bathroom Word Search Large Print Puzzles [2 books in 1]: White Elephant Gifts for Adults', kort: 'Bathroom Word Search (large print, 2 in 1)', prijs: '$4.99', usd: 4.99 },
  coin: { asin: 'B0B2HYL6VZ', isbn: '9798832680132', naam: 'Coin Collecting for Beginners: The Illustrated Numismatic Guide For Beginners, Including Grading, Storing, and Where To Buy', kort: 'Coin Collecting for Beginners (illustrated)', auteur: 'Nicholas Olden', prijs: '$11.97', usd: 11.97 }
};
const PRIJSDAG = '14 Nov 2026';
// Alle boekgidsen linken onderling (cluster): api/wtb.js geeft 'verwant' +20 in de lijst met gerelateerde gidsen.
const BOEKGIDSEN = ['stocking-stuffers-for-teens', 'funny-stocking-stuffers-for-adults', 'fun-facts-books-for-adults', 'bible-coloring-books-for-kids', 'apocrypha-book', 'book-of-enoch', 'pellet-grill-cookbook', 'griddle-cookbook', 'slow-cooker-cookbook-for-beginners', 'habit-change-workbook', 'large-print-word-search-for-seniors', 'coin-collecting-book-for-beginners'];
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
    guide: 'Start from a habit your teen already has. A teen who repeats funny things at dinner will use a fact book; a teen who does logic games on the bus will use a puzzle book; a teen who doodles in the margins will use a sketchbook.\nSize matters for a stocking: a small paperback fits, a large hardcover does not. Short entries also suit teens with little free time, because they can read two pages and stop.\nScreen-free gifts work best when they are easy to pick up: no setup, no rules to learn, nothing to charge.',
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
    guide: 'Funny gifts work when they match the person\u2019s own sense of humor. Pun lovers enjoy a book of dad jokes they can read out loud; people who like to learn something enjoy surprising facts they can share.\nFor an office white elephant swap, stay within the spending limit and choose something anyone can enjoy without an explanation.\nSmall paperbacks fit a stocking and are easy to leave on a nightstand or coffee table, where they get picked up again and again.',
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
    kort: 'For a child who loves to color, a Bible color by number book combines a calm activity with a Bible story on each page. For a child who likes stickers and puzzles, choose a Bible activity book. For reading together, a children’s story Bible. To help a child learn verses by heart, a memory verse coloring book.',
    questions: [
      { q: 'What does your child like most?', options: [{ label: 'Coloring Bible stories' }, { label: 'Stickers and puzzles' }, { label: 'Listening to stories' }, { label: 'Learning Bible verses by heart' }] },
      { q: 'How old is your child?', options: [{ label: '4 to 6' }, { label: '7 to 9' }, { label: '10 to 12' }] },
      { q: 'Where will it be used?', options: [{ label: 'At home' }, { label: 'Sunday school or church' }, { label: 'As a gift' }] }
    ],
    routes: [
      ['bible', { title: 'A Bible color by number book', why: 'Coloring by number is calm and gives a finished picture every time, with a Bible story on each page. Our pick: Bible Color By Number Book for Kids, Christ-centered scripture stories with hand-drawn coloring pages.', note: 'Color by number asks a child to match numbers to colors. Look at the sample pages on Amazon to check it suits your child’s age.', tradeoff: 'It is a coloring book, not a full story Bible. For reading together, add a children’s story Bible.' }],
      [null, zoek('bible activity book for kids stickers puzzles', { title: 'A Bible activity book with stickers and puzzles', why: 'Mazes, word searches and stickers keep active kids busy while they learn the stories.', note: 'Check the age on the cover; word searches need confident readers.', tradeoff: 'Sticker books are used up quickly.' })],
      [null, zoek('children’s story bible illustrated', { title: 'An illustrated children’s story Bible', why: 'For listening and reading together, a story Bible with pictures tells the stories in order.', note: 'Read a sample page aloud on Amazon to hear whether the language fits your child.', tradeoff: 'It is for reading, not for a quiet activity on their own.' })],
      ['bibleverse', { title: 'A memory verse coloring book', why: 'Coloring a short verse while saying it out loud helps a child remember it. Our pick: Bible Memory Verse Coloring Book for Kids, easy and short scriptures with hand-drawn coloring pages.', note: 'The verses are short, but a child who cannot read yet will need someone to read them aloud.', tradeoff: 'It teaches verses, not the stories around them. For the stories, choose the color by number book or a story Bible.' }]
    ],
    guide: 'Match the book to how your child likes to spend quiet time. Coloring calms many children down and gives them a finished picture; stickers and mazes suit children who need more action; a story Bible suits reading together before bed.\nColor by number asks a child to recognize numbers and match them to colors. Most children can do that from around age 5, sometimes with help at first.\nFor Sunday school, one story per page works well, because each child can work on a story of their own.',
    tips: ['Color by number suits children who can recognize numbers; younger children may need help.', 'For Sunday school, pick a book with one story per page so each child can work on their own story.'],
    faq: [
      { q: 'What is a good Bible coloring book for kids?', a: 'For a calm activity with a story on each page, a Bible color by number book. For active kids, a Bible activity book with stickers and puzzles.' },
      { q: 'What age is a Bible color by number book for?', a: 'Most children who can recognize numbers can do color by number, roughly from age 5. Look at the sample pages to judge the detail.' },
      { q: 'How can I help my child memorize Bible verses?', a: 'Short verses, repeated out loud, work best. Coloring the verse while saying it gives a child something to do with their hands and a page to come back to.' },
      { q: 'Who publishes the coloring books you recommend?', a: 'We publish both coloring books on this page, and we say so next to every link.' }
    ],
    publishAt: '2026-11-07', updatedAt: '2026-11-14'
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
    guide: 'The word Apocrypha is used for different lists of books. Protestant Bibles usually leave these books out; Catholic Bibles include several of them in the Old Testament as deuterocanonical books; Orthodox Bibles include a few more. Pseudepigrapha such as 1 Enoch are a separate group.\nSo the first question is what you want: to read the books in one volume, to study them with notes, or to have them inside your Bible.\nWhatever you choose, look at the table of contents before you buy. Editions differ in which books they include and in which translation they use.',
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
    kort: 'For a Pit Boss owner who wants a long list of recipes to try, choose a Pit Boss cookbook with many recipes. For a Traeger owner, a Traeger cookbook such as The Ultimate Traeger Bible uses the same settings as the grill. To learn smoking itself, choose a book about technique rather than recipes.',
    questions: [
      { q: 'Which grill do you have?', options: [{ label: 'Pit Boss' }, { label: 'Traeger' }, { label: 'Another pellet grill' }] },
      { q: 'What do you want from the book?', options: [{ label: 'Lots of recipes to try' }, { label: 'Learn to smoke meat properly' }, { label: 'Quick weeknight meals' }] },
      { q: 'Is it for you or a gift?', options: [{ label: 'For me' }, { label: 'A gift' }] }
    ],
    routes: [
      ['grill', { title: 'A Pit Boss cookbook with many recipes', why: 'Our pick: PIT BOSS Wood Pellet Grill and Smoker Cookbook, with 1500 BBQ recipes according to the title, so there is always something new to try.', note: 'Look at the sample pages on Amazon to see the style of the recipes.', tradeoff: 'A big recipe collection is not a technique course. To learn the basics of smoking, add a technique book.' }],
      ['traeger', { title: 'A Traeger cookbook', why: 'A book written for your grill uses the same settings and terms as your Traeger. Our pick: Traeger Grill Cookbook, The Ultimate Traeger Bible, a large backyard BBQ recipe collection.', note: 'Look at the sample pages on Amazon to see whether the recipes match the cuts and sides you like to cook.', tradeoff: 'It is a recipe collection, not a smoking course. To learn fire, smoke and resting, add a technique book.' }],
      [null, zoek('pellet grill smoker cookbook beginners', { title: 'A general pellet grill cookbook', why: 'For another brand, a general pellet grill book explains temperatures that work on any pellet grill.', note: 'Check the reviews for your brand.', tradeoff: 'Settings may differ a little from your grill’s manual.' })]
    ],
    guide: 'A pellet grill cookbook is most useful when its temperatures and terms match your grill. Pellet grills work the same way across brands, so any pellet grill book is usable, but a book written for your brand saves you translating settings.\nDecide whether you want a large collection of recipes to try or a book that teaches the basics of smoking: fire, smoke, temperature and resting. Recipe collections give variety; technique books make every recipe better.\nFor a gift, a book with many recipes is the safer choice, because it suits beginners and experienced grillers alike.',
    tips: ['Match the book to your grill first, then to the kind of cooking you want to do.', 'For a gift, a book with many recipes is a safer pick than a technique course.'],
    faq: [
      { q: 'What is the best cookbook for a Pit Boss pellet grill?', a: 'For lots of recipes to try, a Pit Boss cookbook with a large recipe collection. To learn smoking, a book about technique.' },
      { q: 'Can I use a Traeger cookbook on a Pit Boss?', a: 'Mostly yes: pellet grills work the same way. Temperatures and times may need small changes for your grill.' },
      { q: 'Which cookbook is best for a Traeger?', a: 'A Traeger cookbook uses the same terms and settings as the grill. Our pick is Traeger Grill Cookbook: The Ultimate Traeger Bible, which we publish; compare it with other Traeger books on Amazon.' },
      { q: 'Who publishes the cookbooks you recommend?', a: 'We publish the Pit Boss and the Traeger cookbook on this page, and we say so next to every link.' }
    ],
    publishAt: '2026-11-07', updatedAt: '2026-11-14'
  },
  {
    slug: 'fun-facts-books-for-adults', decisionKind: 'boek', priority: 65, cat: 'Books & Gifts', term: 'fun facts book for adults',
    title: 'Which fun facts book fits them?', h1: 'Fun facts books for adults: which one to give?',
    seoTitle: 'Fun facts books for adults: which one to give?',
    metaDesc: 'Trivia lover, a man who has everything or a quiz fan? Three questions point you to a fun facts book they will actually read, with Amazon links.',
    intro: 'A fun facts book is one of the few gifts people pick up again and again. The right one depends on who reads it and how they like to use it.',
    kort: 'For a curious adult or older teen who loves trivia, a big collection of short, surprising facts works best. For a man who has everything, a fact book written for men, with topics like cars, planes, money, grilling and movies. For someone who wants to be tested, a trivia quiz book with questions and answers.',
    questions: [
      { q: 'Who is it for?', options: [{ label: 'A curious adult or older teen' }, { label: 'A man who has everything' }, { label: 'Someone who loves to be quizzed' }] },
      { q: 'How will they read it?', options: [{ label: 'A few facts at a time' }, { label: 'Read aloud with family or friends' }, { label: 'Cover to cover' }] },
      { q: 'What is your budget?', options: [{ label: 'Under $10' }, { label: '$10 to $20' }, { label: 'Over $20' }] }
    ],
    routes: [
      ['wtt', { title: 'A big book of short, surprising facts', why: 'Short facts can be read in any order and shared at the table. Our pick: Wait, That’s True?!, 1,000 weird, funny and mind-blowing facts for teens and adults.', note: 'Look at the sample pages on Amazon to check the tone fits the reader.', tradeoff: 'It is a book to dip into, not a quiz. For someone competitive, a trivia question book lands better.' }],
      ['formen', { title: 'A fact book written for men', why: 'A man who has everything rarely owns a book that matches his interests this closely. Our pick: Wait, That’s True?! For Men, 800 unusual facts and rare knowledge on topics such as cars, planes, money, grilling and movies.', note: 'Check the sample pages on Amazon to see whether the topics match his hobbies.', tradeoff: 'The topics lean toward classic interests. For a man who prefers puzzles, choose a trivia quiz book.' }],
      [null, zoek('trivia quiz book for adults with answers', { title: 'A trivia quiz book', why: 'Some people would rather answer questions than read facts. A quiz book with answers in the back turns a gift into a game night.', note: 'Check the difficulty level and whether the answers are on the same page or at the back.', tradeoff: 'Once the questions are answered, it is less fun to read again.' })]
    ],
    guide: 'A fact book works when the reader likes to share what they read. Short entries suit busy people: they read three facts, put the book down and quote one at dinner.\nMatch the topics to the reader. A general collection covers animals, history, science and the human body; a book for men leans toward cars, money, food and adventure.\nIf the person loves competition more than reading, choose a quiz book instead: questions with answers turn the gift into a game.',
    tips: ['Pick by how the person likes to share: reading aloud, quoting at dinner or quizzing friends.', 'A fact book with short entries suits people with little free time.', 'For a family gift, choose a book that works for teens and adults so it gets passed around.'],
    faq: [
      { q: 'What is a good fun facts book for adults?', a: 'One with short, surprising entries that can be read in any order. Our pick for teens and adults is Wait, That’s True?! with 1,000 facts; for men, Wait, That’s True?! For Men. We publish both.' },
      { q: 'What book do you give a man who has everything?', a: 'Something that matches his interests and that he would not buy himself. A fact book written for men, with topics like cars, money and grilling, is easy to pick up and share.' },
      { q: 'Are fact books good gifts?', a: 'Yes, for people who like to learn and share. They suit a nightstand, a coffee table or a bathroom shelf, and work for readers from their teens up.' },
      { q: 'Who publishes the books you recommend?', a: 'We publish both Wait, That’s True?! books on this page and say so next to every link.' }
    ],
    publishAt: '2026-11-14', updatedAt: '2026-11-14'
  },
  {
    slug: 'book-of-enoch', decisionKind: 'boek', priority: 66, cat: 'Books & Gifts', term: 'book of enoch',
    title: 'Which Book of Enoch should you buy?', h1: 'Which Book of Enoch should you buy?',
    seoTitle: 'Which Book of Enoch should you buy?',
    metaDesc: 'All three books of Enoch, the classic 1 Enoch translation or a study commentary? Three questions point you to the right Book of Enoch edition.',
    intro: 'The Book of Enoch is an ancient Jewish text that is not in most Bibles. Three different books carry the name Enoch, so the edition you need depends on what you want to read.',
    kort: 'To read all three books, 1 Enoch (Ethiopic), 2 Enoch (the Book of the Secrets of Enoch) and 3 Enoch (Hebrew), choose a collected edition. To read only 1 Enoch in the classic English translation, choose the R. H. Charles translation. For study, choose a scholarly translation with commentary.',
    questions: [
      { q: 'What do you want to read?', options: [{ label: 'All three books of Enoch' }, { label: 'Only 1 Enoch, in the classic translation' }, { label: 'A scholarly study with notes' }] },
      { q: 'How will you read it?', options: [{ label: 'Paperback' }, { label: 'Large print' }, { label: 'Kindle or ebook' }] },
      { q: 'Is it for you or a gift?', options: [{ label: 'For me' }, { label: 'A gift' }] }
    ],
    routes: [
      ['enoch', { title: 'All three books of Enoch in one volume', why: 'You want the whole tradition, not only 1 Enoch. Our pick: Books of Enoch, a complete collection of three books: the Ethiopian Book of Enoch, the Book of the Secrets of Enoch and the Hebrew Book of Enoch.', note: 'Look at the table of contents and the sample pages on Amazon to check the translation and the print size.', tradeoff: 'It is a reading edition. For detailed notes on each passage, add a scholarly commentary.' }],
      [null, zoek('book of enoch r h charles translation', { title: '1 Enoch in the R. H. Charles translation', why: 'The 1912 translation by R. H. Charles is the classic English version of 1 Enoch and is widely reprinted.', note: 'Reprints differ in print quality and in whether they keep Charles’s notes; check the preview.', tradeoff: 'It covers 1 Enoch only, not 2 or 3 Enoch.' })],
      [null, zoek('1 enoch commentary scholarly translation', { title: 'A scholarly translation with commentary', why: 'For serious study, a modern scholarly translation with commentary explains the background, the manuscripts and the difficult passages.', note: 'Commentaries are long and detailed; check the length and the price before you buy.', tradeoff: 'More expensive and much heavier than a reading edition.' })]
    ],
    guide: 'Three books carry the name Enoch. 1 Enoch, often just called the Book of Enoch, survives complete in Ge’ez, the old language of Ethiopia, and is part of the Bible of the Ethiopian Orthodox Tewahedo Church. 2 Enoch, the Book of the Secrets of Enoch, survives in Old Church Slavonic. 3 Enoch is a later Hebrew text.\nThe New Testament letter of Jude quotes 1 Enoch (Jude 1:14 and 15), which is why many readers look for it.\nDecide first whether you want 1 Enoch only, or all three books together. Then look at the translation used and the size of the print.',
    tips: ['Check whether an edition contains 1 Enoch only or all three books.', 'Look for the translator in the description; older public domain translations are common in reprints.', 'Looking for the books left out of the Bible in general? See our Apocrypha guide.'],
    faq: [
      { q: 'What is the Book of Enoch?', a: 'An ancient Jewish text attributed to Enoch, the great-grandfather of Noah. Most Bibles do not include it, but the Bible of the Ethiopian Orthodox Tewahedo Church does.' },
      { q: 'Is the Book of Enoch in the Bible?', a: 'Not in most Bibles. It is part of the Bible of the Ethiopian Orthodox Tewahedo Church, and the New Testament letter of Jude quotes it.' },
      { q: 'What is the difference between 1, 2 and 3 Enoch?', a: '1 Enoch survives complete in Ge’ez (Ethiopic), 2 Enoch in Old Church Slavonic and 3 Enoch in Hebrew. They were written at different times and are different books.' },
      { q: 'Who publishes the edition you recommend?', a: 'We publish the three-book collection on this page and say so next to the link.' }
    ],
    publishAt: '2026-11-14', updatedAt: '2026-11-14'
  },
  {
    slug: 'griddle-cookbook', decisionKind: 'boek', priority: 67, cat: 'Books & Gifts', term: 'griddle cookbook',
    title: 'Which griddle cookbook fits you?', h1: 'Which griddle cookbook should you buy?',
    seoTitle: 'Griddle cookbook: which one fits your flat top?',
    metaDesc: 'New to a flat top, a Blackstone fan or on a budget? Three questions point you to a griddle cookbook that fits how you cook, with Amazon links.',
    intro: 'A flat top griddle cooks differently from a grill: high heat on a big steel surface, with smash burgers, breakfast and hibachi as favorites. A cookbook helps most when it matches how you want to use it.',
    kort: 'For a new griddle owner who wants one big guide with many recipes, a large format griddle book is the easiest start. For a Blackstone owner, a Blackstone cookbook uses the same terms. On a tight budget, a smaller paperback with basic recipes is enough.',
    questions: [
      { q: 'What do you need most?', options: [{ label: 'One big guide with lots of recipes' }, { label: 'Recipes written for my Blackstone' }, { label: 'A cheap book with the basics' }] },
      { q: 'What do you cook most?', options: [{ label: 'Burgers and steaks' }, { label: 'Breakfast' }, { label: 'Hibachi and stir fry' }] },
      { q: 'Is it for you or a gift?', options: [{ label: 'For me' }, { label: 'A gift' }] }
    ],
    routes: [
      ['griddle', { title: 'A big griddle guide with many recipes', why: 'Our pick: The Outdoor Griddle Bible, a large format guide to outdoor griddle cooking with BBQ griddle recipes.', note: 'Look at the sample pages on Amazon to check the recipes match what you like to cook.', tradeoff: 'At about $25 it costs more than most griddle paperbacks. If price matters most, a smaller book with basic recipes is enough.' }],
      [null, zoek('blackstone griddle cookbook', { title: 'A Blackstone cookbook', why: 'A book written for Blackstone griddles uses the same burner layout and terms as your grill.', note: 'Check the reviews from other Blackstone owners.', tradeoff: 'Brand books often repeat the recipes you also find online.' })],
      [null, zoek('griddle cookbook for beginners', { title: 'A basic griddle cookbook', why: 'On a tight budget, a small paperback with the basics covers seasoning, heat zones and the classic recipes.', note: 'Compare the number of recipes and the reviews.', tradeoff: 'Fewer recipes and fewer pictures.' })]
    ],
    guide: 'Griddle cooking is about heat zones and timing. Most flat tops are hottest in the middle and cooler at the edges, so recipes tell you where to cook and where to keep food warm.\nPick a book by what you cook most: burgers and steaks, breakfast, or hibachi style meals with vegetables and rice. A good griddle book also covers seasoning the steel and cleaning it, because that decides how your food tastes.\nBooks for one brand use that brand’s terms, but the recipes work on any outdoor flat top.',
    tips: ['Season the griddle before the first cook; most books explain how.', 'Recipes for one brand work on any flat top; adjust the heat to your burners.'],
    faq: [
      { q: 'What is the best cookbook for a Blackstone griddle?', a: 'A Blackstone cookbook uses the same terms, but any outdoor griddle book works on a Blackstone. Choose by the recipes you want to cook most.' },
      { q: 'Can I use a griddle cookbook on an indoor griddle?', a: 'Most recipes work, but indoor griddles get less hot. Expect longer cooking times and less sear.' },
      { q: 'Who publishes the griddle book you recommend?', a: 'We do, and we say so next to the link.' }
    ],
    publishAt: '2026-11-14', updatedAt: '2026-11-14'
  },
  {
    slug: 'slow-cooker-cookbook-for-beginners', decisionKind: 'boek', priority: 68, cat: 'Books & Gifts', term: 'slow cooker cookbook for beginners',
    title: 'Which slow cooker cookbook fits a beginner?', h1: 'Slow cooker cookbook for beginners: which one?',
    seoTitle: 'Slow cooker cookbook for beginners: which one?',
    metaDesc: 'Easy everyday recipes, healthier meals or dinners with almost no prep? Three questions point you to a slow cooker cookbook for beginners.',
    intro: 'A slow cooker is the easiest way to get dinner on the table without standing at the stove. For beginners, the right cookbook explains the basics and keeps the recipes simple.',
    kort: 'For a beginner who wants many easy everyday recipes with simple instructions, choose a Crock Pot cookbook written for beginners. For lighter meals, a healthy slow cooker cookbook. If you want almost no prep, a dump and go cookbook where everything goes into the pot at once.',
    questions: [
      { q: 'What do you want from the book?', options: [{ label: 'Easy everyday recipes' }, { label: 'Healthier meals' }, { label: 'Almost no prep' }] },
      { q: 'How many people do you cook for?', options: [{ label: '1 or 2' }, { label: '3 or 4' }, { label: '5 or more' }] },
      { q: 'Is it for you or a gift?', options: [{ label: 'For me' }, { label: 'A gift' }] }
    ],
    routes: [
      ['crockpot', { title: 'An everyday Crock Pot cookbook for beginners', why: 'Our pick: Crock Pot Cookbook for Beginners, easy and tasty everyday slow cooker recipes with simple to follow instructions.', note: 'Check the size of your slow cooker against the recipes; a small 2 or 3 quart pot needs smaller batches.', tradeoff: 'It focuses on everyday meals. For calorie counts and lighter meals, a healthy slow cooker book fits better.' }],
      [null, zoek('healthy slow cooker cookbook', { title: 'A healthy slow cooker cookbook', why: 'Lighter recipes with more vegetables and lean meat, often with calories per serving.', note: 'Check whether nutrition facts are included if you count calories.', tradeoff: 'Fewer comfort food classics.' })],
      [null, zoek('dump and go slow cooker cookbook', { title: 'A dump and go cookbook', why: 'Everything goes into the pot at once, so there is almost no chopping or browning.', note: 'Read a few recipes in the preview to see how much prep is really needed.', tradeoff: 'Skipping the browning step means a little less flavor.' })]
    ],
    guide: 'Slow cookers forgive a lot, but beginners often make two mistakes: filling the pot too full or too empty, and lifting the lid too often. A good beginner book explains both.\nMatch the book to your week. Everyday recipes suit families; healthy books add lighter meals; dump and go books skip browning and chopping where they can.\nCrock Pot is a brand name, but its recipes work in any slow cooker of a similar size.',
    tips: ['Fill the pot at least half and no more than three quarters full.', 'Every time you lift the lid, the cooking time gets longer.'],
    faq: [
      { q: 'What is a good slow cooker cookbook for beginners?', a: 'One with simple instructions and everyday recipes, like our pick Crock Pot Cookbook for Beginners. For lighter meals, a healthy slow cooker cookbook.' },
      { q: 'Do Crock Pot recipes work in other slow cookers?', a: 'Yes. Crock Pot is a brand name; the recipes work in any slow cooker of a similar size.' },
      { q: 'Who publishes the cookbook you recommend?', a: 'We do, and we say so next to the link.' }
    ],
    publishAt: '2026-11-14', updatedAt: '2026-11-14'
  },
  {
    slug: 'habit-change-workbook', decisionKind: 'boek', priority: 69, cat: 'Books & Gifts', term: 'habit workbook',
    title: 'Which habit workbook fits you?', h1: 'Habit workbook: which one helps you stick with it?',
    seoTitle: 'Habit workbook: which one helps you stick with it?',
    metaDesc: 'Build habits that last, plan the year or write a few minutes a day? Three questions point you to a workbook for New Year resolutions you will keep using.',
    intro: 'Most New Year resolutions are gone by February. A workbook helps when it gives you something to do every day, not just a list of goals.',
    kort: 'To change habits and stay consistent, choose a habit workbook with exercises you fill in. To plan goals for the whole year, choose a goal planner. To reflect a few minutes a day, a guided journal with prompts.',
    questions: [
      { q: 'What do you want to change?', options: [{ label: 'My habits, and stick with them' }, { label: 'Plan my goals for the year' }, { label: 'Reflect a few minutes a day' }] },
      { q: 'How much time do you have each day?', options: [{ label: '5 minutes' }, { label: '15 minutes' }, { label: '30 minutes or more' }] },
      { q: 'Is it for you or a gift?', options: [{ label: 'For me' }, { label: 'A gift' }] }
    ],
    routes: [
      ['lasting', { title: 'A habit workbook you fill in', why: 'You want to change what you do every day and keep doing it. Our pick: Lasting Change Workbook, the anti-boring playbook to rewire your habits, upgrade your identity and stay consistent.', note: 'Look at the sample pages on Amazon to see the exercises and decide whether you will fill them in.', tradeoff: 'A workbook only helps if you write in it. If you want a calendar for the year, a goal planner fits better.' }],
      [null, zoek('undated goal planner weekly monthly', { title: 'A goal planner', why: 'Monthly and weekly pages help you break a yearly goal into steps you can plan.', note: 'Undated planners let you start any time.', tradeoff: 'Planning is not the same as doing; some people fill in the plan and stop there.' })],
      [null, zoek('guided journal with prompts for adults', { title: 'A guided journal with prompts', why: 'A few minutes of writing with a prompt helps you notice what you want to change.', note: 'Choose prompts that fit your goal: gratitude, mindset or self-reflection.', tradeoff: 'Less structure than a workbook with exercises.' })]
    ],
    guide: 'Habits change when the new behavior is small, easy to start and repeated. A workbook helps because it turns that into a daily task: you write, check and adjust.\nChoose by what you will actually do. If you like exercises and checklists, a habit workbook. If you like planning, a goal planner with monthly and weekly pages. If you like to write freely, a guided journal.\nFor a gift, a workbook says you believe in the person’s plans; give it with a good pen.',
    tips: ['Start with one habit, not five.', 'Keep the book where you will see it every day, next to your coffee or your bed.'],
    faq: [
      { q: 'What is a good workbook for New Year resolutions?', a: 'One that gives you a small task every day. Our pick for building habits is Lasting Change Workbook; for planning the year, a goal planner.' },
      { q: 'Do habit workbooks work?', a: 'They work when you use them daily. Writing every day keeps the new habit in front of you.' },
      { q: 'Who publishes the workbook you recommend?', a: 'We do, and we say so next to the link.' }
    ],
    publishAt: '2026-11-14', updatedAt: '2026-11-14'
  },
  {
    slug: 'large-print-word-search-for-seniors', decisionKind: 'boek', priority: 70, cat: 'Books & Gifts', term: 'large print word search for seniors',
    title: 'Which large print word search fits them?', h1: 'Large print word search books for seniors: which one?',
    seoTitle: 'Large print word search for seniors: which book?',
    metaDesc: 'Relaxing puzzles for Mom, a nostalgic trip through the 50s to the 80s or a funny gag gift? Three questions point you to a large print word search.',
    intro: 'Large print word search books are a favorite gift for parents and grandparents: relaxing, easy on the eyes and good for a quiet half hour. The right book depends on the theme.',
    kort: 'For a mom or grandma who wants relaxing puzzles, a large print book with many words. For someone who loves to remember the old days, a nostalgic word search with themes from the 50s to the 80s. For a funny gag gift, a bathroom word search. For very poor eyesight, look for extra large print.',
    questions: [
      { q: 'Who is it for?', options: [{ label: 'Mom or grandma, to relax' }, { label: 'Someone who loves the old days' }, { label: 'A funny gift or a white elephant swap' }, { label: 'Someone with very poor eyesight' }] },
      { q: 'How often do they do puzzles?', options: [{ label: 'Every day' }, { label: 'Now and then' }, { label: 'Never tried' }] },
      { q: 'What is your budget?', options: [{ label: 'Under $10' }, { label: '$10 to $20' }, { label: 'Over $20' }] }
    ],
    routes: [
      ['momws', { title: 'Relaxing large print puzzles', why: 'Our pick: Mom’s Word Search, large print puzzles for relaxation with 1000 words, for adults, women and seniors.', note: 'Look at the sample pages on Amazon to check the print size suits her eyes.', tradeoff: 'It is a general puzzle book. For someone who loves themes from their youth, the nostalgic book is more personal.' }],
      ['golden', { title: 'A nostalgic word search', why: 'Puzzles with words from the 50s, 60s, 70s and 80s bring back memories and start conversations. Our pick: Golden Memories, a large print word search for adults and seniors.', note: 'Check the sample pages for the themes and the print size.', tradeoff: 'It is built around memories; for pure relaxation any large print book will do.' }],
      ['bathroomws', { title: 'A funny word search gag gift', why: 'For a laugh at a white elephant swap. Our pick: Bathroom Word Search, large print puzzles, two books in one.', note: 'It costs about $5, so it fits most swap limits.', tradeoff: 'It is a gag gift; for relaxing daily puzzles, choose a general large print book.' }],
      [null, zoek('extra large print word search for seniors low vision', { title: 'Extra large print', why: 'For very poor eyesight, look for books that say extra large or jumbo print and have fewer words per page.', note: 'Compare the font size in the preview pictures; large print is not the same in every book.', tradeoff: 'Fewer puzzles per book.' })]
    ],
    guide: 'Word search puzzles are easy to start, need no rules and can be put down at any moment, which is why they suit people of every age. Large print helps anyone who reads with glasses.\nChoose the theme by the person: relaxing general puzzles, a nostalgic theme with words from their youth, or a funny book for a gag gift.\nLook at the sample pages before you buy. Print size, the number of words per puzzle and whether the answers are included differ between books.',
    tips: ['Compare the print size in the preview pictures, not only the words large print on the cover.', 'Add a pen or highlighter that is easy to hold.'],
    faq: [
      { q: 'What is a good word search book for seniors?', a: 'A large print book with a theme they enjoy: Mom’s Word Search for relaxing puzzles, or Golden Memories for a nostalgic theme. We publish both.' },
      { q: 'What does large print mean in a puzzle book?', a: 'Bigger letters and more space between them. Sizes differ by book, so check the preview pictures.' },
      { q: 'Is a word search a good white elephant gift?', a: 'Yes. A funny themed word search is cheap and works for almost anyone.' },
      { q: 'Who publishes the books you recommend?', a: 'We publish the three word search books on this page and say so next to every link.' }
    ],
    publishAt: '2026-11-14', updatedAt: '2026-11-14'
  },
  {
    slug: 'coin-collecting-book-for-beginners', decisionKind: 'boek', priority: 71, cat: 'Books & Gifts', term: 'coin collecting book for beginners',
    title: 'Which coin collecting book fits a beginner?', h1: 'Coin collecting book for beginners: which one?',
    seoTitle: 'Coin collecting book for beginners: which one?',
    metaDesc: 'Start the hobby, look up what US coins are worth or collect world coins? Three questions point you to the right coin collecting book, with Amazon links.',
    intro: 'Coin collecting starts with knowing what to look for: grading, storing and where to buy. A good first book explains that before you spend money on coins.',
    kort: 'To start the hobby from scratch, choose an illustrated beginner guide that covers grading, storing and where to buy. To look up the value of US coins, the yearly Red Book (A Guide Book of United States Coins). For coins from other countries, a world coin catalog.',
    questions: [
      { q: 'What do you want?', options: [{ label: 'Start the hobby from scratch' }, { label: 'Look up what US coins are worth' }, { label: 'Collect coins from around the world' }] },
      { q: 'Who is it for?', options: [{ label: 'Me' }, { label: 'A child or teen' }, { label: 'A gift for an adult' }] },
      { q: 'What is your budget?', options: [{ label: 'Under $15' }, { label: '$15 to $30' }, { label: 'Over $30' }] }
    ],
    routes: [
      ['coin', { title: 'An illustrated beginner guide', why: 'Our pick: Coin Collecting for Beginners, an illustrated guide that covers grading, storing and where to buy, so you can start a collection from scratch.', note: 'Look at the sample pages on Amazon to check the level suits the reader.', tradeoff: 'It explains the hobby; it is not a price guide. To look up values of US coins, add the Red Book.' }],
      [null, zoek('red book guide book of united states coins', { title: 'The Red Book of US coin values', why: 'A Guide Book of United States Coins, known as the Red Book, lists US coins with mintages and values and comes out every year.', note: 'Buy the newest edition; values change every year.', tradeoff: 'It is a reference book full of tables, not an introduction to the hobby.' })],
      [null, zoek('world coin catalog beginners', { title: 'A world coin catalog', why: 'For coins from other countries, a world catalog helps you identify and date them.', note: 'Large catalogs cover many countries; check the years and regions you need.', tradeoff: 'Big catalogs are heavy and expensive.' })]
    ],
    guide: 'Beginners lose the most money by buying before they understand grading. The condition of a coin can change its value many times over, so learn the grades first.\nStore coins in holders or albums made for coins, and hold them by the edges.\nA beginner guide explains the hobby; a price guide like the Red Book tells you values. Most collectors end up with both.',
    tips: ['Learn grading before you buy your first expensive coin.', 'Hold coins by the edges; skin oil leaves marks.'],
    faq: [
      { q: 'What is the best book for coin collecting beginners?', a: 'An illustrated guide that explains grading, storing and buying, like our pick Coin Collecting for Beginners. Add the Red Book when you want to look up values of US coins.' },
      { q: 'What is the Red Book for coins?', a: 'A Guide Book of United States Coins, a yearly price guide for US coins with mintages and values.' },
      { q: 'Who publishes the beginner guide you recommend?', a: 'We do, and we say so next to the link.' }
    ],
    publishAt: '2026-11-14', updatedAt: '2026-11-14'
  }
];
KDP_GUIDES.forEach(g => { g.verwant = BOEKGIDSEN.filter(x => x !== g.slug); });

export function boekDecision(it, raw, land) {
  const a = antwoorden(it, raw); const [key, d] = it.routes[a[0]] || it.routes[0];
  const bq = it.questions[2] && /budget/i.test(it.questions[2].q) ? it.questions[2] : null;
  const budget = bq ? ['Fits a small budget.', 'Leaves room to add a small extra.', 'Add something to go with it, like a card or a treat.'][a[2]] || '' : '';
  if (key && BOEKEN[key]) {
    const b = BOEKEN[key]; let past = budget;
    // budgetzin uit de echte prijs: 'Under $10', '$10 to $20', 'Over $20'
    if (bq && b.usd) { const lab = String((bq.options[a[2]] || {}).label || ''); const nums = (lab.match(/\d+/g) || []).map(Number); const max = /under/i.test(lab) ? nums[0] : (/over/i.test(lab) ? Infinity : nums[1]); const min = /over/i.test(lab) ? nums[0] : (/under/i.test(lab) ? 0 : nums[0]);
      past = b.usd > max ? 'It costs a little more than the budget you picked; compare the other options on Amazon.' : (b.usd < (min || 0) ? 'It costs less than your budget, which leaves room for a card or a small extra.' : 'It fits the budget you picked.'); }
    return eigenKeuze(b, land, { ...d, budget: prijsZin(b, land) + (past ? ' ' + past : ''), query: it.term });
  }
  return { ...d, budget: budget || 'Compare current prices and the sample pages on Amazon.' };
}

export function boekSections(it, esc) {
  const eigen = [...new Set(it.routes.map(r => r[0]).filter(Boolean))].map(k => BOEKEN[k]);
  const opties = (it.questions[0] && it.questions[0].options) || [];
  // In een oogopslag: per antwoord op vraag 1 de keuze en de prijs van vandaag, zonder klikken leesbaar (ook voor AI-crawlers).
  const rijen = it.routes.map((r, i) => { const b = r[0] && BOEKEN[r[0]]; const d = r[1] || {}; return `<tr><th scope="row">${esc((opties[i] && opties[i].label) || d.title || '')}</th><td>${b ? esc(b.kort) + ' <small>(we publish this)</small>' : esc(d.title || '') + ' <small>(compare on Amazon)</small>'}</td><td>${b ? esc(b.prijs) : 'varies'}</td></tr>`; }).join('');
  const tabel = `<section class="box" id="at-a-glance"><h2>At a glance: which one for whom</h2><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th scope="col" style="text-align:left;padding:8px">If they want</th><th scope="col" style="text-align:left;padding:8px">Our pick</th><th scope="col" style="text-align:left;padding:8px">Price on Amazon US, ${esc(PRIJSDAG)}</th></tr></thead><tbody>${rijen}</tbody></table></div></section>`;
  const lijst = `<section class="box"><h2>The ${eigen.length === 1 ? 'book' : 'books'} we publish on this page</h2><ul>${eigen.map(b => `<li><strong>${esc(b.naam)}</strong>${b.auteur ? ' by ' + esc(b.auteur) : ''}. Paperback, ISBN ${esc(b.isbn)}${b.paginas ? ', ' + b.paginas + ' pages' : ''}, ${esc(b.prijs)} on Amazon US on ${esc(PRIJSDAG)}.</li>`).join('')}</ul></section>`;
  return tabel + `<section class="box"><h2>Tips</h2><ul>${(it.tips || []).map(t => '<li>' + esc(t) + '</li>').join('')}</ul></section>` + lijst + `<section class="box"><h2>How we choose, and what we publish</h2><p>We choose by fit: what the person already enjoys, how they will use it and your budget. We publish ${eigen.length === 1 ? 'one of the books' : 'some of the books'} on this page and say so next to every link to ${eigen.length === 1 ? 'it' : 'them'}: ${eigen.map(b => esc(b.kort)).join('; ')}. We do not earn a commission on those links. For the other answers we link to an Amazon search so you can compare. Prices were checked on ${esc(PRIJSDAG)}.</p></section>`;
}

export function boekLd(it) {
  return [...new Set(it.routes.map(r => r[0]).filter(Boolean))].map(k => { const b = BOEKEN[k]; return { '@type': 'Book', name: b.naam, isbn: b.isbn, bookFormat: 'https://schema.org/Paperback', inLanguage: 'en', ...(b.auteur ? { author: { '@type': 'Person', name: b.auteur } } : {}), ...(b.paginas ? { numberOfPages: b.paginas } : {}), url: boekLink(b, 'us'), ...(b.usd ? { offers: { '@type': 'Offer', price: b.usd.toFixed(2), priceCurrency: 'USD', availability: 'https://schema.org/InStock', url: boekLink(b, 'us') } } : {}) }; });
}
