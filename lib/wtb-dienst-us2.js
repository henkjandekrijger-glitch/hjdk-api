// Beslisgidsen op whichtobuy.best voor de AI-gaten van Demand Radar die op 19 nov 2026 nog geen pagina hadden:
// online course (246.000 per maand), bootcamp coding (246.000 per maand) en coffee shop near me (12,6 miljoen per maand). Zelfde vorm als lib/wtb-dienst.js (decisionKind 'dienst'),
// eigen bestand om botsingen met andere chats te vermijden. DIENST_GUIDES.us in lib/wtb-dienst.js leest DIENST_US2.
// Henkjan 19 nov 2026: "Maak ze". Protocol: .claude/skills/keuzehulp-bouw/SKILL.md (één eerste keus, koopvraag als eerste FAQ, elk feit met bron).
// Elk cijfer is gelezen op de genoemde bron op GELEZEN. Geen gedachtestreepjes, geen affiliate.

const GELEZEN = '2026-11-19';
const COURSERA_PLUS = 'https://www.coursera.org/courseraplus';
const GOOGLE_CERT = 'https://grow.google/certificates/';
const UDEMY_PRIJS = 'https://support.udemy.com/hc/en-us/articles/229606248-Udemy-Course-Pricing-Learner-FAQ';
const TI_KIES = 'https://www.techinterview.org/post/3233477751/choose-se-bootcamp/';
const TI_GA = 'https://www.techinterview.org/post/3233477747/general-assembly-bootcamp-closed/';
const CR_GA = 'https://www.coursereport.com/schools/general-assembly';
const SCRIMBA = 'https://scrimba.com/articles/best-coding-bootcamps-in-2026-costs-job-rates-and-how-to-choose/';
const ODIN = 'https://www.theodinproject.com/';
const CIRR = 'https://www.cirr.org/schooldata';

