// Bookstuffers (bookstuffers.com): de eigen plank met kleine cadeauboeken van Henkjan (KDP). Henkjan 22 nov 2026: "Ja bookstuffers doen we",
// "Boeken wel altijd pic natuurlijk geven . Dat is dan kleur op de pagina ."
// Regels (zelfde als lib/kdp-guides.js): alleen feiten uit de Amazon-listing (titel, prijs en pagina's met datum), niets verzinnen over de
// inhoud, link recht naar Amazon zonder tag, erbij zeggen dat wij het uitgeven, geen gedachtestreepjes.
// Niet op de plank: titels met een typefout of een oud jaartal in de titel (Knowladge, Prirnt, 2024, 2025) en B0DN63TLV3 (prijs onduidelijk).
// Prijs, pagina's en omslag: gelezen van de Amazon.com-listing op PRIJS_DATUM. Na een prijswijziging in KDP: hier bijwerken en de datum ook.
export const PRIJS_DATUM = '2026-11-22';

// soort: [enkelvoud voor op de kaart, kop van de groep]
export const SOORT = {
  facts: ['Fact book', 'Fact books'],
  jokes: ['Dad joke book', 'Dad joke books'],
  bathroom: ['Bathroom word search', 'Bathroom word search books'],
  xmasws: ['Christmas word search', 'Christmas word search books'],
  sudoku: ['Christmas sudoku', 'Christmas sudoku books'],
  password: ['Password logbook', 'Password logbooks that say it out loud'],
  journal: ['Journal', 'Journals and logbooks'],
  coloring: ['Coloring book', 'Christmas coloring books'],
};

