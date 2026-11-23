// Kerstpagina's van bookstuffers.com (23 nov 2026, Henkjan: "Ja maak ze . Alle 3 gebruik demand radar . En SEO en LLM").
// Demand Radar thema bookstuffers, US, 23 nov 2026 (maandgemiddelde, piek in november/december):
// christmas jokes 40.500 (piek 368.000), christmas dad jokes 12.100, funny christmas jokes 9.900; christmas trivia 27.100 (piek 301.000),
// trivia questions 165.000; christmas coloring pages 135.000 (piek 1.220.000), christmas coloring pages free 27.100, free printable coloring pages 74.000.
// Inhoud: moppen zijn bekende volksgrappen (geen auteur), eigen indeling en kaartjes; quizvragen alleen met vaststaande feiten;
// kleurplaten zijn eigen lijntekeningen in SVG (geen figuren van anderen).

export const MOPPEN = {
  kids: [
    ['What do snowmen eat for breakfast?', 'Frosted Flakes.'],
    ['What do you call a snowman with a six-pack?', 'An abdominal snowman.'],
    ['Why was the snowman looking through the carrots?', 'He was picking his nose.'],
    ['What do you get if you cross a snowman with a vampire?', 'Frostbite.'],
    ['Where do snowmen keep their money?', 'In snow banks.'],
    ['What is Santa’s favorite snack?', 'Chocolate chimp cookies. No, chocolate chip. He means chip.'],
    ['Why does Santa go down the chimney?', 'Because it soots him.'],
    ['What do elves learn in school?', 'The elf-abet.'],
    ['What do you call an elf who sings?', 'A wrapper.'],
    ['How does Rudolph know when Christmas is coming?', 'He looks at his calen-deer.'],
    ['What is a reindeer’s favorite game at a party?', 'Truth or deer.'],
    ['Why did the Christmas tree go to the barber?', 'It needed a trim.'],
    ['What do you call a cat on the beach at Christmas?', 'Sandy Claws.'],
    ['What falls at the North Pole but never gets hurt?', 'Snow.'],
    ['Why are Christmas trees bad at knitting?', 'They always drop their needles.'],
    ['What did one snowman say to the other?', 'Do you smell carrots?'],
  ],
  dad: [
    ['What do you call Santa when he stops moving?', 'Santa Pause.'],
    ['What do you call a broke Santa?', 'Saint Nickel-less.'],
    ['Why is Santa so good at karate?', 'He has a black belt.'],
    ['What do you call an obnoxious reindeer?', 'Rude-olph.'],
    ['What did the gingerbread man put on his bed?', 'A cookie sheet.'],
    ['What do you call a reindeer with no eyes?', 'No eye deer.'],
    ['How much did Santa pay for his sleigh?', 'Nothing. It was on the house.'],
    ['Why did the turkey join the band?', 'It had the drumsticks.'],
    ['What kind of photos do elves take?', 'Elfies.'],
    ['What do you call people who are afraid of Santa?', 'Claustrophobic.'],
    ['What did the Christmas tree say to the ornament?', 'Quit hanging around.'],
    ['Why did the ornament go to school?', 'It wanted to be a bright light.'],
    ['What is every elf’s favorite kind of music?', 'Wrap.'],
    ['Why was the little elf in trouble?', 'He was being a bit elfish.'],
    ['What do you get when you combine a Christmas tree with an iPad?', 'A pine-apple.'],
    ['Which of Santa’s reindeer has the worst manners?', 'Rudolph. He is very rude.'],
  ],
  klop: [
    ['Knock knock. Who’s there? Mary. Mary who?', 'Mary Christmas!'],
    ['Knock knock. Who’s there? Snow. Snow who?', 'Snow use, I forgot my key again.'],
    ['Knock knock. Who’s there? Dexter. Dexter who?', 'Dexter halls with boughs of holly!'],
    ['Knock knock. Who’s there? Holly. Holly who?', 'Holly-days are here again!'],
    ['Knock knock. Who’s there? Olive. Olive who?', 'Olive the other reindeer!'],
    ['Knock knock. Who’s there? Yule. Yule who?', 'Yule never know unless you open the door.'],
  ],
  groot: [
    ['Why did the office Christmas party end early?', 'Nobody could find the Wi-Fi password, so everyone went home to look it up.'],
    ['What did the stamp say to the Christmas card?', 'Stick with me and we’ll go places.'],
    ['How do you know Santa is good at math?', 'He always checks his list twice.'],
    ['What is the best Christmas present?', 'A broken drum. You can’t beat it.'],
    ['Why don’t you ever see Santa in the hospital?', 'He has private elf care.'],
    ['What do you call a bunch of chess players bragging about their games in a hotel lobby at Christmas?', 'Chestnuts boasting in an open foyer.'],
    ['Why is it getting harder to buy Advent calendars?', 'Their days are numbered.'],
    ['What do you call a greedy elf?', 'Elfish.'],
    ['What did the beaver say to the Christmas tree?', 'Nice gnawing you.'],
    ['How did the ornament get addicted to Christmas?', 'He was hooked on trees his whole life.'],
    ['Why does Scrooge love Rudolph?', 'Because every buck is dear to him.'],
    ['What is the most popular wine at Christmas?', 'I don’t like Brussels sprouts!'],
  ],
};
export const MOP_GROEP = [['kids', 'Christmas jokes for kids'], ['dad', 'Christmas dad jokes'], ['klop', 'Christmas knock-knock jokes'], ['groot', 'Christmas jokes for adults (still clean)']];