const COURSE = {
  slug: 'online-courses-which-platform-to-pick-and-what-it-costs', decisionKind: 'dienst', priority: 55, cat: 'Courses & Careers', term: 'online course',
  title: 'Online courses: which platform to pick and what it costs',
  h1: 'Online course: which platform, what it costs',
  seoTitle: 'Online courses: which platform to pick and what it costs',
  metaDesc: 'Online course: a Google certificate on Coursera is $49 a month. Coursera Plus is $239 for a year until Nov 30, 2026. When Udemy or free fits better.',
  intro: 'Online course sites charge per month, per course, or nothing. What you want at the end decides which is cheapest.',
  kort: 'Want a certificate that helps with a job? Start with a Google Career Certificate on Coursera: $49 a month after a 7-day free trial, and Google says most learners finish in three to six months, so about $147 to $294 in total. Planning more than one program this year? Coursera Plus is $59 a month or $399 a year, and until November 30, 2026 new subscribers pay $239 for the first year. Want one skill? Buy a single Udemy course: you pay once and keep access. Want to learn without a certificate? Khan Academy and MIT OpenCourseWare are free.',
  questions: [
    { q: 'What are you looking for?', options: [{ label: 'Online courses with certificates' }, { label: 'Free online courses' }, { label: 'One online course for a skill' }, { label: 'Several online courses this year' }] },
    { q: 'What is it for?', options: [{ label: 'A new job or career change' }, { label: 'My current job' }, { label: 'Personal interest' }] },
    { q: 'How much time do you have?', options: [{ label: 'A few hours a week' }, { label: 'About 10 hours a week' }, { label: 'Not sure' }] }
  ],
  routes: [
    { title: 'Certificate for a job: a Google Career Certificate on Coursera', why: 'Google Career Certificates cost $49 a month in the US after a 7-day free trial. Google says most learners finish in three to six months at under 10 hours of study a week, which comes to about $147 to $294. Google also says more than 150 US companies consider graduates for entry-level jobs, and that over 70% of graduates report a positive career outcome within six months (its 2025 US survey).', note: 'There are certificates in data analytics, project management, cybersecurity, digital marketing and e-commerce, IT support and UX design. You pay per month, so finishing sooner costs less.', tradeoff: 'It is a certificate, not a degree, and the outcome figure comes from Google\'s own survey. Enrollment includes 3 months of Google AI Pro at no extra cost; after that Google lists it at $19.99 a month, so decide whether you want to keep it.', links: [['See the Google Career Certificates', GOOGLE_CERT], ['Coursera Plus', COURSERA_PLUS]] },
    { title: 'Free, no certificate: Khan Academy or MIT OpenCourseWare', why: 'If you want to learn and do not need a certificate, you do not have to pay. Khan Academy covers math from kindergarten through early college, grammar, science, history, AP and SAT prep, and says it is all free for learners and teachers. MIT OpenCourseWare publishes the materials of more than 2,500 MIT courses, with no fee and no registration.', note: 'Khan Academy suits school subjects and catching up. MIT OpenCourseWare suits college-level subjects if you can study on your own.', tradeoff: 'No certificate, no deadlines and no instructor. If you need proof for an employer, take the certificate route.', links: [['Open Khan Academy', 'https://www.khanacademy.org/'], ['Open MIT OpenCourseWare', 'https://ocw.mit.edu/']] },
    { title: 'One skill: buy a single Udemy course', why: 'On Udemy you pay per course and keep it. Udemy says a purchased course gives lifetime access to the course material as long as you have access to your Udemy account. The instructor sets the price, and promotions differ by region and by account.', note: 'Log in on the website before you buy: Udemy says that shows the latest promotion for your account, and that coupons cannot be entered in the mobile app.', tradeoff: 'Quality differs per instructor, so check the rating, the number of students and the date of the last update before you buy.', links: [['Browse Udemy courses', 'https://www.udemy.com/'], ['How Udemy pricing works', UDEMY_PRIJS]] },
    { title: 'Several courses this year: Coursera Plus on the annual offer', why: 'Coursera Plus gives access to more than 10,000 courses and certificate programs for $59 a month after a 7-day free trial, or $399 a year. Until November 30, 2026 new subscribers pay $239 for the first year, about the price of four months on the monthly plan.', note: 'The offer is for new Coursera Plus subscribers, one per person. Coursera says annual subscribers can request a refund within 14 days.', tradeoff: 'Degrees, MasterTrack certificates and certain courses and certificates are not included, so check that your program is in Plus before you pay.', links: [['See Coursera Plus', COURSERA_PLUS]] }
  ],
  extra2: ['For a career change, pick one certificate and finish it before you start a second.', 'Ask your employer whether they pay for job-related courses before you pay yourself.', 'For personal interest, start with the free options and pay only if you want the certificate.'],
  extra3: ['At a few hours a week a pay-per-month certificate takes longer and costs more. A one-time purchase or a free course carries no time pressure.', 'At about 10 hours a week, Google says most learners finish a certificate in three to six months.', 'Use the 7-day free trial to see how many hours a week you really manage.'],
  picks: [
    ['Online courses with certificates', 'A Google Career Certificate on Coursera', '$49 a month after a 7-day trial; three to six months, so about $147 to $294.'],
    ['Free online courses', 'Khan Academy or MIT OpenCourseWare', 'Free, no certificate. MIT OpenCourseWare needs no registration.'],
    ['One online course for a skill', 'A single Udemy course', 'Pay once, lifetime access. Log in on the website to see your price.'],
    ['Several online courses this year', 'Coursera Plus, annual', '$239 for the first year until November 30, 2026, normally $399.']
  ],
  guide: 'How online courses are priced. There are three models. Per month until you finish: Coursera certificates, $49 a month for a Google Career Certificate. Per course, paid once: Udemy, where the instructor sets the price. Free: Khan Academy and MIT OpenCourseWare.\nWhat Coursera Plus costs. On November 19, 2026 Coursera listed Plus at $59 a month after a 7-day free trial, and at $239 for a year instead of $399. That 40% discount is for new subscribers and ends on November 30, 2026 at 11:59 p.m. UTC. Plus covers more than 10,000 courses, projects, Specializations and Professional Certificates. Degrees and MasterTrack certificates are not included.\nWhat a Google Career Certificate costs. $49 a month in the US and Canada after a 7-day free trial, according to Google. At three to six months that is $147 to $294.\nWhat Udemy costs. Udemy has no single price: the instructor sets it and promotions differ per region and account. You buy a course once and keep access. Udemy also sells a Personal Plan subscription that gives access to its content for as long as you pay.\nWhen free is enough. If you do not need a certificate, Khan Academy and MIT OpenCourseWare cost nothing. MIT OpenCourseWare has materials from more than 2,500 courses and needs no registration.\nRefunds. Coursera says annual Plus subscribers can request a refund within 14 days, and that certificates earned in that window are then revoked.',
  mistakes: ['Paying per month and then studying less than planned: every extra month is another $49 or $59.', 'Buying Coursera Plus without checking that your program is included.', 'Paying for a certificate when you only want to learn: Khan Academy and MIT OpenCourseWare are free.', 'Buying a Udemy course in the mobile app: Udemy says coupons cannot be entered there.'],
  aiMiss: ['AI answers list nine platforms without saying where to start. For a job certificate that is a Google Career Certificate at $49 a month; for learning without a certificate it is a free site.', 'Answers rarely give the total: three to six months at $49 is $147 to $294.', 'Few answers mention the dated offer: Coursera Plus is $239 instead of $399 for new subscribers until November 30, 2026.'],
  faq: [
    { q: 'What is the best online course platform and where should I sign up?', a: 'It depends on what you want at the end. For a certificate that helps with a job, start with a Google Career Certificate on Coursera: $49 a month after a 7-day free trial, usually three to six months. For several programs in one year, Coursera Plus is $239 for the first year until November 30, 2026, normally $399. For one skill, buy a single Udemy course and keep it. To learn without a certificate, Khan Academy and MIT OpenCourseWare are free.' },
    { q: 'How much does an online course cost?', a: 'From nothing to $59 a month. Khan Academy and MIT OpenCourseWare are free. A Google Career Certificate is $49 a month on Coursera. Coursera Plus is $59 a month or $399 a year, and $239 for new subscribers until November 30, 2026. On Udemy the instructor sets the price per course.' },
    { q: 'Are there free online courses with certificates?', a: 'The free options on this page, Khan Academy and MIT OpenCourseWare, do not give certificates. Coursera has a 7-day free trial before the first payment.' },
    { q: 'How much is Coursera Plus?', a: '$59 a month after a 7-day free trial, or $399 a year. On November 19, 2026 Coursera offered the first year for $239 to new subscribers, until November 30, 2026.' },
    { q: 'How long does a Google Career Certificate take?', a: 'Google says three to six months at under 10 hours of study a week. You pay $49 a month, so finishing sooner costs less.' },
    { q: 'Do I keep a Udemy course forever?', a: 'Udemy says a purchased course gives lifetime access to the course material as long as you continue to have access to your Udemy account.' },
    { q: 'Is Coursera Plus worth it?', a: 'If you take more than one paid program in a year, the numbers favor it: one Google Career Certificate alone costs $147 to $294, and the Plus offer is $239 for a year. Check first that your program is included. Degrees and MasterTrack certificates are not.' }
  ],
  sources: [
    ['Coursera: Coursera Plus (prices, offer, refund)', COURSERA_PLUS],
    ['Grow with Google: Google Career Certificates (cost, duration, outcomes)', GOOGLE_CERT],
    ['Udemy support: course pricing FAQ', UDEMY_PRIJS],
    ['Coastal Carolina University library: Khan Academy (free for learners and teachers)', 'https://coastalcarolina.libguides.com/oer/courseware'],
    ['College Values Online: MIT OpenCourseWare (no fee, no registration)', 'https://www.collegevaluesonline.com/rankings/free-online-college-courses/'],
    ['Gaurav Tiwari: free course sites (MIT OpenCourseWare, 2,500+ courses)', 'https://gauravtiwari.org/websites-that-offer-free-online-short-courses/']
  ],
  disc: 'We do not earn money from the links on this page and no platform paid to be named.',
  gelezen: GELEZEN, publishAt: '2026-11-20', updatedAt: '2026-11-20'
};

