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
  { a: 'B0DK3CSYXW', r: 4.3, c: 11, i: '51OEu83WA2L', t: 'Dad Jokes You Never Asked For: 400 Ways to Make Anyone Groan', k: 'jokes', p: 8.99, n: 103, v: 'men', we: 1 },
  { a: 'B0DJQS1K5Z', r: 4.6, c: 74, i: '61l4o3ZKwnL', t: 'Mind-Blowing Facts You Won’t Believe (But Totally Should)', k: 'facts', p: 9.99, n: 142, v: 'anyone', we: 1 },
  { a: 'B0DJQLBM75', r: 4.1, c: 128, i: '61WhZidYKZL', t: 'Stocking Stuffers For Teens: The Weirdest, Smartest, Most Hilarious 408 Facts You Will Ever Hear', k: 'facts', p: 9.99, n: 147, v: 'teens', we: 0 },
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
export const LC = { a: 'B0F1SM1L5J', i: '61HnUfIUsHL', r: 4.2, c: 130, t: 'Lasting Change Workbook: The Anti-Boring Playbook to Rewire Your Habits, Upgrade Your Identity, and Stay Consistent for Life', auteur: 'John Warrior', p: 19.99, n: 126, hc: { a: 'B0F3TL9TWR', p: 59 } };