// [vraag, antwoord, korte uitleg]; alleen vaststaande feiten
export const QUIZ = [
  ['Songs and movies', [
    ['Which song is the best-selling single of all time?', '“White Christmas” by Bing Crosby', 'Guinness World Records lists it at an estimated 50 million copies.'],
    ['What was the first song played in space?', '“Jingle Bells”', 'The Gemini 6 astronauts played it on a harmonica and bells in December 1965.'],
    ['In which year did Mariah Carey release “All I Want for Christmas Is You”?', '1994', ''],
    ['Who wrote and sang “Feliz Navidad”?', 'José Feliciano', 'He released it in 1970.'],
    ['In Home Alone, which city is the McCallister family flying to?', 'Paris', ''],
    ['In Elf, what are the four main food groups?', 'Candy, candy canes, candy corns and syrup', ''],
    ['In It’s a Wonderful Life, what happens every time a bell rings?', 'An angel gets his wings', ''],
    ['What is the name of the Grinch’s dog?', 'Max', ''],
    ['In which town do the Whos live?', 'Whoville', ''],
    ['On the eighth day of Christmas, what did my true love give to me?', 'Eight maids a-milking', ''],
    ['How many gifts does the singer get in total in “The Twelve Days of Christmas”?', '364', 'Add up every gift on every day, repeats included.'],
  ]],
  ['Santa and his reindeer', [
    ['How many reindeer pull the sleigh in “A Visit from St. Nicholas” (“’Twas the Night Before Christmas”)?', 'Eight', 'Rudolph is not in the 1823 poem.'],
    ['Who created Rudolph the Red-Nosed Reindeer?', 'Robert L. May', 'He wrote the story in 1939 for the Montgomery Ward department store.'],
    ['Which three of Santa’s reindeer have names that start with D?', 'Dasher, Dancer and Donner', 'In the original poem Donner was spelled Dunder.'],
    ['Who is traditionally credited with writing “’Twas the Night Before Christmas”?', 'Clement Clarke Moore', 'It was first published in 1823, without a name.'],
    ['Where does Santa live?', 'At the North Pole', ''],
  ]],
  ['History and traditions', [
    ['Which country started the tradition of the Christmas tree?', 'Germany', ''],
    ['Which royal couple made the Christmas tree popular in Britain in the 1840s?', 'Queen Victoria and Prince Albert', ''],
    ['In which year did Christmas become a federal holiday in the United States?', '1870', ''],
    ['Which US state was the first to make Christmas a legal holiday?', 'Alabama', 'It did so in 1836.'],
    ['Who wrote A Christmas Carol?', 'Charles Dickens', 'It came out in December 1843.'],
    ['How many spirits visit Scrooge after the ghost of Jacob Marley?', 'Three', 'The spirits of Christmas Past, Present and Yet to Come.'],
    ['Which country sends London a Christmas tree for Trafalgar Square every year?', 'Norway', 'A thank-you for Britain’s help during the Second World War.'],
    ['Which country does the poinsettia come from?', 'Mexico', ''],
    ['In which country do many families eat KFC on Christmas?', 'Japan', ''],
    ['What do Italian-American families eat on Christmas Eve at the Feast of the Seven Fishes?', 'Seafood dishes', ''],
    ['On which date is Boxing Day?', 'December 26', ''],
    ['On which date do Orthodox Christians in Russia celebrate Christmas?', 'January 7', 'They follow the older Julian calendar.'],
    ['What three gifts did the wise men bring?', 'Gold, frankincense and myrrh', ''],
    ['What does “Mele Kalikimaka” mean, and in which language?', 'Merry Christmas, in Hawaiian', ''],
    ['In which Alpine countries does Krampus appear in early December?', 'Austria and southern Germany', 'He comes with St. Nicholas on December 5.'],
    ['What do children break at a Mexican posada?', 'A piñata', ''],
  ]],
  ['Easy round for kids', [
    ['What color is Rudolph’s nose?', 'Red', ''],
    ['How many points does a snowflake have?', 'Six', ''],
    ['What do many children leave out for Santa on Christmas Eve?', 'Cookies and milk', ''],
    ['Which plant do people kiss under at Christmas?', 'Mistletoe', ''],
    ['What drink is made with milk, sugar and eggs?', 'Eggnog', ''],
    ['What do people hang on the fireplace for Santa to fill?', 'Stockings', ''],
    ['What are Santa’s helpers called?', 'Elves', ''],
    ['What goes on top of the Christmas tree?', 'A star or an angel', ''],
  ]],
];

