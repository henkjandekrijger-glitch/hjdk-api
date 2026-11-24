import assert from 'node:assert/strict';
import {frontReplyParts,renderFrontChat} from '../lib/voorkant-chat.js';
for(const market of ['nl','us','de']){
 const r=frontReplyParts({a:'Dit is het eerste antwoord. Dit is de volledige extra uitleg. Wat wil je kopen?',vervolg:'Wat heb je nodig? Nog een vraag?',opties:['A','B','C','D']},market);
 assert.equal(r.short,'Dit is het eerste antwoord.');assert.match(r.answer,/volledige extra uitleg/);assert.match(r.answer,/Wat wil je kopen\?/);assert.equal(r.follow,'Wat heb je nodig?');assert.equal(r.options.length,3);
 const html=renderFrontChat(market,['Een cadeau','<script>']);assert.equal((html.match(/id="kx"/g)||[]).length,1);assert.match(html,/id="fc-history" hidden/);assert.match(html,/id="kxa"/);assert.ok(!html.includes('<button type="button"><script>'));assert.ok(!html.includes('/api/mm/proefkies'));assert.ok(!html.includes('onthoud het'));
}
const long='Een heel lang antwoord '+Array(70).fill('met informatie').join(' ')+'.';const c=frontReplyParts({a:long});assert.equal(c.short,long);assert.equal(c.answer,long);
const q=frontReplyParts({a:'Wat wil je kiezen?'});assert.equal(q.follow,'Wat wil je kiezen?');assert.equal(q.answer,'Wat wil je kiezen?');assert.equal(q.short,'');
console.log('Compact gesprek: drie talen, één korte samenvatting, volledige uitleg beschikbaar, één vraag, drie opties, historie en veilige tekst.');

assert.equal(frontReplyParts({a:'Een antwoord.',vervolg:'Welk type fiets wil je, en hoe lang is je binnenbeen?'}).follow,'Welk type fiets wil je?');

const conditional='Rijd je vooral in de stad? Dan is een stadsfiets handig.';
assert.equal(frontReplyParts({a:conditional,vervolg:'Wat is je lengte?'}).answer,conditional);
assert.equal(frontReplyParts({a:conditional,vervolg:'Wat is je lengte?'}).short,'');
assert.equal(frontReplyParts({a:'Een antwoord.'},'nl','Welke fietsmaat past bij mij?').guide.path,'/fietsmaat');
assert.equal(frontReplyParts({a:'Een antwoord.'},'nl','Cadeau voor mijn partner').guide.path,'/cadeau-vinden');
assert.equal(frontReplyParts({a:'Een antwoord.'},'nl','Geen cadeau').guide,null);
assert.equal(frontReplyParts({a:'Een antwoord.',pad:'/airfryer'},'nl','').guide.path,'/airfryer');

assert.equal(frontReplyParts({a:'Een antwoord.'},'nl','Zijn lelies giftig voor katten?').guide,null);
assert.equal(frontReplyParts({a:'Eine Antwort.'},'de','Ist diese Pflanze giftig?').guide,null);
assert.equal(frontReplyParts({a:'An answer.'},'us','Gifted education').guide,null);
assert.equal(frontReplyParts({a:'An answer.'},'us','Gifts for my partner').guide.path,'/gift-finder');