const BOOTCAMP = {
  slug: 'coding-bootcamp-which-ones-still-enroll-and-what-they-cost', decisionKind: 'dienst', priority: 55, cat: 'Courses & Careers', term: 'coding bootcamp',
  title: 'Coding bootcamp: which ones still enroll and what they cost',
  h1: 'Coding bootcamp: who still enrolls, what it costs',
  seoTitle: 'Coding bootcamp: which ones still enroll and what they cost',
  metaDesc: 'Coding bootcamp: General Assembly stopped enrolling on April 28, 2026. Start free with The Odin Project, then compare Launch School and Fullstack Academy.',
  intro: 'Several famous coding bootcamps stopped enrolling. See who still runs, what it costs, and how to start free.',
  kort: 'Start free: The Odin Project is a free, self-paced full-stack curriculum, and a month on it shows whether you like coding before you spend anything. Still want a paid program? Pick one with a dated next cohort and published outcomes. In October 2026 Fullstack Academy listed a full-time cohort for January 25, 2027 at $7,995 paid upfront ($11,995 list), and Launch School charged $199 a month for its Core curriculum with no fixed term. Be careful with older lists: General Assembly stopped enrolling consumers on April 28, 2026, App Academy\'s immersive ended in June 2025 and Turing School closed in 2025.',
  questions: [
    { q: 'What are you looking for?', options: [{ label: 'Free coding bootcamp' }, { label: 'Online coding bootcamp, part-time' }, { label: 'Full-time coding bootcamp' }, { label: 'Is a coding bootcamp worth it' }] },
    { q: 'What is your goal?', options: [{ label: 'A job as a developer' }, { label: 'Coding skills for my current job' }, { label: 'Just trying it out' }] },
    { q: 'How much can you spend?', options: [{ label: 'Nothing right now' }, { label: 'Up to $3,000' }, { label: 'More than $3,000' }] }
  ],
  routes: [
    { title: 'Start free: The Odin Project', why: 'The Odin Project is free and self-paced and teaches full-stack JavaScript, the same stack as freeCodeCamp, which is also free. A month on either one shows whether you like coding and can keep going on your own, before you spend anything.', note: 'Set yourself a fixed number of hours a week for four weeks. If you finish them, a paid program becomes a real option. If you do not, you have lost nothing.', tradeoff: 'No instructor, no cohort and no career service. You need the discipline to keep going alone.', links: [['Start The Odin Project', ODIN], ['Open freeCodeCamp', 'https://www.freecodecamp.org/']] },
    { title: 'Part-time and online: Launch School, paid per month', why: 'Launch School charged $199 a month for its Core curriculum in October 2026. There is no fixed term, so you pay for the months you study and can stop. For a cohort at a low price, Nucamp sells a part-time bootcamp for under $3,000.', note: 'Launch School also has an optional Capstone of about 16 weeks full-time. Its fee is 18% of your first-year salary or $18,000, whichever is higher, paid after you accept a job. Launch School reports that 61.7% of the people who entered Capstone in 2025 accepted an offer, at a median of $115,000. That figure is self-published and not audited.', tradeoff: 'Paying per month only stays cheap if you keep a steady pace.', links: [['See Launch School', 'https://launchschool.com/'], ['See Nucamp', 'https://www.nucamp.co/']] },
    { title: 'Full-time: a program with a dated next cohort, such as Fullstack Academy', why: 'In October 2026 Fullstack Academy listed its next full-time cohort for January 25, 2027: 13 weeks, $11,995 list price or $7,995 if you pay upfront. It reports that 72% of its 2021 graduates worked in the field within a year, at an average salary of $88,561, a figure reviewed by a third party.', note: 'Hack Reactor is the other well-known full-time name. Its beginner bootcamp was $19,480 (16 weeks full-time or 30 weeks part-time), or $16,980 with a $2,500 scholarship, but its site showed no dated cohort in October 2026. Ask for the start date in writing before you pay anything.', tradeoff: 'You cannot work next to a 13-week full-time program, and the outcome figures are for people who graduated in 2021.', links: [['See Fullstack Academy', 'https://www.fullstackacademy.com/'], ['Check audited outcomes at CIRR', CIRR]] },
    { title: 'Worth it only with a dated cohort and checked outcomes', why: 'A bootcamp is worth paying for only if it still runs, its outcomes have been checked by someone else, and you finish it. General Assembly ceased enrolling consumers on April 28, 2026, App Academy\'s immersive had its last day in June 2025, Turing School filed for bankruptcy in June 2025 and Codesmith paused its immersive. Average tuition is $14,142 according to Course Report.', note: 'Check three things on the school\'s own site before you pay: a dated next cohort, outcomes reported under the CIRR standard or reviewed by a third party, and the refund policy in writing.', tradeoff: 'An income share agreement takes a share of your income for a capped term, so you cannot know the total cost upfront.', links: [['Check audited outcomes at CIRR', CIRR], ['Start free on The Odin Project', ODIN]] }
  ],
  extra2: ['For a job, outcomes matter more than the brand: ask for placement figures and how they were measured.', 'For your current job you may not need a bootcamp: a free curriculum or a single course can be enough.', 'To try it out, stay on the free route. You can always pay later.'],
  extra3: ['The Odin Project and freeCodeCamp cost nothing.', 'Under $3,000 fits a part-time program such as Nucamp, or about a year of Launch School Core at $199 a month.', 'Above $3,000 you are looking at a cohort: Fullstack Academy listed $7,995 upfront and Hack Reactor $19,480.'],
  picks: [
    ['Free coding bootcamp', 'The Odin Project, or freeCodeCamp', 'Free and self-paced. A month shows whether coding suits you.'],
    ['Online coding bootcamp, part-time', 'Launch School Core', '$199 a month, stop when you want. Nucamp is under $3,000.'],
    ['Full-time coding bootcamp', 'Fullstack Academy', 'Cohort listed for January 25, 2027; 13 weeks; $7,995 upfront, $11,995 list.'],
    ['Is a coding bootcamp worth it', 'Only with a dated cohort and checked outcomes', 'General Assembly, App Academy and Turing no longer run their bootcamps.']
  ],
  guide: 'Who still enrolls. General Assembly ceased enrolling consumers on April 28, 2026 and continues to provide training for businesses, according to Course Report. Its own regulatory page says enrolled students finish through a teach-out (as read by techinterview.org on October 8, 2026). According to techinterview.org\'s review of October 16, 2026, App Academy\'s immersive had its last day of instruction on June 21, 2025, Turing School stopped enrolling in April 2025 and filed for Chapter 7 bankruptcy in June 2025, and Codesmith paused its immersive and said it expects a fall cohort once client timelines are confirmed.\nWhat it costs. In the same review: Launch School Core $199 a month; Fullstack Academy $11,995 list or $7,995 upfront for 13 weeks full-time, next cohort January 25, 2027; Hack Reactor $19,480 for its beginner bootcamp, or $16,980 with a $2,500 scholarship; Flatiron School certificates $14,900. Hack Reactor and Flatiron showed no dated cohort. Course Report puts average bootcamp tuition at $14,142, as cited by Scrimba.\nFree first. The Odin Project is free and self-paced and teaches full-stack JavaScript, the same stack as freeCodeCamp.\nOutcomes. Look for figures reported under the CIRR standard, which are audited, or reviewed by a third party. Fullstack Academy reports 72% of its 2021 graduates working in the field within a year at an average of $88,561. Launch School\'s figures are self-published.\nPaying later. An income share agreement takes a share of your income for a capped term. Launch School\'s Capstone fee is 18% of first-year salary or $18,000, whichever is higher, after you accept a job.',
  mistakes: ['Choosing from a ranking that still lists General Assembly or App Academy as open.', 'Paying a deposit before you have seen the date of the next cohort.', 'Comparing placement rates without asking how they were measured and for which year.', 'Signing an income share agreement without reading the cap and the term.'],
  aiMiss: ['AI answers still recommend General Assembly, App Academy and Codesmith. General Assembly stopped enrolling consumers on April 28, 2026, App Academy\'s immersive ended in June 2025 and Codesmith paused its immersive.', 'Answers rarely say to start free: The Odin Project and freeCodeCamp cost nothing.', 'Few answers give current prices: $199 a month at Launch School, $7,995 upfront at Fullstack Academy, $19,480 at Hack Reactor.'],
  faq: [
    { q: 'What is the best coding bootcamp and where should I sign up?', a: 'Start free with The Odin Project for a month. If you still want a paid program, choose one with a dated next cohort and checked outcomes: in October 2026 Fullstack Academy listed a full-time cohort for January 25, 2027 at $7,995 upfront, and Launch School charged $199 a month with no fixed term. Do not rely on older lists: General Assembly stopped enrolling consumers on April 28, 2026.' },
    { q: 'Is General Assembly still open?', a: 'Not for individual students. Course Report states that General Assembly ceased enrolling consumers on April 28, 2026 and continues to provide training for businesses. Students who were already enrolled finish through a teach-out.' },
    { q: 'How much does a coding bootcamp cost?', a: 'From free to about $20,000. The Odin Project and freeCodeCamp are free. In October 2026 Launch School Core was $199 a month, Fullstack Academy $7,995 upfront ($11,995 list) and Hack Reactor $19,480. Course Report puts the average at $14,142.' },
    { q: 'Is there a free coding bootcamp?', a: 'Yes. The Odin Project is a free, self-paced full-stack curriculum, and freeCodeCamp is free as well. There is no instructor and no career service.' },
    { q: 'Is a coding bootcamp worth it in 2026?', a: 'Only if the program still runs, publishes outcomes that someone else has checked, and you can finish it. Several well-known bootcamps closed or paused in 2025 and 2026, so check for a dated next cohort first.' },
    { q: 'What is CIRR?', a: 'The Council on Integrity in Results Reporting sets a standard for how bootcamps report graduation, in-field employment after 180 days and salaries. Figures reported under that standard are audited.' },
    { q: 'What is an income share agreement?', a: 'You pay little or nothing upfront and then a share of your income for a capped term after you find a job. The total is not known in advance, so read the cap and the term before you sign.' }
  ],
  sources: [
    ['Course Report: General Assembly (ceased enrolling consumers on April 28, 2026)', CR_GA],
    ['techinterview.org: How to choose a coding bootcamp in 2026 (updated October 16, 2026)', TI_KIES],
    ['techinterview.org: Is General Assembly closed?', TI_GA],
    ['Scrimba: Best coding bootcamps in 2026 (Course Report figures)', SCRIMBA]
  ],
  disc: 'We do not earn money from the links on this page and no school paid to be named.',
  gelezen: GELEZEN, publishAt: '2026-11-20', updatedAt: '2026-11-20'
};