// --- kleurplaten: eigen lijntekeningen, dikke lijnen, grote vlakken (makkelijk om in te kleuren) --------------------------------------
const S = 'fill="#fff" stroke="#111113" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"';
const svg = (inhoud, label) => `<svg viewBox="0 0 600 760" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}"><rect x="10" y="10" width="580" height="740" rx="24" fill="#fff" stroke="#111113" stroke-width="5"/>${inhoud}</svg>`;
const cirkel = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" ${S}/>`;
const ster = (cx, cy, R, r, n = 5, rot = -90) => { const p = []; for (let i = 0; i < n * 2; i++) { const a = (rot + i * 180 / n) * Math.PI / 180, q = i % 2 ? r : R; p.push((cx + q * Math.cos(a)).toFixed(1) + ',' + (cy + q * Math.sin(a)).toFixed(1)); } return `<polygon points="${p.join(' ')}" ${S}/>`; };
const sneeuw = (x, y) => `<g stroke="#111113" stroke-width="5" stroke-linecap="round">${[0, 60, 120].map(a => `<line x1="${x - 16 * Math.cos(a * Math.PI / 180)}" y1="${y - 16 * Math.sin(a * Math.PI / 180)}" x2="${x + 16 * Math.cos(a * Math.PI / 180)}" y2="${y + 16 * Math.sin(a * Math.PI / 180)}"/>`).join('')}</g>`;
const vlokjes = l => l.map(([x, y]) => sneeuw(x, y)).join('');
const blad = (x, y, rot) => `<path transform="translate(${x} ${y}) rotate(${rot})" d="M0 0 C 20 -30, 60 -30, 80 0 C 60 30, 20 30, 0 0 Z" ${S}/>`;