// a = ASIN paperback, i = omslag (m.media-amazon.com/images/I/<i>), t = titel zoals op de listing (zonder de reeksnaam ervoor),
// k = soort, p = prijs in dollars, n = pagina's, v = voor wie (women, men, anyone, kids, teens), we = past bij een white elephant-ruil.
export const BOEKEN = [
  { a: 'B0DK3CSYXW', i: '51OEu83WA2L', t: 'Dad Jokes You Never Asked For: 400 Ways to Make Anyone Groan', k: 'jokes', p: 8.99, n: 103, v: 'men', we: 1 },
  { a: 'B0DJQS1K5Z', i: '61l4o3ZKwnL', t: 'Mind-Blowing Facts You Won’t Believe (But Totally Should)', k: 'facts', p: 9.99, n: 142, v: 'anyone', we: 1 },
  { a: 'B0DJQLBM75', i: '61WhZidYKZL', t: 'Stocking Stuffers For Teens: The Weirdest, Smartest, Most Hilarious 408 Facts You Will Ever Hear', k: 'facts', p: 9.99, n: 147, v: 'teens', we: 0 },
  { a: 'B0DNB1T9JT', i: '61XC+ssbKqL', t: 'Dad Jokes & Facts (2 books in 1)', k: 'jokes', p: 11, n: 245, v: 'anyone', we: 1 },
  { a: 'B0HRFY3TLB', i: '61QpNOjfyzL', t: 'Wait, That’s True?! 1,000 Weird, Funny & Mind-Blowing Facts Nobody Told You', k: 'facts', p: 14.99, n: 104, v: 'anyone', we: 1 },
  { a: 'B0HRGNJ7CY', i: '61pQMN-jT8L', t: 'Wait, That’s True?! For Men: 800 Unusual Facts & Rare Knowledge for Men Who Have Everything', k: 'facts', p: 14.99, n: 96, v: 'men', we: 1 },

  { a: 'B0DNCLDHD6', i: '61sfgKQKcIL', t: 'Train Your Brain While You Drain', k: 'bathroom', p: 4.99, n: 40, v: 'anyone', we: 1 },
  { a: 'B0DNDQZ3G3', i: '51qqBqjArWL', t: 'Think and Stink', k: 'bathroom', p: 4.99, n: 40, v: 'anyone', we: 1 },
  { a: 'B0DP4TNQ3P', i: '61ijm5fY5BL', t: 'Get Wise With Every Flush Surprise', k: 'bathroom', p: 4.99, n: 40, v: 'anyone', we: 1 },
  { a: 'B0DP4V1VG2', i: '61yy+2xaEnL', t: 'Gain Some Smarts While the Action Starts', k: 'bathroom', p: 4.99, n: 40, v: 'anyone', we: 1 },
  { a: 'B0DNQDHQ7X', i: '61hklsDFaQL', t: 'Sharpen Your Mind While the Toots Align', k: 'bathroom', p: 4.99, n: 40, v: 'anyone', we: 1 },
  { a: 'B0DNN75C5Z', i: '61p+aDPlPlL', t: 'Gain Some Clout While The Farts Come Out', k: 'bathroom', p: 4.99, n: 40, v: 'anyone', we: 1 },
  { a: 'B0DNDP3B31', i: '61mbsPe7TeL', t: 'Train Your Mind While You Fart', k: 'bathroom', p: 4.99, n: 40, v: 'anyone', we: 1 },
  { a: 'B0DNCK1PRF', i: '61xJtzGMppL', t: 'Boost Your Brains with Bathroom Drains', k: 'bathroom', p: 4.99, n: 40, v: 'anyone', we: 1 },
  { a: 'B0DNQCYTBZ', i: '61c-CLe-O3L', t: 'Bathroom Word Search Large Print Puzzles (2 books in 1)', k: 'bathroom', p: 4.99, n: 80, v: 'anyone', we: 1 },
  { a: 'B0DNQ61ZJM', i: '61A8YnMQgyL', t: 'Bathroom Large Print Word Search (4 books in 1)', k: 'bathroom', p: 5.99, n: 160, v: 'anyone', we: 1 },
  { a: 'B0DNQ128JZ', i: '61YkSzeAP2L', t: 'Funny Word Search Large Print (4 books in 1)', k: 'bathroom', p: 5.99, n: 160, v: 'anyone', we: 1 },

  { a: 'B0DP42FXB1', i: '51jvMOQeYWL', t: 'Stuff I Forget Because I’m Old: Large Print Password Book', k: 'password', p: 4.99, n: 110, v: 'anyone', we: 1 },
  { a: 'B0DNZCW56W', i: '612lmdozOTL', t: 'Sh*t I Can’t Remember: Password Logbook, Large Print', k: 'password', p: 5.99, n: 142, v: 'women', we: 1 },
  { a: 'B0DNZFN43H', i: '611YDAF-i8L', t: 'Sh*t I Can’t Remember: Floral Black Password Logbook', k: 'password', p: 5.99, n: 142, v: 'women', we: 1 },
  { a: 'B0DNZCSQLG', i: '71sAbcoJ21L', t: 'Sh*t I Can’t Remember: Large Print Password Logbook, Black Flower Pattern', k: 'password', p: 5.99, n: 142, v: 'women', we: 1 },

  { a: 'B0DMP31FSP', i: '61BNTVEF7fL', t: 'Beer Tasting Journal', k: 'journal', p: 4.99, n: 120, v: 'men', we: 1 },
  { a: 'B0DMFBPQG3', i: '61J4PeQrquL', t: 'Wine Not? A Journal for All My Wine-Driven Thoughts', k: 'journal', p: 6.99, n: 120, v: 'women', we: 1 },
  { a: 'B0DMFSY1LR', i: '51cjIu3jPzL', t: 'Manifest Your Sh*t: 5 Minute Manifestation Journal', k: 'journal', p: 4.99, n: 120, v: 'women', we: 1 },
  { a: 'B0DP6KVKST', i: '51gwqqb1-iL', t: 'Garage Logbook', k: 'journal', p: 4.99, n: 120, v: 'men', we: 0 },
  { a: 'B0DPDP7L6M', i: '51X+ZxViZeL', t: 'Garage Inventory Logbook, Black', k: 'journal', p: 4.99, n: 120, v: 'men', we: 0 },
  { a: 'B0DNZWQWQ2', i: '61r7JdfBYCL', t: 'Budget Planner and Bill Organizer, Large Print', k: 'journal', p: 4.99, n: 120, v: 'women', we: 0 },

  { a: 'B0DMZTBX4C', i: '71L7Fk9E10L', t: 'Joyful Christmas Word Search', k: 'xmasws', p: 4.99, n: 55, v: 'anyone', we: 0 },
  { a: 'B0DMZSKWK4', i: '71MlLBpv2lL', t: 'Festive Christmas Word Search', k: 'xmasws', p: 4.99, n: 55, v: 'anyone', we: 0 },
  { a: 'B0DMZPN5R1', i: '718hg1nL3bL', t: 'Merry Christmas Word Search', k: 'xmasws', p: 4.99, n: 55, v: 'anyone', we: 0 },
  { a: 'B0DMTCBGQ2', i: '71Xa+UWwlFL', t: 'Christmas Around the World Large Print Word Search', k: 'xmasws', p: 4.99, n: 55, v: 'anyone', we: 0 },
  { a: 'B0DN65PRD9', i: '71HjuoPHiVL', t: 'Word Search for Christmas (2 in 1)', k: 'xmasws', p: 4.99, n: 110, v: 'anyone', we: 0 },
  { a: 'B0DMT8MB99', i: '61X8Zu0IGbL', t: 'Winter Wonderland Word Search', k: 'xmasws', p: 4.99, n: 55, v: 'kids', we: 0 },

  { a: 'B0DMR1MSSK', i: '61P21IeHGkL', t: 'Merry Christmas Sudoku', k: 'sudoku', p: 4.99, n: 52, v: 'women', we: 0 },
  { a: 'B0DMQKR5QZ', i: '71hAY+PovhL', t: 'Christmas Sudoku for Women', k: 'sudoku', p: 4.99, n: 52, v: 'women', we: 0 },
  { a: 'B0DMNJR2H5', i: '71TXmaQTkdL', t: 'Christmas Sudoku: Easy and Medium Level', k: 'sudoku', p: 4.99, n: 53, v: 'women', we: 0 },
  { a: 'B0DMNGLKLT', i: '61O1XolDLEL', t: 'Cozy Christmas Sudoku: Relaxing Easy and Medium', k: 'sudoku', p: 4.99, n: 52, v: 'women', we: 0 },
  { a: 'B0DMQMB584', i: '61QJCKuR+hL', t: 'Special Christmas Sudoku', k: 'sudoku', p: 4.99, n: 55, v: 'anyone', we: 0 },
  { a: 'B0DMQBJV59', i: '61rSYHDQ6KL', t: 'Serenity of Winter Sudoku', k: 'sudoku', p: 4.99, n: 52, v: 'anyone', we: 0 },
  { a: 'B0DMNK1J5T', i: '6141lTnZe3L', t: 'Cozy Christmas Sudoku', k: 'sudoku', p: 4.99, n: 55, v: 'anyone', we: 0 },
  { a: 'B0DMNLNBRC', i: '616XdXqlsNL', t: 'Snowfall Serenity Sudoku', k: 'sudoku', p: 4.99, n: 55, v: 'anyone', we: 0 },

  { a: 'B0DJSB43VN', i: '71QJ+VPu5-L', t: 'Christmas Paper Dolls Coloring Book', k: 'coloring', p: 4.99, n: 61, v: 'kids', we: 0 },
  { a: 'B0CP2RZLL1', i: '61OCmYqFeWL', t: 'Big and Easy Christmas Coloring Book for Kids', k: 'coloring', p: 5, n: 81, v: 'kids', we: 0 },
  { a: 'B0DMJGTJ39', i: '71wjfXFTB5L', t: 'Cozy & Comfy Christmas Cute Coloring Book', k: 'coloring', p: 7.99, n: 121, v: 'kids', we: 0 },
];