const AXIOS = 'https://www.axios.com/2025/01/27/starbucks-free-refills-policy-condiment-bar';
const BI_SBUX = 'https://www.businessinsider.nl/starbucks-is-extending-its-free-refill-policy-as-it-tries-to-make-customers-stay-longer-in-stores/';
const TT_SBUX = 'https://www.tastingtable.com/1785641/cold-brew-excluded-starbucks-refill-policy';
const BL_SBUX = 'https://baristalife.co/blogs/blog/starbucks-refill-policy';
const NRN_SIP = 'https://www.nrn.com/fast-casual/panera-s-unlimited-sip-club-will-no-longer-be-unlimited';
const RD_SIP = 'https://www.restaurantdive.com/news/panera-limits-sips-club-one-drink-daily/825122/';
const QZ_SIP = 'https://qz.com/panera-sip-club-drink-cap-30-per-month-072026';
const GMAPS = 'https://www.google.com/maps/search/coffee+shop+near+me';

// coffee shop near me (Demand Radar 19 nov 2026: 12,6 miljoen per maand, 2 van 3 andere AI's zonder eerste keus)
const COFFEE = {
  slug: 'coffee-shop-near-me-how-to-pick-one-and-pay-less', decisionKind: 'dienst', priority: 55, cat: 'Local Services', term: 'coffee shop near me',
  title: 'Coffee shop near me: how to pick one and pay less',
  h1: 'Coffee shop near me: where to go and how to pay less',
  seoTitle: 'Coffee shop near me: how to pick one and pay less',
  metaDesc: 'Coffee shop near me: order for here at Starbucks and brewed coffee refills are free. Panera Sip Club: $14.99 a month for up to 30 drinks since Aug 2026.',
  intro: 'Any map app lists coffee shops near you. Which one fits depends on why you go: a place to sit, the lowest price, or the best cup.',
  kort: 'For a coffee shop where you can sit, pick a Starbucks and order for here: since January 27, 2025 every customer who does gets free refills of hot or iced brewed coffee or tea during the same visit. Buying coffee most days? Panera\'s Sip Club costs $14.99 a month for up to 30 self-service drinks, about 50 cents a drink if you use them all. Want the best cup rather than the cheapest? Pick an independent shop with many recent reviews in your map app, and use the Open now filter before you leave.',
  questions: [
    { q: 'What are you looking for?', options: [{ label: 'Coffee shop near me to work or study' }, { label: 'Cheap coffee near me' }, { label: 'Best coffee shop near me' }, { label: 'Coffee shop near me open now' }] },
    { q: 'How often do you buy coffee?', options: [{ label: 'Almost every day' }, { label: 'A few times a week' }, { label: 'Now and then' }] },
    { q: 'What do you drink?', options: [{ label: 'Brewed coffee or tea' }, { label: 'Lattes and espresso drinks' }, { label: 'Cold brew' }] }
  ],
  routes: [
    { title: 'To sit, work or study: Starbucks, ordered for here', why: 'Since January 27, 2025 Starbucks gives every customer who orders any drink for here free refills of hot brewed coffee, iced coffee, hot tea or iced tea during the same visit. Before that date only Rewards members got them. Your drink comes in a mug or a glass, or in a clean cup you bring yourself.', note: 'Say "for here" when you order and stay in the café: you cannot leave and come back for a refill. It applies at participating stores.', tradeoff: 'Cold Brew and Nitro Cold Brew are not refilled for free, and neither are lattes or other espresso drinks.', links: [['Find a Starbucks near you', 'https://www.starbucks.com/store-locator'], ['How the refill policy changed (Axios)', AXIOS]] },
    { title: 'Cheapest for a daily habit: the Panera Sip Club', why: 'Panera\'s Sip Club costs $14.99 a month or $119.99 a year, plus tax. Since August 19, 2026 it covers up to 30 self-service drinks a month, such as drip coffee, iced coffee and tea. Use all 30 and a drink costs about 50 cents. Panera says a member who takes a drink every day saves over $100 a month at an average price of $3.99.', note: 'The plan used to be called Unlimited Sip Club and allowed a drink every two hours. That ended in August 2026, so older advice about unlimited coffee is out of date. About four drinks a month cover the fee.', tradeoff: 'It only pays off if a Panera is on your route, and made-to-order drinks such as lattes are not part of it.', links: [['Find a Panera near you', 'https://www.panerabread.com/'], ['What changed in the Sip Club (Nation\'s Restaurant News)', NRN_SIP]] },
    { title: 'Best cup: an independent shop with many recent reviews', why: 'For the best cup, look past the chains. Search for coffee in your map app, sort by rating and read the newest reviews. A shop with many recent reviews tells you more than a high score from a handful of people.', note: 'Check the photos for the menu and the prices before you go.', tradeoff: 'Independent shops set their own hours and prices, and the perks of the chains do not apply.', links: [['Search coffee shops in Google Maps', GMAPS]] },
    { title: 'Open now: use the filter, then check the rating', why: 'Opening hours differ per shop, so use the Open now filter in your map app instead of guessing. The store locators of Starbucks and Panera show the hours of each location.', note: 'On holidays, check the shop\'s own page or call ahead.', tradeoff: 'The filter shows what is open, not how good it is, so still look at the rating and the newest reviews.', links: [['Coffee shops in Google Maps', GMAPS], ['Starbucks store locator', 'https://www.starbucks.com/store-locator']] }
  ],
  extra2: ['Almost every day: a monthly plan such as the Panera Sip Club ($14.99 for up to 30 drinks) is the cheapest route.', 'A few times a week: about four drinks a month already cover the Panera fee, and at Starbucks refills are free when you sit in.', 'Now and then: pick the shop you like. A plan does not pay off.'],
  extra3: ['Brewed coffee and tea are the drinks that get free refills at Starbucks and that the Panera Sip Club covers.', 'Lattes and other espresso drinks are not refilled for free at Starbucks and are not part of the Panera Sip Club.', 'Cold Brew is excluded from free refills at Starbucks. Iced coffee is included.'],
  picks: [
    ['Coffee shop near me to work or study', 'Starbucks, ordered for here', 'Free refills of brewed coffee and tea during the same visit, for every customer since January 27, 2025.'],
    ['Cheap coffee near me', 'Panera Sip Club', '$14.99 a month for up to 30 self-service drinks, about 50 cents each.'],
    ['Best coffee shop near me', 'An independent shop with many recent reviews', 'Sort by rating in your map app and read the newest reviews.'],
    ['Coffee shop near me open now', 'The Open now filter in your map app', 'Then check the rating before you go.']
  ],
  guide: 'Free refills at Starbucks. On January 27, 2025 Starbucks extended free refills from Rewards members to every customer who orders for here, according to Axios and Business Insider. The refill is hot brewed coffee, iced coffee, hot tea or iced tea, during the same visit, in a mug, a glass or a clean cup of your own. Cold Brew and Nitro Cold Brew are excluded, and so are espresso drinks such as lattes.\nThe Panera Sip Club. Panera capped its drink subscription at 30 self-service drinks a month from August 19, 2026 and dropped the word Unlimited. The price stayed at $14.99 a month or $119.99 a year plus tax. Before the change members could take one drink every two hours. According to Nation\'s Restaurant News, about four drinks a month cover the fee.\nWhat that means per cup. $14.99 divided by 30 drinks is about 50 cents a drink. If you only go twice a month, the plan costs more than buying the drinks.\nFinding a good shop. Ratings help most when there are many recent reviews. Use the Open now filter, and look at the photos for the menu and prices.',
  mistakes: ['Ordering to go at Starbucks and expecting a free refill: it only applies when you order for here and stay.', 'Signing up for the Panera Sip Club because it is unlimited: since August 19, 2026 it is capped at 30 drinks a month.', 'Expecting a free refill on a latte or Cold Brew.', 'Trusting a five-star score from only a handful of reviews.'],
  aiMiss: ['AI answers list eight chains and map apps without saying where to go. To sit and work, a Starbucks with a for-here order gives free brewed refills; for a daily cup, the Panera Sip Club is about 50 cents a drink.', 'Answers often still call the Panera plan unlimited. Since August 19, 2026 it is capped at 30 self-service drinks a month.', 'Few answers mention that free Starbucks refills are for every customer since January 27, 2025, not only Rewards members.'],
  faq: [
    { q: 'What is a good coffee shop near me and where should I go?', a: 'To sit, work or study, pick a Starbucks and order for here: every customer gets free refills of hot or iced brewed coffee or tea during the same visit. For a daily cup at the lowest price, the Panera Sip Club is $14.99 a month for up to 30 self-service drinks. For the best cup, choose an independent shop with many recent reviews in your map app and check that it is open now.' },
    { q: 'Does Starbucks give free refills?', a: 'Yes, since January 27, 2025, to every customer who orders for here and stays in the café. The refill is hot brewed coffee, iced coffee, hot tea or iced tea. Cold Brew, Nitro Cold Brew and espresso drinks such as lattes are excluded.' },
    { q: 'Is the Panera Sip Club still unlimited?', a: 'No. Since August 19, 2026 it covers up to 30 self-service drinks a month. The price stayed at $14.99 a month or $119.99 a year plus tax.' },
    { q: 'How much is the Panera Sip Club?', a: '$14.99 a month or $119.99 a year, plus tax, for up to 30 self-service drinks a month. That is about 50 cents a drink if you use all 30.' },
    { q: 'What is the cheapest way to get coffee every day?', a: 'Of the options on this page, the Panera Sip Club: about 50 cents a drink at 30 drinks a month. If you sit in at Starbucks, refills of brewed coffee are free after the first drink.' },
    { q: 'How do I find a coffee shop that is open now?', a: 'Use the Open now filter in your map app. The store locators of Starbucks and Panera show the hours of each location.' },
    { q: 'Do I need to be a Starbucks Rewards member for a free refill?', a: 'No. Since January 27, 2025 the free refill is for every customer who orders for here. Before that it was for Rewards members only.' }
  ],
  sources: [
    ['Axios: Starbucks changes free refill policy (January 27, 2025)', AXIOS],
    ['Business Insider: Starbucks extends free refills to all customers', BI_SBUX],
    ['Tasting Table: the coffee excluded from the Starbucks refill policy', TT_SBUX],
    ['Barista Life: Starbucks refill policy (which drinks qualify)', BL_SBUX],
    ['Nation\'s Restaurant News: Panera\'s Unlimited Sip Club will no longer be unlimited (July 13, 2026)', NRN_SIP],
    ['Restaurant Dive: Panera limits Sip Club to 30 drinks a month', RD_SIP],
    ['Quartz: Panera caps its drink subscription, price unchanged', QZ_SIP]
  ],
  disc: 'We do not earn money from the links on this page and no coffee chain paid to be named.',
  gelezen: GELEZEN, publishAt: '2026-11-20', updatedAt: '2026-11-20'
};

export const DIENST_US2 = [COURSE, BOOTCAMP, COFFEE];