export const KLEUR = [
  { id: 'tree', naam: 'Christmas tree', svg: svg(`<rect x="265" y="600" width="70" height="90" ${S}/>`
    + `<polygon points="300,170 440,380 380,380 480,520 400,520 500,620 100,620 200,520 120,520 220,380 160,380" ${S}/>`
    + ster(300, 150, 60, 26) + cirkel(250, 420, 20) + cirkel(345, 455, 20) + cirkel(300, 300, 18) + cirkel(220, 560, 22) + cirkel(385, 570, 22) + cirkel(300, 520, 18)
    + `<path d="M210 360 Q300 400 390 360" fill="none" stroke="#111113" stroke-width="6"/><path d="M175 500 Q300 545 425 500" fill="none" stroke="#111113" stroke-width="6"/>` + vlokjes([[80, 90], [520, 110], [70, 300], [530, 330]]), 'Christmas tree coloring page') },
  { id: 'snowman', naam: 'Snowman', svg: svg(cirkel(300, 560, 150) + cirkel(300, 340, 105) + cirkel(300, 175, 75)
    + `<rect x="235" y="60" width="130" height="80" rx="6" ${S}/><rect x="205" y="132" width="190" height="22" rx="8" ${S}/>`
    + `<path d="M228 235 Q300 270 372 235 L372 265 Q300 300 228 265 Z" ${S}/><path d="M330 265 L360 340 L330 345 L310 275 Z" ${S}/>`
    + `<polygon points="300,180 370,195 300,200" ${S}/>` + cirkel(272, 160, 9) + cirkel(328, 160, 9) + cirkel(300, 330, 12) + cirkel(300, 380, 12) + cirkel(300, 520, 14) + cirkel(300, 580, 14)
    + `<path d="M200 320 L95 250 M135 275 L110 230" fill="none" stroke="#111113" stroke-width="8" stroke-linecap="round"/><path d="M400 320 L505 250 M465 275 L490 230" fill="none" stroke="#111113" stroke-width="8" stroke-linecap="round"/>` + vlokjes([[80, 90], [520, 80], [90, 690], [510, 690]]), 'Snowman coloring page') },
  { id: 'gingerbread', naam: 'Gingerbread man', svg: svg(`<path d="M300 90 C 360 90, 390 140, 380 190 C 375 215, 360 228, 350 235 L 470 270 C 520 285, 510 350, 460 345 L 380 330 L 400 520 L 470 650 C 490 700, 430 720, 410 680 L 300 560 L 190 680 C 170 720, 110 700, 130 650 L 200 520 L 220 330 L 140 345 C 90 350, 80 285, 130 270 L 250 235 C 240 228, 225 215, 220 190 C 210 140, 240 90, 300 90 Z" ${S}/>`
    + cirkel(275, 160, 11) + cirkel(325, 160, 11) + `<path d="M270 200 Q300 225 330 200" fill="none" stroke="#111113" stroke-width="6" stroke-linecap="round"/>` + cirkel(300, 300, 14) + cirkel(300, 360, 14) + cirkel(300, 420, 14)
    + `<path d="M150 300 l10 -12 l10 12 l10 -12 l10 12 M410 300 l10 -12 l10 12 l10 -12 l10 12 M170 670 l12 -10 l12 10 M406 670 l12 -10 l12 10" fill="none" stroke="#111113" stroke-width="5"/>` + vlokjes([[80, 90], [520, 90]]), 'Gingerbread man coloring page') },
  { id: 'ornament', naam: 'Christmas ornament', svg: svg(`<path d="M300 60 Q340 60 340 100" fill="none" stroke="#111113" stroke-width="6"/><rect x="255" y="100" width="90" height="55" rx="8" ${S}/>` + cirkel(300, 420, 230)
    + `<path d="M80 360 Q300 420 520 360" fill="none" stroke="#111113" stroke-width="7"/><path d="M75 480 Q300 540 525 480" fill="none" stroke="#111113" stroke-width="7"/>`
    + ster(300, 425, 45, 20) + ster(180, 425, 28, 12) + ster(420, 425, 28, 12) + cirkel(300, 285, 22) + cirkel(210, 290, 16) + cirkel(390, 290, 16) + cirkel(300, 580, 22) + cirkel(215, 565, 16) + cirkel(385, 565, 16), 'Christmas ornament coloring page') },
  { id: 'stocking', naam: 'Christmas stocking', svg: svg(`<path d="M200 200 L400 200 L400 470 C 400 520, 430 560, 470 580 C 540 615, 520 700, 440 700 L 300 700 C 230 700, 190 650, 200 590 Z" ${S}/>`
    + `<rect x="175" y="110" width="250" height="100" rx="30" ${S}/>` + `<path d="M330 650 C 360 610, 430 610, 470 640" fill="none" stroke="#111113" stroke-width="6"/>`
    + ster(300, 330, 50, 22) + cirkel(250, 470, 22) + cirkel(345, 520, 22) + `<path d="M225 160 h150" stroke="#111113" stroke-width="5" stroke-dasharray="4 14" stroke-linecap="round"/>` + vlokjes([[90, 100], [520, 110], [100, 650]]), 'Christmas stocking coloring page') },
  { id: 'candy-cane', naam: 'Candy cane', svg: svg(`<path d="M340 690 L340 300 C 340 150, 170 150, 170 290" fill="none" stroke="#111113" stroke-width="96" stroke-linecap="round"/><path d="M340 690 L340 300 C 340 150, 170 150, 170 290" fill="none" stroke="#fff" stroke-width="82" stroke-linecap="round"/>`
    + [330, 400, 470, 540, 610, 680].map(y => `<path d="M299 ${y + 10} L381 ${y - 30}" stroke="#111113" stroke-width="7"/>`).join('')
    + `<path d="M340 450 C 280 390, 210 420, 235 465 C 255 500, 305 480, 340 450 C 375 480, 425 500, 445 465 C 470 420, 400 390, 340 450 Z" ${S}/><path d="M325 465 L290 560 L320 548 L330 580 Z M355 465 L390 560 L360 548 L350 580 Z" ${S}/>` + cirkel(340, 452, 22) + vlokjes([[90, 100], [510, 100], [90, 650], [510, 650], [480, 300]]), 'Candy cane coloring page') },
  { id: 'gifts', naam: 'Stack of gifts', svg: svg(`<rect x="90" y="450" width="250" height="230" ${S}/><rect x="345" y="500" width="170" height="180" ${S}/><rect x="170" y="270" width="210" height="180" ${S}/>`
    + `<path d="M215 450 L215 680 M90 565 L340 565 M430 500 L430 680 M345 590 L515 590 M275 270 L275 450 M170 360 L380 360" stroke="#111113" stroke-width="16"/><path d="M215 450 L215 680 M90 565 L340 565 M430 500 L430 680 M345 590 L515 590 M275 270 L275 450 M170 360 L380 360" stroke="#fff" stroke-width="6"/>`
    + `<path d="M275 270 C 220 200, 170 240, 210 275 Z M275 270 C 330 200, 380 240, 340 275 Z" ${S}/>` + cirkel(275, 268, 14) + vlokjes([[90, 100], [510, 120], [90, 330], [510, 330]]), 'Stack of Christmas gifts coloring page') },
  { id: 'bells', naam: 'Christmas bells', svg: svg(`<path d="M150 520 C 150 400, 170 260, 250 240 C 330 260, 350 400, 350 520 Z" ${S}/><path d="M250 520 C 250 400, 270 260, 350 240 C 430 260, 450 400, 450 520 Z" ${S}/>`
    + `<rect x="130" y="515" width="240" height="30" rx="12" ${S}/><rect x="230" y="515" width="240" height="30" rx="12" ${S}/>` + cirkel(250, 570, 24) + cirkel(350, 570, 24)
    + blad(300, 200, 200) + blad(300, 200, -20) + cirkel(290, 205, 18) + cirkel(315, 190, 18) + cirkel(310, 222, 18) + vlokjes([[90, 100], [510, 100], [100, 670], [500, 670]]), 'Christmas bells with holly coloring page') },
  { id: 'wreath', naam: 'Christmas wreath', svg: svg(Array.from({ length: 16 }, (_, i) => { const a = i * 22.5 * Math.PI / 180; return blad(300 + 175 * Math.cos(a), 380 + 175 * Math.sin(a), i * 22.5 + 60); }).join('')
    + Array.from({ length: 16 }, (_, i) => { const a = (i * 22.5 + 11) * Math.PI / 180; return blad(300 + 130 * Math.cos(a), 380 + 130 * Math.sin(a), i * 22.5 + 120); }).join('')
    + Array.from({ length: 8 }, (_, i) => { const a = (i * 45 + 20) * Math.PI / 180; return cirkel(300 + 150 * Math.cos(a), 380 + 150 * Math.sin(a), 14); }).join('')
    + `<path d="M300 590 C 230 540, 180 590, 220 630 C 250 655, 280 625, 300 590 C 320 625, 350 655, 380 630 C 420 590, 370 540, 300 590 Z" ${S}/><path d="M285 605 L240 700 L270 690 L285 720 Z M315 605 L360 700 L330 690 L315 720 Z" ${S}/>` + cirkel(300, 595, 18), 'Christmas wreath coloring page') },
  { id: 'mittens', naam: 'Mittens', svg: svg(`<path d="M120 300 C 120 220, 250 200, 260 290 L 265 560 L 125 560 Z" ${S}/><path d="M125 380 C 80 370, 70 450, 125 470" ${S}/><rect x="110" y="555" width="170" height="80" rx="14" ${S}/>`
    + `<path d="M340 290 C 350 200, 480 220, 480 300 L 475 560 L 335 560 Z" ${S}/><path d="M475 380 C 520 370, 530 450, 475 470" ${S}/><rect x="320" y="555" width="170" height="80" rx="14" ${S}/>`
    + `<path d="M280 600 C 300 660, 300 660, 320 600" fill="none" stroke="#111113" stroke-width="6"/>` + ster(192, 420, 38, 16) + ster(408, 420, 38, 16)
    + `<path d="M140 330 h100 M360 330 h100 M140 500 h100 M360 500 h100" stroke="#111113" stroke-width="5" stroke-dasharray="10 10"/>` + vlokjes([[90, 100], [510, 100], [300, 160], [90, 700], [510, 700]]), 'Mittens coloring page') },
  { id: 'star', naam: 'Christmas star', svg: svg(ster(300, 390, 240, 100) + ster(300, 395, 120, 50) + cirkel(300, 395, 28)
    + vlokjes([[90, 100], [510, 100], [90, 690], [510, 690], [300, 700]]) + ster(110, 560, 30, 13) + ster(490, 560, 30, 13), 'Christmas star coloring page') },
  { id: 'snowflake', naam: 'Big snowflake', svg: svg(`<g stroke="#111113" stroke-linecap="round" fill="none">${[0, 60, 120].map(a => `<g transform="rotate(${a} 300 390)"><line x1="300" y1="130" x2="300" y2="650" stroke-width="34"/><line x1="300" y1="130" x2="300" y2="650" stroke="#fff" stroke-width="20"/></g>`).join('')}</g>`
    + [0, 60, 120, 180, 240, 300].map(a => `<g transform="rotate(${a} 300 390)"><path d="M300 210 L250 160 M300 210 L350 160 M300 290 L240 240 M300 290 L360 240" stroke="#111113" stroke-width="18" stroke-linecap="round"/><path d="M300 210 L250 160 M300 210 L350 160 M300 290 L240 240 M300 290 L360 240" stroke="#fff" stroke-width="6" stroke-linecap="round"/></g>`).join('')
    + `<polygon points="300,330 352,360 352,420 300,450 248,420 248,360" ${S}/>` + cirkel(300, 390, 22), 'Snowflake coloring page') },
];