// De rest van de plank (Henkjan 22 nov 2026: "alle boeken gaan erop die ik heb dus ook gezondheid etc . Maar niet prominent met de kerst"):
// op /all-books en onderaan de home als lijst. Niet op de plank: titels met een oud jaartal (PMP Exam Prep 2024, Prepper's 2022 Edition) en
// The Complete Apocrypha (in de VS niet meer leverbaar). Score r en aantal c alleen als Amazon ze toont (gelezen 22 nov 2026).
export const GROEP = { bijbel: 'Bible, Enoch and the Apocrypha', koken: 'Cookbooks', gezond: 'Health and mind', puzzel: 'Word search all year', kleur: 'Coloring books', kennis: 'Money, skills and hobbies', roman: 'Fiction' };
export const ANDER = [
  { a: 'B0B5KV79N1', i: '71fpaaoRtTL', t: 'Books of Enoch: A Complete Collection of 3 Books', g: 'bijbel', p: 15.99, n: 121, r: 4.5, c: 99 },
  { a: 'B0DDBTXC9J', i: '71Y-Hd5HMpL', t: 'The Definitive Apocrypha: Collection of all books Rejected from the Bible', g: 'bijbel', p: 13.99, n: 396, r: 4.4, c: 18 },
  { a: 'B0D2KZGWYJ', i: '71ksQnFqV-L', t: 'Bible Color By Number Book for Kids', g: 'bijbel', p: 9.81, n: 43, r: 4.8, c: 41 },
  { a: 'B0D4LPN8YB', i: '7121lan-pDL', t: 'Bible Memory Verse Coloring Book for Kids', g: 'bijbel', p: 7.99, n: 30, r: 4.6, c: 38 },
  { a: 'B0CZB8F195', i: '61NmoxnhFKL', t: 'First Communion: Inspirational Stories & Coloring Book (2 books in 1)', g: 'bijbel', p: 8.99, n: 64 },
  { a: 'B0BKRPL5JX', i: '61tIxnWcBLL', t: 'PIT BOSS Wood Pellet Grill and Smoker Cookbook', g: 'koken', p: 14.23, n: 279, r: 4.2, c: 449 },
  { a: 'B0CHL3MH5Q', i: '71SwYdfjKiL', t: 'The Outdoor Griddle Bible', g: 'koken', p: 24.93, n: 95, r: 4.1, c: 12 },
  { a: 'B0BFV4C31K', i: '71SwzBeVq1L', t: 'Lean and Green Cookbook for Beginners', g: 'koken', p: 23, n: 146, r: 4.5, c: 52 },
  { a: 'B0DR5Z8SLL', i: '71Pl2J6p4YL', t: 'High Blood Pressure Diet Cookbook', g: 'koken', p: 14.99, n: 157, r: 4.3, c: 51 },
  { a: 'B0DPSS16X3', i: '71cRBcDbNkL', t: 'Bariatric Diet Cookbook: A 28-Day Meal Plan', g: 'koken', p: 11.99, n: 123, r: 4.8, c: 11 },
  { a: 'B0D3KBF8MJ', i: '614nspJJbXL', t: 'A DBT Workbook for Anxiety Relief', g: 'gezond', p: 8.99, n: 116, r: 4.6, c: 86 },
  { a: '1080901272', i: '61F2ecHdgFL', t: 'How to Analyze People with Psychology', g: 'gezond', p: 9.99, n: 128, r: 4.2, c: 456 },
  { a: 'B0D38H9B4M', i: '61euWnd8SOL', t: 'Biohack Like a Real Man', g: 'gezond', p: 9.99, n: 177, r: 4.2, c: 30 },
  { a: 'B086PLBF4K', i: '61GDIgR2MfL', t: 'Mindfulness and Self-Regulation for Children', g: 'gezond', p: 17.38, n: 156, r: 4.8, c: 11 },
  { a: '1678661716', i: '71BxE2aqDOL', t: 'Social Skills Activities for Kids', g: 'gezond', p: 9.99, n: 149 },
  { a: 'B09SWQ8F3S', i: '61JaK-Lsr+L', t: 'Quantum Physics For Beginners', g: 'gezond', p: 8.99, n: 52, r: 4.3, c: 36 },
  { a: 'B0CZRWNZBB', i: '61T5ZQp8i9L', t: 'Mom’s Word Search: Large Print Puzzles', g: 'puzzel', p: 8.99, n: 107, r: 4.6, c: 89 },
  { a: 'B0D41ZM1CM', i: '71JORzbNCML', t: 'Nostalgic Journeys Word Search, Large Print', g: 'puzzel', p: 8.99, n: 128, r: 4.8, c: 17 },
  { a: 'B0D17F8GV8', i: '61C9otMHDOL', t: 'Summer Word Search, Large Print', g: 'puzzel', p: 8.97, n: 107, r: 4.6, c: 30 },
  { a: 'B0D5375859', i: '615jUarExsL', t: '9000 Word Search Puzzle Book for Adults, Large Print (3 in 1)', g: 'puzzel', p: 11.97, n: 286, r: 3.1, c: 24 },
  { a: 'B0D33ML7RF', i: '614CD2rlZQL', t: 'Word Search Book for Adults, Large Print: 20 Topics for Women', g: 'puzzel', p: 11.97, n: 143 },
  { a: 'B0D4MM5BMZ', i: '61wRTj-y42L', t: '4000+ Men’s Word Search, Large Print', g: 'puzzel', p: 9.97, n: 172 },
  { a: 'B0D2LNRBLH', i: '61sBXndVfHL', t: 'Dad’s Word Search, Large Print', g: 'puzzel', p: 6.99, n: 171 },
  { a: 'B0CZLH12YP', i: '71SRlNnzw1L', t: '1000 Words for Mother’s Day: Large Print Word Search', g: 'puzzel', p: 6.99, n: 106 },
  { a: 'B0D12839LG', i: '61ktiGbGUEL', t: 'Nurse Word Search, Large Print', g: 'puzzel', p: 8.99, n: 103 },
  { a: 'B0GYZGW9J7', i: '716ipZgjk0L', t: 'Golden Memories: Large Print Word Search for Seniors', g: 'puzzel', p: 7.99, n: 68 },
  { a: 'B0D2KJ4SBL', i: '71mgjv2JDEL', t: 'Summer Vibes Adult Coloring Book', g: 'kleur', p: 6.99, n: 68 },
  { a: 'B0D14TY13C', i: '71Yp3OuyHeL', t: 'Relaxing Garden Coloring Book for Adults', g: 'kleur', p: 4.99, n: 80 },
  { a: 'B0CP64CHKQ', i: '81W-3sRrN1L', t: 'You Got This! Motivational Coloring Book for Adults', g: 'kleur', p: 4.75, n: 81 },
  { a: 'B0D9WJSZNW', i: '61jEnT6p-OL', t: 'Back to School Coloring Book for Kids', g: 'kleur', p: 6.99, n: 79, r: 4.9, c: 10 },
  { a: 'B0DCZFTY77', i: '718Y1BkB+0L', t: 'Halloween Paper Dolls Coloring Book for Kids', g: 'kleur', p: 8.99, n: 77 },
  { a: 'B0CW3MRTTQ', i: '61-wmLGCq3L', t: 'Happy Easter Coloring Book for Kids', g: 'kleur', p: 7.99, n: 81 },
  { a: 'B0CXY27N2D', i: '61SxKwOkAZL', t: 'Cute Dinosaur Coloring Book for Kids', g: 'kleur', p: 4.99, n: 81 },
  { a: 'B0CXXYN7XB', i: '61erhbdVAaL', t: 'Cute Kawaii Coloring Book for Kids', g: 'kleur', p: 4.99, n: 81 },
  { a: 'B0D14TGHMF', i: '610Y-zMuMzL', t: 'Food and Snacks Coloring Book for Kids', g: 'kleur', p: 4.99, n: 80 },
  { a: 'B0D14S79VP', i: '71ryY38RkKL', t: 'Funny Clowns Coloring Book for Kids', g: 'kleur', p: 5.99, n: 80 },
  { a: 'B0CVVC2WJ7', i: '61FbdXGgUEL', t: 'Happy Unicorn Coloring Book for Kids', g: 'kleur', p: 7.99, n: 81 },
  { a: 'B0CVVD391D', i: '71VghmVjcBL', t: 'Cute Mermaid Coloring Book for Kids', g: 'kleur', p: 6.99, n: 81 },
  { a: 'B0CW3R48BV', i: '61xtMILnkAL', t: 'Happy Puppies Coloring Book for Kids', g: 'kleur', p: 7.99, n: 81 },
  { a: 'B0CW3RV2NP', i: '61gnsx9iAQL', t: 'Outer Space Coloring Book for Kids', g: 'kleur', p: 7.99, n: 81 },
  { a: 'B0CWRFQ9SC', i: '61NuA3vvxKL', t: 'Robot Coloring Book for Kids', g: 'kleur', p: 7.99, n: 81 },
  { a: 'B0CWRFMNR9', i: '71veRLABVFL', t: 'Relaxing Patterns Coloring Book for Kids', g: 'kleur', p: 7.99, n: 81 },
  { a: 'B0CWRP7RD8', i: '61P9Ir5mgAL', t: 'Minimalist Boho Coloring Book for Kids', g: 'kleur', p: 7.99, n: 81 },
  { a: 'B0CVVCCMXX', i: '71KXXdNeQ7L', t: 'Relaxing Flowers Coloring Book for Kids', g: 'kleur', p: 6.99, n: 81 },
  { a: 'B0CV5N3B8M', i: '61m3CgbGDOL', t: 'Simple Vehicles Coloring Book for Kids', g: 'kleur', p: 7.99, n: 81 },
  { a: 'B0CV5M1FLJ', i: '71O3Aj2WeaL', t: 'Farm Animals Coloring Book for Kids', g: 'kleur', p: 7.99, n: 81 },
  { a: 'B0CP2RVNJH', i: '71JhTf+RGaL', t: 'Sea Animals Coloring Book', g: 'kleur', p: 7.99, n: 81 },
  { a: 'B0B2HYL6VZ', i: '71FXexLemQL', t: 'Coin Collecting for Beginners', g: 'kennis', p: 11.97, n: 88, r: 4.1, c: 85 },
  { a: 'B09ZCX7HVM', i: '71zAtJ7aSLL', t: 'The Jar Spells Compendium', g: 'kennis', p: 14.58, n: 75, r: 4.4, c: 84 },
  { a: 'B09XT6QR79', i: '61OblnpcrWL', t: 'Airbnb Business: How to Make Money on Airbnb Without Owning Property', g: 'kennis', p: 13.9, n: 46, r: 3.9, c: 38 },
  { a: '1653039299', i: '61gRMi9lYyL', t: 'Python Workbook: Exercises, Projects and Solutions', g: 'kennis', p: 17.38, n: 158, r: 4.6, c: 34 },
  { a: '1673725384', i: '7169m8EAClL', t: 'Python Programming for Beginners', g: 'kennis', p: 18.38, n: 197 },
  { a: 'B08WV4ZNPK', i: '71RIs7S7DGS', t: 'Options Trading Crash Course (2 books in 1)', g: 'kennis', p: 9.99, n: 176 },
  { a: 'B08TQ4T961', i: '61NL9H6EG4L', t: 'Options Trading Workbook', g: 'kennis', p: 17.38, n: 110 },
  { a: 'B08VCN6JGS', i: '61CNTGchpjL', t: 'Options Trading for Beginners', g: 'kennis', p: 18.38, n: 94 },
  { a: 'B0D99FYB7K', i: '61FKtTZaNyL', t: 'How to Earn a Degree', g: 'kennis', p: 8.99, n: 132 },
  { a: 'B0D8PKQ7RN', i: '71EwG+JzLuL', t: 'Falling Softly: Whispering Hearts', g: 'roman', p: 14.99, n: 95 },
];