// Lasting Change Workbook (eigen pagina). Inhoud: OVERDRACHT-KDP.md paragraaf 7a (editie 2027, binnenwerk 126 p.).
export const LC = { a: 'B0F1SM1L5J', i: '61HnUfIUsHL', t: 'Lasting Change Workbook: The Anti-Boring Playbook to Rewire Your Habits, Upgrade Your Identity, and Stay Consistent for Life', auteur: 'John Warrior', p: 19.99, n: 126, hc: { a: 'B0F3TL9TWR', p: 59 } };

// Gratis printbare woordzoekers (door de code gemaakt uit deze woorden, vaste uitkomst per zaadje): eigen inhoud, niet uit een boek.
export const PUZZELS = [
  { id: 'christmas-morning', naam: 'Christmas Morning', zaad: 2026, woorden: ['STOCKING', 'PRESENT', 'RIBBON', 'WRAPPING', 'COCOA', 'PAJAMAS', 'COOKIES', 'TINSEL', 'WREATH', 'CANDLE', 'CAROLS', 'FAMILY'] },
  { id: 'santas-workshop', naam: 'Santa’s Workshop', zaad: 1225, woorden: ['REINDEER', 'SLEIGH', 'CHIMNEY', 'ELVES', 'TOYS', 'NORTHPOLE', 'WORKSHOP', 'BELLS', 'SACK', 'SNOWFLAKE', 'GINGERBREAD', 'LIST'] },
  { id: 'winter-cozy', naam: 'Winter Cozy', zaad: 1231, woorden: ['BLANKET', 'FIREPLACE', 'SNOWMAN', 'SCARF', 'MITTENS', 'ICICLE', 'SLEDDING', 'FROST', 'CIDER', 'LANTERN', 'SWEATER', 'SNOWFALL'] },
];
