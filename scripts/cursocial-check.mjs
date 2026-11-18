import test from 'node:test';
import assert from 'node:assert/strict';
import { socialHtml } from '../lib/cursocial.js';
const page = (body, head = '') => '<html><head><link rel="canonical" href="https://curacao.day/nl/fotoroute"><meta property="og:description" content="Twaalf fotoplekken met eigen tips.">' + head + '</head><body><header>Menu</header><main><h1>Fotoroute</h1><p class="s">Twaalf fotoplekken met eigen tips.</p>' + body + '</main><footer>Contact</footer></body></html>';
test('prefers an existing explicit article image; emits one image and one card', () => {
 const h=socialHtml(page('<img src="/beeld/a.jpg" alt="A">','<meta property="og:image" content="https://curacao.day/foto/eigen.jpg"><meta property="og:image" content="https://todayin.email/brand/todayin-curacao-2.png"><meta name="twitter:card" content="summary">'));
 assert.equal((h.match(/property="og:image"/g)||[]).length,1);
 assert.equal((h.match(/name="twitter:card"/g)||[]).length,1);
 assert.match(h,/content="https:\/\/curacao.day\/foto\/eigen.jpg"/);
 assert.match(h,/content="summary_large_image"/);
});
test('takes the actual primary article photo over the brand logo and preserves credit', () => {
 const h=socialHtml(page('<figure><img src="/beeld?u=https%3A%2F%2Fupload.wikimedia.org%2Fphoto.jpg" alt="Handelskade"><figcaption>Charles Hoffman · CC BY-SA 2.0</figcaption></figure><section id="nummers">Hospital phone</section><img src="/foto/footer.jpg">','<meta property="og:image" content="https://todayin.email/brand/todayin-curacao-2.png">'));
 assert.match(h,/og:image" content="https:\/\/curacao.day\/beeld\?u=/);
 assert.match(h,/flipboard-image/);
 assert.match(h,/og:image:alt" content="Handelskade"/);
 assert.match(h,/Charles Hoffman · CC BY-SA 2.0/);
 assert.match(h,/<section id="nummers" class="flipboard-remove">/);
 assert.match(h,/Hospital phone/);
 assert.doesNotMatch(h,/og:image" content="[^"]*footer/);
});
test('does not pass off a footer photo as the image of a question with no image', () => {
 const h=socialHtml(page('<section id="ama">Ask</section><img src="/foto/mural-footer.jpg"><section id="nummers">Contacts</section>','<meta property="og:image" content="https://todayin.email/brand/todayin-curacao-2.png">'));
 assert.doesNotMatch(h,/property="og:image"/);
 assert.match(h,/name="twitter:card" content="summary"/);
});
test('marks actual title / intro and removes chrome only from extraction', () => {
 const h=socialHtml(page('<section class="panel" id="aanmeld">Register</section><aside id="ama">Ask</aside><article>Body</article>'));
 assert.match(h,/<h1 class="flipboard-title">Fotoroute/);
 assert.match(h,/<p class="s flipboard-keep">Twaalf/);
 assert.match(h,/<header class="flipboard-remove">Menu/);
 assert.match(h,/<footer class="flipboard-remove">Contact/);
 assert.match(h,/<section class="panel flipboard-remove" id="aanmeld">Register/);
 assert.match(h,/<article>Body/);
});
test('keeps scripts, styles, canonical, description and language links untouched', () => {
 const script='<script>const x=\'<h1>Fake</h1><meta property="og:image" content="https://test.invalid/inside-script.jpg">\';</script>';
 const style='<style>.x::before{content:"<footer>"}</style>';
 const h=socialHtml(page('<img src="/foto/real.jpg">',script+style+'<link rel="alternate" hreflang="en" href="https://curacao.day/en/photo-spots">'));
 assert.ok(h.includes(script));assert.ok(h.includes(style));
 assert.match(h,/property="og:description" content="Twaalf fotoplekken met eigen tips."/);
 assert.match(h,/hreflang="en" href="https:\/\/curacao.day\/en\/photo-spots"/);
 assert.doesNotMatch(h,/og:image" content="https:\/\/test.invalid\/inside-script.jpg"[^']*<\/head>/);
});
test('rejects logos, icons, SVG and unsafe image URLs', () => {
 for(const u of ['data:image/jpeg;base64,abc','javascript:alert(1)','/cw-vlag.svg','/assets/logo.png','/avatar.jpg']) {
   const h=socialHtml(page('<img src="'+u+'">'));assert.doesNotMatch(h,/property="og:image"/);
 }
});
test('escapes image URLs and alt text', () => {
 const h=socialHtml(page('<img src="/beeld?u=a&amp;size=1280" alt="A &amp; B &quot;foto&quot;">'));
 assert.match(h,/content="https:\/\/curacao.day\/beeld\?u=a&amp;size=1280"/);
 assert.match(h,/og:image:alt" content="A &amp; B &quot;foto&quot;"/);
});
test('normalizing twice has the same result', () => {
 const h=page('<img src="/foto/a.jpg" alt="Foto">');assert.equal(socialHtml(socialHtml(h)),socialHtml(h));
});
test('does not modify non-article and unrelated responses', () => {
 for(const h of [null,42,'<body>No head</body>',page('x').replace('curacao.day','other.example')])assert.equal(socialHtml(h),h);
});

test('prefers the named place photo over unrelated category illustrations above it', () => {
 const h=socialHtml(page('<img src="/foto/categorie-lagun.jpg" alt="Playa Lagun"><img src="/foto/fotoroute-eigen.jpg" alt="Fotoroute"><figcaption>Eigen foto</figcaption>'));
 assert.match(h,/og:image" content="https:\/\/curacao.day\/foto\/fotoroute-eigen.jpg"/);
 assert.doesNotMatch(h,/og:image" content="[^"]*categorie-lagun/);
});