// Gratis printbare woordzoekers (door de code gemaakt uit deze woorden, vaste uitkomst per zaadje): eigen inhoud, niet uit een boek.
export const PUZZELS = [
  { id: 'christmas-morning', naam: 'Christmas Morning', zaad: 2026, woorden: ['STOCKING', 'PRESENT', 'RIBBON', 'WRAPPING', 'COCOA', 'PAJAMAS', 'COOKIES', 'TINSEL', 'WREATH', 'CANDLE', 'CAROLS', 'FAMILY'] },
  { id: 'santas-workshop', naam: 'Santa’s Workshop', zaad: 1225, woorden: ['REINDEER', 'SLEIGH', 'CHIMNEY', 'ELVES', 'TOYS', 'NORTHPOLE', 'WORKSHOP', 'BELLS', 'SACK', 'SNOWFLAKE', 'GINGERBREAD', 'LIST'] },
  { id: 'winter-cozy', naam: 'Winter Cozy', zaad: 1231, woorden: ['BLANKET', 'FIREPLACE', 'SNOWMAN', 'SCARF', 'MITTENS', 'ICICLE', 'SLEDDING', 'FROST', 'CIDER', 'LANTERN', 'SWEATER', 'SNOWFALL'] },
  { id: 'christmas-baking', naam: 'Christmas Baking', zaad: 1201, woorden: ['GINGERBREAD', 'FROSTING', 'SPRINKLES', 'COOKIE', 'CINNAMON', 'NUTMEG', 'PEPPERMINT', 'FUDGE', 'OVEN', 'APRON', 'SUGAR', 'ROLLINGPIN'] },
  { id: 'nativity', naam: 'The Nativity', zaad: 1202, woorden: ['BETHLEHEM', 'MANGER', 'SHEPHERDS', 'ANGEL', 'STAR', 'MARY', 'JOSEPH', 'WISEMEN', 'GOLD', 'MYRRH', 'FRANKINCENSE', 'STABLE'] },
  { id: 'winter-animals', naam: 'Winter Animals', zaad: 1203, woorden: ['POLARBEAR', 'PENGUIN', 'REINDEER', 'ARCTICFOX', 'SNOWYOWL', 'WALRUS', 'SEAL', 'MOOSE', 'HUSKY', 'CARDINAL', 'HARE', 'ERMINE'] },
  { id: 'deck-the-halls', naam: 'Deck the Halls', zaad: 1204, woorden: ['GARLAND', 'ORNAMENT', 'MISTLETOE', 'HOLLY', 'POINSETTIA', 'TREETOPPER', 'LIGHTS', 'BAUBLE', 'NUTCRACKER', 'CANDYCANE', 'STOCKING', 'WREATH'] },
  { id: 'christmas-eve', naam: 'Christmas Eve', zaad: 1205, woorden: ['MIDNIGHT', 'CHURCH', 'CANDLELIGHT', 'PAJAMAS', 'MILK', 'COOKIES', 'CARROTS', 'CHIMNEY', 'SILENT', 'STARRY', 'SLEEP', 'WAITING'] },
  { id: 'snow-day', naam: 'Snow Day', zaad: 1206, woorden: ['SNOWBALL', 'SLED', 'IGLOO', 'SHOVEL', 'BOOTS', 'SNOWANGEL', 'HOTCOCOA', 'BLIZZARD', 'FLURRY', 'SKATES', 'BEANIE', 'SCARF'] },
  { id: 'christmas-dinner', naam: 'Christmas Dinner', zaad: 1207, woorden: ['TURKEY', 'HAM', 'STUFFING', 'GRAVY', 'CRANBERRY', 'POTATOES', 'ROLLS', 'PUDDING', 'EGGNOG', 'PIE', 'TABLE', 'TOAST'] },
  { id: 'carols', naam: 'Christmas Carols', zaad: 1208, woorden: ['SILENTNIGHT', 'JOYTOTHEWORLD', 'NOEL', 'JINGLEBELLS', 'GLORIA', 'CHOIR', 'HARMONY', 'SING', 'HYMN', 'BELLS', 'CAROLERS', 'MELODY'] },
  { id: 'new-years-eve', naam: 'New Year’s Eve', zaad: 1231, woorden: ['COUNTDOWN', 'MIDNIGHT', 'FIREWORKS', 'CONFETTI', 'RESOLUTION', 'TOAST', 'PARTY', 'CALENDAR', 'GLITTER', 'HATS', 'CHEERS', 'JANUARY'] },
];
