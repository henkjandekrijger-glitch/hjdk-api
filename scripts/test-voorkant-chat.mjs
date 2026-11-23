import assert from 'node:assert/strict';
import {frontReplyParts,renderFrontChat} from '../lib/voorkant-chat.js';
for(const market of ['nl','us','de']){
 const r=frontReplyParts({a:'Dit is het eerste antwoord. Dit is de volledige extra uitleg. Wat wil je kopen?',vervolg:'Wat heb je nodig? Nog een vraag?',opties:['A','B','C','D']},market);
 assert.equal(r.short,'Dit is het eerste antwoord.');assert.match(r.answer,/volledige extra uitleg/);assert.doesNotMatch(r.answer,/\?/);assert.equal(r.follow,'Wat heb je nodig?');assert.equal(r.options.length,3);
 const html=renderFrontChat(market,['Een cadeau','<script>']);assert.equal((html.match(/id="kx"/g)||[]).length,1);assert.match(html,/id="fc-history" hidden/);assert.match(html,/id="kxa"/);assert.ok(!html.includes('<button type="button"><script>'));assert.ok(!html.includes('/api/mm/proefkies'));assert.ok(!html.includes('onthoud het'));
}
const long='Een heel lang antwoord '+Array(70).fill('met informatie').join(' ')+'.';const c=frontReplyParts({a:long});assert.ok(c.short.length<=150);assert.equal(c.answer,long);assert.match(c.short,/…$/);
const q=frontReplyParts({a:'Wat wil je kiezen?'});assert.equal(q.follow,'Wat wil je kiezen?');assert.equal(q.answer,'');
console.log('Compact gesprek: drie talen, één korte samenvatting, volledige uitleg beschikbaar, één vraag, drie opties, historie en veilige tekst.');
